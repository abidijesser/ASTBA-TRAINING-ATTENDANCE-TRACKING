import { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentUser, logout as logoutService } from '../services/authService';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Load user on app mount if token exists
     */
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const response = await getCurrentUser();
                    setUser(response.data.user);
                } catch (err) {
                    console.error('Failed to load user:', err);
                    // Token is invalid, clear it
                    logoutService();
                }
            }

            setLoading(false);
        };

        loadUser();
    }, []);

    /**
     * Login function - sets user state
     * @param {Object} userData - User data from login response
     */
    const login = (userData) => {
        setUser(userData);
        setError(null);
    };

    /**
     * Logout function - clears user state and localStorage
     */
    const logout = () => {
        logoutService();
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
