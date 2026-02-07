import { logActivity, logActivityError } from '../controllers/activityController.js';

/**
 * Middleware to log activities
 * Should be used after successful operations to log what the user did
 * 
 * Usage:
 * res.on('finish', activityLogger({
 *     type: 'create',
 *     description: 'Création d\'un nouvel élève: John Doe',
 *     entityType: 'Eleve',
 *     entityId: req.body._id,
 *     entityName: 'John Doe'
 * })(req, res));
 * 
 * Or attach it to res.locals:
 * res.locals.logActivity = {
 *     type: 'update',
 *     description: 'Modification d\'une formation',
 *     entityType: 'Formation'
 * };
 */

export const activityLogger = (activityData) => {
    return (req, res) => {
        // Only log on successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            logActivity(
                req.user?._id,
                activityData.type,
                activityData.description,
                activityData.entityType || null,
                activityData.entityId || null,
                activityData.entityName || null,
                activityData.details || null,
                ipAddress,
                userAgent
            ).catch((err) => console.error('Activity logging error:', err));
        }
    };
};

/**
 * Helper function to attach activity logging to response finish event
 */
export const attachActivityLogger = (req, res, activityData) => {
    res.on('finish', activityLogger(activityData)(req, res));
};

/**
 * Attach activity details to res.locals for later logging
 */
export const setActivityLog = (req, res, activityData) => {
    if (!res.locals.activities) {
        res.locals.activities = [];
    }
    res.locals.activities.push({
        ...activityData,
        timestamp: new Date(),
    });
};

/**
 * Middleware to flush activity logs on response finish
 */
export const flushActivityLogs = (req, res, next) => {
    res.on('finish', async () => {
        if (res.locals.activities && res.locals.activities.length > 0 && res.statusCode >= 200 && res.statusCode < 300) {
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';

            for (const activity of res.locals.activities) {
                await logActivity(
                    req.user?._id,
                    activity.type,
                    activity.description,
                    activity.entityType || null,
                    activity.entityId || null,
                    activity.entityName || null,
                    activity.details || null,
                    ipAddress,
                    userAgent
                ).catch((err) => console.error('Activity logging error:', err));
            }
        }
    });
    next();
};

/**
 * Log user login
 */
export const logLoginActivity = async (userId, ipAddress, userAgent) => {
    return logActivity(
        userId,
        'login',
        'Connexion à l\'application',
        null,
        null,
        null,
        null,
        ipAddress,
        userAgent
    );
};

/**
 * Log user logout
 */
export const logLogoutActivity = async (userId, ipAddress, userAgent) => {
    return logActivity(
        userId,
        'logout',
        'Déconnexion de l\'application',
        null,
        null,
        null,
        null,
        ipAddress,
        userAgent
    );
};

export default activityLogger;
