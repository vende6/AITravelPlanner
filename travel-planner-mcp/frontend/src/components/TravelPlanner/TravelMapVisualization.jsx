import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import HotelIcon from '@mui/icons-material/Hotel';
import ExploreIcon from '@mui/icons-material/Explore';

// Mapbox access token - in a real app, use environment variables
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2t6eG14eTFjMDI1aDJucGg2bGhtZmN3dyJ9.example'; // Replace with your actual Mapbox token

const TravelMapVisualization = ({ travelPlan }) => {
  const [viewState, setViewState] = useState({
    longitude: -100,
    latitude: 40,
    zoom: 3
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Update map when travel plan changes
  useEffect(() => {
    if (!travelPlan) return;
    
    setLoading(true);
    const newMarkers = [];
    const newRoutes = [];
    
    // Process flight data
    if (travelPlan.flights) {
      const flights = Array.isArray(travelPlan.flights) ? travelPlan.flights : [travelPlan.flights];
      
      flights.forEach(flight => {
        if (flight.originCoordinates) {
          newMarkers.push({
            id: `origin-${flight.id || Math.random().toString(36).substring(7)}`,
            longitude: flight.originCoordinates[0],
            latitude: flight.originCoordinates[1],
            type: 'flight',
            name: flight.origin,
            details: `Departure: ${flight.departureTime}`
          });
        }
        
        if (flight.destinationCoordinates) {
          newMarkers.push({
            id: `dest-${flight.id || Math.random().toString(36).substring(7)}`,
            longitude: flight.destinationCoordinates[0],
            latitude: flight.destinationCoordinates[1],
            type: 'flight',
            name: flight.destination,
            details: `Arrival: ${flight.arrivalTime}`
          });
          
          if (flight.originCoordinates) {
            newRoutes.push({
              id: `route-${flight.id || Math.random().toString(36).substring(7)}`,
              origin: flight.originCoordinates,
              destination: flight.destinationCoordinates,
              type: 'flight'
            });
          }
        } else if (flight.destination) {
          // For flights without coordinates, we would normally geocode the destination
          // For demo purposes, we'll use a mock location
          const mockCoords = getMockCoordinates(flight.destination);
          
          newMarkers.push({
            id: `dest-${flight.id || Math.random().toString(36).substring(7)}`,
            longitude: mockCoords[0],
            latitude: mockCoords[1],
            type: 'flight',
            name: flight.destination,
            details: `Destination for your flight with ${flight.airline || 'airline'}`
          });
        }
      });
    }
    
    // Process hotel data
    if (travelPlan.hotels) {
      const hotels = Array.isArray(travelPlan.hotels) ? travelPlan.hotels : [travelPlan.hotels];
      
      hotels.forEach(hotel => {
        if (hotel.coordinates) {
          newMarkers.push({
            id: `hotel-${hotel.id || Math.random().toString(36).substring(7)}`,
            longitude: hotel.coordinates[0],
            latitude: hotel.coordinates[1],
            type: 'hotel',
            name: hotel.name,
            details: `${hotel.location}, Check-in: ${hotel.checkInDate}`
          });
        } else if (hotel.location) {
          // Mock coordinates for hotels without coordinates
          const mockCoords = getMockCoordinates(hotel.location);
          
          newMarkers.push({
            id: `hotel-${hotel.id || Math.random().toString(36).substring(7)}`,
            longitude: mockCoords[0],
            latitude: mockCoords[1],
            type: 'hotel',
            name: hotel.name,
            details: `${hotel.location}, Check-in: ${hotel.checkInDate}`
          });
        }
      });
    }
    
    // Process activities data
    if (travelPlan.activities) {
      const activities = Array.isArray(travelPlan.activities) ? travelPlan.activities : [travelPlan.activities];
      
      activities.forEach(activity => {
        if (activity.coordinates) {
          newMarkers.push({
            id: `activity-${activity.id || Math.random().toString(36).substring(7)}`,
            longitude: activity.coordinates[0],
            latitude: activity.coordinates[1],
            type: 'activity',
            name: activity.name,
            details: `${activity.category || 'Activity'} - ${activity.description || ''}`
          });
        } else if (activity.location) {
          // Mock coordinates for activities without coordinates
          const mockCoords = getMockCoordinates(activity.location);
          
          newMarkers.push({
            id: `activity-${activity.id || Math.random().toString(36).substring(7)}`,
            longitude: mockCoords[0],
            latitude: mockCoords[1],
            type: 'activity',
            name: activity.name,
            details: `${activity.category || 'Activity'} - ${activity.description || ''}`
          });
        }
      });
    }
    
    // Update state with new markers and routes
    setMarkers(newMarkers);
    setRoutes(newRoutes);
    
    // Auto center map if we have markers
    if (newMarkers.length > 0) {
      // Find the average position of all markers to center the map
      const longitudes = newMarkers.map(m => m.longitude);
      const latitudes = newMarkers.map(m => m.latitude);
      
      const avgLong = longitudes.reduce((sum, val) => sum + val, 0) / longitudes.length;
      const avgLat = latitudes.reduce((sum, val) => sum + val, 0) / latitudes.length;
      
      setViewState({
        longitude: avgLong,
        latitude: avgLat,
        zoom: 4
      });
    }
    
    setLoading(false);
  }, [travelPlan]);
  
  // Get marker icon based on type
  const getMarkerIcon = (type) => {
    switch (type) {
      case 'flight':
        return <FlightTakeoffIcon sx={{ color: '#1976d2' }} />;
      case 'hotel':
        return <HotelIcon sx={{ color: '#388e3c' }} />;
      case 'activity':
        return <ExploreIcon sx={{ color: '#d32f2f' }} />;
      default:
        return <LocationOnIcon sx={{ color: '#f57c00' }} />;
    }
  };
  
  // Mock function to generate coordinates for locations without them
  // In a real app, you would use a geocoding service like Mapbox Geocoding API
  const getMockCoordinates = (locationName) => {
    // Simple mock implementation that generates random coordinates around the world
    // This would be replaced with actual geocoding in a production app
    const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomLong = -180 + (hash % 360);
    const randomLat = -90 + (hash % 180);
    
    return [randomLong, randomLat];
  };
  
  // If there's no data to display
  if (!travelPlan || (
    !travelPlan.flights && 
    !travelPlan.hotels && 
    !travelPlan.activities && 
    !travelPlan.itinerary
  )) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h6" color="textSecondary">
          No travel plan information yet
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center">
          Start by asking about flights, hotels, or activities at your destination
        </Typography>
      </Box>
    );
  }
  
  // If we're still loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading map visualization...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Travel Plan Map
        </Typography>
        <Stack direction="row" spacing={1}>
          {travelPlan.flights && (
            <Chip 
              icon={<FlightTakeoffIcon />} 
              label="Flights" 
              color="primary" 
              variant="outlined" 
            />
          )}
          {travelPlan.hotels && (
            <Chip 
              icon={<HotelIcon />} 
              label="Hotels" 
              color="success" 
              variant="outlined" 
            />
          )}
          {travelPlan.activities && (
            <Chip 
              icon={<ExploreIcon />} 
              label="Activities" 
              color="error" 
              variant="outlined" 
            />
          )}
        </Stack>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: 'calc(100% - 60px)', 
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 1
        }}
      >
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {markers.map(marker => (
            <Marker
              key={marker.id}
              longitude={marker.longitude}
              latitude={marker.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedMarker(marker);
              }}
            >
              {getMarkerIcon(marker.type)}
            </Marker>
          ))}
          
          {selectedMarker && (
            <Popup
              longitude={selectedMarker.longitude}
              latitude={selectedMarker.latitude}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setSelectedMarker(null)}
            >
              <Box sx={{ p: 1, minWidth: 150 }}>
                <Typography variant="subtitle2">{selectedMarker.name}</Typography>
                <Typography variant="body2">{selectedMarker.details}</Typography>
              </Box>
            </Popup>
          )}
          
          {/* Flight route lines would be drawn here with Source and Layer components */}
          {/* This requires GeoJSON data and more complex setup */}
        </Map>
        
        {/* Fallback message if no markers */}
        {markers.length === 0 && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              p: 2,
              borderRadius: 1,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1">
              No location data available for visualization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adding more specific destinations to your travel plan
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1 }}>
        Map data for visualization purposes only. Location coordinates are approximated.
      </Typography>
    </Box>
  );
};

export default TravelMapVisualization;