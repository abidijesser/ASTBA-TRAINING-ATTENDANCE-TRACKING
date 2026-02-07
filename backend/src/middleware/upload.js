import multer from 'multer';

/**
 * Multer configuration for file uploads
 * Uses memory storage to handle files as buffers (for Cloudinary upload)
 */

// Configure storage - use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: fileFilter,
});

/**
 * Middleware for single file upload
 * Field name should be 'file'
 */
export const uploadSingle = upload.single('file');

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB',
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    } else if (err) {
        // Other errors
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next();
};
