# VibeX Blueprint – RAM-punk Vibecoding Environment

> **Status:** Draft v0.1 (bootstrap)

## Cel
Zbudować eksperymentalne środowisko *Agentic AI Vibecoding* zoptymalizowane pod Apple Silicon (od 12 GB RAM do 512 GB RAM), które stanie się sercem projektu **lbrxAgents**. Nie komercjalizacja – czysta radość z łamania ograniczeń.

## Filary
1. **RamLake** – współdzielona przestrzeń `mmap` + PubSub w RAM.
2. **Multi-Agent Mesh** – agenty dev / review / test / watcher z IPC via unix socket.
3. **In-Memory Embeddings** – Chroma/Qdrant in-mem, sliding-shards.
4. **Snapshot & Rewind** – APFS/ZFS snapshot co 2 min (laptop) / 30 s (Dragon).
5. **Dynamic Profiles** – CLI przełącza limity RAM/GPU zależnie od maszyny.

## High-Level Tree (to be scaffolded)
```
lbrxAgents/
├─ src/
│  ├─ vibex-core/           # RamLake, Bus, SnapshotMgr (Rust/Python)
│  ├─ agents/
│  │   └─ vibex/            # Orchestrator, DevAgent, ReviewAgent, …
│  └─ utils/                # semgrep-scanner, tree-monitor
├─ vibex-cli/               # `vibex run`, `vibex status`, …
├─ memory-bank/             # Markdown knowledge base
├─ scripts/                 # start-vibex-dev.sh, start-vibex-dragon.sh
├─ config/                  # mcp-servers.json, cursor/, zsh/
└─ docs/architecture/       # ← tu jesteś
```

## Minimalny MVP
- **scripts/start-vibex-dev.sh** – uruchamia RamLake z limitem 12 GB.
- **src/vibex-core/ram_lake.rs** – placeholder inicjalizacji `mmap`.
- **src/agents/vibex/orchestrator.js** – echo-orchestrator (proof of life).

## Kolejne kroki
1. **Scaffold CLI** (`cargo new vibex-cli` lub `npx oclif`).
2. Integracja **Sequential-Thinking MCP** jako planista.
3. Podłączenie **Cursor** (Claude) → kanał `codegen` w Busie.
4. Automatyczny **Semgrep in-mem** na diff.
5. Synchronizacja **Dragon ⇄ Laptopy** przez `ram-mirror`.

–––
*(Rozwijaj ten blueprint w miarę postępów; commituj z tagiem `docs(blueprint): … (c) M&K`)* 