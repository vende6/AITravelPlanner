/**
 * Travel Planner MCP API Server
 * Main server application for the multi-agent travel planning system
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const config = require('./config/default.json');
const travelRoutes = require('./api/routes/travelRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || config.app.port || 3000;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan(config.logging.format)); // Request logging

// API Routes
app.use('/api/travel', travelRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: config.app.name,
    version: config.app.version,
    environment: config.app.environment
  });
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

// Start server
app.listen(PORT, () => {
  console.log(`${config.app.name} running on port ${PORT}`);
  console.log(`Environment: ${config.app.environment}`);
});

module.exports = app;