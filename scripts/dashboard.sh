#!/usr/bin/env bash
# dashboard.sh - run ratatui dashboard (dev helper)
set -euo pipefail

cd "$(dirname "$0")/.."

if command -v cargo >/dev/null 2>&1; then
  cargo run -p ratatui-dashboard --quiet --release "$@"
else
  echo "cargo not found. Please install Rust toolchain." >&2
  exit 1
fi 