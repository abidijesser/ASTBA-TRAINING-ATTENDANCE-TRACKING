import api from './axios';

/**
 * Dashboard API calls
 */
export const dashboardAPI = {
    /**
     * Get dashboard statistics
     */
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    /**
     * Get real dashboard analytics (cards + charts)
     */
    getAnalytics: async () => {
        const response = await api.get('/dashboard/analytics');
        return response.data;
    },
};
