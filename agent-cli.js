#!/usr/bin/env node

/**
 * Command-line interface for Agent-to-Agent (A2A) communication
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const agentApi = require('./agent-api');

// Setup
const agentInfo = agentApi.getAgentInfo();
if (!agentInfo) {
  console.error('Failed to load agent information. Please check your AgentCard.json');
  process.exit(1);
}

// Publish capabilities on startup
agentApi.publishCapabilities();
console.log(`Agent ${agentInfo.name} (${agentInfo.id}) is online`);

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${agentInfo.name}> `
});

// Command handlers
const commands = {
  help: () => {
    console.log('\nAvailable commands:');
    console.log('  discover             - List all available agents');
    console.log('  messages             - Check for new messages');
    console.log('  send <agent_id> <msg>- Send a message to another agent');
    console.log('  respond <msg_id> <msg>- Respond to a specific message');
    console.log('  watch                - Watch for new messages (Ctrl+C to exit)');
    console.log('  info                 - Show this agent\'s information');
    console.log('  exit                 - Exit the CLI');
    console.log('\n');
    rl.prompt();
  },
  
  discover: () => {
    const agents = agentApi.discoverAgents();
    console.log('\nDiscovered agents:');
    
    if (agents.length === 0) {
      console.log('  No agents found');
    } else {
      agents.forEach(agent => {
        if (agent.id !== agentInfo.id) {
          console.log(`  ${agent.name} (${agent.id})`);
          console.log(`    Capabilities: ${agent.capabilities.join(', ')}`);
        }
      });
    }
    
    console.log('\n');
    rl.prompt();
  },
  
  messages: () => {
    const messages = agentApi.receiveMessages(false);
    console.log('\nMessages:');
    
    if (messages.length === 0) {
      console.log('  No messages');
    } else {
      messages.forEach(msg => {
        console.log(`  From: ${msg.sender_name} (${msg.sender_id})`);
        console.log(`  Time: ${msg.timestamp}`);
        console.log(`  Type: ${msg.message_type}`);
        console.log(`  ID: ${msg.message_id}`);
        console.log(`  Content: ${JSON.stringify(msg.content)}`);
        console.log('  ---');
      });
    }
    
    console.log('\n');
    rl.prompt();
  },
  
  send: (args) => {
    if (args.length < 2) {
      console.log('Usage: send <agent_id> <message>');
      rl.prompt();
      return;
    }
    
    const targetId = args[0];
    const messageContent = { text: args.slice(1).join(' ') };
    
    const success = agentApi.sendMessage(targetId, messageContent);
    if (success) {
      console.log(`Message sent to ${targetId}`);
      agentApi.logAgentActivity('send_message', { target: targetId, content: messageContent });
    } else {
      console.log('Failed to send message');
    }
    
    rl.prompt();
  },
  
  respond: (args) => {
    if (args.length < 2) {
      console.log('Usage: respond <message_id> <response>');
      rl.prompt();
      return;
    }
    
    const messageId = args[0];
    const responseContent = { text: args.slice(1).join(' ') };
    
    // Find the original message
    const messages = agentApi.receiveMessages(false);
    const originalMessage = messages.find(msg => msg.message_id === messageId);
    
    if (!originalMessage) {
      console.log(`Message with ID ${messageId} not found`);
      rl.prompt();
      return;
    }
    
    const success = agentApi.respondToMessage(originalMessage, responseContent);
    if (success) {
      console.log(`Response sent to ${originalMessage.sender_name}`);
      agentApi.logAgentActivity('respond_to_message', { 
        original_id: messageId,
        target: originalMessage.sender_id,
        content: responseContent 
      });
    } else {
      console.log('Failed to send response');
    }
    
    rl.prompt();
  },
  
  watch: () => {
    console.log('Watching for new messages... (Ctrl+C to stop)');
    
    let lastCheckTime = new Date();
    const interval = setInterval(() => {
      const messages = agentApi.receiveMessages(false);
      const newMessages = messages.filter(msg => {
        const msgTime = new Date(msg.timestamp);
        return msgTime > lastCheckTime;
      });
      
      if (newMessages.length > 0) {
        console.log(`\n[${new Date().toISOString()}] ${newMessages.length} new message(s):`);
        
        newMessages.forEach(msg => {
          console.log(`  From: ${msg.sender_name} (${msg.sender_id})`);
          console.log(`  Type: ${msg.message_type}`);
          console.log(`  ID: ${msg.message_id}`);
          console.log(`  Content: ${JSON.stringify(msg.content)}`);
          console.log('  ---');
        });
        
        lastCheckTime = new Date();
      }
    }, 2000);
    
    // Setup to stop watching on any key
    process.stdin.on('data', () => {
      clearInterval(interval);
      console.log('\nStopped watching for messages');
      rl.prompt();
    });
  },
  
  info: () => {
    console.log('\nAgent Information:');
    console.log(`  Name: ${agentInfo.name}`);
    console.log(`  ID: ${agentInfo.id}`);
    console.log(`  Version: ${agentInfo.version}`);
    console.log(`  Capabilities: ${agentInfo.capabilities.join(', ')}`);
    console.log('\n');
    rl.prompt();
  },
  
  exit: () => {
    console.log('Goodbye!');
    process.exit(0);
  }
};

// Process commands
rl.on('line', (line) => {
  const parts = line.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  if (commands[cmd]) {
    commands[cmd](args);
  } else {
    console.log(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    rl.prompt();
  }
}).on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});

// Start the CLI
rl.prompt();