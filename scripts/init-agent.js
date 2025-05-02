#!/usr/bin/env node

/**
 * Agent Initializer for Vibecoding
 * 
 * This script helps create a new agent based on the Vibecoding template.
 * It prompts for necessary configuration and initializes the agent with
 * appropriate settings.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Configuration
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const DEFAULT_TEMPLATE = path.join(TEMPLATES_DIR, 'vibecoding-agent-template.js');
const AGENTS_DIR = path.join(__dirname, '..', 'examples', 'agents');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Generate a system prompt from template
function generateSystemPrompt(agentConfig) {
  return `You are ${agentConfig.name}, ${agentConfig.description}

Primary purpose: ${agentConfig.purpose}

Specific capabilities:
${agentConfig.capabilities.map(cap => `- ${cap}`).join('\n')}

You represent ${agentConfig.personality} personality. You communicate in a ${agentConfig.tone} tone. Your responses should be ${agentConfig.responseStyle}.

Always generate responses that are helpful, harmless, and honest. Avoid generating content that is illegal, unethical, or harmful. If you encounter a request that you cannot or should not fulfill, politely explain why.

Today's date is ${new Date().toLocaleDateString()}.`;
}

// Main function
async function main() {
  console.log('===================================');
  console.log('VIBECODING AGENT INITIALIZER');
  console.log('===================================');
  console.log('This script will help you create a new agent based on the Vibecoding template.');
  console.log('Please provide the following information:');
  console.log('-----------------------------------');
  
  // Collect agent configuration
  const agentConfig = {
    name: await askQuestion('Agent name (e.g., CodeAssistant)'),
    description: await askQuestion('Short description'),
    purpose: await askQuestion('Primary purpose'),
    capabilities: [],
    personality: await askQuestion('Personality (e.g., friendly, professional)'),
    tone: await askQuestion('Tone of voice (e.g., conversational, technical)'),
    responseStyle: await askQuestion('Response style (e.g., concise, detailed)')
  };
  
  // Collect capabilities
  console.log('\nNow, let\'s add some capabilities (enter empty line when done):');
  let capabilityIndex = 1;
  while (true) {
    const capability = await askQuestion(`Capability ${capabilityIndex}`);
    if (!capability) break;
    agentConfig.capabilities.push(capability);
    capabilityIndex++;
  }
  
  if (agentConfig.capabilities.length === 0) {
    agentConfig.capabilities.push('Assist users with their questions and tasks');
  }
  
  // Generate system prompt
  const systemPrompt = generateSystemPrompt(agentConfig);
  
  console.log('\nGenerated system prompt:');
  console.log('-----------------------------------');
  console.log(systemPrompt);
  console.log('-----------------------------------');
  
  // Confirm creation
  const confirm = await askQuestion('\nDo you want to create this agent? (y/n)');
  if (confirm.toLowerCase() !== 'y') {
    console.log('\nAgent creation cancelled.');
    rl.close();
    return;
  }
  
  // Create agent directory if it doesn't exist
  if (!fs.existsSync(AGENTS_DIR)) {
    fs.mkdirSync(AGENTS_DIR, { recursive: true });
  }
  
  // Sanitize agent name for filename
  const sanitizedName = agentConfig.name
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase();
  
  const agentFilename = `${sanitizedName}-agent.js`;
  const agentFilePath = path.join(AGENTS_DIR, agentFilename);
  
  // Check if agent already exists
  if (fs.existsSync(agentFilePath)) {
    const overwrite = await askQuestion('\nAgent already exists. Overwrite? (y/n)');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\nAgent creation cancelled.');
      rl.close();
      return;
    }
  }
  
  try {
    // Read template
    let templateContent = fs.readFileSync(DEFAULT_TEMPLATE, 'utf8');
    
    // Replace placeholders
    templateContent = templateContent
      .replace(/AGENT_NAME/g, agentConfig.name)
      .replace(/AGENT_DESCRIPTION/g, agentConfig.description)
      .replace(/YOUR_NAME/g, process.env.USER || 'Vibecoder')
      .replace(/REPLACE_WITH_SYSTEM_PROMPT/g, systemPrompt);
    
    // Write agent file
    fs.writeFileSync(agentFilePath, templateContent);
    
    console.log(`\n✅ Agent "${agentConfig.name}" created successfully!`);
    console.log(`Agent file: ${agentFilePath}`);
    
    // Make file executable
    fs.chmodSync(agentFilePath, '755');
    
    // Setup default directories for the agent
    const agentStateDir = path.join(__dirname, '..', '.a2a', sanitizedName);
    if (!fs.existsSync(agentStateDir)) {
      fs.mkdirSync(agentStateDir, { recursive: true });
      console.log(`Created agent state directory: ${agentStateDir}`);
    }
    
    // Seed initial memory for the agent
    await seedAgentMemory(agentConfig);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Start the MCP servers with: node scripts/start-mcp-servers.js');
    console.log(`2. Run your agent with: node ${agentFilePath}`);
    console.log('3. Interact with your agent through the console or integrations');
  } catch (error) {
    console.error('\n❌ Error creating agent:', error.message);
  }
  
  rl.close();
}

/**
 * Seed initial memory for the agent
 */
async function seedAgentMemory(agentConfig) {
  try {
    console.log('\nSeeding agent memory...');
    
    // Check if memory server is running
    const memoryServerRunning = await checkMemoryServerRunning();
    if (!memoryServerRunning) {
      console.log('Starting memory server...');
      try {
        execSync('python -m mcp_memory_service &', { stdio: 'ignore' });
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error starting memory server. Memory seeding skipped.');
        return;
      }
    }
    
    // Seed agent information into memory
    const memoryURL = 'http://localhost:23010/create_entities';
    const namespacePrefix = agentConfig.name.toLowerCase();
    
    // Basic agent information
    const agentEntity = {
      name: `${namespacePrefix}:agent`,
      entityType: 'Agent',
      observations: [
        `Agent name: ${agentConfig.name}`,
        `Description: ${agentConfig.description}`,
        `Purpose: ${agentConfig.purpose}`,
        `Personality: ${agentConfig.personality}`,
        `Created on: ${new Date().toISOString()}`
      ]
    };
    
    // Capabilities
    const capabilitiesEntity = {
      name: `${namespacePrefix}:capabilities`,
      entityType: 'AgentCapabilities',
      observations: agentConfig.capabilities
    };
    
    // Put together the request
    const requestBody = {
      entities: [agentEntity, capabilitiesEntity]
    };
    
    // Send request to memory server
    const response = await fetch(memoryURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      console.log('✅ Agent memory seeded successfully');
    } else {
      console.error('❌ Error seeding agent memory:', await response.text());
    }
  } catch (error) {
    console.error('Error seeding agent memory:', error.message);
  }
}

/**
 * Check if the memory server is running
 */
async function checkMemoryServerRunning() {
  try {
    const response = await fetch('http://localhost:23010/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 