import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

/**
 * Service layer for Cloudinary operations
 * Handles file uploads and deletions to Cloudinary cloud storage
 */

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name (optional)
 * @returns {Promise<Object>} Upload result with url and public_id
 */
export const uploadToCloudinary = (fileBuffer, folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        // Create upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto', // Automatically detect resource type
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        format: result.format,
                        width: result.width,
                        height: result.height,
                    });
                }
            }
        );

        // Convert buffer to stream and pipe to cloudinary
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {string} publicId - Cloudinary public_id of the file
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
};
