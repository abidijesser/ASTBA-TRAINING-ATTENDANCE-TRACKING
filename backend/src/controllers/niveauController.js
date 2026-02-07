import Niveau from '../models/Niveau.js';
import Seance from '../models/Seance.js';
import { logActivity } from './activityController.js';

/**
 * Niveau Controller
 * Handles all niveau-related operations
 */

/**
 * @route   GET /api/formations/:formationId/niveaux
 * @desc    Get all levels for a formation
 * @access  Formateur+
 */
export const getNiveauxByFormation = async (req, res, next) => {
    try {
        const niveaux = await Niveau.find({ formation_id: req.params.formationId })
            .sort({ numero: 1 });

        res.status(200).json({
            success: true,
            data: { niveaux },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/niveaux/:id
 * @desc    Get niveau by ID with sessions
 * @access  Formateur+
 */
export const getNiveauById = async (req, res, next) => {
    try {
        const niveau = await Niveau.findById(req.params.id)
            .populate('formation_id', 'nom');

        if (!niveau) {
            return res.status(404).json({
                success: false,
                message: 'Niveau non trouvé',
            });
        }

        // Get all seances for this niveau
        const seances = await Seance.find({ niveau_id: niveau._id })
            .populate('formateur_id', 'nom prenom')
            .sort({ numero: 1 });

        res.status(200).json({
            success: true,
            data: {
                niveau: {
                    ...niveau.toObject(),
                    seances,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/formations/:form ationId/niveaux
 * @desc    Create niveau
 * @access  Responsable+
 */
export const createNiveau = async (req, res, next) => {
    try {
        const { nom, numero, description, objectifs, nombre_seances } = req.body;

        const niveau = await Niveau.create({
            nom,
            numero,
            formation_id: req.params.formationId,
            description,
            objectifs,
            nombre_seances,
            ordre: numero,
        });

        res.status(201).json({
            success: true,
            message: 'Niveau créé avec succès',
            data: { niveau },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'create',
            `Création d'un nouveau niveau: ${niveau.nom}`,
            'Niveau',
            niveau._id,
            niveau.nom,
            { numero: niveau.numero },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/niveaux/:id
 * @desc    Update niveau
 * @access  Responsable+
 */
export const updateNiveau = async (req, res, next) => {
    try {
        const { nom, description, objectifs, nombre_seances } = req.body;

        const niveau = await Niveau.findById(req.params.id);

        if (!niveau) {
            return res.status(404).json({
                success: false,
                message: 'Niveau non trouvé',
            });
        }

        if (nom) niveau.nom = nom;
        if (description) niveau.description = description;
        if (objectifs) niveau.objectifs = objectifs;
        if (nombre_seances) niveau.nombre_seances = nombre_seances;

        await niveau.save();

        res.status(200).json({
            success: true,
            message: 'Niveau mis à jour avec succès',
            data: { niveau },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'update',
            `Modification du niveau: ${niveau.nom}`,
            'Niveau',
            niveau._id,
            niveau.nom,
            { nom, description },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/niveaux/:id
 * @desc    Delete niveau
 * @access  Admin
 */
export const deleteNiveau = async (req, res, next) => {
    try {
        const niveau = await Niveau.findById(req.params.id);

        if (!niveau) {
            return res.status(404).json({
                success: false,
                message: 'Niveau non trouvé',
            });
        }

        const niveauName = niveau.nom;

        await Niveau.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Niveau supprimé avec succès',
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'delete',
            `Suppression du niveau: ${niveauName}`,
            'Niveau',
            req.params.id,
            niveauName,
            null,
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};
