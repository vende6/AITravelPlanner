/**
 * Itinerary Agent
 * Specialized agent for creating and managing complete travel itineraries
 */

class ItineraryAgent {
  constructor(config) {
    this.config = config;
    this.tools = [
      {
        type: "function",
        function: {
          name: "generate_itinerary",
          description: "Generate a structured day-by-day travel itinerary",
          parameters: {
            type: "object",
            properties: {
              destination: {
                type: "string",
                description: "Main destination for the trip"
              },
              startDate: {
                type: "string",
                description: "Start date of the trip in YYYY-MM-DD format"
              },
              endDate: {
                type: "string",
                description: "End date of the trip in YYYY-MM-DD format"
              },
              includeFlights: {
                type: "boolean",
                description: "Whether to include flight information in the itinerary"
              },
              includeHotels: {
                type: "boolean",
                description: "Whether to include hotel information in the itinerary"
              },
              includeActivities: {
                type: "boolean",
                description: "Whether to include activities in the itinerary"
              }
            },
            required: ["destination", "startDate", "endDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "modify_itinerary",
          description: "Modify an existing itinerary with new information",
          parameters: {
            type: "object",
            properties: {
              itineraryId: {
                type: "string",
                description: "Identifier of the existing itinerary to modify"
              },
              changes: {
                type: "object",
                description: "Changes to apply to the itinerary",
                properties: {
                  addActivities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day: { type: "integer" },
                        activity: { type: "string" },
                        time: { type: "string" },
                        duration: { type: "integer" }
                      }
                    }
                  },
                  removeActivities: {
                    type: "array",
                    items: { type: "string" }
                  },
                  modifyDates: {
                    type: "object",
                    properties: {
                      newStartDate: { type: "string" },
                      newEndDate: { type: "string" }
                    }
                  }
                }
              }
            },
            required: ["itineraryId"]
          }
        }
      }
    ];
    
    this.systemPrompt = `You are a specialized travel itinerary agent.
Your goal is to create comprehensive, well-organized travel plans that incorporate flight, accommodation, and activity details.
Use the generate_itinerary and modify_itinerary tools to create and update travel plans.
Prioritize creating logical, time-efficient itineraries that:
1. Respect travel times between activities
2. Group activities by geographic proximity
3. Balance busy days with more relaxed periods
4. Account for check-in/check-out times and flight schedules
5. Include meal breaks at appropriate times
Present itineraries in a clear, chronological format with timing details.`;
  }

  /**
   * Processes a user query related to creating or modifying itineraries
   * @param {string} query - User's itinerary-related query
   * @param {Object} context - Current conversation context with plan information
   * @param {MCPProtocolHandler} protocolHandler - MCP protocol handler
   * @returns {Promise<Object>} Processing result
   */
  async process(query, context, protocolHandler) {
    try {
      // Extract relevant information from the context
      const currentPlan = context.currentPlan || {};
      
      // Create an enhanced query that incorporates current plan details
      let enhancedQuery = query;
      
      // If we have flight and hotel info but the query doesn't mention them,
      // add context to ensure the itinerary incorporates them
      if (currentPlan.flights && !query.toLowerCase().includes('flight')) {
        const flight = currentPlan.flights;
        enhancedQuery += ` Include the flight from ${flight.origin} to ${flight.destination} 
          departing on ${flight.departureTime.split('T')[0]} at ${flight.departureTime.split('T')[1].substring(0, 5)}.`;
      }
      
      if (currentPlan.hotels && !query.toLowerCase().includes('hotel')) {
        const hotel = currentPlan.hotels[0] || currentPlan.hotels;
        enhancedQuery += ` Include stay at ${hotel.name} in ${hotel.location} 
          from ${hotel.checkInDate} to ${hotel.checkOutDate}.`;
      }
      
      if (currentPlan.activities && !query.toLowerCase().includes('activit')) {
        enhancedQuery += ` Include the following activities in the itinerary: 
          ${currentPlan.activities.map(a => a.name).join(', ')}.`;
      }
      
      // Use MCP to process the itinerary query with appropriate tools
      const response = await protocolHandler.processMessage(
        enhancedQuery,
        'itineraryAgent',
        this.tools
      );
      
      // Check if there are any tool calls in the response
      const toolCalls = protocolHandler.extractToolCalls(response);
      
      let itinerary = null;
      
      // Execute any tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'generate_itinerary') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Generate a new itinerary
            itinerary = await this.generateItinerary(args, currentPlan);
          } else if (toolCall.function.name === 'modify_itinerary') {
            const args = JSON.parse(toolCall.function.arguments);
            
            // Modify an existing itinerary
            itinerary = await this.modifyItinerary(args, currentPlan);
          }
        }
      }
      
      // If no itinerary was created via tool calls, generate one based on current plan
      if (!itinerary && Object.keys(currentPlan).length > 0) {
        itinerary = await this.generateDefaultItinerary(currentPlan);
      }
      
      // Generate a summary of the itinerary
      const summary = this.summarizeItinerary(itinerary);
      
      return {
        itinerary: itinerary,
        summary: summary
      };
    } catch (error) {
      console.error('Error in itinerary agent processing:', error);
      return {
        itinerary: null,
        summary: `Error creating itinerary: ${error.message}`
      };
    }
  }

  /**
   * Generate a complete itinerary based on provided parameters
   * @param {Object} params - Parameters for itinerary generation
   * @param {Object} currentPlan - The current travel plan
   * @returns {Promise<Object>} The generated itinerary
   */
  async generateItinerary(params, currentPlan) {
    try {
      console.log(`Generating itinerary for ${params.destination}`);
      
      // Extract date information
      const startDate = params.startDate || 
        (currentPlan.flights ? currentPlan.flights.departureTime.split('T')[0] : null) ||
        (currentPlan.hotels ? currentPlan.hotels.checkInDate : null) ||
        new Date().toISOString().split('T')[0];
        
      const endDate = params.endDate || 
        (currentPlan.hotels ? currentPlan.hotels.checkOutDate : null) ||
        (currentPlan.flights && currentPlan.flights.returnDepartureTime ? 
          currentPlan.flights.returnDepartureTime.split('T')[0] : null);
      
      // Calculate duration in days
      const start = new Date(startDate);
      const end = new Date(endDate || start);
      end.setDate(!endDate ? start.getDate() + 3 : end.getDate()); // Default to 3-day trip
      
      const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      
      // Create itinerary structure
      const itinerary = {
        id: `ITIN-${Date.now().toString(36)}`,
        destination: params.destination || 
          (currentPlan.flights ? currentPlan.flights.destination : 'Unknown'),
        startDate: startDate,
        endDate: end.toISOString().split('T')[0],
        duration: duration,
        transportation: [],
        accommodations: [],
        dailyPlans: []
      };
      
      // Add flight information if available
      if (params.includeFlights !== false && currentPlan.flights) {
        itinerary.transportation.push({
          type: 'Flight',
          operator: currentPlan.flights.airline,
          departureLocation: currentPlan.flights.origin,
          departureTime: currentPlan.flights.departureTime,
          arrivalLocation: currentPlan.flights.destination,
          arrivalTime: currentPlan.flights.arrivalTime,
          confirmationCode: `${currentPlan.flights.id}`
        });
        
        // Add return flight if available
        if (currentPlan.flights.returnDepartureTime) {
          itinerary.transportation.push({
            type: 'Flight',
            operator: currentPlan.flights.airline,
            departureLocation: currentPlan.flights.destination,
            departureTime: currentPlan.flights.returnDepartureTime,
            arrivalLocation: currentPlan.flights.origin,
            arrivalTime: currentPlan.flights.returnArrivalTime,
            confirmationCode: `${currentPlan.flights.id}-R`
          });
        }
      }
      
      // Add hotel information if available
      if (params.includeHotels !== false && currentPlan.hotels) {
        const hotels = Array.isArray(currentPlan.hotels) ? 
          currentPlan.hotels : [currentPlan.hotels];
          
        hotels.forEach(hotel => {
          itinerary.accommodations.push({
            type: 'Hotel',
            name: hotel.name,
            location: hotel.location,
            address: hotel.address,
            checkInDate: hotel.checkInDate,
            checkOutDate: hotel.checkOutDate,
            confirmationCode: hotel.id
          });
        });
      }
      
      // Generate daily plans
      for (let day = 1; day <= duration; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + day - 1);
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        const dailyPlan = {
          day: day,
          date: formattedDate,
          activities: []
        };
        
        // Add check-in to first day
        if (day === 1 && itinerary.accommodations.length > 0) {
          dailyPlan.activities.push({
            time: '15:00',
            description: `Check-in at ${itinerary.accommodations[0].name}`,
            type: 'Accommodation',
            duration: 30 // minutes
          });
        }
        
        // Add check-out to last day
        if (day === duration && itinerary.accommodations.length > 0) {
          dailyPlan.activities.push({
            time: '11:00',
            description: `Check-out from ${itinerary.accommodations[0].name}`,
            type: 'Accommodation',
            duration: 30 // minutes
          });
        }
        
        // Add flight to first day if departure is on that day
        if (day === 1 && itinerary.transportation.length > 0) {
          const departureFlight = itinerary.transportation[0];
          if (departureFlight.departureTime.split('T')[0] === formattedDate) {
            const departureTime = departureFlight.departureTime.split('T')[1].substring(0, 5);
            dailyPlan.activities.unshift({
              time: departureTime,
              description: `Flight from ${departureFlight.departureLocation} to ${departureFlight.arrivalLocation}`,
              type: 'Transportation',
              duration: 0 // Special case, duration is implied by arrival time
            });
          }
        }
        
        // Add return flight to last day if return is on that day
        if (day === duration && itinerary.transportation.length > 1) {
          const returnFlight = itinerary.transportation[1];
          if (returnFlight.departureTime.split('T')[0] === formattedDate) {
            const departureTime = returnFlight.departureTime.split('T')[1].substring(0, 5);
            dailyPlan.activities.push({
              time: departureTime,
              description: `Flight from ${returnFlight.departureLocation} to ${returnFlight.arrivalLocation}`,
              type: 'Transportation',
              duration: 0 // Special case, duration is implied by arrival time
            });
          }
        }
        
        // Add activities if available for this day
        if (params.includeActivities !== false && currentPlan.activities) {
          // Distribute activities across days (simple distribution for demo)
          const activitiesPerDay = Math.ceil(currentPlan.activities.length / duration);
          const startIdx = (day - 1) * activitiesPerDay;
          const endIdx = Math.min(startIdx + activitiesPerDay, currentPlan.activities.length);
          
          for (let i = startIdx; i < endIdx; i++) {
            if (currentPlan.activities[i]) {
              const activity = currentPlan.activities[i];
              // Generate a reasonable time that doesn't conflict with check-in/out or flights
              const hour = 9 + Math.floor((i - startIdx) * 2); // Start at 9 AM, 2-hour spacing
              const time = `${hour.toString().padStart(2, '0')}:00`;
              
              dailyPlan.activities.push({
                time: time,
                description: activity.name,
                location: activity.location,
                type: 'Activity',
                duration: activity.duration || 120 // default 2 hours
              });
            }
          }
        }
        
        // Add meals if no specific activities at usual meal times
        const hasMorningActivity = dailyPlan.activities.some(a => {
          const hour = parseInt(a.time.split(':')[0]);
          return hour >= 7 && hour <= 9;
        });
        
        const hasLunchActivity = dailyPlan.activities.some(a => {
          const hour = parseInt(a.time.split(':')[0]);
          return hour >= 12 && hour <= 14;
        });
        
        const hasDinnerActivity = dailyPlan.activities.some(a => {
          const hour = parseInt(a.time.split(':')[0]);
          return hour >= 18 && hour <= 20;
        });
        
        if (!hasMorningActivity) {
          dailyPlan.activities.push({
            time: '08:00',
            description: 'Breakfast',
            type: 'Meal',
            duration: 60
          });
        }
        
        if (!hasLunchActivity) {
          dailyPlan.activities.push({
            time: '13:00',
            description: 'Lunch',
            type: 'Meal',
            duration: 60
          });
        }
        
        if (!hasDinnerActivity) {
          dailyPlan.activities.push({
            time: '19:00',
            description: 'Dinner',
            type: 'Meal',
            duration: 90
          });
        }
        
        // Sort activities by time
        dailyPlan.activities.sort((a, b) => {
          return a.time.localeCompare(b.time);
        });
        
        itinerary.dailyPlans.push(dailyPlan);
      }
      
      return itinerary;
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  }

  /**
   * Modify an existing itinerary
   * @param {Object} params - Parameters for modifying the itinerary
   * @param {Object} currentPlan - The current travel plan
   * @returns {Promise<Object>} The modified itinerary
   */
  async modifyItinerary(params, currentPlan) {
    try {
      console.log(`Modifying itinerary ${params.itineraryId}`);
      
      // In a real implementation, this would fetch the existing itinerary from a database
      // For demo purposes, we'll use the current plan's itinerary or generate a new one
      let itinerary = currentPlan.itinerary;
      
      if (!itinerary) {
        // Generate a default itinerary if none exists
        itinerary = await this.generateDefaultItinerary(currentPlan);
      }
      
      // Apply changes
      if (params.changes) {
        // Add activities
        if (params.changes.addActivities && params.changes.addActivities.length > 0) {
          for (const newActivity of params.changes.addActivities) {
            // Find the daily plan for the specified day
            const dailyPlan = itinerary.dailyPlans.find(dp => dp.day === newActivity.day);
            
            if (dailyPlan) {
              dailyPlan.activities.push({
                time: newActivity.time,
                description: newActivity.activity,
                type: 'Activity',
                duration: newActivity.duration || 60
              });
              
              // Sort activities by time
              dailyPlan.activities.sort((a, b) => a.time.localeCompare(b.time));
            }
          }
        }
        
        // Remove activities
        if (params.changes.removeActivities && params.changes.removeActivities.length > 0) {
          for (const activityToRemove of params.changes.removeActivities) {
            // Remove from all daily plans
            itinerary.dailyPlans.forEach(dailyPlan => {
              dailyPlan.activities = dailyPlan.activities.filter(
                activity => !activity.description.includes(activityToRemove)
              );
            });
          }
        }
        
        // Modify dates
        if (params.changes.modifyDates) {
          if (params.changes.modifyDates.newStartDate) {
            itinerary.startDate = params.changes.modifyDates.newStartDate;
          }
          
          if (params.changes.modifyDates.newEndDate) {
            itinerary.endDate = params.changes.modifyDates.newEndDate;
          }
          
          // Recalculate duration
          const start = new Date(itinerary.startDate);
          const end = new Date(itinerary.endDate);
          itinerary.duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          
          // We would need to regenerate the daily plans here based on the new dates
          // For demo purposes, we'll just update the dates in the existing daily plans
          itinerary.dailyPlans.forEach((dailyPlan, index) => {
            const currentDate = new Date(itinerary.startDate);
            currentDate.setDate(currentDate.getDate() + index);
            dailyPlan.date = currentDate.toISOString().split('T')[0];
          });
        }
      }
      
      return itinerary;
    } catch (error) {
      console.error('Error modifying itinerary:', error);
      throw error;
    }
  }

  /**
   * Generate a default itinerary based on the current plan
   * @param {Object} currentPlan - The current travel plan
   * @returns {Promise<Object>} A default itinerary
   */
  async generateDefaultItinerary(currentPlan) {
    // Default parameters for generating an itinerary
    const params = {
      destination: currentPlan.flights ? currentPlan.flights.destination : 
                  (currentPlan.hotels ? currentPlan.hotels.location : 'Unknown'),
      startDate: currentPlan.flights ? currentPlan.flights.departureTime.split('T')[0] : 
                (currentPlan.hotels ? currentPlan.hotels.checkInDate : new Date().toISOString().split('T')[0]),
      endDate: currentPlan.flights && currentPlan.flights.returnDepartureTime ? 
              currentPlan.flights.returnDepartureTime.split('T')[0] : 
              (currentPlan.hotels ? currentPlan.hotels.checkOutDate : null),
      includeFlights: true,
      includeHotels: true,
      includeActivities: true
    };
    
    return await this.generateItinerary(params, currentPlan);
  }

  /**
   * Create a user-friendly summary of an itinerary
   * @param {Object} itinerary - The itinerary to summarize
   * @returns {string} A summary of the itinerary
   */
  summarizeItinerary(itinerary) {
    if (!itinerary) {
      return "No itinerary available yet. Please provide destination and travel dates to create one.";
    }
    
    let summary = `${itinerary.duration}-day itinerary for ${itinerary.destination} (${itinerary.startDate} to ${itinerary.endDate}):\n\n`;
    
    // Transportation summary
    if (itinerary.transportation && itinerary.transportation.length > 0) {
      summary += "Transportation:\n";
      itinerary.transportation.forEach(transport => {
        const departTime = transport.departureTime.split('T')[1].substring(0, 5);
        summary += `- ${transport.type} from ${transport.departureLocation} to ${transport.arrivalLocation} at ${departTime}\n`;
      });
      summary += "\n";
    }
    
    // Accommodation summary
    if (itinerary.accommodations && itinerary.accommodations.length > 0) {
      summary += "Accommodations:\n";
      itinerary.accommodations.forEach(accommodation => {
        summary += `- ${accommodation.name} in ${accommodation.location} (${accommodation.checkInDate} to ${accommodation.checkOutDate})\n`;
      });
      summary += "\n";
    }
    
    // Daily plans summary (abbreviated for clarity)
    summary += "Daily Schedule Highlights:\n";
    itinerary.dailyPlans.forEach(dailyPlan => {
      summary += `Day ${dailyPlan.day} (${dailyPlan.date}):\n`;
      
      // Get max 3 key activities for the summary
      const keyActivities = dailyPlan.activities
        .filter(a => a.type !== 'Meal')
        .slice(0, 3);
        
      keyActivities.forEach(activity => {
        summary += `- ${activity.time}: ${activity.description}\n`;
      });
      
      if (dailyPlan.activities.length > 3) {
        summary += `- And ${dailyPlan.activities.length - keyActivities.length} more activities\n`;
      }
      
      summary += "\n";
    });
    
    return summary.trim();
  }
}

module.exports = ItineraryAgent;