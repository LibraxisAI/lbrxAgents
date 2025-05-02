/**
 * MCP Memory Server Fetch Utilities
 * 
 * This module provides functions for fetching data from the MCP Memory server.
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const MCP_MEMORY_PORT = 23010; // Default port for MCP Memory server
const DEFAULT_SEARCH_LIMIT = 5;

/**
 * Fetch data from Memory server based on a query
 * 
 * @param {string} query - The search query
 * @param {string} namespace - Optional namespace prefix for the query
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Array of relevant memory objects
 */
async function fetchFromMemory(query, namespace = '', limit = DEFAULT_SEARCH_LIMIT) {
  if (!query) {
    throw new Error('Query is required for memory fetch');
  }

  const searchQuery = namespace ? `${namespace}:${query}` : query;
  
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/search_nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory server responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract and format the memories from the response
    return formatMemoryResults(data, limit);
  } catch (error) {
    console.error('Error fetching from memory server:', error.message);
    throw error;
  }
}

/**
 * Fetch specific entities by name
 * 
 * @param {Array<string>} entityNames - Array of entity names to fetch
 * @returns {Promise<Array>} - Array of entity objects
 */
async function fetchEntitiesByName(entityNames) {
  if (!entityNames || !Array.isArray(entityNames) || entityNames.length === 0) {
    throw new Error('Valid array of entity names is required');
  }
  
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/open_nodes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        names: entityNames
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory server responded with ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching entities by name:', error.message);
    throw error;
  }
}

/**
 * Get the entire knowledge graph from memory
 * 
 * @returns {Promise<Object>} - The complete knowledge graph
 */
async function getFullKnowledgeGraph() {
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/read_graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        random_string: uuidv4()
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory server responded with ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching knowledge graph:', error.message);
    throw error;
  }
}

/**
 * Format memory search results for use in prompts
 * 
 * @param {Object} data - Raw response from memory server
 * @param {number} limit - Maximum number of results to include
 * @returns {Array<string>} - Formatted memory results
 */
function formatMemoryResults(data, limit) {
  if (!data || !data.entities) {
    return [];
  }
  
  // Sort entities by relevance (assuming results are already sorted by relevance)
  const relevantEntities = data.entities.slice(0, limit);
  
  // Format the memories for inclusion in a prompt
  return relevantEntities.map(entity => {
    // Get entity observations and format them
    const observations = Array.isArray(entity.observations) 
      ? entity.observations.join('\n- ')
      : 'No observations';
    
    return `Entity: ${entity.name} (${entity.entityType})\nObservations:\n- ${observations}`;
  });
}

/**
 * Check if the MCP Memory server is running
 * 
 * @returns {Promise<boolean>} - True if server is running
 */
async function isMemoryServerRunning() {
  try {
    const response = await fetch(`http://localhost:${MCP_MEMORY_PORT}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

module.exports = {
  fetchFromMemory,
  fetchEntitiesByName,
  getFullKnowledgeGraph,
  isMemoryServerRunning
}; 