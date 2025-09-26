/**
 * MCP Client Utility
 * Demonstrates how to make requests to the Model Context Protocol implementation
 */

const axios = require('axios');

class MCPClient {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000/api/travel';
    this.sessionId = null;
    this.apiKey = config.apiKey;
  }

  /**
   * Initialize a new session with the travel planner
   * @returns {Promise<string>} Session ID
   */
  async initializeSession() {
    try {
      const response = await axios.post(`${this.baseUrl}/session`, {}, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      this.sessionId = response.data.sessionId;
      console.log('Session initialized:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('Failed to initialize session:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a query to process through the MCP agents
   * @param {string} query - The user's travel query
   * @returns {Promise<Object>} Processing result
   */
  async sendQuery(query) {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call initializeSession first.');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/query`, {
        sessionId: this.sessionId,
        query: query
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Query failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get the current travel plan
   * @returns {Promise<Object>} Current travel plan
   */
  async getTravelPlan() {
    if (!this.sessionId) {
      throw new Error('Session not initialized. Call initializeSession first.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/plan/${this.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return response.data.travelPlan;
    } catch (error) {
      console.error('Failed to get travel plan:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Example usage
async function demonstrateMCPUsage() {
  // You would replace this with your actual API key
  const apiKey = 'your_api_key_here';
  
  const mcpClient = new MCPClient({
    baseUrl: 'http://localhost:3000/api/travel',
    apiKey: apiKey
  });

  try {
    // Step 1: Initialize a session
    await mcpClient.initializeSession();
    
    // Step 2: Send a travel query
    const flightQuery = "I want to book a flight from Seattle to San Francisco on December 15";
    const flightResult = await mcpClient.sendQuery(flightQuery);
    console.log('Flight query result:', flightResult);
    
    // Step 3: Send a follow-up query for hotel
    const hotelQuery = "Find me a hotel in downtown San Francisco for 3 nights";
    const hotelResult = await mcpClient.sendQuery(hotelQuery);
    console.log('Hotel query result:', hotelResult);
    
    // Step 4: Get the complete travel plan
    const travelPlan = await mcpClient.getTravelPlan();
    console.log('Complete travel plan:', travelPlan);
  } catch (error) {
    console.error('MCP demonstration failed:', error);
  }
}

// Uncomment to run the demonstration
// demonstrateMCPUsage();

module.exports = MCPClient;