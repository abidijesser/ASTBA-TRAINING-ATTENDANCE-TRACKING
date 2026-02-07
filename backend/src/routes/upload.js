import express from 'express';
import { uploadFile, deleteFile, privateDownload, viewAsset } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

/**
 * Upload Routes
 * All routes are protected - require authentication
 */

// Upload file (requires auth)
router.post('/', protect, upload.single('file'), uploadFile);

// Delete file (requires auth)
router.delete('/:publicId', protect, deleteFile);

// Private download redirect (signed URL) - public, Cloudinary signature secures access
router.get('/private-download/:publicId', privateDownload);

// Inline view redirect for RAW/PDF via authenticated signed URL - public
router.get('/view/:publicId', viewAsset);

export default router;
