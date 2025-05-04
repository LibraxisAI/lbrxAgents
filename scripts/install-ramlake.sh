#!/usr/bin/env bash
# install_ramlake_on_dragon.sh
# One-shot bootstrap for MCP Memory Server on "Dragon" (macOS / Apple Silicon)
# - Installs service under /opt/ramlake
# - Uses Python 3.12 (already present)
# - Runs server on port 80000 (change via PORT env)
# - Stores data on tmpfs so it lives purely in RAM
#
# Usage:
#   chmod +x install_ramlake_on_dragon.sh
#   sudo ./install_ramlake_on_dragon.sh   # asks sudo once for tmpfs + systemd

set -euo pipefail
PORT="${PORT:-80000}"
SIZE_GB="${SIZE_GB:-64}"
BASE="/opt/ramlake"
# --- security token & helper dir ---
API_TOKEN="${MCP_API_TOKEN:-$(openssl rand -hex 16)}"
SCRIPTS_DIR="$BASE/scripts"
DATA_DIR="$BASE/data"
VENV_DIR="$BASE/venv"
REPO_DIR="$BASE/mcp-memory-service"
SERVICE_FILE="/Library/LaunchDaemons/com.ramlake.memory.plist"

# 1. Create base dirs
sudo mkdir -p "$BASE"

# 2. Mount tmpfs (RAM disk) for data if not already
if ! mount | grep -q "$DATA_DIR"; then
  echo "➡️  Mounting tmpfs ($SIZE_GB GB) at $DATA_DIR (requires sudo)"
  sudo mkdir -p "$DATA_DIR"
  sudo mount -t tmpfs -o size="${SIZE_GB}g" tmpfs "$DATA_DIR"
fi
mkdir -p "$DATA_DIR/chroma_db" "$DATA_DIR/backups"
# ensure helper scripts dir exists
mkdir -p "$SCRIPTS_DIR"
# persistent backups location
sudo mkdir -p "/opt/ramlake/backups_persist"

# 3. Clone repo if needed
if [ ! -d "$REPO_DIR" ]; then
  echo "➡️  Cloning mcp-memory-service…"
  sudo git clone https://github.com/doobidoo/mcp-memory-service.git "$REPO_DIR"
fi

# 4. Python venv + deps
if [ ! -d "$VENV_DIR" ]; then
  echo "➡️  Creating venv at $VENV_DIR"
  python3.12 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -e "$REPO_DIR" chromadb sentence-transformers

deactivate

# 5. Create launchd (macOS) plist for auto-restart
cat <<PLIST | sudo tee "$SERVICE_FILE" >/dev/null
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ramlake.memory</string>
  <key>ProgramArguments</key>
  <array>
    <string>$VENV_DIR/bin/python</string>
    <string>-m</string>
    <string>mcp_memory_service</string>
    <string>--host</string><string>0.0.0.0</string>
    <string>--port</string><string>$PORT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>MCP_MEMORY_CHROMA_PATH</key><string>$DATA_DIR/chroma_db</string>
    <key>MCP_MEMORY_BACKUPS_PATH</key><string>$DATA_DIR/backups</string>
    <key>MCP_API_TOKEN</key><string>$API_TOKEN</string>
    <key>DEVICE</key><string>mps</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$BASE/ramlake.out.log</string>
  <key>StandardErrorPath</key><string>$BASE/ramlake.err.log</string>
</dict>
</plist>
PLIST

# 6. Load (or reload) service
if sudo launchctl list | grep -q com.ramlake.memory; then
  echo "➡️  Reloading RamLake service"
  sudo launchctl unload "$SERVICE_FILE"
fi
sudo launchctl load "$SERVICE_FILE"

echo "✅ RamLake Memory Server running on port $PORT (data in RAM, $SIZE_GB GB)"
echo "   Health → http://$(hostname -I | awk '{print $1}'):$PORT/health"

# 7. Create helper scripts (backup & health)
cat <<'BACKUP' | sudo tee "$SCRIPTS_DIR/backup_memory.sh" >/dev/null
#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-$PORT}"
API_TOKEN="${MCP_API_TOKEN:-$API_TOKEN}"
DEST="/opt/ramlake/backups_persist"
mkdir -p "$DEST"
TS="$(date '+%Y-%m-%d_%H-%M-%S')"
OUT="$DEST/memory_${TS}.json.gz"

# export & compress on the fly (~70-80% smaller)
curl -sS ${API_TOKEN:+-H "Authorization: Bearer $API_TOKEN"} "http://localhost:${PORT}/graph/export" | gzip -9 > "$OUT"
BACKUP
sudo chmod +x "$SCRIPTS_DIR/backup_memory.sh"

cat <<'HEALTH' | sudo tee "$SCRIPTS_DIR/health_check.sh" >/dev/null
#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-$PORT}"
if ! curl -s --fail "http://localhost:${PORT}/health" >/dev/null; then
  echo "$(date) – RamLake unhealthy, restarting" >> /opt/ramlake/health.log
  sudo launchctl kickstart -k system/com.ramlake.memory
fi
HEALTH
sudo chmod +x "$SCRIPTS_DIR/health_check.sh"

# 8. launchd jobs for backup & health
BACKUP_PLIST="/Library/LaunchDaemons/com.ramlake.backup.plist"
cat <<PLIST | sudo tee "$BACKUP_PLIST" >/dev/null
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ramlake.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>$SCRIPTS_DIR/backup_memory.sh</string>
  </array>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
PLIST
sudo launchctl load -w "$BACKUP_PLIST"

HEALTH_PLIST="/Library/LaunchDaemons/com.ramlake.health.plist"
cat <<PLIST | sudo tee "$HEALTH_PLIST" >/dev/null
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ramlake.health</string>
  <key>ProgramArguments</key>
  <array>
    <string>$SCRIPTS_DIR/health_check.sh</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
PLIST
sudo launchctl load -w "$HEALTH_PLIST" 