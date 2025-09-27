import React, { useState } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Paper, List, ListItem, Divider, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function MCPChatPanel() {
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    const userQuery = query;
    setQuery(''); // Clear input after sending
    
    // Add user message to conversation immediately
    setConversations(prev => [...prev, { type: 'user', text: userQuery }]);
    
    try {
      // Send query to MCP backend
      const result = await fetch('/api/mcp/query', {
        method: 'POST',
        body: JSON.stringify({ query: userQuery }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!result.ok) {
        throw new Error('Failed to get response from AI assistant');
      }
      
      const data = await result.json();
      
      // Add AI response to conversation
      setConversations(prev => [...prev, { type: 'ai', text: data.reply }]);
    } catch (err) {
      setError(err.message);
      console.error('Error querying MCP:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, borderRadius: 2, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom>AI Recruiter Assistant</Typography>
      
      {/* Conversation history */}
      <Box sx={{ height: 300, overflowY: 'auto', mb: 2, bgcolor: '#f5f5f5', borderRadius: 1, p: 2 }}>
        {conversations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>
            Ask the AI for candidate insights or search help
          </Typography>
        ) : (
          <List>
            {conversations.map((msg, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start" sx={{ 
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                  pl: 1, pr: 1
                }}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      maxWidth: '80%', 
                      bgcolor: msg.type === 'user' ? '#e3f2fd' : '#ffffff',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                  </Paper>
                </ListItem>
                {index < conversations.length - 1 && <Box sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
        {isLoading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
      </Box>
      
      {/* Input area */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        />
        <IconButton 
          color="primary" 
          onClick={handleQuery} 
          disabled={isLoading || !query.trim()}
          size="large"
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Sample prompts */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">Try asking:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
          {["Show me empathetic candidates", "Summarize top reels", "Find candidates with leadership traits"].map((prompt) => (
            <Button 
              key={prompt} 
              size="small" 
              variant="outlined" 
              onClick={() => setQuery(prompt)}
              sx={{ textTransform: 'none', fontSize: '0.7rem' }}
            >
              {prompt}
            </Button>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}