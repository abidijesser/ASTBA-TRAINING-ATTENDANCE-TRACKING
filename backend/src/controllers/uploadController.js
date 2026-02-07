import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from '../services/cloudinaryService.js';

/**
 * Upload Controllers
 * Handle file uploads to Cloudinary
 */

/**
 * @route   POST /api/upload
 * @desc    Upload a file to Cloudinary
 * @access  Private
 */
export const uploadFile = async (req, res, next) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
            });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.url,
                publicId: result.publicId,
                format: result.format,
                dimensions: {
                    width: result.width,
                    height: result.height,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/upload/:publicId
 * @desc    Delete a file from Cloudinary
 * @access  Private
 */
export const deleteFile = async (req, res, next) => {
    try {
        const { publicId } = req.params;

        // Cloudinary public_id has slashes, so we need to decode it
        const decodedPublicId = decodeURIComponent(publicId);

        // Try deleting as image first, then as raw (for PDFs)
        let result = await deleteFromCloudinary(decodedPublicId);
        if (result.result !== 'ok') {
            // Attempt raw deletion for non-image assets like PDFs
            try {
                const cloudinary = (await import('../config/cloudinary.js')).default;
                result = await cloudinary.uploader.destroy(decodedPublicId, { resource_type: 'raw' });
            } catch (e) {
                // noop; will fall through
            }
        }

        if (result.result !== 'ok') {
            return res.status(404).json({
                success: false,
                message: 'File not found or already deleted',
            });
        }

        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
