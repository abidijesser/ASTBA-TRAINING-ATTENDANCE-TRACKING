import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const activityAPI = {
    getAll: (params = {}) => axiosInstance.get('/activities', { params }),
    create: (data) => axiosInstance.post('/activities', data),
    getUserHistory: (userId, params = {}) => axiosInstance.get(`/activities/user/${userId}`, { params }),
};

export default axiosInstance;
