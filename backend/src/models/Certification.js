import mongoose from 'mongoose';

/**
 * Certification Model
 * Certificates issued upon training completion
 */

const certificationSchema = new mongoose.Schema(
    {
        eleve_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Eleve',
            required: [true, "L'élève est requis"],
            index: true,
        },
        formation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Formation',
            required: [true, 'La formation est requise'],
            index: true,
        },
        date_obtention: {
            type: Date,
            default: Date.now,
        },
        statut: {
            type: String,
            enum: ['valide', 'en_attente', 'refuse'],
            default: 'en_attente',
        },
        numero_certificat: {
            type: String,
            unique: true,
            sparse: true, // Allow null values but enforce uniqueness when set
        },
        delivre_par: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        pourcentage_presence_total: {
            type: Number,
            min: [0, 'Le pourcentage doit être entre 0 et 100'],
            max: [100, 'Le pourcentage doit être entre 0 et 100'],
        },
        niveaux_valides: [
            {
                type: Number,
                min: 1,
                max: 4,
            },
        ],
        remarques: {
            type: String,
            trim: true,
        },
        pdf_url: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: an eleve can only have one certificate per formation
certificationSchema.index({ eleve_id: 1, formation_id: 1 }, { unique: true });

// Pre-save hook to generate certificate number
certificationSchema.pre('save', async function (next) {
    if (!this.numero_certificat && this.statut === 'valide') {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Certification').countDocuments();
        this.numero_certificat = `ASTBA-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

const Certification = mongoose.model('Certification', certificationSchema);

export default Certification;
