import express from 'express';
import {
    getSeancesByNiveau,
    getSeanceById,
    createSeance,
    updateSeance,
    deleteSeance,
    getSeanceAttendance,
    getAllSeances,
} from '../controllers/seanceController.js';
import { markBulkAttendance } from '../controllers/presenceController.js';
import { protect, isResponsable, isAdmin, isFormateur } from '../middleware/auth.js';

const router = express.Router();

/**
 * Seance Routes
 */

// Get all seances
router.get('/', protect, isFormateur, getAllSeances);

// Get seance by ID
router.get('/:id', protect, isFormateur, getSeanceById);

// Update seance
router.put('/:id', protect, isResponsable, updateSeance);

// Delete seance
router.delete('/:id', protect, isAdmin, deleteSeance);

// Get session attendance
router.get('/:id/attendance', protect, isFormateur, getSeanceAttendance);

// Mark attendance (bulk)
router.post('/:seanceId/mark-attendance', protect, isFormateur, markBulkAttendance);

export default router;
