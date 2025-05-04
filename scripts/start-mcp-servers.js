#!/usr/bin/env node

/**
 * MCP Servers Launcher
 * 
 * This script starts all configured MCP servers defined in the .claude.json config file.
 * It handles stdout/stderr redirection, process management, and graceful shutdown.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// Configuration
const CONFIG_FILE = path.join(os.homedir(), '.claude.json');
const LOG_DIR = path.join(os.homedir(), 'Library', 'Logs', 'mcp-servers');
const SERVERS = {};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  console.log(`Created log directory: ${LOG_DIR}`);
}

// Load configuration
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`Configuration file not found: ${CONFIG_FILE}`);
    process.exit(1);
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
      console.error('No MCP servers defined in configuration file');
      process.exit(1);
    }
    return config.mcpServers;
  } catch (error) {
    console.error(`Error loading configuration: ${error.message}`);
    process.exit(1);
  }
}

// Start a server
function startServer(name, config) {
  console.log(`Starting MCP server: ${name}`);
  
  // Setup logging
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(LOG_DIR, `${name}_${timestamp}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Expand environment variables in configuration
  const env = { ...process.env };
  if (config.env) {
    Object.entries(config.env).forEach(([key, value]) => {
      // Handle tilde expansion for paths
      if (typeof value === 'string' && value.startsWith('~/')) {
        env[key] = value.replace(/^~\//, `${os.homedir()}/`);
      } else {
        env[key] = value;
      }
    });
  }
  
  // Spawn the server process
  const serverProcess = spawn(config.command, config.args || [], {
    env,
    detached: false, // Keep child process tied to parent
    stdio: ['ignore', 'pipe', 'pipe'] // Pipe stdout and stderr
  });
  
  // Log metadata
  logStream.write(`=== MCP Server: ${name} ===\n`);
  logStream.write(`Started at: ${new Date().toISOString()}\n`);
  logStream.write(`Command: ${config.command} ${(config.args || []).join(' ')}\n`);
  logStream.write(`PID: ${serverProcess.pid}\n`);
  logStream.write(`Environment: ${JSON.stringify(config.env || {})}\n`);
  logStream.write(`Log file: ${logFile}\n`);
  logStream.write(`=== Output log starts below ===\n\n`);
  
  // Handle output
  serverProcess.stdout.pipe(logStream, { end: false });
  serverProcess.stderr.pipe(logStream, { end: false });
  
  // Also log to console with server name prefix
  serverProcess.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`[${name}] ERROR: ${data.toString().trim()}`);
  });
  
  // Handle server exit
  serverProcess.on('exit', (code, signal) => {
    const exitMessage = `Server ${name} exited with code ${code} (signal: ${signal})`;
    console.log(exitMessage);
    logStream.write(`\n=== ${exitMessage} ===\n`);
    logStream.end();
    delete SERVERS[name];
    
    // Attempt to restart if not shutting down
    if (!shuttingDown && code !== 0) {
      console.log(`Attempting to restart ${name} in 5 seconds...`);
      setTimeout(() => {
        if (!shuttingDown) {
          startServer(name, config);
        }
      }, 5000);
    }
  });
  
  // Store server reference
  SERVERS[name] = {
    process: serverProcess,
    config,
    logStream,
    logFile
  };
  
  console.log(`MCP server ${name} started with PID ${serverProcess.pid}`);
  return serverProcess;
}

// Graceful shutdown
let shuttingDown = false;

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  
  console.log('\nShutting down MCP servers...');
  
  // Send terminate signal to all servers
  Object.entries(SERVERS).forEach(([name, server]) => {
    console.log(`Stopping ${name} (PID: ${server.process.pid})...`);
    server.process.kill('SIGTERM');
  });
  
  // Give servers time to shutdown gracefully
  setTimeout(() => {
    let forcedKill = false;
    
    // Force kill any remaining processes
    Object.entries(SERVERS).forEach(([name, server]) => {
      try {
        process.kill(server.process.pid, 0); // Check if process is still running
        console.log(`Force killing ${name} (PID: ${server.process.pid})...`);
        server.process.kill('SIGKILL');
        forcedKill = true;
      } catch (e) {
        // Process already exited
      }
    });
    
    console.log('All MCP servers stopped.');
    process.exit(forcedKill ? 1 : 0);
  }, 5000);
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown();
});

// Main function
function main() {
  console.log('MCP Servers Launcher');
  console.log('====================');
  console.log(`Loading configuration from: ${CONFIG_FILE}`);
  
  const mcpServers = loadConfig();
  console.log(`Found ${Object.keys(mcpServers).length} MCP servers in configuration`);
  
  // Start all servers
  Object.entries(mcpServers).forEach(([name, config]) => {
    startServer(name, config);
  });
  
  console.log('\nAll MCP servers started. Press Ctrl+C to stop.');
  console.log(`Logs are being written to: ${LOG_DIR}\n`);
}

// Run the main function
main(); 