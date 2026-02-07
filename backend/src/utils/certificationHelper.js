import Certification from '../models/Certification.js';
import Niveau from '../models/Niveau.js';
import Seance from '../models/Seance.js';
import Presence from '../models/Presence.js';
import EleveFormation from '../models/EleveFormation.js';

/**
 * Check if student completed formation and auto-validate certification
 * @param {string} eleveId - Student ID
 * @param {string} formationId - Formation ID
 */
export const checkAndValidateCertification = async (eleveId, formationId) => {
    try {
        // Check if certification already exists
        const existingCert = await Certification.findOne({
            eleve_id: eleveId,
            formation_id: formationId,
        });

        if (existingCert && existingCert.statut === 'valide') {
            // Already certified
            return existingCert;
        }

        // Get all levels for this formation
        const niveaux = await Niveau.find({ formation_id: formationId }).sort({
            numero: 1,
        });

        if (niveaux.length === 0) {
            return null; // No levels configured
        }

        const MIN_ATTENDANCE_RATIO = 5 / 6; // Must attend at least 5 out of 6 sessions per level
        const niveauxValides = [];
        let totalPresences = 0;
        let totalSeances = 0;

        // Check each level
        for (const niveau of niveaux) {
            // Get all sessions for this level
            const seances = await Seance.find({ niveau_id: niveau._id });

            if (seances.length === 0) {
                // Level has no sessions, skip
                continue;
            }

            // Get presences for these sessions
            const seanceIds = seances.map((s) => s._id);
            const presences = await Presence.find({
                eleve_id: eleveId,
                seance_id: { $in: seanceIds },
                statut: { $in: ['present', 'retard'] }, // Count present and late as attended
            });

            totalSeances += seances.length;
            totalPresences += presences.length;

            // Check if student met minimum attendance for this level
            const attendanceRatio = presences.length / seances.length;

            if (attendanceRatio >= MIN_ATTENDANCE_RATIO) {
                niveauxValides.push(niveau.numero);
            } else {
                // Student didn't meet attendance requirement for this level
                return null;
            }
        }

        // Check if all levels are validated
        if (niveauxValides.length < niveaux.length) {
            return null; // Not all levels completed
        }

        // Calculate overall attendance percentage
        const pourcentagePresence =
            totalSeances > 0 ? ((totalPresences / totalSeances) * 100).toFixed(2) : 0;

        // Create or update certification
        let certification;

        if (existingCert) {
            // Update existing
            existingCert.statut = 'valide';
            existingCert.date_obtention = new Date();
            existingCert.pourcentage_presence_total = parseFloat(pourcentagePresence);
            existingCert.niveaux_valides = niveauxValides;
            certification = await existingCert.save();
        } else {
            // Create new
            certification = await Certification.create({
                eleve_id: eleveId,
                formation_id: formationId,
                statut: 'valide',
                date_obtention: new Date(),
                pourcentage_presence_total: parseFloat(pourcentagePresence),
                niveaux_valides: niveauxValides,
            });
        }

        // Update EleveFormation status to 'complete'
        await EleveFormation.findOneAndUpdate(
            { eleve_id: eleveId, formation_id: formationId },
            {
                statut: 'complete',
                date_completion: new Date(),
                progression_pourcentage: 100,
            }
        );

        return certification;
    } catch (error) {
        console.error('Error checking certification:', error);
        return null;
    }
};

/**
 * Calculate student progress in formation
 * @param {string} eleveId - Student ID
 * @param {string} formationId - Formation ID
 * @returns {object} Progress data
 */
export const calculateStudentProgress = async (eleveId, formationId) => {
    try {
        const niveaux = await Niveau.find({ formation_id: formationId }).sort({
            numero: 1,
        });

        let totalSeances = 0;
        let attendedSeances = 0;
        const niveauxProgress = [];

        for (const niveau of niveaux) {
            const seances = await Seance.find({ niveau_id: niveau._id });
            const seanceIds = seances.map((s) => s._id);

            const presences = await Presence.find({
                eleve_id: eleveId,
                seance_id: { $in: seanceIds },
                statut: { $in: ['present', 'retard'] },
            });

            totalSeances += seances.length;
            attendedSeances += presences.length;

            niveauxProgress.push({
                niveau: niveau.numero,
                nom: niveau.nom,
                total_seances: seances.length,
                seances_attended: presences.length,
                pourcentage:
                    seances.length > 0
                        ? ((presences.length / seances.length) * 100).toFixed(2)
                        : 0,
            });
        }

        const overallProgress =
            totalSeances > 0
                ? ((attendedSeances / totalSeances) * 100).toFixed(2)
                : 0;

        return {
            niveaux_progress: niveauxProgress,
            overall_progress: parseFloat(overallProgress),
            total_seances: totalSeances,
            attended_seances: attendedSeances,
        };
    } catch (error) {
        console.error('Error calculating progress:', error);
        return null;
    }
};
