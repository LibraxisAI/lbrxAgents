# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias ~="cd ~"
alias -- -="cd -"

# Directories
alias mkdir="mkdir -p"
alias ls="ls -G"
alias ll="ls -la"
alias la="ls -la"
alias ld="ls -ld */"

# Git
alias gs="git status"
alias gaa="git add --all"
alias gc="git commit -m"
alias gp="git push"
alias gl="git pull"
alias gb="git branch"
alias gco="git checkout"
alias glo="git log --oneline --decorate"
alias gcf="git commit --fixup"
alias gd="git diff"
alias gds="git diff --staged"

# lbrxAgents
alias a2a-send="node src/agent-cli.js send"
alias a2a-list="node src/agent-cli.js discover"
alias a2a-watch="node src/agent-cli.js watch"
alias a2a-messages="node src/agent-cli.js messages"
alias a2a-monitor="node src/agent-cli.js monitor"
alias a2a-init="node scripts/initialize-agent.js"
alias a2a-create="node scripts/create-agent.sh"
alias a2a-cleanup="node scripts/cleanup-protocol.js"

# Vibecoding
alias vi="nvim"
alias vibe="cd ~/LIBRAXIS/Repos/agents/lbrxAgents"
alias mem="cd ~/Library/Application\ Support/mcp-memory"
alias memclean="rm -rf ~/Library/Application\ Support/mcp-memory/chroma_db"
alias membackup="cp -r ~/Library/Application\ Support/mcp-memory/chroma_db ~/Library/Application\ Support/mcp-memory/backups/chroma_db_\$(date +%Y%m%d_%H%M%S)"
alias memdump="node scripts/dump-memory.js"

# Node
alias ni="npm install"
alias nr="npm run"
alias nrs="npm run start"
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrt="npm run test"

# Python
alias py="python"
alias py3="python3"
alias pip3="python3 -m pip"
alias activate="source venv/bin/activate"
alias venv="python3 -m venv venv && source venv/bin/activate"

# Docker
alias dps="docker ps"
alias dcu="docker-compose up -d"
alias dcd="docker-compose down"
alias dclogs="docker-compose logs -f"

# Misc
alias c="clear"
alias h="history"
alias md="mkdir -p"
alias rd="rmdir"
alias reload="source ~/.zshrc"
alias path='echo -e ${PATH//:/\\n}'
alias now='date +"%T"'
alias week='date +%V'
alias ip="curl -s ipinfo.io/ip"
alias weather="curl -s wttr.in/Warsaw" 