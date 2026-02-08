import api from './axios';

/**
 * Attendance (Présence) API calls
 */

export const attendanceAPI = {
    /**
     * Update single presence
     */
    update: async (id, data) => {
        const response = await api.put(`/presences/${id}`, data);
        return response.data;
    },

    /**
     * Get student attendance history
     */
    getStudentHistory: async (eleveId) => {
        const response = await api.get(`/presences/student/${eleveId}`);
        return response.data;
    },

    /**
     * Get session attendance
     */
    getSessionAttendance: async (seanceId) => {
        const response = await api.get(`/presences/session/${seanceId}`);
        return response.data;
    },

    /**
     * Get student attendance in formation
     */
    getStudentFormationAttendance: async (formationId, eleveId) => {
        const response = await api.get(`/presences/formation/${formationId}/student/${eleveId}`);
        return response.data;
    },

    /**
     * Get attendance summary per student (admin/responsable)
     */
    getSummary: async () => {
        const response = await api.get('/presences/summary');
        return response.data;
    },
};

/**
 * Certification API calls
 */
export const certificationAPI = {
    /**
     * Get all certifications
     */
    getAll: async (params = {}) => {
        const response = await api.get('/certifications', { params });
        return response.data;
    },

    /**
     * Get certification by ID
     */
    getById: async (id) => {
        const response = await api.get(`/certifications/${id}`);
        return response.data;
    },

    /**
     * Validate certification
     */
    validate: async (data) => {
        const response = await api.post('/certifications/validate', data);
        return response.data;
    },

    /**
     * Get student certifications
     */
    getStudentCertifications: async (eleveId) => {
        const response = await api.get(`/certifications/student/${eleveId}`);
        return response.data;
    },

    /**
     * Download certificate
     */
    download: async (id) => {
        const response = await api.get(`/certifications/${id}/download`);
        return response.data;
    },
};
