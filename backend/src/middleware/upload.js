import multer from 'multer';

/**
 * Multer configuration for file uploads
 * Using memory storage to upload directly to Cloudinary
 */

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter for images, videos and PDFs
const fileFilter = (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isPdf = file.mimetype === 'application/pdf';
    if (isImage || isVideo || isPdf) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non valide. Autorisés: images, vidéos, PDF.'), false);
    }
};

// Configure upload middleware
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Increase limit to allow videos; backend streams to Cloudinary
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
