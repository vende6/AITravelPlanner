/**
 * Travel Planner MCP API Server
 * Main server application for the multi-agent travel planning system
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { checkAzureOpenAIDeployments } = require('./utils/azureOpenAIChecker');

// Handle configuration loading with error checking
let config;
try {
  const configPath = path.join(__dirname, 'config', 'default.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found at ${configPath}`);
  }
  config = require('./config/default.json');
} catch (error) {
  console.error('Failed to load configuration:', error);
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || config.app.port || 3000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure logging
const logFormat = config.logging && config.logging.format ? config.logging.format : 'dev';
app.use(morgan(logFormat)); // Request logging

// Import routes with error handling
let travelRoutes;
try {
  travelRoutes = require('./api/routes/travelRoutes');
  app.use('/api/travel', travelRoutes);
} catch (error) {
  console.error('Failed to load travel routes:', error);
  // Continue without routes - this allows at least the health check to work
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    version: config.app.version,
    environment: config.app.environment
  });
});

// Azure OpenAI deployment check endpoint
app.get('/api/check-deployments', async (req, res) => {
  try {
    // Create a custom capture function to collect the output
    let output = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      output.push(args.join(' '));
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      output.push(`ERROR: ${args.join(' ')}`);
      originalConsoleError(...args);
    };
    
    // Run the deployment check
    await checkAzureOpenAIDeployments();
    
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Return the collected output
    res.json({
      status: 'completed',
      results: output
    });
  } catch (error) {
    console.error('Error checking deployments:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Check Azure OpenAI deployments before starting the server
async function validateAzureResources() {
  try {
    console.log('\n🔍 Checking Azure OpenAI deployments before starting server...');
    await checkAzureOpenAIDeployments();
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to validate Azure resources:', error);
    console.error('You can still start the server, but Azure OpenAI functionality may not work.');
    console.error('Please check your Azure OpenAI configuration and deployments.');
    
    return false;
  }
}

// Start server with error handling
async function startServer() {
  try {
    // Validate Azure resources but continue even if validation fails
    await validateAzureResources();
    
    app.listen(PORT, () => {
      console.log(`${config.app.name} running on port ${PORT}`);
      console.log(`Environment: ${config.app.environment}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
      console.log(`Deployment check available at: http://localhost:${PORT}/api/check-deployments`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;