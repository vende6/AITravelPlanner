/**
 * ReelSync - Authentication Service
 */

// Mock user data for demo purposes
const MOCK_USERS = [
    {
        id: 1,
        name: 'Emma K.',
        email: 'emma@example.com',
        password: 'password123',
        location: 'Berlin, Germany',
        reels: 12,
        followers: 42,
        following: 37,
        profileImage: null
    },
    {
        id: 2,
        name: 'Michael T.',
        email: 'michael@example.com',
        password: 'password123',
        location: 'Potsdam, Germany',
        reels: 8,
        followers: 27,
        following: 19,
        profileImage: null
    }
];

// Current user session key in localStorage
const USER_SESSION_KEY = 'reelsync_user_session';

/**
 * Initialize auth listeners for login and signup
 */
function initAuthListeners() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Attempt login
            login(email, password)
                .then(user => {
                    // Hide login modal
                    hideModal(document.getElementById('loginModal'));
                    
                    // Reset form
                    loginForm.reset();
                    
                    // Show success notification
                    showNotification('Successfully logged in!', 'success');
                    
                    // Update UI for logged-in state
                    updateAuthUI(user);
                    
                    // If user was trying to access a restricted page, load it now
                    if (document.querySelector('.journal')) {
                        initJournal();
                    } else if (document.querySelector('.music')) {
                        initMusicPlayer();
                    } else if (document.querySelector('.community')) {
                        initCommunity();
                    } else if (document.querySelector('.profile')) {
                        initProfile();
                    }
                })
                .catch(error => {
                    console.error('Login error:', error);
                    showNotification(error.message, 'error');
                });
        });
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate passwords match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }
            
            // Attempt signup
            signup(fullName, email, password)
                .then(user => {
                    // Hide signup modal
                    hideModal(document.getElementById('signupModal'));
                    
                    // Reset form
                    signupForm.reset();
                    
                    // Show success notification
                    showNotification('Account created successfully!', 'success');
                    
                    // Update UI for logged-in state
                    updateAuthUI(user);
                    
                    // Navigate to journal page to start onboarding
                    loadPage('journal');
                    document.querySelector('.nav-links a[data-page="journal"]').classList.add('active');
                    document.querySelector('.nav-links a[data-page="home"]').classList.remove('active');
                })
                .catch(error => {
                    console.error('Signup error:', error);
                    showNotification(error.message, 'error');
                });
        });
    }
    
    // Login button click
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            if (isLoggedIn()) {
                // If logged in, show logout menu
                showLogoutMenu();
            } else {
                // If not logged in, show login modal
                showModal('loginModal');
            }
        });
    }
    
    // Check if user is already logged in
    const sessionUser = getSessionUser();
    if (sessionUser) {
        // Update UI for logged-in state
        updateAuthUI(sessionUser);
    }
}

/**
 * Show logout menu
 */
function showLogoutMenu() {
    // Remove any existing logout menu
    const existingMenu = document.querySelector('.logout-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const user = getSessionUser();
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginBtn || !user) return;
    
    // Create logout menu
    const menu = document.createElement('div');
    menu.className = 'logout-menu';
    
    menu.innerHTML = `
        <div class="menu-header">
            <div class="menu-user-info">
                <div class="menu-user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="menu-user-name">
                    <h4>${user.name}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
        </div>
        <div class="menu-items">
            <a href="#" class="menu-item" data-action="profile">
                <i class="fas fa-user-circle"></i> Profile
            </a>
            <a href="#" class="menu-item" data-action="settings">
                <i class="fas fa-cog"></i> Settings
            </a>
            <a href="#" class="menu-item" data-action="logout">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    `;
    
    // Position the menu below the login button
    const btnRect = loginBtn.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${btnRect.bottom}px`;
    menu.style.right = `${window.innerWidth - btnRect.right}px`;
    
    // Add to body
    document.body.appendChild(menu);
    
    // Add event listeners
    const profileAction = menu.querySelector('[data-action="profile"]');
    const settingsAction = menu.querySelector('[data-action="settings"]');
    const logoutAction = menu.querySelector('[data-action="logout"]');
    
    if (profileAction) {
        profileAction.addEventListener('click', function(e) {
            e.preventDefault();
            menu.remove();
            loadPage('profile');
            // Update active navigation item
            document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        });
    }
    
    if (settingsAction) {
        settingsAction.addEventListener('click', function(e) {
            e.preventDefault();
            menu.remove();
            showNotification('Settings feature coming soon!', 'info');
        });
    }
    
    if (logoutAction) {
        logoutAction.addEventListener('click', function(e) {
            e.preventDefault();
            menu.remove();
            logout();
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== loginBtn) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

/**
 * Update UI elements based on auth state
 * @param {Object} user - The logged in user
 */
function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginBtn) return;
    
    if (user) {
        // Update login button to show user info
        loginBtn.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <span class="user-name">${user.name.split(' ')[0]}</span>
        `;
        loginBtn.classList.add('logged-in');
    } else {
        // Reset to default login button
        loginBtn.innerHTML = 'Login';
        loginBtn.classList.remove('logged-in');
    }
}

/**
 * Attempt to log in a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Promise resolving to the logged in user
 */
function login(email, password) {
    return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
            // Find user with matching credentials
            const user = MOCK_USERS.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Clone user object without password
                const sessionUser = { ...user };
                delete sessionUser.password;
                
                // Save to session
                setSessionUser(sessionUser);
                
                resolve(sessionUser);
            } else {
                reject(new Error('Invalid email or password'));
            }
        }, 800); // Simulate API delay
    });
}

/**
 * Sign up a new user
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Promise resolving to the created user
 */
function signup(fullName, email, password) {
    return new Promise((resolve, reject) => {
        // In a real app, this would be an API call
        setTimeout(() => {
            // Check if email already exists
            if (MOCK_USERS.some(u => u.email === email)) {
                reject(new Error('Email already registered'));
                return;
            }
            
            // Create new user (in a real app, this would be saved to a database)
            const newUser = {
                id: MOCK_USERS.length + 1,
                name: fullName,
                email: email,
                password: password, // In a real app, this would be hashed
                location: 'Berlin, Germany', // Default location
                reels: 0,
                followers: 0,
                following: 0,
                profileImage: null
            };
            
            // Add to mock data
            MOCK_USERS.push(newUser);
            
            // Clone user object without password
            const sessionUser = { ...newUser };
            delete sessionUser.password;
            
            // Save to session
            setSessionUser(sessionUser);
            
            resolve(sessionUser);
        }, 1000); // Simulate API delay
    });
}

/**
 * Log out the current user
 */
function logout() {
    // Clear session
    clearSessionUser();
    
    // Update UI
    updateAuthUI(null);
    
    // Show notification
    showNotification('Logged out successfully', 'success');
    
    // Navigate to home page
    loadPage('home');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === 'home') {
            link.classList.add('active');
        }
    });
}

/**
 * Save user to session
 * @param {Object} user - The user to save
 */
function setSessionUser(user) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

/**
 * Get user from session
 * @returns {Object|null} The session user or null if not logged in
 */
function getSessionUser() {
    const userJson = localStorage.getItem(USER_SESSION_KEY);
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Clear user from session
 */
function clearSessionUser() {
    localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Check if a user is currently logged in
 * @returns {boolean} True if logged in, false otherwise
 */
function isLoggedIn() {
    return !!getSessionUser();
}

/**
 * Get the current logged in user
 * @returns {Object|null} The current user or null if not logged in
 */
function getCurrentUser() {
    return getSessionUser();
}