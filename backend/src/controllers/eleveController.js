import Eleve from '../models/Eleve.js';
import Formation from '../models/Formation.js';
import EleveFormation from '../models/EleveFormation.js';
import Presence from '../models/Presence.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { logActivity } from './activityController.js';

/**
 * Student Controller
 * Handles all student-related operations
 */

/**
 * @route   GET /api/eleves
 * @desc    Get all students with optional filters
 * @access  Formateur+
 */
export const getAllEleves = async (req, res, next) => {
    try {
        const {
            search,
            formation,
            actif,
            page = 1,
            limit = 20,
        } = req.query;

        // Build query
        const query = {};

        // Search by name
        if (search) {
            query.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { prenom: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by active status
        if (actif !== undefined) {
            query.actif = actif === 'true';
        }

        // Restriction for Formateurs: Only see students enrolled in their formations
        if (req.user.role === 'formateur') {
            const formationsManaged = await Formation.find({ responsable_id: req.user._id }).select('_id');
            const formationIds = formationsManaged.map(f => f._id);

            const enrolledStudents = await EleveFormation.find({
                formation_id: { $in: formationIds }
            }).select('eleve_id');

            const studentIds = enrolledStudents.map(e => e.eleve_id);
            query._id = { $in: studentIds };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let eleves = await Eleve.find(query)
            .select('-__v')
            .sort({ nom: 1, prenom: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Filter by formation if specified
        if (formation) {
            const eleveFormations = await EleveFormation.find({
                formation_id: formation,
                statut: 'en_cours'
            }).select('eleve_id');

            const eleveIds = eleveFormations.map(ef => ef.eleve_id.toString());
            eleves = eleves.filter(eleve => eleveIds.includes(eleve._id.toString()));
        }

        const total = await Eleve.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                eleves,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/eleves/:id
 * @desc    Get student by ID
 * @access  Formateur+
 */
export const getEleveById = async (req, res, next) => {
    try {
        const eleve = await Eleve.findById(req.params.id);

        if (!eleve) {
            return res.status(404).json({
                success: false,
                message: 'Élève non trouvé',
            });
        }

        res.status(200).json({
            success: true,
            data: { eleve },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/eleves
 * @desc    Create new student
 * @access  Responsable+
 */
export const createEleve = async (req, res, next) => {
    try {
        const { nom, prenom, date_naissance, email, telephone, adresse } = req.body;

        // Check if student already exists
        const existingEleve = await Eleve.findOne({ email });
        if (existingEleve) {
            return res.status(400).json({
                success: false,
                message: 'Un élève avec cet email existe déjà',
            });
        }

        const eleve = await Eleve.create({
            nom,
            prenom,
            date_naissance,
            email,
            telephone,
            adresse,
        });

        res.status(201).json({
            success: true,
            message: 'Élève créé avec succès',
            data: { eleve },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'create',
            `Création d'un nouvel élève: ${nom} ${prenom}`,
            'Eleve',
            eleve._id,
            `${nom} ${prenom}`,
            { email, telephone },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/eleves/:id
 * @desc    Update student
 * @access  Responsable+
 */
export const updateEleve = async (req, res, next) => {
    try {
        const { nom, prenom, date_naissance, email, telephone, adresse, actif } = req.body;

        const eleve = await Eleve.findById(req.params.id);

        if (!eleve) {
            return res.status(404).json({
                success: false,
                message: 'Élève non trouvé',
            });
        }

        // Check email uniqueness if changed
        if (email && email !== eleve.email) {
            const existingEleve = await Eleve.findOne({ email });
            if (existingEleve) {
                return res.status(400).json({
                    success: false,
                    message: 'Un élève avec cet email existe déjà',
                });
            }
        }

        // Update fields
        if (nom) eleve.nom = nom;
        if (prenom) eleve.prenom = prenom;
        if (date_naissance) eleve.date_naissance = date_naissance;
        if (email) eleve.email = email;
        if (telephone) eleve.telephone = telephone;
        if (adresse) eleve.adresse = adresse;
        if (actif !== undefined) eleve.actif = actif;

        await eleve.save();

        res.status(200).json({
            success: true,
            message: 'Élève mis à jour avec succès',
            data: { eleve },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'update',
            `Modification de l'élève: ${eleve.nom} ${eleve.prenom}`,
            'Eleve',
            eleve._id,
            `${eleve.nom} ${eleve.prenom}`,
            { nom, prenom, email, telephone },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/eleves/:id
 * @desc    Delete student
 * @access  Admin
 */
export const deleteEleve = async (req, res, next) => {
    try {
        const eleve = await Eleve.findById(req.params.id);

        if (!eleve) {
            return res.status(404).json({
                success: false,
                message: 'Élève non trouvé',
            });
        }

        const eleveName = `${eleve.nom} ${eleve.prenom}`;

        // Delete photo from Cloudinary if exists
        if (eleve.photo) {
            const publicId = eleve.photo.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }

        await Eleve.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Élève supprimé avec succès',
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'delete',
            `Suppression de l'élève: ${eleveName}`,
            'Eleve',
            req.params.id,
            eleveName,
            null,
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/eleves/:id/formations
 * @desc    Get student's formations
 * @access  Formateur+
 */
export const getEleveFormations = async (req, res, next) => {
    try {
        const formations = await EleveFormation.find({ eleve_id: req.params.id })
            .populate('formation_id', 'nom description nombre_niveaux')
            .sort('-date_inscription');

        res.status(200).json({
            success: true,
            data: { formations },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/eleves/:id/progress
 * @desc    Get student progress across all formations
 * @access  Formateur+
 */
export const getEleveProgress = async (req, res, next) => {
    try {
        const eleveFormations = await EleveFormation.find({
            eleve_id: req.params.id
        }).populate('formation_id', 'nom nombre_niveaux');

        const progress = [];

        for (const ef of eleveFormations) {
            progress.push({
                formation: ef.formation_id,
                niveau_actuel: ef.niveau_actuel,
                progression_pourcentage: ef.progression_pourcentage,
                statut: ef.statut,
                date_inscription: ef.date_inscription,
            });
        }

        res.status(200).json({
            success: true,
            data: { progress },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/eleves/:id/attendance-history
 * @desc    Get student attendance history
 * @access  Formateur+
 */
export const getEleveAttendanceHistory = async (req, res, next) => {
    try {
        const presences = await Presence.find({ eleve_id: req.params.id })
            .populate({
                path: 'seance_id',
                select: 'nom date niveau_id',
                populate: {
                    path: 'niveau_id',
                    select: 'nom numero formation_id',
                    populate: {
                        path: 'formation_id',
                        select: 'nom',
                    },
                },
            })
            .sort('-createdAt')
            .limit(100);

        res.status(200).json({
            success: true,
            data: { presences },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/eleves/:id/upload-photo
 * @desc    Upload student photo
 * @access  Responsable+
 */
export const uploadElevePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucune photo fournie',
            });
        }

        const eleve = await Eleve.findById(req.params.id);

        if (!eleve) {
            return res.status(404).json({
                success: false,
                message: 'Élève non trouvé',
            });
        }

        // Delete old photo if exists
        if (eleve.photo) {
            const publicId = eleve.photo.split('/').pop().split('.')[0];
            await deleteFromCloudinary(publicId);
        }

        // Upload new photo
        const result = await uploadToCloudinary(req.file.buffer, 'eleves');

        eleve.photo = result.secure_url;
        await eleve.save();

        res.status(200).json({
            success: true,
            message: 'Photo uploadée avec succès',
            data: { photo_url: eleve.photo },
        });
    } catch (error) {
        next(error);
    }
};
