import express from 'express';
import {
    getAllEleves,
    getEleveById,
    createEleve,
    updateEleve,
    deleteEleve,
    getEleveFormations,
    getEleveProgress,
    getEleveAttendanceHistory,
    uploadElevePhoto,
} from '../controllers/eleveController.js';
import { protect, isResponsable, isAdmin, isFormateur } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

/**
 * Student Routes
 */

// Get all students
router.get('/', protect, isFormateur, getAllEleves);

// Get student by ID
router.get('/:id', protect, isFormateur, getEleveById);

// Create new student
router.post('/', protect, isResponsable, createEleve);

// Update student
router.put('/:id', protect, isResponsable, updateEleve);

// Delete student
router.delete('/:id', protect, isAdmin, deleteEleve);

// Get student's formations
router.get('/:id/formations', protect, isFormateur, getEleveFormations);

// Get student progress
router.get('/:id/progress', protect, isFormateur, getEleveProgress);

// Get attendance history
router.get('/:id/attendance-history', protect, isFormateur, getEleveAttendanceHistory);

// Upload student photo
router.post('/:id/upload-photo', protect, isResponsable, upload.single('photo'), uploadElevePhoto);

export default router;
