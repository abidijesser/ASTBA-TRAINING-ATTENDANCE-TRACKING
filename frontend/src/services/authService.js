import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

/**
 * Register a new user
 * @param {Object} userData - User data (name, email, password)
 * @returns {Promise<Object>} User data and token
 */
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);

    if (response.data.success && response.data.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Email and password
 * @returns {Promise<Object>} User data and token
 */
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    if (response.data.success && response.data.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
};

/**
 * Logout user - clear local storage
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
 * Get token from localStorage
 * @returns {string|null} JWT token
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
    return !!getToken();
};
