import multer from 'multer';

/**
 * Multer configuration for file uploads
 * Using memory storage to upload directly to Cloudinary
 */

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter: images only (no videos or PDFs)
const fileFilter = (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    if (isImage) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non valide. Autorisés: images uniquement.'), false);
    }
};

// Configure upload middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Reasonable limit for images
        fileSize: 20 * 1024 * 1024, // 20MB
    },
});
