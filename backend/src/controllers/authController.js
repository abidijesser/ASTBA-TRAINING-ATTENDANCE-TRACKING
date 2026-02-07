import User from '../models/User.js';
import { logLoginActivity, logLogoutActivity } from '../middleware/activityLogger.js';

/**
 * Authentication Controllers
 * Handle user registration, login, and profile retrieval
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin only for role assignment)
 * @access  Public
 */
export const register = async (req, res, next) => {
    try {
        const { nom, prenom, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        // Create new user (password will be hashed by pre-save middleware)
        const user = await User.create({
            nom,
            prenom,
            email,
            password,
            role: role || 'formateur', // Default to formateur if not specified
        });

        // Generate JWT token
        const token = user.generateAuthToken();

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true, // Cannot be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return token
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate JWT token
        const token = user.generateAuthToken();

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true, // Cannot be accessed by JavaScript
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            },
        });

        // Log login activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logLoginActivity(user._id, ipAddress, userAgent).catch((err) =>
            console.error('Failed to log login activity:', err)
        );
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Public
 */
export const logout = async (req, res, next) => {
    try {
        // Log logout activity (non-blocking, happens before cookie clearing)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        if (req.user?._id) {
            logLogoutActivity(req.user._id, ipAddress, userAgent).catch((err) =>
                console.error('Failed to log logout activity:', err)
            );
        }

        // Clear the token cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0), // Expire immediately
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
export const getMe = async (req, res, next) => {
    try {
        // User is already attached to req by auth middleware
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    formations_assignees: user.formations_assignees,
                    createdAt: user.createdAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
