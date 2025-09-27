/**
 * Azure OpenAI Test Script
 * This script tests the connection to Azure OpenAI and makes a simple completion request
 */
require('dotenv').config();
const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');

async function testAzureOpenAI() {
  // Check for required environment variables
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;

  if (!endpoint || !apiKey || !deploymentId) {
    console.error('❌ Missing required environment variables.');
    console.error('Please ensure the following are set in your .env file:');
    console.error('- AZURE_OPENAI_ENDPOINT');
    console.error('- AZURE_OPENAI_API_KEY');
    console.error('- AZURE_OPENAI_DEPLOYMENT_ID');
    process.exit(1);
  }

  console.log('🔍 Testing Azure OpenAI connection...');
  console.log(`• Endpoint: ${endpoint}`);
  console.log(`• Deployment: ${deploymentId}`);
  
  try {
    // Initialize the Azure OpenAI client
    const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    
    // Sample messages for a chat completion
    const messages = [
      { role: "system", content: "You are a travel planning assistant that helps users plan their trips." },
      { role: "user", content: "I'm thinking about visiting Seattle for 3 days. What should I do there?" }
    ];
    
    console.log('\n📤 Sending request to Azure OpenAI...');
    console.log('System: "You are a travel planning assistant that helps users plan their trips."');
    console.log('User: "I\'m thinking about visiting Seattle for 3 days. What should I do there?"');
    
    // Make the API call
    const result = await client.getChatCompletions(deploymentId, messages, {
      maxTokens: 800,
      temperature: 0.7,
    });
    
    // Display the response
    console.log('\n✅ Received response from Azure OpenAI:');
    console.log('--------------------------------------------------');
    console.log(result.choices[0].message.content);
    console.log('--------------------------------------------------');
    
    // Additional information
    console.log('\n📊 Request details:');
    console.log(`• Completion tokens: ${result.usage.completionTokens}`);
    console.log(`• Prompt tokens: ${result.usage.promptTokens}`);
    console.log(`• Total tokens: ${result.usage.totalTokens}`);
    console.log(`• Finish reason: ${result.choices[0].finishReason}`);
    
    console.log('\n✨ Azure OpenAI test completed successfully!');
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    
    // Provide more helpful error diagnostics
    if (error.message.includes('401')) {
      console.error('Authentication failed. Please check your API key.');
    } else if (error.message.includes('404')) {
      console.error('Resource not found. Please check your endpoint URL and deployment ID.');
      console.error('Make sure the deployment exists and is properly configured.');
    } else if (error.message.includes('429')) {
      console.error('Rate limit exceeded. Your requests are being throttled.');
      console.error('Consider implementing rate limiting in your application.');
    }
    
    process.exit(1);
  }
}

// Run the test function
testAzureOpenAI().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});