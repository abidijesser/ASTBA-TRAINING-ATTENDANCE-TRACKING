import User from '../models/User.js';

/**
 * @route   GET /api/users
 * @desc    Get all users (with optional role filter)
 * @access  Responsable+
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const query = {};

        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ nom: 1, prenom: 1 });

        res.status(200).json({
            success: true,
            data: { users },
        });
    } catch (error) {
        next(error);
    }
};
