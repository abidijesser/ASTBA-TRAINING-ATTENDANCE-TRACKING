import api from './axios';

export const userAPI = {
    /**
     * Get all users (with optional role filter)
     */
    getAll: async (params = {}) => {
        const response = await api.get('/users', { params });
        return response.data;
    },
};
