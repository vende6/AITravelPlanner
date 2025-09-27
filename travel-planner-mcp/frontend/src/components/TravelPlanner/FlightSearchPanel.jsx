import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Divider,
  Button,
  Stack
} from '@mui/material';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import { format } from 'date-fns';

const FlightSearchPanel = ({ flights }) => {
  // Format flights array consistently
  const formattedFlights = Array.isArray(flights) ? flights : [flights];

  // Format time from ISO string or time string
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    try {
      // Handle both ISO strings and time strings
      const date = timeString.includes('T') 
        ? new Date(timeString)
        : new Date(`2000-01-01T${timeString}`);
        
      return format(date, 'HH:mm');
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };

  // Calculate flight duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hours}h ${mins}m`;
  };

  // Format date from ISO string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AirplanemodeActiveIcon sx={{ mr: 1 }} />
        Flight Results
      </Typography>

      {formattedFlights.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No flight results available. Try adjusting your search.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {formattedFlights.map((flight, index) => (
            <Grid item xs={12} key={flight.id || index}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Airline and Flight Number */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          {flight.airline || 'Unknown Airline'}
                        </Typography>
                        <Chip 
                          label={flight.nonstop ? 'Nonstop' : 'With Stops'} 
                          color={flight.nonstop ? 'success' : 'default'} 
                          size="small"
                        />
                      </Box>
                      <Divider />
                    </Grid>
                    
                    {/* Departure and Arrival */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography variant="caption" color="text.secondary">Departure</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FlightTakeoffIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            {formatTime(flight.departureTime)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {flight.origin || 'Unknown Origin'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(flight.departureTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Duration */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="caption" color="text.secondary">Duration</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body1">
                            {formatDuration(flight.duration)}
                          </Typography>
                        </Box>
                        {flight.layovers && flight.layovers.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {flight.layovers.length} stop(s): {flight.layovers.map(l => l.airport).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    {/* Arrival */}
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="caption" color="text.secondary">Arrival</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {formatTime(flight.arrivalTime)}
                          </Typography>
                          <FlightLandIcon fontSize="small" sx={{ ml: 1 }} />
                        </Box>
                        <Typography variant="body2" align="right">
                          {flight.destination || 'Unknown Destination'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(flight.arrivalTime)}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Price and Cabin */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={flight.cabinClass || 'Economy'} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          {flight.aircraft && (
                            <Chip 
                              label={flight.aircraft} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Stack>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="h6" color="primary">
                            ${flight.price?.toFixed(2) || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Action buttons */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mr: 1 }}
                        >
                          Flight Details
                        </Button>
                        <Button 
                          variant="contained" 
                          size="small"
                          color="primary"
                        >
                          Select
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FlightSearchPanel;