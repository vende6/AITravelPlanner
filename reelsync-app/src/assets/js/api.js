/**
 * ReelSync API Service
 * This is a mock implementation for development purposes.
 */

const api = {
    /**
     * Current user data
     */
    currentUser: null,
    
    /**
     * Check if user is logged in
     * @returns {boolean} Whether the user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser;
    },
    
    /**
     * Get current user information
     * @returns {Object|null} Current user object or null if not logged in
     */
    getCurrentUser() {
        return this.currentUser;
    },
    
    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise} Promise that resolves with user data or rejects with error
     */
    login(email, password) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // Simple validation for demo purposes
                if (!email || !password) {
                    reject(new Error('Email and password are required'));
                    return;
                }
                
                // Mock successful login
                this.currentUser = {
                    id: 'user123',
                    name: 'Alex Johnson',
                    email: email,
                    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
                    reels: 24,
                    following: 142,
                    followers: 268
                };
                
                // Save to session storage
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                resolve(this.currentUser);
            }, 800);
        });
    },
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} Promise that resolves with user data or rejects with error
     */
    register(userData) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // Simple validation for demo purposes
                if (!userData.email || !userData.password || !userData.name) {
                    reject(new Error('All fields are required'));
                    return;
                }
                
                // Mock successful registration
                this.currentUser = {
                    id: 'user' + Math.floor(Math.random() * 1000),
                    name: userData.name,
                    email: userData.email,
                    avatar: 'https://randomuser.me/api/portraits/lego/2.jpg',
                    reels: 0,
                    following: 0,
                    followers: 0
                };
                
                // Save to session storage
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                resolve(this.currentUser);
            }, 1000);
        });
    },
    
    /**
     * Logout the current user
     * @returns {Promise} Promise that resolves when logout is complete
     */
    logout() {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                this.currentUser = null;
                sessionStorage.removeItem('currentUser');
                resolve();
            }, 500);
        });
    },
    
    /**
     * Check for stored session on init
     * @returns {Promise} Promise that resolves with user data or null
     */
    checkSession() {
        return new Promise((resolve) => {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
            resolve(this.currentUser);
        });
    },
    
    /**
     * Get user's journal entries (reels)
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves with array of reels
     */
    getUserReels(userId) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock reels
                const mockReels = Array.from({length: 12}, (_, i) => ({
                    id: `reel-${i}`,
                    userId: userId,
                    title: `My adventure ${i + 1}`,
                    location: ['New York', 'Paris', 'Tokyo', 'Sydney', 'London'][Math.floor(Math.random() * 5)],
                    timestamp: Date.now() - (i * 24 * 60 * 60 * 1000), // Days ago
                    imageUrl: `https://picsum.photos/500/300?random=${i}`,
                    likes: Math.floor(Math.random() * 200),
                    comments: Math.floor(Math.random() * 40),
                    musicTrack: `track-${Math.floor(Math.random() * 100)}`,
                    mood: ['Energetic', 'Relaxed', 'Happy', 'Reflective', 'Adventurous'][Math.floor(Math.random() * 5)]
                }));
                
                resolve(mockReels);
            }, 1000);
        });
    },
    
    /**
     * Get trending reels for the community page
     * @returns {Promise} Promise that resolves with array of trending reels
     */
    getTrendingReels() {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock trending reels
                const mockTrendingReels = Array.from({length: 20}, (_, i) => ({
                    id: `trending-${i}`,
                    userId: `user-${Math.floor(Math.random() * 1000)}`,
                    userName: ['Sophia', 'Jackson', 'Emma', 'Liam', 'Olivia'][Math.floor(Math.random() * 5)] + ' ' +
                              ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'][Math.floor(Math.random() * 5)],
                    userAvatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 70)}.jpg`,
                    title: `Amazing experience ${i + 1}`,
                    location: ['Bali', 'Rome', 'San Francisco', 'Barcelona', 'Bangkok'][Math.floor(Math.random() * 5)],
                    timestamp: Date.now() - (Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000), // Random days ago
                    imageUrl: `https://picsum.photos/500/300?random=${i + 100}`,
                    likes: Math.floor(Math.random() * 2000) + 500,
                    comments: Math.floor(Math.random() * 300) + 50,
                    musicTrack: `track-${Math.floor(Math.random() * 100)}`,
                    mood: ['Energetic', 'Relaxed', 'Happy', 'Reflective', 'Adventurous'][Math.floor(Math.random() * 5)]
                }));
                
                resolve(mockTrendingReels);
            }, 1200);
        });
    },
    
    /**
     * Get reels from accounts the current user follows
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves with array of reels from followed accounts
     */
    getUserFollowingReels(userId) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock following reels
                const mockFollowingReels = Array.from({length: 15}, (_, i) => ({
                    id: `following-${i}`,
                    userId: `user-${Math.floor(Math.random() * 1000)}`,
                    userName: ['Noah', 'Ava', 'William', 'Isabella', 'James'][Math.floor(Math.random() * 5)] + ' ' +
                              ['Miller', 'Anderson', 'Taylor', 'Moore', 'Jackson'][Math.floor(Math.random() * 5)],
                    userAvatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 70)}.jpg`,
                    title: `Friend's journey ${i + 1}`,
                    location: ['Costa Rica', 'Amsterdam', 'Berlin', 'Cape Town', 'Dubai'][Math.floor(Math.random() * 5)],
                    timestamp: Date.now() - (Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000), // Random days ago
                    imageUrl: `https://picsum.photos/500/300?random=${i + 200}`,
                    likes: Math.floor(Math.random() * 500) + 50,
                    comments: Math.floor(Math.random() * 100) + 10,
                    musicTrack: `track-${Math.floor(Math.random() * 100)}`,
                    mood: ['Energetic', 'Relaxed', 'Happy', 'Reflective', 'Adventurous'][Math.floor(Math.random() * 5)]
                }));
                
                resolve(mockFollowingReels);
            }, 1500);
        });
    },
    
    /**
     * Get community playlists
     * @returns {Promise} Promise that resolves with array of community playlists
     */
    getCommunityPlaylists() {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock playlists
                const mockPlaylists = [
                    {
                        id: 'playlist-1',
                        title: 'Summer Vibes',
                        creator: 'Travel Community',
                        coverUrl: 'https://picsum.photos/200/200?random=101',
                        tracks: ['track-1', 'track-23', 'track-45', 'track-67', 'track-89'],
                        followers: 2347
                    },
                    {
                        id: 'playlist-2',
                        title: 'City Exploration',
                        creator: 'Urban Travelers',
                        coverUrl: 'https://picsum.photos/200/200?random=102',
                        tracks: ['track-12', 'track-34', 'track-56', 'track-78', 'track-90'],
                        followers: 1893
                    },
                    {
                        id: 'playlist-3',
                        title: 'Mountain Retreat',
                        creator: 'Nature Lovers',
                        coverUrl: 'https://picsum.photos/200/200?random=103',
                        tracks: ['track-11', 'track-22', 'track-33', 'track-44', 'track-55'],
                        followers: 1256
                    },
                    {
                        id: 'playlist-4',
                        title: 'Beach Relaxation',
                        creator: 'Ocean Explorers',
                        coverUrl: 'https://picsum.photos/200/200?random=104',
                        tracks: ['track-66', 'track-77', 'track-88', 'track-99', 'track-100'],
                        followers: 3421
                    }
                ];
                
                resolve(mockPlaylists);
            }, 900);
        });
    },
    
    /**
     * Get user's playlists
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves with array of user's playlists
     */
    getUserPlaylists(userId) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock user playlists
                const mockUserPlaylists = [
                    {
                        id: 'user-playlist-1',
                        title: 'My Road Trip Mix',
                        creator: 'You',
                        coverUrl: 'https://picsum.photos/200/200?random=201',
                        tracks: ['track-7', 'track-18', 'track-29', 'track-40', 'track-51'],
                        followers: 24
                    },
                    {
                        id: 'user-playlist-2',
                        title: 'Chill Evening',
                        creator: 'You',
                        coverUrl: 'https://picsum.photos/200/200?random=202',
                        tracks: ['track-62', 'track-73', 'track-84', 'track-95', 'track-106'],
                        followers: 13
                    }
                ];
                
                resolve(mockUserPlaylists);
            }, 700);
        });
    },
    
    /**
     * Get music track by ID
     * @param {string} trackId - Track ID
     * @returns {Promise} Promise that resolves with track data
     */
    getMusicTrackById(trackId) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Mock track data
                const artists = ['Tame Impala', 'Beach House', 'Tycho', 'Bonobo', 'Khruangbin', 'Four Tet'];
                const titles = ['Breathe Deeper', 'Space Song', 'Awake', 'Kerala', 'Friday Morning', 'Daughter'];
                
                const mockTrack = {
                    id: trackId,
                    title: titles[Math.floor(Math.random() * titles.length)],
                    artist: artists[Math.floor(Math.random() * artists.length)],
                    duration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes in seconds
                    coverUrl: `https://picsum.photos/200/200?random=${trackId.split('-')[1]}`
                };
                
                resolve(mockTrack);
            }, 300);
        });
    },
    
    /**
     * Get user's music recommendations
     * @param {string} userId - User ID
     * @returns {Promise} Promise that resolves with array of recommended tracks
     */
    getUserMusicRecommendations(userId) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock recommendations
                const mockRecommendations = Array.from({length: 10}, (_, i) => ({
                    id: `track-${i + 200}`,
                    title: ['Sunset', 'Horizon', 'Journey', 'Discovery', 'Wanderlust'][Math.floor(Math.random() * 5)] + ' ' +
                           ['Dreams', 'Vibes', 'Moments', 'Memories', 'Adventures'][Math.floor(Math.random() * 5)],
                    artist: ['Luna Ray', 'The Wanderers', 'Skyline Avenue', 'Ocean Collective', 'Mountain Echo'][Math.floor(Math.random() * 5)],
                    duration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes in seconds
                    coverUrl: `https://picsum.photos/200/200?random=${i + 300}`,
                    mood: ['Energetic', 'Relaxed', 'Happy', 'Reflective', 'Adventurous'][Math.floor(Math.random() * 5)],
                    location: ['Beach', 'Mountain', 'City', 'Forest', 'Desert'][Math.floor(Math.random() * 5)]
                }));
                
                resolve(mockRecommendations);
            }, 1100);
        });
    },
    
    /**
     * Get music recommendations by mood
     * @param {string} mood - The mood category
     * @returns {Promise} Promise that resolves with array of tracks matching the mood
     */
    getMusicByMood(mood) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock mood-based recommendations
                const mockMoodTracks = Array.from({length: 8}, (_, i) => ({
                    id: `track-${i + 400}`,
                    title: [`${mood} Journey`, `${mood} Memories`, `${mood} Moments`, `${mood} Days`][Math.floor(Math.random() * 4)],
                    artist: ['Luna Ray', 'The Wanderers', 'Skyline Avenue', 'Ocean Collective', 'Mountain Echo'][Math.floor(Math.random() * 5)],
                    duration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes in seconds
                    coverUrl: `https://picsum.photos/200/200?random=${i + 400}`,
                    mood: mood
                }));
                
                resolve(mockMoodTracks);
            }, 800);
        });
    },
    
    /**
     * Get music recommendations by location
     * @param {string} location - The location category
     * @returns {Promise} Promise that resolves with array of tracks matching the location
     */
    getMusicByLocation(location) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // Generate mock location-based recommendations
                const mockLocationTracks = Array.from({length: 8}, (_, i) => ({
                    id: `track-${i + 500}`,
                    title: [`${location} Sounds`, `${location} Vibes`, `${location} Atmosphere`, `${location} Experience`][Math.floor(Math.random() * 4)],
                    artist: ['Luna Ray', 'The Wanderers', 'Skyline Avenue', 'Ocean Collective', 'Mountain Echo'][Math.floor(Math.random() * 5)],
                    duration: Math.floor(Math.random() * 180) + 120, // 2-5 minutes in seconds
                    coverUrl: `https://picsum.photos/200/200?random=${i + 500}`,
                    location: location
                }));
                
                resolve(mockLocationTracks);
            }, 800);
        });
    },
    
    /**
     * Create a new reel
     * @param {Object} reelData - The reel data
     * @returns {Promise} Promise that resolves with the created reel
     */
    createReel(reelData) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                const newReel = {
                    id: `reel-${Date.now()}`,
                    userId: this.currentUser?.id || 'anonymous',
                    timestamp: Date.now(),
                    likes: 0,
                    comments: 0,
                    ...reelData
                };
                
                resolve(newReel);
            }, 1500);
        });
    },

    /**
     * Create a new playlist
     * @param {string} title - The playlist title
     * @param {string} description - The playlist description
     * @param {Array} tracks - Optional array of track IDs to include in the playlist
     * @returns {Promise} Promise that resolves with the created playlist
     */
    createPlaylist(title, description, tracks = []) {
        return new Promise((resolve, reject) => {
            // Simulate API call delay
            setTimeout(() => {
                // Validate required fields
                if (!title) {
                    reject(new Error('Playlist title is required'));
                    return;
                }
                
                if (!this.currentUser) {
                    reject(new Error('You must be logged in to create a playlist'));
                    return;
                }
                
                // Create new playlist
                const newPlaylist = {
                    id: `user-playlist-${Date.now()}`,
                    title: title,
                    description: description || '',
                    creator: this.currentUser.name,
                    creatorId: this.currentUser.id,
                    tracks: tracks,
                    coverUrl: 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000),
                    followers: 0,
                    createdAt: new Date().toISOString()
                };
                
                // In a real app, this would save to a database
                
                resolve(newPlaylist);
            }, 1000);
        });
    }
};