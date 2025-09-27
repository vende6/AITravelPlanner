import React, { useState, useEffect, useRef } from 'react';
import { 
  Paper, Typography, Box, TextField, Button, 
  CircularProgress, List, ListItem, Chip,
  Divider, IconButton, Card, CardContent
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function ConversationalAgentPanel() {
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentType, setAgentType] = useState('general'); // general, trait, reel
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "Show me empathetic candidates from Berlin",
    "Summarize Alex Explorer's eco journey",
    "Which reels demonstrate leadership traits"
  ]);
  
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of conversation when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations]);
  
  // Initialize MCP session when component mounts
  useEffect(() => {
    async function initSession() {
      try {
        await mcpClient.initializeSession();
        
        // Add a welcome message
        setConversations([{
          type: 'system',
          text: 'Hello! I can help you find candidates, analyze reels, and provide insights. What would you like to know?',
          timestamp: new Date()
        }]);
      } catch (err) {
        setError('Could not connect to the AI system. Please refresh the page.');
        console.error('Session initialization failed:', err);
      }
    }
    
    initSession();
    
    return () => {
      // Clean up logic if needed when component unmounts
    };
  }, []);
  
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!query.trim()) return;
    
    const userInput = query;
    setQuery('');
    setIsLoading(true);
    setError(null);
    
    // Add user message to conversation
    setConversations(prev => [
      ...prev, 
      {
        type: 'user',
        text: userInput,
        timestamp: new Date()
      }
    ]);
    
    try {
      // Determine which agent to route to based on query content
      let detectedAgentType = 'general';
      
      if (userInput.toLowerCase().includes('reel') || 
          userInput.toLowerCase().includes('video') || 
          userInput.toLowerCase().includes('journey')) {
        detectedAgentType = 'reel';
      } else if (userInput.toLowerCase().includes('trait') || 
                userInput.toLowerCase().includes('empathetic') || 
                userInput.toLowerCase().includes('leadership')) {
        detectedAgentType = 'trait';
      }
      
      setAgentType(detectedAgentType);
      
      // Process the query through MCP
      const result = await mcpClient.sendQuery(userInput);
      
      // Add agent message to conversation
      setConversations(prev => [
        ...prev,
        {
          type: 'agent',
          agentType: detectedAgentType,
          text: result.response || result.reply,
          data: result.data || null, // Additional structured data if available
          timestamp: new Date()
        }
      ]);
      
      // Update suggested prompts based on the conversation context
      if (result.suggestedPrompts) {
        setSuggestedPrompts(result.suggestedPrompts);
      }
    } catch (err) {
      setError(`Sorry, I couldn't process your request: ${err.message}`);
      console.error('Query processing failed:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleSuggestedPrompt = (prompt) => {
    setQuery(prompt);
    // Optional: auto-submit or let user edit before submitting
  };
  
  // Render a message based on its type
  const renderMessage = (message, index) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <ListItem 
        key={index}
        sx={{ 
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          padding: 1
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: '75%',
            bgcolor: isUser ? '#e3f2fd' : isSystem ? '#f5f5f5' : '#ffffff',
            borderRadius: 2
          }}
        >
          {!isUser && !isSystem && (
            <Typography variant="caption" color="text.secondary">
              {message.agentType === 'trait' ? 'Trait Agent' : 
               message.agentType === 'reel' ? 'Reel Agent' : 'AI Assistant'}
            </Typography>
          )}
          
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </Typography>
          
          {/* Render structured data if available */}
          {message.data && (
            <Box sx={{ mt: 2 }}>
              {message.data.candidates && (
                <Box>
                  <Typography variant="subtitle2">
                    {message.data.candidates.length} candidates found:
                  </Typography>
                  {message.data.candidates.slice(0, 3).map((candidate, idx) => (
                    <Card key={idx} variant="outlined" sx={{ mt: 1, mb: 1 }}>
                      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                        <Typography variant="subtitle2">{candidate.name}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {candidate.traits && candidate.traits.slice(0, 3).map((trait, i) => (
                            <Chip key={i} label={trait} size="small" />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  {message.data.candidates.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      And {message.data.candidates.length - 3} more...
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
      </ListItem>
    );
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '70vh',
        maxHeight: '800px',
        overflow: 'hidden',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#1976d2', 
          color: 'white',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}
      >
        <Typography variant="h6">AI Recruiter Assistant</Typography>
        <Typography variant="body2">
          Powered by Model Context Protocol
        </Typography>
      </Box>
      
      {/* Conversation area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: 2,
          bgcolor: '#f9f9f9'
        }}
      >
        <List>
          {conversations.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </List>
        
        {isLoading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Box 
            sx={{ 
              p: 2, 
              m: 2, 
              bgcolor: '#ffebee', 
              borderRadius: 1,
              color: 'error.main'
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </Box>
      
      {/* Suggested prompts */}
      <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestedPrompts.map((prompt, index) => (
          <Chip
            key={index}
            label={prompt}
            size="small"
            onClick={() => handleSuggestedPrompt(prompt)}
            sx={{ fontSize: '0.7rem' }}
          />
        ))}
      </Box>
      
      {/* Input area */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          borderTop: '1px solid #e0e0e0',
          display: 'flex', 
          gap: 1 
        }}
      >
        <TextField
          fullWidth
          placeholder="Ask about candidates or reels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={3}
          variant="outlined"
          disabled={isLoading}
          size="small"
        />
        <IconButton 
          color="primary" 
          type="submit" 
          disabled={isLoading || !query.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}