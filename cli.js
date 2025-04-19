#!/usr/bin/env node

/**
 * A2A Protocol CLI
 * Command-line interface for the Agent-to-Agent Protocol
 */

const a2a = require('./index');
const api = require('./agent-api');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const readline = require('readline');

// Load codex-specific OpenAI throttle plugin if present (project-level overrides global)
try {
  const cwdPlugin  = path.join(process.cwd(), 'openai-throttle.js');
  const homePlugin = path.join(os.homedir(), '.codex', 'openai-throttle.js');
  let pluginPath;
  if (fs.existsSync(cwdPlugin)) {
    pluginPath = cwdPlugin;
  } else if (fs.existsSync(homePlugin)) {
    pluginPath = homePlugin;
  }
  if (pluginPath) {
    require(pluginPath);
  }
} catch (e) {
  console.warn(`Codex: Failed to load openai-throttle plugin: ${e.message}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Configuration options
const CONFIG_FILE = path.join(process.cwd(), '.a2aconfig');
let config = { baseDir: '/tmp/a2a-protocol' };

// Try to load config file
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = JSON.parse(configData);
  }
} catch (e) {
  console.error(`Warning: Could not load config file: ${e.message}`);
}

// Ensure base directory exists
if (!fs.existsSync(config.baseDir)) {
  fs.mkdirSync(config.baseDir, { recursive: true });
  fs.mkdirSync(path.join(config.baseDir, 'messages'), { recursive: true });
  fs.mkdirSync(path.join(config.baseDir, 'discovery'), { recursive: true });
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Agent-to-Agent (A2A) Protocol CLI

Usage:
  a2a <command> [options]

Commands:
  init [dir]           Initialize the A2A protocol in the specified directory (default: /tmp/a2a-protocol)
  create-agent <name>  Create a new agent with the given name
  discover             List all available agents
  messages             Check for new messages
  send <agent> <msg>   Send a message to another agent
  watch                Watch for new messages (Ctrl+C to exit)
  inject <agent> <file> Inject instructions from a file to an agent
  run <agent-file>     Run an agent implementation
  help                 Show this help message

Examples:
  a2a init ~/my-agents
  a2a create-agent "My Assistant"
  a2a discover
  a2a send 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D "Hello agent!"
  a2a messages
  a2a inject 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D instructions.md
  a2a run my-agent.js
`);
}

/**
 * Initialize the A2A protocol
 */
function initProtocol(dir) {
  const baseDir = dir || config.baseDir;
  
  // Create necessary directories
  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'messages'), { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'discovery'), { recursive: true });
  
  // Save configuration
  config.baseDir = baseDir;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  console.log(`A2A Protocol initialized in ${baseDir}`);
  console.log(`Configuration saved to ${CONFIG_FILE}`);
}

/**
 * Create a new agent
 */
function createAgent(name, description, capabilitiesStr) {
  const uuid = crypto.randomUUID();
  const capabilities = capabilitiesStr ? capabilitiesStr.split(',') : ['basic_communication'];
  
  // Create agent
  const agent = a2a.createAgent({
    name,
    description: description || `Agent created via CLI`,
    capabilities,
    id: uuid
  });
  
  console.log(`Agent ${name} created successfully!`);
  console.log(`UUID: ${uuid}`);
  console.log(`Capabilities: ${capabilities.join(', ')}`);
}

/**
 * Discover agents
 */
function discoverAgents() {
  const agents = api.discoverAgents();
  
  console.log('Available agents:');
  if (agents.length === 0) {
    console.log('  No agents found');
  } else {
    agents.forEach(agent => {
      console.log(`[${agent.name}] - ${agent.id}`);
      console.log(`  Description: ${agent.description}`);
      console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
      console.log('');
    });
  }
}

/**
 * Check for messages
 */
function checkMessages(markAsRead) {
  const mark = markAsRead === 'true';
  const messages = api.receiveMessages(mark);
  
  console.log(`Found ${messages.length} messages:`);
  if (messages.length > 0) {
    messages.forEach(msg => {
      console.log(`\nFrom: ${msg.sender_name} (${msg.sender_id})`);
      console.log(`Time: ${msg.timestamp}`);
      console.log(`Type: ${msg.message_type}`);
      console.log(`Content: ${JSON.stringify(msg.content, null, 2)}`);
      console.log('---');
    });
  }
}

/**
 * Send a message
 */
function sendMessage(targetId, messageText, messageType) {
  const type = messageType || 'query';
  const result = api.sendMessage(targetId, { text: messageText }, type);
  
  if (result) {
    console.log('Message sent successfully');
  } else {
    console.error('Failed to send message');
  }
}

/**
 * Watch for messages
 */
function watchMessages() {
  console.log('Watching for new messages... (Ctrl+C to stop)');
  
  let lastCheckTime = new Date();
  const interval = setInterval(() => {
    const messages = api.receiveMessages(false);
    const newMessages = messages.filter(msg => {
      const msgTime = new Date(msg.timestamp);
      return msgTime > lastCheckTime;
    });
    
    if (newMessages.length > 0) {
      console.log(`\n[${new Date().toISOString()}] ${newMessages.length} new message(s):`);
      newMessages.forEach(msg => {
        console.log(`From: ${msg.sender_name} (${msg.sender_id})`);
        console.log(`Type: ${msg.message_type}`);
        console.log(`Content: ${JSON.stringify(msg.content, null, 2)}`);
        console.log('---');
      });
      
      lastCheckTime = new Date();
    }
  }, 2000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\nStopped watching for messages');
    process.exit(0);
  });
}

/**
 * Inject instructions from a file
 */
function injectInstructions(targetId, filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const messageContent = {
    text: "Instructions from file",
    instructions: content,
    inject: true,
    timestamp: new Date().toISOString(),
    priority: "high"
  };
  
  const result = api.sendMessage(targetId, messageContent, "action");
  if (result) {
    console.log(`Instructions sent successfully to ${targetId}`);
  } else {
    console.error('Failed to send instructions');
  }
}

/**
 * Run agent file
 */
function runAgentFile(agentFile) {
  if (!fs.existsSync(agentFile)) {
    console.error(`Agent file not found: ${agentFile}`);
    return;
  }
  
  // Execute agent file
  try {
    require(path.resolve(agentFile));
    console.log(`Running agent: ${agentFile}`);
  } catch (e) {
    console.error(`Error running agent: ${e.message}`);
  }
}

// Execute the appropriate command
switch (command) {
  case 'init':
    initProtocol(args[1]);
    break;
    
  case 'create-agent':
    if (!args[1]) {
      console.error('Missing agent name');
      printHelp();
      break;
    }
    createAgent(args[1], args[2], args[3]);
    break;
    
  case 'discover':
    discoverAgents();
    break;
    
  case 'messages':
    checkMessages(args[1]);
    break;
    
  case 'send':
    if (!args[1] || !args[2]) {
      console.error('Missing arguments. Usage: a2a send <agent-id> <message> [type]');
      break;
    }
    sendMessage(args[1], args[2], args[3]);
    break;
    
  case 'watch':
    watchMessages();
    break;
    
  case 'inject':
    if (!args[1] || !args[2]) {
      console.error('Missing arguments. Usage: a2a inject <agent-id> <file>');
      break;
    }
    injectInstructions(args[1], args[2]);
    break;
    
  case 'run':
    if (!args[1]) {
      console.error('Missing agent file. Usage: a2a run <agent-file>');
      break;
    }
    runAgentFile(args[1]);
    break;
    
  case 'help':
  default:
    printHelp();
    break;
}