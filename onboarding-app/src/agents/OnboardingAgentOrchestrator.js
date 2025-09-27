// OnboardingAgentOrchestrator.js
// This class orchestrates the specialized agents needed for the onboarding process

const mcpClient = require('../utils/mcpClient');

class OnboardingAgentOrchestrator {
  constructor() {
    this.agents = {
      cityGuide: null,
      recruitment: null,
      communityBuilder: null,
      assessmentAgent: null,
      musicAgent: null
    };
    
    this.sessionData = {
      userId: null,
      location: null,
      assessmentResults: {},
      reels: [],
      musicPreferences: {}
    };
  }

  async initialize(userId, initialLocation) {
    this.sessionData.userId = userId;
    this.sessionData.location = initialLocation;
    
    // Initialize agents
    await this.initializeAgents();
    
    return {
      status: 'initialized',
      activeAgents: Object.keys(this.agents).filter(agent => this.agents[agent] !== null)
    };
  }
  
  async initializeAgents() {
    // Dynamic import of agents
    const CityGuideAgent = require('./CityGuideAgent');
    const RecruitmentAgent = require('./RecruitmentAgent');
    const CommunityAgent = require('./CommunityAgent');
    const AssessmentAgent = require('./AssessmentAgent');
    const MusicAgent = require('./MusicAgent');
    
    this.agents.cityGuide = new CityGuideAgent();
    this.agents.recruitment = new RecruitmentAgent();
    this.agents.communityBuilder = new CommunityAgent();
    this.agents.assessmentAgent = new AssessmentAgent();
    this.agents.musicAgent = new MusicAgent();
  }
  
  async processUserInput(input, agentType = null) {
    // Route to specific agent or let the orchestrator decide
    if (agentType && this.agents[agentType]) {
      return await this.agents[agentType].processInput(input, this.sessionData);
    }
    
    // Determine which agent should handle this input
    const targetAgent = this.determineTargetAgent(input);
    return await targetAgent.processInput(input, this.sessionData);
  }
  
  determineTargetAgent(input) {
    // Simple keyword-based routing for now
    // In a production system, this would use NLP to better understand user intent
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('city') || inputLower.includes('guide') || inputLower.includes('explore')) {
      return this.agents.cityGuide;
    } else if (inputLower.includes('assessment') || inputLower.includes('test')) {
      return this.agents.assessmentAgent;
    } else if (inputLower.includes('music') || inputLower.includes('playlist') || inputLower.includes('sound')) {
      return this.agents.musicAgent;
    } else if (inputLower.includes('community') || inputLower.includes('connect') || inputLower.includes('network')) {
      return this.agents.communityBuilder;
    } else {
      // Default to recruitment agent for general queries
      return this.agents.recruitment;
    }
  }
  
  async recordReel(reelData) {
    // Add a new reel to the user's collection
    this.sessionData.reels.push({
      ...reelData,
      timestamp: new Date(),
      location: this.sessionData.location
    });
    
    // Notify community agent of new content
    await this.agents.communityBuilder.processNewContent(reelData);
    
    return {
      status: 'reel_recorded',
      reelCount: this.sessionData.reels.length
    };
  }
  
  async updateLocation(newLocation) {
    this.sessionData.location = newLocation;
    
    // Update city guide with new location
    await this.agents.cityGuide.updateLocation(newLocation);
    
    // Update music recommendations based on location
    await this.agents.musicAgent.updateLocationContext(newLocation);
    
    return {
      status: 'location_updated',
      newLocation
    };
  }
  
  async getPersonalizedRecommendations() {
    // Combine recommendations from different agents
    const cityRecs = await this.agents.cityGuide.getRecommendations(this.sessionData);
    const communityRecs = await this.agents.communityBuilder.getRecommendations(this.sessionData);
    const musicRecs = await this.agents.musicAgent.getRecommendations(this.sessionData);
    
    return {
      cityRecommendations: cityRecs,
      communityConnections: communityRecs,
      musicSuggestions: musicRecs
    };
  }
}

module.exports = OnboardingAgentOrchestrator;