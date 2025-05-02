#!/usr/bin/env bash
# cloud-backup.sh - uploads memory snapshots to remote storage (pre-MVP)

set -euo pipefail

SNAPSHOT_DIR="${1:-~/Library/Application Support/mcp-memory/backups}"
REMOTE="s3://my-mcp-backups"

echo "[backup] Syncing $SNAPSHOT_DIR to $REMOTE"
# Placeholder: use aws cli or rclone
# aws s3 sync "$SNAPSHOT_DIR" "$REMOTE"

echo "[backup] Done" 