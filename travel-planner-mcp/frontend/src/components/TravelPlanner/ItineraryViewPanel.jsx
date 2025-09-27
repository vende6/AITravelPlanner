import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Stack
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import EventIcon from '@mui/icons-material/Event';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MuseumIcon from '@mui/icons-material/Museum';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import NightlifeIcon from '@mui/icons-material/Nightlife';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import { format, parseISO } from 'date-fns';

const ItineraryViewPanel = ({ itinerary }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Change tab handler
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Format date from ISO string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = parseISO(dateString);
      return format(date, 'EEE, MMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Get appropriate icon for activity type
  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'flight':
      case 'transportation':
        return <FlightIcon />;
      case 'accommodation':
        return <HotelIcon />;
      case 'meal':
        return <RestaurantIcon />;
      case 'activity':
        return <LocalActivityIcon />;
      case 'cultural':
        return <MuseumIcon />;
      case 'nightlife':
        return <NightlifeIcon />;
      case 'transfer':
        return <LocalTaxiIcon />;
      default:
        return <DirectionsWalkIcon />;
    }
  };

  // Check if itinerary data exists
  if (!itinerary) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h6" color="textSecondary">
          No itinerary available yet
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Start planning your trip by chatting with the AI assistant
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <MapIcon sx={{ mr: 1 }} />
        Travel Itinerary: {itinerary.destination}
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="itinerary tabs"
        >
          <Tab label="Daily Plans" />
          <Tab label="Accommodations" />
          <Tab label="Transportation" />
          <Tab label="Overview" />
        </Tabs>
      </Paper>

      {/* Daily Plans Tab */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {itinerary.duration} days in {itinerary.destination} 
            ({formatDate(itinerary.startDate)} to {formatDate(itinerary.endDate)})
          </Typography>
          
          <Stepper orientation="vertical" sx={{ mt: 2 }}>
            {itinerary.dailyPlans && itinerary.dailyPlans.map((day, index) => (
              <Step key={day.day} active={true}>
                <StepLabel>
                  <Typography variant="subtitle1">
                    Day {day.day}: {formatDate(day.date)}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <List dense>
                        {day.activities && day.activities.map((activity, actIndex) => (
                          <React.Fragment key={actIndex}>
                            {actIndex > 0 && <Divider variant="inset" component="li" />}
                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                {getActivityIcon(activity.type)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle2">
                                      {activity.time} - {activity.description}
                                    </Typography>
                                    {activity.type && (
                                      <Chip 
                                        label={activity.type} 
                                        size="small" 
                                        variant="outlined" 
                                        sx={{ ml: 1 }} 
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    {activity.location && (
                                      <Typography variant="body2" color="text.secondary">
                                        Location: {activity.location}
                                      </Typography>
                                    )}
                                    {activity.duration && (
                                      <Typography variant="body2" color="text.secondary">
                                        Duration: {activity.duration} min
                                      </Typography>
                                    )}
                                  </>
                                }
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Accommodations Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {itinerary.accommodations && itinerary.accommodations.length > 0 ? (
            itinerary.accommodations.map((accommodation, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <HotelIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6" component="div">
                          {accommodation.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {accommodation.location}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Check-in:</strong> {formatDate(accommodation.checkInDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Check-out:</strong> {formatDate(accommodation.checkOutDate)}
                        </Typography>
                      </Grid>
                      {accommodation.address && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Address:</strong> {accommodation.address}
                          </Typography>
                        </Grid>
                      )}
                      {accommodation.confirmationCode && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Confirmation:</strong> {accommodation.confirmationCode}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                No accommodation information available.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Transportation Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {itinerary.transportation && itinerary.transportation.length > 0 ? (
            itinerary.transportation.map((transport, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2 }}>
                        {transport.type === 'Flight' ? <FlightIcon sx={{ color: 'primary.main' }} /> : <LocalTaxiIcon sx={{ color: 'primary.main' }} />}
                      </Box>
                      <Typography variant="h6" component="div">
                        {transport.type} - {transport.operator || 'Unknown'}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={5}>
                        <Box>
                          <Typography variant="subtitle2" color="primary">
                            Departure
                          </Typography>
                          <Typography variant="body2">
                            <strong>Location:</strong> {transport.departureLocation}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong> {transport.departureTime ? format(parseISO(transport.departureTime), 'MMM d, yyyy HH:mm') : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Typography variant="body1" align="center">
                          →
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Box>
                          <Typography variant="subtitle2" color="primary">
                            Arrival
                          </Typography>
                          <Typography variant="body2">
                            <strong>Location:</strong> {transport.arrivalLocation}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong> {transport.arrivalTime ? format(parseISO(transport.arrivalTime), 'MMM d, yyyy HH:mm') : 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      {transport.confirmationCode && (
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">
                            <strong>Confirmation Code:</strong> {transport.confirmationCode}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                No transportation information available.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* Overview Tab */}
      {activeTab === 3 && (
        <Box>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Itinerary Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary">Destination</Typography>
                    <Typography variant="body2">{itinerary.destination || 'Not specified'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary">Duration</Typography>
                    <Typography variant="body2">{itinerary.duration} days</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary">Start Date</Typography>
                    <Typography variant="body2">{formatDate(itinerary.startDate)}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="primary">End Date</Typography>
                    <Typography variant="body2">{formatDate(itinerary.endDate)}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HotelIcon sx={{ mr: 1, fontSize: 'small' }} /> 
                    Accommodations Summary
                  </Typography>
                  {itinerary.accommodations && itinerary.accommodations.length > 0 ? (
                    <List dense>
                      {itinerary.accommodations.map((accommodation, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={accommodation.name}
                            secondary={`${formatDate(accommodation.checkInDate)} to ${formatDate(accommodation.checkOutDate)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No accommodations information available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FlightIcon sx={{ mr: 1, fontSize: 'small' }} /> 
                    Transportation Summary
                  </Typography>
                  {itinerary.transportation && itinerary.transportation.length > 0 ? (
                    <List dense>
                      {itinerary.transportation.map((transport, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${transport.departureLocation} → ${transport.arrivalLocation}`}
                            secondary={`${transport.type} on ${transport.departureTime ? format(parseISO(transport.departureTime), 'MMM d, yyyy') : 'N/A'}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No transportation information available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => window.print()}
              startIcon={<EventIcon />}
            >
              Export Itinerary
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ItineraryViewPanel;