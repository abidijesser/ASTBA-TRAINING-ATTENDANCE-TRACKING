import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from '../services/cloudinaryService.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from './activityController.js';

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

        // Determine resource type based on mimetype
        const mime = req.file.mimetype || '';
        let resourceType = 'auto';
        if (mime.startsWith('image/')) resourceType = 'image';
        else if (mime.startsWith('video/')) resourceType = 'video';
        else if (mime === 'application/pdf') resourceType = 'raw';

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'uploads', resourceType);

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.url,
                publicId: result.publicId,
                format: result.format,
                resourceType: result.resourceType,
                dimensions: {
                    width: result.width,
                    height: result.height,
                },
            },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'upload',
            `Upload de fichier: ${req.file.originalname || 'fichier'}`,
            null,
            null,
            req.file.originalname,
            { format: result.format, resourceType: result.resourceType, size: req.file.size },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
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

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'delete',
            `Suppression de fichier: ${decodedPublicId}`,
            null,
            null,
            decodedPublicId,
            null,
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/upload/private-download/:publicId
 * @desc    Generate a signed private download URL (useful for RAW/PDF when public delivery is restricted)
 * @access  Private
 */
export const privateDownload = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        const decodedPublicId = decodeURIComponent(publicId);

        // Generate a signed download URL for raw resource type (PDF)
        const url = cloudinary.utils.private_download_url(decodedPublicId, 'pdf', {
            resource_type: 'raw',
        });

        // Redirect to the signed URL
        return res.redirect(url);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/upload/view/:publicId
 * @desc    Generate a signed inline view URL for RAW/PDF assets
 * @access  Private
 */
export const viewAsset = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        const decodedPublicId = decodeURIComponent(publicId);

        // Authenticated signed URL for inline viewing
        const signedUrl = cloudinary.url(decodedPublicId, {
            resource_type: 'raw',
            type: 'authenticated',
            sign_url: true,
        });

        return res.redirect(signedUrl);
    } catch (error) {
        next(error);
    }
};
