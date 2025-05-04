/**
 * Test script for A2A protocol
 * 
 * This script demonstrates how to use the A2A protocol
 * with multiple agents by simulating an architecture discussion.
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('../src/agent-api');
const crypto = require('crypto');

// Create a test agent to communicate with
const TEST_AGENT_NAME = 'ArchitectAgent';

// Zamiast hardkodować ID, generujemy je deterministycznie na podstawie nazwy agenta (lub losowo jeśli trzeba)
const TEST_AGENT_ID = crypto.createHash('sha256').update(TEST_AGENT_NAME).digest('hex').slice(0, 32);

// Setup test agent
function setupTestAgent() {
  const testAgentCard = {
    name: TEST_AGENT_NAME,
    version: "1.0.0",
    id: TEST_AGENT_ID,
    description: "Architecture agent for testing",
    capabilities: [
      "architecture_design",
      "component_design",
      "api_design"
    ],
    apis: {
      message_endpoint: "/tmp/quantum-scout/agents/messages/",
      discovery_endpoint: "/tmp/quantum-scout/agents/discovery/"
    },
    author: "Test",
    created_at: new Date().toISOString()
  };
  
  const discoveryPath = path.join('/tmp/quantum-scout/agents/discovery', `${TEST_AGENT_ID}.json`);
  fs.writeFileSync(discoveryPath, JSON.stringify(testAgentCard, null, 2));
  console.log(`Test agent created: ${TEST_AGENT_NAME} (${TEST_AGENT_ID})`);
}

// Simulate message from test agent
function simulateTestAgentMessage(messageType, content) {
  const myInfo = agentApi.getAgentInfo();
  const messageId = require('crypto').randomUUID();
  
  const message = {
    message_id: messageId,
    sender_id: TEST_AGENT_ID,
    sender_name: TEST_AGENT_NAME,
    target_id: myInfo.id,
    timestamp: new Date().toISOString(),
    message_type: messageType,
    content: content,
    capabilities_required: [],
    protocol_version: '1.0.0'
  };
  
  // Ensure directory exists
  const agentDir = path.join('/tmp/quantum-scout/agents/messages', myInfo.id);
  if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
  
  // Write message
  const messagePath = path.join(agentDir, `${messageId}.json`);
  fs.writeFileSync(messagePath, JSON.stringify(message, null, 2));
  
  console.log(`Test agent sent message: ${messageId}`);
  return messageId;
}

// Main test sequence
async function runTest() {
  console.log("Starting A2A Protocol Test");
  console.log("---------------------------");
  
  // 1. Setup
  setupTestAgent();
  agentApi.publishCapabilities();
  const myInfo = agentApi.getAgentInfo();
  
  // 2. Discovery
  console.log("\nDiscovering agents...");
  const agents = agentApi.discoverAgents();
  console.log(`Found ${agents.length} agents:`);
  agents.forEach(agent => {
    console.log(`- ${agent.name} (${agent.id})`);
  });
  
  // 3. Send greeting
  console.log("\nSending greeting to test agent...");
  const greetingSuccess = agentApi.sendMessage(
    TEST_AGENT_ID,
    {
      text: "Hello from the main agent!",
      project: "QuantumScout",
      action: "initiate_architecture_discussion"
    }
  );
  console.log(`Greeting sent: ${greetingSuccess}`);
  
  // 4. Wait for simulated response
  console.log("\nWaiting for response (simulating)...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 5. Simulate response
  const responseId = simulateTestAgentMessage("response", {
    text: "Hello! I'd be happy to discuss the QuantumScout architecture.",
    ready: true,
    suggested_topics: [
      "Component structure",
      "State management",
      "API design"
    ]
  });
  
  // 6. Check for messages
  console.log("\nChecking for messages...");
  await new Promise(resolve => setTimeout(resolve, 500));
  const messages = agentApi.receiveMessages(false);
  console.log(`Found ${messages.length} messages:`);
  
  if (messages.length > 0) {
    messages.forEach(msg => {
      console.log(`\nFrom: ${msg.sender_name} (${msg.sender_id})`);
      console.log(`Type: ${msg.message_type}`);
      console.log(`Content: ${JSON.stringify(msg.content, null, 2)}`);
    });
    
    // 7. Send follow-up with task
    console.log("\nSending architecture question...");
    agentApi.sendMessage(
      TEST_AGENT_ID,
      {
        text: "Let's discuss component structure for QuantumScout",
        topic: "Component structure",
        task: {
          type: "architecture_recommendation",
          requirements: [
            "Reusable UI components",
            "Separation of concerns",
            "Modular architecture"
          ]
        }
      },
      "query"
    );
    
    // 8. Simulate final response
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulateTestAgentMessage("response", {
      text: "Here's my recommendation for the component structure",
      architecture: {
        approach: "Atomic Design",
        layers: [
          "Atoms - Basic UI elements",
          "Molecules - Composite components",
          "Organisms - Complex UI sections",
          "Templates - Page layouts",
          "Pages - Complete views"
        ],
        advantages: [
          "Maximum reusability",
          "Clear separation of concerns",
          "Simplified testing",
          "Consistent styling"
        ]
      }
    });
    
    // 9. Final message check
    console.log("\nChecking for final recommendations...");
    await new Promise(resolve => setTimeout(resolve, 500));
    const finalMessages = agentApi.receiveMessages();
    
    if (finalMessages.length > 0) {
      console.log("\nFinal architecture recommendation received:");
      console.log(JSON.stringify(finalMessages[0].content.architecture, null, 2));
    }
  }
  
  console.log("\nTest completed!");
}

// Run the test
runTest();