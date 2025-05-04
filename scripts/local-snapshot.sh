#!/bin/bash
# Create a new local snapshot of the project
# This script is designed to be run periodically via launchd

SNAPSHOT_LOG="$HOME/Library/Logs/vibecoding/snapshots.log"
CHROMA_DB_PATH="$HOME/Library/Application Support/mcp-memory/chroma_db"
BACKUP_PATH="$HOME/Library/Application Support/mcp-memory/backups"
PROJECT_DIR=$(pwd)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure log directory exists
mkdir -p "$(dirname "$SNAPSHOT_LOG")"
mkdir -p "$BACKUP_PATH"

# Log function
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "$SNAPSHOT_LOG"
  echo "$1"
}

log "Starting snapshot process..."

# Create a TimeMachine local snapshot if supported
if command -v tmutil &> /dev/null; then
  log "Creating TimeMachine local snapshot..."
  tmutil localsnapshot / 
  
  # Manage snapshots (keep 24 hours worth - 288 snapshots at 5-minute intervals)
  CURRENT_SNAPSHOTS=$(tmutil listlocalsnapshots / | wc -l)
  MAX_SNAPSHOTS=288
  
  if [ $CURRENT_SNAPSHOTS -gt $MAX_SNAPSHOTS ]; then
    SNAPSHOTS_TO_DELETE=$((CURRENT_SNAPSHOTS - MAX_SNAPSHOTS))
    OLDEST_SNAPSHOTS=$(tmutil listlocalsnapshots / | sort | head -n $SNAPSHOTS_TO_DELETE)
    
    for SNAPSHOT in $OLDEST_SNAPSHOTS; do
      log "Deleting old snapshot: $SNAPSHOT"
      tmutil deletelocalsnapshots $SNAPSHOT
    done
  fi
  
  log "TimeMachine snapshot completed."
else
  log "TimeMachine utility not found, skipping system snapshot."
fi

# Backup ChromaDB for MCP memory server
if [ -d "$CHROMA_DB_PATH" ]; then
  log "Backing up ChromaDB..."
  BACKUP_FILE="$BACKUP_PATH/chroma_db_$TIMESTAMP.tar.gz"
  
  # Create backup
  tar -czf "$BACKUP_FILE" -C "$(dirname "$CHROMA_DB_PATH")" "$(basename "$CHROMA_DB_PATH")"
  
  # Verify backup
  if [ -f "$BACKUP_FILE" ]; then
    log "ChromaDB backup created: $BACKUP_FILE"
    
    # Manage backups (keep latest 10)
    BACKUPS=($(ls -t "$BACKUP_PATH"/chroma_db_*.tar.gz 2>/dev/null))
    if [ ${#BACKUPS[@]} -gt 10 ]; then
      for ((i=10; i<${#BACKUPS[@]}; i++)); do
        log "Removing old backup: ${BACKUPS[$i]}"
        rm "${BACKUPS[$i]}"
      done
    fi
  else
    log "ERROR: ChromaDB backup failed!"
  fi
else
  log "WARNING: ChromaDB directory not found at $CHROMA_DB_PATH, skipping backup."
fi

# Export agents and their status
if [ -d "$PROJECT_DIR/.a2a" ]; then
  log "Exporting agent information..."
  AGENTS_BACKUP="$BACKUP_PATH/agents_$TIMESTAMP.json"
  
  # Create a list of active agents
  if command -v node &> /dev/null; then
    node "$PROJECT_DIR/src/agent-cli.js" discover --json > "$AGENTS_BACKUP"
    log "Agent information saved to $AGENTS_BACKUP"
  else
    log "WARNING: Node.js not found, skipping agent export."
  fi
else
  log "WARNING: A2A directory not found, skipping agent export."
fi

# Generate project structure tree
if command -v find &> /dev/null; then
  log "Generating project structure..."
  TREE_FILE="$BACKUP_PATH/tree_$TIMESTAMP.txt"
  
  # Generate project tree excluding node_modules, .git, etc.
  if [ -d "$PROJECT_DIR" ]; then
    find "$PROJECT_DIR" -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | sort > "$TREE_FILE"
    log "Project structure saved to $TREE_FILE"
  else
    log "WARNING: Project directory not found, skipping structure export."
  fi
else
  log "WARNING: 'find' command not available, skipping project structure."
fi

log "Snapshot process completed." 