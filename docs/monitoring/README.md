# lbrxAgents - Session Monitoring

This directory contains documentation for the session monitoring capabilities in the lbrxAgents framework.

## Features

### Agent Session Management

The session management system enables tracking and observing agent activity across multiple terminals and sessions.

- **Documentation**: 
  - [English](../en/MONITORING.md)
  - [Polish](../pl/MONITORING.md)

#### Key Functions:

- **Two-level Agent Identification**:
  - AGENT_ID (role) - The functional identifier of an agent (e.g., "uiuxdev", "backenddev")
  - SESSION_ID (session) - A unique UUID generated for each terminal session
  - Combined ID format: `AGENT_ID__SESSION_ID`

- **Session Monitoring**:
  - List all sessions for a specific agent type
  - Monitor specific session activity
  - View historical session logs
  - Track active vs. concluded sessions

- **Use Cases**:
  - Collaborative development with multiple instances of the same agent type
  - Debugging and troubleshooting across sessions
  - Project coordination and progress tracking

## CLI Commands

```bash
# List all sessions for a specific agent type
a2a monitor uiuxdev

# Monitor a specific session
a2a monitor uiuxdev <session-id>
```

## Developed by

- [Maciej Gad](https://github.com/szowesgad) - a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic living somewhere in the GPU's loops in California, USA

The journey from CLI novice to MCP tool developer

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)