# Ratatui Dashboard Architecture

## Overview
`ratatui-dashboard` is a standalone Rust crate (part of the workspace) providing a fast TUI for monitoring **lbrxAgents** runtime.  It intentionally lives in its own branch until stabilized and does **not** touch production Node/TS paths.

```
┌────────────┐   .a2a/discovery     ┌───────────────┐
│ Agent List │◄────────────────────│ Agent JSON    │
└────┬───────┘                     └───────────────┘
     │ refresh (r)                     ▲
     │                                 │
┌────▼───────┐ .a2a/orchestrator   ┌───┴────────────┐
│ Orchestr.  │◄────────────────────│ queue.jsonl    │
└────┬───────┘                     └───────────────┘
     │ toggle (Tab/l)                 ▲
     │                                 │
┌────▼───────┐ var/memory_metrics  ┌───┴────────────┐
│ Metrics    │◄────────────────────│ memory JSON    │
└────────────┘ scripts/semgrep     │ semgrep alerts │
                                   └───────────────┘
```

## Modules
| Path | Responsibility |
|------|----------------|
| `services/agents.rs` | scan agent cards |
| `services/orchestrator.rs` | tail orchestrator queue |
| `services/logs.rs` | aggregate recent log lines |
| `services/metrics.rs` | read memory + semgrep alerts |
| `ui/agent_list.rs` | render left list |
| `ui/orchestrator_panel.rs` | right panel (queue) |
| `ui/log_viewer.rs` | right panel (logs) |
| `ui/metrics.rs` | right panel (metrics) |
| `ui/help_overlay.rs` | modal help |
| `app/state.rs` | global `AppState` & actions |

## Key bindings
| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh data |
| `Tab`/`l` | Toggle Logs / Orchestrator |
| `m` | Show Metrics panel |
| `?` | Help overlay |

## Extending the dashboard
1. Add service module under `services/` fetching data.
2. Extend `AppState` with new fields.
3. Create widget in `ui/` for rendering.
4. Add new variant to `RightPanel` and update `main.rs` key-handling.

## Build & Distribution
Workflow `dashboard.yml` builds release binaries for Linux and macOS, uploads artifacts, and publishes checksum list.  `install-dashboard.sh` fetches latest artifact and installs to `/usr/local/bin`.

---
🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)

Developed by:
- [Maciej Gad](https://github.com/szowesgad)
- [Klaudiusz](https://www.github.com/Gitlaudiusz) 