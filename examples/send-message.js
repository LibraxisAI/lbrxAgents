/**
 * Example: Sending a message to another agent
 */

const agentApi = require('../src/agent-api');

// 1. Discover available agents
const agents = agentApi.discoverAgents();
console.log('Available agents:');
agents.forEach(agent => {
  console.log(`- ${agent.name} (${agent.id})`);
});

// 2. Select an agent to communicate with (first available)
if (agents.length === 0) {
  console.log('No agents available to send messages to.');
  process.exit(1);
}

const targetAgent = agents[0];
const myInfo = agentApi.getAgentInfo();

// 3. Prepare and send a message
const messageContent = {
  text: "Hello from example script!",
  data: {
    example: true,
    timestamp: new Date().toISOString()
  }
};

console.log(`\nSending message to ${targetAgent.name} (${targetAgent.id})...`);
const result = agentApi.sendMessage(targetAgent.id, messageContent);

if (result) {
  console.log('Message sent successfully!');
  agentApi.logAgentActivity('send_example_message', { target: targetAgent.id });
} else {
  console.log('Failed to send message.');
}

// 4. Check for any responses (in a real app, you'd do this after giving time for response)
console.log('\nChecking for messages...');
const messages = agentApi.receiveMessages(false);
console.log(`Found ${messages.length} messages.`);

if (messages.length > 0) {
  messages.forEach(msg => {
    console.log(`- From: ${msg.sender_name}`);
    console.log(`  Content: ${JSON.stringify(msg.content)}`);
  });
}