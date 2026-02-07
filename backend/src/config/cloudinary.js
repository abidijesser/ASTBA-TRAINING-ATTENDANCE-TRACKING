import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure Cloudinary SDK with credentials from environment variables
 * This must be called AFTER dotenv has loaded the environment variables
 */
export const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Debug: Log configuration status (without exposing secrets)
    console.log('Cloudinary configured:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗',
        api_key: process.env.CLOUDINARY_API_KEY ? '✓' : '✗',
        api_secret: process.env.CLOUDINARY_API_SECRET ? '✓' : '✗',
    });
};

export default cloudinary;
