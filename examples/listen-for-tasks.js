/**
 * Example: Listen for tasks and execute them
 */

const agentApi = require('../agent-api');

// Publish capabilities so other agents can discover us
agentApi.publishCapabilities();
const myInfo = agentApi.getAgentInfo();
console.log(`Agent ${myInfo.name} (${myInfo.id}) is listening for tasks...`);

// Simulate task execution
function executeTask(task) {
  console.log(`Executing task: ${task.type}`);
  
  // Simulate task execution delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Task ${task.type} completed!`);
      resolve({
        status: 'success',
        result: `Completed ${task.type} at ${new Date().toISOString()}`
      });
    }, 1500);
  });
}

// Main loop to check for messages
async function checkMessages() {
  const messages = agentApi.receiveMessages();
  
  for (const msg of messages) {
    console.log(`\nReceived message from ${msg.sender_name} (${msg.sender_id})`);
    console.log(`Type: ${msg.message_type}`);
    
    // If this is a task request
    if (msg.message_type === 'query' && msg.content.task) {
      console.log(`Task requested: ${msg.content.task.type}`);
      
      // Execute the task
      const result = await executeTask(msg.content.task);
      
      // Send the response back
      agentApi.respondToMessage(msg, {
        task_result: result,
        completed_at: new Date().toISOString()
      });
      
      console.log(`Response sent to ${msg.sender_name}`);
    }
  }
  
  // Check again after delay
  setTimeout(checkMessages, 5000);
}

// Start checking for messages
checkMessages();