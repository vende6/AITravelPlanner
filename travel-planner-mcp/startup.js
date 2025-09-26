/**
 * Startup script for Travel Planner MCP application
 * Ensures the required directory structure exists before starting the server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Required directories
const requiredDirs = [
  'src/config',
  'src/api/controllers',
  'src/api/routes',
  'src/api/middleware',
  'src/core/mcp',
  'src/core/services',
  'src/agents'
];

// Create missing directories
console.log('Checking required directories...');

for (const dir of requiredDirs) {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Check for config file
const configPath = path.join(__dirname, 'src/config/default.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: Configuration file missing at src/config/default.json');
  process.exit(1);
}

// Start the server with proper error handling
try {
  console.log('Starting server...');
  require('./src/server');
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}