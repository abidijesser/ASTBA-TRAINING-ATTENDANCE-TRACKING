import express from 'express';
import {
    updatePresence,
    getStudentAttendanceHistory,
    getSessionAttendance,
    getStudentFormationAttendance,
    getAttendanceSummary,
} from '../controllers/presenceController.js';
import { protect, isFormateur, isResponsable } from '../middleware/auth.js';

const router = express.Router();

/**
 * Presence Routes
 */

// Attendance summary for admin/responsable
router.get('/summary', protect, isResponsable, getAttendanceSummary);

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
