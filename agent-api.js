/**
 * Agent-to-Agent (A2A) Communication API
 * Based on Google's A2A Protocol
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration - with customizable paths
let BASE_PATH = '/tmp/a2a-protocol';
let MESSAGES_PATH = path.join(BASE_PATH, 'messages');
let DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
let AGENT_CARD_PATH = path.join(__dirname, 'AgentCard.json');

// Check for custom configuration
const CONFIG_FILE = path.join(process.cwd(), '.a2aconfig');
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    
    if (config.baseDir) {
      BASE_PATH = config.baseDir;
      MESSAGES_PATH = path.join(BASE_PATH, 'messages');
      DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
    }
  } catch (e) {
    console.warn(`Warning: Could not load A2A config: ${e.message}`);
  }
}

// Ensure directories exist
function ensureDirsExist() {
  try {
    if (!fs.existsSync(BASE_PATH)) fs.mkdirSync(BASE_PATH, { recursive: true });
    if (!fs.existsSync(MESSAGES_PATH)) fs.mkdirSync(MESSAGES_PATH, { recursive: true });
    if (!fs.existsSync(DISCOVERY_PATH)) fs.mkdirSync(DISCOVERY_PATH, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create directories:', error);
    return false;
  }
}

/**
 * Set the agent card path
 * @param {string} cardPath - Path to the agent card file
 */
function setAgentCardPath(cardPath) {
  if (cardPath && fs.existsSync(cardPath)) {
    AGENT_CARD_PATH = cardPath;
    return true;
  }
  return false;
}

/**
 * Set the base path for message storage
 * @param {string} basePath - Base directory for message storage
 */
function setBasePath(basePath) {
  if (basePath) {
    BASE_PATH = basePath;
    MESSAGES_PATH = path.join(BASE_PATH, 'messages');
    DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
    return true;
  }
  return false;
}

/**
 * Get agent info from AgentCard
 * @param {string} customCardPath - Optional custom path to the agent card
 * @returns {Object|null} Agent information
 */
function getAgentInfo(customCardPath) {
  const cardPath = customCardPath || AGENT_CARD_PATH;
  try {
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    return JSON.parse(cardContent);
  } catch (error) {
    console.error(`Failed to load agent card from ${cardPath}:`, error);
    return null;
  }
}

/**
 * Send a message to another agent
 * @param {string} targetAgentId - The ID of the target agent
 * @param {object} messageContent - The content of the message
 * @param {string} messageType - Type of message: query, response, action, notification
 * @returns {boolean} - Success status
 */
function sendMessage(targetAgentId, messageContent, messageType = 'query') {
  if (!ensureDirsExist()) return false;
  
  const agentInfo = getAgentInfo();
  if (!agentInfo) return false;
  
  const messageId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  const message = {
    message_id: messageId,
    sender_id: agentInfo.id,
    sender_name: agentInfo.name,
    target_id: targetAgentId,
    timestamp,
    message_type: messageType,
    content: messageContent,
    capabilities_required: [],
    protocol_version: '1.0.0'
  };
  
  try {
    const messagePath = path.join(MESSAGES_PATH, `${messageId}.json`);
    fs.writeFileSync(messagePath, JSON.stringify(message, null, 2));
    
    // Also write a copy in agent-specific directory
    const agentDir = path.join(MESSAGES_PATH, targetAgentId);
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(path.join(agentDir, `${messageId}.json`), JSON.stringify(message, null, 2));
    
    return true;
  } catch (error) {
    console.error('Failed to send message:', error);
    return false;
  }
}

/**
 * Receive messages intended for this agent
 * @param {boolean} markAsRead - Whether to mark messages as read
 * @returns {Array} - Array of message objects
 */
function receiveMessages(markAsRead = true) {
  if (!ensureDirsExist()) return [];
  
  const agentInfo = getAgentInfo();
  if (!agentInfo) return [];
  
  try {
    // Check agent-specific directory first
    const agentDir = path.join(MESSAGES_PATH, agentInfo.id);
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    
    const messageFiles = fs.readdirSync(agentDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(agentDir, file));
    
    // Also check main directory
    const allFiles = fs.readdirSync(MESSAGES_PATH)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(MESSAGES_PATH, file));
    
    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const message = JSON.parse(content);
        
        if (message.target_id === agentInfo.id) {
          // If this message is for us but isn't in our directory, add it
          const baseName = path.basename(filePath);
          const agentFilePath = path.join(agentDir, baseName);
          
          if (!messageFiles.includes(agentFilePath)) {
            messageFiles.push(filePath);
            fs.copyFileSync(filePath, agentFilePath);
          }
        }
      } catch (e) {
        // Skip invalid files
        console.warn(`Invalid message file: ${filePath}`);
      }
    }
    
    // Read all messages
    const messages = messageFiles.map(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    // Mark as read if requested
    if (markAsRead) {
      messages.forEach(message => {
        const readDir = path.join(MESSAGES_PATH, 'read');
        if (!fs.existsSync(readDir)) fs.mkdirSync(readDir, { recursive: true });
        
        const sourcePath = path.join(agentDir, `${message.message_id}.json`);
        const destPath = path.join(readDir, `${message.message_id}.json`);
        
        try {
          fs.renameSync(sourcePath, destPath);
        } catch (e) {
          console.warn(`Failed to mark message as read: ${message.message_id}`);
        }
      });
    }
    
    return messages;
  } catch (error) {
    console.error('Failed to receive messages:', error);
    return [];
  }
}

/**
 * Publish agent capabilities to discovery directory
 * @returns {boolean} - Success status
 */
function publishCapabilities() {
  if (!ensureDirsExist()) return false;
  
  const agentInfo = getAgentInfo();
  if (!agentInfo) return false;
  
  try {
    const discoveryPath = path.join(DISCOVERY_PATH, `${agentInfo.id}.json`);
    fs.writeFileSync(discoveryPath, JSON.stringify(agentInfo, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to publish capabilities:', error);
    return false;
  }
}

/**
 * Discover available agents
 * @returns {Array} - Array of agent info objects
 */
function discoverAgents() {
  if (!ensureDirsExist()) return [];
  
  try {
    const files = fs.readdirSync(DISCOVERY_PATH)
      .filter(file => file.endsWith('.json'));
    
    const agents = files.map(file => {
      try {
        const content = fs.readFileSync(path.join(DISCOVERY_PATH, file), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    return agents;
  } catch (error) {
    console.error('Failed to discover agents:', error);
    return [];
  }
}

/**
 * Respond to a message
 * @param {object} originalMessage - The original message to respond to
 * @param {object} responseContent - The content of the response
 * @returns {boolean} - Success status
 */
function respondToMessage(originalMessage, responseContent) {
  return sendMessage(
    originalMessage.sender_id,
    responseContent,
    'response'
  );
}

/**
 * Log agent activity
 * @param {string} action - The action being performed
 * @param {object} data - Data related to the action
 */
function logAgentActivity(action, data) {
  const logDir = path.join(__dirname, '..', 'currentProject', 'teamMessages');
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    
    const agentInfo = getAgentInfo();
    const timestamp = new Date().toISOString();
    const logEntry = {
      agent: agentInfo ? agentInfo.name : 'Unknown',
      agent_id: agentInfo ? agentInfo.id : 'Unknown',
      action,
      timestamp,
      data
    };
    
    const logFile = path.join(logDir, `agent_activity_${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

module.exports = {
  sendMessage,
  receiveMessages,
  publishCapabilities,
  discoverAgents,
  respondToMessage,
  logAgentActivity,
  getAgentInfo,
  setAgentCardPath,
  setBasePath,
  ensureDirsExist
};