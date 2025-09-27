import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Chip, Divider, 
  Grid, Card, CardContent, CardActionArea,
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function PromptTemplates({ onPromptSelect }) {
  const [templates, setTemplates] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize session if needed
      if (!mcpClient.sessionId) {
        await mcpClient.initializeSession();
      }
      
      // In a real implementation, you'd fetch templates from the MCP backend
      // For demo purposes, we'll use mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockTemplates = [
        {
          id: '1',
          text: 'Find candidates with high eco scores and resilience',
          category: 'search',
          isFavorite: true,
          usageCount: 12
        },
        {
          id: '2',
          text: 'Summarize top reels from this week',
          category: 'summary',
          isFavorite: false,
          usageCount: 8
        },
        {
          id: '3',
          text: 'Show candidates who completed the sustainability challenge',
          category: 'filter',
          isFavorite: true,
          usageCount: 15
        },
        {
          id: '4',
          text: 'Compare Alex Explorer and Jamie Trailblazer',
          category: 'compare',
          isFavorite: false,
          usageCount: 3
        },
        {
          id: '5',
          text: 'Find leadership traits in reels from Berlin candidates',
          category: 'search',
          isFavorite: false,
          usageCount: 7
        },
        {
          id: '6',
          text: 'Generate interview questions for candidates with high empathy scores',
          category: 'generate',
          isFavorite: false,
          usageCount: 5
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (err) {
      setError('Failed to load prompt templates');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePromptSelect = (template) => {
    if (onPromptSelect) {
      onPromptSelect(template.text);
    }
  };
  
  const handleMenuOpen = (event, templateId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplateId(templateId);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTemplateId(null);
  };
  
  const handleFavoriteToggle = (templateId) => {
    setTemplates(prevTemplates => 
      prevTemplates.map(template => 
        template.id === templateId 
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    );
    handleMenuClose();
  };
  
  const handleDeleteTemplate = (templateId) => {
    setTemplates(prevTemplates => 
      prevTemplates.filter(template => template.id !== templateId)
    );
    handleMenuClose();
  };
  
  const getCategoryColor = (category) => {
    switch (category) {
      case 'search': return '#e3f2fd'; // light blue
      case 'summary': return '#e8f5e9'; // light green
      case 'filter': return '#fff3e0'; // light orange
      case 'compare': return '#f3e5f5'; // light purple
      case 'generate': return '#e1f5fe'; // light cyan
      default: return '#f5f5f5'; // light grey
    }
  };
  
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'search': return '🔍';
      case 'summary': return '📋';
      case 'filter': return '🔢';
      case 'compare': return '⚖️';
      case 'generate': return '✨';
      default: return '📝';
    }
  };
  
  // Render loading or error states
  if (isLoading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Prompt Templates</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2">Loading templates...</Typography>
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Prompt Templates</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Prompt Templates</Typography>
        <IconButton size="small">
          <AddIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip label="All" color="primary" variant="filled" onClick={() => {}} />
        <Chip label="Favorites" onClick={() => {}} />
        <Chip label="Search" onClick={() => {}} />
        <Chip label="Summary" onClick={() => {}} />
        <Chip label="Filter" onClick={() => {}} />
      </Box>
      
      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card 
              variant="outlined"
              sx={{ 
                position: 'relative',
                backgroundColor: getCategoryColor(template.category),
                borderLeft: template.isFavorite ? '3px solid gold' : 'none'
              }}
            >
              <CardActionArea onClick={() => handlePromptSelect(template)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.04)', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        mr: 1
                      }}
                    >
                      {getCategoryIcon(template.category)} {template.category}
                    </Typography>
                    
                    {template.isFavorite && (
                      <StarIcon fontSize="small" sx={{ color: 'gold' }} />
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {template.text}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Used {template.usageCount} times
                  </Typography>
                </CardContent>
              </CardActionArea>
              
              <IconButton 
                size="small" 
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={(e) => handleMenuOpen(e, template.id)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleFavoriteToggle(selectedTemplateId)}>
          <ListItemIcon>
            {templates.find(t => t.id === selectedTemplateId)?.isFavorite 
              ? <StarBorderIcon fontSize="small" />
              : <StarIcon fontSize="small" />
            }
          </ListItemIcon>
          <ListItemText>
            {templates.find(t => t.id === selectedTemplateId)?.isFavorite 
              ? 'Remove from favorites'
              : 'Add to favorites'
            }
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteTemplate(selectedTemplateId)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}