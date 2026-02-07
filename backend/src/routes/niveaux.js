import express from 'express';
import {
    getNiveauxByFormation,
    getNiveauById,
    createNiveau,
    updateNiveau,
    deleteNiveau,
} from '../controllers/niveauController.js';
import { getSeancesByNiveau, createSeance } from '../controllers/seanceController.js';
import { protect, isResponsable, isAdmin, isFormateur } from '../middleware/auth.js';

const router = express.Router();

/**
 * Niveau Routes
 */

// Get niveau by ID
router.get('/:id', protect, isFormateur, getNiveauById);

// Update niveau
router.put('/:id', protect, isResponsable, updateNiveau);

// Delete niveau
router.delete('/:id', protect, isAdmin, deleteNiveau);

/**
 * Nested Seance Routes
 */
// Get seances for niveau
router.get('/:niveauId/seances', protect, isFormateur, getSeancesByNiveau);

// Create seance for niveau
router.post('/:niveauId/seances', protect, isFormateur, createSeance);

export default router;
