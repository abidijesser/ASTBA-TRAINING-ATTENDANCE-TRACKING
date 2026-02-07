import express from 'express';
import {
    getAllCertifications,
    getCertificationById,
    validateCertification,
    getStudentCertifications,
    downloadCertificate,
    generateFormationCertificates,
    seedPendingCertificates,
} from '../controllers/certificationController.js';
import { protect, isResponsable, isFormateur } from '../middleware/auth.js';

const router = express.Router();

/**
 * Certification Routes
 */

// Get all certificates
router.get('/', protect, isResponsable, getAllCertifications);

// Get certificate by ID
router.get('/:id', protect, isFormateur, getCertificationById);

// Manually validate certificate
router.post('/validate', protect, isResponsable, validateCertification);

// Generate bulk certificates for a formation
router.post('/generate-bulk/:formationId', protect, isResponsable, generateFormationCertificates);

// Seed pending certificates for all enrollments or a specific formation
router.post('/seed-pending', protect, isResponsable, seedPendingCertificates);
router.post('/seed-pending/:formationId', protect, isResponsable, seedPendingCertificates);

// Get student certificates
router.get('/student/:eleveId', protect, isFormateur, getStudentCertifications);

// Download certificate PDF
router.get('/:id/download', protect, isFormateur, downloadCertificate);

export default router;
