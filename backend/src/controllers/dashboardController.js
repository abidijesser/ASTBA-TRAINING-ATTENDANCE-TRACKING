import Eleve from '../models/Eleve.js';
import Formation from '../models/Formation.js';
import Seance from '../models/Seance.js';
import Certification from '../models/Certification.js';

/**
 * Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        // Get today's range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch counts in parallel for better performance
        const [
            studentCount,
            activeFormationCount,
            sessionsTodayCount,
            certificationCount
        ] = await Promise.all([
            Eleve.countDocuments(),
            Formation.countDocuments({ actif: true }),
            Seance.countDocuments({
                date: { $gte: startOfDay, $lte: endOfDay }
            }),
            Certification.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                students: studentCount,
                activeFormations: activeFormationCount,
                sessionsToday: sessionsTodayCount,
                certifications: certificationCount
            }
        });
    } catch (error) {
        next(error);
    }
};
