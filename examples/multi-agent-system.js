/**
 * Multi-Agent System Example
 * 
 * This example demonstrates how to set up a system of multiple agents
 * that can communicate with each other using the A2A protocol.
 */

const a2a = require('../src/index');
const path = require('path');
const fs = require('fs');

// Set base path for all agents to ensure they can see each other's messages
const BASE_PATH = path.join(process.cwd(), 'tmp', 'multi-agent-demo');

// Create directories if they don't exist
if (!fs.existsSync(BASE_PATH)) {
  fs.mkdirSync(BASE_PATH, { recursive: true });
  fs.mkdirSync(path.join(BASE_PATH, 'messages'), { recursive: true });
  fs.mkdirSync(path.join(BASE_PATH, 'discovery'), { recursive: true });
}

// Configure the protocol to use our custom path
a2a.configure(BASE_PATH);

// Base Agent class that all our agents will extend
class BaseAgent {
  constructor(name, description, capabilities) {
    // Create the agent
    this.agent = a2a.createAgent({
      name,
      description,
      capabilities
    });
    
    this.id = this.agent.id;
    this.name = name;
    this.running = false;
    
    console.log(`Agent ${this.name} (${this.id}) created`);
  }
  
  // Start the agent's main loop
  start() {
    if (this.running) return;
    
    this.running = true;
    console.log(`Agent ${this.name} started`);
    
    // Start the message processing loop
    this.processLoop();
  }
  
  // Stop the agent
  stop() {
    this.running = false;
    console.log(`Agent ${this.name} stopped`);
  }
  
  // The main processing loop - should be overridden by subclasses
  async processLoop() {
    while (this.running) {
      try {
        // Check for messages
        const messages = this.agent.receiveMessages(true);
        
        if (messages.length > 0) {
          console.log(`[${this.name}] Received ${messages.length} messages`);
          
          // Process each message
          for (const message of messages) {
            await this.handleMessage(message);
          }
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[${this.name}] Error in process loop:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  // Handle an individual message - should be overridden by subclasses
  async handleMessage(message) {
    console.log(`[${this.name}] Message from ${message.sender_name}: ${JSON.stringify(message.content)}`);
    
    // Default behavior: just acknowledge receipt
    this.agent.respondToMessage(message, {
      text: `Message received by ${this.name}`,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send a message to another agent
  sendMessage(targetId, content, type = 'query') {
    return this.agent.sendMessage(targetId, content, type);
  }
  
  // Discover other agents
  discoverAgents() {
    return this.agent.discoverAgents()
      .filter(a => a.id !== this.id); // Exclude self
  }
}

// Coordinator agent that manages tasks and delegates to other agents
class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      'Coordinator',
      'Manages tasks and coordinates other agents',
      ['coordination', 'planning', 'delegation']
    );
    
    this.workers = new Map(); // Track worker agents
  }
  
  // Override to add special handling for different message types
  async handleMessage(message) {
    const { content, message_type, sender_id } = message;
    
    if (message_type === 'query' && content.type === 'register_worker') {
      // A worker agent is registering with us
      this.registerWorker(sender_id, content.capabilities);
      
      this.agent.respondToMessage(message, {
        text: 'Worker registered successfully',
        status: 'success',
        coordinator_id: this.id
      });
    }
    else if (message_type === 'query' && content.type === 'task_request') {
      // Someone wants us to perform a task
      await this.handleTaskRequest(message);
    }
    else if (message_type === 'response' && content.task_result) {
      // A worker is reporting task results
      console.log(`[${this.name}] Received task result from ${message.sender_name}: ${JSON.stringify(content.task_result)}`);
      
      // Here we would forward the result to whoever requested the task
    }
    else {
      // Default handling for other messages
      await super.handleMessage(message);
    }
  }
  
  // Register a worker agent
  registerWorker(workerId, capabilities) {
    this.workers.set(workerId, {
      id: workerId,
      capabilities: capabilities || [],
      lastSeen: new Date()
    });
    
    console.log(`[${this.name}] Registered worker ${workerId} with capabilities: ${capabilities?.join(', ') || 'none'}`);
  }
  
  // Handle a task request by finding a suitable worker
  async handleTaskRequest(message) {
    const { content, sender_id } = message;
    const { task } = content;
    
    console.log(`[${this.name}] Received task request: ${task.type}`);
    
    // Find a worker that can handle this task
    const suitableWorker = this.findSuitableWorker(task);
    
    if (suitableWorker) {
      // Delegate the task to the worker
      console.log(`[${this.name}] Delegating task to worker ${suitableWorker.id}`);
      
      const delegateResult = this.sendMessage(
        suitableWorker.id,
        {
          type: 'task_assignment',
          task: task,
          original_requester: sender_id
        },
        'action'
      );
      
      // Let the requester know we're working on it
      this.agent.respondToMessage(message, {
        text: 'Task accepted and delegated',
        status: 'in_progress',
        assigned_worker: suitableWorker.id
      });
    } 
    else {
      // No suitable worker found
      console.log(`[${this.name}] No suitable worker found for task ${task.type}`);
      
      this.agent.respondToMessage(message, {
        text: 'Cannot process task - no suitable worker available',
        status: 'rejected',
        error: 'no_suitable_worker'
      });
    }
  }
  
  // Find a worker that can handle a specific task
  findSuitableWorker(task) {
    // This is a very simple implementation - in a real system we would
    // have more sophisticated matching logic based on capabilities,
    // current load, etc.
    
    for (const worker of this.workers.values()) {
      // If the worker has the required capability, choose it
      if (worker.capabilities.includes(task.type) ||
          worker.capabilities.includes('general_tasks')) {
        return worker;
      }
    }
    
    return null; // No suitable worker found
  }
}

// Worker agent that performs specific tasks
class WorkerAgent extends BaseAgent {
  constructor(name, capabilities) {
    super(
      name,
      `Worker agent that handles: ${capabilities.join(', ')}`,
      capabilities
    );
    
    this.coordinatorId = null;
  }
  
  // Override to handle task assignments
  async handleMessage(message) {
    const { content, message_type, sender_id } = message;
    
    if (message_type === 'action' && content.type === 'task_assignment') {
      // We've been assigned a task
      await this.executeTask(content.task, message, content.original_requester);
    }
    else if (message_type === 'response' && content.status === 'success' && content.coordinator_id) {
      // Our registration with a coordinator was successful
      this.coordinatorId = content.coordinator_id;
      console.log(`[${this.name}] Registered with coordinator ${this.coordinatorId}`);
    }
    else {
      // Default handling
      await super.handleMessage(message);
    }
  }
  
  // Execute a task and report results
  async executeTask(task, originalMessage, requesterId) {
    console.log(`[${this.name}] Executing task: ${task.type}`);
    
    try {
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a result
      const result = {
        type: task.type,
        success: true,
        timestamp: new Date().toISOString(),
        data: `Result for task ${task.type} with input ${JSON.stringify(task.input || {})}`
      };
      
      // Respond to the original message
      this.agent.respondToMessage(originalMessage, {
        text: 'Task completed successfully',
        task_result: result
      });
      
      // Also notify the original requester if different
      if (requesterId && requesterId !== originalMessage.sender_id) {
        this.sendMessage(
          requesterId,
          {
            text: 'Your requested task is complete',
            task_result: result
          },
          'notification'
        );
      }
      
      console.log(`[${this.name}] Task ${task.type} completed`);
    } catch (error) {
      console.error(`[${this.name}] Error executing task:`, error);
      
      // Report failure
      this.agent.respondToMessage(originalMessage, {
        text: 'Task failed',
        error: error.message || 'Unknown error',
        status: 'failed'
      });
    }
  }
  
  // Register with a coordinator
  registerWithCoordinator(coordinatorId) {
    console.log(`[${this.name}] Registering with coordinator ${coordinatorId}`);
    
    return this.sendMessage(
      coordinatorId,
      {
        type: 'register_worker',
        capabilities: this.agent.capabilities,
        worker_name: this.name,
        worker_id: this.id
      },
      'query'
    );
  }
}

// Client agent that requests tasks
class ClientAgent extends BaseAgent {
  constructor() {
    super(
      'Client',
      'Client that requests tasks from the coordinator',
      ['task_requests']
    );
    
    this.coordinatorId = null;
    this.taskResults = new Map();
  }
  
  // Override to handle task results
  async handleMessage(message) {
    const { content, message_type } = message;
    
    if ((message_type === 'response' || message_type === 'notification') && content.task_result) {
      // We received a task result
      const result = content.task_result;
      
      console.log(`[${this.name}] Received task result: ${JSON.stringify(result)}`);
      this.taskResults.set(result.type, result);
      
      // Acknowledge receipt
      if (message_type === 'notification') {
        this.agent.respondToMessage(message, {
          text: 'Result received',
          status: 'acknowledged'
        });
      }
    }
    else {
      await super.handleMessage(message);
    }
  }
  
  // Request a task from the coordinator
  requestTask(taskType, input = {}) {
    if (!this.coordinatorId) {
      console.error(`[${this.name}] Cannot request task - no coordinator set`);
      return false;
    }
    
    console.log(`[${this.name}] Requesting task ${taskType}`);
    
    return this.sendMessage(
      this.coordinatorId,
      {
        type: 'task_request',
        task: {
          type: taskType,
          input,
          requested_at: new Date().toISOString()
        }
      },
      'query'
    );
  }
  
  // Set the coordinator to use
  setCoordinator(coordinatorId) {
    this.coordinatorId = coordinatorId;
    console.log(`[${this.name}] Set coordinator to ${coordinatorId}`);
  }
}

// Run the multi-agent system demo
async function runDemo() {
  console.log("Starting multi-agent system demo...");
  
  // Create our agents
  const coordinator = new CoordinatorAgent();
  const dataWorker = new WorkerAgent('DataWorker', ['data_processing', 'analytics']);
  const codeWorker = new WorkerAgent('CodeWorker', ['code_generation', 'code_review']);
  const client = new ClientAgent();
  
  // Start all agents
  coordinator.start();
  dataWorker.start();
  codeWorker.start();
  client.start();
  
  // Wait for agents to register their capabilities
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Let the client discover the coordinator
  const agents = client.discoverAgents();
  const discoveredCoordinator = agents.find(a => a.name === 'Coordinator');
  
  if (discoveredCoordinator) {
    client.setCoordinator(discoveredCoordinator.id);
  } else {
    console.error("Client could not discover the coordinator!");
    return;
  }
  
  // Register workers with coordinator
  dataWorker.registerWithCoordinator(coordinator.id);
  codeWorker.registerWithCoordinator(coordinator.id);
  
  // Wait for registration to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Client requests tasks
  client.requestTask('data_processing', { dataset: 'users.csv', operation: 'filter' });
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Request another task
  client.requestTask('code_generation', { language: 'javascript', type: 'api' });
  
  // Let the demo run for a while
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Stop all agents
  coordinator.stop();
  dataWorker.stop();
  codeWorker.stop();
  client.stop();
  
  console.log("Demo completed!");
  
  // Show the results the client received
  console.log("\nTask results received by client:");
  for (const [taskType, result] of client.taskResults.entries()) {
    console.log(`- ${taskType}: ${JSON.stringify(result)}`);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

// Export the agent classes for reuse
module.exports = {
  BaseAgent,
  CoordinatorAgent,
  WorkerAgent,
  ClientAgent,
  runDemo
};