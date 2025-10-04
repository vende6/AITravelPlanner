/**
 * ReelSync - Community Component
 */

/**
 * Initialize the community page
 */
function initCommunity() {
    if (!isLoggedIn()) {
        showModal('loginModal');
        return;
    }
    
    // Set up tab switching
    setupCommunityTabs();
    
    // Load trending reels by default
    loadTrendingReels();
    
    // Pre-load following feed and playlists for faster tab switching
    setTimeout(() => {
        loadFollowingFeed();
        loadCommunityPlaylists();
    }, 1000);
}

/**
 * Set up community tabs
 */
function setupCommunityTabs() {
    const tabButtons = document.querySelectorAll('.community-tabs .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get tab to show
            const tabToShow = this.getAttribute('data-tab');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show selected tab content
            const selectedContent = document.getElementById(`${tabToShow}-content`);
            if (selectedContent) {
                selectedContent.classList.remove('hidden');
                
                // Load content if needed
                if (tabToShow === 'trending' && !selectedContent.querySelector('.reel-card')) {
                    loadTrendingReels();
                } else if (tabToShow === 'following' && !selectedContent.querySelector('.reel-card')) {
                    loadFollowingFeed();
                } else if (tabToShow === 'playlists' && !selectedContent.querySelector('.community-playlist-card')) {
                    loadCommunityPlaylists();
                }
            }
        });
    });
}

/**
 * Load trending reels for the community page
 */
function loadTrendingReels() {
    const trendingFeedContainer = document.querySelector('.trending-reels-container');
    
    if (!trendingFeedContainer) return;
    
    // Loading state is already in the HTML
    
    api.getTrendingReels()
        .then(reels => {
            // Clear loading state
            trendingFeedContainer.innerHTML = '';
            
            if (reels.length === 0) {
                trendingFeedContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-fire"></i>
                        </div>
                        <h3>No trending reels yet</h3>
                        <p>Be the first to create trending content!</p>
                    </div>
                `;
                return;
            }
            
            // Create reel cards
            reels.forEach(reel => {
                const reelCard = createCommunityReelCard(reel);
                trendingFeedContainer.appendChild(reelCard);
            });
            
            // Add event listeners
            setupCommunityReelEventListeners();
        })
        .catch(error => {
            console.error('Error loading trending reels:', error);
            trendingFeedContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load trending reels</h3>
                    <p>Please try again later.</p>
                    <button id="retryLoadTrending" class="cta-button">Retry</button>
                </div>
            `;
            
            // Add event listener for retry button
            const retryBtn = document.getElementById('retryLoadTrending');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadTrendingReels();
                });
            }
        });
}

/**
 * Load following feed for the community page
 */
function loadFollowingFeed() {
    const followingFeedContainer = document.querySelector('.following-feed');
    
    if (!followingFeedContainer) return;
    
    // Loading state is already in the HTML
    
    // Get current user
    const currentUser = api.getCurrentUser();
    
    // Call the correct API function with user ID
    api.getUserFollowingReels(currentUser.id)
        .then(reels => {
            // Clear loading state
            followingFeedContainer.innerHTML = '';
            
            if (reels.length === 0) {
                followingFeedContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-user-friends"></i>
                        </div>
                        <h3>Your feed is empty</h3>
                        <p>Follow other users to see their reels here.</p>
                    </div>
                `;
                return;
            }
            
            // Create reel cards
            reels.forEach(reel => {
                const reelCard = createCommunityReelCard(reel);
                followingFeedContainer.appendChild(reelCard);
            });
            
            // Add event listeners
            setupCommunityReelEventListeners();
        })
        .catch(error => {
            console.error('Error loading following feed:', error);
            followingFeedContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load your feed</h3>
                    <p>Please try again later.</p>
                    <button id="retryLoadFollowing" class="cta-button">Retry</button>
                </div>
            `;
            
            // Add event listener for retry button
            const retryBtn = document.getElementById('retryLoadFollowing');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadFollowingFeed();
                });
            }
        });
}

/**
 * Load community playlists
 */
function loadCommunityPlaylists() {
    const playlistsContainer = document.querySelector('.community-playlists-container');
    
    if (!playlistsContainer) return;
    
    // Show loading state
    // Loading state is already in the HTML
    
    api.getCommunityPlaylists()
        .then(playlists => {
            // Clear loading state
            playlistsContainer.innerHTML = '';
            
            if (playlists.length === 0) {
                playlistsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-music"></i>
                        </div>
                        <h3>No community playlists yet</h3>
                        <p>Be the first to create a shared playlist!</p>
                    </div>
                `;
                return;
            }
            
            // Create playlist cards
            playlists.forEach(playlist => {
                const playlistCard = createCommunityPlaylistCard(playlist);
                playlistsContainer.appendChild(playlistCard);
            });
            
            // Add event listeners
            setupCommunityPlaylistEventListeners();
        })
        .catch(error => {
            console.error('Error loading community playlists:', error);
            playlistsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load community playlists</h3>
                    <p>Please try again later.</p>
                    <button id="retryLoadPlaylists" class="cta-button">Retry</button>
                </div>
            `;
            
            // Add event listener for retry button
            const retryBtn = document.getElementById('retryLoadPlaylists');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadCommunityPlaylists();
                });
            }
        });
}

/**
 * Create a community reel card
 * @param {Object} reel - The reel data
 * @returns {HTMLElement} The reel card element
 */
function createCommunityReelCard(reel) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'reel-card';
    card.dataset.reelId = reel.id;
    
    // Format date
    const createdDate = new Date(reel.createdAt);
    const formattedDate = `${createdDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })}`;
    
    // Determine icon based on media type
    let mediaIcon = 'fa-image';
    if (reel.mediaType === 'video') {
        mediaIcon = 'fa-video';
    } else if (reel.mediaType === 'audio') {
        mediaIcon = 'fa-microphone';
    }
    
    // Get author name (in a real app, this would come from the API)
    const authorName = reel.userId === 1 ? 'Emma K.' : 'Michael T.';
    
    // Construct card HTML
    card.innerHTML = `
        <div class="reel-media">
            <i class="fas ${mediaIcon}"></i>
            ${reel.mediaType === 'video' ? '<div class="play-overlay"><i class="fas fa-play"></i></div>' : ''}
        </div>
        <div class="reel-content">
            <div class="reel-header">
                <div class="reel-author">
                    <div class="author-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="author-info">
                        <h4>${authorName}</h4>
                        <p>${formattedDate}</p>
                    </div>
                </div>
                <button class="follow-button" data-user-id="${reel.userId}">
                    ${reel.userId !== getCurrentUser().id ? 'Follow' : ''}
                </button>
            </div>
            <h3 class="reel-title">${reel.title}</h3>
            <p class="reel-description">${reel.description}</p>
            <div class="reel-location">
                <i class="fas fa-map-marker-alt"></i> ${reel.location}
            </div>
            <div class="reel-footer">
                <div class="reel-actions">
                    <button class="like-button" data-reel-id="${reel.id}">
                        <i class="far fa-heart"></i> ${reel.likes}
                    </button>
                    <button class="comment-button" data-reel-id="${reel.id}">
                        <i class="far fa-comment"></i> ${reel.comments}
                    </button>
                    <button class="share-button" data-reel-id="${reel.id}">
                        <i class="far fa-share-square"></i>
                    </button>
                </div>
                ${reel.musicTrack ? `
                <div class="reel-music">
                    <i class="fas fa-music"></i>
                    <span class="music-track" data-track-id="${reel.musicTrack}">Loading track...</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Load music track info if present
    if (reel.musicTrack) {
        const trackElement = card.querySelector(`.music-track[data-track-id="${reel.musicTrack}"]`);
        
        // Use the correct API function
        api.getMusicTrackById(reel.musicTrack)
            .then(track => {
                trackElement.textContent = `${track.title} - ${track.artist}`;
            })
            .catch(() => {
                trackElement.textContent = 'Unknown track';
            });
    }
    
    return card;
}

/**
 * Create a community playlist card
 * @param {Object} playlist - The playlist data
 * @returns {HTMLElement} The playlist card element
 */
function createCommunityPlaylistCard(playlist) {
    // Create card container
    const card = document.createElement('div');
    card.className = 'community-playlist-card';
    card.dataset.playlistId = playlist.id;
    
    // Construct card HTML
    card.innerHTML = `
        <div class="playlist-header">
            <h3>${playlist.title}</h3>
            <p>Created by ${playlist.creator}</p>
        </div>
        <div class="playlist-stats">
            <div class="playlist-tracks">
                <i class="fas fa-music"></i> ${playlist.tracks.length} tracks
            </div>
            <div class="playlist-followers">
                <i class="fas fa-user"></i> ${playlist.followers} followers
            </div>
        </div>
        <div class="playlist-tracks-preview">
            <h4>Tracks:</h4>
            <ul class="track-list">
                <li class="loading">Loading tracks...</li>
            </ul>
        </div>
        <div class="playlist-actions">
            <button class="play-playlist-button" data-playlist-id="${playlist.id}">
                <i class="fas fa-play"></i> Play
            </button>
            <button class="follow-playlist-button" data-playlist-id="${playlist.id}">
                <i class="fas fa-plus"></i> Follow
            </button>
        </div>
    `;
    
    // Load track info
    const trackListElement = card.querySelector('.track-list');
    
    if (trackListElement) {
        // Clear loading state
        trackListElement.innerHTML = '';
        
        // Load first 3 tracks
        // Use the correct API function with track IDs
        const trackPromises = playlist.tracks.slice(0, 3).map(trackId => 
            api.getMusicTrackById(trackId));
        
        Promise.all(trackPromises)
            .then(tracks => {
                tracks.forEach(track => {
                    const trackItem = document.createElement('li');
                    trackItem.className = 'track-item';
                    trackItem.innerHTML = `
                        <div class="track-info">
                            <span class="track-title">${track.title}</span>
                            <span class="track-artist">${track.artist}</span>
                        </div>
                    `;
                    trackListElement.appendChild(trackItem);
                });
                
                // Add "more" indicator if there are more tracks
                if (playlist.tracks.length > 3) {
                    const moreItem = document.createElement('li');
                    moreItem.className = 'more-tracks';
                    moreItem.textContent = `+ ${playlist.tracks.length - 3} more`;
                    trackListElement.appendChild(moreItem);
                }
            })
            .catch(error => {
                console.error('Error loading track info:', error);
                trackListElement.innerHTML = '<li class="error">Failed to load tracks</li>';
            });
    }
    
    return card;
}

/**
 * Set up event listeners for community reel cards
 */
function setupCommunityReelEventListeners() {
    // Like button event listeners
    const likeButtons = document.querySelectorAll('.reel-actions .like-button');
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelId = parseInt(this.dataset.reelId);
            
            // Check if user is logged in
            if (!isLoggedIn()) {
                showModal('loginModal');
                return;
            }
            
            // Update UI immediately for better UX
            const likeCount = parseInt(this.textContent.trim());
            this.innerHTML = `<i class="fas fa-heart"></i> ${likeCount + 1}`;
            this.classList.add('liked');
            
            // Call API to toggle like
            api.toggleLike(reelId)
                .catch(error => {
                    console.error('Error liking reel:', error);
                    // Revert UI change on error
                    this.innerHTML = `<i class="far fa-heart"></i> ${likeCount}`;
                    this.classList.remove('liked');
                    showNotification('Failed to like reel. Please try again.', 'error');
                });
        });
    });
    
    // Comment button event listeners
    const commentButtons = document.querySelectorAll('.reel-actions .comment-button');
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelId = parseInt(this.dataset.reelId);
            showCommentsModal(reelId); // Reuse function from Journal.js
        });
    });
    
    // Share button event listeners
    const shareButtons = document.querySelectorAll('.reel-actions .share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Sharing feature coming soon!', 'info');
        });
    });
    
    // Follow button event listeners
    const followButtons = document.querySelectorAll('.follow-button');
    followButtons.forEach(button => {
        // Skip buttons for current user (which should be empty)
        if (!button.textContent.trim()) return;
        
        button.addEventListener('click', function() {
            // Toggle follow state
            if (this.classList.contains('following')) {
                this.textContent = 'Follow';
                this.classList.remove('following');
                showNotification('Unfollowed user.', 'info');
            } else {
                this.textContent = 'Following';
                this.classList.add('following');
                showNotification('Following user!', 'success');
            }
        });
    });
    
    // Reel media click event listeners
    const reelMedia = document.querySelectorAll('.reel-media');
    reelMedia.forEach(media => {
        media.addEventListener('click', function() {
            const reelCard = this.closest('.reel-card');
            if (reelCard) {
                const reelId = parseInt(reelCard.dataset.reelId);
                showNotification('Viewing full reel coming soon!', 'info');
            }
        });
    });
}

/**
 * Set up event listeners for community playlist cards
 */
function setupCommunityPlaylistEventListeners() {
    // Play playlist button event listeners
    const playButtons = document.querySelectorAll('.play-playlist-button');
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            showNotification('Playing community playlists coming soon!', 'info');
        });
    });
    
    // Follow playlist button event listeners
    const followButtons = document.querySelectorAll('.follow-playlist-button');
    followButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle follow state
            if (this.classList.contains('following')) {
                this.innerHTML = '<i class="fas fa-plus"></i> Follow';
                this.classList.remove('following');
                showNotification('Unfollowed playlist.', 'info');
            } else {
                this.innerHTML = '<i class="fas fa-check"></i> Following';
                this.classList.add('following');
                showNotification('Following playlist!', 'success');
            }
        });
    });
}