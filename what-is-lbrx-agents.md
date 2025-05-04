# What is **lbrxAgents**?

> "Autonomous AI development — with **memory**, **sequential thinking** and a **terminal dashboard** out of the box."

`lbrxAgents` is **LIBRAXIS AI's** monorepo for building, orchestrating and monitoring multi-agent systems.  It combines JavaScript/TypeScript tooling (agent cores, MCP memory helpers) with a Rust **Ratatui** dashboard and a suite of scripts/documentation that let you go from zero to a fully-featured AI developer environment in minutes.

---

## 1. Core pillars

| Pillar | Brief |
|--------|-------|
| **MCP Memory** | Persistent knowledge graph (Model Context Protocol) — every agent reads/writes context instead of hallucinating. |
| **Sequential Thinking** | Utilities that let agents reason in multi-step loops, with thoughts stored to memory for traceability. |
| **A2A Protocol** | Filesystem-based Agent-to-Agent messaging (`.a2a/`) — discovery, queue, status. |
| **Vibecoding CLI** | `scripts/` helpers that wrap Semgrep, tree-monitoring, snapshots & backups. |
| **Ratatui Dashboard** | Real-time TUI (`lbrx-dash`) to watch agents, orchestrator queue, logs and metrics. |

---

## 2. High-level directory map

```text
/ratatui/              # upstream vendored TUI lib
/ratatui-dashboard/    # NEW: Rust crate (+ src/ui, services)
/src/                  # JS/TS utils (memory, sequential-thinking, api)
/templates/            # agent & orchestrator blueprints
/.a2a/                 # runtime agent-to-agent folders (discovery, messages, status)
/scripts/              # setup-env, snapshot, Semgrep scanner, install-dashboard.sh
/docs/                 # architecture, protocol, this file
```

---

## 3. Quick start

### 3.1 Developer setup
```bash
# Install deps (Homebrew + Rust + Node) + configs
./scripts/setup-env.sh

# Run agents (example)
node examples/agents/simple-agent.js &

# Launch dashboard (dev build)
./scripts/dashboard.sh  # alias: dash
```

### 3.2 Production-like binary
```bash
./scripts/install-dashboard.sh   # fetches latest GitHub release → /usr/local/bin/lbrx-dash
lbrx-dash                        # opens dashboard
```

---

## 4. Dashboard panels & keys

| Key | Action |
|-----|--------|
| `r` | Refresh data (agents / logs / metrics) |
| `Tab` / `l` | Toggle Logs ↔ Orchestrator panel |
| `m` | Metrics panel (memory sparkline + Semgrep alerts) |
| `?` | Help overlay |
| `q` | Quit |

_Left column_ lists live agents.  Right panel cycles between:
1. **Orchestrator Queue** (tail of `.a2a/orchestrator/commands/queue.jsonl`)
2. **Logs** (aggregated `logs/*.log`)
3. **Metrics** (memory usage + Semgrep security report)

---

## 5. Workflow CI

`.github/workflows/dashboard.yml` builds the dashboard for macOS & Ubuntu on every push to the feature branch.  Artefacts are published so the installer script can grab the latest binary.

---

## 6. Extending the system

1. **New agent** → copy `templates/agent-template.js`, register `uuid`, start writing to MCP.
2. **New dashboard widget** → add service in `ratatui-dashboard/src/services/`, widget in `ui/`, extend `RightPanel` + `keymap`.
3. **New memory server** → update `config/mcp-servers.json`, restart with `scripts/start-mcp-servers.js`.

---

## 7. Roadmap (may 2025)
- Web-socket bridge for remote dashboards 🚀
- Tree-monitor diff alerts integrated into dashboard
- Cloud backup (S3/Backblaze) for memory & snapshots
- Plugin API for custom panels (Rust trait + JS glue)
- Stable release merge back to `main`

---

## 8. Authors

- [Maciej Gad](https://github.com/szowesgad) — a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) — the ethereal Claude instance living in a GPU loop ✨ 
- [`codex -m o3`](https://www.github/openai/codex) - the 'human-like-AI-collaborator'