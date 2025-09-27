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
import ExploreIcon from '@mui/icons-material/Explore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CategoryIcon from '@mui/icons-material/Category';
import CheckIcon from '@mui/icons-material/Check';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

const LocalExperiencesPanel = ({ activities }) => {
  // Format activities array consistently
  const formattedActivities = Array.isArray(activities) ? activities : [activities];
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} h`;
    } else {
      return `${hours} h ${mins} min`;
    }
  };

  // Handle opening activity details dialog
  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  // Handle closing activity details dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ExploreIcon sx={{ mr: 1 }} />
        Local Experiences
      </Typography>

      {formattedActivities.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No experiences available. Try adjusting your search.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {formattedActivities.map((activity, index) => (
            <Grid item xs={12} md={6} key={activity.id || index}>
              <Card variant="outlined">
                <Grid container>
                  {/* Activity Image */}
                  <Grid item xs={12} sm={4}>
                    <CardMedia
                      component="img"
                      sx={{ height: '100%', minHeight: 140 }}
                      image={activity.images && activity.images.length > 0 
                        ? activity.images[0] 
                        : 'https://via.placeholder.com/300x200?text=Activity+Image'}
                      alt={activity.name}
                    />
                  </Grid>
                  
                  {/* Activity Details */}
                  <Grid item xs={12} sm={8}>
                    <CardContent>
                      {/* Activity Name and Rating */}
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {activity.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating 
                            value={activity.rating || 0} 
                            precision={0.5} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {activity.rating} {activity.reviewCount ? `(${activity.reviewCount} reviews)` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Category */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CategoryIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {activity.category || 'Uncategorized'}
                        </Typography>
                      </Box>
                      
                      {/* Location */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ mt: 0.5, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {activity.address || activity.location || 'Location not available'}
                        </Typography>
                      </Box>
                      
                      {/* Duration */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatDuration(activity.duration)}
                        </Typography>
                      </Box>
                      
                      {/* Tags/Features */}
                      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {activity.familyFriendly && (
                          <Chip 
                            icon={<FamilyRestroomIcon />}
                            label="Family Friendly" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        )}
                        {activity.bookingRequired && (
                          <Chip 
                            label="Booking Required" 
                            size="small"
                            color="warning" 
                            variant="outlined" 
                          />
                        )}
                        {activity.tags && activity.tags.slice(0, 2).map((tag, i) => (
                          <Chip 
                            key={i} 
                            label={tag} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                      </Stack>
                      
                      {/* Price and Actions */}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="h6" color="primary">
                            {activity.price?.toFixed(2) || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            {activity.currency || 'USD'}
                          </Typography>
                        </Box>
                        <Box>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            sx={{ mr: 1 }}
                            onClick={() => handleViewDetails(activity)}
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

      {/* Activity Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedActivity && (
          <>
            <DialogTitle>
              <Typography variant="h6">{selectedActivity.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating 
                  value={selectedActivity.rating || 0} 
                  precision={0.5} 
                  size="small" 
                  readOnly 
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {selectedActivity.rating} {selectedActivity.reviewCount ? `(${selectedActivity.reviewCount} reviews)` : ''}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {/* Activity Images */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, pb: 1 }}>
                    {selectedActivity.images && selectedActivity.images.map((image, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={image}
                        alt={`${selectedActivity.name} - Image ${idx + 1}`}
                        sx={{ 
                          height: 200, 
                          minWidth: 300,
                          objectFit: 'cover',
                          borderRadius: 1
                        }}
                      />
                    ))}
                    {(!selectedActivity.images || selectedActivity.images.length === 0) && (
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
                
                {/* Activity Description */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1">Description</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedActivity.description || 'No description available.'}
                  </Typography>
                </Grid>
                
                {/* Location and Basic Info */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Location</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mt: 0.5, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {selectedActivity.address || selectedActivity.location || 'Address not available'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Details</Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {selectedActivity.category || 'Uncategorized'}<br />
                    <strong>Duration:</strong> {formatDuration(selectedActivity.duration)}<br />
                    <strong>Family Friendly:</strong> {selectedActivity.familyFriendly ? 'Yes' : 'No'}<br />
                    {selectedActivity.openingHours && (
                      <><strong>Hours:</strong> {selectedActivity.openingHours}<br /></>
                    )}
                    <strong>Booking Required:</strong> {selectedActivity.bookingRequired ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                
                {/* Highlights */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">Highlights</Typography>
                  {selectedActivity.highlights && selectedActivity.highlights.length > 0 ? (
                    <List dense>
                      {selectedActivity.highlights.map((highlight, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={highlight} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">No highlights available.</Typography>
                  )}
                </Grid>
                
                {/* What's Included */}
                {selectedActivity.includes && selectedActivity.includes.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">What's Included</Typography>
                    <List dense>
                      {selectedActivity.includes.map((item, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
                
                {/* Meeting Point */}
                {selectedActivity.meetingPoint && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Meeting Point</Typography>
                    <Typography variant="body2">
                      {selectedActivity.meetingPoint}
                    </Typography>
                  </Grid>
                )}
                
                {/* Reviews */}
                {selectedActivity.reviews && selectedActivity.reviews.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Reviews</Typography>
                    <Box sx={{ ml: 1 }}>
                      {selectedActivity.reviews.map((review, idx) => (
                        <Box key={idx} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ mr: 1 }}>
                              {review.user || `User ${idx + 1}`}
                            </Typography>
                            <Rating value={review.rating || 0} size="small" readOnly />
                          </Box>
                          <Typography variant="body2">
                            {review.comment || 'No comment provided.'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {/* Price Summary */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${selectedActivity.price?.toFixed(2) || 'N/A'} {selectedActivity.currency || 'USD'} per person
                      </Typography>
                      {selectedActivity.cancellationPolicy && (
                        <Typography variant="body2" color="text.secondary">
                          {selectedActivity.cancellationPolicy}
                        </Typography>
                      )}
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

export default LocalExperiencesPanel;