import React, { useState } from 'react';
import {
  Paper, Typography, Box, Button, TextField, Rating, 
  Chip, CircularProgress, Snackbar, Alert,
  Card, CardContent, Divider, FormControlLabel, Switch
} from '@mui/material';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function FeedbackAutomation({ candidate, onFeedbackSubmitted }) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(3);
  const [tags, setTags] = useState([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [similarCandidates, setSimilarCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const availableTags = [
    'Impressive', 'Creative', 'Professional',
    'Needs Improvement', 'Good Communication', 'Technical',
    'Leadership', 'Team Player', 'Innovative'
  ];
  
  const handleTagToggle = (tag) => {
    setTags(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };
  
  const handleSubmit = async () => {
    if (!feedback.trim()) {
      setSnackbarMessage('Please provide feedback before submitting');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create feedback data
      const feedbackData = {
        rating,
        comment: feedback,
        tags,
        sendNotification,
        timestamp: new Date().toISOString()
      };
      
      // Submit feedback via MCP client
      const result = await mcpClient.submitFeedback(candidate.id, feedbackData);
      
      // Show success message
      setSnackbarMessage('Feedback submitted successfully');
      setSnackbarOpen(true);
      
      // Clear form
      setFeedback('');
      setRating(3);
      setTags([]);
      
      // Update similar candidates based on response
      if (result && result.similarCandidates) {
        setSimilarCandidates(result.similarCandidates);
      }
      
      // Notify parent component
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedbackData, result);
      }
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      console.error('Feedback submission error:', err);
      
      // Set demo similar candidates for testing UI
      setSimilarCandidates([
        { id: '101', name: 'Riley Morgan', match: 92, traits: ['Leadership', 'Resilience'] },
        { id: '102', name: 'Taylor Quinn', match: 87, traits: ['Creativity', 'Adaptability'] }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Candidate Feedback</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>Overall Rating</Typography>
        <Rating 
          value={rating} 
          onChange={(event, newValue) => {
            setRating(newValue);
          }}
          size="large"
          sx={{ mb: 2 }}
        />
        
        <Typography variant="subtitle2" gutterBottom>Feedback Tags</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {availableTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onClick={() => handleTagToggle(tag)}
              color={tags.includes(tag) ? 'primary' : 'default'}
              variant={tags.includes(tag) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>Detailed Feedback</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Enter your detailed feedback for this candidate..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <FormControlLabel 
          control={
            <Switch 
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
            />
          } 
          label="Notify candidate via FollowUpAgent"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          fullWidth
          sx={{ mb: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Submit Feedback'}
        </Button>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
      </Box>
      
      {similarCandidates.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>Similar Candidates</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on your feedback, you might be interested in these candidates:
          </Typography>
          
          {similarCandidates.map((similar) => (
            <Card key={similar.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">{similar.name}</Typography>
                  <Chip 
                    label={`${similar.match}% match`}
                    color="success" 
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {similar.traits && similar.traits.map((trait, i) => (
                    <Chip key={i} label={trait} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}