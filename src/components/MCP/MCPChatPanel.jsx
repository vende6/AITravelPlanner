import React, { useState } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';

export default function MCPChatPanel() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Send query to MCP backend
      const result = await fetch('/api/mcp/query', {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!result.ok) {
        throw new Error(`Error: ${result.status}`);
      }
      
      const data = await result.json();
      setResponse(data.reply);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('MCP query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ marginTop: 4, padding: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h6">Ask the AI Recruiter</Typography>
      <TextField
        fullWidth
        label="Type your question..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g., Show me empathetic candidates from Berlin"
        sx={{ marginY: 2 }}
        disabled={isLoading}
      />
      <Button 
        variant="contained" 
        onClick={handleQuery} 
        disabled={isLoading || !query.trim()}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Submit'}
      </Button>
      
      {error && (
        <Box sx={{ marginTop: 2, color: 'error.main' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
      
      {response && !error && (
        <Box sx={{ marginTop: 2, padding: 2, bgcolor: 'white', borderRadius: 1 }}>
          <Typography variant="body1"><strong>Response:</strong> {response}</Typography>
        </Box>
      )}
    </Box>
  );
}