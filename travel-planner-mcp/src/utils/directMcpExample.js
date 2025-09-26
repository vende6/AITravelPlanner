/**
 * Direct Azure OpenAI MCP Interaction Example
 * Shows how to format MCP requests directly to Azure OpenAI service
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
require('dotenv').config();

// Load Azure OpenAI configuration from environment variables
const azureOpenAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://openaios.openai.azure.com/';
const azureOpenAIKey = process.env.AZURE_OPENAI_API_KEY || '3Cy8rxJLEHICuQ0SyKZxp4YtbtLXCmOZRkz1ywhdvvHSYHSlkDsIJQQJ99BIACYeBjFXJ3w3AAABACOGCZC1';
const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID || 'gpt-4-turbo';

// Initialize Azure OpenAI client
const client = new OpenAIClient(
  azureOpenAIEndpoint, 
  new AzureKeyCredential(azureOpenAIKey)
);

/**
 * Format messages according to MCP conventions
 * @param {Array} messages - Standard chat messages
 * @param {string} currentAgentId - The current agent context
 * @returns {Array} MCP formatted messages
 */
function formatMessagesForMCP(messages, currentAgentId) {
  return messages.map(msg => {
    const formattedMsg = {
      role: msg.role,
      content: msg.content
    };
    
    // Add agent metadata if available
    if (msg.metadata && msg.metadata.agent_id) {
      formattedMsg.name = msg.metadata.agent_id;
    }
    
    // Mark current agent context
    if (msg.metadata && msg.metadata.agent_id === currentAgentId) {
      formattedMsg.context = "current";
    }
    
    return formattedMsg;
  });
}

/**
 * Make a direct MCP request to Azure OpenAI
 * @param {Array} messages - Chat history messages
 * @param {string} currentAgentId - Current agent identifier
 * @param {Array} tools - Optional tools available to the agent
 */
async function makeMCPRequest(messages, currentAgentId, tools = null) {
  try {
    // Format messages for MCP
    const mcpMessages = formatMessagesForMCP(messages, currentAgentId);
    
    console.log('Sending MCP formatted messages:');
    console.log(JSON.stringify(mcpMessages, null, 2));
    
    // Build request options
    const options = {
      maxTokens: 800,
      temperature: 0.7
    };
    
    // Add tools if provided
    if (tools) {
      options.tools = tools;
    }
    
    // Make the request to Azure OpenAI
    const result = await client.getChatCompletions(
      deploymentId,
      mcpMessages,
      options
    );
    
    console.log('\nResponse:');
    console.log(result.choices[0].message);
    
    return result;
  } catch (error) {
    console.error('Error making MCP request:', error);
    throw error;
  }
}

// Example usage
async function demonstrateDirectMCPRequest() {
  // Example message history with agent metadata
  const messageHistory = [
    {
      role: "system",
      content: "You are part of a multi-agent travel planning system. Your goal is to collaborate with specialized agents to create an optimal travel itinerary."
    },
    {
      role: "user",
      content: "I want to plan a trip to San Francisco next month."
    },
    {
      role: "assistant",
      content: "I'll help you plan a trip to San Francisco. When exactly do you plan to travel and for how long?",
      metadata: { agent_id: "orchestratorAgent" }
    },
    {
      role: "user",
      content: "I want to go for 5 days starting December 15th."
    }
  ];
  
  // Example tools for flight search
  const flightTools = [
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
            }
          },
          required: ["origin", "destination", "departureDate"]
        }
      }
    }
  ];

  // Make a request as the flight agent
  await makeMCPRequest(messageHistory, "flightAgent", flightTools);
}

// Run the demonstration if executed directly
if (require.main === module) {
  demonstrateDirectMCPRequest().catch(error => {
    console.error('Demonstration failed:', error);
  });
}

module.exports = {
  formatMessagesForMCP,
  makeMCPRequest
};