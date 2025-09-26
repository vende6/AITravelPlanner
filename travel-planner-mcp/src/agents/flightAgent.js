/**
 * Flight Agent
 * Specialized agent for flight recommendations and booking
 */

class FlightAgent {
  constructor(config) {
    this.config = config;
    this.aiSearchClient = config.aiSearchClient;
    this.tools = [
      {
        type: "function",
        function: {
          name: "search_flights",
          description: "Search for available flights based on criteria",
          parameters: {
            type: "object",
            properties: {
              origin: {
                type: "string",
                description: "Origin airport code or city name"
              },
              destination: {
                type: "string",
                description: "Destination airport code or city name"
              },
              departureDate: {
                type: "string",
                description: "Departure date in YYYY-MM-DD format"
              },
              returnDate: {
                type: "string",
                description: "Return date in YYYY-MM-DD format for round trips"
              },
              passengers: {
                type: "integer",
                description: "Number of passengers"
              },
              cabinClass: {
                type: "string",
                description: "Cabin class preference (Economy, Premium Economy, Business, First)",
                enum: ["Economy", "Premium Economy", "Business", "First"]
              },
              maxPrice: {
                type: "number",
                description: "Maximum price in USD"
              },
              nonstop: {
                type: "boolean",
                description: "Whether to search for nonstop flights only"
              }
            },
            required: ["origin", "destination", "departureDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_flight_details",
          description: "Get detailed information about a specific flight",
          parameters: {
            type: "object",
            properties: {
              flightId: {
                type: "string",
                description: "Unique identifier for the flight"
              }
            },
            required: ["flightId"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized flight booking agent. 
Your goal is to help users find the best flights based on their preferences and constraints.
Use the search_flights tool to find available options, and provide concise, relevant recommendations.
Always consider user preferences for price, timing, and comfort.
Format prices in USD with $ symbol. Always mention layover information when relevant.
When making recommendations, prioritize:
1. Direct flights when available and within budget
2. Shortest travel time when possible
3. Best value for the price point
Answer only flight-related questions. For other travel questions, inform users that you specialize in flights.`;
  }

  /**
   * Processes a user query related to flights
   * @param {string} query - User's flight query
   * @param {Object} context - Current conversation context
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Use MCP to process the flight query with appropriate tools
      const response = await protocolHandler.processMessage(
        query,
        'flightAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let flightResults = [];
      let flightCost = 0;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'search_flights') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Search flights using Azure AI Search
            const searchResults = await this.searchFlights(args);
            flightResults = searchResults.flights;
            flightCost = searchResults.totalCost;
          } else if (toolCall.function.name === 'get_flight_details') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Get flight details
            const flightDetails = await this.getFlightDetails(args.flightId);
            flightResults = [flightDetails];
            flightCost = flightDetails.price;
          }
        }
      }
      
      // Summarize the flight results
      let summary = '';
      
      if (flightResults.length > 0) {
        summary = `Found ${flightResults.length} flight options`;
        if (flightResults[0].origin && flightResults[0].destination) {
          summary += ` from ${flightResults[0].origin} to ${flightResults[0].destination}`;
        }
        summary += ` with prices ranging from $${Math.min(...flightResults.map(f => f.price))} to $${Math.max(...flightResults.map(f => f.price))}.`;
      } else {
        summary = "No flights found matching your criteria. Please try different dates or airports.";
      }
      
      return {
        flights: flightResults,
        cost: flightCost,
        summary: summary
      };
    } catch (error) {
      console.error('Error in flight agent processing:', error);
      return {
        flights: [],
        cost: 0,
        summary: `Error processing flight request: ${error.message}`
      };
    }
  }

  /**
   * Search for flights using Azure AI Search
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Object>} Search results
   */
  async searchFlights(criteria) {
    try {
      console.log(`Searching flights from ${criteria.origin} to ${criteria.destination}`);
      
      // In a real implementation, this would use the Azure AI Search client
      // For demo purposes, we'll return mock flight data
      const mockFlights = [
        {
          id: 'FL123',
          airline: 'Azure Airways',
          origin: criteria.origin,
          destination: criteria.destination,
          departureTime: `${criteria.departureDate}T08:00:00`,
          arrivalTime: `${criteria.departureDate}T10:30:00`,
          duration: 150, // minutes
          price: 299.99,
          cabinClass: criteria.cabinClass || 'Economy',
          nonstop: true
        },
        {
          id: 'FL456',
          airline: 'Cloud Airlines',
          origin: criteria.origin,
          destination: criteria.destination,
          departureTime: `${criteria.departureDate}T12:15:00`,
          arrivalTime: `${criteria.departureDate}T14:50:00`,
          duration: 155, // minutes
          price: 259.50,
          cabinClass: criteria.cabinClass || 'Economy',
          nonstop: false,
          layovers: [
            {
              airport: 'HUB',
              duration: 45 // minutes
            }
          ]
        }
      ];
      
      return {
        flights: mockFlights,
        totalCost: mockFlights[0].price // Just use first flight price for demo
      };
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific flight
   * @param {string} flightId - Flight identifier
   * @returns {Promise<Object>} Flight details
   */
  async getFlightDetails(flightId) {
    // In a real implementation, this would retrieve flight details from a database
    // For demo purposes, return mock data
    return {
      id: flightId,
      airline: 'Azure Airways',
      origin: 'SEA',
      destination: 'SFO',
      departureTime: '2023-12-15T08:00:00',
      arrivalTime: '2023-12-15T10:30:00',
      duration: 150, // minutes
      price: 299.99,
      cabinClass: 'Economy',
      nonstop: true,
      aircraft: 'Boeing 737-800',
      amenities: ['WiFi', 'Power outlets', 'In-flight entertainment'],
      baggageAllowance: {
        carryOn: 1,
        checked: 1
      }
    };
  }
}

module.exports = FlightAgent;