import express from 'express';
import {
    getAllFormations,
    getFormationById,
    createFormation,
    updateFormation,
    deleteFormation,
    getFormationStudents,
    assignStudentToFormation,
    removeStudentFromFormation,
    getFormationStatistics,
} from '../controllers/formationController.js';
import { getNiveauxByFormation, createNiveau } from '../controllers/niveauController.js';
import { getSeancesByNiveau, createSeance } from '../controllers/seanceController.js';
import { protect, isResponsable, isAdmin, isFormateur } from '../middleware/auth.js';

const router = express.Router();

/**
 * Formation Routes
 */

// Get all formations
router.get('/', protect, isFormateur, getAllFormations);

// Get formation by ID
router.get('/:id', protect, isFormateur, getFormationById);

// Create formation
router.post('/', protect, isResponsable, createFormation);

// Update formation
router.put('/:id', protect, isResponsable, updateFormation);

// Delete formation
router.delete('/:id', protect, isResponsable, deleteFormation);

// Get formation students
router.get('/:id/students', protect, isFormateur, getFormationStudents);

// Assign student to formation
router.post('/:id/assign-student', protect, isResponsable, assignStudentToFormation);

// Remove student from formation
router.delete('/:id/remove-student/:eleveId', protect, isResponsable, removeStudentFromFormation);

// Get formation statistics
router.get('/:id/statistics', protect, isResponsable, getFormationStatistics);

/**
 * Nested Niveau Routes
 */
// Get niveaux for formation
router.get('/:formationId/niveaux', protect, isFormateur, getNiveauxByFormation);

// Create niveau for formation
router.post('/:formationId/niveaux', protect, isResponsable, createNiveau);

/**
 * Nested Seance Routes (via niveau)
 */
// These are actually under /api/niveaux/:niveauId/seances but imported here for clarity
// Actual routes are in niveaux routes file

export default router;
