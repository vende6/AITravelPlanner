/**
 * Azure AI Search Service
 * Provides intelligent search capabilities for travel planning agents
 */

const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const { DefaultAzureCredential } = require("@azure/identity");

class AzureAISearchService {
  constructor(config) {
    this.config = config;
    
    // Use DefaultAzureCredential for managed identity in production
    // or AzureKeyCredential for key-based auth in development
    if (this.config.useConnectionString) {
      this.credential = new AzureKeyCredential(this.config.apiKey);
    } else {
      this.credential = new DefaultAzureCredential();
    }
    
    // Initialize search clients for different indexes
    this.flightIndex = this.config.indexes.flight;
    this.hotelIndex = this.config.indexes.hotel;
    this.activityIndex = this.config.indexes.activity;
    
    this.flightClient = new SearchClient(
      this.config.endpoint,
      this.flightIndex,
      this.credential
    );
    
    this.hotelClient = new SearchClient(
      this.config.endpoint,
      this.hotelIndex,
      this.credential
    );
    
    this.activityClient = new SearchClient(
      this.config.endpoint,
      this.activityIndex,
      this.credential
    );
  }

  /**
   * Search for flights using Azure AI Search
   * @param {Object} criteria - Flight search criteria
   * @returns {Promise<Array>} Flight search results
   */
  async searchFlights(criteria) {
    try {
      // Build search options from criteria
      const searchOptions = {
        filter: this._buildFlightFilter(criteria),
        select: [
          "id",
          "airline",
          "flightNumber",
          "origin",
          "destination",
          "departureTime",
          "arrivalTime",
          "price",
          "cabinClass",
          "availableSeats",
          "duration",
          "stops",
          "aircraft"
        ],
        orderby: ["price asc", "departureTime asc"],
        top: 10
      };
      
      // For semantic ranking, add a semantic configuration when available
      if (this.config.semanticConfig) {
        searchOptions.queryType = "semantic";
        searchOptions.semanticConfiguration = this.config.semanticConfig;
        searchOptions.queryLanguage = "en-us";
      }

      // Generate search text based on origin and destination
      const searchText = `${criteria.origin} to ${criteria.destination}`;
      
      // Execute search
      const searchResults = await this.flightClient.search(searchText, searchOptions);
      
      // Process and return results
      const flights = [];
      for await (const result of searchResults.results) {
        flights.push(result.document);
      }
      
      return flights;
    } catch (error) {
      console.error("Error searching flights:", error);
      throw error;
    }
  }

  /**
   * Search for hotels using Azure AI Search
   * @param {Object} criteria - Hotel search criteria
   * @returns {Promise<Array>} Hotel search results
   */
  async searchHotels(criteria) {
    try {
      // Build search options from criteria
      const searchOptions = {
        filter: this._buildHotelFilter(criteria),
        select: [
          "id",
          "name",
          "location",
          "address",
          "coordinates",
          "price",
          "rating",
          "amenities",
          "images",
          "description"
        ],
        orderby: criteria.orderBy || ["rating desc", "price asc"],
        top: criteria.limit || 10
      };
      
      // For semantic ranking, add a semantic configuration when available
      if (this.config.semanticConfig) {
        searchOptions.queryType = "semantic";
        searchOptions.semanticConfiguration = this.config.semanticConfig;
        searchOptions.queryLanguage = "en-us";
      }

      // Generate search text based on location and preferences
      let searchText = criteria.location;
      
      if (criteria.preferences) {
        searchText += ` ${criteria.preferences}`;
      }
      
      // Execute search
      const searchResults = await this.hotelClient.search(searchText, searchOptions);
      
      // Process and return results
      const hotels = [];
      for await (const result of searchResults.results) {
        hotels.push(result.document);
      }
      
      return hotels;
    } catch (error) {
      console.error("Error searching hotels:", error);
      throw error;
    }
  }

  /**
   * Search for activities using Azure AI Search
   * @param {Object} criteria - Activity search criteria
   * @returns {Promise<Array>} Activity search results
   */
  async searchActivities(criteria) {
    try {
      // Build search options from criteria
      const searchOptions = {
        filter: this._buildActivityFilter(criteria),
        select: [
          "id",
          "name",
          "location",
          "address",
          "coordinates",
          "category",
          "description",
          "duration",
          "price",
          "currency",
          "rating",
          "images",
          "openingHours",
          "bookingRequired",
          "familyFriendly"
        ],
        orderby: criteria.orderBy || ["rating desc"],
        top: criteria.limit || 10
      };
      
      // For semantic ranking, add a semantic configuration when available
      if (this.config.semanticConfig) {
        searchOptions.queryType = "semantic";
        searchOptions.semanticConfiguration = this.config.semanticConfig;
        searchOptions.queryLanguage = "en-us";
        
        // Add semantic answers if available
        if (criteria.enableAnswers) {
          searchOptions.answers = {
            count: 1,
            threshold: 0.6,
            filter: null
          };
        }
      }

      // Generate search text based on location and category
      let searchText = criteria.location;
      
      if (criteria.category && criteria.category !== "All") {
        searchText += ` ${criteria.category}`;
      }
      
      if (criteria.keywords) {
        searchText += ` ${criteria.keywords}`;
      }
      
      // Execute search
      const searchResults = await this.activityClient.search(searchText, searchOptions);
      
      // Process and return results
      const activities = [];
      
      // Extract semantic answers if available
      let semanticAnswer = null;
      if (searchResults.answers && searchResults.answers.length > 0) {
        semanticAnswer = searchResults.answers[0].text;
      }
      
      // Extract activity documents
      for await (const result of searchResults.results) {
        activities.push(result.document);
      }
      
      return {
        activities,
        semanticAnswer
      };
    } catch (error) {
      console.error("Error searching activities:", error);
      throw error;
    }
  }

  /**
   * Get details for a specific item by ID and type
   * @param {string} id - Item ID
   * @param {string} type - Item type (flight, hotel, activity)
   * @returns {Promise<Object>} Item details
   */
  async getItemById(id, type) {
    try {
      let client;
      
      switch (type.toLowerCase()) {
        case "flight":
          client = this.flightClient;
          break;
        case "hotel":
          client = this.hotelClient;
          break;
        case "activity":
          client = this.activityClient;
          break;
        default:
          throw new Error(`Invalid item type: ${type}`);
      }
      
      // Get document by ID
      const result = await client.getDocument(id);
      return result;
    } catch (error) {
      console.error(`Error getting ${type} details for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Build OData filter string for flight search
   * @param {Object} criteria - Flight search criteria
   * @returns {string} OData filter string
   */
  _buildFlightFilter(criteria) {
    const filters = [];
    
    if (criteria.origin) {
      filters.push(`origin eq '${criteria.origin}'`);
    }
    
    if (criteria.destination) {
      filters.push(`destination eq '${criteria.destination}'`);
    }
    
    if (criteria.departureDate) {
      // Format date for OData filter
      const departureDate = new Date(criteria.departureDate);
      const formattedDate = departureDate.toISOString().split("T")[0];
      filters.push(`departureDate eq '${formattedDate}'`);
    }
    
    if (criteria.cabinClass) {
      filters.push(`cabinClass eq '${criteria.cabinClass}'`);
    }
    
    if (criteria.maxPrice) {
      filters.push(`price le ${criteria.maxPrice}`);
    }
    
    if (criteria.nonstop) {
      filters.push("stops eq 0");
    }
    
    if (criteria.airline) {
      filters.push(`airline eq '${criteria.airline}'`);
    }
    
    if (criteria.minSeats && criteria.passengers) {
      filters.push(`availableSeats ge ${criteria.passengers}`);
    }
    
    return filters.length > 0 ? filters.join(" and ") : null;
  }

  /**
   * Build OData filter string for hotel search
   * @param {Object} criteria - Hotel search criteria
   * @returns {string} OData filter string
   */
  _buildHotelFilter(criteria) {
    const filters = [];
    
    if (criteria.location) {
      filters.push(`location eq '${criteria.location}'`);
    }
    
    if (criteria.minRating) {
      filters.push(`rating ge ${criteria.minRating}`);
    }
    
    if (criteria.maxPrice) {
      filters.push(`price le ${criteria.maxPrice}`);
    }
    
    if (criteria.amenities && criteria.amenities.length > 0) {
      const amenityFilters = criteria.amenities.map(
        amenity => `amenities/any(a: a eq '${amenity}')`
      );
      filters.push(`(${amenityFilters.join(" and ")})`);
    }
    
    return filters.length > 0 ? filters.join(" and ") : null;
  }

  /**
   * Build OData filter string for activity search
   * @param {Object} criteria - Activity search criteria
   * @returns {string} OData filter string
   */
  _buildActivityFilter(criteria) {
    const filters = [];
    
    if (criteria.location) {
      filters.push(`location eq '${criteria.location}'`);
    }
    
    if (criteria.category && criteria.category !== "All") {
      filters.push(`category eq '${criteria.category}'`);
    }
    
    if (criteria.minRating) {
      filters.push(`rating ge ${criteria.minRating}`);
    }
    
    if (criteria.maxPrice) {
      filters.push(`price le ${criteria.maxPrice}`);
    }
    
    if (criteria.duration) {
      // Find activities with duration within 30 minutes of requested duration
      const minDuration = Math.max(0, criteria.duration - 30);
      const maxDuration = criteria.duration + 30;
      filters.push(`duration ge ${minDuration} and duration le ${maxDuration}`);
    }
    
    if (criteria.familyFriendly !== undefined) {
      filters.push(`familyFriendly eq ${criteria.familyFriendly}`);
    }
    
    return filters.length > 0 ? filters.join(" and ") : null;
  }
}

module.exports = AzureAISearchService;