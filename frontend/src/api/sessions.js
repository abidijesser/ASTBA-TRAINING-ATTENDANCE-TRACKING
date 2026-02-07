import api from './axios';

/**
 * Session (Séance) API calls
 */

export const sessionAPI = {
    /**
     * Get session by ID
     */
    getById: async (id) => {
        const response = await api.get(`/seances/${id}`);
        return response.data;
    },

    /**
     * Get all sessions
     */
    getAll: async () => {
        const response = await api.get('/seances');
        return response.data;
    },

    /**
     * Update session
     */
    update: async (id, sessionData) => {
        const response = await api.put(`/seances/${id}`, sessionData);
        return response.data;
    },

    /**
     * Delete session
     */
    delete: async (id) => {
        const response = await api.delete(`/seances/${id}`);
        return response.data;
    },

    /**
     * Get session attendance
     */
    getAttendance: async (id) => {
        const response = await api.get(`/seances/${id}/attendance`);
        return response.data;
    },

    /**
     * Mark attendance (bulk)
     */
    markAttendance: async (id, attendances) => {
        const response = await api.post(`/seances/${id}/mark-attendance`, {
            attendances,
        });
        return response.data;
    },
};

/**
 * Level (Niveau) API calls
 */
export const niveauAPI = {
    /**
     * Get niveau by ID
     */
    getById: async (id) => {
        const response = await api.get(`/niveaux/${id}`);
        return response.data;
    },

    /**
     * Get sessions for niveau
     */
    getSessions: async (id) => {
        const response = await api.get(`/niveaux/${id}/seances`);
        return response.data;
    },

    /**
     * Create session for niveau
     */
    createSession: async (id, sessionData) => {
        const response = await api.post(`/niveaux/${id}/seances`, sessionData);
        return response.data;
    },

    /**
     * Update niveau
     */
    update: async (id, niveauData) => {
        const response = await api.put(`/niveaux/${id}`, niveauData);
        return response.data;
    },
};
