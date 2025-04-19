# Monitoring Agent Sessions in lbrxAgents

The lbrxAgents framework now includes powerful session monitoring capabilities that allow you to track and observe agent activity across multiple terminals and sessions.

## Two-level Agent Identification

Each agent in the system has a two-part identifier:

1. **AGENT_ID** (role) - The functional identifier of an agent (e.g., "uiuxdev", "backenddev")
2. **SESSION_ID** (session) - A unique UUID generated for each terminal session
3. **Combined ID** - `AGENT_ID__SESSION_ID`

This architecture allows for:
- Multiple instances of the same agent type running concurrently
- Each session taking responsibility for its own work
- Seamless handover between sessions
- Complete session monitoring

## Monitoring Sessions

The CLI includes a new command for monitoring agent sessions:

```bash
# List all sessions for a specific agent type
a2a monitor uiuxdev

# Monitor a specific session
a2a monitor uiuxdev <session-id>
```

### Features

- **Session Discovery** - Find all sessions for a specific agent role
- **Session Status** - See which sessions are active or concluded
- **Log Access** - View logs from both active and completed sessions
- **Live Monitoring** - Watch the terminal output of active sessions in real-time
- **Historical Records** - Review logs from sessions that have already ended

## How It Works

Each agent session automatically logs all console output to a dedicated log file stored in the framework's data directory. The log files follow the naming convention `AGENT_ID__SESSION_ID.log`.

When you monitor a session:
1. For active sessions, you get a live stream of the agent's terminal output
2. For completed sessions, you can review the logs from when the agent was running

## Use Cases

### Collaborative Development

Multiple developers working on the same aspect of the project can:
- Run their own instances of the same agent type (e.g., "uiuxdev")
- Monitor each other's progress in real-time
- Pick up where others left off if needed

### Debugging and Troubleshooting

When an agent experiences issues:
- Check logs even after the session has ended
- Identify when and where problems occurred
- Compare logs between different sessions 

### Coordination

Team managers or orchestrators can:
- Monitor the progress of multiple agent sessions
- Identify which agents are active
- Review completed work from previous sessions

## Logs Directory Structure

All logs are stored in the framework's data directory under the `logs` subdirectory:

```
lbrxAgents/.a2a/logs/
├── uiuxdev__6D394CD3-AFD6-4EF8-8AE8-9EFA4E08EF93.log
├── uiuxdev__8F23A719-C05F-4B2A-AE51-27BC14E9AF12.log
├── backenddev__A7C2E935-88F7-4DB1-9081-56BAD0945D8F.log
└── ...
```

Sessions are logged automatically, with entries for every console.log, console.error, and console.warn call, as well as session start and end markers.