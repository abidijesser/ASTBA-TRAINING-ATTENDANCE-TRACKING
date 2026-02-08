import axios from 'axios';

/**
 * Configured Axios instance for API calls
 */
const api = axios.create({
    // Dev: use Vite proxy via relative '/api'
    // Prod: set VITE_API_URL (e.g. https://api.example.com/api)
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor
 * Add any custom headers or logging here
 */
api.interceptors.request.use(
    (config) => {
        // You can add custom logic here (e.g., logging)
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor
 * Handle errors globally
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle specific error cases
        if (error.response) {
            // Server responded with error
            const { status } = error.response;

            if (status === 401) {
                // Unauthorized - redirect to login
                globalThis.location.href = '/login';
            }
        } else if (error.request) {
            // Request made but no response
            console.error('Network error:', error.request);
        }

        return Promise.reject(error);
    }
);

export default api;
