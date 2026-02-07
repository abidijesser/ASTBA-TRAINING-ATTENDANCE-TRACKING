import mongoose from 'mongoose';

/**
 * Niveau (Level) Model
 * Represents levels within a formation (1-4)
 */

const niveauSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
        },
        numero: {
            type: Number,
            required: [true, 'Le numéro est requis'],
            min: [1, 'Le numéro doit être entre 1 et 4'],
            max: [4, 'Le numéro doit être entre 1 et 4'],
        },
        formation_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Formation',
            required: [true, 'La formation est requise'],
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        objectifs: [
            {
                type: String,
                trim: true,
            },
        ],
        nombre_seances: {
            type: Number,
            default: 6,
            min: [1, 'Un niveau doit avoir au moins 1 séance'],
        },
        ordre: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound unique index: a formation can't have duplicate level numbers
niveauSchema.index({ formation_id: 1, numero: 1 }, { unique: true });

// Virtual for seances
niveauSchema.virtual('seances', {
    ref: 'Seance',
    localField: '_id',
    foreignField: 'niveau_id',
});

const Niveau = mongoose.model('Niveau', niveauSchema);

export default Niveau;
