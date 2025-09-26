#!/usr/bin/env node
/**
 * Azure OpenAI Resource Validator Tool
 * ====================================
 * This script validates your Azure OpenAI resources and deployments
 * to ensure they're properly configured for the application.
 */

const { checkAzureOpenAIResources } = require('./src/utils/azureOpenAIResourceChecker');

// Run the Azure OpenAI resource checker
checkAzureOpenAIResources()
  .then(() => {
    console.log('\n✨ Azure OpenAI validation process completed.');
  })
  .catch(err => {
    console.error('❌ Fatal error during Azure OpenAI validation:', err);
    process.exit(1);
  });