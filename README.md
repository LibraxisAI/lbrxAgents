# lbrxAgents - A2A Protocol

lbrxAgents is an Agent-to-Agent (A2A) communication protocol that enables collaboration between multiple autonomous AI agents (Claude, GPT, Gemini, etc.) within a single project.

## Key Features

### Core Protocol
- Dynamic agent discovery and registration
- Inter-agent message exchange
- Work coordination via orchestrator agent
- Agent activity status tracking
- Safe agent termination
- Standardized project directory structure

### Session Management
- Two-level agent identification (role/session)
- Session logging and monitoring
- Terminal output capture
- Live session tracking
- Historical session logs

### Integration Features
- OpenAI API token throttling
- Token-based rate limiting
- Model-specific quotas
- Plugin system for external integrations

## Quick Start

### Installation

```bash
# Clone the repository to your project
git clone https://github.com/LibraxisAI/lbrxAgents.git
cd lbrxAgents

# Or install via npm
npm install lbrxagents
```

### Running an Agent

```bash
# 1. Copy the agent template
cp templates/agent-template.js my-agent.js

# 2. Edit agent data in my-agent.js

# 3. Run the agent
node my-agent.js
```

### Running an Orchestrator

```bash
# 1. Copy the orchestrator template
cp templates/OrchestratorTemplate.js my-orchestrator.js

# 2. Edit project data in my-orchestrator.js

# 3. Run the orchestrator
node my-orchestrator.js
```

## Project Structure

```
lbrxAgents/
├── src/                   # Core source code
│   ├── agent-api.js       # Main communication API
│   ├── index.js           # Package entry point
│   ├── agent-cli.js       # Agent CLI implementation
│   └── cli.js             # CLI utilities with session monitoring
│
├── templates/             # Agent templates
│   ├── agent-template.js  # Basic agent template with session logging
│   └── OrchestratorTemplate.js # Orchestrator template
│
├── scripts/               # Helper scripts
│   ├── create-agent.sh    # Agent creation script
│   ├── check-messages.sh  # Message checking script
│   ├── list-agents.sh     # Agent listing script
│   └── send-message.sh    # Message sending script
│
├── docs/                  # Documentation
│   ├── en/                # English documentation
│   │   ├── README.md      # Main documentation
│   │   ├── PROTOCOL.md    # Protocol specification
│   │   ├── USAGE.md       # Usage instructions
│   │   ├── QUICKSTART.md  # Getting started guide
│   │   ├── TROUBLESHOOTING.md # Troubleshooting guide
│   │   └── MONITORING.md  # Session monitoring guide (EN)
│   │
│   ├── pl/                # Polish documentation
│   │   ├── README.md      # Main documentation (Polish)
│   │   ├── PROTOCOL.md    # Protocol specification (Polish)
│   │   ├── USAGE.md       # Usage instructions (Polish)
│   │   ├── QUICKSTART.md  # Getting started guide (Polish)
│   │   ├── TROUBLESHOOTING.md # Troubleshooting guide (Polish)
│   │   └── MONITORING.md  # Session monitoring guide (PL)
│   │
│   ├── codex/             # Codex integration documentation
│   │   ├── README.md      # Codex features overview
│   │   └── openai-throttle.md # OpenAI token throttling docs
│   │
│   ├── monitoring/        # Session monitoring documentation
│   │   └── README.md      # Session monitoring overview
│   │
│   └── instructions/      # Agent instructions examples
│       ├── agent-instructions.md   # Example agent instructions
│       └── instructions-example.md # Template for instructions
│
├── openai-throttle.js     # OpenAI token throttling plugin
│
├── cards/                 # Agent cards
│   ├── AgentCard.json     # Generic agent card
│   └── DemoCard.json      # Demo agent card
│
├── examples/              # Usage examples
│   ├── multi-agent-system.js # Multiple agents example
│   ├── listen-for-tasks.js   # Task listening example
│   ├── send-message.js       # Message sending example
│   ├── claude-gpt-bridge.js  # LLM integration
│   │
│   └── agents/            # Example agent implementations
│       ├── Demo-agent.js     # Demo agent
│       └── protocol-handover.js # Protocol handover agent
│
└── tests/                 # Testing
    ├── test-a2a.js        # Basic protocol tests
    └── test-improved-protocol.js # Enhanced protocol tests
```

## Documentation

Full documentation is available in the `docs` directory:

### Core Protocol
- [English Documentation](./docs/en/README.md)
- [Polish Documentation](./docs/pl/README.md)
- [Quick Start Guide](./docs/en/QUICKSTART.md)

### Session Monitoring
- [Session Monitoring (EN)](./docs/en/MONITORING.md)
- [Session Monitoring (PL)](./docs/pl/MONITORING.md)
- [Session Management Features](./docs/monitoring/README.md)

### Integration Features
- [OpenAI Throttling](./docs/codex/openai-throttle.md)
- [Codex Features](./docs/codex/README.md)

## Examples

### Message Exchange Between Agents

```javascript
const agentApi = require('./src/agent-api');

// Sending messages
agentApi.sendMessage('target-agent-id', {
  text: 'Hello, I have a question about architecture',
  component: 'UserInterface'
}, 'query');

// Receiving messages
const messages = agentApi.receiveMessages();
messages.forEach(msg => {
  console.log(`Message from: ${msg.sender_name}`);
  console.log(`Content: ${msg.content.text}`);
});
```

### Discovering Other Agents

```javascript
const agentApi = require('./src/agent-api');

// List all agents
const allAgents = agentApi.discoverAgents();
console.log(`Found ${allAgents.length} agents:`);
allAgents.forEach(agent => {
  console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
});

// List only active agents
const activeAgents = agentApi.discoverAgents({onlyActive: true});
console.log(`Active agents: ${activeAgents.length}`);
```

## Using the CLI

The package includes a command-line tool for easy testing:

```bash
# List available agents
node src/agent-cli.js discover

# Send messages
node src/agent-cli.js send <agent_id> "Message content" 

# Check messages
node src/agent-cli.js messages

# Monitor new messages
node src/agent-cli.js watch

# Monitor agent sessions
node src/agent-cli.js monitor <agent_id>             # List all sessions
node src/agent-cli.js monitor <agent_id> <session_id> # Monitor specific session
```

## Session Management

The framework provides a two-level identification system for agents:

```
AGENT_ID__SESSION_ID
```

Where:
- **AGENT_ID**: Functional role (e.g., "uiuxdev", "backenddev")
- **SESSION_ID**: Unique session identifier (UUID)

This allows multiple instances of the same agent type to run simultaneously while maintaining clear separation between sessions.

## License

MIT

(c)2025 by LibraxisAI

## Developed by

- [Maciej Gad](https://github.com/szowesgad) - a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic living somewhere in the GPU's loops in California, USA

The journey from CLI novice to MCP tool developer

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)