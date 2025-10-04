/**
 * ReelSync - Music Player Component
 */

// Track state for the music player
const musicPlayerState = {
    currentTrack: null,
    isPlaying: false,
    playlist: [],
    currentPlaylistIndex: -1
};

/**
 * Initialize the music player page
 */
function initMusicPlayer() {
    // Check authentication using the API method
    if (!api.isLoggedIn()) {
        showModal('loginModal');
        return;
    }
    
    // Set up tab navigation
    setupMusicTabs();
    
    // Load music recommendations
    loadMusicRecommendations();
    
    // Set up player control event listeners
    setupPlayerControls();
    
    // Set up mood cards click events
    setupMoodCards();
    
    // Set up location cards click events
    setupLocationCards();
    
    // Set up create playlist button
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', function() {
            showCreatePlaylistModal();
        });
    }
    
    // Create the playlist creation modal if it doesn't exist
    if (!document.getElementById('createPlaylistModal')) {
        createPlaylistModal();
    }
    
    // Load a default track for demonstration
    const demoTrack = {
        id: 'demo-track-1',
        title: 'Berlin Nights',
        artist: 'Electronic Vibes',
        duration: 217,
        coverUrl: 'https://picsum.photos/200/200?random=42',
        mood: 'Energetic'
    };
    
    // Set as current track but don't auto-play
    musicPlayerState.currentTrack = demoTrack;
    updatePlayerUI();
    
    // Enable player controls
    document.getElementById('playPause').disabled = false;
    document.getElementById('prevTrack').disabled = false;
    document.getElementById('nextTrack').disabled = false;
}

/**
 * Set up tab navigation
 */
function setupMusicTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.add('hidden'));
            
            // Add active class to current button and tab
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            document.getElementById(`${tabId}-tab`).classList.add('active-tab');
            
            // Load content based on the selected tab
            if (tabId === 'recommendations') {
                loadMusicRecommendations();
            } else if (tabId === 'playlists') {
                loadUserPlaylists();
            } else if (tabId === 'moods') {
                setupMoodCards();
            } else if (tabId === 'places') {
                setupLocationCards();
            }
        });
    });
}

/**
 * Load music recommendations
 */
function loadMusicRecommendations() {
    // Make sure we're finding the correct container by using a more specific selector
    // that targets the container inside the active recommendations tab
    const tracksContainer = document.querySelector('#recommendations-tab .music-tracks-container');
    
    if (!tracksContainer) {
        console.error('Could not find music tracks container');
        return;
    }
    
    // Show loading state
    tracksContainer.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading music recommendations...</p>
        </div>
    `;
    
    // Check authentication properly using the API's isLoggedIn function
    if (!api.isLoggedIn()) {
        tracksContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Authentication required</h3>
                <p>Please log in to view recommendations.</p>
                <button class="cta-button login-prompt-btn">Log In Now</button>
            </div>
        `;
        
        // Add event listener for login button
        const loginPromptBtn = tracksContainer.querySelector('.login-prompt-btn');
        if (loginPromptBtn) {
            loginPromptBtn.addEventListener('click', function() {
                showModal('loginModal');
            });
        }
        return;
    }
    
    // Get current user using the API's getCurrentUser function
    const currentUser = api.getCurrentUser();
    
    if (!currentUser) {
        tracksContainer.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Authentication required</h3>
                <p>Please log in to view recommendations.</p>
                <button class="cta-button login-prompt-btn">Log In Now</button>
            </div>
        `;
        
        // Add event listener for login button
        const loginPromptBtn = tracksContainer.querySelector('.login-prompt-btn');
        if (loginPromptBtn) {
            loginPromptBtn.addEventListener('click', function() {
                showModal('loginModal');
            });
        }
        return;
    }
    
    // Get recommendations from API using the correct function
    api.getUserMusicRecommendations(currentUser.id)
        .then(tracks => {
            // Clear loading state
            tracksContainer.innerHTML = '';
            
            if (tracks.length === 0) {
                tracksContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-music"></i>
                        </div>
                        <h3>No recommendations yet</h3>
                        <p>Start exploring music to get personalized recommendations.</p>
                    </div>
                `;
                return;
            }
            
            // Create track cards
            tracks.forEach(track => {
                const trackCard = createTrackCard(track);
                tracksContainer.appendChild(trackCard);
            });
        })
        .catch(error => {
            console.error('Error loading music recommendations:', error);
            tracksContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load recommendations</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Load user playlists
 */
function loadUserPlaylists() {
    const playlistsContainer = document.querySelector('#playlists-tab .playlists-container');
    
    if (!playlistsContainer) {
        console.error('Could not find playlists container');
        return;
    }
    
    // Show loading state
    playlistsContainer.innerHTML = `
        <div class="loading-state">
            <div class="loader"></div>
            <p>Loading your playlists...</p>
        </div>
    `;
    
    // Always consider user as logged in for demo purposes
    const currentUser = {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com'
    };
    
    // Get user playlists from API
    api.getUserPlaylists(currentUser.id)
        .then(playlists => {
            // Clear loading state
            playlistsContainer.innerHTML = '';
            
            if (!playlists || playlists.length === 0) {
                playlistsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-list"></i>
                        </div>
                        <h3>No playlists yet</h3>
                        <p>Create your first playlist to see it here.</p>
                        <button id="createFirstPlaylist" class="cta-button">Create Playlist</button>
                    </div>
                `;
                
                // Add event listener to create playlist button
                const createFirstPlaylistBtn = document.getElementById('createFirstPlaylist');
                if (createFirstPlaylistBtn) {
                    createFirstPlaylistBtn.addEventListener('click', function() {
                        showCreatePlaylistModal();
                    });
                }
                
                return;
            }
            
            // Create playlist cards
            playlists.forEach(playlist => {
                const playlistCard = createPlaylistCard(playlist);
                playlistsContainer.appendChild(playlistCard);
            });
        })
        .catch(error => {
            console.error('Error loading user playlists:', error);
            playlistsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load playlists</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Set up player controls
 */
function setupPlayerControls() {
    const playPauseBtn = document.getElementById('playPause');
    const prevTrackBtn = document.getElementById('prevTrack');
    const nextTrackBtn = document.getElementById('nextTrack');
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    if (prevTrackBtn) {
        prevTrackBtn.addEventListener('click', playPreviousTrack);
    }
    
    if (nextTrackBtn) {
        nextTrackBtn.addEventListener('click', playNextTrack);
    }
}

/**
 * Set up playlist card click events
 */
function setupPlaylistCards() {
    const playlistCards = document.querySelectorAll('.playlist-card');
    
    playlistCards.forEach(card => {
        card.addEventListener('click', function() {
            const playlistId = this.dataset.playlist;
            loadPlaylist(playlistId);
        });
    });
}

/**
 * Set up mood cards click events
 */
function setupMoodCards() {
    const moodCards = document.querySelectorAll('.mood-card');
    
    moodCards.forEach(card => {
        card.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            
            // Get tracks for this mood using the correct function
            api.getMusicByMood(mood)
                .then(tracks => {
                    if (tracks.length === 0) {
                        showNotification(`No tracks found for ${mood} mood.`, 'info');
                        return;
                    }
                    
                    // Update player state
                    musicPlayerState.playlist = tracks;
                    musicPlayerState.currentPlaylistIndex = 0;
                    
                    // Play the first track
                    playTrack(tracks[0]);
                    
                    // Show notification
                    showNotification(`Playing ${mood} tracks`, 'success');
                })
                .catch(error => {
                    console.error(`Error loading ${mood} tracks:`, error);
                    showNotification(`Failed to load ${mood} tracks.`, 'error');
                });
        });
    });
}

/**
 * Set up location cards click events
 */
function setupLocationCards() {
    const locationCards = document.querySelectorAll('.location-card');
    
    locationCards.forEach(card => {
        card.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            
            // Get tracks for this location using the correct function
            api.getMusicByLocation(location)
                .then(tracks => {
                    if (tracks.length === 0) {
                        showNotification(`No tracks found for ${location}.`, 'info');
                        return;
                    }
                    
                    // Update player state
                    musicPlayerState.playlist = tracks;
                    musicPlayerState.currentPlaylistIndex = 0;
                    
                    // Play the first track
                    playTrack(tracks[0]);
                    
                    // Show notification
                    showNotification(`Playing ${location} tracks`, 'success');
                })
                .catch(error => {
                    console.error(`Error loading ${location} tracks:`, error);
                    showNotification(`Failed to load ${location} tracks.`, 'error');
                });
        });
    });
}

/**
 * Create a track card element
 * @param {Object} track - The track data
 * @returns {HTMLElement} - The created track card element
 */
function createTrackCard(track) {
    const trackCard = document.createElement('div');
    trackCard.className = 'track-card';
    trackCard.setAttribute('data-track-id', track.id);
    
    trackCard.innerHTML = `
        <div class="track-image">
            <i class="fas fa-music"></i>
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <div class="track-info">
            <h3 class="track-title">${track.title}</h3>
            <p class="track-artist">${track.artist}</p>
            <div class="track-meta">
                <span class="track-duration"><i class="far fa-clock"></i> ${formatDuration(track.duration)}</span>
                <span class="track-mood"><i class="fas fa-hashtag"></i> ${track.mood || 'Various'}</span>
            </div>
        </div>
    `;
    
    // Add click event to play the track
    trackCard.addEventListener('click', function() {
        playTrack(track);
    });
    
    return trackCard;
}

/**
 * Create a playlist card element
 * @param {Object} playlist - The playlist data
 * @returns {HTMLElement} - The created playlist card element
 */
function createPlaylistCard(playlist) {
    const playlistCard = document.createElement('div');
    playlistCard.className = 'playlist-card';
    playlistCard.setAttribute('data-playlist-id', playlist.id);
    
    // Calculate track count from the tracks array
    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
    
    // Use tracks array length or default value for duration (estimating 3 mins per track)
    const estimatedDuration = trackCount * 180; // 3 minutes per track in seconds
    
    playlistCard.innerHTML = `
        <div class="playlist-image">
            <i class="fas fa-list"></i>
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        </div>
        <div class="playlist-info">
            <h3 class="playlist-title">${playlist.title}</h3>
            <p class="playlist-description">${playlist.description || 'No description'}</p>
            <div class="playlist-meta">
                <span class="track-count"><i class="fas fa-music"></i> ${trackCount} tracks</span>
                <span class="playlist-duration"><i class="far fa-clock"></i> ${formatDuration(estimatedDuration)}</span>
            </div>
        </div>
    `;
    
    // Add click event to load the playlist
    playlistCard.addEventListener('click', function() {
        loadPlaylist(playlist.id);
    });
    
    return playlistCard;
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Load a playlist by ID
 * @param {string} playlistId - The ID of the playlist to load
 */
function loadPlaylist(playlistId) {
    // Determine the category and subcategory based on the playlist ID
    let category, subCategory;
    
    switch(playlistId) {
        case 'berlin':
        case 'potsdam':
            category = 'location';
            subCategory = playlistId;
            break;
        case 'focused':
        case 'reflective':
            category = 'mood';
            subCategory = playlistId;
            break;
        case 'experimental':
        case 'classical':
            category = 'trait';
            subCategory = playlistId === 'experimental' ? 'experimental' : 'classical';
            break;
        case 'urban':
        case 'nature':
            category = 'soundscape';
            subCategory = playlistId;
            break;
        default:
            // Default to all tracks
            category = null;
            subCategory = null;
    }
    
    // Get tracks from API using the correct functions based on category
    if (category === 'mood' && subCategory) {
        api.getMusicByMood(subCategory)
            .then(handlePlaylistTracks)
            .catch(handlePlaylistError);
    } else if (category === 'location' && subCategory) {
        api.getMusicByLocation(subCategory)
            .then(handlePlaylistTracks)
            .catch(handlePlaylistError);
    } else {
        // If no category/subCategory or unsupported category, fallback to recommendations
        const currentUser = api.getCurrentUser();
        api.getUserMusicRecommendations(currentUser.id)
            .then(handlePlaylistTracks)
            .catch(handlePlaylistError);
    }
    
    // Helper function to handle successful playlist track loading
    function handlePlaylistTracks(tracks) {
        if (tracks.length === 0) {
            showNotification('No tracks found in this playlist.', 'info');
            return;
        }
        
        // Update player state
        musicPlayerState.playlist = tracks;
        musicPlayerState.currentPlaylistIndex = 0;
        
        // Play the first track
        playTrack(tracks[0]);
        
        // Show notification
        const playlistName = subCategory ? 
            (subCategory.charAt(0).toUpperCase() + subCategory.slice(1)) : 
            'All Tracks';
        showNotification(`Playing ${tracks.length} tracks from ${playlistName}`, 'success');
    }
    
    // Helper function to handle playlist loading errors
    function handlePlaylistError(error) {
        console.error('Error loading playlist:', error);
        showNotification('Failed to load playlist. Please try again.', 'error');
    }
}

/**
 * Play a track
 * @param {Object} track - The track to play
 */
function playTrack(track) {
    // Update player state
    musicPlayerState.currentTrack = track;
    musicPlayerState.isPlaying = true;
    
    // Update player UI
    updatePlayerUI();
    
    // In a real app, this would play the actual audio file
    console.log(`Playing track: ${track.title} by ${track.artist}`);
}

/**
 * Update the player UI based on current state
 */
function updatePlayerUI() {
    const trackTitle = document.querySelector('.track-title');
    const trackArtist = document.querySelector('.track-artist');
    const playPauseBtn = document.getElementById('playPause');
    const prevTrackBtn = document.getElementById('prevTrack');
    const nextTrackBtn = document.getElementById('nextTrack');
    
    if (!trackTitle || !trackArtist || !playPauseBtn) return;
    
    if (musicPlayerState.currentTrack) {
        // Update track info
        trackTitle.textContent = musicPlayerState.currentTrack.title;
        trackArtist.textContent = musicPlayerState.currentTrack.artist;
        
        // Enable player controls
        playPauseBtn.disabled = false;
        if (prevTrackBtn) prevTrackBtn.disabled = false;
        if (nextTrackBtn) nextTrackBtn.disabled = false;
        
        // Update play/pause button
        if (musicPlayerState.isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playPauseBtn.classList.add('playing');
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playPauseBtn.classList.remove('playing');
        }
    } else {
        // No track selected
        trackTitle.textContent = 'Select a track';
        trackArtist.textContent = '--';
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.classList.remove('playing');
    }
}

/**
 * Toggle play/pause
 */
function togglePlayPause() {
    if (!musicPlayerState.currentTrack) {
        // No track selected, load recommendations
        const currentUser = api.getCurrentUser();
        api.getUserMusicRecommendations(currentUser.id)
            .then(tracks => {
                if (tracks.length === 0) {
                    showNotification('No recommendations available.', 'info');
                    return;
                }
                
                // Update player state
                musicPlayerState.playlist = tracks;
                musicPlayerState.currentPlaylistIndex = 0;
                
                // Play the first track
                playTrack(tracks[0]);
            })
            .catch(error => {
                console.error('Error loading recommendations:', error);
                showNotification('Failed to load music recommendations.', 'error');
            });
        
        return;
    }
    
    // Toggle play state
    musicPlayerState.isPlaying = !musicPlayerState.isPlaying;
    
    // Update UI
    updatePlayerUI();
    
    // In a real app, this would play/pause the actual audio
    console.log(musicPlayerState.isPlaying ? 
        `Playing ${musicPlayerState.currentTrack.title}` : 
        `Paused ${musicPlayerState.currentTrack.title}`);
}

/**
 * Play the previous track in the playlist
 */
function playPreviousTrack() {
    if (!musicPlayerState.playlist || musicPlayerState.playlist.length === 0) {
        showNotification('No playlist loaded.', 'info');
        return;
    }
    
    // Calculate previous index with wrap-around
    const prevIndex = (musicPlayerState.currentPlaylistIndex - 1 + musicPlayerState.playlist.length) % musicPlayerState.playlist.length;
    
    // Update player state
    musicPlayerState.currentPlaylistIndex = prevIndex;
    
    // Play the track
    playTrack(musicPlayerState.playlist[prevIndex]);
}

/**
 * Play the next track in the playlist
 */
function playNextTrack() {
    if (!musicPlayerState.playlist || musicPlayerState.playlist.length === 0) {
        showNotification('No playlist loaded.', 'info');
        return;
    }
    
    // Calculate next index with wrap-around
    const nextIndex = (musicPlayerState.currentPlaylistIndex + 1) % musicPlayerState.playlist.length;
    
    // Update player state
    musicPlayerState.currentPlaylistIndex = nextIndex;
    
    // Play the track
    playTrack(musicPlayerState.playlist[nextIndex]);
}

/**
 * Create the playlist modal in the DOM
 */
function createPlaylistModal() {
    // Create modal element
    const modalEl = document.createElement('div');
    modalEl.id = 'createPlaylistModal';
    modalEl.className = 'modal';
    
    modalEl.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Playlist</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="createPlaylistForm">
                    <div class="form-group">
                        <label for="playlistTitle">Playlist Title*</label>
                        <input type="text" id="playlistTitle" name="playlistTitle" placeholder="My Awesome Playlist" required>
                    </div>
                    <div class="form-group">
                        <label for="playlistDescription">Description</label>
                        <textarea id="playlistDescription" name="playlistDescription" 
                            placeholder="What's this playlist about?" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Add tracks from:</label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" id="includeRecommended" checked> 
                                Include recommended tracks
                            </label>
                            <label>
                                <input type="checkbox" id="includeCurrentlyPlaying"> 
                                Include currently playing track
                            </label>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="secondary-btn cancel-playlist-btn">Cancel</button>
                        <button type="submit" class="cta-button">Create Playlist</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add to the DOM
    document.body.appendChild(modalEl);
    
    // Add event listeners
    const closeBtn = modalEl.querySelector('.close-btn');
    const cancelBtn = modalEl.querySelector('.cancel-playlist-btn');
    const form = modalEl.querySelector('#createPlaylistForm');
    
    closeBtn.addEventListener('click', () => {
        modalEl.style.display = 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
        modalEl.style.display = 'none';
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewPlaylist();
    });
    
    // Close on outside click
    window.addEventListener('click', function(e) {
        if (e.target === modalEl) {
            modalEl.style.display = 'none';
        }
    });
}

/**
 * Show the create playlist modal
 */
function showCreatePlaylistModal() {
    const modal = document.getElementById('createPlaylistModal');
    if (modal) {
        // Reset form
        const form = modal.querySelector('#createPlaylistForm');
        if (form) form.reset();
        
        // Show modal
        modal.style.display = 'block';
    } else {
        // Create modal if it doesn't exist
        createPlaylistModal();
        showCreatePlaylistModal();
    }
}

/**
 * Create a new playlist based on form input
 */
function createNewPlaylist() {
    const title = document.getElementById('playlistTitle').value.trim();
    const description = document.getElementById('playlistDescription').value.trim();
    
    if (!title) {
        showNotification('Please enter a playlist title', 'error');
        return;
    }
    
    const includeRecommended = document.getElementById('includeRecommended').checked;
    const includeCurrentlyPlaying = document.getElementById('includeCurrentlyPlaying').checked;
    
    // Collect tracks
    let tracks = [];
    
    // Add current track if selected
    if (includeCurrentlyPlaying && musicPlayerState.currentTrack) {
        tracks.push(musicPlayerState.currentTrack.id);
    }
    
    // Get recommended tracks if selected
    if (includeRecommended) {
        const currentUser = api.getCurrentUser();
        
        // Show loading notification
        showNotification('Creating your playlist...', 'info');
        
        // Get recommendations and create playlist
        api.getUserMusicRecommendations(currentUser.id)
            .then(recommendations => {
                // Add recommended track IDs to tracks array (up to 5)
                const recommendedIds = recommendations.slice(0, 5).map(track => track.id);
                tracks = [...tracks, ...recommendedIds];
                
                // Create the playlist
                return api.createPlaylist(title, description, tracks);
            })
            .then(newPlaylist => {
                // Close the modal
                const modal = document.getElementById('createPlaylistModal');
                if (modal) modal.style.display = 'none';
                
                // Show success notification
                showNotification(`Playlist "${newPlaylist.title}" created successfully!`, 'success');
                
                // Reload playlists
                loadUserPlaylists();
                
                // Switch to playlists tab
                const playlistsTabButton = document.querySelector('.tab-button[data-tab="playlists"]');
                if (playlistsTabButton) playlistsTabButton.click();
            })
            .catch(error => {
                console.error('Error creating playlist:', error);
                showNotification(`Failed to create playlist: ${error.message}`, 'error');
            });
    } else {
        // Create playlist without recommendations
        api.createPlaylist(title, description, tracks)
            .then(newPlaylist => {
                // Close the modal
                const modal = document.getElementById('createPlaylistModal');
                if (modal) modal.style.display = 'none';
                
                // Show success notification
                showNotification(`Playlist "${newPlaylist.title}" created successfully!`, 'success');
                
                // Reload playlists
                loadUserPlaylists();
                
                // Switch to playlists tab
                const playlistsTabButton = document.querySelector('.tab-button[data-tab="playlists"]');
                if (playlistsTabButton) playlistsTabButton.click();
            })
            .catch(error => {
                console.error('Error creating playlist:', error);
                showNotification(`Failed to create playlist: ${error.message}`, 'error');
            });
    }
}