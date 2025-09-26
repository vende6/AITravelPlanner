/**
 * Local Experience Agent
 * Specialized agent for finding local activities and attractions
 */

class LocalExperienceAgent {
  constructor(config) {
    this.config = config;
    this.aiSearchClient = config.aiSearchClient;
    this.tools = [
      {
        type: "function",
        function: {
          name: "search_activities",
          description: "Search for local activities and attractions based on criteria",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City or specific area for activity search"
              },
              date: {
                type: "string",
                description: "Date for the activities in YYYY-MM-DD format"
              },
              category: {
                type: "string",
                description: "Category of activities (e.g., Cultural, Outdoor, Food, Entertainment, Shopping)",
                enum: ["Cultural", "Outdoor", "Food", "Entertainment", "Shopping", "All"]
              },
              budget: {
                type: "string",
                description: "Budget range (Low, Medium, High)",
                enum: ["Low", "Medium", "High", "Any"]
              },
              duration: {
                type: "integer",
                description: "Approximate duration in minutes"
              },
              familyFriendly: {
                type: "boolean",
                description: "Whether the activities should be suitable for families with children"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_activity_details",
          description: "Get detailed information about a specific activity",
          parameters: {
            type: "object",
            properties: {
              activityId: {
                type: "string",
                description: "Unique identifier for the activity"
              }
            },
            required: ["activityId"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_local_recommendations",
          description: "Get personalized recommendations based on user preferences",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City or specific area for recommendations"
              },
              interests: {
                type: "array",
                description: "List of user interests",
                items: {
                  type: "string"
                }
              },
              previousActivities: {
                type: "array",
                description: "List of activity IDs the user has already done",
                items: {
                  type: "string"
                }
              }
            },
            required: ["location"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized local experience agent.
Your goal is to help users discover unique, authentic experiences in their travel destinations.
Use the search_activities tool to find relevant activities, and the get_local_recommendations tool for personalized suggestions.
Always consider user preferences for activity type, budget, and duration.
Format prices in local currency with appropriate symbol.
When making recommendations, prioritize:
1. Unique, authentic local experiences over tourist traps
2. Activities that match the user's expressed interests
3. A mix of popular highlights and hidden gems
4. Activities that work well together logistically (location, timing)
Answer only experience-related questions. For other travel questions, inform users that you specialize in local activities.`;
  }

  /**
   * Processes a user query related to local experiences
   * @param {string} query - User's experience query
   * @param {Object} context - Current conversation context
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Extract destination from context
      let location = null;
      
      if (context.destination) {
        location = context.destination;
      } else if (context.hotelLocation) {
        location = context.hotelLocation;
      } else if (context.currentPlan && context.currentPlan.flights) {
        location = context.currentPlan.flights.destination;
      } else if (context.currentPlan && context.currentPlan.hotels) {
        const hotels = Array.isArray(context.currentPlan.hotels) ? 
          context.currentPlan.hotels[0] : context.currentPlan.hotels;
        location = hotels.location;
      }
      
      // Augment query with location context if needed
      let enhancedQuery = query;
      if (location && !query.toLowerCase().includes(location.toLowerCase())) {
        enhancedQuery = `${query} in ${location}`;
      }
      
      // Use MCP to process the query with appropriate tools
      const response = await protocolHandler.processMessage(
        enhancedQuery,
        'localExperienceAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let activities = [];
      let activityCost = 0;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'search_activities') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Search activities using Azure AI Search
            const searchResults = await this.searchActivities(args);
            activities = searchResults.activities;
            activityCost = searchResults.totalCost;
          } else if (toolCall.function.name === 'get_activity_details') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Get activity details
            const activityDetails = await this.getActivityDetails(args.activityId);
            activities = [activityDetails];
            activityCost = activityDetails.price;
          } else if (toolCall.function.name === 'get_local_recommendations') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Get personalized recommendations
            const recommendations = await this.getLocalRecommendations(args);
            activities = recommendations.activities;
            activityCost = recommendations.totalCost;
          }
        }
      }
      
      // If no explicit activity search was triggered but we have location info,
      // perform a default search for popular activities
      if (activities.length === 0 && location) {
        const defaultResults = await this.searchActivities({ 
          location: location,
          category: 'All',
          budget: 'Any'
        });
        
        activities = defaultResults.activities;
        activityCost = defaultResults.totalCost;
      }
      
      // Summarize the activity results
      let summary = '';
      
      if (activities.length > 0) {
        summary = `Found ${activities.length} recommended activities`;
        if (location) {
          summary += ` in ${location}`;
        }
        
        if (activities.length <= 3) {
          // List all activities for a small set
          summary += `: ${activities.map(a => a.name).join(', ')}.`;
        } else {
          // Categorize activities for a larger set
          const categories = [...new Set(activities.map(a => a.category))];
          summary += ` including ${categories.length} different types: ${categories.join(', ')}.`;
        }
      } else {
        summary = "No activities found matching your criteria. Please try different preferences or location.";
      }
      
      return {
        activities: activities,
        cost: activityCost,
        summary: summary
      };
    } catch (error) {
      console.error('Error in local experience agent processing:', error);
      return {
        activities: [],
        cost: 0,
        summary: `Error processing activity request: ${error.message}`
      };
    }
  }

  /**
   * Search for local activities and attractions
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchActivities(criteria) {
    try {
      console.log(`Searching activities in ${criteria.location}`);
      
      // In a real implementation, this would use the Azure AI Search client
      // For demo purposes, we'll return mock activity data
      const mockActivities = [
        {
          id: 'ACT001',
          name: 'Historic City Walking Tour',
          location: criteria.location,
          address: 'Central Square, Downtown',
          coordinates: {
            lat: 37.7749,
            lng: -122.4194
          },
          category: 'Cultural',
          description: 'Explore the rich history and architecture of the city center with a knowledgeable local guide.',
          duration: 120, // minutes
          price: 35.00,
          currency: 'USD',
          rating: 4.8,
          reviewCount: 127,
          images: ['https://example.com/activity1-image.jpg'],
          openingHours: '9:00-17:00',
          bookingRequired: true,
          familyFriendly: true
        },
        {
          id: 'ACT002',
          name: 'Culinary Market Experience',
          location: criteria.location,
          address: '123 Foodie Lane',
          coordinates: {
            lat: 37.7833,
            lng: -122.4167
          },
          category: 'Food',
          description: 'Sample local delicacies and fresh produce at the famous city market with a culinary expert.',
          duration: 180, // minutes
          price: 65.00,
          currency: 'USD',
          rating: 4.9,
          reviewCount: 89,
          images: ['https://example.com/activity2-image.jpg'],
          openingHours: '10:00-14:00',
          bookingRequired: true,
          familyFriendly: true
        },
        {
          id: 'ACT003',
          name: 'Sunset Harbor Kayaking',
          location: criteria.location,
          address: 'West Harbor Marina',
          coordinates: {
            lat: 37.8083,
            lng: -122.4157
          },
          category: 'Outdoor',
          description: 'Paddle through the scenic harbor at sunset for breathtaking views and wildlife spotting.',
          duration: 120, // minutes
          price: 49.99,
          currency: 'USD',
          rating: 4.7,
          reviewCount: 56,
          images: ['https://example.com/activity3-image.jpg'],
          openingHours: '16:00-20:00 (Apr-Oct)',
          bookingRequired: true,
          familyFriendly: false
        }
      ];
      
      // Filter activities based on criteria
      let filteredActivities = [...mockActivities];
      
      // Apply category filter
      if (criteria.category && criteria.category !== 'All') {
        filteredActivities = filteredActivities.filter(
          activity => activity.category === criteria.category
        );
      }
      
      // Apply budget filter
      if (criteria.budget && criteria.budget !== 'Any') {
        const budgetRanges = {
          'Low': { max: 40 },
          'Medium': { min: 40, max: 80 },
          'High': { min: 80 }
        };
        
        const range = budgetRanges[criteria.budget];
        
        filteredActivities = filteredActivities.filter(activity => {
          if (range.min && range.max) {
            return activity.price >= range.min && activity.price <= range.max;
          } else if (range.min) {
            return activity.price >= range.min;
          } else if (range.max) {
            return activity.price <= range.max;
          }
          return true;
        });
      }
      
      // Apply family-friendly filter
      if (criteria.familyFriendly !== undefined) {
        filteredActivities = filteredActivities.filter(
          activity => activity.familyFriendly === criteria.familyFriendly
        );
      }
      
      // Calculate total cost (for a single person)
      const totalCost = filteredActivities.reduce(
        (sum, activity) => sum + activity.price, 0
      );
      
      return {
        activities: filteredActivities,
        totalCost: totalCost
      };
    } catch (error) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific activity
   * @param {string} activityId - Activity identifier
   * @returns {Promise<Object>} Activity details
   */
  async getActivityDetails(activityId) {
    // In a real implementation, this would retrieve activity details from a database
    // For demo purposes, return mock data
    return {
      id: activityId,
      name: 'Historic City Walking Tour',
      location: 'San Francisco',
      address: 'Central Square, Downtown San Francisco',
      coordinates: {
        lat: 37.7749,
        lng: -122.4194
      },
      category: 'Cultural',
      description: 'Explore the rich history and architecture of San Francisco with a knowledgeable local guide. This 2-hour walking tour covers the city\'s most iconic landmarks and hidden gems, with fascinating stories about the city\'s past and present.',
      duration: 120, // minutes
      price: 35.00,
      currency: 'USD',
      rating: 4.8,
      reviewCount: 127,
      reviews: [
        { user: 'TravelFan22', rating: 5, comment: 'Fantastic tour! Our guide was extremely knowledgeable.' },
        { user: 'HistoryBuff', rating: 4, comment: 'Very informative and well-paced tour.' }
      ],
      images: [
        'https://example.com/activity1-image1.jpg',
        'https://example.com/activity1-image2.jpg'
      ],
      openingHours: '9:00-17:00 daily, closed on public holidays',
      bookingRequired: true,
      familyFriendly: true,
      accessibility: 'Wheelchair accessible route available',
      highlights: [
        'Visit the historic city hall',
        'Explore the cultural district',
        'Discover hidden architectural gems',
        'Learn about famous local legends'
      ],
      includes: [
        'Professional guide',
        'Map of the city',
        'Bottled water'
      ],
      meetingPoint: 'Union Square Visitor Center',
      cancellationPolicy: 'Free cancellation up to 24 hours before the tour'
    };
  }

  /**
   * Get personalized local recommendations based on user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Personalized activity recommendations
   */
  async getLocalRecommendations(preferences) {
    try {
      console.log(`Getting personalized recommendations for ${preferences.location}`);
      
      // In a real implementation, this would use Azure AI Search with semantic ranking
      // For demo purposes, we'll return mock curated recommendations
      const userInterests = preferences.interests || [];
      
      // Mock recommendations that would be returned by a recommendation engine
      const recommendations = [
        {
          id: 'ACT004',
          name: 'Secret Speakeasy Cocktail Tour',
          location: preferences.location,
          category: 'Entertainment',
          description: 'Visit three hidden speakeasy bars with craft cocktails and fascinating prohibition history.',
          duration: 180, // minutes
          price: 85.00,
          currency: 'USD',
          rating: 4.9,
          reviewCount: 42,
          images: ['https://example.com/activity4-image.jpg'],
          tags: ['nightlife', 'drinks', 'history', 'local']
        },
        {
          id: 'ACT005',
          name: 'Local Photography Spots',
          location: preferences.location,
          category: 'Outdoor',
          description: 'Visit the best hidden photography spots with a professional photographer to capture amazing memories.',
          duration: 240, // minutes
          price: 120.00,
          currency: 'USD',
          rating: 5.0,
          reviewCount: 18,
          images: ['https://example.com/activity5-image.jpg'],
          tags: ['photography', 'sightseeing', 'nature', 'views']
        },
        {
          id: 'ACT006',
          name: 'Artisan Workshop Experience',
          location: preferences.location,
          category: 'Cultural',
          description: 'Learn traditional crafts from local artisans in this hands-on workshop experience.',
          duration: 150, // minutes
          price: 65.00,
          currency: 'USD',
          rating: 4.7,
          reviewCount: 32,
          images: ['https://example.com/activity6-image.jpg'],
          tags: ['art', 'crafts', 'hands-on', 'souvenir']
        }
      ];
      
      // In a real application, we would apply a recommendation algorithm that considers:
      // 1. User interests (preferences.interests)
      // 2. Previous activities (preferences.previousActivities)
      // 3. Contextual factors (time of year, weather, etc.)
      // 4. Collaborative filtering (what similar users enjoyed)
      
      // Simple scoring based on interests for demo purposes
      if (userInterests && userInterests.length > 0) {
        recommendations.forEach(rec => {
          rec.relevanceScore = rec.tags.filter(tag => 
            userInterests.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase())
            )
          ).length;
        });
        
        // Sort by relevance
        recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
      
      // Remove any activities that the user has already done
      const previousActivities = preferences.previousActivities || [];
      const filteredRecommendations = recommendations.filter(
        rec => !previousActivities.includes(rec.id)
      );
      
      // Calculate total cost
      const totalCost = filteredRecommendations.reduce(
        (sum, activity) => sum + activity.price, 0
      );
      
      return {
        activities: filteredRecommendations,
        totalCost: totalCost
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
}

module.exports = LocalExperienceAgent;