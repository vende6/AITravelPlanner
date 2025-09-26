/**
 * Model Context Protocol (MCP) Handler
 * Manages the communication protocol between specialized AI agents
 */

const { DefaultAzureCredential } = require('@azure/identity');
const { OpenAIClient } = require('@azure/openai');

class MCPProtocolHandler {
  constructor(config) {
    this.config = config;
    this.credential = new DefaultAzureCredential();
    this.client = new OpenAIClient(config.endpoint, this.credential);
    this.deploymentId = config.deploymentId;
    this.messageHistory = [];
  }

  /**
   * Initializes a new conversation context
   */
  initializeContext() {
    this.messageHistory = [
      {
        role: "system",
        content: "You are part of a multi-agent travel planning system. Your goal is to collaborate with specialized agents to create an optimal travel itinerary."
      }
    ];
    return this.messageHistory;
  }

  /**
   * Adds a message to the conversation context
   * @param {string} role - The role of the message sender (system, user, assistant, agent)
   * @param {string} content - The message content
   * @param {string} agentId - Optional agent identifier for specialized agents
   */
  addMessage(role, content, agentId = null) {
    const message = { role, content };
    
    // Add agent metadata if provided
    if (agentId) {
      message.metadata = { agent_id: agentId };
    }
    
    this.messageHistory.push(message);
    return message;
  }

  /**
   * Processes a message through Azure OpenAI with MCP formatting
   * @param {string} content - The message content to process
   * @param {string} agentId - The agent identifier
   * @param {Object} tools - Optional tools available to the agent
   * @returns {Promise<Object>} The response from the model
   */
  async processMessage(content, agentId, tools = null) {
    this.addMessage("user", content);
    
    const messages = this.formatMessagesForMCP(this.messageHistory, agentId);
    
    const options = {
      maxTokens: 800,
      temperature: 0.7
    };
    
    if (tools) {
      options.tools = tools;
    }
    
    try {
      const result = await this.client.getChatCompletions(
        this.deploymentId,
        messages,
        options
      );
      
      const response = result.choices[0].message;
      this.addMessage("assistant", response.content, agentId);
      
      return response;
    } catch (error) {
      console.error('Error processing message with MCP:', error);
      throw error;
    }
  }
  
  /**
   * Formats messages according to MCP conventions
   * @param {Array} messages - The message history
   * @param {string} currentAgentId - The current active agent ID
   * @returns {Array} MCP formatted messages
   */
  formatMessagesForMCP(messages, currentAgentId) {
    return messages.map(msg => {
      const formattedMsg = {
        role: msg.role,
        content: msg.content
      };
      
      // Add MCP-specific metadata
      if (msg.metadata && msg.metadata.agent_id) {
        formattedMsg.name = msg.metadata.agent_id;
      }
      
      // Mark current agent context
      if (msg.metadata && msg.metadata.agent_id === currentAgentId) {
        formattedMsg.context = "current";
      }
      
      return formattedMsg;
    });
  }
  
  /**
   * Extracts tool calls from a response if present
   * @param {Object} response - The model response
   * @returns {Array|null} Tool calls or null if none
   */
  extractToolCalls(response) {
    return response.tool_calls || null;
  }
}

module.exports = MCPProtocolHandler;