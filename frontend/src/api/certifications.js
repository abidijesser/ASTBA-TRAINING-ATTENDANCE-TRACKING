import api from './axios';

export const certificationAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/certifications', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/certifications/${id}`);
        return response.data;
    },
    validate: async (data) => {
        const response = await api.post('/certifications/validate', data);
        return response.data;
    },
    getByStudent: async (studentId) => {
        const response = await api.get(`/certifications/student/${studentId}`);
        return response.data;
    },
    generateBulk: async (formationId) => {
        const response = await api.post(`/certifications/generate-bulk/${formationId}`);
        return response.data;
    },
    seedPending: async (formationId) => {
        const url = formationId
            ? `/certifications/seed-pending/${formationId}`
            : '/certifications/seed-pending';
        const response = await api.post(url);
        return response.data;
    },
    download: async (id) => {
        const response = await api.get(`/certifications/${id}/download`, { responseType: 'blob' });
        return response; // return full axios response to access blob
    }
};
