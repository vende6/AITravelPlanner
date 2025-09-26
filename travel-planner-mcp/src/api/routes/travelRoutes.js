/**
 * Simplified Travel Planning API Routes
 * Temporary placeholder until full implementation is ready
 */

const express = require('express');
const router = express.Router();

// Health check specific to travel API
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Travel planning API is running',
    features: {
      flightSearch: 'pending',
      hotelSearch: 'pending',
      itineraryPlanning: 'pending'
    }
  });
});

// Placeholder route for session creation
router.post('/session', (req, res) => {
  res.status(200).json({
    sessionId: `temp-session-${Date.now()}`,
    message: 'Temporary session created'
  });
});

// Placeholder route for query processing
router.post('/query', (req, res) => {
  const { query } = req.body;
  
  res.status(200).json({
    response: `Echo: ${query}`,
    message: 'This is a placeholder response while the full implementation is being completed.'
  });
});

module.exports = router;