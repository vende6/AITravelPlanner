import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Box, Container, Paper,
  CircularProgress, Card, CardContent, Divider,
  Tabs, Tab
} from '@mui/material';
import ConversationalAgentPanel from './ConversationalAgentPanel';
import SmartFilters from './SmartFilters';
import FeedbackAutomation from './FeedbackAutomation';
import InsightCards from './InsightCards';
import PromptTemplates from './PromptTemplates';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Fetch candidates when filters change
  useEffect(() => {
    async function fetchCandidates() {
      try {
        setIsLoading(true);
        
        // Initialize session if needed
        if (!mcpClient.sessionId) {
          await mcpClient.initializeSession();
        }
        
        // Convert activeFilters to a format the API expects
        const filterCriteria = activeFilters.reduce((acc, filter) => {
          if (!acc[filter.type]) {
            acc[filter.type] = [];
          }
          acc[filter.type].push(filter.value);
          return acc;
        }, {});
        
        // Fetch candidates based on filters
        const results = await mcpClient.fetchCandidatesByTraits(filterCriteria);
        setCandidates(results || []);
      } catch (err) {
        setError('Failed to load candidates');
        console.error('Error fetching candidates:', err);
        
        // Set fallback candidates for demo purposes
        setCandidates([
          { 
            id: '1', 
            name: 'Alex Explorer', 
            traits: ['Curiosity', 'Resilience'],
            location: 'Berlin',
            ecoScore: 85,
            reelCount: 3
          },
          { 
            id: '2', 
            name: 'Jamie Trailblazer', 
            traits: ['Leadership', 'Empathy'],
            location: 'Munich',
            ecoScore: 92,
            reelCount: 5
          },
          { 
            id: '3', 
            name: 'Sam Innovator', 
            traits: ['Creativity', 'Adaptability'],
            location: 'Hamburg',
            ecoScore: 78,
            reelCount: 2
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCandidates();
  }, [activeFilters]);
  
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
  };
  
  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setCurrentTab(1); // Switch to feedback tab when candidate is selected
  };
  
  const handlePromptSelect = (promptText) => {
    // Send the prompt to the Conversational Agent Panel
    // In a real implementation, you would have a ref or state lifting to pass this to the chat panel
    console.log('Selected prompt:', promptText);
    // For demo purposes, we'll just alert
    alert(`Prompt selected: "${promptText}"\n\nIn a real implementation, this would be sent to the chat panel.`);
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Recruiter Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use the MCP-powered AI Assistant to find and analyze candidates based on their eco journey and behavioral traits.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left sidebar */}
        <Grid item xs={12} md={3}>
          <SmartFilters onFilterChange={handleFilterChange} />
          
          {/* Insight Cards */}
          <Box sx={{ mt: 3 }}>
            <InsightCards />
          </Box>
        </Grid>
        
        {/* Main content */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, borderRadius: 2, minHeight: '70vh' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ mb: 2 }}
            >
              <Tab label="Candidates" />
              {selectedCandidate && <Tab label={`${selectedCandidate.name} - Feedback`} />}
              <Tab label="Prompt Templates" />
            </Tabs>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Candidates Tab */}
            {currentTab === 0 && (
              <>
                {isLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box sx={{ p: 2, color: 'error.main' }}>
                    <Typography variant="body2">{error}</Typography>
                  </Box>
                ) : candidates.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1">
                      No candidates match your current filters.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your filters or ask the AI assistant for suggestions.
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Found {candidates.length} candidates matching your criteria.
                    </Typography>
                    
                    {candidates.map((candidate) => (
                      <Card 
                        key={candidate.id} 
                        sx={{ 
                          mb: 2, 
                          borderLeft: '4px solid #1976d2',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 3
                          }
                        }}
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        <CardContent>
                          <Typography variant="h6">{candidate.name}</Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Location: {candidate.location}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Eco Score: {candidate.ecoScore}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {candidate.traits && candidate.traits.map((trait, index) => (
                              <Chip key={index} label={trait} size="small" />
                            ))}
                          </Box>
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              {candidate.reelCount} reels available
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </>
            )}
            
            {/* Feedback Tab */}
            {currentTab === 1 && selectedCandidate && (
              <FeedbackAutomation 
                candidate={selectedCandidate}
                onFeedbackSubmitted={() => setCurrentTab(0)}
              />
            )}
            
            {/* Prompt Templates Tab */}
            {currentTab === 2 && (
              <PromptTemplates onPromptSelect={handlePromptSelect} />
            )}
          </Paper>
        </Grid>
        
        {/* Right sidebar - Conversational Agent */}
        <Grid item xs={12} md={4}>
          <ConversationalAgentPanel />
        </Grid>
      </Grid>
    </Container>
  );
}