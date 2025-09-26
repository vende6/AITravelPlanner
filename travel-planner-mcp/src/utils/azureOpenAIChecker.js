/**
 * Azure OpenAI Deployment Checker
 * Utility to verify Azure OpenAI deployments and their availability
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
require('dotenv').config();

async function checkAzureOpenAIDeployments() {
  try {
    // Get configuration from environment variables
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!endpoint || !apiKey) {
      console.error('Error: Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY in environment variables');
      console.error('Please ensure you have set these in your .env file');
      process.exit(1);
    }
    
    console.log(`Connecting to Azure OpenAI at: ${endpoint}`);
    
    // Initialize the Azure OpenAI client
    const client = new OpenAIClient(
      endpoint, 
      new AzureKeyCredential(apiKey)
    );
    
    // List all deployments - using the correct method
    console.log('Fetching available deployments...');
    
    // Use REST API since the SDK doesn't directly expose deployment listing
    // We'll use the Azure OpenAI client to make a custom request
    const deploymentsList = await listDeploymentsManually(endpoint, apiKey);
    
    if (!deploymentsList || deploymentsList.length === 0) {
      console.log('No deployments found in this Azure OpenAI resource.');
      console.log('You need to create a deployment before you can use the API.');
      console.log('You can create deployments via the Azure Portal or using Azure CLI.');
      return;
    }
    
    console.log('\nAvailable deployments:');
    console.log('-'.repeat(80));
    console.log('| %-30s | %-20s | %-20s |'.replace(/%\-\d+s/g, s => s));
    console.log('| DEPLOYMENT NAME                | MODEL                | STATUS               |');
    console.log('-'.repeat(80));
    
    // Display each deployment
    for (const deployment of deploymentsList) {
      console.log(
        `| ${deployment.name.padEnd(30)} | ${deployment.model.padEnd(20)} | ${deployment.status.padEnd(20)} |`
      );
    }
    console.log('-'.repeat(80));
    
    // Check specific deployment if provided
    const requestedDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
    if (requestedDeployment) {
      console.log(`\nChecking for requested deployment: "${requestedDeployment}"`);
      
      const foundDeployment = deploymentsList.find(d => d.name === requestedDeployment);
      if (foundDeployment) {
        console.log(`✅ Deployment "${requestedDeployment}" exists with status: ${foundDeployment.status}`);
        
        if (foundDeployment.status !== 'succeeded') {
          console.log(`⚠️  Warning: Deployment exists but has status "${foundDeployment.status}"`);
          console.log('    You may need to wait for it to finish provisioning or check for issues.');
        }
        
        // Test the deployment
        console.log(`\nTesting deployment "${requestedDeployment}"...`);
        try {
          const testResult = await client.getChatCompletions(
            requestedDeployment,
            [{ role: "user", content: "Hello, are you working?" }],
            { maxTokens: 50 }
          );
          
          console.log(`✅ Test successful! Response: "${testResult.choices[0].message.content.substring(0, 50)}..."`);
        } catch (testError) {
          console.log(`❌ Test failed: ${testError.message}`);
          if (testError.message.includes('being provisioned') || testError.message.includes('does not exist')) {
            console.log('The deployment might still be provisioning. Please wait a few minutes and try again.');
          }
        }
      } else {
        console.log(`❌ Deployment "${requestedDeployment}" was NOT found in this resource.`);
        console.log('   Please check the deployment name in your .env file.');
        console.log('   Available deployments: ' + deploymentsList.map(d => d.name).join(', '));
      }
    }
    
    console.log('\n✨ Deployment check completed');
  } catch (error) {
    console.error('Error checking deployments:', error);
    
    if (error.code === 'AuthorizationFailed') {
      console.error('\n⚠️  Authentication failed. Please check your API key and endpoint.');
    } else if (error.code === 'ResourceNotFound') {
      console.error('\n⚠️  Resource not found. Please check your Azure OpenAI endpoint.');
    } else {
      console.error('\n⚠️  An unexpected error occurred:', error.message);
    }
  }
}

/**
 * List deployments using manual REST API call
 * @param {string} endpoint - The Azure OpenAI endpoint
 * @param {string} apiKey - The Azure OpenAI API key
 * @returns {Promise<Array>} Array of deployments
 */
async function listDeploymentsManually(endpoint, apiKey) {
  try {
    // Use the built-in https module for the request
    const https = require('https');
    const url = require('url');
    
    // Parse the endpoint to get the hostname
    const parsedUrl = new url.URL(endpoint);
    const hostname = parsedUrl.hostname;
    
    // The Azure OpenAI API version
    const apiVersion = '2023-05-15';
    
    // Construct the deployments endpoint
    const deploymentsPath = `/openai/deployments?api-version=${apiVersion}`;
    
    // Create a promise-based request function
    const makeRequest = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: hostname,
          path: deploymentsPath,
          method: 'GET',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsedData = JSON.parse(data);
                resolve(parsedData);
              } catch (error) {
                reject(new Error(`Failed to parse response: ${error.message}`));
              }
            } else {
              reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
    };
    
    // Make the request
    const response = await makeRequest();
    
    // Process the response to match our expected format
    if (response && response.data) {
      return response.data.map(deployment => ({
        name: deployment.id,
        model: deployment.model,
        status: deployment.status || 'unknown'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to list deployments manually:', error);
    return [];
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkAzureOpenAIDeployments().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { checkAzureOpenAIDeployments };