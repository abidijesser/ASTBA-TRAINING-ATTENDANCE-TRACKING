import express from 'express';
import {
    markBulkAttendance,
    updatePresence,
    getStudentAttendanceHistory,
    getSessionAttendance,
    getStudentFormationAttendance,
} from '../controllers/presenceController.js';
import { protect, isFormateur } from '../middleware/auth.js';

const router = express.Router();

/**
 * Presence Routes
 */

// Update single presence
router.put('/:id', protect, isFormateur, updatePresence);

// Get student attendance history
router.get('/student/:eleveId', protect, isFormateur, getStudentAttendanceHistory);

// Get session attendance
router.get('/session/:seanceId', protect, isFormateur, getSessionAttendance);

// Get student attendance in formation
router.get(
    '/formation/:formationId/student/:eleveId',
    protect,
    isFormateur,
    getStudentFormationAttendance
);

export default router;
