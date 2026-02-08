import Presence from '../models/Presence.js';
import Seance from '../models/Seance.js';
import Niveau from '../models/Niveau.js';
import { checkAndValidateCertification } from '../utils/certificationHelper.js';

/**
 * Presence Controller
 * Handles all attendance-related operations
 */

/**
 * @route   POST /api/seances/:seanceId/mark-attendance
 * @desc    Mark attendance for multiple students (bulk operation)
 * @access  Formateur+
 */
export const markBulkAttendance = async (req, res, next) => {
    try {
        const { attendances } = req.body; // Array of { eleve_id, statut, remarques? }
        const seanceId = req.params.seanceId;

        // Verify session exists and populate formation for access check
        const seance = await Seance.findById(seanceId).populate({
            path: 'niveau_id',
            populate: { path: 'formation_id' }
        });

        if (!seance) {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée',
            });
        }

        const formation = seance.niveau_id.formation_id;

        // Access Check
        if (req.user.role === 'formateur') {
            const isAssigned = formation.responsable_id.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé. Vous n'êtes pas assigné à cette formation.",
                });
            }
        }

        const results = [];
        const errors = [];

        for (const attendance of attendances) {
            try {
                // Check if attendance already exists
                let presence = await Presence.findOne({
                    eleve_id: attendance.eleve_id,
                    seance_id: seanceId,
                });

                if (presence) {
                    // Update existing
                    presence.statut = attendance.statut;
                    presence.remarques = attendance.remarques || '';
                    presence.marque_par = req.user._id;
                    presence.date_marquage = new Date();
                    await presence.save();
                } else {
                    // Create new
                    presence = await Presence.create({
                        eleve_id: attendance.eleve_id,
                        seance_id: seanceId,
                        statut: attendance.statut,
                        remarques: attendance.remarques || '',
                        marque_par: req.user._id,
                    });
                }

                results.push(presence);

                // Check for certification after marking attendance
                await checkAndValidateCertification(
                    attendance.eleve_id,
                    seance.niveau_id.formation_id
                );
            } catch (err) {
                errors.push({
                    eleve_id: attendance.eleve_id,
                    error: err.message,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Présences marquées: ${results.length} réussies, ${errors.length} erreurs`,
            data: {
                marked: results,
                errors,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/presences/:id
 * @desc    Update single attendance record
 * @access  Formateur+
 */
export const updatePresence = async (req, res, next) => {
    try {
        const { statut, remarques } = req.body;

        const presence = await Presence.findById(req.params.id);

        if (!presence) {
            return res.status(404).json({
                success: false,
                message: 'Présence non trouvée',
            });
        }

        // Access check: formateurs can only update attendance for their assigned formations
        if (req.user.role === 'formateur') {
            await presence.populate({
                path: 'seance_id',
                populate: {
                    path: 'niveau_id',
                    populate: {
                        path: 'formation_id',
                        select: 'responsable_id',
                    },
                },
            });

            const responsableId = presence?.seance_id?.niveau_id?.formation_id?.responsable_id;
            const isAssigned = responsableId && responsableId.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({
                    success: false,
                    message: "Accès refusé. Vous n'êtes pas assigné à cette formation.",
                });
            }
        }

        presence.statut = statut || presence.statut;
        if (remarques !== undefined) {
            presence.remarques = remarques;
        }
        presence.marque_par = req.user._id;
        presence.date_marquage = new Date();

        await presence.save();

        res.status(200).json({
            success: true,
            message: 'Présence mise à jour avec succès',
            data: { presence },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/presences/student/:eleveId
 * @desc    Get student attendance history
 * @access  Formateur+
 */
export const getStudentAttendanceHistory = async (req, res, next) => {
    try {
        const presences = await Presence.find({ eleve_id: req.params.eleveId })
            .populate({
                path: 'seance_id',
                select: 'nom date numero niveau_id',
                populate: {
                    path: 'niveau_id',
                    select: 'nom numero formation_id',
                    populate: {
                        path: 'formation_id',
                        select: 'nom',
                    },
                },
            })
            .populate('marque_par', 'nom prenom')
            .sort('-date_marquage')
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
 * @route   GET /api/presences/session/:seanceId
 * @desc    Get session attendance list
 * @access  Formateur+
 */
export const getSessionAttendance = async (req, res, next) => {
    try {
        const presences = await Presence.find({ seance_id: req.params.seanceId })
            .populate('eleve_id', 'nom prenom photo')
            .populate('marque_par', 'nom prenom');

        res.status(200).json({
            success: true,
            data: { presences },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/presences/formation/:formationId/student/:eleveId
 * @desc    Get student attendance in a specific formation
 * @access  Formateur+
 */
export const getStudentFormationAttendance = async (req, res, next) => {
    try {
        const { formationId, eleveId } = req.params;

        // Get all niveaux for this formation
        const niveaux = await Niveau.find({ formation_id: formationId });
        const niveauIds = niveaux.map((n) => n._id);

        // Get all seances for these niveaux
        const seances = await Seance.find({ niveau_id: { $in: niveauIds } });
        const seanceIds = seances.map((s) => s._id);

        // Get all presences for this student in these seances
        const presences = await Presence.find({
            eleve_id: eleveId,
            seance_id: { $in: seanceIds },
        })
            .populate({
                path: 'seance_id',
                select: 'nom date numero niveau_id',
                populate: {
                    path: 'niveau_id',
                    select: 'nom numero',
                },
            })
            .sort('seance_id.date');

        // Calculate statistics
        const totalMarked = presences.length; // number of attendance records
        const totalSeances = seances.length; // total sessions in the formation
        const present = presences.filter((p) => ['present', 'retard'].includes(p.statut)).length;
        const absent = presences.filter((p) => p.statut === 'absent').length;
        // Progress is based on presence count over ALL planned sessions
        const pourcentage = totalSeances > 0 ? ((present / totalSeances) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                presences,
                statistics: {
                    total_seances: totalSeances,
                    seances_marked: totalMarked,
                    present,
                    absent,
                    pourcentage_presence: Number.parseFloat(pourcentage),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/presences/summary
 * @desc    Get attendance summary per student (global)
 * @access  Responsable+ (admin/responsable)
 */
export const getAttendanceSummary = async (req, res, next) => {
    try {
        // Aggregate presences by student
        const summary = await Presence.aggregate([
            {
                $group: {
                    _id: '$eleve_id',
                    total: { $sum: 1 },
                    presentLike: {
                        $sum: {
                            $cond: [{ $in: ['$statut', ['present', 'retard', 'justifie']] }, 1, 0],
                        },
                    },
                    absent: {
                        $sum: { $cond: [{ $eq: ['$statut', 'absent'] }, 1, 0] },
                    },
                },
            },
            {
                $lookup: {
                    from: 'eleves',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'eleve',
                },
            },
            { $unwind: { path: '$eleve', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    eleve_id: '$_id',
                    nom: '$eleve.nom',
                    prenom: '$eleve.prenom',
                    total: 1,
                    present: '$presentLike',
                    absent: 1,
                },
            },
            { $sort: { nom: 1, prenom: 1 } },
        ]);

        res.status(200).json({
            success: true,
            data: { summary },
        });
    } catch (error) {
        next(error);
    }
};
