import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Formateurs, etc.) - Only accessible by Responsable and Admin
router.get('/', protect, authorize('responsable', 'admin'), getAllUsers);

export default router;
