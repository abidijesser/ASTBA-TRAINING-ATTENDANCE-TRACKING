import { Activity } from '../models/index.js';

/**
 * Get all activities (admin only)
 */
export const getAllActivities = async (req, res, next) => {
    try {
        const { type, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (userId) filter.userId = userId;

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (page - 1) * limit;

        const activities = await Activity.find(filter)
            .populate('userId', 'nom prenom email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(filter);

        res.json({
            success: true,
            activities,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: activities.length,
                totalCount: total,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get activities for a specific user
 */
export const getUserActivities = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { type, date, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Only allow users to see their own activities or admins to see all
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission de voir ces activités',
            });
        }

        const filter = { userId };

        // Filter by type
        if (type) filter.type = type;

        // Filter by specific date
        if (date) {
            const dateStart = new Date(date);
            dateStart.setHours(0, 0, 0, 0);
            const dateEnd = new Date(date);
            dateEnd.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: dateStart, $lte: dateEnd };
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (page - 1) * limit;

        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(filter);

        res.json({
            success: true,
            activities,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: activities.length,
                totalCount: total,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Log an activity (internal use)
 */
export const logActivity = async (
    userId,
    type,
    description,
    entityType = null,
    entityId = null,
    entityName = null,
    details = null,
    ipAddress = null,
    userAgent = null
) => {
    try {
        const activity = new Activity({
            userId,
            type,
            description,
            entityType,
            entityId,
            entityName,
            details,
            ipAddress,
            userAgent,
            status: 'success',
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Non-blocking error - activity logging should not break the main operation
        return null;
    }
};

/**
 * Log a failed activity
 */
export const logActivityError = async (
    userId,
    type,
    description,
    errorMessage,
    entityType = null,
    ipAddress = null
) => {
    try {
        const activity = new Activity({
            userId,
            type,
            description,
            entityType,
            status: 'failed',
            errorMessage,
            ipAddress,
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity error:', error);
        return null;
    }
};

/**
 * Delete old activities (for cleanup/archiving)
 */
export const deleteOldActivities = async (req, res, next) => {
    try {
        const { days = 90 } = req.query; // Default: delete activities older than 90 days

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await Activity.deleteMany({
            createdAt: { $lt: cutoffDate },
        });

        res.json({
            success: true,
            message: `${result.deletedCount} activités supprimées (plus anciennes que ${days} jours)`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        next(error);
    }
};
