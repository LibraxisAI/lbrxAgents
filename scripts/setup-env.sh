#!/bin/bash
# Set up Ultimate AI Developer Environment for macOS
# Designed for Vibecoding with lbrxAgents

echo "🚀 Setting up Ultimate AI Developer Environment..."
echo "----------------------------------------------------"

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p ~/Library/Application\ Support/mcp-memory/{chroma_db,backups}
mkdir -p ~/Library/Logs/vibecoding
mkdir -p ~/.cursor/config

# Install Homebrew if not already installed
if ! command -v brew &> /dev/null; then
  echo "🍺 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Update Homebrew
echo "🔄 Updating Homebrew..."
brew update

# Install essential tools
echo "🛠️ Installing essential tools..."
brew install --cask warp cursor
brew install starship fzf ripgrep fd bat exa tree jq yq httpie gh git-delta
brew install pyenv pyenv-virtualenv node nvm

# Install Python tools
echo "🐍 Installing Python tools..."
brew install python@3.11
pip3 install pipx
pipx ensurepath
pipx install semgrep-mcp
pipx install mcp_memory_service

# Install Oh My Zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
  echo "💻 Installing Oh My Zsh..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# Install ZSH plugins
echo "🔌 Installing ZSH plugins..."
ZSH_CUSTOM=${ZSH_CUSTOM:-~/.oh-my-zsh/custom}
if [ ! -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
  git clone https://github.com/zsh-users/zsh-autosuggestions $ZSH_CUSTOM/plugins/zsh-autosuggestions
fi
if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
  git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting
fi

# Install Starship prompt
echo "🚢 Installing Starship prompt..."
curl -sS https://starship.rs/install.sh | sh -s -- -y

# Copy configuration files
echo "📋 Setting up configuration files..."

# ZSH configuration
mkdir -p ~/.zsh
cp config/zsh/.zshrc ~/.zshrc
cp config/zsh/aliases.zsh ~/.zsh/aliases.zsh
cp config/starship.toml ~/.config/starship.toml

# Cursor configuration
mkdir -p ~/.cursor
cp config/cursor/settings.json ~/.cursor/settings.json
cp config/cursor/keybindings.json ~/.cursor/keybindings.json

# Create MCP servers config
echo "🧩 Setting up MCP servers..."
cp config/mcp-servers.json ~/.claude.json

# Add a marker as a reminder to reload shell
touch ~/.reload_shell_needed

# Make scripts executable
echo "🔐 Making scripts executable..."
find scripts -type f -name "*.sh" -exec chmod +x {} \;

# Create launchd job for automatic snapshots
echo "📸 Setting up automatic snapshots..."
cat > ~/Library/LaunchAgents/com.dev.local-snapshot.plist << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dev.local-snapshot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PWD}/scripts/local-snapshot.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
</dict>
</plist>
EOL

# Load the launchd job if it's not already loaded
launchctl list | grep -q com.dev.local-snapshot || launchctl load ~/Library/LaunchAgents/com.dev.local-snapshot.plist

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Ensure Rust toolchain for dashboard
if ! command -v cargo &>/dev/null; then
  echo "[setup-env] Installing Rust toolchain via rustup…"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
fi

echo "----------------------------------------------------"
echo "✅ Ultimate AI Developer Environment setup completed!"
echo "🔄 Please restart your terminal or run 'source ~/.zshrc' to apply changes."
echo "🚀 You're ready to start Vibecoding!"
echo "----------------------------------------------------" 