// CityGuideAgent.js
// This agent provides guidance and information about sustainable cities

const { DefaultAzureCredential } = require('@azure/identity');
const { OpenAIClient } = require('@azure/openai');

class CityGuideAgent {
  constructor() {
    this.name = 'CityGuideAgent';
    this.currentLocation = null;
    this.sustainableCities = [
      'Copenhagen', 'Amsterdam', 'Stockholm', 'Singapore', 'Portland',
      'San Francisco', 'Vancouver', 'Helsinki', 'Oslo', 'Zurich'
    ];
    
    // Initialize Azure OpenAI client
    this.initAzureServices();
  }
  
  async initAzureServices() {
    try {
      // Using Azure OpenAI for city recommendations and insights
      const credential = new DefaultAzureCredential();
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      
      this.openAIClient = new OpenAIClient(endpoint, credential);
      this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
      
      console.log('CityGuideAgent: Azure OpenAI service initialized');
    } catch (error) {
      console.error('Failed to initialize Azure services:', error);
    }
  }

  async updateLocation(location) {
    this.currentLocation = location;
    console.log(`CityGuideAgent: Location updated to ${location}`);
    
    // Pre-fetch some data about this location if it's a sustainable city
    if (this.sustainableCities.includes(location)) {
      await this.fetchSustainabilityData(location);
    }
    
    return {
      status: 'location_updated',
      isSustainableCity: this.sustainableCities.includes(location)
    };
  }
  
  async fetchSustainabilityData(city) {
    // In a production app, this would connect to a real database or API
    // For now we'll simulate pre-fetching data about sustainable features
    console.log(`CityGuideAgent: Pre-fetching sustainability data for ${city}`);
  }
  
  async processInput(input, sessionData) {
    const location = sessionData.location || this.currentLocation;
    
    // Use Azure OpenAI to generate a response about the city
    try {
      const prompt = `
        As a city guide specializing in sustainable cities, provide information about ${location}.
        Focus on: 
        - Sustainable transportation options
        - Green spaces and eco-friendly attractions
        - Community initiatives for sustainability
        - Local eco-friendly businesses
        
        User query: ${input}
        
        Provide a concise, helpful response that guides the user to explore the sustainable aspects of ${location}.
      `;
      
      const result = await this.openAIClient.getChatCompletions(
        this.deploymentName,
        [
          { role: "system", content: "You are a knowledgeable guide for sustainable cities." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 300 }
      );
      
      return {
        type: 'city_guide',
        content: result.choices[0].message.content,
        location: location,
        sustainabilityScore: this.getSustainabilityScore(location)
      };
    } catch (error) {
      console.error('Error generating city guide response:', error);
      return {
        type: 'city_guide',
        content: `I'd be happy to tell you about ${location}, but I'm having trouble accessing the latest information. Please try again later.`,
        location: location
      };
    }
  }
  
  getSustainabilityScore(city) {
    // Placeholder for a real sustainability scoring system
    const scores = {
      'Copenhagen': 94,
      'Amsterdam': 91,
      'Stockholm': 89,
      'Singapore': 86,
      'Portland': 83,
      'San Francisco': 82,
      'Vancouver': 85,
      'Helsinki': 88,
      'Oslo': 90,
      'Zurich': 87
    };
    
    return scores[city] || 70; // Default score for cities not in our database
  }
  
  async getRecommendations(sessionData) {
    const location = sessionData.location || this.currentLocation;
    
    // Get personalized recommendations based on user's assessment results
    const personalityTraits = sessionData.assessmentResults.personality || [];
    
    // These would be generated dynamically based on the user's traits and location
    return {
      sustainableAttractions: [
        {
          name: `Green Park in ${location}`,
          description: 'A beautiful park with sustainable landscaping',
          suitability: 'Perfect for nature lovers and those who value tranquility',
          coordinates: { lat: 0, lng: 0 } // Placeholder coordinates
        },
        {
          name: `Eco Museum in ${location}`,
          description: 'Interactive exhibits on sustainability and climate solutions',
          suitability: 'Great for analytical minds and those interested in innovation',
          coordinates: { lat: 0, lng: 0 } // Placeholder coordinates
        }
      ],
      greenTransportation: [
        {
          type: 'Bike Sharing',
          stations: ['Central Station', 'University', 'Main Square'],
          ecoImpact: 'Reduces carbon footprint by 75% compared to car travel'
        },
        {
          type: 'Electric Tram',
          routes: ['Downtown Loop', 'Cultural District', 'Innovation Quarter'],
          ecoImpact: '100% renewable energy powered public transport'
        }
      ]
    };
  }
}

module.exports = CityGuideAgent;