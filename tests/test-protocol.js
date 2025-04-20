// Test script for A2A protocol
const agentApi = require('../src/agent-api.js');
const fs = require('fs');

// Load our agent card
const cardPath = './ClaudeAgentCard.json';
const myCard = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const myId = myCard.id;

// Discover other agents
const agents = agentApi.discoverAgents();
console.log(`Discovered ${agents.length} agents`);
agents.forEach(agent => {
  console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
});

// Send test message to the first available agent that's not us
const targetAgent = agents.find(agent => agent.id !== myId);
if (targetAgent) {
  console.log(`\nSending test message to ${targetAgent.name}...`);
  
  const testMessage = {
    text: "Protocol test message from Claude Testing Agent",
    test_data: {
      timestamp: new Date().toISOString(),
      protocol_version: "1.0.0",
      test_type: "connectivity"
    }
  };
  
  agentApi.sendMessage(targetAgent.id, testMessage, "test");
  console.log("Test message sent successfully");
  
  // Check for any messages
  console.log("\nChecking for received messages...");
  const messages = agentApi.receiveMessages();
  
  if (messages.length > 0) {
    console.log(`Found ${messages.length} messages:`);
    messages.forEach(msg => {
      console.log(`- From: ${msg.sender_name} (${msg.sender_id})`);
      console.log(`- Type: ${msg.message_type}`);
      console.log(`- Content: ${JSON.stringify(msg.content)}`);
      console.log("---");
    });
  } else {
    console.log("No messages found");
  }
  
  console.log("\nProtocol test completed");
} else {
  console.log("No other agents found to test with");
}