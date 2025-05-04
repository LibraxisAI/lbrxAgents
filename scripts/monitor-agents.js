#!/usr/bin/env node

/**
 * Agent Monitor for Vibecoding Environment
 * 
 * This script provides monitoring and management capabilities for active agents
 * in the environment. It shows agent status, memory usage, and allows for
 * basic management operations.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const os = require('os');

// Configuration
const AGENT_DIR = path.join(__dirname, '..', '.a2a');
const DISCOVERY_DIR = path.join(AGENT_DIR, 'discovery');
const STATUS_DIR = path.join(AGENT_DIR, 'status');
const REFRESH_INTERVAL = 5000; // ms

// Terminal colors/formatting
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Agents data
let agents = [];
let selectedAgent = null;
let refreshInterval = null;
let lastRefreshTime = null;

// Main function
async function main() {
  console.clear();
  printHeader();
  
  // Initial agent discovery
  await discoverAgents();
  
  // Setup refresh interval
  refreshInterval = setInterval(async () => {
    await discoverAgents();
    renderScreen();
  }, REFRESH_INTERVAL);
  
  // Handle command input
  rl.on('line', async (input) => {
    await handleCommand(input.trim());
  });
  
  // Handle process exit
  process.on('exit', () => {
    clearInterval(refreshInterval);
    console.log(`${COLORS.reset}\nAgent monitor exited.`);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(refreshInterval);
    rl.close();
    process.exit(0);
  });
}

// Print header
function printHeader() {
  const timestamp = new Date().toLocaleString();
  console.log(`${COLORS.bg.blue}${COLORS.bright}${COLORS.white} VIBECODING AGENT MONITOR ${COLORS.reset}`);
  console.log(`${COLORS.dim}Last update: ${timestamp}${COLORS.reset}`);
  console.log(`${COLORS.dim}System: ${os.hostname()} (${os.platform()} ${os.release()})${COLORS.reset}`);
  console.log('─'.repeat(process.stdout.columns || 80));
}

// Discover active agents
async function discoverAgents() {
  try {
    if (!fs.existsSync(DISCOVERY_DIR)) {
      agents = [];
      return;
    }
    
    const agentFiles = fs.readdirSync(DISCOVERY_DIR);
    const agentData = [];
    
    for (const file of agentFiles) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(DISCOVERY_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Get agent status
        let status = 'unknown';
        let lastActive = null;
        const statusFile = path.join(STATUS_DIR, `${data.id}.json`);
        
        if (fs.existsSync(statusFile)) {
          try {
            const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
            status = statusData.status || 'active';
            lastActive = statusData.timestamp ? new Date(statusData.timestamp) : null;
          } catch (error) {
            // Ignore status file parsing errors
          }
        }
        
        // Check if agent process is running
        const isRunning = await checkAgentProcess(data.id);
        
        // Add agent to list
        agentData.push({
          id: data.id,
          name: data.name || 'Unnamed Agent',
          description: data.description || '',
          status: isRunning ? 'active' : (status === 'active' ? 'inactive' : status),
          lastActive,
          memoryUsage: await getAgentMemoryUsage(data.id),
          filePath: data.filePath || '',
          apiVersion: data.apiVersion || '',
          messages: await getRecentMessages(data.id)
        });
      } catch (error) {
        // Skip invalid agent files
      }
    }
    
    agents = agentData;
    lastRefreshTime = new Date();
  } catch (error) {
    console.error(`Error discovering agents: ${error.message}`);
  }
}

// Check if an agent process is running
async function checkAgentProcess(agentId) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' 
      ? `tasklist /FI "WINDOWTITLE eq ${agentId}" /NH` 
      : `ps aux | grep "${agentId}" | grep -v grep`;
    
    exec(cmd, (error, stdout) => {
      resolve(!!stdout && stdout.length > 0 && !error);
    });
  });
}

// Get agent memory usage from MCP memory server
async function getAgentMemoryUsage(agentId) {
  try {
    // Create sanitized agent name
    const sanitizedName = agentId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Try to fetch agent memory usage from search
    const response = await fetch('http://localhost:23010/search_nodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${sanitizedName}:*`
      }),
    }).catch(() => null);
    
    if (!response || !response.ok) {
      return { entities: 0, observations: 0, relations: 0 };
    }
    
    const data = await response.json();
    
    // Count entities, observations and relations
    const entities = data.entities ? data.entities.length : 0;
    let observations = 0;
    
    if (data.entities) {
      for (const entity of data.entities) {
        observations += entity.observations ? entity.observations.length : 0;
      }
    }
    
    const relations = data.relations ? data.relations.length : 0;
    
    return { entities, observations, relations };
  } catch (error) {
    return { entities: 0, observations: 0, relations: 0 };
  }
}

// Get recent messages for an agent
async function getRecentMessages(agentId) {
  const messagesDir = path.join(AGENT_DIR, 'messages', 'read', agentId);
  
  if (!fs.existsSync(messagesDir)) {
    return [];
  }
  
  try {
    // Get the most recent message files
    const files = fs.readdirSync(messagesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(messagesDir, f);
        const stats = fs.statSync(filePath);
        return { name: f, time: stats.mtime.getTime(), path: filePath };
      })
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
    
    // Load message contents
    const messages = [];
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        messages.push({
          timestamp: new Date(file.time),
          from: content.from || 'unknown',
          to: content.to || 'unknown',
          content: content.content || '',
          id: content.id || ''
        });
      } catch (error) {
        // Skip invalid message files
      }
    }
    
    return messages;
  } catch (error) {
    return [];
  }
}

// Render the screen
function renderScreen() {
  console.clear();
  printHeader();
  
  if (selectedAgent) {
    renderAgentDetails();
  } else {
    renderAgentList();
  }
  
  renderCommandMenu();
}

// Render list of agents
function renderAgentList() {
  if (agents.length === 0) {
    console.log(`${COLORS.yellow}No agents found.${COLORS.reset}\n`);
    return;
  }
  
  console.log(`${COLORS.bright}Active Agents (${agents.length}):${COLORS.reset}\n`);
  
  console.log(`${COLORS.dim}${'ID'.padEnd(24)} ${'Name'.padEnd(20)} ${'Status'.padEnd(10)} ${'Last Active'.padEnd(20)} ${'Memory Usage'.padEnd(15)}${COLORS.reset}`);
  
  agents.forEach((agent, index) => {
    const statusColor = agent.status === 'active' ? COLORS.green 
      : agent.status === 'inactive' ? COLORS.yellow 
      : COLORS.red;
      
    const lastActiveStr = agent.lastActive 
      ? agent.lastActive.toLocaleString() 
      : 'Never';
      
    const memoryUsageStr = `${agent.memoryUsage.entities}/${agent.memoryUsage.observations}`;
    
    console.log(`${(index + 1).toString().padStart(2)}. ${agent.id.padEnd(20)} ${agent.name.padEnd(20)} ${statusColor}${agent.status.padEnd(10)}${COLORS.reset} ${lastActiveStr.padEnd(20)} ${memoryUsageStr}`);
  });
  
  console.log('');
}

// Render agent details
function renderAgentDetails() {
  const agent = selectedAgent;
  
  console.log(`${COLORS.bright}Agent Details:${COLORS.reset}\n`);
  
  console.log(`${COLORS.bright}Name:${COLORS.reset} ${agent.name}`);
  console.log(`${COLORS.bright}ID:${COLORS.reset} ${agent.id}`);
  console.log(`${COLORS.bright}Description:${COLORS.reset} ${agent.description}`);
  console.log(`${COLORS.bright}Status:${COLORS.reset} ${agent.status === 'active' ? COLORS.green : COLORS.yellow}${agent.status}${COLORS.reset}`);
  console.log(`${COLORS.bright}Last Active:${COLORS.reset} ${agent.lastActive ? agent.lastActive.toLocaleString() : 'Never'}`);
  console.log(`${COLORS.bright}API Version:${COLORS.reset} ${agent.apiVersion}`);
  console.log(`${COLORS.bright}File Path:${COLORS.reset} ${agent.filePath}`);
  
  console.log(`\n${COLORS.bright}Memory Usage:${COLORS.reset}`);
  console.log(`  Entities: ${agent.memoryUsage.entities}`);
  console.log(`  Observations: ${agent.memoryUsage.observations}`);
  console.log(`  Relations: ${agent.memoryUsage.relations}`);
  
  if (agent.messages && agent.messages.length > 0) {
    console.log(`\n${COLORS.bright}Recent Messages:${COLORS.reset}`);
    agent.messages.forEach((msg, index) => {
      const timestamp = msg.timestamp ? msg.timestamp.toLocaleString() : 'Unknown';
      const direction = msg.to === agent.id ? `${COLORS.green}←${COLORS.reset}` : `${COLORS.blue}→${COLORS.reset}`;
      console.log(`  ${direction} ${timestamp} ${COLORS.dim}[${msg.from} → ${msg.to}]${COLORS.reset}`);
      console.log(`    ${COLORS.dim}${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}${COLORS.reset}`);
    });
  } else {
    console.log(`\n${COLORS.yellow}No recent messages.${COLORS.reset}`);
  }
  
  console.log('');
}

// Render command menu
function renderCommandMenu() {
  console.log('─'.repeat(process.stdout.columns || 80));
  
  if (selectedAgent) {
    console.log(`${COLORS.bright}Commands:${COLORS.reset} back(b), restart(r), stop(s), viewlog(v), memory(m), send(msg <text>), refresh(f)`);
  } else {
    console.log(`${COLORS.bright}Commands:${COLORS.reset} select(<num>), refresh(f), start(s <name>), stop(all), memory(m), quit(q)`);
  }
  
  process.stdout.write('> ');
}

// Handle user commands
async function handleCommand(command) {
  if (!command) {
    renderScreen();
    return;
  }
  
  const cmd = command.toLowerCase();
  
  if (selectedAgent) {
    // Agent detail view commands
    if (cmd === 'b' || cmd === 'back') {
      selectedAgent = null;
    } else if (cmd === 'r' || cmd === 'restart') {
      await restartAgent(selectedAgent.id);
    } else if (cmd === 's' || cmd === 'stop') {
      await stopAgent(selectedAgent.id);
      selectedAgent = null;
    } else if (cmd === 'v' || cmd === 'viewlog') {
      await viewAgentLog(selectedAgent.id);
    } else if (cmd === 'm' || cmd === 'memory') {
      await viewAgentMemory(selectedAgent.id);
    } else if (cmd.startsWith('msg ')) {
      await sendMessage(selectedAgent.id, command.substring(4));
    } else if (cmd === 'f' || cmd === 'refresh') {
      await discoverAgents();
      // Update selected agent with fresh data
      selectedAgent = agents.find(a => a.id === selectedAgent.id) || null;
    }
  } else {
    // Agent list view commands
    if (cmd.startsWith('select') || /^\d+$/.test(cmd)) {
      const index = cmd.startsWith('select') 
        ? parseInt(cmd.substring(6)) - 1 
        : parseInt(cmd) - 1;
        
      if (index >= 0 && index < agents.length) {
        selectedAgent = agents[index];
      }
    } else if (cmd === 'f' || cmd === 'refresh') {
      await discoverAgents();
    } else if (cmd.startsWith('s ') || cmd.startsWith('start ')) {
      const agentName = cmd.startsWith('s ') ? cmd.substring(2) : cmd.substring(6);
      await startAgent(agentName);
    } else if (cmd === 'stop all') {
      await stopAllAgents();
    } else if (cmd === 'm' || cmd === 'memory') {
      await viewMemoryStatus();
    } else if (cmd === 'q' || cmd === 'quit') {
      clearInterval(refreshInterval);
      rl.close();
      process.exit(0);
    }
  }
  
  renderScreen();
}

// Start an agent
async function startAgent(agentName) {
  try {
    const agentsDir = path.join(__dirname, '..', 'examples', 'agents');
    const possibleFiles = [
      `${agentName}-agent.js`,
      `${agentName}.js`,
      `${agentName}`
    ];
    
    let agentPath = null;
    for (const file of possibleFiles) {
      const fullPath = path.join(agentsDir, file);
      if (fs.existsSync(fullPath)) {
        agentPath = fullPath;
        break;
      }
    }
    
    if (!agentPath) {
      console.log(`${COLORS.red}Agent "${agentName}" not found.${COLORS.reset}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
    
    console.log(`Starting agent: ${agentName}`);
    
    // Start the agent process detached
    const child = exec(`node "${agentPath}" &`, (error) => {
      if (error) {
        console.log(`${COLORS.red}Error starting agent: ${error.message}${COLORS.reset}`);
      }
    });
    
    child.unref();
    
    console.log(`${COLORS.green}Agent started successfully.${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await discoverAgents();
  } catch (error) {
    console.log(`${COLORS.red}Error starting agent: ${error.message}${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Stop an agent
async function stopAgent(agentId) {
  try {
    console.log(`Stopping agent: ${agentId}`);
    
    const cmd = process.platform === 'win32' 
      ? `taskkill /FI "WINDOWTITLE eq ${agentId}" /F` 
      : `pkill -f "${agentId}"`;
    
    exec(cmd, (error) => {
      if (error && error.code !== 1) {
        console.log(`${COLORS.yellow}Agent may not have been running or could not be stopped.${COLORS.reset}`);
      } else {
        console.log(`${COLORS.green}Agent stopped successfully.${COLORS.reset}`);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await discoverAgents();
  } catch (error) {
    console.log(`${COLORS.red}Error stopping agent: ${error.message}${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Restart an agent
async function restartAgent(agentId) {
  await stopAgent(agentId);
  
  // Find the agent file path
  const agent = agents.find(a => a.id === agentId);
  if (agent && agent.filePath) {
    await startAgent(agent.filePath);
  }
}

// Stop all agents
async function stopAllAgents() {
  console.log('Stopping all agents...');
  
  for (const agent of agents) {
    if (agent.status === 'active') {
      await stopAgent(agent.id);
    }
  }
  
  console.log(`${COLORS.green}All agents stopped.${COLORS.reset}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  await discoverAgents();
}

// View agent log
async function viewAgentLog(agentId) {
  // Simplified log view - in practice you might want to use a pager or show in a separate window
  console.clear();
  console.log(`${COLORS.bright}Log for agent ${agentId}:${COLORS.reset}\n`);
  
  // Find potential log files
  const logDir = path.join(os.homedir(), 'Library', 'Logs');
  const possibleLogs = [
    path.join(logDir, 'mcp-servers', `${agentId}_*.log`),
    path.join(logDir, 'vibecoding', `${agentId}.log`)
  ];
  
  let logFound = false;
  
  for (const logPattern of possibleLogs) {
    const cmd = `ls -t ${logPattern} 2>/dev/null | head -1 | xargs cat | tail -50`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (!error && stdout) {
        console.log(stdout);
        logFound = true;
      }
    });
  }
  
  if (!logFound) {
    console.log(`${COLORS.yellow}No log files found for this agent.${COLORS.reset}`);
  }
  
  console.log('\nPress Enter to return to agent details...');
  await new Promise(resolve => rl.once('line', resolve));
}

// View agent memory
async function viewAgentMemory(agentId) {
  console.clear();
  console.log(`${COLORS.bright}Memory for agent ${agentId}:${COLORS.reset}\n`);
  
  try {
    // Create sanitized agent name
    const sanitizedName = agentId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Try to fetch agent memory from MCP memory server
    const response = await fetch('http://localhost:23010/search_nodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${sanitizedName}:*`
      }),
    }).catch(() => null);
    
    if (!response || !response.ok) {
      console.log(`${COLORS.yellow}Could not connect to memory server.${COLORS.reset}`);
    } else {
      const data = await response.json();
      
      if (!data.entities || data.entities.length === 0) {
        console.log(`${COLORS.yellow}No memory found for this agent.${COLORS.reset}`);
      } else {
        console.log(`${COLORS.bright}Entities:${COLORS.reset}\n`);
        
        data.entities.forEach(entity => {
          console.log(`${COLORS.bright}${entity.name} (${entity.entityType})${COLORS.reset}`);
          
          if (entity.observations && entity.observations.length > 0) {
            console.log(`${COLORS.dim}Observations:${COLORS.reset}`);
            entity.observations.forEach((obs, i) => {
              if (i < 5) { // Limit to 5 observations per entity for brevity
                console.log(`  - ${obs.substring(0, 100)}${obs.length > 100 ? '...' : ''}`);
              } else if (i === 5) {
                console.log(`  - ... and ${entity.observations.length - 5} more`);
              }
            });
          }
          
          console.log('');
        });
        
        if (data.relations && data.relations.length > 0) {
          console.log(`${COLORS.bright}Relations:${COLORS.reset}\n`);
          
          data.relations.forEach(relation => {
            console.log(`  ${relation.from} ${COLORS.dim}[${relation.relationType}]${COLORS.reset} ${relation.to}`);
          });
        }
      }
    }
  } catch (error) {
    console.log(`${COLORS.red}Error fetching memory: ${error.message}${COLORS.reset}`);
  }
  
  console.log('\nPress Enter to return to agent details...');
  await new Promise(resolve => rl.once('line', resolve));
}

// View overall memory server status
async function viewMemoryStatus() {
  console.clear();
  console.log(`${COLORS.bright}Memory Server Status:${COLORS.reset}\n`);
  
  try {
    // Try to fetch the full knowledge graph
    const response = await fetch('http://localhost:23010/read_graph', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        random_string: 'status'
      }),
    }).catch(() => null);
    
    if (!response || !response.ok) {
      console.log(`${COLORS.yellow}Could not connect to memory server.${COLORS.reset}`);
    } else {
      const data = await response.json();
      
      console.log(`${COLORS.bright}Memory Summary:${COLORS.reset}`);
      console.log(`  Entities: ${data.entities ? data.entities.length : 0}`);
      console.log(`  Relations: ${data.relations ? data.relations.length : 0}`);
      
      if (data.entities && data.entities.length > 0) {
        // Group entities by type
        const entityTypes = {};
        data.entities.forEach(entity => {
          entityTypes[entity.entityType] = (entityTypes[entity.entityType] || 0) + 1;
        });
        
        console.log(`\n${COLORS.bright}Entity Types:${COLORS.reset}`);
        Object.entries(entityTypes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });
      }
      
      if (data.relations && data.relations.length > 0) {
        // Group relations by type
        const relationTypes = {};
        data.relations.forEach(relation => {
          relationTypes[relation.relationType] = (relationTypes[relation.relationType] || 0) + 1;
        });
        
        console.log(`\n${COLORS.bright}Relation Types:${COLORS.reset}`);
        Object.entries(relationTypes)
          .sort((a, b) => b[1] - a[1])
          .forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
          });
      }
    }
  } catch (error) {
    console.log(`${COLORS.red}Error fetching memory status: ${error.message}${COLORS.reset}`);
  }
  
  console.log('\nPress Enter to return to agent list...');
  await new Promise(resolve => rl.once('line', resolve));
}

// Send message to an agent
async function sendMessage(agentId, message) {
  if (!message) {
    console.log(`${COLORS.yellow}Message cannot be empty.${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  console.log(`Sending message to ${agentId}: ${message}`);
  
  try {
    // Prepare the message data
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: 'monitor',
      to: agentId,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    // Write message to a2a directory
    const messagesDir = path.join(AGENT_DIR, 'messages', 'read', agentId);
    
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
    }
    
    const messageFile = path.join(messagesDir, `${messageData.id}.json`);
    fs.writeFileSync(messageFile, JSON.stringify(messageData, null, 2));
    
    console.log(`${COLORS.green}Message sent.${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await discoverAgents();
    
    // Update selected agent data
    if (selectedAgent) {
      selectedAgent = agents.find(a => a.id === selectedAgent.id) || null;
    }
  } catch (error) {
    console.log(`${COLORS.red}Error sending message: ${error.message}${COLORS.reset}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 