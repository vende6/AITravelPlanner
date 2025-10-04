/**
 * ReelSync - Journal Component
 */

/**
 * Initialize the journal page
 */
function initJournal() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        showModal('loginModal');
        return;
    }
    
    // Load journal entries
    loadJournalEntries();
    
    // Set up create reel button
    const createReelBtn = document.querySelector('#createReelBtn');
    if (createReelBtn) {
        createReelBtn.addEventListener('click', function() {
            showModal('createReelModal');
        });
    }
    
    // Set up filter buttons
    setupFilterButtons();
    
    // Set up search functionality
    setupSearchFunctionality();
    
    // Set up AI insights toggle
    setupAIInsightsToggle();
}

/**
 * Load journal entries for the current user
 */
function loadJournalEntries() {
    const journalFeed = document.querySelector('.journal-feed');
    
    if (!journalFeed) return;
    
    // Loading state is already in the HTML
    
    // Get current user
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        journalFeed.innerHTML = '<div class="error">Please log in to view your journal.</div>';
        return;
    }
    
    // Load journal entries for current user
    api.getUserReels(currentUser.id)
        .then(reels => {
            // Clear loading state
            journalFeed.innerHTML = '';
            
            if (reels.length === 0) {
                // Show empty state if no reels
                journalFeed.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h2>Your journal is empty</h2>
                        <p>Start documenting your journey by creating your first reel.</p>
                        <button class="cta-button create-first-reel">Create Your First Reel</button>
                    </div>
                `;
                
                // Add event listener to the create first reel button
                const createFirstReelBtn = document.querySelector('.create-first-reel');
                if (createFirstReelBtn) {
                    createFirstReelBtn.addEventListener('click', function() {
                        showModal('createReelModal');
                    });
                }
                
                return;
            }
            
            // Sort reels by timestamp (newest first)
            reels.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Create reels in journal feed
            reels.forEach(reel => {
                const reelElement = createReelElement(reel);
                journalFeed.appendChild(reelElement);
            });
            
            // Set up event listeners for reels
            setupReelEventListeners();
        })
        .catch(error => {
            console.error('Error loading journal entries:', error);
            journalFeed.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load your journal</h3>
                    <p>Please try again later.</p>
                    <button id="retryLoadJournal" class="cta-button">Retry</button>
                </div>
            `;
            
            // Add event listener for retry button
            const retryBtn = document.getElementById('retryLoadJournal');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    loadJournalEntries();
                });
            }
        });
}

/**
 * Create a reel element for the journal feed
 * @param {Object} reel - The reel data
 * @returns {HTMLElement} - The created reel element
 */
function createReelElement(reel) {
    // Create reel container
    const reelElement = document.createElement('article');
    reelElement.className = 'reel';
    reelElement.setAttribute('data-reel-id', reel.id);
    
    // Determine icon based on media type
    let mediaIcon = 'fa-image';
    if (reel.mediaType === 'video') {
        mediaIcon = 'fa-video';
    } else if (reel.mediaType === 'audio') {
        mediaIcon = 'fa-microphone';
    }
    
    // Format date
    const date = new Date(reel.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Construct reel HTML
    reelElement.innerHTML = `
        <div class="reel-header">
            <h3 class="reel-title">${reel.title}</h3>
            <div class="reel-actions">
                <button class="edit-reel-button" title="Edit reel">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-reel-button" title="Delete reel">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="reel-media">
            <i class="fas ${mediaIcon}"></i>
            ${reel.mediaType === 'video' ? '<div class="play-overlay"><i class="fas fa-play"></i></div>' : ''}
        </div>
        <div class="reel-content">
            <div class="reel-metadata">
                <div class="reel-location">
                    <i class="fas fa-map-marker-alt"></i> ${reel.location}
                </div>
                <div class="reel-timestamp">
                    <i class="far fa-clock"></i> ${formattedDate}
                </div>
                ${reel.tags && reel.tags.length > 0 ? `
                <div class="reel-tags">
                    <i class="fas fa-tags"></i> 
                    ${reel.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>` : ''}
                ${reel.weather ? `
                <div class="reel-weather">
                    <i class="fas ${getWeatherIcon(reel.weather.condition)}"></i>
                    <span>${reel.weather.temperature}°${reel.weather.unit}</span>
                </div>` : ''}
            </div>
            <p class="reel-description">${reel.description}</p>
            ${reel.musicTrack ? `
                <div class="reel-music">
                    <i class="fas fa-music"></i>
                    <span class="music-track" data-track-id="${reel.musicTrack}">Loading track...</span>
                </div>
            ` : ''}
            <div class="reel-ai-insights"></div>
            <div class="reel-engagement">
                <button class="engagement-button like-button" title="Like">
                    <i class="far fa-heart"></i> <span class="count">${reel.likes}</span>
                </button>
                <button class="engagement-button comment-button" title="Comments">
                    <i class="far fa-comment"></i> <span class="count">${reel.comments}</span>
                </button>
                <button class="engagement-button share-button" title="Share">
                    <i class="far fa-share-square"></i>
                </button>
            </div>
        </div>
    `;
    
    // Load music track info if present
    if (reel.musicTrack) {
        const trackElement = reelElement.querySelector(`.music-track[data-track-id="${reel.musicTrack}"]`);
        
        api.getMusicTrackById(reel.musicTrack)
            .then(track => {
                trackElement.textContent = `${track.title} - ${track.artist}`;
                
                // Add click event to play the track
                trackElement.addEventListener('click', function() {
                    // In a real app, this would play the track
                    showNotification('Music playback coming soon!', 'info');
                });
            })
            .catch(() => {
                trackElement.textContent = 'Unknown track';
            });
    }
    
    return reelElement;
}

/**
 * Set up event listeners for reels
 */
function setupReelEventListeners() {
    // Edit reel button event listeners
    const editButtons = document.querySelectorAll('.edit-reel-button');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelElement = this.closest('.reel');
            const reelId = parseInt(reelElement.getAttribute('data-reel-id'));
            
            showNotification('Reel editing coming soon!', 'info');
        });
    });
    
    // Delete reel button event listeners
    const deleteButtons = document.querySelectorAll('.delete-reel-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelElement = this.closest('.reel');
            const reelId = parseInt(reelElement.getAttribute('data-reel-id'));
            
            // Show confirmation dialog
            if (confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
                // In a real app, this would delete the reel from the database
                reelElement.classList.add('deleting');
                
                setTimeout(() => {
                    reelElement.remove();
                    showNotification('Reel deleted successfully.', 'success');
                }, 300);
            }
        });
    });
    
    // Like button event listeners
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelElement = this.closest('.reel');
            const reelId = parseInt(reelElement.getAttribute('data-reel-id'));
            
            // Toggle like state
            const likeIcon = this.querySelector('i');
            const countElement = this.querySelector('.count');
            let count = parseInt(countElement.textContent);
            
            if (likeIcon.classList.contains('far')) {
                // Like
                likeIcon.classList.remove('far');
                likeIcon.classList.add('fas');
                countElement.textContent = ++count;
            } else {
                // Unlike
                likeIcon.classList.remove('fas');
                likeIcon.classList.add('far');
                countElement.textContent = --count;
            }
        });
    });
    
    // Comment button event listeners
    const commentButtons = document.querySelectorAll('.comment-button');
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelElement = this.closest('.reel');
            const reelId = parseInt(reelElement.getAttribute('data-reel-id'));
            
            showCommentsModal(reelId);
        });
    });
    
    // Share button event listeners
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', function() {
            const reelElement = this.closest('.reel');
            const reelId = parseInt(reelElement.getAttribute('data-reel-id'));
            
            showShareModal(reelId);
        });
    });
}

// The rest of the code remains unchanged