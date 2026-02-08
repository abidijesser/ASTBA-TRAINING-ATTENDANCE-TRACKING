// Server entry point
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env (one level up from src/)
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

// Debug: Check if .env was loaded successfully
console.log('dotenv result:', result.error ? `ERROR: ${result.error.message}` : 'SUCCESS');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Looking for .env at:', envPath);
console.log('Environment variables loaded:', {
    MONGODB_URI: process.env.MONGODB_URI ? '✓' : '✗',
    JWT_SECRET: process.env.JWT_SECRET ? '✓' : '✗',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'NOT FOUND',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'NOT FOUND',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✓' : '✗',
});

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import { configureCloudinary } from './config/cloudinary.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import elevesRoutes from './routes/eleves.js';
import formationsRoutes from './routes/formations.js';
import niveauxRoutes from './routes/niveaux.js';
import seancesRoutes from './routes/seances.js';
import presencesRoutes from './routes/presences.js';
import certificationsRoutes from './routes/certifications.js';
import usersRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import activitiesRoutes from './routes/activities.js';
import chatRoutes from './routes/chat.js';

// Configure Cloudinary AFTER environment variables are loaded
configureCloudinary();

// Initialize express app
const app = express();

// Connect to database
connectDB();

/**
 * Middleware Configuration
 */

// CORS - Allow cross-origin requests with credentials
app.use(
    cors({
        // In dev, allow localhost on any port to avoid CORS issues when Vite port changes.
        // In prod, lock this down via CLIENT_URL.
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            const explicitAllowed = [
                process.env.CLIENT_URL,
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'http://localhost:3000',
            ].filter(Boolean);

            if (explicitAllowed.includes(origin)) return callback(null, true);

            const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
            if (process.env.NODE_ENV !== 'production' && isLocalhost) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true, // Allow cookies to be sent from frontend
    })
);

// Cookie parser - Parse cookies from request
app.use(cookieParser());

// Body parser - Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/**
 * Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/eleves', elevesRoutes);
app.use('/api/formations', formationsRoutes);
app.use('/api/niveaux', niveauxRoutes);
app.use('/api/seances', seancesRoutes);
app.use('/api/presences', presencesRoutes);
app.use('/api/certifications', certificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/chat', chatRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handler middleware (must be last)
app.use(errorHandler);

/**
 * Start Server
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
