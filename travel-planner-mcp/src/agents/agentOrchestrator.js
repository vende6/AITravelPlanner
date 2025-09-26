/**
 * Agent Orchestrator
 * Coordinates communication between specialized travel planning agents
 */

const MCPProtocolHandler = require('../core/mcp/protocolHandler');

class AgentOrchestrator {
  constructor(config) {
    this.config = config;
    this.protocolHandler = new MCPProtocolHandler(config.mcp);
    this.agents = new Map();
    this.currentPlan = {
      flights: null,
      hotels: null,
      activities: null,
      itinerary: null,
      budget: {
        total: 0,
        flights: 0,
        hotels: 0,
        activities: 0
      }
    };
  }

  /**
   * Registers a specialized agent with the orchestrator
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} agent - The agent implementation
   */
  registerAgent(agentId, agent) {
    this.agents.set(agentId, agent);
    console.log(`Agent registered: ${agentId}`);
    return this;
  }

  /**
   * Initializes a new travel planning session
   */
  initializeSession() {
    this.protocolHandler.initializeContext();
    this.currentPlan = {
      flights: null,
      hotels: null,
      activities: null,
      itinerary: null,
      budget: {
        total: 0,
        flights: 0,
        hotels: 0,
        activities: 0
      }
    };
    
    console.log('New travel planning session initialized');
    return this.currentPlan;
  }

  /**
   * Processes a user query through the appropriate agent(s)
   * @param {string} query - User's travel query/request
   * @returns {Promise<Object>} The updated travel plan
   */
  async processUserQuery(query) {
    // Add the initial user query to the conversation context
    this.protocolHandler.addMessage('user', query);
    
    // Determine which agents need to be involved based on the query
    const agentsToInvoke = this.determineRequiredAgents(query);
    
    // Process the query through each required agent in sequence
    for (const agentId of agentsToInvoke) {
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        console.warn(`Agent ${agentId} not found, skipping`);
        continue;
      }
      
      try {
        // Create agent-specific context with access to relevant parts of the current plan
        const agentContext = this.createAgentContext(agentId);
        
        // Process the query through the agent
        const agentResult = await agent.process(query, agentContext, this.protocolHandler);
        
        // Update the travel plan with the agent's results
        this.updatePlan(agentId, agentResult);
        
        // Add the agent's response to the global conversation context
        this.protocolHandler.addMessage('assistant', 
          `[${agentId}] ${JSON.stringify(agentResult.summary)}`, agentId);
          
      } catch (error) {
        console.error(`Error processing query with agent ${agentId}:`, error);
        this.protocolHandler.addMessage('system', 
          `Agent ${agentId} encountered an error: ${error.message}`);
      }
    }
    
    // Generate a consolidated response using the itinerary agent
    const finalResponse = await this.generateConsolidatedResponse();
    
    return {
      plan: this.currentPlan,
      response: finalResponse
    };
  }

  /**
   * Determines which specialized agents should be involved based on the query
   * @param {string} query - User's travel query
   * @returns {Array<string>} List of agent IDs to invoke
   */
  determineRequiredAgents(query) {
    const agentsToInvoke = [];
    const query_lower = query.toLowerCase();
    
    // Simple keyword-based agent selection
    if (query_lower.includes('flight') || query_lower.includes('air') || 
        query_lower.includes('travel to')) {
      agentsToInvoke.push('flightAgent');
    }
    
    if (query_lower.includes('hotel') || query_lower.includes('stay') || 
        query_lower.includes('accommodation')) {
      agentsToInvoke.push('hotelAgent');
    }
    
    if (query_lower.includes('activity') || query_lower.includes('visit') || 
        query_lower.includes('see') || query_lower.includes('experience')) {
      agentsToInvoke.push('localExperienceAgent');
    }
    
    // Itinerary agent is always included to integrate information
    agentsToInvoke.push('itineraryAgent');
    
    return agentsToInvoke;
  }

  /**
   * Creates a context object with relevant data for a specific agent
   * @param {string} agentId - The agent identifier
   * @returns {Object} Agent-specific context
   */
  createAgentContext(agentId) {
    // Base context with the full current plan
    const context = {
      currentPlan: this.currentPlan
    };
    
    // Add agent-specific context enhancements
    switch (agentId) {
      case 'flightAgent':
        context.previousFlights = this.currentPlan.flights;
        break;
      case 'hotelAgent':
        context.previousHotels = this.currentPlan.hotels;
        context.flightInfo = this.currentPlan.flights; // Hotels need flight info for dates
        break;
      case 'localExperienceAgent':
        context.destination = this.currentPlan.flights ? 
          this.currentPlan.flights.destination : null;
        context.hotelLocation = this.currentPlan.hotels ? 
          this.currentPlan.hotels.location : null;
        break;
      case 'itineraryAgent':
        // Itinerary agent gets everything
        break;
    }
    
    return context;
  }

  /**
   * Updates the current travel plan with agent-specific results
   * @param {string} agentId - The agent identifier
   * @param {Object} result - The agent processing result
   */
  updatePlan(agentId, result) {
    switch (agentId) {
      case 'flightAgent':
        this.currentPlan.flights = result.flights;
        this.currentPlan.budget.flights = result.cost || 0;
        break;
      case 'hotelAgent':
        this.currentPlan.hotels = result.hotels;
        this.currentPlan.budget.hotels = result.cost || 0;
        break;
      case 'localExperienceAgent':
        this.currentPlan.activities = result.activities;
        this.currentPlan.budget.activities = result.cost || 0;
        break;
      case 'itineraryAgent':
        this.currentPlan.itinerary = result.itinerary;
        // Update total budget
        this.currentPlan.budget.total = 
          this.currentPlan.budget.flights + 
          this.currentPlan.budget.hotels + 
          this.currentPlan.budget.activities;
        break;
    }
    
    return this.currentPlan;
  }

  /**
   * Generates a consolidated response using the itinerary agent
   * @returns {Promise<string>} Consolidated response for the user
   */
  async generateConsolidatedResponse() {
    const itineraryAgent = this.agents.get('itineraryAgent');
    
    if (!itineraryAgent) {
      return "I've processed your travel request, but I'm unable to generate a complete itinerary at the moment.";
    }
    
    try {
      const summarizePrompt = "Please provide a friendly summary of the current travel plan.";
      const response = await itineraryAgent.process(
        summarizePrompt, 
        { currentPlan: this.currentPlan }, 
        this.protocolHandler
      );
      
      return response.summary;
    } catch (error) {
      console.error('Error generating consolidated response:', error);
      return `I've updated your travel plan with the requested information. Your plan now includes ${
        this.currentPlan.flights ? 'flight arrangements' : ''
      }${
        this.currentPlan.hotels ? ', hotel bookings' : ''
      }${
        this.currentPlan.activities ? ', and local activities' : ''
      }.`;
    }
  }
}

module.exports = AgentOrchestrator;