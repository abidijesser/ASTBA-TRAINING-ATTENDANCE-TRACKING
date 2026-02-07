import Formation from '../models/Formation.js';
import Niveau from '../models/Niveau.js';
import Seance from '../models/Seance.js';
import EleveFormation from '../models/EleveFormation.js';

/**
 * Formation Controller
 * Handles all formation-related operations
 */

/**
 * @route   GET /api/formations
 * @desc    Get all formations
 * @access  Formateur+
 */
export const getAllFormations = async (req, res, next) => {
    try {
        const { actif, responsable_id } = req.query;

        const query = {};
        if (actif !== undefined) query.actif = actif === 'true';

        // If user is a formateur, they can only see formations assigned to them
        if (req.user.role === 'formateur') {
            query.responsable_id = req.user._id;
        } else if (responsable_id) {
            // Admin/Responsable can filter by responsable_id
            query.responsable_id = responsable_id;
        }

        const formations = await Formation.find(query)
            .populate('responsable_id', 'nom prenom email')
            .sort({ nom: 1 });

        res.status(200).json({
            success: true,
            data: { formations },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/formations/:id
 * @desc    Get formation by ID with levels
 * @access  Formateur+
 */
export const getFormationById = async (req, res, next) => {
    try {
        const formation = await Formation.findById(req.params.id)
            .populate('responsable_id', 'nom prenom email');

        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        // Get all levels for this formation
        const niveaux = await Niveau.find({ formation_id: formation._id })
            .populate('seances')
            .sort({ numero: 1 });

        res.status(200).json({
            success: true,
            data: {
                formation: {
                    ...formation.toObject(),
                    niveaux,
                }
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/formations
 * @desc    Create new formation
 * @access  Responsable+
 */
export const createFormation = async (req, res, next) => {
    try {
        const { nom, description, responsable_id, nombre_niveaux, duree_estimee, date_debut, medias } = req.body;

        // Check if formation with same name exists
        const existingFormation = await Formation.findOne({ nom });
        if (existingFormation) {
            return res.status(400).json({
                success: false,
                message: 'Une formation avec ce nom existe déjà',
            });
        }

        const formation = await Formation.create({
            nom,
            description,
            responsable_id: responsable_id || req.user._id,
            nombre_niveaux: 4, // Enforced
            duree_estimee,
            // Persist provided start date if any
            date_debut: date_debut ? new Date(date_debut) : undefined,
            medias: Array.isArray(medias) ? medias : [],
        });

        // Automatically create 4 levels
        const levels = [];
        for (let i = 1; i <= 4; i++) {
            levels.push({
                nom: `Niveau ${i}`,
                numero: i,
                formation_id: formation._id,
                ordre: i,
            });
        }

        const createdLevels = await Niveau.insertMany(levels);

        // Automatically create 6 sessions per level (Total 24)
        const sessions = [];
        for (const level of createdLevels) {
            for (let j = 1; j <= 6; j++) {
                sessions.push({
                    nom: `Séance ${j}`,
                    numero: j,
                    niveau_id: level._id,
                    date: new Date(), // Placeholder date
                    heure_debut: '09:00', // Placeholder time
                    heure_fin: '12:00', // Placeholder time
                    formateur_id: formation.responsable_id,
                    type: 'Presentiel'
                });
            }
        }

        await Seance.insertMany(sessions);

        res.status(201).json({
            success: true,
            message: 'Formation créée avec succès',
            data: { formation },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/formations/:id
 * @desc    Update formation
 * @access  Responsable+
 */
export const updateFormation = async (req, res, next) => {
    try {
        const { nom, description, duree_estimee, actif, date_debut, medias } = req.body;

        const formation = await Formation.findById(req.params.id);

        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        // Check name uniqueness if changed
        if (nom && nom !== formation.nom) {
            const existingFormation = await Formation.findOne({ nom });
            if (existingFormation) {
                return res.status(400).json({
                    success: false,
                    message: 'Une formation avec ce nom existe déjà',
                });
            }
        }

        if (nom) formation.nom = nom;
        if (description) formation.description = description;
        if (duree_estimee) formation.duree_estimee = duree_estimee;
        if (date_debut) formation.date_debut = new Date(date_debut);
        if (actif !== undefined) formation.actif = actif;
        if (Array.isArray(medias)) formation.medias = medias;

        await formation.save();

        res.status(200).json({
            success: true,
            message: 'Formation mise à jour avec succès',
            data: { formation },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/formations/:id
 * @desc    Delete formation
 * @access  Admin
 */
export const deleteFormation = async (req, res, next) => {
    try {
        const formation = await Formation.findById(req.params.id);

        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        await Formation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Formation supprimée avec succès',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/formations/:id/students
 * @desc    Get students enrolled in formation
 * @access  Formateur+
 */
export const getFormationStudents = async (req, res, next) => {
    try {
        const { statut } = req.query;

        const query = { formation_id: req.params.id };
        if (statut) query.statut = statut;

        const enrollments = await EleveFormation.find(query)
            .populate('eleve_id', 'nom prenom email photo')
            .sort('-date_inscription');

        res.status(200).json({
            success: true,
            data: { students: enrollments },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/formations/:id/assign-student
 * @desc    Assign student to formation
 * @access  Responsable+
 */
export const assignStudentToFormation = async (req, res, next) => {
    try {
        const { eleve_id } = req.body;

        // Check if already enrolled
        const existingEnrollment = await EleveFormation.findOne({
            eleve_id,
            formation_id: req.params.id,
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Élève déjà inscrit à cette formation',
            });
        }

        const enrollment = await EleveFormation.create({
            eleve_id,
            formation_id: req.params.id,
            niveau_actuel: 1,
            statut: 'en_cours',
        });

        res.status(201).json({
            success: true,
            message: 'Élève assigné à la formation avec succès',
            data: { enrollment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/formations/:id/remove-student/:eleveId
 * @desc    Remove student from formation
 * @access  Responsable+
 */
export const removeStudentFromFormation = async (req, res, next) => {
    try {
        const enrollment = await EleveFormation.findOneAndDelete({
            eleve_id: req.params.eleveId,
            formation_id: req.params.id,
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Inscription non trouvée',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Élève retiré de la formation avec succès',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/formations/:id/statistics
 * @desc    Get formation statistics
 * @access  Responsable+
 */
export const getFormationStatistics = async (req, res, next) => {
    try {
        const formation = await Formation.findById(req.params.id);

        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        const totalEnrolled = await EleveFormation.countDocuments({
            formation_id: req.params.id,
        });

        const completed = await EleveFormation.countDocuments({
            formation_id: req.params.id,
            statut: 'complete',
        });

        const inProgress = await EleveFormation.countDocuments({
            formation_id: req.params.id,
            statut: 'en_cours',
        });

        const abandoned = await EleveFormation.countDocuments({
            formation_id: req.params.id,
            statut: 'abandonne',
        });

        res.status(200).json({
            success: true,
            data: {
                formation: formation.nom,
                statistics: {
                    total_enrolled: totalEnrolled,
                    completed,
                    in_progress: inProgress,
                    abandoned,
                    completion_rate: totalEnrolled > 0 ? ((completed / totalEnrolled) * 100).toFixed(2) : 0,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
