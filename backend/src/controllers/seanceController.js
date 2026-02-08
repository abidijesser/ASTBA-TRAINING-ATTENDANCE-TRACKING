import Seance from '../models/Seance.js';
import Presence from '../models/Presence.js';
import EleveFormation from '../models/EleveFormation.js';
import { logActivity } from './activityController.js';

const ESCAPE_REGEX_REPLACEMENT = String.raw`\\$&`;
const escapeRegex = (value) => String(value).replaceAll(/[.*+?^${}()|[\]\\]/g, ESCAPE_REGEX_REPLACEMENT);

const buildSeancesQuery = ({ user, search }) => {
    const query = {};

    if (user?.role === 'formateur') {
        query.formateur_id = user._id;
    }

    const searchRaw = String(search || '').trim();
    if (!searchRaw) return query;

    const regex = new RegExp(escapeRegex(searchRaw), 'i');
    const numeric = Number(searchRaw);
    const or = [
        { nom: regex },
        { type: regex },
        { lieu: regex },
        { statut: regex },
    ];
    if (Number.isFinite(numeric)) {
        or.push({ numero: numeric });
    }
    query.$or = or;
    return query;
};

/**
 * Seance Controller
 * Handles all seance-related operations
 */

/**
 * @route   GET /api/niveaux/:niveauId/seances
 * @desc    Get all sessions for a level
 * @access  Formateur+
 */
export const getSeancesByNiveau = async (req, res, next) => {
    try {
        const seances = await Seance.find({ niveau_id: req.params.niveauId })
            .populate('formateur_id', 'nom prenom')
            .sort({ numero: 1 });

        res.status(200).json({
            success: true,
            data: { seances },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/seances/:id
 * @desc    Get session by ID
 * @access  Formateur+
 */
export const getSeanceById = async (req, res, next) => {
    try {
        const seance = await Seance.findById(req.params.id)
            .populate({
                path: 'niveau_id',
                select: 'nom numero formation_id',
                populate: {
                    path: 'formation_id',
                    select: 'nom'
                }
            })
            .populate('formateur_id', 'nom prenom');

        if (!seance) {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée',
            });
        }

        res.status(200).json({
            success: true,
            data: { seance },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/niveaux/:niveauId/seances
 * @desc    Create session
 * @access  Responsable+
 */
export const createSeance = async (req, res, next) => {
    try {
        const {
            nom,
            numero,
            date,
            heure_debut,
            heure_fin,
            type,
            lieu,
            formateur_id,
            contenu,
        } = req.body;

        const Niveau = (await import('../models/Niveau.js')).default;
        const Formation = (await import('../models/Formation.js')).default;

        const niveau = await Niveau.findById(req.params.niveauId);
        if (!niveau) {
            return res.status(404).json({
                success: false,
                message: 'Niveau non trouvé',
            });
        }

        const formation = await Formation.findById(niveau.formation_id);
        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        if (req.user.role === 'formateur') {
            const isAssigned = formation.responsable_id.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé. Vous n'êtes pas assigné à cette formation.",
                });
            }
        }

        // Optional: restriction to active level only
        if (formation.niveau_actuel !== niveau.numero) {
            return res.status(400).json({
                success: false,
                message: `Vous ne pouvez créer des séances que pour le niveau actuel (${formation.niveau_actuel})`,
            });
        }

        let sessionNumero = numero;
        if (!sessionNumero) {
            // Auto-generate number based on existing sessions
            const count = await Seance.countDocuments({ niveau_id: req.params.niveauId });
            sessionNumero = count + 1;
        }

        const seance = await Seance.create({
            nom: nom || `Séance ${sessionNumero}`,
            numero: sessionNumero,
            niveau_id: req.params.niveauId,
            date,
            heure_debut,
            heure_fin,
            type,
            lieu,
            formateur_id: formateur_id || req.user._id,
            contenu,
        });

        res.status(201).json({
            success: true,
            message: 'Séance créée avec succès',
            data: { seance },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'create',
            `Création d'une nouvelle séance: ${seance.nom}`,
            'Seance',
            seance._id,
            seance.nom,
            { date, heure_debut, heure_fin, type },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/seances/:id
 * @desc    Update session
 * @access  Responsable+
 */
export const updateSeance = async (req, res, next) => {
    try {
        const {
            nom,
            date,
            heure_debut,
            heure_fin,
            lieu,
            formateur_id,
            contenu,
            statut,
        } = req.body;

        const seance = await Seance.findById(req.params.id);

        if (!seance) {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée',
            });
        }

        if (nom) seance.nom = nom;
        if (date) seance.date = date;
        if (heure_debut) seance.heure_debut = heure_debut;
        if (heure_fin) seance.heure_fin = heure_fin;
        if (lieu) seance.lieu = lieu;
        if (formateur_id) seance.formateur_id = formateur_id;
        if (contenu) seance.contenu = contenu;
        if (statut) seance.statut = statut;

        await seance.save();

        res.status(200).json({
            success: true,
            message: 'Séance mise à jour avec succès',
            data: { seance },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'update',
            `Modification de la séance: ${seance.nom}`,
            'Seance',
            seance._id,
            seance.nom,
            { nom, date, heure_debut, heure_fin, statut },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/seances/:id
 * @desc    Delete session
 * @access  Admin
 */
export const deleteSeance = async (req, res, next) => {
    try {
        const seance = await Seance.findById(req.params.id);

        if (!seance) {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée',
            });
        }

        const seanceName = seance.nom;

        await Seance.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Séance supprimée avec succès',
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'delete',
            `Suppression de la séance: ${seanceName}`,
            'Seance',
            req.params.id,
            seanceName,
            null,
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/seances/:id/attendance
 * @desc    Get attendance for a session
 * @access  Formateur+
 */
export const getSeanceAttendance = async (req, res, next) => {
    try {
        // 1. Get the session to find its level/formation
        const seance = await Seance.findById(req.params.id)
            .populate({
                path: 'niveau_id',
                populate: { path: 'formation_id' }
            });

        if (!seance) {
            return res.status(404).json({ success: false, message: 'Séance non trouvée' });
        }

        const formation = seance.niveau_id.formation_id;

        // Access check for Formateurs
        if (req.user.role === 'formateur') {
            const isAssigned = formation.responsable_id.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé. Vous n'êtes pas assigné à cette formation.",
                });
            }
        }

        // 2. Get all students enrolled in the formation of this session
        // Only active enrollments
        const studentsEnrollment = await EleveFormation.find({
            formation_id: seance.niveau_id.formation_id,
            statut: 'en_cours'
        }).populate('eleve_id', 'nom prenom photo');

        // 3. Get existing presence records for this session
        const existingPresences = await Presence.find({ seance_id: req.params.id });

        // 4. Merge data
        const attendanceList = studentsEnrollment.map(enrollment => {
            if (!enrollment.eleve_id) return null; // Safety check

            const presence = existingPresences.find(p => p.eleve_id.toString() === enrollment.eleve_id._id.toString());

            return {
                _id: enrollment.eleve_id._id,
                nom: enrollment.eleve_id.nom,
                prenom: enrollment.eleve_id.prenom,
                photo: enrollment.eleve_id.photo,
                // If presence exists use its status, otherwise default to 'present' (or specific default)
                // Returning null or 'Non marqué' might be better, but frontend defaults to 'Absent' in initialization map if simpler
                statut: presence ? presence.statut : null
            };
        }).filter(Boolean); // Remove nulls

        res.status(200).json({
            success: true,
            data: attendanceList,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/seances
 * @desc    Get all sessions
 * @access  Formateur+
 */
export const getAllSeances = async (req, res, next) => {
    try {
        const query = buildSeancesQuery({ user: req.user, search: req.query?.search });

        const seances = await Seance.find(query)
            .populate({
                path: 'niveau_id',
                select: 'nom numero formation_id',
                populate: {
                    path: 'formation_id',
                    select: 'nom niveau_actuel'
                }
            })
            .populate('formateur_id', 'nom prenom')
            .sort({ date: 1, heure_debut: 1 });

        res.status(200).json({
            success: true,
            data: { seances },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/seances/:id/finish
 * @desc    Mark session as finished and handle progression
 * @access  Formateur+ (assigned to session)
 */
export const finishSeance = async (req, res, next) => {
    try {
        const seance = await Seance.findById(req.params.id).populate('niveau_id');
        if (!seance) {
            return res.status(404).json({ success: false, message: 'Séance non trouvée' });
        }

        const Formation = (await import('../models/Formation.js')).default;
        const formation = await Formation.findById(seance.niveau_id.formation_id);

        // Access Check
        if (req.user.role === 'formateur') {
            const isAssigned = formation.responsable_id.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({ success: false, message: "Accès refusé. Vous n'êtes pas assigné à cette formation." });
            }
        }

        // 1. Verify all students have been marked
        const EleveFormation = (await import('../models/EleveFormation.js')).default;
        const Presence = (await import('../models/Presence.js')).default;

        const enrolledStudents = await EleveFormation.find({
            formation_id: formation._id,
            statut: 'en_cours'
        });

        const studentIds = enrolledStudents.map(s => s.eleve_id.toString());
        const presences = await Presence.find({
            seance_id: seance._id,
            eleve_id: { $in: studentIds }
        });

        if (presences.length < studentIds.length) {
            return res.status(400).json({
                success: false,
                message: 'Vous devez marquer la présence de tous les élèves inscrits avant de terminer la séance.'
            });
        }

        // 2. Mark as Terminee
        seance.statut = 'terminee';
        await seance.save();

        // 3. Level Progression Check
        const totalSessionsInLevel = await Seance.countDocuments({ niveau_id: seance.niveau_id._id });
        const finishedSessionsInLevel = await Seance.countDocuments({
            niveau_id: seance.niveau_id._id,
            statut: 'terminee'
        });

        let levelCompleted = false;
        let formationCompleted = false;

        // Requirement: All sessions must be finished AND there must be at least 6 sessions
        if (finishedSessionsInLevel >= totalSessionsInLevel && finishedSessionsInLevel >= 6) {
            levelCompleted = true;

            // Increment niveau_actuel
            if (formation.niveau_actuel === seance.niveau_id.numero) {
                formation.niveau_actuel += 1;

                if (formation.niveau_actuel > 4) {
                    formation.actif = false;
                    formationCompleted = true;

                    // Trigger certification for all students
                    const { checkAndValidateCertification } = await import('../utils/certificationHelper.js');
                    for (const studentId of studentIds) {
                        await checkAndValidateCertification(studentId, formation._id);
                    }
                }

                await formation.save();
            }
        }

        res.status(200).json({
            success: true,
            message: levelCompleted
                ? (formationCompleted ? 'Formation complétée avec succès !' : `Niveau ${seance.niveau_id.numero} terminé ! Niveau suivant débloqué.`)
                : 'Séance terminée avec succès',
            data: {
                levelCompleted,
                formationCompleted,
                nextLevel: formation.niveau_actuel
            }
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        logActivity(
            req.user._id,
            'update',
            `Séance terminée: ${seance.nom}`,
            'Seance',
            seance._id,
            seance.nom,
            { levelCompleted, formationCompleted },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};
