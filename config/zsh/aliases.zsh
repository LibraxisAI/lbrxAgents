# Navigation
# Skróty do szybkiej nawigacji po katalogach ("cd" = zmień katalog):
#   `..`  – wróć o jeden poziom w górę
#   `...` – dwa poziomy w górę
#   `....` – trzy poziomy w górę
#   `~`   – przejdź do katalogu domowego
#   `-`   – wróć do poprzedniego katalogu
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias ~="cd ~"
alias -- -="cd -"

# Directories
# Przydatne aliasy do pracy z katalogami i listowania plików:
#   `mkdir -p` – utwórz katalog wraz z brakującymi rodzicami
#   `ls` / `ll` / `la` – kolorowe listowanie; `ll` i `la` pokazują ukryte pliki
#   `ld` – pokazuje tylko katalogi (bez plików)
alias mkdir="mkdir -p"
alias ls="ls -G"
alias ll="ls -la"
alias la="ls -la"
alias ld="ls -ld */"

# Git
# Najpopularniejsze skróty do Gita:
#   `gs`  – git status
#   `gaa` – git add --all (dodaj wszystko)
#   `gc`  – git commit -m "…"
#   `gp`  – git push (wyślij zmiany)
#   `gl`  – git pull (pobierz zmiany)
#   `gb`  – git branch (lista gałęzi)
#   `gco` – git checkout (przełącz gałąź)
#   `glo` – git log --oneline (historia w 1 linii)
#   `gcf` – git commit --fixup (commit naprawczy)
#   `gd`  – git diff (porównaj zmiany)
#   `gds` – git diff --staged (porównaj dodane do commita)
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
# Obsługa protokołu A2A w projekcie lbrxAgents:
#   `a2a-send`    – wyślij wiadomość do innego agenta
#   `a2a-list`    – pokaż dostępnych agentów (discover)
#   `a2a-watch`   – podglądaj przychodzące wiadomości na żywo
#   `a2a-messages`– historia wiadomości
#   `a2a-monitor` – monitorowanie agentów
#   `a2a-init`    – inicjalizuj nowego agenta
alias a2a-send="node src/agent-cli.js send"
alias a2a-list="node src/agent-cli.js discover"
alias a2a-watch="node src/agent-cli.js watch"
alias a2a-messages="node src/agent-cli.js messages"
alias a2a-monitor="node src/agent-cli.js monitor"
alias a2a-init="node scripts/initialize-agent.js"
alias a2a-create="node scripts/create-agent.sh"
alias a2a-cleanup="node scripts/cleanup-protocol.js"

# Vibecoding
# Szybkie wejście w "vibe" kodowania:
#   `vi`   – uruchom Neovim
#   `vibe` – cd do katalogu projektu lbrxAgents
#   `mem`* – operacje na bazie MCP-Memory: czyszczenie, backup, dump
alias vi="nvim"
alias vibe="cd ~/LIBRAXIS/Repos/agents/lbrxAgents"
alias mem="cd ~/Library/Application\ Support/mcp-memory"
alias memclean="rm -rf ~/Library/Application\ Support/mcp-memory/chroma_db"
alias membackup="cp -r ~/Library/Application\ Support/mcp-memory/chroma_db ~/Library/Application\ Support/mcp-memory/backups/chroma_db_\$(date +%Y%m%d_%H%M%S)"
alias memdump="node scripts/dump-memory.js"

# Node
# Skróty do NPM i uruchamiania skryptów Node:
#   `ni`  – npm install (instaluj zależności)
#   `nr`  – npm run (uruchom skrypt)
#   `nrs` – npm run start
#   `nrd` – npm run dev
#   `nrb` – npm run build
#   `nrt` – npm run test
alias ni="npm install"
alias nr="npm run"
alias nrs="npm run start"
alias nrd="npm run dev"
alias nrb="npm run build"
alias nrt="npm run test"

# Python
# Praca z Pythonem i wirtualnymi środowiskami:
#   `venv`      – utwórz nowe venv i aktywuj
#   `activate`  – aktywuj istniejące venv
#   `py`, `py3`, `pip3` – wywołania Pythona i pip3
alias py="python"
alias py3="python3"
alias pip3="python3 -m pip"
alias activate="source venv/bin/activate"
alias venv="python3 -m venv venv && source venv/bin/activate"

# Docker
# Kontenery docker-compose:
#   `dps`    – lista działających kontenerów
#   `dcu`    – docker-compose up -d (uruchom w tle)
#   `dcd`    – docker-compose down (zatrzymaj)
#   `dclogs` – podgląd logów
alias dps="docker ps"
alias dcu="docker-compose up -d"
alias dcd="docker-compose down"
alias dclogs="docker-compose logs -f"

# Misc
# Przydatne drobiazgi:
#   `c`      – wyczyść terminal
#   `reload` – przeładuj ~/.zshrc
#   `now`    – pokaż bieżącą godzinę
#   `week`   – numer tygodnia
#   `ip`     – Twój publiczny adres IP
#   `weather`– szybka prognoza pogody dla Warszawy
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