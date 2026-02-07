import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Tokens are stored in httpOnly cookies (managed by browser)
 */

/**
 * Register a new user
 * @param {Object} userData - User data (name, email, password)
 * @returns {Promise<Object>} User data
 */
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);

    if (response.data.success) {
        // Store user info in localStorage for convenience (not the token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Email and password
 * @returns {Promise<Object>} User data
 */
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    if (response.data.success) {
        // Store user info in localStorage for convenience (not the token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Logout user - call backend to clear cookie
 */
export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear user data from localStorage
        localStorage.removeItem('user');
    }
};

/**
 * Get current user from API
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

/**
 * Check if user data exists in localStorage
 * Note: This is just a convenience check, actual auth is via cookie
 * @returns {boolean} True if user data exists
 */
export const hasUserData = () => {
    return !!localStorage.getItem('user');
};
