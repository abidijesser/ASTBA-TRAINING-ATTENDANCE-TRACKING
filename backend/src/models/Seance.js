import mongoose from 'mongoose';

/**
 * Séance (Session) Model
 * Represents individual training sessions
 */

const seanceSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
        },
        numero: {
            type: Number,
            required: [true, 'Le numéro est requis'],
            min: [1, 'Le numéro doit être au moins 1'],
        },
        niveau_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Niveau',
            required: [true, 'Le niveau est requis'],
            index: true,
        },
        date: {
            type: Date,
            required: [true, 'La date est requise'],
            index: true,
        },
        heure_debut: {
            type: String,
            required: [true, "L'heure de début est requise"],
            trim: true,
        },
        heure_fin: {
            type: String,
            required: [true, "L'heure de fin est requise"],
            trim: true,
        },
        lieu: {
            type: String,
            trim: true,
        },
        formateur_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Le formateur est requis'],
            index: true,
        },
        contenu: {
            type: String,
            trim: true,
        },
        statut: {
            type: String,
            enum: ['planifiee', 'en_cours', 'terminee', 'annulee'],
            default: 'planifiee',
        },
        type: {
            type: String,
            enum: ['Presentiel', 'En ligne'],
            default: 'Presentiel',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound unique index: a level can't have duplicate session numbers
seanceSchema.index({ niveau_id: 1, numero: 1 }, { unique: true });

// Virtual for presences
seanceSchema.virtual('presences', {
    ref: 'Presence',
    localField: '_id',
    foreignField: 'seance_id',
});

const Seance = mongoose.model('Seance', seanceSchema);

export default Seance;
