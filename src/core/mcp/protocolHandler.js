/**
 * Model Context Protocol Handler for Recruiter Dashboard
 * Handles communication with AI models using the Model Context Protocol
 */

const axios = require('axios');

class MCPProtocolHandler {
  constructor(config = {}) {
    this.endpoint = config.endpoint || process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.modelName = config.modelName || 'gpt-4o';
    this.sessionId = null;
    this.conversationHistory = {};
    this.deploymentName = config.deploymentName;
    this.isAzure = config.isAzure || false;
    
    if (!this.apiKey) {
      throw new Error('API key is required for MCP Protocol Handler');
    }
    
    // Configure API request based on Azure or OpenAI
    if (this.isAzure) {
      if (!this.deploymentName) {
        throw new Error('Deployment name is required for Azure OpenAI');
      }
      this.headers = {
        'api-key': this.apiKey,
        'Content-Type': 'application/json'
      };
    } else {
      this.headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };
    }
  }
  
  /**
   * Initialize a new conversation session
   * @param {string} agentId - Identifier for the agent type
   * @returns {string} - Session ID
   */
  initializeSession(agentId) {
    // Generate a random session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Initialize conversation history for this session
    this.conversationHistory[this.sessionId] = {
      agentId,
      messages: []
    };
    
    console.log(`Initialized session ${this.sessionId} for agent ${agentId}`);
    return this.sessionId;
  }
  
  /**
   * Process a message using the MCP
   * @param {string} message - User message to process
   * @param {string} agentId - Agent identifier
   * @param {Array} tools - Available tools for the agent
   * @param {string} systemPrompt - System prompt for the agent
   * @returns {Object} - Model response
   */
  async processMessage(message, agentId, tools = [], systemPrompt = '') {
    try {
      // Create or use session
      let sessionId = this.sessionId;
      if (!sessionId || !this.conversationHistory[sessionId] || this.conversationHistory[sessionId].agentId !== agentId) {
        sessionId = this.initializeSession(agentId);
      }
      
      // Get conversation history
      const history = this.conversationHistory[sessionId].messages;
      
      // Create messages array with system prompt if provided
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      // Add conversation history
      messages.push(...history);
      
      // Add current message
      messages.push({
        role: 'user',
        content: message
      });
      
      // Build request body based on whether we have tools
      const requestBody = {
        model: this.modelName,
        messages: messages,
        temperature: 0.7
      };
      
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }
      
      // Determine endpoint URL based on Azure or OpenAI
      const url = this.isAzure
        ? `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`
        : `${this.endpoint}/chat/completions`;
      
      // Send request
      const response = await axios.post(url, requestBody, {
        headers: this.headers
      });
      
      // Extract the assistant's response
      const assistantMessage = response.data.choices[0].message;
      
      // Add to conversation history
      this.conversationHistory[sessionId].messages.push({
        role: 'user',
        content: message
      });
      
      this.conversationHistory[sessionId].messages.push(assistantMessage);
      
      // Manage history length to prevent token limits
      if (this.conversationHistory[sessionId].messages.length > 10) {
        // Remove oldest user-assistant message pair
        this.conversationHistory[sessionId].messages.splice(0, 2);
      }
      
      return assistantMessage;
    } catch (error) {
      console.error('Error processing message with MCP:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Extract tool calls from assistant response
   * @param {Object} assistantResponse - The assistant's response
   * @returns {Array|null} - Array of tool calls or null
   */
  extractToolCalls(assistantResponse) {
    if (assistantResponse.tool_calls && assistantResponse.tool_calls.length > 0) {
      return assistantResponse.tool_calls;
    }
    return null;
  }
  
  /**
   * Send tool results back to the model
   * @param {string} sessionId - The session ID
   * @param {Array} toolCalls - The tool calls from the assistant
   * @param {Array} toolResults - The results from tool execution
   * @returns {Promise<Object>} - The updated assistant response
   */
  async sendToolResults(toolCalls, toolResults) {
    try {
      const sessionId = this.sessionId;
      if (!sessionId || !this.conversationHistory[sessionId]) {
        throw new Error('No active session found');
      }
      
      // Get conversation history
      const history = this.conversationHistory[sessionId].messages;
      
      // Add tool results as a new message
      const toolResultsMessage = {
        role: 'tool',
        tool_call_id: toolCalls[0].id, // This assumes a single tool call
        content: JSON.stringify(toolResults)
      };
      
      // Create messages array for the request
      const messages = [...history, toolResultsMessage];
      
      // Build request body
      const requestBody = {
        model: this.modelName,
        messages: messages,
        temperature: 0.7
      };
      
      // Determine endpoint URL based on Azure or OpenAI
      const url = this.isAzure
        ? `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2023-05-15`
        : `${this.endpoint}/chat/completions`;
      
      // Send request
      const response = await axios.post(url, requestBody, {
        headers: this.headers
      });
      
      // Extract the assistant's response
      const assistantMessage = response.data.choices[0].message;
      
      // Add to conversation history
      this.conversationHistory[sessionId].messages.push(toolResultsMessage);
      this.conversationHistory[sessionId].messages.push(assistantMessage);
      
      return assistantMessage;
    } catch (error) {
      console.error('Error sending tool results with MCP:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Clear conversation history for a session
   * @param {string} sessionId - The session ID to clear
   */
  clearHistory(sessionId = null) {
    sessionId = sessionId || this.sessionId;
    
    if (sessionId && this.conversationHistory[sessionId]) {
      const agentId = this.conversationHistory[sessionId].agentId;
      this.conversationHistory[sessionId] = {
        agentId,
        messages: []
      };
      console.log(`Cleared history for session ${sessionId}`);
    }
  }
}

module.exports = MCPProtocolHandler;