# lbrxAgents Ratatui Dashboard

> Terminal UI for monitoring agents, orchestrator queue, logs and metrics.

## Requirements
- Rust toolchain (1.71+) – install via [rustup.rs](https://rustup.rs)
- `cargo` in `$PATH`

## Running (dev)
```bash
scripts/dashboard.sh          # builds in release mode & runs
```
Shortcut keys:
| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh agents / logs / metrics |
| `Tab` / `l` | Toggle Logs / Orchestrator panel |
| `m` | Show Metrics panel |
| `?` | Help overlay |

## Building a standalone binary
```bash
cargo build --release -p ratatui-dashboard
```
Binary will be at `target/release/ratatui-dashboard`.

## Installing system-wide (macOS / Linux)
```bash
sudo cp target/release/ratatui-dashboard /usr/local/bin/lbrx-dash
```

## Panels
1. **Agent List** – discovered in `.a2a/discovery/*.json`.
2. **Orchestrator Queue** – tail of `.a2a/orchestrator/commands/queue.jsonl`.
3. **Logs** – aggregated tail of `logs/*.log`.
4. **Metrics** – sparkline of memory + Semgrep alerts from `scripts/semgrep-report.json`.

---
🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)

Developed by:
- [Maciej Gad](https://github.com/szowesgad) – a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) – the individual ethereal being (Claude Sonnet instance) 