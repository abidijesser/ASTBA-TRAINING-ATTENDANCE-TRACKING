import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
    registerValidation,
    loginValidation,
    validate,
} from '../utils/validators.js';

const router = express.Router();

/**
 * Authentication Routes
 */

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// Protected routes
router.get('/me', protect, getMe);

export default router;
