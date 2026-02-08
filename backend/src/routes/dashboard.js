import express from 'express';
import { getDashboardAnalytics, getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * Dashboard Routes
 */

// Get stats
router.get('/stats', protect, getDashboardStats);

// Get analytics for charts
router.get('/analytics', protect, getDashboardAnalytics);

export default router;
