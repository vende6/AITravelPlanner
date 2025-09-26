/**
 * Travel Planning API Routes
 * Exposes travel planning functionality through RESTful endpoints
 */

const express = require('express');
const router = express.Router();
const TravelPlannerController = require('../controllers/travelPlannerController');
const auth = require('../middleware/auth');
const config = require('../../config/default.json');

// Initialize the controller
const travelPlannerController = new TravelPlannerController(config);

/**
 * Initialize a new travel planning session
 * POST /api/travel/session
 */
router.post('/session', auth, (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = travelPlannerController.initializeSession(userId);
    
    res.status(201).json({
      sessionId,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error.message
    });
  }
});

/**
 * Process a user query within a session
 * POST /api/travel/query
 */
router.post('/query', auth, async (req, res) => {
  try {
    const { sessionId, query } = req.body;
    
    if (!sessionId || !query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both sessionId and query are required'
      });
    }
    
    const result = await travelPlannerController.processQuery(sessionId, query);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message
    });
  }
});

/**
 * Get the current travel plan
 * GET /api/travel/plan/:sessionId
 */
router.get('/plan/:sessionId', auth, (req, res) => {
  try {
    const { sessionId } = req.params;
    const travelPlan = travelPlannerController.getTravelPlan(sessionId);
    
    res.json({ travelPlan });
  } catch (error) {
    console.error('Error retrieving travel plan:', error);
    res.status(500).json({
      error: 'Failed to retrieve travel plan',
      message: error.message
    });
  }
});

/**
 * Generate a formatted itinerary document
 * GET /api/travel/itinerary/:sessionId
 */
router.get('/itinerary/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const itinerary = await travelPlannerController.generateItineraryDocument(sessionId);
    
    res.json({ itinerary });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      error: 'Failed to generate itinerary',
      message: error.message
    });
  }
});

/**
 * Get personalized recommendations for the current travel plan
 * GET /api/travel/recommendations/:sessionId
 */
router.get('/recommendations/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const recommendations = await travelPlannerController.getPersonalizedRecommendations(sessionId);
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * End a travel planning session
 * DELETE /api/travel/session/:sessionId
 */
router.delete('/session/:sessionId', auth, (req, res) => {
  try {
    const { sessionId } = req.params;
    travelPlannerController.endSession(sessionId);
    
    res.json({
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      error: 'Failed to end session',
      message: error.message
    });
  }
});

module.exports = router;