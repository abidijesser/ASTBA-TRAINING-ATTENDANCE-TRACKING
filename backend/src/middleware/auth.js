import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes - verifies JWT token from cookie
 * Extracts token from httpOnly cookie, verifies it, and attaches user to request
 */
export const protect = async (req, res, next) => {
    let token;

    // Get token from cookie
    token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided. Please login.',
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token (exclude password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!req.user.actif) {
            return res.status(401).json({
                success: false,
                message: 'User account is inactive',
            });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.',
        });
    }
    next();
};

/**
 * Middleware to check if user is a responsable or admin
 */
export const isResponsable = (req, res, next) => {
    if (!['responsable', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Responsable privileges required.',
        });
    }
    next();
};

/**
 * Middleware to check if user is a formateur, responsable, or admin
 */
export const isFormateur = (req, res, next) => {
    if (!['formateur', 'responsable', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Formateur privileges required.',
        });
    }
    next();
};

/**
 * Middleware to check if user has access to specific formation
 * For formateurs: check if formation is in their assignments
 * For responsables/admins: always allow
 */
export const canAccessFormation = async (req, res, next) => {
    try {
        // Admins and responsables have access to all formations
        if (['responsable', 'admin'].includes(req.user.role)) {
            return next();
        }

        // For formateurs, check if formation is assigned
        const formationId = req.params.formationId || req.params.id;

        if (!formationId) {
            return res.status(400).json({
                success: false,
                message: 'Formation ID is required',
            });
        }

        const hasAccess = req.user.formations_assignees.some(
            (id) => id.toString() === formationId.toString()
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Formation not assigned to you.',
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking formation access',
            error: error.message,
        });
    }
};

/**
 * Grant access to specific roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
