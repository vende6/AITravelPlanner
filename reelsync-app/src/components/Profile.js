/**
 * Initialize profile functionality
 */
function initProfile() {
    // Set up tab switching
    setupProfileTabs();
    
    // Load user reels by default
    loadProfileReels();
}

/**
 * Set up profile tabs functionality
 */
function setupProfileTabs() {
    const tabButtons = document.querySelectorAll('.profile-tabs .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get tab to show
            const tabToShow = this.getAttribute('data-tab');
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('#reels-content, #playlists-content, #saved-content');
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show selected tab content
            const selectedContent = document.getElementById(`${tabToShow}-content`);
            if (selectedContent) {
                selectedContent.classList.remove('hidden');
                
                // Load content based on the selected tab
                if (tabToShow === 'reels') {
                    loadProfileReels();
                } else if (tabToShow === 'playlists') {
                    loadProfilePlaylists();
                }
            }
        });
    });
    
    // Set up button actions
    setupProfileButtons();
}

/**
 * Set up profile action buttons
 */
function setupProfileButtons() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // In a real app, this would call api.logout()
            showNotification('Logged out successfully', 'success');
            // Redirect to home page
            setTimeout(() => {
                loadPage('home');
            }, 1000);
        });
    }
    
    // Settings button
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            showNotification('Settings coming soon!', 'info');
        });
    }
    
    // Account button
    const accountBtn = document.querySelector('.account-btn');
    if (accountBtn) {
        accountBtn.addEventListener('click', function() {
            showNotification('Account settings coming soon!', 'info');
        });
    }
    
    // Edit profile button
    const editProfileBtn = document.querySelector('.edit-profile-button');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            showNotification('Profile editing coming soon!', 'info');
        });
    }
}

/**
 * Load user reels in the profile page
 */
function loadProfileReels() {
    const reelsContainer = document.querySelector('.profile-reels');
    
    if (!reelsContainer) return;
    
    // Show loading state (already in HTML)
    
    // Get demo user reels
    const demoUser = {
        id: 1,
        name: 'Emma K.',
        location: 'Berlin, Germany'
    };
    
    // Use the API to get user reels
    api.getUserReels(demoUser.id)
        .then(reels => {
            // Clear loading state
            reelsContainer.innerHTML = '';
            
            if (!reels || reels.length === 0) {
                reelsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-film"></i>
                        </div>
                        <h3>No reels yet</h3>
                        <p>Create your first reel to see it here.</p>
                        <button class="cta-button create-first-reel-profile">Create Your First Reel</button>
                    </div>
                `;
                
                // Add event listener for create reel button
                const createReelBtn = reelsContainer.querySelector('.create-first-reel-profile');
                if (createReelBtn) {
                    createReelBtn.addEventListener('click', function() {
                        showModal('createReelModal');
                    });
                }
                
                return;
            }
            
            // Create grid to display reels
            const reelsGrid = document.createElement('div');
            reelsGrid.className = 'reels-grid';
            reelsContainer.appendChild(reelsGrid);
            
            // Add reels to grid
            reels.forEach(reel => {
                const reelCard = createReelCard(reel);
                reelsGrid.appendChild(reelCard);
            });
        })
        .catch(error => {
            console.error('Error loading profile reels:', error);
            reelsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load reels</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Load user playlists in the profile page
 */
function loadProfilePlaylists() {
    const playlistsContainer = document.querySelector('.profile-playlists');
    
    if (!playlistsContainer) return;
    
    // Show loading state (already in HTML)
    
    // Get demo user
    const demoUser = {
        id: 1,
        name: 'Emma K.',
        location: 'Berlin, Germany'
    };
    
    // Use the API to get user playlists
    api.getUserPlaylists(demoUser.id)
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
                        <button class="cta-button create-playlist-profile">Create Playlist</button>
                    </div>
                `;
                
                // Add event listener for create playlist button
                const createPlaylistBtn = playlistsContainer.querySelector('.create-playlist-profile');
                if (createPlaylistBtn) {
                    createPlaylistBtn.addEventListener('click', function() {
                        showCreatePlaylistModal();
                    });
                }
                
                return;
            }
            
            // Create grid to display playlists
            const playlistsGrid = document.createElement('div');
            playlistsGrid.className = 'playlists-grid';
            playlistsContainer.appendChild(playlistsGrid);
            
            // Add playlists to grid
            playlists.forEach(playlist => {
                // Create playlist card using existing function from MusicPlayer component
                const playlistCard = createPlaylistCardForProfile(playlist);
                playlistsGrid.appendChild(playlistCard);
            });
        })
        .catch(error => {
            console.error('Error loading profile playlists:', error);
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
 * Create a playlist card for the profile page
 */
function createPlaylistCardForProfile(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    
    // Calculate track count from the tracks array
    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
    
    card.innerHTML = `
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
            </div>
        </div>
    `;
    
    // Add click handler to play the playlist
    card.addEventListener('click', function() {
        showNotification(`Playing playlist: ${playlist.title}`, 'success');
    });
    
    return card;
}

/**
 * Create a reel card for the profile page
 */
function createReelCard(reel) {
    const card = document.createElement('div');
    card.className = 'reel-card';
    
    // Format the date
    const date = new Date(reel.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
    });
    
    card.innerHTML = `
        <div class="reel-media">
            <i class="fas fa-image"></i>
            ${reel.mediaType === 'video' ? '<div class="play-button"><i class="fas fa-play"></i></div>' : ''}
        </div>
        <div class="reel-content">
            <div class="reel-header">
                <h3 class="reel-title">${reel.title}</h3>
                <span class="reel-date">${formattedDate}</span>
            </div>
            <div class="reel-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${reel.location}</span>
            </div>
            ${reel.description ? `<p class="reel-description">${reel.description}</p>` : ''}
            ${reel.musicTrack ? `
                <div class="reel-music">
                    <i class="fas fa-music"></i>
                    <span class="music-track" data-track-id="${reel.musicTrack}">Loading track...</span>
                </div>
            ` : ''}
        </div>
    `;
    
    // Add click handler
    card.addEventListener('click', function() {
        showNotification(`Viewing reel: ${reel.title}`, 'info');
    });
    
    return card;
}

// Add this to the app.js loadPage function
// In the switch statement case for 'profile':
// initProfile();