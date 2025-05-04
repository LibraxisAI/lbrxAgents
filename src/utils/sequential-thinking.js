/**
 * Sequential Thinking MCP Server Utilities
 * 
 * This module provides functions for interacting with the Sequential Thinking MCP server.
 * It helps break down complex problems into structured thought sequences.
 */

const fetch = require('node-fetch');

// Configuration
const MCP_SEQUENTIAL_THINKING_PORT = 23015; // Default port for Sequential Thinking MCP server

/**
 * Request sequential thinking analysis for a complex query
 * 
 * @param {string} query - The query or problem to analyze
 * @param {number} maxThoughts - Maximum number of thought steps to generate (default: 8)
 * @returns {Promise<string>} - The structured sequential thinking result
 */
async function requestSequentialThinking(query, maxThoughts = 8) {
  if (!query) {
    throw new Error('Query is required for sequential thinking');
  }
  
  let thinking = [];
  let thoughtNumber = 1;
  let totalThoughts = maxThoughts;
  let nextThoughtNeeded = true;
  
  // Continue requesting thoughts until either we reach the maximum or no more are needed
  while (nextThoughtNeeded && thoughtNumber <= totalThoughts) {
    try {
      const response = await fetch(`http://localhost:${MCP_SEQUENTIAL_THINKING_PORT}/sequentialthinking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thought: thoughtNumber === 1 
            ? `I need to analyze the following query: ${query}` 
            : undefined,
          nextThoughtNeeded: true,
          thoughtNumber,
          totalThoughts,
          isRevision: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Sequential Thinking server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update parameters for next request
      nextThoughtNeeded = data.nextThoughtNeeded;
      thoughtNumber = data.thoughtNumber + 1;
      totalThoughts = data.totalThoughts;
      
      // Store the thought
      thinking.push(`Thought ${data.thoughtNumber}: ${data.thought}`);
      
      // If no more thoughts needed, break the loop
      if (!nextThoughtNeeded) {
        break;
      }
    } catch (error) {
      console.error('Error requesting sequential thinking:', error.message);
      throw error;
    }
  }
  
  // Format the complete thinking sequence
  return formatThinkingSequence(thinking, query);
}

/**
 * Format the thinking sequence for inclusion in a prompt
 * 
 * @param {Array<string>} thoughts - Array of thought strings
 * @param {string} query - The original query
 * @returns {string} - Formatted thinking sequence
 */
function formatThinkingSequence(thoughts, query) {
  if (!thoughts || thoughts.length === 0) {
    return '';
  }
  
  return `
Sequential analysis of: "${query}"

${thoughts.join('\n\n')}

Based on the above analysis, I'll now provide a well-reasoned response.
`.trim();
}

/**
 * Check if the Sequential Thinking server is running
 * 
 * @returns {Promise<boolean>} - True if server is running
 */
async function isSequentialThinkingServerRunning() {
  try {
    const response = await fetch(`http://localhost:${MCP_SEQUENTIAL_THINKING_PORT}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

module.exports = {
  requestSequentialThinking,
  isSequentialThinkingServerRunning
}; 