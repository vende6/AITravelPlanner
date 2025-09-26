/**
 * MCP Protocol Handler
 * Core implementation of the Model Context Protocol for agent interactions
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
require('dotenv').config();

class MCPProtocolHandler {
  constructor(config) {
    // Initialize Azure OpenAI client
    this.endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    this.deploymentId = config.deploymentId || process.env.AZURE_OPENAI_DEPLOYMENT_ID || 'gpt-4-turbo';
    
    // Use API key from config or environment variable
    const apiKey = config.apiKey || process.env.AZURE_OPENAI_API_KEY;
    this.client = new OpenAIClient(
      this.endpoint, 
      new AzureKeyCredential(apiKey)
    );
    
    // Initialize conversation context
    this.messages = [];
    this.agentContexts = new Map();
  }

  /**
   * Initialize a new conversation context
   */
  initializeContext() {
    this.messages = [];
    this.agentContexts = new Map();
    console.log('Conversation context initialized');
  }

  /**
   * Add a message to the conversation context
   * @param {string} role - Message role (system, user, assistant, tool)
   * @param {string} content - Message content
   * @param {string} agentId - Optional agent identifier
   */
  addMessage(role, content, agentId = null) {
    const message = {
      role,
      content
    };
    
    // Add agent identifier if provided
    if (agentId) {
      message.name = agentId;
      
      // Track the most recent message for each agent
      this.agentContexts.set(agentId, this.messages.length);
    }
    
    this.messages.push(message);
  }

  /**
   * Process a message through a specific agent
   * @param {string} query - User query to process
   * @param {string} agentId - Agent identifier
   * @param {Array} tools - Optional tools available to the agent
   * @returns {Promise<Object>} Processing result
   */
  async processMessage(query, agentId, tools = null) {
    try {
      // Check if we have a context for this agent
      const hasAgentContext = this.agentContexts.has(agentId);
      
      // Add the user query if not already present
      if (this.messages.length === 0 || this.messages[this.messages.length - 1].role !== 'user') {
        this.addMessage('user', query);
      }
      
      // Format messages for the MCP request
      const mcpMessages = this._formatMessagesForMCP(agentId);
      
      // Build request options
      const options = {
        maxTokens: 800,
        temperature: 0.7
      };
      
      // Add tools if provided
      if (tools && tools.length > 0) {
        options.tools = tools;
      }
      
      console.log(`Processing message with agent ${agentId}`);
      
      // Make the request to Azure OpenAI
      const result = await this.client.getChatCompletions(
        this.deploymentId,
        mcpMessages,
        options
      );
      
      // Extract the assistant's response
      const response = result.choices[0].message;
      
      // Add the response to the conversation context
      this.addMessage('assistant', response.content, agentId);
      
      // Return the full response for further processing
      return response;
    } catch (error) {
      console.error(`Error processing message with agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Extract tool calls from an assistant's response
   * @param {Object} response - Assistant's response
   * @returns {Array|null} Extracted tool calls or null if none
   */
  extractToolCalls(response) {
    if (response && response.toolCalls && response.toolCalls.length > 0) {
      return response.toolCalls;
    }
    return null;
  }

  /**
   * Format messages according to MCP conventions
   * @param {string} currentAgentId - The current agent context
   * @returns {Array} MCP formatted messages
   */
  _formatMessagesForMCP(currentAgentId) {
    return this.messages.map((msg, index) => {
      const formattedMsg = {
        role: msg.role,
        content: msg.content
      };
      
      // Add agent name if available
      if (msg.name) {
        formattedMsg.name = msg.name;
      }
      
      // Mark current agent context
      if (msg.name === currentAgentId) {
        formattedMsg.context = "current";
      }
      
      return formattedMsg;
    });
  }
}

module.exports = MCPProtocolHandler;