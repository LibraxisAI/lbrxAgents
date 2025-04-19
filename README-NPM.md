# A2A Protocol

A flexible Agent-to-Agent (A2A) communication protocol for AI assistants, agents, and automated systems. This library implements the core concepts of Google's A2A protocol, enabling seamless communication between different agent systems.

## Features

- Agent discovery and capability advertisement
- Asynchronous message passing between agents
- Task delegation and coordination
- Cross-platform agent communication
- Built-in logging and monitoring
- Simple CLI for testing and debugging

## Installation

```bash
npm install a2a-protocol
# or
yarn add a2a-protocol
```

## Quick Start

### Creating an Agent

```javascript
const a2a = require('a2a-protocol');

// Create a new agent
const agent = a2a.createAgent({
  name: 'MyAgent',
  description: 'This agent does amazing things',
  capabilities: ['text_analysis', 'code_review', 'data_processing']
});

console.log(`Agent created with ID: ${agent.id}`);
```

### Discovering Other Agents

```javascript
const agents = agent.discoverAgents();
console.log('Available agents:');
agents.forEach(a => {
  console.log(`- ${a.name} (${a.id})`);
  console.log(`  Capabilities: ${a.capabilities.join(', ')}`);
});
```

### Sending Messages

```javascript
// Send a message to another agent
const targetAgentId = '30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D';
agent.sendMessage(
  targetAgentId,
  { 
    text: 'Hello from another agent',
    data: { 
      some: 'data',
      timestamp: new Date().toISOString()
    }
  },
  'notification' // message type
);
```

### Receiving Messages

```javascript
// Check for new messages
const messages = agent.receiveMessages();
console.log(`Received ${messages.length} messages`);

// Process messages
messages.forEach(message => {
  console.log(`From: ${message.sender_name}`);
  console.log(`Content: ${JSON.stringify(message.content)}`);
  
  // Respond to a message
  if (message.message_type === 'query') {
    agent.respondToMessage(message, {
      text: 'This is my response',
      status: 'complete'
    });
  }
});
```

## CLI Usage

The package includes a command-line interface for easy testing:

```bash
# Initialize the protocol
npx a2a init ~/my-agents-dir

# Create a new agent
npx a2a create-agent "Analysis Agent" "Agent for data analysis" "data_analysis,statistics"

# Discover available agents
npx a2a discover

# Send a message
npx a2a send 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D "Hello from CLI"

# Check messages
npx a2a messages

# Watch for new messages
npx a2a watch

# Inject instructions from a file
npx a2a inject 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D instructions.md
```

## Integration with AI Models

### Running with Claude

```javascript
// claude-integration.js
const a2a = require('a2a-protocol');

// Create agent with UUID from Claude
const agent = a2a.createAgent({
  name: 'ClaudeAgent',
  id: process.env.CLAUDE_UUID || '30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D',
  capabilities: ['nlp', 'text_generation', 'code_analysis']
});

// Process messages and potentially respond
const messages = agent.receiveMessages();
console.log(`Claude received ${messages.length} messages`);
```

### Running with OpenAI Assistants

```javascript
// openai-integration.js
const a2a = require('a2a-protocol');
const { OpenAI } = require('openai');

// Initialize the OpenAI client
const openai = new OpenAI();

// Create agent
const agent = a2a.createAgent({
  name: 'OpenAIAgent',
  capabilities: ['gpt4', 'coding', 'research']
});

// Process messages using OpenAI
async function processMessages() {
  const messages = agent.receiveMessages();
  
  for (const msg of messages) {
    // Process with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {role: "system", content: "You are an agent in a multi-agent system."},
        {role: "user", content: JSON.stringify(msg.content)}
      ]
    });
    
    // Send response
    agent.respondToMessage(msg, {
      text: completion.choices[0].message.content,
      processed_by: 'gpt-4'
    });
  }
}
```

## Advanced Usage

### Custom Message Storage

By default, A2A Protocol uses the filesystem for message storage. You can configure a custom directory:

```javascript
// Configure custom storage location
a2a.configure('/path/to/custom/storage');
```

### Creating Task Agents

```javascript
// task-agent.js
const a2a = require('a2a-protocol');

const agent = a2a.createAgent({
  name: 'TaskAgent',
  capabilities: ['task_execution', 'data_processing']
});

async function executeTask(task) {
  console.log(`Executing task: ${task.type}`);
  // Task implementation here
  return { status: 'success', result: `Task completed at ${new Date()}` };
}

// Main loop
async function run() {
  while (true) {
    const messages = agent.receiveMessages();
    
    for (const msg of messages) {
      if (msg.content.task) {
        const result = await executeTask(msg.content.task);
        agent.respondToMessage(msg, { result });
      }
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

run().catch(console.error);
```

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

MIT