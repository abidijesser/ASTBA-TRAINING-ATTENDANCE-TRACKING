import api from './api';

/**
 * Upload Service
 * Handles file upload operations to Cloudinary via backend
 */

/**
 * Upload a file
 * @param {File} file - File object to upload
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFile = async (publicId) => {
    // URL encode the publicId as it contains slashes
    const encodedPublicId = encodeURIComponent(publicId);
    const response = await api.delete(`/upload/${encodedPublicId}`);
    return response.data;
};
