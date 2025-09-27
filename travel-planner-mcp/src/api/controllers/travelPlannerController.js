/**
 * Travel Planner Controller
 * Handles user requests and coordinates the multi-agent system
 */

const AgentOrchestrator = require('../../agents/agentOrchestrator');
const FlightAgent = require('../../agents/flightAgent');
const HotelAgent = require('../../agents/hotelAgent');
const LocalExperienceAgent = require('../../agents/localExperienceAgent');
const ItineraryAgent = require('../../agents/itineraryAgent');
const AzureOpenAIService = require('../../core/services/azureOpenAI');
const AzureAISearchService = require('../../core/services/azureAISearch');
const MCPProtocolHandler = require('../../core/mcp/protocolHandler');

class TravelPlannerController {
  constructor(config) {
    // Initialize services with configuration
    this.openAIService = new AzureOpenAIService(config);
    this.aiSearchService = new AzureAISearchService(config);
    
    // Initialize protocol handler
    this.protocolHandler = new MCPProtocolHandler({
      openAIService: this.openAIService
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
      aiSearchClient: this.aiSearchService
    });
    
    // Initialize agent orchestrator and register agents
    this.agentOrchestrator = new AgentOrchestrator({
      protocolHandler: this.protocolHandler
    })
      .registerAgent('flightAgent', this.flightAgent)
      .registerAgent('hotelAgent', this.hotelAgent)
      .registerAgent('localExperienceAgent', this.localExperienceAgent)
      .registerAgent('itineraryAgent', this.itineraryAgent);
      
    // Keep track of user session data
    this.sessions = new Map();
  }
  
  // Create a new session
  createSession = (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const sessionId = `session_${Date.now()}`;
      
      // Initialize a new session with the agent orchestrator
      this.agentOrchestrator.initializeSession();
      
      // Store session data
      this.sessions.set(sessionId, {
        userId,
        startTime: new Date(),
        lastActivity: new Date(),
        orchestrator: this.agentOrchestrator
      });
      
      return res.status(201).json({ sessionId });
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  };
  
  // End session and clean up resources
  endSession = (req, res) => {
    try {
      const { sessionId } = req.params;
      
      if (this.sessions.has(sessionId)) {
        // Clean up session resources
        this.sessions.delete(sessionId);
        return res.status(200).json({ message: 'Session ended successfully' });
      }
      
      return res.status(404).json({ error: 'Session not found' });
    } catch (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({ error: 'Failed to end session' });
    }
  };
  
  // Process user query through appropriate agents
  processQuery = async (req, res) => {
    try {
      const { sessionId, query } = req.body;
      
      if (!sessionId || !query) {
        return res.status(400).json({ error: 'Session ID and query are required' });
      }
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update last activity timestamp
      session.lastActivity = new Date();
      
      // Process query through agent orchestrator
      const result = await session.orchestrator.processUserQuery(query);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({ error: 'Failed to process query' });
    }
  };
  
  // Get personalized recommendations based on current plan
  getRecommendations = async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update last activity timestamp
      session.lastActivity = new Date();
      
      // Get current plan from orchestrator
      const currentPlan = session.orchestrator.currentPlan;
      
      // If we have the local experience agent, get personalized recommendations
      let recommendations = [];
      
      if (currentPlan && currentPlan.destination) {
        const location = currentPlan.destination || 
                      (currentPlan.flights ? currentPlan.flights.destination : null) ||
                      (currentPlan.hotels ? currentPlan.hotels.location : null);
                      
        if (location) {
          // Get recommendations from local experience agent
          const preferences = {
            location,
            interests: currentPlan.preferences?.interests || []
          };
          
          const recommendationResults = await this.localExperienceAgent.getLocalRecommendations(preferences);
          recommendations = recommendationResults?.activities || [];
        }
      }
      
      return res.status(200).json({ recommendations });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  };
  
  // Get or generate itinerary for current plan
  getItinerary = async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update last activity timestamp
      session.lastActivity = new Date();
      
      // Get current plan from orchestrator
      const currentPlan = session.orchestrator.currentPlan;
      
      let itinerary;
      
      if (currentPlan && currentPlan.itinerary) {
        // If we already have an itinerary, return it
        itinerary = currentPlan.itinerary;
      } else if (currentPlan && (currentPlan.flights || currentPlan.hotels)) {
        // Generate a default itinerary based on current plan
        itinerary = await this.itineraryAgent.generateDefaultItinerary(currentPlan);
        
        // Update the plan with the new itinerary
        session.orchestrator.currentPlan.itinerary = itinerary;
      } else {
        return res.status(400).json({ 
          error: 'Not enough information to generate an itinerary. Please add flight or hotel details first.' 
        });
      }
      
      return res.status(200).json({ itinerary });
    } catch (error) {
      console.error('Error getting itinerary:', error);
      return res.status(500).json({ error: 'Failed to get itinerary' });
    }
  };
  
  // Generate and return itinerary as PDF
  getItineraryPdf = async (req, res) => {
    try {
      const { itineraryId } = req.params;
      
      // In a full implementation, we would generate a PDF here
      // For now, we'll just return a placeholder message
      
      return res.status(501).json({ 
        error: 'PDF generation not implemented yet',
        message: 'This endpoint will generate and return a PDF of your itinerary in the future.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).json({ error: 'Failed to generate PDF' });
    }
  };
}

module.exports = TravelPlannerController;