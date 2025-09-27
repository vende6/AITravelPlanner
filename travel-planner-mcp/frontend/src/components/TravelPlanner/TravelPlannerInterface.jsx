import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import TravelChatPanel from './TravelChatPanel';
import FlightSearchPanel from './FlightSearchPanel';
import HotelDisplayPanel from './HotelDisplayPanel';
import LocalExperiencesPanel from './LocalExperiencesPanel';
import ItineraryViewPanel from './ItineraryViewPanel';
import TravelMapVisualization from './TravelMapVisualization';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const TravelPlannerInterface = () => {
  // State for managing the travel planning session
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [travelPlan, setTravelPlan] = useState({
    flights: null,
    hotels: null,
    activities: null,
    itinerary: null,
    budget: {
      total: 0,
      flights: 0,
      hotels: 0,
      activities: 0
    }
  });
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'flights', 'hotels', 'activities', 'itinerary'
  const [conversations, setConversations] = useState([]);

  // Initialize session when component mounts
  useEffect(() => {
    initializeSession();
    
    return () => {
      // Cleanup session when component unmounts
      if (sessionId) {
        endSession(sessionId);
      }
    };
  }, []);

  // Initialize a new travel planning session
  const initializeSession = async () => {
    setIsLoading(true);
    try {
      // Generate a client-side session ID
      const newSessionId = uuidv4();
      const response = await axios.post('/api/travel/sessions', { 
        userId: 'user-' + uuidv4().slice(0, 8) // Simple user ID for demo purposes
      });

      if (response.data && response.data.sessionId) {
        setSessionId(response.data.sessionId);
        
        // Add welcome message
        setConversations([{
          id: uuidv4(),
          type: 'system',
          text: 'Welcome to your AI Travel Planner! How can I help plan your trip today?',
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Failed to initialize session');
      }
    } catch (err) {
      console.error('Error initializing session:', err);
      setError('Failed to start planning session. Please try again later.');
      
      // Fallback to client-side session
      const fallbackSessionId = 'local-' + uuidv4();
      setSessionId(fallbackSessionId);
      
      // Add fallback welcome message
      setConversations([{
        id: uuidv4(),
        type: 'system',
        text: 'Welcome to your AI Travel Planner! (Working in offline mode) How can I help plan your trip today?',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // End the travel planning session
  const endSession = async (sid) => {
    try {
      await axios.delete(`/api/travel/sessions/${sid}`);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  // Process user query and update travel plan
  const processQuery = async (query) => {
    if (!sessionId || !query.trim()) return;
    
    const queryId = uuidv4();
    
    // Add user message to conversations
    setConversations(prev => [
      ...prev, 
      {
        id: queryId,
        type: 'user',
        text: query,
        timestamp: new Date()
      }
    ]);
    
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/travel/query`, {
        sessionId,
        query
      });

      if (response.data) {
        // Update travel plan with response data
        setTravelPlan(response.data.plan || travelPlan);
        
        // Add agent response to conversations
        setConversations(prev => [
          ...prev, 
          {
            id: uuidv4(),
            type: 'assistant',
            text: response.data.response,
            timestamp: new Date(),
            planUpdate: response.data.plan
          }
        ]);
        
        // Determine which view to show based on the query content and response
        updateActiveViewBasedOnResponse(query, response.data);
      }
    } catch (err) {
      console.error('Error processing query:', err);
      setError('Failed to process your request. Please try again.');
      
      // Add error message to conversations
      setConversations(prev => [
        ...prev, 
        {
          id: uuidv4(),
          type: 'error',
          text: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update active view based on query and response
  const updateActiveViewBasedOnResponse = (query, responseData) => {
    const queryLower = query.toLowerCase();
    const plan = responseData.plan || {};
    
    if (plan.flights && !plan.hotels && !plan.activities) {
      setActiveView('flights');
    } else if (plan.hotels && !plan.flights && !plan.activities) {
      setActiveView('hotels');
    } else if (plan.activities && !plan.flights && !plan.hotels) {
      setActiveView('activities');
    } else if (plan.itinerary) {
      setActiveView('itinerary');
    } else if (queryLower.includes('flight') || queryLower.includes('fly')) {
      setActiveView('flights');
    } else if (queryLower.includes('hotel') || queryLower.includes('stay') || queryLower.includes('accommodation')) {
      setActiveView('hotels');
    } else if (queryLower.includes('activity') || queryLower.includes('experience') || queryLower.includes('visit') || queryLower.includes('see')) {
      setActiveView('activities');
    } else if (queryLower.includes('itinerary') || queryLower.includes('plan') || queryLower.includes('schedule')) {
      setActiveView('itinerary');
    }
  };

  // Generate personalized recommendations
  const getPersonalizedRecommendations = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/travel/recommendations/${sessionId}`);
      
      if (response.data && response.data.recommendations) {
        // Add recommendations to conversations
        setConversations(prev => [
          ...prev, 
          {
            id: uuidv4(),
            type: 'recommendation',
            text: 'Based on your preferences, here are some personalized recommendations:',
            timestamp: new Date(),
            recommendations: response.data.recommendations
          }
        ]);
      }
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError('Failed to get personalized recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate itinerary document
  const generateItineraryDocument = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/travel/itinerary/${sessionId}`);
      
      if (response.data && response.data.itinerary) {
        // Update active view to itinerary
        setActiveView('itinerary');
        
        // Update travel plan with itinerary
        setTravelPlan(prev => ({
          ...prev,
          itinerary: response.data.itinerary
        }));
        
        // Add itinerary message to conversations
        setConversations(prev => [
          ...prev, 
          {
            id: uuidv4(),
            type: 'itinerary',
            text: 'I\'ve generated a complete itinerary for your trip:',
            timestamp: new Date(),
            itinerary: response.data.itinerary
          }
        ]);
      }
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError('Failed to generate itinerary document.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId && isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography ml={2} variant="h6">Initializing Travel Planner...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Travel Planner
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Left panel - Chat Interface */}
        <Grid item xs={12} md={6} lg={4}>
          <TravelChatPanel 
            conversations={conversations}
            onSendMessage={processQuery}
            isLoading={isLoading}
            onRequestRecommendations={getPersonalizedRecommendations}
            onGenerateItinerary={generateItineraryDocument}
          />
        </Grid>
        
        {/* Right panel - Dynamic Content Based on Active View */}
        <Grid item xs={12} md={6} lg={8}>
          <Paper 
            elevation={3} 
            sx={{ p: 2, height: 'calc(100vh - 200px)', overflowY: 'auto' }}
          >
            {activeView === 'flights' && travelPlan.flights && (
              <FlightSearchPanel flights={travelPlan.flights} />
            )}
            
            {activeView === 'hotels' && travelPlan.hotels && (
              <HotelDisplayPanel hotels={travelPlan.hotels} />
            )}
            
            {activeView === 'activities' && travelPlan.activities && (
              <LocalExperiencesPanel activities={travelPlan.activities} />
            )}
            
            {activeView === 'itinerary' && travelPlan.itinerary && (
              <ItineraryViewPanel itinerary={travelPlan.itinerary} />
            )}
            
            {(!travelPlan[activeView] && activeView !== 'chat') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" color="textSecondary">
                  No {activeView} information available yet
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Start planning your trip by chatting with the AI assistant
                </Typography>
              </Box>
            )}
            
            {activeView === 'chat' && (
              <TravelMapVisualization travelPlan={travelPlan} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TravelPlannerInterface;