import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Card, CardContent, 
  Divider, Chip, Skeleton, IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function InsightCards() {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch insights on component mount
  useEffect(() => {
    fetchInsights();
  }, []);
  
  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize session if needed
      if (!mcpClient.sessionId) {
        await mcpClient.initializeSession();
      }
      
      // In a real implementation, you'd call an MCP endpoint to get insights
      // For demo purposes, we'll simulate a response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockInsights = [
        {
          id: '1',
          type: 'preference_match',
          title: 'Preference Match',
          content: 'Jamie Trailblazer\'s latest reel on sustainable urban planning aligns with your past interests.',
          category: 'recommendation',
          candidateId: '2',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'behavior_pattern',
          title: 'Hiring Pattern',
          content: 'You tend to shortlist candidates with high eco scores and strong empathy traits. Consider reviewing Sam Innovator.',
          category: 'analysis',
          candidateId: '3',
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          type: 'trait_insight',
          title: 'Trait Analysis',
          content: 'Candidates showing "resilience" in their reels have 40% higher engagement in sustainability challenges.',
          category: 'trend',
          timestamp: new Date().toISOString()
        }
      ];
      
      setInsights(mockInsights);
    } catch (err) {
      setError('Failed to load insights. Please refresh.');
      console.error('Error fetching insights:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFeedback = (insightId, isPositive) => {
    // In a real implementation, you'd submit feedback to improve the MCP model
    console.log(`Insight feedback: ${insightId}, ${isPositive ? 'positive' : 'negative'}`);
    
    // Remove the insight from the list to acknowledge the feedback
    setInsights(prevInsights => 
      prevInsights.filter(insight => insight.id !== insightId)
    );
  };
  
  // Render loading skeletons while fetching data
  if (isLoading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI Insights</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        {[1, 2, 3].map((item) => (
          <Card key={item} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="60%" />
            </CardContent>
          </Card>
        ))}
      </Paper>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI Insights</Typography>
          <IconButton size="small" onClick={fetchInsights} title="Refresh insights">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }
  
  // Helper to get the appropriate chip color based on insight category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'recommendation': return 'primary';
      case 'analysis': return 'secondary';
      case 'trend': return 'info';
      default: return 'default';
    }
  };
  
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">AI Insights</Typography>
        <IconButton size="small" onClick={fetchInsights} title="Refresh insights">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {insights.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
          No insights available at the moment.
        </Typography>
      ) : (
        insights.map((insight) => (
          <Card key={insight.id} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {insight.title}
                </Typography>
                <Chip 
                  label={insight.category.charAt(0).toUpperCase() + insight.category.slice(1)} 
                  size="small"
                  color={getCategoryColor(insight.category)}
                />
              </Box>
              
              <Typography variant="body2" paragraph>
                {insight.content}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Generated by MCP {insight.type.replace('_', ' ')} agent
                </Typography>
                
                <Box>
                  <Tooltip title="This was helpful">
                    <IconButton size="small" onClick={() => handleFeedback(insight.id, true)}>
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="This wasn't relevant">
                    <IconButton size="small" onClick={() => handleFeedback(insight.id, false)}>
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Paper>
  );
}