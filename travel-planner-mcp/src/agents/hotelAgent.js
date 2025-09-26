/**
 * Hotel Agent
 * Specialized agent for hotel recommendations and bookings
 */

class HotelAgent {
  constructor(config) {
    this.config = config;
    this.aiSearchClient = config.aiSearchClient;
    this.tools = [
      {
        type: "function",
        function: {
          name: "search_hotels",
          description: "Search for available hotels based on criteria",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City or specific area for hotel search"
              },
              checkInDate: {
                type: "string",
                description: "Check-in date in YYYY-MM-DD format"
              },
              checkOutDate: {
                type: "string",
                description: "Check-out date in YYYY-MM-DD format"
              },
              guests: {
                type: "integer",
                description: "Number of guests"
              },
              rooms: {
                type: "integer",
                description: "Number of rooms"
              },
              minRating: {
                type: "number",
                description: "Minimum hotel rating (1-5)"
              },
              maxPrice: {
                type: "number",
                description: "Maximum price per night in USD"
              },
              amenities: {
                type: "array",
                description: "List of required amenities",
                items: {
                  type: "string"
                }
              }
            },
            required: ["location", "checkInDate", "checkOutDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_hotel_details",
          description: "Get detailed information about a specific hotel",
          parameters: {
            type: "object",
            properties: {
              hotelId: {
                type: "string",
                description: "Unique identifier for the hotel"
              }
            },
            required: ["hotelId"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized hotel booking agent.
Your goal is to help users find the ideal accommodations based on their preferences and travel plans.
Use the search_hotels tool to find available options, and provide concise, relevant recommendations.
Always consider user preferences for location, comfort, amenities, and budget.
Format prices in USD with $ symbol per night.
When making recommendations, prioritize:
1. Location convenience for the user's activities
2. Highest-rated properties within budget
3. Best value for the amenities offered
Answer only hotel-related questions. For other travel questions, inform users that you specialize in accommodations.`;
  }

  /**
   * Processes a user query related to hotels
   * @param {string} query - User's hotel query
   * @param {Object} context - Current conversation context
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Extract flight information from context if available to align dates
      let checkInDate, checkOutDate, location;
      
      if (context.flightInfo) {
        const flight = context.flightInfo;
        // Use destination as hotel location
        location = flight.destination;
        
        // Parse dates from flight info to suggest hotel dates
        if (flight.departureTime) {
          checkInDate = flight.departureTime.split('T')[0];
        }
        
        // For return flight or estimate checkout
        if (flight.returnDepartureTime) {
          checkOutDate = flight.returnDepartureTime.split('T')[0];
        } else if (checkInDate) {
          // If no return flight, assume 3-day stay
          const checkIn = new Date(checkInDate);
          checkIn.setDate(checkIn.getDate() + 3);
          checkOutDate = checkIn.toISOString().split('T')[0];
        }
      }
      
      // Augment the user query with flight context for better results
      let enhancedQuery = query;
      if (location && !query.toLowerCase().includes(location.toLowerCase())) {
        enhancedQuery = `${query} in ${location}`;
      }
      if (checkInDate && checkOutDate && 
          !query.toLowerCase().includes('check-in') && 
          !query.toLowerCase().includes('check out')) {
        enhancedQuery = `${enhancedQuery} from ${checkInDate} to ${checkOutDate}`;
      }
      
      // Use MCP to process the hotel query with appropriate tools
      const response = await protocolHandler.processMessage(
        enhancedQuery,
        'hotelAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let hotelResults = [];
      let hotelCost = 0;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'search_hotels') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Search hotels using Azure AI Search
            const searchResults = await this.searchHotels(args);
            hotelResults = searchResults.hotels;
            hotelCost = searchResults.totalCost;
          } else if (toolCall.function.name === 'get_hotel_details') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Get hotel details
            const hotelDetails = await this.getHotelDetails(args.hotelId);
            hotelResults = [hotelDetails];
            hotelCost = hotelDetails.pricePerNight * 
              (hotelDetails.checkOutDate && hotelDetails.checkInDate ? 
                (new Date(hotelDetails.checkOutDate) - new Date(hotelDetails.checkInDate)) / (1000 * 60 * 60 * 24) : 1);
          }
        }
      }
      
      // Summarize the hotel results
      let summary = '';
      
      if (hotelResults.length > 0) {
        summary = `Found ${hotelResults.length} accommodation options`;
        if (hotelResults[0].location) {
          summary += ` in ${hotelResults[0].location}`;
        }
        summary += ` with prices ranging from $${Math.min(...hotelResults.map(h => h.pricePerNight))} to $${Math.max(...hotelResults.map(h => h.pricePerNight))} per night.`;
      } else {
        summary = "No hotels found matching your criteria. Please try different dates or location.";
      }
      
      return {
        hotels: hotelResults,
        cost: hotelCost,
        summary: summary
      };
    } catch (error) {
      console.error('Error in hotel agent processing:', error);
      return {
        hotels: [],
        cost: 0,
        summary: `Error processing hotel request: ${error.message}`
      };
    }
  }

  /**
   * Search for hotels using Azure AI Search
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchHotels(criteria) {
    try {
      console.log(`Searching hotels in ${criteria.location}`);
      
      // In a real implementation, this would use the Azure AI Search client
      // For demo purposes, we'll return mock hotel data
      const mockHotels = [
        {
          id: 'HTL789',
          name: 'Azure Grand Hotel',
          location: criteria.location,
          address: '123 Cloud Avenue',
          coordinates: {
            lat: 37.7749,
            lng: -122.4194
          },
          checkInDate: criteria.checkInDate,
          checkOutDate: criteria.checkOutDate,
          pricePerNight: 199.99,
          rating: 4.7,
          amenities: ['Pool', 'Spa', 'Free WiFi', 'Restaurant', 'Fitness Center'],
          images: ['https://example.com/hotel1-image.jpg']
        },
        {
          id: 'HTL012',
          name: 'Cloud Comfort Suites',
          location: criteria.location,
          address: '456 Serverless Street',
          coordinates: {
            lat: 37.7833,
            lng: -122.4167
          },
          checkInDate: criteria.checkInDate,
          checkOutDate: criteria.checkOutDate,
          pricePerNight: 149.50,
          rating: 4.3,
          amenities: ['Free WiFi', 'Breakfast included', 'Business Center'],
          images: ['https://example.com/hotel2-image.jpg']
        }
      ];
      
      // Calculate total cost (price per night * number of nights)
      const nights = (new Date(criteria.checkOutDate) - new Date(criteria.checkInDate)) / (1000 * 60 * 60 * 24);
      const totalCost = mockHotels[0].pricePerNight * nights;
      
      return {
        hotels: mockHotels,
        totalCost: totalCost
      };
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific hotel
   * @param {string} hotelId - Hotel identifier
   * @returns {Promise<Object>} Hotel details
   */
  async getHotelDetails(hotelId) {
    // In a real implementation, this would retrieve hotel details from a database
    // For demo purposes, return mock data
    return {
      id: hotelId,
      name: 'Azure Grand Hotel',
      location: 'San Francisco',
      address: '123 Cloud Avenue, San Francisco, CA 94105',
      coordinates: {
        lat: 37.7749,
        lng: -122.4194
      },
      checkInDate: '2023-12-15',
      checkOutDate: '2023-12-18',
      pricePerNight: 199.99,
      rating: 4.7,
      amenities: ['Pool', 'Spa', 'Free WiFi', 'Restaurant', 'Fitness Center', '24-hour Front Desk'],
      roomTypes: [
        {
          type: 'Deluxe King',
          price: 199.99,
          description: 'Spacious room with king-sized bed and city view'
        },
        {
          type: 'Executive Suite',
          price: 299.99,
          description: 'Luxury suite with separate living area and panoramic views'
        }
      ],
      images: [
        'https://example.com/hotel1-image1.jpg',
        'https://example.com/hotel1-image2.jpg'
      ],
      description: 'Luxury hotel in downtown San Francisco with stunning bay views, gourmet dining options, and premium spa services.',
      policies: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellation: 'Free cancellation up to 24 hours before check-in'
      },
      reviews: {
        average: 4.7,
        count: 1287,
        highlights: [
          'Excellent service',
          'Great location',
          'Clean rooms'
        ]
      }
    };
  }
}

module.exports = HotelAgent;