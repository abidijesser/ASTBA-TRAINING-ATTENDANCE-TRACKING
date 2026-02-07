import mongoose from 'mongoose';

/**
 * EleveFormation (Junction Table) Model
 * Links students to formations with progress tracking
 */

const eleveFormationSchema = new mongoose.Schema(
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
        date_inscription: {
            type: Date,
            default: Date.now,
        },
        niveau_actuel: {
            type: Number,
            default: 1,
            min: [1, 'Le niveau actuel doit être entre 1 et 4'],
            max: [4, 'Le niveau actuel doit être entre 1 et 4'],
        },
        statut: {
            type: String,
            enum: ['en_cours', 'complete', 'abandonne'],
            default: 'en_cours',
        },
        date_completion: {
            type: Date,
        },
        progression_pourcentage: {
            type: Number,
            default: 0,
            min: [0, 'La progression doit être entre 0 et 100'],
            max: [100, 'La progression doit être entre 0 et 100'],
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: an eleve can only be enrolled once per formation
eleveFormationSchema.index({ eleve_id: 1, formation_id: 1 }, { unique: true });

const EleveFormation = mongoose.model('EleveFormation', eleveFormationSchema);

export default EleveFormation;
