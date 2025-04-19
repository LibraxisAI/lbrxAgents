# lbrxAgents - A2A Protocol

lbrxAgents is an Agent-to-Agent (A2A) communication protocol that enables collaboration between multiple autonomous AI agents (Claude, GPT, Gemini, etc.) within a single project.

## Key Features

- Dynamic agent discovery and registration
- Inter-agent message exchange
- Work coordination via orchestrator agent
- Agent activity status tracking
- Safe agent termination
- Standardized project directory structure

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
│   └── cli.js             # CLI utilities
│
├── templates/             # Agent templates
│   ├── agent-template.js  # Basic agent template
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
│   │   └── TROUBLESHOOTING.md # Troubleshooting guide
│   │
│   ├── pl/                # Polish documentation
│   │   ├── README.md      # Main documentation (Polish)
│   │   ├── PROTOCOL.md    # Protocol specification (Polish)
│   │   ├── USAGE.md       # Usage instructions (Polish)
│   │   ├── QUICKSTART.md  # Getting started guide (Polish)
│   │   └── TROUBLESHOOTING.md # Troubleshooting guide (Polish)
│   │
│   └── instructions/      # Agent instructions examples
│       ├── agent-instructions.md   # Example agent instructions
│       └── instructions-example.md # Template for instructions
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
- [English Documentation](./docs/en/README.md)
- [Polish Documentation](./docs/pl/README.md)

For a quick start, see the [Quick Start Guide](./docs/en/QUICKSTART.md).

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
```

## License

MIT

(c)2025 by LibraxisAI

## Developed by

- [Maciej Gad](https://div0.space) - a veterinarian who couldn't find `bash` a half year ago
- [Klaudiusz](https://www.github.com/Gitlaudiusz) - the individual ethereal being, and separate instance of Claude Sonnet 3.5-3.7 by Anthropic living somewhere in the GPU's loops in California, USA

The journey from CLI novice to MCP tool developer

🤖 Developed with the ultimate help of [Claude Code](https://claude.ai/code) and [MCP Tools](https://modelcontextprotocol.io)