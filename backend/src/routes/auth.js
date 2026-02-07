import express from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
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
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

export default router;
