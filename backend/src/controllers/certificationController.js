import Certification from '../models/Certification.js';
import Eleve from '../models/Eleve.js';
import Formation from '../models/Formation.js';
import { calculateStudentProgress } from '../utils/certificationHelper.js';
import { logActivity } from './activityController.js';

/**
 * Certification Controller
 * Handles all certification-related operations
 */

/**
 * @route   GET /api/certifications
 * @desc    Get all certificates
 * @access  Responsable+
 */
export const getAllCertifications = async (req, res, next) => {
    try {
        const { statut, formation_id } = req.query;

        const query = {};
        if (statut) query.statut = statut;
        if (formation_id) query.formation_id = formation_id;

        const certifications = await Certification.find(query)
            .populate('eleve_id', 'nom prenom email')
            .populate('formation_id', 'nom')
            .populate('delivre_par', 'nom prenom')
            .sort('-date_obtention');

        res.status(200).json({
            success: true,
            data: { certifications },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/certifications/:id
 * @desc    Get certificate details
 * @access  Formateur+
 */
export const getCertificationById = async (req, res, next) => {
    try {
        const certification = await Certification.findById(req.params.id)
            .populate('eleve_id', 'nom prenom email date_naissance photo')
            .populate('formation_id', 'nom description')
            .populate('delivre_par', 'nom prenom');

        if (!certification) {
            return res.status(404).json({
                success: false,
                message: 'Certificat non trouvé',
            });
        }

        res.status(200).json({
            success: true,
            data: { certification },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/certifications/validate
 * @desc    Manually validate a certificate
 * @access  Responsable+
 */
export const validateCertification = async (req, res, next) => {
    try {
        const { eleve_id, formation_id, remarques } = req.body;

        // Check if certification already exists
        let certification = await Certification.findOne({
            eleve_id,
            formation_id,
        });

        // Calculate progress
        const progress = await calculateStudentProgress(eleve_id, formation_id);

        if (certification) {
            // Update existing
            certification.statut = 'valide';
            certification.delivre_par = req.user._id;
            certification.date_obtention = new Date();
            certification.remarques = remarques || '';
            certification.pourcentage_presence_total = progress?.overall_progress || 0;
            certification.niveaux_valides = [1, 2, 3, 4];
            await certification.save();
        } else {
            // Create new
            certification = await Certification.create({
                eleve_id,
                formation_id,
                statut: 'valide',
                delivre_par: req.user._id,
                date_obtention: new Date(),
                remarques: remarques || '',
                pourcentage_presence_total: progress?.overall_progress || 0,
                niveaux_valides: [1, 2, 3, 4],
            });
        }

        res.status(200).json({
            success: true,
            message: 'Certificat validé avec succès',
            data: { certification },
        });

        // Log activity (non-blocking)
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const eleve = await Eleve.findById(eleve_id);
        const formation = await Formation.findById(formation_id);
        logActivity(
            req.user._id,
            certification.statut === 'valide' ? 'update' : 'create',
            `Validation de certificat pour ${eleve?.nom || 'élève'} ${eleve?.prenom || ''} - ${formation?.nom || 'formation'}`,
            'Certification',
            certification._id,
            `${eleve?.nom} ${eleve?.prenom}`,
            { formation: formation?.nom },
            ipAddress,
            userAgent
        ).catch((err) => console.error('Failed to log activity:', err));
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/certifications/student/:eleveId
 * @desc    Get student certificates
 * @access  Formateur+
 */
export const getStudentCertifications = async (req, res, next) => {
    try {
        const certifications = await Certification.find({
            eleve_id: req.params.eleveId,
        })
            .populate('formation_id', 'nom description')
            .populate('delivre_par', 'nom prenom')
            .sort('-date_obtention');

        res.status(200).json({
            success: true,
            data: { certifications },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/certifications/:id/download
 * @desc    Download PDF certificate
 * @access  Formateur+
 */
export const downloadCertificate = async (req, res, next) => {
    try {
        const certification = await Certification.findById(req.params.id)
            .populate('eleve_id')
            .populate('formation_id');

        if (!certification) {
            return res.status(404).json({
                success: false,
                message: 'Certificat non trouvé',
            });
        }

        if (certification.statut !== 'valide') {
            return res.status(400).json({
                success: false,
                message: 'Le certificat n\'est pas encore validé',
            });
        }

        // TODO: Generate PDF using a template
        // For now, return certificate data
        res.status(200).json({
            success: true,
            message: 'Génération de PDF à implémenter',
            data: {
                certification,
                download_url: certification.pdf_url || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/certifications/generate-bulk/:formationId
 * @desc    Generate certificates for all eligible students in a formation
 * @access  Responsable+
 */
export const generateFormationCertificates = async (req, res, next) => {
    try {
        const { formationId } = req.params;

        // Check if formation exists
        const formation = await Formation.findById(formationId);
        if (!formation) {
            return res.status(404).json({
                success: false,
                message: 'Formation non trouvée',
            });
        }

        // Get all students enrolled in this formation
        const EleveFormation = (await import('../models/EleveFormation.js')).default;
        const enrollments = await EleveFormation.find({ formation_id: formationId });

        if (enrollments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun élève inscrit à cette formation',
                data: { certified: 0, total: 0 }
            });
        }

        let certifiedCount = 0;
        for (const enrollment of enrollments) {
            const cert = await checkAndValidateCertification(enrollment.eleve_id, formationId);
            if (cert && cert.statut === 'valide') {
                certifiedCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `${certifiedCount} certificats générés/validés pour cette formation`,
            data: {
                certified: certifiedCount,
                total: enrollments.length
            }
        });
    } catch (error) {
        next(error);
    }
};
