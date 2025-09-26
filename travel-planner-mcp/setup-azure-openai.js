#!/usr/bin/env node
/**
 * Azure OpenAI Deployment Setup Script
 * Helps set up the required Azure OpenAI deployments for the Travel Planner application
 */

const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define required deployments for the application
const REQUIRED_DEPLOYMENTS = [
  {
    name: 'gpt-4-turbo', // This is the deployment name we'll reference in code
    model: 'gpt-4',      // This is the actual model to deploy
    description: 'GPT-4 Turbo model for conversation and orchestration',
    required: true
  },
  {
    name: 'text-embedding-ada-002',
    model: 'text-embedding-ada-002',
    description: 'Text embedding model for semantic search',
    required: false
  }
];

/**
 * Run an Azure CLI command
 * @param {string} command - The command to execute
 * @returns {Promise<string>} Command output
 */
function runAzCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`> Running: az ${command}`);
    
    exec(`az ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`Command warnings: ${stderr}`);
      }
      
      resolve(stdout.trim());
    });
  });
}

/**
 * Check if the user is logged in to Azure
 * @returns {Promise<boolean>} Whether the user is logged in
 */
async function checkAzureLogin() {
  try {
    const account = await runAzCommand('account show');
    const accountInfo = JSON.parse(account);
    console.log(`✅ Logged in to Azure as: ${accountInfo.user.name}`);
    console.log(`   Subscription: ${accountInfo.name}`);
    return true;
  } catch (error) {
    console.log('❌ Not logged in to Azure');
    return false;
  }
}

/**
 * Prompt the user to log in to Azure
 * @returns {Promise<boolean>} Whether login was successful
 */
async function loginToAzure() {
  return new Promise((resolve) => {
    rl.question('Do you want to log in to Azure now? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          await runAzCommand('login');
          console.log('✅ Login successful');
          resolve(true);
        } catch (error) {
          console.error('❌ Login failed:', error.message);
          resolve(false);
        }
      } else {
        console.log('Login skipped. You need to be logged in to continue.');
        resolve(false);
      }
    });
  });
}

/**
 * List available Azure OpenAI resources
 * @returns {Promise<Array>} Array of OpenAI resources
 */
async function listOpenAIResources() {
  try {
    const resources = await runAzCommand('cognitiveservices account list --kind OpenAI');
    return JSON.parse(resources);
  } catch (error) {
    console.error('Error listing OpenAI resources:', error.message);
    return [];
  }
}

/**
 * Choose an Azure OpenAI resource
 * @param {Array} resources - Array of available resources
 * @returns {Promise<Object|null>} Selected resource or null if none selected
 */
async function chooseOpenAIResource(resources) {
  if (resources.length === 0) {
    console.log('No Azure OpenAI resources found in your subscription.');
    return null;
  }
  
  console.log('\nAvailable Azure OpenAI resources:');
  resources.forEach((resource, index) => {
    console.log(`${index + 1}. ${resource.name} (${resource.location})`);
  });
  
  return new Promise((resolve) => {
    rl.question('\nEnter the number of the resource to use (or "c" to create new): ', (answer) => {
      if (answer.toLowerCase() === 'c') {
        resolve(null); // Will trigger resource creation
      } else {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < resources.length) {
          resolve(resources[index]);
        } else {
          console.log('Invalid selection. Please try again.');
          resolve(chooseOpenAIResource(resources));
        }
      }
    });
  });
}

/**
 * Create a new Azure OpenAI resource
 * @returns {Promise<Object|null>} Created resource or null if creation failed
 */
async function createOpenAIResource() {
  console.log('\nCreating a new Azure OpenAI resource:');
  
  const name = await new Promise((resolve) => {
    rl.question('Enter a name for the new resource: ', (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
  
  // Get available locations for OpenAI resources
  const locations = JSON.parse(await runAzCommand('cognitiveservices account list-kinds-skus-locations --kind OpenAI'));
  
  console.log('\nAvailable locations:');
  const availableLocations = [...new Set(locations.flatMap(l => l.locations.map(loc => loc.name)))];
  availableLocations.forEach((location, index) => {
    console.log(`${index + 1}. ${location}`);
  });
  
  const locationIndex = await new Promise((resolve) => {
    rl.question('Enter the number of the location to use: ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < availableLocations.length) {
        resolve(index);
      } else {
        console.log('Invalid selection. Using default location (eastus).');
        resolve(availableLocations.indexOf('eastus') !== -1 ? 
               availableLocations.indexOf('eastus') : 0);
      }
    });
  });
  
  const location = availableLocations[locationIndex];
  
  const resourceGroupName = await new Promise((resolve) => {
    rl.question('Enter the resource group name (or create new with "new:<name>"): ', (answer) => {
      resolve(answer.trim());
    });
  });
  
  // Create resource group if needed
  if (resourceGroupName.startsWith('new:')) {
    const newGroupName = resourceGroupName.substring(4);
    console.log(`Creating resource group: ${newGroupName} in ${location}`);
    
    try {
      await runAzCommand(`group create --name ${newGroupName} --location ${location}`);
      console.log(`✅ Resource group ${newGroupName} created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create resource group: ${error.message}`);
      return null;
    }
  }
  
  const actualGroupName = resourceGroupName.startsWith('new:') ? 
                         resourceGroupName.substring(4) : resourceGroupName;
  
  console.log(`Creating Azure OpenAI resource: ${name} in ${location}`);
  
  try {
    await runAzCommand(
      `cognitiveservices account create --name ${name} --resource-group ${actualGroupName} ` +
      `--kind OpenAI --sku S0 --location ${location}`
    );
    
    console.log(`✅ Azure OpenAI resource ${name} created successfully`);
    
    // Retrieve the created resource
    const resources = await listOpenAIResources();
    return resources.find(r => r.name === name) || null;
  } catch (error) {
    console.error(`❌ Failed to create Azure OpenAI resource: ${error.message}`);
    return null;
  }
}

/**
 * List deployments in an Azure OpenAI resource
 * @param {Object} resource - The Azure OpenAI resource
 * @returns {Promise<Array>} Array of deployments
 */
async function listDeployments(resource) {
  try {
    // Use the Azure CLI command to list deployments since the SDK method is not consistently available
    const deployments = await runAzCommand(
      `cognitiveservices account deployment list ` +
      `--name ${resource.name} --resource-group ${resource.resourceGroup}`
    );
    
    // Parse the result
    return JSON.parse(deployments);
  } catch (error) {
    console.error('Error listing deployments with Azure CLI:', error.message);
    
    // Fall back to REST API approach if Azure CLI fails
    return await listDeploymentsViaRest(resource);
  }
}

/**
 * List deployments in an Azure OpenAI resource using REST API
 * @param {Object} resource - The Azure OpenAI resource
 * @returns {Promise<Array>} Array of deployments
 */
async function listDeploymentsViaRest(resource) {
  try {
    // First, get the API key for the resource
    const keys = await getApiKeys(resource);
    if (!keys || !keys.key1) {
      throw new Error('Failed to get API key for the resource');
    }
    
    // Construct the endpoint
    const endpoint = `https://${resource.name}.openai.azure.com/`;
    const apiKey = keys.key1;
    
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
    
    console.log(`Fetching deployments from ${hostname}${deploymentsPath}...`);
    
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
    
    // Process the response to match the expected format for deployments
    if (response && response.data) {
      return response.data.map(deployment => ({
        name: deployment.id,
        model: {
          name: deployment.model
        },
        status: deployment.status || 'unknown'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to list deployments via REST API:', error.message);
    return [];
  }
}

/**
 * Create a deployment in an Azure OpenAI resource
 * @param {Object} resource - The Azure OpenAI resource
 * @param {Object} deployment - Deployment configuration
 * @returns {Promise<boolean>} Whether deployment was successful
 */
async function createDeployment(resource, deployment) {
  try {
    console.log(`Creating deployment: ${deployment.name} (${deployment.model})`);
    
    await runAzCommand(
      `cognitiveservices account deployment create ` +
      `--name ${resource.name} --resource-group ${resource.resourceGroup} ` +
      `--deployment-name ${deployment.name} --model-name ${deployment.model} ` +
      `--model-version "1" --model-format OpenAI`
    );
    
    console.log(`✅ Deployment ${deployment.name} created successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create deployment ${deployment.name}:`, error.message);
    
    if (error.message.includes('being provisioned') || 
        error.message.includes('wait a moment')) {
      console.log('The deployment is being created. Please wait a few minutes before using it.');
      return true;
    }
    
    return false;
  }
}

/**
 * Get API keys for an Azure OpenAI resource
 * @param {Object} resource - The Azure OpenAI resource
 * @returns {Promise<Object>} API keys
 */
async function getApiKeys(resource) {
  try {
    const keys = await runAzCommand(
      `cognitiveservices account keys list ` +
      `--name ${resource.name} --resource-group ${resource.resourceGroup}`
    );
    return JSON.parse(keys);
  } catch (error) {
    console.error('Error retrieving API keys:', error.message);
    return null;
  }
}

/**
 * Update the .env file with Azure OpenAI configuration
 * @param {Object} resource - The Azure OpenAI resource
 * @param {Object} keys - API keys
 */
function updateEnvFile(resource, keys) {
  const envPath = path.join(process.cwd(), '.env');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update Azure OpenAI configuration
  const endpoint = `https://${resource.name}.openai.azure.com/`;
  const apiKey = keys.key1;
  
  const configs = {
    'AZURE_OPENAI_ENDPOINT': endpoint,
    'AZURE_OPENAI_API_KEY': apiKey,
    'AZURE_OPENAI_DEPLOYMENT_ID': 'gpt-4-turbo'
  };
  
  let updatedContent = envContent;
  
  for (const [key, value] of Object.entries(configs)) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    
    if (regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(regex, `${key}=${value}`);
    } else {
      updatedContent += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(envPath, updatedContent);
  console.log(`✅ Updated .env file with Azure OpenAI configuration`);
}

/**
 * Main function
 */
async function main() {
  console.log('🌟 Azure OpenAI Deployment Setup for Travel Planner MCP\n');
  
  // Check if logged in
  const isLoggedIn = await checkAzureLogin();
  if (!isLoggedIn) {
    const loginSuccessful = await loginToAzure();
    if (!loginSuccessful) {
      console.log('❌ You must be logged in to Azure to continue. Exiting.');
      rl.close();
      return;
    }
  }
  
  // List and choose an OpenAI resource
  const resources = await listOpenAIResources();
  let selectedResource = await chooseOpenAIResource(resources);
  
  // Create a new resource if needed
  if (!selectedResource) {
    console.log('\nYou need to create an Azure OpenAI resource to continue.');
    selectedResource = await createOpenAIResource();
    
    if (!selectedResource) {
      console.log('❌ Failed to create or select an Azure OpenAI resource. Exiting.');
      rl.close();
      return;
    }
  }
  
  console.log(`\nUsing Azure OpenAI resource: ${selectedResource.name}`);
  
  // List existing deployments
  const existingDeployments = await listDeployments(selectedResource);
  console.log('\nExisting deployments:');
  
  if (existingDeployments.length === 0) {
    console.log('No deployments found');
  } else {
    existingDeployments.forEach(d => {
      console.log(`- ${d.name} (${d.model.name})`);
    });
  }
  
  // Check if required deployments exist, create if needed
  console.log('\nChecking required deployments...');
  
  const deploymentPromises = REQUIRED_DEPLOYMENTS.map(async (requiredDeployment) => {
    const exists = existingDeployments.some(d => d.name === requiredDeployment.name);
    
    if (exists) {
      console.log(`✅ Deployment ${requiredDeployment.name} already exists`);
      return true;
    } else {
      console.log(`⚠️ Deployment ${requiredDeployment.name} is missing`);
      
      return new Promise((resolve) => {
        rl.question(`Create deployment ${requiredDeployment.name}? (y/n): `, async (answer) => {
          if (answer.toLowerCase() === 'y') {
            const success = await createDeployment(selectedResource, requiredDeployment);
            resolve(success);
          } else {
            console.log(`Skipped creating deployment ${requiredDeployment.name}`);
            resolve(!requiredDeployment.required);
          }
        });
      });
    }
  });
  
  const deploymentResults = await Promise.all(deploymentPromises);
  
  // Check if all required deployments were created
  if (deploymentResults.every(Boolean)) {
    console.log('\n✅ All necessary deployments are available.');
    
    // Get API keys
    const keys = await getApiKeys(selectedResource);
    
    if (keys) {
      updateEnvFile(selectedResource, keys);
      
      console.log('\n🎉 Setup complete! Your Azure OpenAI resources are ready.');
      console.log('\nYou can now run the Travel Planner application with:');
      console.log('  npm start');
      console.log('\nNote: If you just created new deployments, they might take a few minutes to become available.');
      console.log('If you encounter a "deployment does not exist" error, wait a few minutes and try again.');
    } else {
      console.log('\n❌ Failed to retrieve API keys. Please configure your .env file manually.');
    }
  } else {
    console.log('\n❌ Some required deployments are missing. The application may not work correctly.');
  }
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
});