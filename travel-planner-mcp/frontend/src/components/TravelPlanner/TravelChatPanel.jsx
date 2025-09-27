import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  IconButton, 
  Typography, 
  Avatar, 
  List, 
  ListItem, 
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import { blue, grey, green, red } from '@mui/material/colors';
import { format } from 'date-fns';

const TravelChatPanel = ({ 
  conversations, 
  onSendMessage, 
  isLoading, 
  onRequestRecommendations, 
  onGenerateItinerary 
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever conversations update
  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const getMessageAvatar = (type) => {
    switch (type) {
      case 'user':
        return <Avatar sx={{ bgcolor: blue[500] }}><PersonIcon /></Avatar>;
      case 'assistant':
        return <Avatar sx={{ bgcolor: green[500] }}><SmartToyIcon /></Avatar>;
      case 'system':
      case 'recommendation':
      case 'itinerary':
        return <Avatar sx={{ bgcolor: grey[700] }}><InfoIcon /></Avatar>;
      case 'error':
        return <Avatar sx={{ bgcolor: red[500] }}><ErrorIcon /></Avatar>;
      default:
        return <Avatar sx={{ bgcolor: grey[500] }}><InfoIcon /></Avatar>;
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === 'recommendation' && message.recommendations) {
      return (
        <>
          <Typography variant="body1">{message.text}</Typography>
          <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 1, mt: 1, borderRadius: 1 }}>
            {message.recommendations.map((rec, idx) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">{rec.name}</Typography>
                <Typography variant="body2">{rec.description}</Typography>
              </Box>
            ))}
          </Paper>
        </>
      );
    } else if (message.type === 'itinerary' && message.itinerary) {
      return (
        <>
          <Typography variant="body1">{message.text}</Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }}
            onClick={() => window.open(`/api/travel/itinerary/${message.itinerary.id}/pdf`, '_blank')}
          >
            Download PDF
          </Button>
        </>
      );
    } else if (message.planUpdate) {
      // Display a summary of the plan update
      const planSummary = [];
      if (message.planUpdate.flights) planSummary.push('Flight information updated');
      if (message.planUpdate.hotels) planSummary.push('Hotel information updated');
      if (message.planUpdate.activities) planSummary.push('Activities information updated');
      if (message.planUpdate.itinerary) planSummary.push('Itinerary updated');

      return (
        <>
          <Typography variant="body1">{message.text}</Typography>
          {planSummary.length > 0 && (
            <Paper elevation={0} sx={{ bgcolor: 'background.default', p: 1, mt: 1, borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {planSummary.join(' • ')}
              </Typography>
            </Paper>
          )}
        </>
      );
    } else {
      return <Typography variant="body1">{message.text}</Typography>;
    }
  };

  return (
    <Paper elevation={3} sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      {/* Messages area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {conversations.map((msg, index) => (
            <React.Fragment key={msg.id}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start" sx={{ 
                flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                mb: 2
              }}>
                <Box sx={{ mr: msg.type === 'user' ? 0 : 2, ml: msg.type === 'user' ? 2 : 0 }}>
                  {getMessageAvatar(msg.type)}
                </Box>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    maxWidth: '70%',
                    bgcolor: msg.type === 'user' ? blue[50] : 
                            msg.type === 'error' ? red[50] :
                            msg.type === 'system' ? grey[100] : 
                            'background.paper'
                  }}
                >
                  {renderMessageContent(msg)}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {format(new Date(msg.timestamp), 'HH:mm:ss')}
                  </Typography>
                </Paper>
              </ListItem>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Box>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button 
          size="small" 
          variant="outlined" 
          onClick={onRequestRecommendations}
          disabled={isLoading}
        >
          Get Recommendations
        </Button>
        <Button 
          size="small" 
          variant="outlined"
          onClick={onGenerateItinerary}
          disabled={isLoading}
        >
          Create Itinerary
        </Button>
      </Box>
      
      {/* Input area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Ask about flights, hotels, activities or itineraries..."
              variant="outlined"
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: isLoading && <CircularProgress size={24} />,
              }}
            />
            <IconButton 
              color="primary" 
              type="submit" 
              sx={{ ml: 1 }} 
              disabled={isLoading || !message.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </form>
      </Box>
    </Paper>
  );
};

export default TravelChatPanel;