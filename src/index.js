/**
 * Agent-to-Agent (A2A) Protocol
 * Main entry point
 */

const api = require('./agent-api');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Configure the base directory for message storage
 * @param {string} baseDir - Custom base directory for message storage
 * @returns {Object} Updated api object
 */
function configure(baseDir) {
  // Default directory if not specified
  const messageDirBase = baseDir || '/tmp/a2a-protocol';
  
  // Ensure configuration directory exists
  const configDir = path.join(messageDirBase, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Store configuration
  const configPath = path.join(configDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify({
    baseDir: messageDirBase,
    messagesDir: path.join(messageDirBase, 'messages'),
    discoveryDir: path.join(messageDirBase, 'discovery'),
    modified: new Date().toISOString()
  }, null, 2));
  
  return api;
}

/**
 * Create a new agent instance with the given attributes
 * @param {Object} options - Agent configuration options
 * @returns {Object} Agent API object
 */
function createAgent(options = {}) {
  const {
    name = `Agent-${Date.now()}`,
    description = 'A2A Protocol Agent',
    capabilities = ['basic_communication'],
    id = crypto.randomUUID()
  } = options;
  
  // Create agent card
  const cardPath = path.join(process.cwd(), 'cards', `${name.replace(/\s+/g, '')}Card.json`);
  const agentCard = {
    name,
    version: "1.0.0",
    id,
    description,
    capabilities,
    apis: {
      message_endpoint: path.join(process.cwd(), '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), '.a2a', 'discovery')
    },
    author: name,
    created_at: new Date().toISOString()
  };
  
  // Save agent card
  fs.writeFileSync(cardPath, JSON.stringify(agentCard, null, 2));
  
  // Publish capabilities
  api.publishCapabilities();
  
  return {
    ...api,
    id,
    name,
    capabilities,
    cardPath
  };
}

// Export the API
module.exports = {
  createAgent,
  configure,
  ...api
};