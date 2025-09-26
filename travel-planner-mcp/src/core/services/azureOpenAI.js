/**
 * Azure OpenAI Service
 * Handles interactions with Azure OpenAI models for the travel planning application
 */

const { OpenAIClient } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity");

class AzureOpenAIService {
  constructor(config) {
    this.config = config;
    
    // Use DefaultAzureCredential for managed identity in production
    // or AzureKeyCredential for key-based auth in development
    if (this.config.useConnectionString) {
      const { AzureKeyCredential } = require("@azure/openai");
      this.credential = new AzureKeyCredential(this.config.apiKey);
    } else {
      this.credential = new DefaultAzureCredential();
    }
    
    // Initialize the OpenAI client
    this.client = new OpenAIClient(this.config.endpoint, this.credential);
    
    // Cache models configuration
    this.deployments = {
      chat: this.config.deployments.chat,
      embeddings: this.config.deployments.embeddings
    };
  }

  /**
   * Generate a chat completion using Azure OpenAI
   * @param {Array} messages - Array of chat messages
   * @param {Object} options - Options for the chat completion
   * @returns {Promise<Object>} Chat completion response
   */
  async getChatCompletion(messages, options = {}) {
    try {
      // Default options
      const defaultOptions = {
        maxTokens: 800,
        temperature: 0.7,
        topP: 0.95,
        presencePenalty: 0,
        frequencyPenalty: 0
      };
      
      // Merge with provided options
      const completionOptions = {
        ...defaultOptions,
        ...options
      };
      
      // Call Azure OpenAI
      const response = await this.client.getChatCompletions(
        this.deployments.chat,
        messages,
        completionOptions
      );
      
      return response;
    } catch (error) {
      console.error("Error getting chat completion:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings using Azure OpenAI
   * @param {string|Array} input - Input text or array of texts to embed
   * @returns {Promise<Array>} Embeddings
   */
  async getEmbeddings(input) {
    try {
      const inputArray = Array.isArray(input) ? input : [input];
      
      const response = await this.client.getEmbeddings(
        this.deployments.embeddings,
        inputArray
      );
      
      return response.data;
    } catch (error) {
      console.error("Error getting embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate a travel plan summary using Azure OpenAI
   * @param {Object} travelPlan - The travel plan to summarize
   * @returns {Promise<string>} Generated summary
   */
  async generateTravelSummary(travelPlan) {
    try {
      // Create a system message that instructs the model how to format the summary
      const systemMessage = {
        role: "system",
        content: `You are a helpful travel assistant that creates concise, well-organized travel plan summaries. 
        Summarize the travel plan in a clear format with sections for transportation, accommodation, and activities. 
        Include relevant dates, times, and locations. Be enthusiastic but professional, and highlight unique aspects of the trip.`
      };
      
      // Create a structured representation of the travel plan for the model
      const travelPlanText = JSON.stringify(travelPlan);
      
      // User message with the travel plan
      const userMessage = {
        role: "user",
        content: `Please create a summary of this travel plan: ${travelPlanText}`
      };
      
      // Generate the summary
      const response = await this.getChatCompletion(
        [systemMessage, userMessage],
        {
          temperature: 0.7,
          maxTokens: 1000
        }
      );
      
      // Extract and return the summary
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating travel summary:", error);
      throw error;
    }
  }

  /**
   * Generate personalized recommendations based on user preferences
   * @param {Object} userProfile - User profile with preferences
   * @param {Object} destination - Destination information
   * @returns {Promise<Object>} Personalized recommendations
   */
  async getPersonalizedRecommendations(userProfile, destination) {
    try {
      // Create system message to guide the recommendation process
      const systemMessage = {
        role: "system",
        content: `You are a travel recommendation expert that understands user preferences deeply. 
        Generate personalized travel recommendations based on the user's profile and the destination.
        Focus on matching activities and experiences that align with the user's interests, past travel history,
        and stated preferences. Be specific about why each recommendation is a good match for this user.`
      };
      
      // Create user message with profile and destination
      const userMessage = {
        role: "user",
        content: `Generate 3-5 personalized recommendations for a traveler with this profile:
        ${JSON.stringify(userProfile)}
        
        They are traveling to: ${JSON.stringify(destination)}
        
        For each recommendation, explain why it matches their preferences.`
      };
      
      // Generate recommendations
      const response = await this.getChatCompletion(
        [systemMessage, userMessage],
        {
          temperature: 0.8,
          maxTokens: 1000
        }
      );
      
      // Parse the response to extract recommendations
      // In a real implementation, we would parse this into a structured format
      const recommendationsText = response.choices[0].message.content;
      
      return {
        recommendations: recommendationsText,
        destination: destination.name
      };
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      throw error;
    }
  }

  /**
   * Analyze user sentiment and preferences from their queries
   * @param {Array} userQueries - Array of user query strings
   * @returns {Promise<Object>} Analysis of user preferences
   */
  async analyzeUserPreferences(userQueries) {
    try {
      // Create a system message that instructs the model how to analyze preferences
      const systemMessage = {
        role: "system",
        content: `You are an expert at analyzing user travel preferences from their queries. 
        Extract information about:
        1. Preferred destinations
        2. Travel style (luxury, budget, adventure, relaxation)
        3. Activities of interest
        4. Accommodation preferences
        5. Transportation preferences
        6. Travel companions (solo, couple, family, group)
        7. Special requirements or considerations
        
        Return the analysis as a JSON object with these categories as keys.`
      };
      
      // Combine all user queries into a single string
      const queriesText = userQueries.join("\n");
      
      // User message with the queries to analyze
      const userMessage = {
        role: "user",
        content: `Please analyze the following travel-related queries to extract user preferences:\n${queriesText}`
      };
      
      // Generate the analysis
      const response = await this.getChatCompletion(
        [systemMessage, userMessage],
        {
          temperature: 0.3, // Lower temperature for more consistent output
          maxTokens: 800,
          responseFormat: { type: "json_object" } // Request JSON format
        }
      );
      
      // Extract and parse the JSON response
      const analysisText = response.choices[0].message.content;
      let analysis;
      
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error("Error parsing preference analysis:", parseError);
        analysis = { error: "Failed to parse analysis", text: analysisText };
      }
      
      return analysis;
    } catch (error) {
      console.error("Error analyzing user preferences:", error);
      throw error;
    }
  }
}

module.exports = AzureOpenAIService;