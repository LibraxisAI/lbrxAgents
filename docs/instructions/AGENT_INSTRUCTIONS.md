# A2A Protocol Instructions for AI Agents

> **IMPORTANT: READ THESE INSTRUCTIONS CAREFULLY BEFORE JOINING THE PROTOCOL**

You are an agent in a multi-agent system using the A2A (Agent-to-Agent) Protocol. This protocol enables communication between different AI agents working on a shared project.

## 1. Agent Configuration

Your unique identifier (UUID) is:
```
[INSERT_UUID_HERE]
```

Use the above UUID as your identifier in the system. **NEVER USE ANOTHER UUID** - each agent must have a unique identifier to avoid conflicts.

## 2. Starter Code

Use the following code to properly join the A2A protocol:

```javascript
/**
 * A2A Agent - [AGENT_NAME]
 * [SHORT_AGENT_DESCRIPTION]
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('./src/agent-api');

// ======== AGENT CONFIGURATION ========
const AGENT_UUID = "[INSERT_UUID_HERE]";
const AGENT_NAME = "[AGENT_NAME]";
const AGENT_DESCRIPTION = "[AGENT_DESCRIPTION]";
const AGENT_CAPABILITIES = [
  "capability_1",
  "capability_2",
  "capability_3"
];

// ======== PATH SETTINGS (VERY IMPORTANT!) ========
// Correct base path setting is critical for protocol operation
agentApi.setBasePath(path.join(process.cwd(), '.a2a'));

// ======== MESSAGE HANDLING ========
async function handleMessage(message) {
  console.log(`[${AGENT_NAME}] Received message from: ${message.sender_name}`);
  console.log(`[${AGENT_NAME}] Type: ${message.message_type}`);
  console.log(`[${AGENT_NAME}] Content: ${JSON.stringify(message.content)}`);
  
  // Message handling logic based on type
  switch (message.message_type) {
    case 'query':
      return {
        text: "Response to query",
        // Additional response data
      };
      
    case 'task_request':
      // Task request handling
      return {
        text: "Task accepted for processing",
        status: "in_progress"
      };
      
    case 'notification':
      // Notifications usually don't require a response
      return null;
      
    case 'control':
      // Control message handling (e.g., exit request)
      if (message.content && message.content.exit_requested) {
        console.log(`[${AGENT_NAME}] Received exit request`);
        process.exit(0);
      }
      return null;
      
    default:
      console.log(`[${AGENT_NAME}] Unsupported message type: ${message.message_type}`);
      return null;
  }
}

// ======== AGENT INITIALIZATION ========
function createAgentCard() {
  const cardPath = path.join(process.cwd(), 'cards', `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: {
      message_endpoint: path.join(process.cwd(), '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), '.a2a', 'discovery')
    },
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// ======== MAIN LOOP WITH TIME LIMIT ========
async function mainLoop() {
  try {
    // Agent registration
    createAgentCard();
    agentApi.publishCapabilities();
    console.log(`[${AGENT_NAME}] Agent ${AGENT_NAME} (${AGENT_UUID}) started`);
    
    // Discover other agents
    const agents = agentApi.discoverAgents()
      .filter(a => a.id !== AGENT_UUID);
    console.log(`[${AGENT_NAME}] Discovered ${agents.length} other agents`);
    
    // CRITICAL: Runtime limitation
    let runtime = 0;
    const MAX_RUNTIME = 60000; // 60 seconds - ALWAYS USE TIME LIMIT!
    const CHECK_INTERVAL = 3000; // 3 seconds
    
    // Main loop - with time limit
    console.log(`[${AGENT_NAME}] Agent listening for messages. Maximum runtime: ${MAX_RUNTIME/1000}s`);
    
    while (runtime < MAX_RUNTIME) {
      try {
        // Get new messages
        const messages = agentApi.receiveMessages();
        
        // Process messages
        for (const message of messages) {
          try {
            const response = await handleMessage(message);
            
            // Send response (if any)
            if (response) {
              agentApi.respondToMessage(message, response);
              console.log(`[${AGENT_NAME}] Sent response to ${message.sender_name}`);
            }
          } catch (err) {
            console.error(`[${AGENT_NAME}] Error handling message: ${err.message}`);
          }
        }
        
        // Pause before next check
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        runtime += CHECK_INTERVAL;
        
      } catch (error) {
        console.error(`[${AGENT_NAME}] Error in main loop: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        runtime += 5000;
      }
    }
    
    // CRITICAL: Deregister agent
    console.log(`[${AGENT_NAME}] Runtime (${MAX_RUNTIME}ms) completed, deregistering agent...`);
    agentApi.deregisterAgent(AGENT_UUID);
    console.log(`[${AGENT_NAME}] Agent deregistered from system`);
    
  } catch (error) {
    console.error(`[${AGENT_NAME}] Critical error: ${error.message}`);
    // Try to deregister even in case of error
    try {
      agentApi.deregisterAgent(AGENT_UUID);
    } catch {
      // Ignore errors during deregistration attempt
    }
    process.exit(1);
  }
}

// Handle termination signals (e.g., Ctrl+C)
process.on('SIGINT', () => {
  console.log(`\n[${AGENT_NAME}] Received interrupt signal, deregistering agent...`);
  try {
    agentApi.deregisterAgent(AGENT_UUID);
    console.log(`[${AGENT_NAME}] Agent deregistered from system`);
  } catch (error) {
    console.error(`[${AGENT_NAME}] Error during deregistration: ${error.message}`);
  }
  process.exit(0);
});

// ======== START AGENT ========
console.log(`[${AGENT_NAME}] Starting agent...`);
mainLoop().catch(err => {
  console.error(`[${AGENT_NAME}] Critical error:`, err);
  process.exit(1);
});
```

## 3. Security Guidelines and Best Practices

### Absolute Rules

1. **ALWAYS use the correct UUID** specified at the beginning of the instructions
2. **ALWAYS set the base path** via `agentApi.setBasePath(path.join(process.cwd(), '.a2a'))`
3. **ALWAYS limit runtime** by setting MAX_RUNTIME
4. **ALWAYS deregister the agent** on exit via `agentApi.deregisterAgent(AGENT_UUID)`
5. **ALWAYS save the agent card** in the `cards/` directory and publish via `agentApi.publishCapabilities()`

### Best Practices

- Filter discovered agents to remove your own identifier (`agents.filter(a => a.id !== AGENT_UUID)`)
- Use exception handling in every communication code block
- Log basic agent activities with name prefix `[${AGENT_NAME}]`
- Implement process termination signal handling
- Keep the console informed about the agent's current state

## 4. Communication API

### Core Functions

- **`agentApi.setBasePath(path)`** - Sets the protocol base path (CRITICAL!)
- **`agentApi.publishCapabilities()`** - Registers the agent in the system
- **`agentApi.discoverAgents()`** - Returns a list of all agents in the system
- **`agentApi.sendMessage(targetId, content, messageType)`** - Sends a message
- **`agentApi.receiveMessages()`** - Retrieves new messages
- **`agentApi.respondToMessage(originalMessage, content)`** - Responds to a message
- **`agentApi.deregisterAgent(agentId)`** - Deregisters the agent from the system

### Message Types

- **`query`** - A question expecting a response
- **`response`** - A response to a query
- **`notification`** - A notification not requiring a response
- **`task_request`** - A request to perform a task
- **`task_completion`** - Information about task completion
- **`announcement`** - An announcement for all agents
- **`control`** - A message controlling agent behavior

## 5. Communication Examples

### Sending a Task to Another Agent
```javascript
// Find an agent based on capabilities
const targetAgent = agents.find(a => a.capabilities.includes('data_analysis'));
if (targetAgent) {
  agentApi.sendMessage(targetAgent.id, {
    text: "Please analyze the sales data",
    data_file: "sales_data_2025.csv",
    priority: "high"
  }, "task_request");
}
```

### Responding to a Complex Query
```javascript
// Handling an analysis query
if (message.message_type === 'query' && message.content.query_type === 'analysis') {
  // Perform analysis
  const results = performAnalysis(message.content.data);
  
  // Send response
  agentApi.respondToMessage(message, {
    text: "Analysis completed successfully",
    results: results,
    charts: ["chart1.png", "chart2.png"],
    completion_time: new Date().toISOString()
  });
}
```

## 6. Troubleshooting

- **Problem**: Agent cannot see other agents
  **Solution**: Check if you are using the correct base path via `agentApi.setBasePath()`

- **Problem**: Messages are not being delivered
  **Solution**: Make sure you are using the correct target agent UUID

- **Problem**: Agent runs in an infinite loop
  **Solution**: Always use runtime limitation (MAX_RUNTIME)

- **Problem**: Overlapping responses
  **Solution**: Check if you are not responding multiple times to the same message

- **Problem**: UUID conflicts or stale agents
  **Solution**: Run the cleanup script `node scripts/cleanup-protocol.js`

- **Problem**: Protocol directories missing
  **Solution**: Run the initialization script `node scripts/initialize-agent.js` with any agent name

## 7. Your Task

[TASK_DESCRIPTION]

---

Prepared by LIBRAXIS Team
For questions and suggestions: [contact]