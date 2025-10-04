/**
 * ReelSync - Main Application
 */

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth listeners
    initAuthListeners();
    
    // Set up navigation
    setupNavigation();
    
    // Set up modal listeners
    setupModalListeners();
    
    // Load the home page by default
    loadPage('home');
});

/**
 * Set up navigation between pages
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get page to load
            const pageToLoad = this.getAttribute('data-page');
            
            // Update active link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            this.classList.add('active');
            
            // Load the page
            loadPage(pageToLoad);
        });
    });
    
    // Handle CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Check if the button is part of a form or modal
            if (this.closest('form') || this.closest('.modal-content')) {
                return; // Let the form or modal handle it
            }
            
            // If it's a "Get Started" button, navigate to journal page
            if (this.textContent.trim() === 'Get Started' || this.textContent.trim() === 'Create Your Account') {
                if (isLoggedIn()) {
                    // If user is logged in, go to journal
                    loadPage('journal');
                    document.querySelector('.nav-links a[data-page="journal"]').classList.add('active');
                    document.querySelector('.nav-links a[data-page="home"]').classList.remove('active');
                } else {
                    // If not logged in, show signup modal
                    showModal('signupModal');
                }
            }
        });
    });
}

/**
 * Load a page by template ID
 * @param {string} pageId - The ID of the page to load
 */
function loadPage(pageId) {
    // Check if template exists
    const template = document.getElementById(`${pageId}-template`);
    
    if (!template) {
        console.error(`Template for page ${pageId} not found`);
        return;
    }
    
    // Get the app container
    const appContainer = document.getElementById('app');
    
    if (!appContainer) {
        console.error('App container not found');
        return;
    }
    
    // Clone the template content
    const pageContent = template.content.cloneNode(true);
    
    // Clear the app container and append the new content
    appContainer.innerHTML = '';
    appContainer.appendChild(pageContent);
    
    // Initialize the page based on its type
    switch(pageId) {
        case 'journal':
            initJournal();
            break;
        case 'music':
            initMusicPlayer();
            break;
        case 'community':
            initCommunity();
            break;
        case 'profile':
            initProfile();
            break;
    }
}

/**
 * Set up modal functionality
 */
function setupModalListeners() {
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                hideModal(modal);
            }
        });
    });
    
    // Close modal when clicking outside of modal content
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this);
            }
        });
    });
    
    // Switch between login and signup
    const showSignupLink = document.getElementById('showSignup');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal(document.getElementById('loginModal'));
            showModal('signupModal');
        });
    }
    
    const showLoginLink = document.getElementById('showLogin');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal(document.getElementById('signupModal'));
            showModal('loginModal');
        });
    }
    
    // Create reel form submission
    const createReelForm = document.getElementById('createReelForm');
    if (createReelForm) {
        createReelForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('reelTitle').value;
            const description = document.getElementById('reelDescription').value;
            const location = document.getElementById('locationTag').value;
            const musicTrack = document.getElementById('musicSelection').value;
            
            // Check if required fields are filled
            if (!title.trim() || !location.trim()) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            
            // Create reel
            api.createReel(title, description, location, musicTrack || null)
                .then(reel => {
                    // Reset form
                    this.reset();
                    
                    // Hide modal
                    hideModal(document.getElementById('createReelModal'));
                    
                    // Show success notification
                    showNotification('Reel created successfully!', 'success');
                    
                    // If on journal page, reload entries
                    if (document.querySelector('.journal')) {
                        loadJournalEntries();
                    }
                    
                    // Re-enable submit button
                    submitButton.disabled = false;
                    submitButton.textContent = 'Create';
                })
                .catch(error => {
                    console.error('Error creating reel:', error);
                    
                    // Show error notification
                    showNotification('Failed to create reel. Please try again.', 'error');
                    
                    // Re-enable submit button
                    submitButton.disabled = false;
                    submitButton.textContent = 'Create';
                });
        });
    }
    
    // Media button handlers
    const uploadVideoBtn = document.getElementById('uploadVideo');
    const captureAudioBtn = document.getElementById('captureAudio');
    const uploadImageBtn = document.getElementById('uploadImage');
    
    if (uploadVideoBtn) {
        uploadVideoBtn.addEventListener('click', () => {
            showNotification('Video upload feature coming soon!', 'info');
        });
    }
    
    if (captureAudioBtn) {
        captureAudioBtn.addEventListener('click', () => {
            showNotification('Audio recording feature coming soon!', 'info');
        });
    }
    
    if (uploadImageBtn) {
        uploadImageBtn.addEventListener('click', () => {
            showNotification('Image upload feature coming soon!', 'info');
        });
    }
}

/**
 * Show a modal by ID or element
 * @param {string|HTMLElement} modal - The modal ID or element to show
 */
function showModal(modal) {
    // Get modal element if string ID was passed
    const modalElement = typeof modal === 'string' ? document.getElementById(modal) : modal;
    
    if (!modalElement) {
        console.error(`Modal ${modal} not found`);
        return;
    }
    
    // Show modal
    modalElement.classList.remove('hidden');
    
    // Add class to body to prevent scrolling
    document.body.classList.add('modal-open');
    
    // Focus the first input if there is one
    const firstInput = modalElement.querySelector('input, textarea');
    if (firstInput) {
        firstInput.focus();
    }
}

/**
 * Hide a modal
 * @param {HTMLElement} modal - The modal element to hide
 */
function hideModal(modal) {
    modal.classList.add('hidden');
    
    // Allow scrolling again if no modals are visible
    const visibleModals = document.querySelectorAll('.modal:not(.hidden)');
    if (visibleModals.length === 0) {
        document.body.classList.remove('modal-open');
    }
}

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notifContainer = document.querySelector('.notification-container');
    
    if (!notifContainer) {
        notifContainer = document.createElement('div');
        notifContainer.className = 'notification-container';
        document.body.appendChild(notifContainer);
    }
    
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    
    // Determine icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
    }
    
    notif.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    notifContainer.appendChild(notif);
    
    // Add animation class after a small delay
    setTimeout(() => {
        notif.classList.add('show');
    }, 10);
    
    // Add close button event listener
    const closeBtn = notif.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideNotification(notif);
        });
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification(notif);
    }, 5000);
}

/**
 * Hide a notification
 * @param {HTMLElement} notif - The notification element to hide
 */
function hideNotification(notif) {
    // Add hiding animation
    notif.classList.remove('show');
    notif.classList.add('hide');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (notif.parentNode) {
            notif.parentNode.removeChild(notif);
        }
    }, 300);
}

/**
 * Initialize the profile page
 */
function initProfile() {
    const user = getCurrentUser();
    
    if (!user) {
        showModal('loginModal');
        return;
    }
    
    // Update profile information
    const profileName = document.querySelector('.profile-name');
    const profileLocation = document.querySelector('.profile-location');
    const reelsCount = document.querySelector('.stat:nth-child(1) .stat-value');
    const followersCount = document.querySelector('.stat:nth-child(2) .stat-value');
    const followingCount = document.querySelector('.stat:nth-child(3) .stat-value');
    
    if (profileName) profileName.textContent = user.name;
    if (profileLocation) profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${user.location}`;
    if (reelsCount) reelsCount.textContent = user.reels;
    if (followersCount) followersCount.textContent = user.followers;
    if (followingCount) followingCount.textContent = user.following;
    
    // Set up tab switching
    setupProfileTabs();
    
    // Load user reels
    loadUserReels();
    
    // Set up edit profile button
    const editProfileBtn = document.querySelector('.edit-profile-button');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            showNotification('Profile editing feature coming soon!', 'info');
        });
    }
}

/**
 * Set up profile tabs
 */
function setupProfileTabs() {
    const tabButtons = document.querySelectorAll('.profile-tabs .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get tab to show
            const tabToShow = this.getAttribute('data-tab');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.profile .tab-content');
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show selected tab content
            const selectedContent = document.getElementById(`${tabToShow}-content`);
            if (selectedContent) {
                selectedContent.classList.remove('hidden');
            }
        });
    });
}

/**
 * Load user reels for profile page
 */
function loadUserReels() {
    const reelsContainer = document.querySelector('.profile-reels');
    
    if (!reelsContainer) return;
    
    // Show loading state
    reelsContainer.innerHTML = '<div class="loading">Loading your reels...</div>';
    
    api.getUserReels()
        .then(reels => {
            // Clear loading state
            reelsContainer.innerHTML = '';
            
            if (reels.length === 0) {
                reelsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-film"></i>
                        </div>
                        <h3>No reels yet</h3>
                        <p>Start documenting your journey by creating a new reel!</p>
                        <button id="createFirstProfileReel" class="cta-button">Create Your First Reel</button>
                    </div>
                `;
                
                // Add event listener for create reel button
                const createReelBtn = document.getElementById('createFirstProfileReel');
                if (createReelBtn) {
                    createReelBtn.addEventListener('click', () => {
                        showModal('createReelModal');
                    });
                }
                
                return;
            }
            
            // Create grid for reels
            const reelsGrid = document.createElement('div');
            reelsGrid.className = 'reels-grid';
            
            // Create a card for each reel
            reels.forEach(reel => {
                const reelCard = document.createElement('div');
                reelCard.className = 'profile-reel-card';
                reelCard.dataset.reelId = reel.id;
                
                // Determine icon based on media type
                let mediaIcon = 'fa-image';
                if (reel.mediaType === 'video') {
                    mediaIcon = 'fa-video';
                } else if (reel.mediaType === 'audio') {
                    mediaIcon = 'fa-microphone';
                }
                
                reelCard.innerHTML = `
                    <div class="reel-thumbnail">
                        <i class="fas ${mediaIcon}"></i>
                        ${reel.mediaType === 'video' ? '<div class="play-overlay"><i class="fas fa-play"></i></div>' : ''}
                    </div>
                    <div class="reel-info">
                        <h4>${reel.title}</h4>
                        <div class="reel-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${reel.location}</span>
                            <span><i class="far fa-heart"></i> ${reel.likes}</span>
                        </div>
                    </div>
                `;
                
                // Add click event to view reel details
                reelCard.addEventListener('click', () => {
                    showNotification('Viewing reel details coming soon!', 'info');
                });
                
                reelsGrid.appendChild(reelCard);
            });
            
            reelsContainer.appendChild(reelsGrid);
        })
        .catch(error => {
            console.error('Error loading user reels:', error);
            reelsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <h3>Failed to load your reels</h3>
                    <p>Please try again later.</p>
                    <button id="retryLoadProfileReels" class="cta-button">Retry</button>
                </div>
            `;
            
            // Add event listener for retry button
            const retryBtn = document.getElementById('retryLoadProfileReels');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadUserReels();
                });
            }
        });
}