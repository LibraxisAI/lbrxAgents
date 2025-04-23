/**
 * Agent-to-Agent (A2A) Communication API
 * Based on Google's A2A Protocol
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Detect project root and set standardized path
const PROJECT_ROOT = process.cwd().includes('lbrxAgents') 
  ? process.cwd().split('lbrxAgents')[0] 
  : process.cwd();

// Configuration - with standardized paths
let BASE_PATH = path.join(PROJECT_ROOT, 'lbrxAgents', '.a2a');
let MESSAGES_PATH = path.join(BASE_PATH, 'messages');
let DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
let STATUS_PATH = path.join(BASE_PATH, 'status');
let ORCHESTRATOR_PATH = path.join(BASE_PATH, 'orchestrator');
let AGENT_CARD_PATH = path.join(__dirname, '..', 'cards', 'AgentCard.json');

// Agent state tracking
let activeAgents = new Map();
let lastAgentPings = new Map();

// Process control
let shutdownRequested = false;
let shutdownHandlers = [];

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
    if (!fs.existsSync(STATUS_PATH)) fs.mkdirSync(STATUS_PATH, { recursive: true });
    if (!fs.existsSync(ORCHESTRATOR_PATH)) fs.mkdirSync(ORCHESTRATOR_PATH, { recursive: true });
    
    // Create status file if it doesn't exist
    const statusFile = path.join(STATUS_PATH, 'agents_status.json');
    if (!fs.existsSync(statusFile)) {
      fs.writeFileSync(statusFile, JSON.stringify({
        active_agents: {},
        last_update: new Date().toISOString()
      }, null, 2));
    }
    
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
 * @param {Object} options - Additional options for receiving
 * @returns {Array} - Array of message objects
 */
function receiveMessages(markAsRead = true, options = {}) {
  // console.log(`[receiveMessages DEBUG (RETRY)] Function called. markAsRead=${markAsRead}`);
  if (!ensureDirsExist()) return [];
  
  const agentInfo = getAgentInfo();
  // console.log(`[receiveMessages DEBUG (RETRY)] agentInfo obtained: ${agentInfo ? agentInfo.id : 'null'}`);
  if (!agentInfo) return [];
  
  try {
    // Update agent's active status
    pingAgent(agentInfo.id);
    
    // Check for orchestrator instructions first
    checkOrchestratorInstructions(agentInfo.id);
    
    // Check agent-specific directory first
    const agentDir = path.join(MESSAGES_PATH, agentInfo.id);
    // console.log(`[receiveMessages DEBUG (RETRY)] Checking agent directory: ${agentDir}`);
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    
    const messageFiles = fs.readdirSync(agentDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(agentDir, file));
    // console.log(`[receiveMessages DEBUG (RETRY)] Found ${messageFiles.length} files in agent dir:`, messageFiles);
    
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
    
    // Process special message types
    processSpecialMessages(messages, agentInfo);
    
    // Filter messages by type if specified
    let filteredMessages = messages;
    if (options.messageType) {
      filteredMessages = messages.filter(msg => msg.message_type === options.messageType);
    }
    
    // Mark as read if requested
    if (markAsRead) {
      filteredMessages.forEach(message => {
        const readDir = path.join(MESSAGES_PATH, 'read');
        if (!fs.existsSync(readDir)) fs.mkdirSync(readDir, { recursive: true });
        
        const agentSourcePath = path.join(agentDir, `${message.message_id}.json`);
        const mainSourcePath = path.join(MESSAGES_PATH, `${message.message_id}.json`);
        const destPath = path.join(readDir, `${message.message_id}.json`);
        
        try {
          if (fs.existsSync(agentSourcePath)) {
             fs.renameSync(agentSourcePath, destPath);
          } else if (fs.existsSync(mainSourcePath)) {
             fs.renameSync(mainSourcePath, destPath);
          }
          
          if (fs.existsSync(mainSourcePath) && path.dirname(destPath) !== path.dirname(mainSourcePath)) {
              fs.unlinkSync(mainSourcePath); 
          }
          
        } catch (e) {
          console.warn(`Failed to mark message as read: ${message.message_id}, Error: ${e.message}`);
        }
      });
    }
    
    return filteredMessages;
  } catch (error) {
    console.error('Failed to receive messages:', error);
    return [];
  }
}

/**
 * Process special message types like control messages and announcements
 * @param {Array} messages - Messages to process
 * @param {Object} agentInfo - Agent information
 */
function processSpecialMessages(messages, agentInfo) {
  if (!messages || !Array.isArray(messages) || !agentInfo) return;
  
  try {
    // Check for control messages
    const controlMessages = messages.filter(msg => 
      msg.message_type === 'control' || 
      msg.message_type === 'emergency' ||
      (msg.content && (
        msg.content.control_command === 'exit_loop' || 
        msg.content.control_command === 'force_exit' || 
        msg.content.emergency === true ||
        msg.content.emergency
      ))
    );
    
    // Handle control messages - request shutdown if needed
    if (controlMessages.length > 0) {
      console.log('Received control message requesting shutdown');
      requestShutdown();
      
      // Respond to test control messages
      controlMessages.forEach(msg => {
        if (msg.content && msg.content.test_id === "control_message_test") {
          // Send test response
          sendMessage(
            msg.sender_id,
            {
              text: "Potwierdzenie obsługi wiadomości kontrolnych",
              test_id: "control_message_test_response",
              status: "success"
            },
            "response"
          );
        }
      });
    }
    
    // Check for announcement messages (new agents joining)
    const announcements = messages.filter(msg => 
      msg.message_type === 'announcement' || 
      (msg.content && msg.content.announcement)
    );
    
    // Process announcements
    if (announcements.length > 0) {
      announcements.forEach(msg => {
        if (msg.content && msg.content.agent_details) {
          const { id, name, capabilities } = msg.content.agent_details;
          console.log(`Received announcement from agent: ${name} (${id})`);
          
          // Update our list of active agents
          updateAgentStatus(id, {
            name: name,
            status: 'active',
            last_ping: new Date().toISOString(),
            capabilities: capabilities || []
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing special messages:', error);
  }
}

/**
 * Check for orchestrator instructions
 * @param {string} agentId - Agent ID to check instructions for
 */
function checkOrchestratorInstructions(agentId) {
  try {
    const orchestratorInfo = getOrchestratorInfo();
    if (!orchestratorInfo) return;
    
    // Check for global instructions
    const globalInstructionsFile = path.join(ORCHESTRATOR_PATH, 'global_instructions.json');
    if (fs.existsSync(globalInstructionsFile)) {
      try {
        const globalInstructions = JSON.parse(fs.readFileSync(globalInstructionsFile, 'utf8'));
        console.log('Global orchestrator instructions available:', globalInstructions.title || 'No title');
      } catch (e) {
        console.warn('Could not parse global instructions file');
      }
    }
    
    // Check for agent-specific instructions
    const agentInstructionsFile = path.join(ORCHESTRATOR_PATH, `${agentId}_instructions.json`);
    if (fs.existsSync(agentInstructionsFile)) {
      try {
        const agentInstructions = JSON.parse(fs.readFileSync(agentInstructionsFile, 'utf8'));
        console.log('Agent-specific instructions available from orchestrator');
      } catch (e) {
        console.warn('Could not parse agent instructions file');
      }
    }
  } catch (error) {
    console.error('Error checking orchestrator instructions:', error);
  }
}

/**
 * Publish agent capabilities to discovery directory and announce presence
 * @param {string} customCardPath - Optional custom path to the agent card
 * @returns {boolean} - Success status
 */
function publishCapabilities(customCardPath) {
  if (!ensureDirsExist()) return false;
  
  const agentInfo = getAgentInfo(customCardPath);
  if (!agentInfo) return false;
  
  try {
    // Write to discovery directory
    const discoveryPath = path.join(DISCOVERY_PATH, `${agentInfo.id}.json`);
    fs.writeFileSync(discoveryPath, JSON.stringify(agentInfo, null, 2));
    
    // Update status file with active status
    updateAgentStatus(agentInfo.id, {
      name: agentInfo.name,
      status: 'active',
      last_ping: new Date().toISOString(),
      capabilities: agentInfo.capabilities
    });
    
    // Send announcement to orchestrator if exists
    const orchestratorInfo = getOrchestratorInfo();
    if (orchestratorInfo && orchestratorInfo.id) {
      sendMessage(orchestratorInfo.id, {
        text: `Agent ${agentInfo.name} (${agentInfo.id}) is now active.`,
        announcement: true,
        capabilities: agentInfo.capabilities,
        agent_details: {
          name: agentInfo.name,
          id: agentInfo.id,
          description: agentInfo.description
        }
      }, 'announcement');
    }
    
    // Announce to all other active agents
    const otherAgents = discoverAgents().filter(a => a.id !== agentInfo.id);
    otherAgents.forEach(agent => {
      sendMessage(agent.id, {
        text: `Agent ${agentInfo.name} (${agentInfo.id}) has joined the system.`,
        announcement: true,
        agent_details: {
          name: agentInfo.name,
          id: agentInfo.id,
          description: agentInfo.description,
          capabilities: agentInfo.capabilities
        }
      }, 'announcement');
    });
    
    return true;
  } catch (error) {
    console.error('Failed to publish capabilities:', error);
    return false;
  }
}

/**
 * Get the orchestrator information
 * @returns {Object|null} - Orchestrator info or null if not available
 */
function getOrchestratorInfo() {
  try {
    const orchestratorFile = path.join(ORCHESTRATOR_PATH, 'orchestrator.json');
    if (fs.existsSync(orchestratorFile)) {
      const data = fs.readFileSync(orchestratorFile, 'utf8');
      return JSON.parse(data);
    }
    
    // If no specific orchestrator file, try to find one in discovery
    const agents = discoverAgents();
    const orchestrator = agents.find(a => 
      a.name.toLowerCase().includes('orchestrator') || 
      (a.capabilities && a.capabilities.includes('orchestration'))
    );
    
    return orchestrator || null;
  } catch (error) {
    console.error('Error getting orchestrator info:', error);
    return null;
  }
}

/**
 * Update agent status in the status file
 * @param {string} agentId - The ID of the agent
 * @param {Object} statusData - Status data
 * @returns {boolean} - Success status
 */
function updateAgentStatus(agentId, statusData) {
  try {
    const statusFile = path.join(STATUS_PATH, 'agents_status.json');
    let statusObj = { active_agents: {}, last_update: new Date().toISOString() };
    
    if (fs.existsSync(statusFile)) {
      const data = fs.readFileSync(statusFile, 'utf8');
      statusObj = JSON.parse(data);
    }
    
    statusObj.active_agents[agentId] = {
      ...statusData,
      last_update: new Date().toISOString()
    };
    
    fs.writeFileSync(statusFile, JSON.stringify(statusObj, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to update agent status:', error);
    return false;
  }
}

/**
 * Discover available agents with active status information
 * @param {Object} options - Discovery options
 * @returns {Array} - Array of agent info objects
 */
function discoverAgents(options = {}) {
  if (!ensureDirsExist()) return [];
  
  try {
    // Get agent information from discovery directory
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
    
    // Get active status information
    const statusFile = path.join(STATUS_PATH, 'agents_status.json');
    let statusInfo = { active_agents: {} };
    
    if (fs.existsSync(statusFile)) {
      try {
        statusInfo = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      } catch (e) {
        console.warn('Could not parse status file');
      }
    }
    
    // Enrich agent info with status
    const enrichedAgents = agents.map(agent => {
      const status = statusInfo.active_agents[agent.id] || { status: 'unknown' };
      return {
        ...agent,
        active: status.status === 'active',
        last_ping: status.last_ping || null,
        status: status.status || 'unknown'
      };
    });
    
    // Filter by active status if specified
    if (options.onlyActive) {
      return enrichedAgents.filter(agent => agent.active);
    }
    
    // Filter by capabilities if specified
    if (options.capabilities && Array.isArray(options.capabilities)) {
      return enrichedAgents.filter(agent => {
        if (!agent.capabilities) return false;
        return options.capabilities.every(cap => agent.capabilities.includes(cap));
      });
    }
    
    // Update in-memory cache of active agents
    enrichedAgents.forEach(agent => {
      if (agent.active) {
        activeAgents.set(agent.id, agent);
        lastAgentPings.set(agent.id, new Date());
      }
    });
    
    return agents;
  } catch (error) {
    console.error('Failed to discover agents:', error);
    return [];
  }
}

/**
 * Check agent activity status
 * @param {string} agentId - The ID of the agent to check
 * @returns {boolean} - Whether the agent is active
 */
function isAgentActive(agentId) {
  try {
    // Check in-memory cache first
    if (activeAgents.has(agentId)) {
      const lastPing = lastAgentPings.get(agentId);
      if (lastPing && (new Date() - lastPing) < 300000) { // 5 minutes timeout
        return true;
      }
    }
    
    // Then check status file
    const statusFile = path.join(STATUS_PATH, 'agents_status.json');
    if (fs.existsSync(statusFile)) {
      const statusInfo = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      const agentStatus = statusInfo.active_agents[agentId];
      
      if (agentStatus && agentStatus.status === 'active') {
        // Check if the last update is recent (within 5 minutes)
        const lastUpdate = new Date(agentStatus.last_update);
        const isRecent = (new Date() - lastUpdate) < 300000; // 5 minutes
        
        if (isRecent) {
          // Update the in-memory cache
          activeAgents.set(agentId, { id: agentId, ...agentStatus });
          lastAgentPings.set(agentId, new Date(agentStatus.last_update));
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking agent activity:', error);
    return false;
  }
}

/**
 * Ping to update agent's active status
 * @param {string} agentId - The ID of the agent
 * @returns {boolean} - Success status
 */
function pingAgent(agentId) {
  if (!agentId) {
    const agentInfo = getAgentInfo();
    if (!agentInfo) return false;
    agentId = agentInfo.id;
  }
  
  return updateAgentStatus(agentId, {
    status: 'active',
    last_ping: new Date().toISOString()
  });
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
  const logDir = path.join(__dirname, '..', 'logs');
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

/**
 * Enable process shutdown handlers
 */
function enableShutdownHandlers() {
  // Only add handlers once
  if (shutdownHandlers.length > 0) return;
  
  const handler = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    shutdownRequested = true;
    
    // Run all registered shutdown handlers
    Promise.all(shutdownHandlers.map(fn => fn()))
      .then(() => {
        console.log('Shutdown complete.');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error during shutdown:', err);
        process.exit(1);
      });
  };
  
  // Handle termination signals
  process.on('SIGINT', () => handler('SIGINT'));
  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGHUP', () => handler('SIGHUP'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    handler('uncaughtException');
  });
}

/**
 * Register a function to run on shutdown
 * @param {Function} fn - Function to run on shutdown
 */
function onShutdown(fn) {
  if (typeof fn === 'function') {
    shutdownHandlers.push(fn);
  }
}

/**
 * Check if shutdown has been requested
 * @returns {boolean} - Whether shutdown has been requested
 */
function isShutdownRequested() {
  return shutdownRequested;
}

/**
 * Request shutdown of the agent
 */
function requestShutdown() {
  shutdownRequested = true;
}

/**
 * Deregister agent from the system
 * @param {string} agentId - The ID of the agent to deregister
 * @returns {boolean} - Success status
 */
function deregisterAgent(agentId) {
  if (!agentId) {
    const agentInfo = getAgentInfo();
    if (!agentInfo) return false;
    agentId = agentInfo.id;
  }
  
  try {
    // Update status to inactive
    updateAgentStatus(agentId, {
      status: 'inactive',
      last_ping: new Date().toISOString()
    });
    
    // Remove from discovery
    const discoveryPath = path.join(DISCOVERY_PATH, `${agentId}.json`);
    if (fs.existsSync(discoveryPath)) {
      fs.unlinkSync(discoveryPath);
    }
    
    // Remove from in-memory cache
    activeAgents.delete(agentId);
    lastAgentPings.delete(agentId);
    
    // Notify orchestrator if exists
    const orchestratorInfo = getOrchestratorInfo();
    if (orchestratorInfo && orchestratorInfo.id) {
      sendMessage(orchestratorInfo.id, {
        text: `Agent with ID ${agentId} has been deregistered.`,
        deregistration: true,
        agent_id: agentId
      }, 'notification');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to deregister agent:', error);
    return false;
  }
}

/**
 * Get orchestrator status and instructions
 * @returns {Object} - Orchestrator status and instructions
 */
function getOrchestratorStatus() {
  try {
    // Check global status first
    const statusFile = path.join(ORCHESTRATOR_PATH, 'status.json');
    if (fs.existsSync(statusFile)) {
      return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    }
    
    return {
      status: 'unknown',
      last_update: null,
      message: 'No orchestrator status available'
    };
  } catch (error) {
    console.error('Error getting orchestrator status:', error);
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Register shutdown handler to deregister agent on exit
onShutdown(() => {
  try {
    const agentInfo = getAgentInfo();
    if (agentInfo) {
      console.log(`Deregistering agent ${agentInfo.name} (${agentInfo.id}) on shutdown...`);
      deregisterAgent(agentInfo.id);
    }
  } catch (e) {
    console.error('Error during shutdown deregistration:', e);
  }
  return Promise.resolve();
});

module.exports = {
  // Basic communication
  sendMessage,
  receiveMessages,
  respondToMessage,
  
  // Agent discovery and status
  publishCapabilities,
  discoverAgents,
  pingAgent,
  isAgentActive,
  deregisterAgent,
  
  // Orchestrator interaction
  getOrchestratorInfo,
  getOrchestratorStatus,
  checkOrchestratorInstructions,
  
  // Agent info and path management
  getAgentInfo,
  setAgentCardPath,
  setBasePath,
  ensureDirsExist,
  logAgentActivity,
  
  // Process control
  enableShutdownHandlers,
  onShutdown,
  isShutdownRequested,
  requestShutdown,
  
  // Status management
  updateAgentStatus
};