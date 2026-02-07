import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getAllActivities,
    getUserActivities,
    deleteOldActivities,
} from '../controllers/activityController.js';

const router = express.Router();

// All activity routes require authentication
router.use(protect);

/**
 * GET /api/activities - Get all activities (admin only)
 * Query params: type, userId, startDate, endDate, page, limit
 */
router.get('/', async (req, res, next) => {
    // Admin check
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Seuls les administrateurs peuvent voir toutes les activités',
        });
    }
    getAllActivities(req, res, next);
});

/**
 * GET /api/activities/user/:userId - Get activities for a specific user
 * Query params: type, date, startDate, endDate, page, limit
 */
router.get('/user/:userId', getUserActivities);

/**
 * DELETE /api/activities/cleanup - Delete old activities (admin only)
 * Query params: days (default: 90)
 */
router.delete('/cleanup', async (req, res, next) => {
    // Admin check
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Seuls les administrateurs peuvent nettoyer les activités',
        });
    }
    deleteOldActivities(req, res, next);
});

export default router;
