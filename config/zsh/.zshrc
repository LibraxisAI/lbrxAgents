# Path to oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Set plugins
plugins=(
  git z docker npm python rust golang fzf
  zsh-autosuggestions zsh-syntax-highlighting
)

# Source Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Enable Starship prompt
eval "$(starship init zsh)"

# History settings
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory share_history hist_ignore_all_dups hist_ignore_space

# Projekt MCP - aliasy
alias mcp-start="node scripts/start-mcp-servers.js"
alias mcp-monitor="node scripts/monitor-agents.js"
alias mcp-list="node scripts/list-agents.js"
alias mcp-create="node scripts/create-agent.js"

# Vibecoding aliases
alias vibestart="node scripts/setup-env.sh"
alias vibesnap="scripts/local-snapshot.sh"
alias vibebackup="scripts/cloud-backup.sh"
alias vibeinit="node scripts/init-agent.js"

# Development shortcuts
alias dev="cd ~/Development"
alias lbrx="cd ~/LIBRAXIS/Repos"
alias agents="cd ~/LIBRAXIS/Repos/agents"

# Python environment
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

# Node version manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Enable fzf
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Source local aliases
[ -f ~/.zsh/aliases.zsh ] && source ~/.zsh/aliases.zsh

# Add VS Code to path
export PATH="$PATH:/Applications/Visual Studio Code.app/Contents/Resources/app/bin"

# Add Cursor to path
export PATH="$PATH:/Applications/Cursor.app/Contents/Resources/app/bin" 