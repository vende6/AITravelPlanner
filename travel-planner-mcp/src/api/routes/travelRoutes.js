/**
 * Simplified Travel Planning API Routes
 * Temporary placeholder until full implementation is ready
 */

const express = require('express');
const router = express.Router();
const travelPlannerController = require('../controllers/travelPlannerController');

// Initialize session
router.post('/sessions', travelPlannerController.createSession);

// End session
router.delete('/sessions/:sessionId', travelPlannerController.endSession);

// Process user query
router.post('/query', travelPlannerController.processQuery);

// Get personalized recommendations
router.get('/recommendations/:sessionId', travelPlannerController.getRecommendations);

// Get itinerary
router.get('/itinerary/:sessionId', travelPlannerController.getItinerary);

// Get itinerary as PDF
router.get('/itinerary/:itineraryId/pdf', travelPlannerController.getItineraryPdf);

module.exports = router;