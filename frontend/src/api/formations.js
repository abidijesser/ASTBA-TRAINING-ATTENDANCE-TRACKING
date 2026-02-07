import api from './axios';

/**
 * Formation API calls
 */

export const formationAPI = {
    /**
     * Get all formations
     */
    getAll: async (params = {}) => {
        const response = await api.get('/formations', { params });
        return response.data;
    },

    /**
     * Get formation by ID
     */
    getById: async (id) => {
        const response = await api.get(`/formations/${id}`);
        return response.data;
    },

    /**
     * Create formation
     */
    create: async (formationData) => {
        const response = await api.post('/formations', formationData);
        return response.data;
    },

    /**
     * Update formation
     */
    update: async (id, formationData) => {
        const response = await api.put(`/formations/${id}`, formationData);
        return response.data;
    },

    /**
     * Delete formation
     */
    delete: async (id) => {
        const response = await api.delete(`/formations/${id}`);
        return response.data;
    },

    /**
     * Get formation students
     */
    getStudents: async (id, params = {}) => {
        const response = await api.get(`/formations/${id}/students`, { params });
        return response.data;
    },

    /**
     * Assign student to formation
     */
    assignStudent: async (id, eleveId) => {
        const response = await api.post(`/formations/${id}/assign-student`, {
            eleve_id: eleveId,
        });
        return response.data;
    },

    /**
     * Remove student from formation
     */
    removeStudent: async (id, eleveId) => {
        const response = await api.delete(`/formations/${id}/remove-student/${eleveId}`);
        return response.data;
    },

    /**
     * Get formation statistics
     */
    getStatistics: async (id) => {
        const response = await api.get(`/formations/${id}/statistics`);
        return response.data;
    },

    /**
     * Get formation levels
     */
    getLevels: async (id) => {
        const response = await api.get(`/formations/${id}/niveaux`);
        return response.data;
    },
};
