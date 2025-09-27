import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia,
  Grid, 
  Chip, 
  Divider,
  Button,
  Rating,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckIcon from '@mui/icons-material/Check';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';

const HotelDisplayPanel = ({ hotels }) => {
  // Format hotels array consistently
  const formattedHotels = Array.isArray(hotels) ? hotels : [hotels];
  
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Calculate number of nights between check-in and check-out
  const calculateNights = (checkInDate, checkOutDate) => {
    if (!checkInDate || !checkOutDate) return 1;
    
    try {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1;
    } catch (e) {
      console.error('Error calculating nights:', e);
      return 1;
    }
  };

  // Handle opening hotel details dialog
  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setDialogOpen(true);
  };

  // Handle closing hotel details dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <HotelIcon sx={{ mr: 1 }} />
        Hotel Results
      </Typography>

      {formattedHotels.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No hotel results available. Try adjusting your search.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {formattedHotels.map((hotel, index) => (
            <Grid item xs={12} md={6} key={hotel.id || index}>
              <Card variant="outlined">
                <Grid container>
                  {/* Hotel Image */}
                  <Grid item xs={12} sm={4}>
                    <CardMedia
                      component="img"
                      sx={{ height: '100%', minHeight: 140 }}
                      image={hotel.images && hotel.images.length > 0 
                        ? hotel.images[0] 
                        : 'https://via.placeholder.com/300x200?text=Hotel+Image'}
                      alt={hotel.name}
                    />
                  </Grid>
                  
                  {/* Hotel Details */}
                  <Grid item xs={12} sm={8}>
                    <CardContent>
                      {/* Hotel Name and Rating */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {hotel.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={hotel.rating || 0} 
                            precision={0.5} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {hotel.rating} {hotel.reviewCount ? `(${hotel.reviewCount} reviews)` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Location */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ mt: 0.5, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {hotel.address || hotel.location || 'Address not available'}
                        </Typography>
                      </Box>
                      
                      {/* Dates */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EventIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(hotel.checkInDate)} - {formatDate(hotel.checkOutDate)}
                          {' '}
                          ({calculateNights(hotel.checkInDate, hotel.checkOutDate)} nights)
                        </Typography>
                      </Box>
                      
                      {/* Amenities */}
                      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {hotel.amenities && hotel.amenities.slice(0, 3).map((amenity, i) => (
                          <Chip 
                            key={i} 
                            label={amenity} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                        {hotel.amenities && hotel.amenities.length > 3 && (
                          <Chip 
                            label={`+${hotel.amenities.length - 3} more`} 
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Stack>
                      
                      {/* Price and Actions */}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box>
                          <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {hotel.pricePerNight?.toFixed(2) || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per night
                          </Typography>
                        </Box>
                        <Box>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleViewDetails(hotel)}
                          >
                            Details
                          </Button>
                          <Button 
                            variant="contained" 
                            size="small"
                            color="primary"
                          >
                            Book
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Hotel Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedHotel && (
          <>
            <DialogTitle>
              <Typography variant="h6">{selectedHotel.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating 
                  value={selectedHotel.rating || 0} 
                  precision={0.5} 
                  size="small" 
                  readOnly 
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {selectedHotel.rating} {selectedHotel.reviewCount ? `(${selectedHotel.reviewCount} reviews)` : ''}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {/* Hotel Images */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, pb: 1 }}>
                    {selectedHotel.images && selectedHotel.images.map((image, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={image}
                        alt={`${selectedHotel.name} - Image ${idx + 1}`}
                        sx={{ 
                          height: 200, 
                          minWidth: 300,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    ))}
                    {(!selectedHotel.images || selectedHotel.images.length === 0) && (
                      <Box
                        component="img"
                        src="https://via.placeholder.com/300x200?text=No+Images+Available"
                        alt="No Images Available"
                        sx={{ 
                          height: 200, 
                          minWidth: 300,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    )}
                  </Box>
                </Grid>
                
                {/* Hotel Description */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Description</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedHotel.description || 'No description available.'}
                  </Typography>
                </Grid>
                
                {/* Location Details */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Location</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mt: 0.5, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {selectedHotel.address || selectedHotel.location || 'Address not available'}
                    </Typography>
                  </Box>
                </Grid>
                
                {/* Check-in/Check-out */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Stay Information</Typography>
                  <Typography variant="body2">
                    <strong>Check-in:</strong> {formatDate(selectedHotel.checkInDate)}
                    {selectedHotel.policies && selectedHotel.policies.checkInTime && 
                      ` from ${selectedHotel.policies.checkInTime}`
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>Check-out:</strong> {formatDate(selectedHotel.checkOutDate)}
                    {selectedHotel.policies && selectedHotel.policies.checkOutTime && 
                      ` by ${selectedHotel.policies.checkOutTime}`
                    }
                  </Typography>
                </Grid>
                
                {/* Amenities */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Amenities</Typography>
                  {selectedHotel.amenities && selectedHotel.amenities.length > 0 ? (
                    <List dense>
                      {selectedHotel.amenities.map((amenity, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={amenity} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">No amenities information available.</Typography>
                  )}
                </Grid>
                
                {/* Room Types */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Available Rooms</Typography>
                  {selectedHotel.roomTypes && selectedHotel.roomTypes.length > 0 ? (
                    <List dense>
                      {selectedHotel.roomTypes.map((room, idx) => (
                        <ListItem key={idx}>
                          <ListItemText 
                            primary={room.type} 
                            secondary={`$${room.price?.toFixed(2) || 'N/A'} - ${room.description || ''}`} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">No room information available.</Typography>
                  )}
                </Grid>
                
                {/* Policies */}
                {selectedHotel.policies && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Policies</Typography>
                    <Typography variant="body2">
                      {selectedHotel.policies.cancellation && (
                        <><strong>Cancellation:</strong> {selectedHotel.policies.cancellation}<br /></>
                      )}
                      {selectedHotel.policies.checkInTime && selectedHotel.policies.checkOutTime && (
                        <><strong>Hours:</strong> Check-in from {selectedHotel.policies.checkInTime}, check-out by {selectedHotel.policies.checkOutTime}<br /></>
                      )}
                    </Typography>
                  </Grid>
                )}
                
                {/* Price Summary */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${selectedHotel.pricePerNight?.toFixed(2) || 'N/A'} per night
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${(selectedHotel.pricePerNight * calculateNights(selectedHotel.checkInDate, selectedHotel.checkOutDate))?.toFixed(2) || 'N/A'} total for {calculateNights(selectedHotel.checkInDate, selectedHotel.checkOutDate)} night(s)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button variant="contained" color="primary">Book Now</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default HotelDisplayPanel;