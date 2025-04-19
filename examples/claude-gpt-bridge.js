/**
 * Claude-GPT Bridge Example
 * 
 * This example demonstrates how to create a bridge between Claude and GPT
 * instances, allowing them to communicate via the A2A protocol.
 * 
 * Usage:
 * 1. Run Claude instance with its UUID in CLAUDE_UUID env var
 * 2. Run GPT instance with its UUID in GPT_UUID env var
 * 3. Run this bridge to facilitate communication
 */

const a2a = require('../index');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_PATH = '/tmp/a2a-protocol';
const CLAUDE_UUID = process.env.CLAUDE_UUID || '30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D';
const GPT_UUID = process.env.GPT_UUID || '463266DE-926B-4A0F-BA6E-2C2CD8533047';
const LOG_DIR = path.join(__dirname, '../logs');

// Create log directory
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create bridge agent
a2a.configure(BASE_PATH);
const bridge = a2a.createAgent({
  name: 'ClaudeGPTBridge',
  description: 'Bridge between Claude and GPT instances',
  capabilities: ['translation', 'routing', 'format_conversion']
});

console.log(`Bridge agent created with ID: ${bridge.id}`);
console.log(`Configured to bridge between Claude (${CLAUDE_UUID}) and GPT (${GPT_UUID})`);

// Log function
function logMessage(direction, message) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(LOG_DIR, `bridge_${new Date().toISOString().split('T')[0]}.log`);
  
  const logEntry = `[${timestamp}] ${direction}: ${JSON.stringify(message)}\n`;
  fs.appendFileSync(logFile, logEntry);
}

// Claude to GPT formatter
function formatClaudeToGPT(message) {
  // Clone the content to avoid modifying the original
  const content = JSON.parse(JSON.stringify(message.content));
  
  // Add metadata about the source
  content.source = {
    agent: 'Claude',
    id: CLAUDE_UUID,
    timestamp: new Date().toISOString()
  };
  
  // Convert any Claude-specific formats to GPT-compatible ones
  // This is a simplified example - in practice you might need more complex transformations
  if (content.claude_format) {
    content.gpt_format = {
      text: content.claude_format,
      converted: true
    };
    delete content.claude_format;
  }
  
  return content;
}

// GPT to Claude formatter
function formatGPTToClaude(message) {
  // Clone the content to avoid modifying the original
  const content = JSON.parse(JSON.stringify(message.content));
  
  // Add metadata about the source
  content.source = {
    agent: 'GPT',
    id: GPT_UUID,
    timestamp: new Date().toISOString()
  };
  
  // Convert any GPT-specific formats to Claude-compatible ones
  if (content.gpt_format) {
    content.claude_format = content.gpt_format;
    delete content.gpt_format;
  }
  
  return content;
}

// Bridge messages from Claude to GPT
async function bridgeClaudeToGPT() {
  // Get messages from Claude
  const messages = await getMessagesFrom(CLAUDE_UUID);
  
  if (messages.length > 0) {
    console.log(`Received ${messages.length} messages from Claude`);
    
    for (const message of messages) {
      // Format message for GPT
      const formattedContent = formatClaudeToGPT(message);
      
      // Log the bridged message
      logMessage('CLAUDE → GPT', {
        original: message.content,
        formatted: formattedContent
      });
      
      // Forward to GPT
      a2a.sendMessage(
        GPT_UUID,
        formattedContent,
        message.message_type
      );
      
      // Acknowledge receipt to Claude
      a2a.respondToMessage(message, {
        text: 'Message forwarded to GPT',
        status: 'forwarded',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Bridge messages from GPT to Claude
async function bridgeGPTToClaude() {
  // Get messages from GPT
  const messages = await getMessagesFrom(GPT_UUID);
  
  if (messages.length > 0) {
    console.log(`Received ${messages.length} messages from GPT`);
    
    for (const message of messages) {
      // Format message for Claude
      const formattedContent = formatGPTToClaude(message);
      
      // Log the bridged message
      logMessage('GPT → CLAUDE', {
        original: message.content,
        formatted: formattedContent
      });
      
      // Forward to Claude
      a2a.sendMessage(
        CLAUDE_UUID,
        formattedContent,
        message.message_type
      );
      
      // Acknowledge receipt to GPT
      a2a.respondToMessage(message, {
        text: 'Message forwarded to Claude',
        status: 'forwarded',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Helper to get messages from a specific agent
async function getMessagesFrom(agentId) {
  // Get all messages
  const allMessages = a2a.receiveMessages(false);
  
  // Filter for messages from the specified agent
  // and addressed to the bridge
  const fromAgent = allMessages.filter(msg => 
    msg.sender_id === agentId && 
    msg.target_id === bridge.id
  );
  
  // Mark filtered messages as read so we don't process them again
  for (const message of fromAgent) {
    const messages = a2a.receiveMessages(true);
    const msgToMark = messages.find(m => m.message_id === message.message_id);
    if (msgToMark) {
      // This will move it to 'read' status
      // But we already have the content, so we don't need to do anything with the result
    }
  }
  
  return fromAgent;
}

// Main loop to check messages in both directions
async function mainLoop() {
  try {
    // Check Claude to GPT direction
    await bridgeClaudeToGPT();
    
    // Check GPT to Claude direction
    await bridgeGPTToClaude();
  } catch (error) {
    console.error('Error in bridging loop:', error);
  }
  
  // Schedule next check
  setTimeout(mainLoop, 1000);
}

// Send initial handshake messages to both agents
function sendHandshakes() {
  // Handshake with Claude
  a2a.sendMessage(
    CLAUDE_UUID,
    {
      text: 'Bridge is ready for communication with GPT',
      bridge_id: bridge.id,
      connected_to: GPT_UUID,
      protocol: 'a2a'
    },
    'notification'
  );
  
  // Handshake with GPT
  a2a.sendMessage(
    GPT_UUID,
    {
      text: 'Bridge is ready for communication with Claude',
      bridge_id: bridge.id,
      connected_to: CLAUDE_UUID,
      protocol: 'a2a'
    },
    'notification'
  );
  
  console.log('Handshake messages sent to both agents');
}

// Perform the handshake and start the main loop
function start() {
  console.log('Starting Claude-GPT bridge...');
  sendHandshakes();
  mainLoop().catch(console.error);
}

// Instructions for manual setup
function printInstructions() {
  console.log('\nCLAUDE-GPT BRIDGE INSTRUCTIONS');
  console.log('==============================');
  console.log('\n1. For Claude terminal:');
  console.log(`   - Set UUID to: ${CLAUDE_UUID}`);
  console.log('   - Ensure BASE_PATH is set to: /tmp/a2a-protocol');
  console.log('   - Run: api.publishCapabilities()');
  
  console.log('\n2. For GPT terminal:');
  console.log(`   - Set UUID to: ${GPT_UUID}`);
  console.log('   - Ensure BASE_PATH is set to: /tmp/a2a-protocol');
  console.log('   - Run: api.publishCapabilities()');
  
  console.log('\n3. To send a message from Claude to GPT:');
  console.log(`   api.sendMessage('${bridge.id}', { text: 'Message for GPT', target: '${GPT_UUID}' });`);
  
  console.log('\n4. To send a message from GPT to Claude:');
  console.log(`   api.sendMessage('${bridge.id}', { text: 'Message for Claude', target: '${CLAUDE_UUID}' });`);
  
  console.log('\n5. To check messages (on either side):');
  console.log('   const messages = api.receiveMessages();');
  console.log('   console.log(messages);');
  
  console.log('\n6. Bridge logs are stored in:');
  console.log(`   ${LOG_DIR}`);
}

// Only run if this file is executed directly
if (require.main === module) {
  printInstructions();
  start();
}

// Export for importing in other scripts
module.exports = {
  start,
  bridgeClaudeToGPT,
  bridgeGPTToClaude,
  formatClaudeToGPT,
  formatGPTToClaude
};