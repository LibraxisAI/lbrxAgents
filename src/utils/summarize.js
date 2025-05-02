/**
 * Conversation Summarization Utilities
 * 
 * This module provides functions for summarizing conversation histories.
 */

const claude = require('@anthropic/sdk');

// Initialize Claude client
const claudeClient = new claude.Claude({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Summarize a conversation history
 * 
 * @param {Array} messages - Array of message objects with content and type
 * @param {Object} options - Options for summarization
 * @param {number} options.maxSummaryLength - Maximum length of the summary in characters (default: 2000)
 * @param {string} options.model - Claude model to use (default: "claude-3-haiku-20240307")
 * @returns {Promise<string>} - The generated summary
 */
async function summarizeConversation(messages, options = {}) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return '';
  }
  
  // Set default options
  const {
    maxSummaryLength = 2000,
    model = 'claude-3-haiku-20240307'
  } = options;
  
  try {
    // Format messages for Claude API
    const formattedMessages = messages.map(msg => {
      return {
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      };
    });
    
    // Prepare system prompt for summarization
    const systemPrompt = `You are a conversation summarizer. Your task is to create a concise but comprehensive summary of the conversation history provided. 
    
Guidelines:
- Focus on the most important topics, decisions, and information
- Highlight any conclusions or decisions reached
- Include any critical questions that were raised but not answered
- Keep the summary under ${maxSummaryLength} characters
- Write in an objective, factual tone
- Use past tense (e.g., "The user asked about...")
- Organize by topic rather than strictly chronologically
- Do not introduce new information or opinions not present in the original conversation`;
    
    // Request summarization from Claude
    const response = await claudeClient.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        ...formattedMessages,
        {
          role: 'user',
          content: 'Please summarize the above conversation according to the guidelines in your system prompt.'
        }
      ]
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    
    // Fallback to a basic summary if API call fails
    return createBasicSummary(messages);
  }
}

/**
 * Create a basic summary when the API call fails
 * 
 * @param {Array} messages - Array of message objects
 * @returns {string} - A basic summary
 */
function createBasicSummary(messages) {
  if (!messages || messages.length === 0) {
    return '';
  }
  
  // Extract key metrics
  const userMessages = messages.filter(msg => msg.type === 'user');
  const assistantMessages = messages.filter(msg => msg.type === 'assistant');
  const totalMessages = messages.length;
  const conversationStartTime = new Date(messages[0].timestamp).toLocaleString();
  const conversationEndTime = new Date(messages[messages.length - 1].timestamp).toLocaleString();
  
  // Create a basic summary with the available information
  return `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant messages. Started at ${conversationStartTime} and last updated at ${conversationEndTime}.`;
}

/**
 * Summarize key highlights from a conversation
 * 
 * @param {Array} messages - Array of message objects
 * @param {number} maxHighlights - Maximum number of highlights to extract (default: 3)
 * @returns {Promise<Array<string>>} - Array of highlight strings
 */
async function extractConversationHighlights(messages, maxHighlights = 3) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  
  try {
    // Format messages for Claude API
    const formattedMessages = messages.map(msg => {
      return {
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      };
    });
    
    // Prepare system prompt for highlights extraction
    const systemPrompt = `Extract the ${maxHighlights} most important highlights from this conversation. Each highlight should be a key point, decision, or insight that emerged. Format each highlight as a single sentence.`;
    
    // Request highlights from Claude
    const response = await claudeClient.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        ...formattedMessages,
        {
          role: 'user',
          content: 'Extract the key highlights from this conversation.'
        }
      ]
    });
    
    // Parse the response into an array of highlights
    const highlightsText = response.content[0].text;
    
    // Split by numbered list pattern (1., 2., etc.) or bullet points
    const highlights = highlightsText.split(/\n\s*[\d]+\.|\n\s*-/).filter(Boolean).map(h => h.trim());
    
    return highlights.slice(0, maxHighlights);
  } catch (error) {
    console.error('Error extracting conversation highlights:', error);
    return [];
  }
}

module.exports = {
  summarizeConversation,
  extractConversationHighlights
}; 