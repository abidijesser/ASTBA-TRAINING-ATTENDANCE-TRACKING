import express from 'express';
import { uploadFile, deleteFile } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

/**
 * Upload Routes
 * All routes are protected - require authentication
 */

// Upload file
router.post('/', protect, uploadSingle, handleUploadError, uploadFile);

// Delete file
router.delete('/:publicId', protect, deleteFile);

export default router;
