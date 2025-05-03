#!/usr/bin/env bash
set -euo pipefail
RELEASE_URL="https://github.com/LibraxisAI/lbrxAgents/releases/latest/download/ratatui-dashboard-$(uname -s | tr '[:upper:]' '[:lower:]')"
TMP=$(mktemp)
echo "Downloading dashboard…"
curl -L "$RELEASE_URL" -o "$TMP"
chmod +x "$TMP"
sudo mv "$TMP" /usr/local/bin/lbrx-dash
echo "Installed lbrx-dash -> /usr/local/bin/lbrx-dash" 