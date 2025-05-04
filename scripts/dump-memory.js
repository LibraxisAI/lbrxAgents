#!/usr/bin/env node

/**
 * MCP Memory Dump Tool
 * 
 * This script connects to the MCP Memory server and dumps the entire knowledge graph
 * to a JSON file for backup or analysis purposes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

// Configuration
const MCP_MEMORY_PORT = 23010; // Default port for MCP Memory server
const OUTPUT_DIR = path.join(process.env.HOME, 'Library', 'Application Support', 'mcp-memory', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `memory_dump_${TIMESTAMP}.json`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Check if MCP Memory server is running
async function checkServerRunning() {
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Fetch the entire knowledge graph
async function fetchKnowledgeGraph() {
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/read_graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ random_string: 'dump' })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch knowledge graph: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching knowledge graph:', error.message);
    process.exit(1);
  }
}

// Start the MCP Memory server if not running
async function ensureServerRunning() {
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    console.log('MCP Memory server is not running. Attempting to start...');
    
    try {
      // Run in detached mode so it continues after script ends
      const startCmd = 'python -m mcp_memory_service &';
      execSync(startCmd, { stdio: 'ignore' });
      
      // Wait for server to start
      console.log('Waiting for server to start...');
      let attempts = 0;
      while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const running = await checkServerRunning();
        if (running) {
          console.log('MCP Memory server started successfully.');
          return true;
        }
        attempts++;
      }
      
      console.error('Failed to start MCP Memory server after 10 attempts.');
      return false;
    } catch (error) {
      console.error('Error starting MCP Memory server:', error.message);
      return false;
    }
  }
  
  console.log('MCP Memory server is already running.');
  return true;
}

// Main function
async function main() {
  console.log('MCP Memory Dump Tool');
  console.log('====================');
  
  const serverRunning = await ensureServerRunning();
  if (!serverRunning) {
    console.error('Cannot proceed without MCP Memory server running.');
    process.exit(1);
  }
  
  console.log('Fetching knowledge graph...');
  const graph = await fetchKnowledgeGraph();
  
  // Add metadata to the dump
  const dumpData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      nodeCount: graph.entities ? graph.entities.length : 0,
      relationCount: graph.relations ? graph.relations.length : 0
    },
    graph
  };
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dumpData, null, 2));
  console.log(`Knowledge graph successfully dumped to: ${OUTPUT_FILE}`);
  
  // Display summary
  console.log('\nSummary:');
  console.log(`- Entities: ${dumpData.metadata.nodeCount}`);
  console.log(`- Relations: ${dumpData.metadata.relationCount}`);
  console.log(`- Total objects: ${dumpData.metadata.nodeCount + dumpData.metadata.relationCount}`);
  console.log(`- File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 