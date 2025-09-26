/**
 * Azure OpenAI Resource Checker
 * A reliable utility to verify Azure OpenAI resources and deployments
 * using the official Azure OpenAI SDK and REST APIs
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const axios = require('axios');
require('dotenv').config();

async function checkAzureOpenAIResources() {
  console.log('🔍 Azure OpenAI Resource & Deployment Checker');
  console.log('==================================================');

  // First, try using environment variables
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_ID;

  if (!endpoint || !apiKey) {
    console.log('❌ Missing Azure OpenAI configuration in environment variables.');
    console.log('Please make sure your .env file contains:');
    console.log('  AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/');
    console.log('  AZURE_OPENAI_API_KEY=your-api-key');
    console.log('  AZURE_OPENAI_DEPLOYMENT_ID=your-deployment-name');
    return;
  }

  console.log('Environment Variables:');
  console.log(`• Endpoint: ${endpoint}`);
  console.log(`• API Key: ${'•'.repeat(apiKey.length / 2)} (hidden)`);
  console.log(`• Deployment ID: ${deploymentName || 'Not specified'}`);
  console.log('--------------------------------------------------');

  // Validate endpoint format
  if (!endpoint.startsWith('https://') || !endpoint.includes('.openai.azure.com')) {
    console.log('❌ Invalid Azure OpenAI endpoint format.');
    console.log('The endpoint should look like: https://your-resource.openai.azure.com/');
    return;
  }

  // Extract resource name from the endpoint
  const resourceName = endpoint.replace('https://', '').split('.')[0];
  console.log(`Detected resource name: ${resourceName}`);

  try {
    // 1. Try checking the resource using the REST API with API key auth
    console.log('\n📡 Checking resource availability using direct REST API...');
    const deployments = await getDeploymentsViaRest(endpoint, apiKey);
    
    console.log('✅ Resource is accessible via REST API');
    console.log(`Found ${deployments.length} deployment(s):`);
    
    if (deployments.length === 0) {
      console.log('   No deployments found.');
    } else {
      console.log('\n| DEPLOYMENT NAME                | MODEL                  | STATUS           |');
      console.log('|--------------------------------|------------------------|------------------|');
      
      deployments.forEach(deployment => {
        console.log(
          `| ${deployment.name.padEnd(30)} | ${deployment.model.padEnd(22)} | ${deployment.status.padEnd(16)} |`
        );
      });
    }

    // Check if the specified deployment exists
    if (deploymentName) {
      const specifiedDeployment = deployments.find(d => d.name === deploymentName);
      
      if (specifiedDeployment) {
        console.log(`\n✅ Specified deployment "${deploymentName}" exists.`);
        
        // Test the deployment with a simple request
        console.log(`\n🧪 Testing deployment "${deploymentName}" with a simple request...`);
        try {
          const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
          const result = await client.getChatCompletions(
            deploymentName,
            [{ role: "system", content: "You are a helpful assistant." }, 
             { role: "user", content: "Say hello" }],
            { maxTokens: 10 }
          );
          
          console.log(`✅ Test successful! Response: "${result.choices[0].message.content}"`);
        } catch (testError) {
          console.log(`❌ Test failed: ${testError.message}`);
          if (testError.message.includes('being provisioned')) {
            console.log('   The deployment may still be provisioning. Please wait a few minutes and try again.');
          }
        }
      } else {
        console.log(`\n❌ Specified deployment "${deploymentName}" does not exist in this resource.`);
        console.log('   Please check your AZURE_OPENAI_DEPLOYMENT_ID setting in .env');
        if (deployments.length > 0) {
          console.log('   Available deployments: ' + deployments.map(d => d.name).join(', '));
        }
      }
    }
  } catch (error) {
    console.log(`❌ Failed to access Azure OpenAI resource: ${error.message}`);
    
    if (error.response && error.response.status === 401) {
      console.log('   Authentication failed. Please check your API key.');
    } else if (error.response && error.response.status === 404) {
      console.log('   Resource not found. Please check your endpoint URL.');
      console.log('   Make sure the resource exists and you have access to it.');
      console.log('\n   📢 Common causes of 404 errors:');
      console.log('   - Incorrect endpoint URL format - should be: https://YOUR_RESOURCE_NAME.openai.azure.com/');
      console.log('   - Missing or incorrect API version - we\'re using 2023-05-15');
      console.log('   - Resource recently created - may take a few minutes to be available');
      console.log('   - Incorrect API key for this resource');
      
      // Try with different API versions
      await tryAlternativeApiVersions(endpoint, apiKey);
    } else if (error.code === 'ENOTFOUND') {
      console.log('   Could not reach the endpoint. Please check your internet connection');
      console.log('   and verify that the endpoint URL is correct.');
    }
  }

  // Additional suggestions
  console.log('\n--------------------------------------------------');
  console.log('📋 Recommendations:');
  
  if (!deploymentName) {
    console.log('• Add AZURE_OPENAI_DEPLOYMENT_ID to your .env file');
  }
  
  console.log('• Ensure you have the right permissions for this Azure OpenAI resource');
  console.log('• If you just created a deployment, wait 5-10 minutes for it to be ready');
  console.log('• Check the Azure Portal to verify your deployments and resource status');
}

/**
 * Get deployments using REST API
 * @param {string} endpoint - Azure OpenAI endpoint
 * @param {string} apiKey - Azure OpenAI API key
 * @param {string} apiVersion - API version to use (default: 2023-05-15)
 */
async function getDeploymentsViaRest(endpoint, apiKey, apiVersion = '2023-05-15') {
  try {
    // Ensure endpoint has trailing slash
    const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    const deploymentsUrl = `${baseUrl}openai/deployments?api-version=${apiVersion}`;
    
    console.log(`Requesting: ${deploymentsUrl}`);
    
    const response = await axios.get(deploymentsUrl, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.data) {
      return response.data.data.map(deployment => ({
        name: deployment.id,
        model: deployment.model,
        status: deployment.status || 'unknown'
      }));
    }
    
    return [];
  } catch (error) {
    console.log(`Error details: ${error.message}`);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      console.log(`Response data:`, error.response.data);
    }
    throw error;
  }
}

/**
 * Try alternative API versions
 * @param {string} endpoint - Azure OpenAI endpoint
 * @param {string} apiKey - Azure OpenAI API key
 */
async function tryAlternativeApiVersions(endpoint, apiKey) {
  const apiVersions = ['2023-03-15-preview', '2022-12-01'];
  
  console.log('\n🔄 Trying alternative API versions...');
  
  for (const version of apiVersions) {
    try {
      console.log(`Testing with API version: ${version}`);
      const deployments = await getDeploymentsViaRest(endpoint, apiKey, version);
      console.log(`✅ Success with API version ${version}! Found ${deployments.length} deployments.`);
      
      if (deployments.length > 0) {
        console.log('\n| DEPLOYMENT NAME                | MODEL                  | STATUS           |');
        console.log('|--------------------------------|------------------------|------------------|');
        
        deployments.forEach(deployment => {
          console.log(
            `| ${deployment.name.padEnd(30)} | ${deployment.model.padEnd(22)} | ${deployment.status.padEnd(16)} |`
          );
        });
      }
      
      console.log(`\n📝 Recommendation: Update your code to use API version ${version}`);
      return;
    } catch (error) {
      console.log(`❌ API version ${version} failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ All API versions failed. Please verify your Azure OpenAI resource in the Azure Portal.');
}

// Run the checker if this file is executed directly
if (require.main === module) {
  checkAzureOpenAIResources().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { checkAzureOpenAIResources };