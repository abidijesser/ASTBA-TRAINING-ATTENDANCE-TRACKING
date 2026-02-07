import multer from 'multer';

/**
 * Multer configuration for file uploads
 * Using memory storage to upload directly to Cloudinary
 */

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(
            new Error('Invalid file type. Only image files are allowed.'),
            false
        );
    }
};

// Configure upload middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
