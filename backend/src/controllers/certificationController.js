import Certification from '../models/Certification.js';
import Eleve from '../models/Eleve.js';
import Formation from '../models/Formation.js';
import { calculateStudentProgress, checkAndValidateCertification } from '../utils/certificationHelper.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';
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

        // Auto-validate any pending certificates by policy (remove 'en_attente')
        const toUpdate = certifications.filter((c) => c.statut !== 'valide');
        if (toUpdate.length > 0) {
            for (const cert of toUpdate) {
                try {
                    const progress = await calculateStudentProgress(
                        cert.eleve_id?._id || cert.eleve_id,
                        cert.formation_id?._id || cert.formation_id
                    );
                    cert.statut = 'valide';
                    cert.delivre_par = req.user?._id || cert.delivre_par;
                    cert.date_obtention = new Date();
                    cert.pourcentage_presence_total = progress?.overall_progress || 0;
                    cert.niveaux_valides = [1, 2, 3, 4];
                    await cert.save();
                } catch (e) {
                    // If update fails, continue with others
                    console.error('Auto-validate failed for cert', cert._id?.toString(), e.message);
                }
            }
        }

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
        let certification = await Certification.findById(req.params.id)
            .populate('eleve_id')
            .populate('formation_id');

        if (!certification) {
            return res.status(404).json({
                success: false,
                message: 'Certificat non trouvé',
            });
        }

        if (certification.statut !== 'valide') {
            // Try to auto-validate if conditions are met
            const eleveId = certification.eleve_id?._id || certification.eleve_id;
            const formationId = certification.formation_id?._id || certification.formation_id;
            const validated = await checkAndValidateCertification(eleveId, formationId);

            if (!validated || validated.statut !== 'valide') {
                return res.status(400).json({
                    success: false,
                    message: 'Conditions non remplies pour générer le certificat (présences par niveau insuffisantes).',
                });
            }

            // Reload populated certification for PDF data
            certification = await Certification.findById(validated._id)
                .populate('eleve_id')
                .populate('formation_id');
        }

        // Generate PDF certificate with fixed signature and phrase
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const SIGNATURE_IMAGE_PATH = process.env.SIGNATURE_IMAGE_PATH || path.resolve(__dirname, '../assets/signature.png');
        const CERT_PHRASE = process.env.CERT_PHRASE || 'Certificat délivré par ASTBA.';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificat-${certification.numero_certificat || certification._id}.pdf"`);

        // Landscape single-page layout
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
        doc.pipe(res);

        const ORG_NAME = process.env.CERT_ORG_NAME || 'ASTBA';
        const CERT_TITLE = process.env.CERT_TITLE || 'CERTIFICAT DE RÉUSSITE';
        const SUBTITLE = process.env.CERT_SUBTITLE || 'Atteste que';
        const ISSUE_LABEL = process.env.CERT_ISSUE_LABEL || "Émis le";
        const SIGN_LABEL = process.env.CERT_SIGN_LABEL || 'Signature';
        const SIGNATORY_NAME = process.env.SIGNATORY_NAME || 'Direction ASTBA';
        const SIGNATORY_TITLE = process.env.SIGNATORY_TITLE || 'Pour ASTBA';

        // Colors
        const FOOTER_TEXT = process.env.CERT_FOOTER_TEXT || '';
        
        const primary = '#2F80ED';
        const dark = '#1F2937';
        const muted = '#6B7280';
        const accent = '#10B981';

        const pageW = doc.page.width;
        const pageH = doc.page.height;
        const contentX = 40;
        const contentWidth = pageW - 80;

        // Soft background shapes (child-friendly)
        doc.save();
        doc.circle(-50, pageH * 0.2, 160).fill('#E6F4FF');
        doc.circle(pageW + 50, pageH * 0.75, 180).fill('#E9FBE6');
        doc.rect(0, pageH * 0.42, pageW, 80).fill('#F3F4F6');
        doc.restore();

        // Optional logo (top-left)
        const ORG_LOGO_PATH = process.env.ORG_LOGO_PATH || path.resolve(__dirname, '../assets/logo.png');
        try {
            doc.image(ORG_LOGO_PATH, 40, 35, { width: 90 });
        } catch {}

        // Top header and title (centered)
        doc.fillColor(primary).font('Helvetica-Bold').fontSize(16).text(ORG_NAME, contentX, 40, { width: contentWidth, align: 'center' });
        doc.fillColor(dark).font('Helvetica-Bold').fontSize(34).text(CERT_TITLE, contentX, 70, { width: contentWidth, align: 'center' });
        doc.fillColor(muted).font('Helvetica').fontSize(12).text(SUBTITLE, contentX, 110, { width: contentWidth, align: 'center' });

        // Recipient name
        const fullName = `${certification.eleve_id?.nom || ''} ${certification.eleve_id?.prenom || ''}`.trim();
        doc.fillColor(dark).font('Helvetica-Bold').fontSize(28).text(fullName || '—', contentX, 135, { width: contentWidth, align: 'center' });

        // Body line: completed formation
        const formationName = certification.formation_id?.nom || '';
        doc.fillColor(dark).font('Helvetica').fontSize(13)
            .text(`a complété avec succès la formation`, contentX, 170, { width: contentWidth, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(18).fillColor(dark)
            .text(formationName, contentX, 190, { width: contentWidth, align: 'center' });

        // Presence
        if (typeof certification.pourcentage_presence_total === 'number') {
            doc.font('Helvetica').fontSize(11).fillColor(muted)
                .text(`Taux de présence: ${certification.pourcentage_presence_total}%`, contentX, 215, { width: contentWidth, align: 'center' });
        }

        // Decorative badge
        const centerX = pageW / 2;
        const badgeY = 250;
        doc.save();
        doc.circle(centerX - 40, badgeY, 20).fillAndStroke('#FCD34D', '#F59E0B');
        doc.circle(centerX, badgeY, 26).fillAndStroke('#0EA5E9', '#0284C7');
        doc.circle(centerX + 40, badgeY, 20).fillAndStroke('#FCD34D', '#F59E0B');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('BRAVO', centerX - 26, badgeY - 7, { width: 52, align: 'center' });
        doc.restore();

        // Phrase (custom)
        doc.font('Helvetica').fontSize(11).fillColor(dark).text(CERT_PHRASE, contentX, badgeY + 30, { width: contentWidth, align: 'center' });

        // Footer: issue date and certificate number on left
        const bottomY = pageH - 110;
        const issueDate = new Date(certification.date_obtention).toLocaleDateString();
        doc.moveTo(40, bottomY).lineTo(pageW - 40, bottomY).strokeColor('#E5E7EB').stroke();

        doc.fillColor(muted).font('Helvetica').fontSize(10).text(`${ISSUE_LABEL}: ${issueDate}`, 40, bottomY + 10);
        doc.text(`Numéro: ${certification.numero_certificat || '—'}`, 40, bottomY + 25);
        
        // Optional association footer text (centered, tiny)
        if (FOOTER_TEXT) {
            doc.fillColor('#9CA3AF').font('Helvetica').fontSize(9)
               .text(FOOTER_TEXT, 0, pageH - 35, { align: 'center' });
        }

        // Signature block on right
        const sigBlockX = pageW - 260;
        const sigBlockY = bottomY - 65; // place above the divider to avoid overflow
        try {
            doc.image(SIGNATURE_IMAGE_PATH, sigBlockX, sigBlockY, { width: 120 });
        } catch (e) {
            doc.font('Helvetica-Oblique').fontSize(10).fillColor(muted).text('(Signature non disponible)', sigBlockX, sigBlockY + 18, { width: 180, align: 'center' });
        }
        doc.moveTo(sigBlockX, sigBlockY + 60).lineTo(sigBlockX + 180, sigBlockY + 60).strokeColor('#D1D5DB').stroke();
        doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text(SIGNATORY_NAME, sigBlockX, sigBlockY + 68, { width: 180, align: 'center' });
        doc.fillColor(muted).font('Helvetica').fontSize(10).text(SIGNATORY_TITLE, sigBlockX, sigBlockY + 82, { width: 180, align: 'center' });

        doc.end();
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

/**
 * @route   POST /api/certifications/seed-pending/:formationId?
 * @desc    Create 'en_attente' certificates for enrolled students without a certificate yet
 * @access  Responsable+
 */
export const seedPendingCertificates = async (req, res, next) => {
    try {
        const { formationId } = req.params;

        // Dynamically import to avoid circular deps at load
        const EleveFormation = (await import('../models/EleveFormation.js')).default;

        const query = { statut: 'en_cours' };
        if (formationId) query.formation_id = formationId;

        const enrollments = await EleveFormation.find(query).select('eleve_id formation_id');

        if (enrollments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun élève en cours trouvé pour la génération en attente',
                data: { seeded: 0, total: 0 },
            });
        }

        let seeded = 0;
        for (const ef of enrollments) {
            const existing = await Certification.findOne({ eleve_id: ef.eleve_id, formation_id: ef.formation_id });
            if (!existing) {
                await Certification.create({
                    eleve_id: ef.eleve_id,
                    formation_id: ef.formation_id,
                    statut: 'en_attente',
                });
                seeded++;
            }
        }

        res.status(200).json({
            success: true,
            message: `${seeded} certificats en attente créés`,
            data: { seeded, total: enrollments.length },
        });
    } catch (error) {
        next(error);
    }
};
