/**
 * Base Agent Class
 * Serves as the foundation for specialized MCP-compatible agents in the recruiter dashboard
 */

const MCPProtocolHandler = require('../core/mcp/protocolHandler');

class BaseAgent {
  constructor(config = {}) {
    this.id = config.id || `agent_${Date.now()}`;
    this.name = config.name || 'Base Agent';
    this.description = config.description || 'A base agent for the recruiter dashboard';
    this.protocolHandler = new MCPProtocolHandler({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      modelName: config.modelName || 'gpt-4o',
      deploymentName: config.deploymentName,
      isAzure: config.isAzure || false
    });
    
    this.systemPrompt = config.systemPrompt || this.getDefaultSystemPrompt();
    this.tools = config.tools || this.getDefaultTools();
  }
  
  /**
   * Get the default system prompt for this agent
   * @returns {string} Default system prompt
   */
  getDefaultSystemPrompt() {
    return `You are ${this.name}, an AI assistant specialized for recruiting workflows.
Your role is to help recruiters evaluate candidates efficiently and effectively.
Always be objective, fair, and avoid any bias in your assessments.`;
  }
  
  /**
   * Get the default tools for this agent
   * @returns {Array} Array of tool definitions
   */
  getDefaultTools() {
    return []; // Base agent has no specific tools by default
  }
  
  /**
   * Initialize a session for this agent
   * @returns {string} Session ID
   */
  initializeSession() {
    return this.protocolHandler.initializeSession(this.id);
  }
  
  /**
   * Process a message using this agent
   * @param {string} message User message to process
   * @returns {Object} Agent response
   */
  async processMessage(message) {
    return this.protocolHandler.processMessage(
      message,
      this.id,
      this.tools,
      this.systemPrompt
    );
  }
  
  /**
   * Handle tool calls from the assistant
   * @param {Object} assistantResponse Response from the assistant with tool calls
   * @returns {Promise<Object>} Updated assistant response after tool execution
   */
  async handleToolCalls(assistantResponse) {
    const toolCalls = this.protocolHandler.extractToolCalls(assistantResponse);
    
    if (!toolCalls) {
      return assistantResponse;
    }
    
    // Process each tool call
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => {
        try {
          const { name, arguments: args } = toolCall.function;
          const parsedArgs = JSON.parse(args);
          
          // Find the tool implementation
          const toolHandler = this.getToolHandler(name);
          if (!toolHandler) {
            throw new Error(`Tool ${name} not implemented`);
          }
          
          // Execute the tool
          return await toolHandler.call(this, parsedArgs);
        } catch (error) {
          console.error(`Error executing tool ${toolCall.function.name}:`, error);
          return { error: error.message };
        }
      })
    );
    
    // Send tool results back to the model
    return await this.protocolHandler.sendToolResults(toolCalls, toolResults);
  }
  
  /**
   * Get the handler function for a specific tool
   * @param {string} toolName Name of the tool
   * @returns {Function|null} Tool handler function or null if not found
   */
  getToolHandler(toolName) {
    // To be implemented by child classes
    return null;
  }
  
  /**
   * Clear conversation history
   */
  clearHistory() {
    this.protocolHandler.clearHistory();
  }
}

module.exports = BaseAgent;