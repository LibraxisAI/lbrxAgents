/**
 * Quick Test for A2A Protocol
 * 
 * This script creates two agents, exchanges messages between them,
 * and verifies the protocol works without entering infinite loops.
 */

const a2a = require('./index');
const path = require('path');
const fs = require('fs');

// Setup base paths and ensure directories exist
console.log("=== A2A Protocol Quick Test ===");
console.log("Setting up test environment...");

// Use the base API directly for setup
const agentApi = require('./src/agent-api');

// Set explicit base path and create necessary directories
const TEST_BASE_PATH = path.join(process.cwd(), '.a2a');
agentApi.setBasePath(TEST_BASE_PATH);
agentApi.ensureDirsExist();

console.log(`Test base path: ${TEST_BASE_PATH}`);

// Create Agent Alpha
const agentAlpha = a2a.createAgent({
  name: "AgentAlpha",
  description: "Test agent with orchestration capabilities",
  capabilities: ["coordination", "testing"]
});

console.log(`Created Alpha Agent: ${agentAlpha.name} (${agentAlpha.id})`);

// Create Agent Beta
const agentBeta = a2a.createAgent({
  name: "AgentBeta", 
  description: "Test agent with task execution capabilities",
  capabilities: ["task_execution", "testing"]
});

console.log(`Created Beta Agent: ${agentBeta.name} (${agentBeta.id})`);

// Make sure Beta's capabilities are published
agentApi.publishCapabilities(path.join(process.cwd(), 'cards', `${agentBeta.name}Card.json`));
console.log("Published Beta's capabilities");

// Function to wait a bit
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run our test sequence
async function runTest() {
  try {
    // Step 1: Agent discovery
    console.log("\n1. Agent Discovery Test");
    
    // Make sure both agents are registered in discovery directory
    console.log("Ensuring both agents are discoverable...");
    const alphaDisco = path.join(TEST_BASE_PATH, 'discovery', `${agentAlpha.id}.json`);
    const betaDisco = path.join(TEST_BASE_PATH, 'discovery', `${agentBeta.id}.json`);
    
    if (!fs.existsSync(alphaDisco)) {
      console.log("Alpha not found in discovery directory, publishing...");
      agentApi.publishCapabilities(path.join(process.cwd(), 'cards', `${agentAlpha.name}Card.json`));
    }
    
    if (!fs.existsSync(betaDisco)) {
      console.log("Beta not found in discovery directory, publishing...");
      agentApi.publishCapabilities(path.join(process.cwd(), 'cards', `${agentBeta.name}Card.json`));
    }
    
    // List files in discovery directory
    console.log("Discovery directory contents:");
    fs.readdirSync(path.join(TEST_BASE_PATH, 'discovery')).forEach(file => {
      console.log(`- ${file}`);
    });
    
    // Now discover agents
    const alphaDiscovered = agentApi.discoverAgents();
    console.log(`Alpha discovered ${alphaDiscovered.length} agents:`);
    alphaDiscovered.forEach(agent => {
      console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
    });
    
    // Verify Beta was discovered
    const foundBeta = alphaDiscovered.find(a => a.id === agentBeta.id);
    if (!foundBeta) {
      throw new Error("Agent Beta not discovered! Protocol discovery failure.");
    }
    console.log("✅ Discovery test passed: Agent Beta was found");
    
    // Step 2: Send a message from Alpha to Beta
    console.log("\n2. Message Sending Test");
    const taskMessage = {
      task_type: "test_task",
      parameters: {
        difficulty: "easy",
        timeout: 5000
      },
      priority: "high",
      timestamp: new Date().toISOString()
    };
    
    const sendResult = agentApi.sendMessage(
      agentBeta.id,
      taskMessage,
      "action"
    );
    
    console.log(`Message sent with ID: ${sendResult ? "Success" : "Failed"}`);
    
    if (!sendResult) {
      throw new Error("Failed to send message to Beta!");
    }
    console.log("✅ Message sending test passed");
    
    // Step 3: Check if Beta received the message
    console.log("\n3. Message Reception Test");
    await delay(1000); // Wait a bit for message to be processed
    
    const betaMessages = agentApi.receiveMessages();
    console.log(`Beta received ${betaMessages.length} messages`);
    
    if (betaMessages.length === 0) {
      // List files in messages directory to debug
      console.log("Message directory contents:");
      fs.readdirSync(path.join(TEST_BASE_PATH, 'messages')).forEach(file => {
        console.log(`- ${file}`);
      });
      throw new Error("Agent Beta didn't receive any messages! Protocol failure.");
    }
    
    // Display the received message
    const message = betaMessages[0];
    console.log(`Message from: ${message.sender_name} (${message.sender_id})`);
    console.log(`Message type: ${message.message_type}`);
    console.log(`Content: ${JSON.stringify(message.content, null, 2)}`);
    console.log("✅ Message reception test passed");
    
    // Step 4: Send a response from Beta to Alpha
    console.log("\n4. Response Sending Test");
    const responseContent = {
      task_result: "completed",
      execution_time: 123,
      output: {
        status: "success",
        details: "Test task executed successfully"
      },
      timestamp: new Date().toISOString()
    };
    
    const responseResult = agentApi.respondToMessage(message, responseContent);
    console.log(`Response sent to Alpha: ${responseResult ? "Success" : "Failed"}`);
    
    if (!responseResult) {
      throw new Error("Failed to send response to Alpha!");
    }
    console.log("✅ Response sending test passed");
    
    // Step 5: Check if Alpha received the response
    console.log("\n5. Response Reception Test");
    await delay(1000); // Wait a bit for the response to be processed
    
    // Switch context to Alpha
    agentApi.setAgentCardPath(path.join(process.cwd(), 'cards', `${agentAlpha.name}Card.json`));
    
    const alphaMessages = agentApi.receiveMessages();
    console.log(`Alpha received ${alphaMessages.length} messages`);
    
    if (alphaMessages.length === 0) {
      // List files in messages directory to debug
      console.log("Message directory contents for Alpha:");
      const alphaDir = path.join(TEST_BASE_PATH, 'messages', agentAlpha.id);
      if (fs.existsSync(alphaDir)) {
        fs.readdirSync(alphaDir).forEach(file => {
          console.log(`- ${file}`);
        });
      } else {
        console.log("Alpha message directory does not exist!");
      }
      throw new Error("Agent Alpha didn't receive any responses! Protocol failure.");
    }
    
    // Display the received response
    const response = alphaMessages[0];
    console.log(`Response from: ${response.sender_name} (${response.sender_id})`);
    console.log(`Message type: ${response.message_type}`);
    console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);
    console.log("✅ Response reception test passed");
    
    console.log("\n=== ALL TESTS PASSED! The A2A protocol is working ===");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

// Execute the test
runTest();