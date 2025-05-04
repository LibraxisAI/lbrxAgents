/**
 * Requirement Gatherer Agent
 * 
 * Agent responsible for interacting with the user to gather project requirements
 * using an LLM and generating a project plan document.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const agentApi = require('./agent-api'); // Assuming agent-api.js is in the same directory or accessible

// --- LLM Integration Placeholder ---
const { OpenAI } = require("openai"); // Example: uncomment and install 'openai' package
let openai; 
// --- End LLM Integration Placeholder ---

// ====================================
// AGENT CONFIGURATION - EDIT HERE
// ====================================

const AGENT_UUID = generateAgentId(); 
const AGENT_NAME = "RequirementGathererAgent";
const AGENT_DESCRIPTION = "Interacts with the user to define project requirements and generate a plan.";
const AGENT_CAPABILITIES = [
  "requirement_gathering",
  "user_interaction",
  "plan_generation"
];
const OUTPUT_FILENAME = "project.md";

// System prompts for LLM
const PLANNING_ASSISTANT_PROMPT = `You are a project planning assistant. Your goal is to understand the user's project idea by asking clarifying questions one by one. Ask only one question at a time. When you have enough information to generate a project plan (including Goal, Tech Stack, and Roadmap), respond with exactly the word 'DONE'.`;
const PLAN_GENERATOR_PROMPT = `Based on the following conversation, generate a project plan in markdown format. The plan should include the following sections: ## Goal, ## Tech Stack, ## Roadmap (as a list of tasks).`;

// ====================================\n// CORE LOGIC\n// ====================================

// Placeholder for LLM API Key - should be loaded securely, e.g., from environment variables
const LLM_API_KEY = process.env.OPENAI_API_KEY; // Example

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Asks the user a question and returns their answer.
 * @param {string} query - The question to ask the user.
 * @returns {Promise<string>} - The user's answer.
 */
function getUserInput(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Placeholder function to simulate calling the LLM.
 * Replace this with actual API calls to your chosen LLM provider.
 * @param {Array<object>} conversationHistory - Array of {role: 'user'/'assistant', content: string}
 * @param {string} systemPrompt - The system prompt to use.
 * @returns {Promise<string>} - The LLM's response.
 */
async function callLLM(conversationHistory, systemPrompt) {
  console.log(`\n[DEBUG] Calling LLM with ${conversationHistory.length} messages and prompt: "${systemPrompt.substring(0, 50)}..."`);
  
  // --- LLM API Call Implementation Start ---
  if (!LLM_API_KEY) {
    console.warn("[WARN] LLM_API_KEY environment variable not set. Cannot call LLM.");
    // Return an error or a specific message indicating the issue
    return "ERROR: LLM_API_KEY is not set.";
  }
  
  // Example using OpenAI library:
  if (!openai) {
      openai = new OpenAI({ apiKey: LLM_API_KEY });
  }
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
    ];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Or your preferred model
      messages: messages,
    });
    
    return completion.choices[0].message.content.trim();
    
  } catch (error) {
    console.error("[ERROR] Failed to call LLM:", error);
    return "ERROR: Could not contact LLM.";
  }
  // --- LLM API Call Implementation End ---
  
  // Fallback logic removed as the primary implementation is now active
  // console.error("[ERROR] Reached end of callLLM without returning a value.");
  // return "ERROR: Unexpected issue in callLLM function."; 
}

/**
 * Main function for the requirement gathering process.
 */
async function gatherRequirements() {
  console.log(`Hello! I am ${AGENT_NAME}. I will help you define your project.`);
  
  if (!LLM_API_KEY) {
      console.warn("\n[WARN] LLM_API_KEY is not set. The conversation will use placeholder responses.");
  }

  const initialDescription = await getUserInput("First, please provide a brief description of your project: ");

  let conversationHistory = [
    { role: 'user', content: initialDescription }
  ];

  console.log("\nOkay, I will now ask some clarifying questions. Please answer them one by one.");

  while (true) {
    const llmResponse = await callLLM(conversationHistory, PLANNING_ASSISTANT_PROMPT);

    if (llmResponse === "DONE") {
      console.log("\nGreat! I think I have enough information to generate a plan.");
      break;
    }
    
    if (llmResponse.startsWith("ERROR:")) {
        console.error(`\nError during requirement gathering: ${llmResponse}`)
        return; // Stop the process on error
    }

    conversationHistory.push({ role: 'assistant', content: llmResponse });
    
    const userAnswer = await getUserInput(`\nArchitect: ${llmResponse}\nYour answer: `);
    conversationHistory.push({ role: 'user', content: userAnswer });
  }

  // --- Generate the project plan ---
  console.log("\nGenerating project plan...");
  const planContent = await callLLM(conversationHistory, PLAN_GENERATOR_PROMPT);
  
  if (planContent.startsWith("ERROR:")) {
      console.error(`\nError during plan generation: ${planContent}`)
      return; // Stop the process on error
  }

  try {
    fs.writeFileSync(OUTPUT_FILENAME, planContent);
    console.log(`Project plan successfully saved to ${OUTPUT_FILENAME}`);
    
    // --- Optional: Notify Orchestrator ---
    // Example: Send path or content to orchestrator if needed
    /*
    const orchestrator = agentApi.getOrchestratorInfo();
    if (orchestrator) {
        agentApi.sendMessage(orchestrator.id, { 
            notification: 'Project plan generated', 
            plan_file: OUTPUT_FILENAME,
            // plan_content: planContent // Alternatively send content directly
        }, 'notification');
        console.log(`Notified Orchestrator (${orchestrator.name}) about the generated plan.`);
    }
    */
    // --- End Optional Notification ---

  } catch (error) {
    console.error(`Error writing project plan file: ${error}`);
  }
}

// ====================================\n// AGENT LIFECYCLE & A2A HANDLING\n// ====================================

/**
 * Handles incoming A2A messages (optional for this agent's core task).
 * @param {object} message - The message object.
 */
async function handleMessage(message) {
  console.log(`\n[A2A] Received message from: ${message.sender_name} (${message.sender_id})`);
  console.log(`[A2A] Type: ${message.message_type}`);
  
  // Example: Handle a shutdown command from orchestrator
  if (message.message_type === 'control' && message.content?.command === 'shutdown') {
      console.log('[A2A] Received shutdown command. Exiting...');
      agentApi.requestShutdown();
      process.exit(0); // Force exit after shutdown request
  }
  
  // This agent primarily interacts with the user, so A2A handling might be minimal
  return null; 
}

// --- Helper functions (mostly from template) ---

function generateAgentId() {
  // Simple UUID generation for this example
  return crypto.randomUUID(); 
}

function createAgentCard() {
  const cardPath = path.join(__dirname, `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: { // Let other agents know how to potentially interact (optional)
        message_endpoint: agentApi.MESSAGES_PATH, // Use path from agentApi if available
        discovery_endpoint: agentApi.DISCOVERY_PATH 
    },
    author: "Generated",
    created_at: new Date().toISOString()
  };
  
  try {
      fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
      console.log(`Agent card created at ${cardPath}`);
      return cardPath;
  } catch(error) {
      console.error(`Failed to write agent card: ${error}`);
      return null;
  }
}

// --- Main Execution ---

async function main() {
  const cardPath = createAgentCard();
  if (!cardPath) {
      console.error("Could not create agent card. Exiting.");
      process.exit(1);
  }
  
  // Set the card path for agentApi to use
  agentApi.setAgentCardPath(cardPath);

  // Enable standard A2A shutdown handlers
  agentApi.enableShutdownHandlers();

  // Publish capabilities to the A2A network
  if (agentApi.publishCapabilities()) {
      console.log(`Agent ${AGENT_NAME} (${AGENT_UUID}) registered on the A2A network.`);
  } else {
      console.warn("Failed to publish capabilities to the A2A network.");
  }

  // Start the core requirement gathering process
  try {
      await gatherRequirements();
  } catch (error) {
      console.error("\nAn error occurred during requirement gathering:", error);
  } finally {
      rl.close(); // Close the readline interface
      console.log("Requirement gathering process finished.");
      // Optional: Automatically deregister or shut down
      // agentApi.deregisterAgent(AGENT_UUID); 
      // agentApi.requestShutdown();
      process.exit(0); // Exit the process cleanly
  }

  // Keep the agent running to potentially receive A2A messages (if not exiting above)
  // This part is similar to agent-template, listening for messages
  /* 
  console.log("Agent is running and listening for A2A messages (Press Ctrl+C to exit).");
  setInterval(async () => {
    if (agentApi.isShutdownRequested()) {
        console.log("Shutdown requested, exiting main loop.");
        process.exit(0);
    }
    
    const messages = agentApi.receiveMessages();
    for (const message of messages) {
      const response = await handleMessage(message);
      if (response) {
        agentApi.sendMessage(message.sender_id, response, 'response');
      }
    }
  }, 5000); // Check for messages every 5 seconds
  */
}

// Ensure necessary A2A directories exist before starting
if (agentApi.ensureDirsExist()) {
    main().catch(err => {
        console.error("Unhandled error in main execution:", err);
        process.exit(1);
    });
} else {
    console.error("Failed to initialize A2A directories. Agent cannot start.");
    process.exit(1);
} 