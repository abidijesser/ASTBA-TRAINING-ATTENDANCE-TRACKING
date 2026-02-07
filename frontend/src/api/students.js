import api from './axios';

/**
 * Student (Élève) API calls
 */

export const studentAPI = {
    /**
     * Get all students
     */
    getAll: async (params = {}) => {
        const response = await api.get('/eleves', { params });
        return response.data;
    },

    /**
     * Get student by ID
     */
    getById: async (id) => {
        const response = await api.get(`/eleves/${id}`);
        return response.data;
    },

    /**
     * Create new student
     */
    create: async (studentData) => {
        const response = await api.post('/eleves', studentData);
        return response.data;
    },

    /**
     * Update student
     */
    update: async (id, studentData) => {
        const response = await api.put(`/eleves/${id}`, studentData);
        return response.data;
    },

    /**
     * Delete student
     */
    delete: async (id) => {
        const response = await api.delete(`/eleves/${id}`);
        return response.data;
    },

    /**
     * Get student formations
     */
    getFormations: async (id) => {
        const response = await api.get(`/eleves/${id}/formations`);
        return response.data;
    },

    /**
     * Get student progress
     */
    getProgress: async (id) => {
        const response = await api.get(`/eleves/${id}/progress`);
        return response.data;
    },

    /**
     * Get attendance history
     */
    getAttendanceHistory: async (id) => {
        const response = await api.get(`/eleves/${id}/attendance-history`);
        return response.data;
    },

    /**
     * Upload student photo
     */
    uploadPhoto: async (id, file) => {
        const formData = new FormData();
        formData.append('photo', file);
        const response = await api.post(`/eleves/${id}/upload-photo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
