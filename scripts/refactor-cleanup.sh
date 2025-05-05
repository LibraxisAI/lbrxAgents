#!/usr/bin/env bash
# refactor-cleanup.sh — ONE-SHOT hyperscaler-style repo cleanup
# ------------------------------------------------------------
# 1. Creates a new git branch (refactor/clean-<date>)
# 2. Creates a full backup copy (../lbrxAgents_backup_<timestamp>)
# 3. Performs safe removal / move of duplicate & deprecated files
# 4. Logs all operations to SPRZATANIE_LOG.txt
#
# Usage:  bash scripts/refactor-cleanup.sh [--dry-run]
# ------------------------------------------------------------
set -euo pipefail

DRY_RUN=false
if [[ "$*" == *--dry-run* ]]; then
  DRY_RUN=true
  echo "[DRY-RUN] No changes on disk — commands only printed."
fi

# --- Vars ---
REPO_ROOT="$(git rev-parse --show-toplevel)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BRANCH="refactor/clean-${TIMESTAMP}"
BACKUP_DIR="${REPO_ROOT}/../lbrxAgents_backup_${TIMESTAMP}"
LOG_FILE="${REPO_ROOT}/SPRZATANIE_LOG_${TIMESTAMP}.txt"

log() {
  echo "[$(date +%T)] $*" | tee -a "$LOG_FILE"
}

cmd() {
  if $DRY_RUN; then
    log "DRY-RUN: $*"
  else
    log "RUN  : $*"
    eval "$*"
  fi
}

# --- 1. Git branch ---
log "Creating new git branch $BRANCH"
cmd "git checkout -b $BRANCH"

# --- 2. Backup ---
log "Creating rsync backup at $BACKUP_DIR (excludes .git)"
cmd "rsync -a --exclude '.git' --delete --progress \"$REPO_ROOT/\" \"$BACKUP_DIR/\""

# --- 3. Cleanup operations ---
# Duplicate agent-api.js in root → remove (keep src/agent-api.js)
if [[ -f "$REPO_ROOT/agent-api.js" ]]; then
  log "Removing duplicate root agent-api.js (kept in src/)"
  cmd "git rm -f $REPO_ROOT/agent-api.js"
fi

# Remove deprecated scripts
DEPRECATED_SCRIPTS=(
  "scripts/create-agent.sh"
  "scripts/initialize-agent.js"
  "scripts/kill-agent.js"
  "scripts/deep-clean.js"
)
for f in "${DEPRECATED_SCRIPTS[@]}"; do
  if [[ -e "$REPO_ROOT/$f" ]]; then
    log "Removing deprecated $f"
    cmd "git rm -rf $REPO_ROOT/$f"
  fi
done

# Consolidate utils/ into src/utils/ (if top-level utils exists)
if [[ -d "$REPO_ROOT/utils" ]]; then
  log "Moving top-level utils/ into src/utils/"
  cmd "mkdir -p $REPO_ROOT/src/utils"
  cmd "git mv $REPO_ROOT/utils/* $REPO_ROOT/src/utils/"
  cmd "git rm -rf $REPO_ROOT/utils"
fi

# Remove empty directories left behind
log "Removing empty dirs"
cmd "find $REPO_ROOT -type d -empty -not -path '*/.git*' -delete"

# --- 4. Commit & summary ---
log "Git add & commit"
cmd "git add -A"
cmd "git commit -m 'refactor(repo): initial cleanup — remove duplicates, deprecated scripts, utils consolidation'"

log "Cleanup done. Review changes with: git diff main...$BRANCH"
log "Full log written to $LOG_FILE"

if $DRY_RUN; then
  log "DRY-RUN finished — no commits done."
fi 