import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Chip, Divider,
  List, ListItem, ListItemText, ListItemIcon,
  Collapse, IconButton, Tooltip, CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RecruiterMCPClient from '../../utils/recruiterMCPClient';

// Initialize the MCP client
const mcpClient = new RecruiterMCPClient({
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/recruiter',
  apiKey: process.env.REACT_APP_API_KEY
});

export default function SmartFilters({ onFilterChange }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestedFilters, setSuggestedFilters] = useState({
    traits: [],
    locations: [],
    tags: [],
    ecoScores: []
  });
  const [activeFilters, setActiveFilters] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    traits: true,
    locations: false,
    tags: false,
    ecoScores: false
  });
  
  // Fetch suggested filters when component mounts
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        // Initialize session if needed
        if (!mcpClient.sessionId) {
          await mcpClient.initializeSession();
        }
        
        // Get personalized filter suggestions
        const suggestions = await mcpClient.getFilterSuggestions();
        setSuggestedFilters(suggestions);
      } catch (err) {
        setError('Failed to load filter suggestions');
        console.error('Error fetching suggestions:', err);
        
        // Set fallback filter suggestions if API call fails
        setSuggestedFilters({
          traits: [
            { value: 'empathy', label: 'Empathy', count: 12 },
            { value: 'curiosity', label: 'Curiosity', count: 8 },
            { value: 'leadership', label: 'Leadership', count: 5 },
            { value: 'resilience', label: 'Resilience', count: 7 }
          ],
          locations: [
            { value: 'berlin', label: 'Berlin', count: 6 },
            { value: 'munich', label: 'Munich', count: 4 },
            { value: 'hamburg', label: 'Hamburg', count: 3 }
          ],
          tags: [
            { value: 'nature', label: 'Nature', count: 10 },
            { value: 'urban', label: 'Urban', count: 7 },
            { value: 'sustainability', label: 'Sustainability', count: 14 }
          ],
          ecoScores: [
            { value: 'high', label: 'High', count: 8 },
            { value: 'medium', label: 'Medium', count: 12 },
            { value: 'low', label: 'Low', count: 5 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSuggestions();
  }, []);
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleFilterToggle = (filter) => {
    setActiveFilters(prevFilters => {
      const filterExists = prevFilters.some(
        f => f.value === filter.value && f.type === filter.type
      );
      
      let newFilters;
      if (filterExists) {
        newFilters = prevFilters.filter(
          f => !(f.value === filter.value && f.type === filter.type)
        );
      } else {
        newFilters = [...prevFilters, filter];
      }
      
      // Notify parent component about filter change
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      
      return newFilters;
    });
  };
  
  const isFilterActive = (filter) => {
    return activeFilters.some(
      f => f.value === filter.value && f.type === filter.type
    );
  };
  
  // Function to render filter section
  const renderFilterSection = (title, type, items, icon) => {
    const isExpanded = expandedSections[type];
    
    return (
      <>
        <ListItem 
          button 
          onClick={() => toggleSection(type)}
          sx={{ bgcolor: isExpanded ? 'rgba(25, 118, 210, 0.08)' : 'transparent' }}
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={title} />
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>
        
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 2 }}>
            {items.map((item, index) => {
              const filter = { type, value: item.value, label: item.label };
              return (
                <Chip
                  key={index}
                  label={`${item.label}${item.count ? ` (${item.count})` : ''}`}
                  onClick={() => handleFilterToggle(filter)}
                  color={isFilterActive(filter) ? 'primary' : 'default'}
                  variant={isFilterActive(filter) ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              );
            })}
          </Box>
        </Collapse>
      </>
    );
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TuneIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Smart Filters</Typography>
        </Box>
        
        <Tooltip title="These filters adapt to your preferences">
          <IconButton size="small">
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {renderFilterSection('Traits', 'traits', suggestedFilters.traits, <EmojiEventsIcon />)}
          <Divider />
          {renderFilterSection('Locations', 'locations', suggestedFilters.locations, <LocationOnIcon />)}
          <Divider />
          {renderFilterSection('Tags', 'tags', suggestedFilters.tags, <FavoriteIcon />)}
          <Divider />
          {renderFilterSection('Eco Scores', 'ecoScores', suggestedFilters.ecoScores, <PersonIcon />)}
        </List>
      )}
      
      {activeFilters.length > 0 && (
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Filters:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {activeFilters.map((filter, index) => (
              <Chip
                key={index}
                label={filter.label}
                onDelete={() => handleFilterToggle(filter)}
                color="primary"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}