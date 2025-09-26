/**
 * Travel Planner Controller
 * Handles user requests and coordinates the multi-agent system
 */

const AgentOrchestrator = require('../agents/agentOrchestrator');
const FlightAgent = require('../agents/flightAgent');
const HotelAgent = require('../agents/hotelAgent');
const LocalExperienceAgent = require('../agents/localExperienceAgent');
const ItineraryAgent = require('../agents/itineraryAgent');
const AzureOpenAIService = require('../core/services/azureOpenAI');
const AzureAISearchService = require('../core/services/azureAISearch');

class TravelPlannerController {
  constructor(config) {
    this.config = config;
    
    // Initialize core services
    this.openAIService = new AzureOpenAIService(config.azureOpenAI);
    this.aiSearchService = new AzureAISearchService(config.azureAISearch);
    
    // Initialize agent orchestrator
    this.orchestrator = new AgentOrchestrator({
      mcp: config.mcp
    });
    
    // Initialize specialized agents
    this.flightAgent = new FlightAgent({
      aiSearchClient: this.aiSearchService
    });
    
    this.hotelAgent = new HotelAgent({
      aiSearchClient: this.aiSearchService
    });
    
    this.localExperienceAgent = new LocalExperienceAgent({
      aiSearchClient: this.aiSearchService
    });
    
    this.itineraryAgent = new ItineraryAgent({
      openAIService: this.openAIService
    });
    
    // Register agents with orchestrator
    this.orchestrator
      .registerAgent('flightAgent', this.flightAgent)
      .registerAgent('hotelAgent', this.hotelAgent)
      .registerAgent('localExperienceAgent', this.localExperienceAgent)
      .registerAgent('itineraryAgent', this.itineraryAgent);
      
    // Keep track of user session data
    this.sessions = new Map();
  }

  /**
   * Initialize a new user session
   * @param {string} userId - User identifier
   * @returns {string} Session identifier
   */
  initializeSession(userId) {
    const sessionId = `session-${Date.now()}-${userId.substring(0, 8)}`;
    
    this.sessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      travelPlan: this.orchestrator.initializeSession(),
      queryHistory: [],
      preferences: null
    });
    
    console.log(`Initialized new session ${sessionId} for user ${userId}`);
    return sessionId;
  }

  /**
   * Process a user query and update the travel plan
   * @param {string} sessionId - Session identifier
   * @param {string} query - User's query text
   * @returns {Promise<Object>} Processing result with updated plan and response
   */
  async processQuery(sessionId, query) {
    try {
      // Get session data or throw error if not found
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Add query to history
      session.queryHistory.push({
        timestamp: new Date(),
        query
      });
      
      // Process query through orchestrator
      const result = await this.orchestrator.processUserQuery(query);
      
      // Update session with new travel plan
      session.travelPlan = result.plan;
      
      // If this is the third query or more, analyze user preferences
      if (session.queryHistory.length >= 3 && !session.preferences) {
        const queries = session.queryHistory.map(item => item.query);
        
        // Run preference analysis asynchronously
        this.analyzeUserPreferences(sessionId, queries).catch(err => {
          console.error(`Error analyzing user preferences for session ${sessionId}:`, err);
        });
      }
      
      return {
        sessionId,
        response: result.response,
        plan: result.plan
      };
    } catch (error) {
      console.error(`Error processing query for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze user preferences based on query history
   * @param {string} sessionId - Session identifier
   * @param {Array} queries - Array of user queries
   * @returns {Promise<Object>} User preferences
   */
  async analyzeUserPreferences(sessionId, queries) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Use Azure OpenAI to analyze preferences
      const preferences = await this.openAIService.analyzeUserPreferences(queries);
      
      // Store preferences in session
      session.preferences = preferences;
      
      console.log(`Updated preferences for session ${sessionId}`);
      return preferences;
    } catch (error) {
      console.error(`Error analyzing preferences for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's current travel plan
   * @param {string} sessionId - Session identifier
   * @returns {Object} Current travel plan
   */
  getTravelPlan(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    return session.travelPlan;
  }

  /**
   * Generate a formatted travel itinerary document
   * @param {string} sessionId - Session identifier
   * @returns {Promise<string>} Formatted travel itinerary
   */
  async generateItineraryDocument(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Make sure we have an itinerary to format
      if (!session.travelPlan.itinerary) {
        throw new Error("No itinerary available in travel plan");
      }
      
      // Use Azure OpenAI to generate a formatted itinerary
      const summary = await this.openAIService.generateTravelSummary(session.travelPlan);
      
      return summary;
    } catch (error) {
      console.error(`Error generating itinerary for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations based on user preferences and travel plan
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Personalized recommendations
   */
  async getPersonalizedRecommendations(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Make sure we have preferences and destination
      if (!session.preferences) {
        throw new Error("No user preferences available");
      }
      
      let destination = null;
      
      if (session.travelPlan.flights && session.travelPlan.flights.destination) {
        destination = {
          name: session.travelPlan.flights.destination,
          type: "city"
        };
      } else if (session.travelPlan.hotels && session.travelPlan.hotels.location) {
        destination = {
          name: session.travelPlan.hotels.location,
          type: "city"
        };
      } else if (session.travelPlan.itinerary && session.travelPlan.itinerary.destination) {
        destination = {
          name: session.travelPlan.itinerary.destination,
          type: "city"
        };
      } else {
        throw new Error("No destination found in travel plan");
      }
      
      // Use OpenAI to generate personalized recommendations
      const recommendations = await this.openAIService.getPersonalizedRecommendations(
        session.preferences,
        destination
      );
      
      return recommendations;
    } catch (error) {
      console.error(`Error getting recommendations for session ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * End a user session and cleanup resources
   * @param {string} sessionId - Session identifier
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`Ending session ${sessionId} for user ${session.userId}`);
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = TravelPlannerController;