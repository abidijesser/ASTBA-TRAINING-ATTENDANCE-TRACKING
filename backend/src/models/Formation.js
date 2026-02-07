import mongoose from 'mongoose';

/**
 * Formation (Training) Model
 * Represents training programs with multiple levels
 */

const formationSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            unique: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, 'La description est requise'],
            trim: true,
        },
        responsable_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Le responsable est requis'],
            index: true,
        },
        nombre_niveaux: {
            type: Number,
            default: 4,
            min: [1, 'Une formation doit avoir au moins 1 niveau'],
            max: [4, 'Une formation ne peut pas avoir plus de 4 niveaux'],
        },
        duree_estimee: {
            type: String,
            trim: true,
        },
        date_debut: {
            type: Date,
        },
        actif: {
            type: Boolean,
            default: true,
        },
        niveau_actuel: {
            type: Number,
            default: 1,
            min: 1,
            max: 5, // 5 means completed
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for niveaux
formationSchema.virtual('niveaux', {
    ref: 'Niveau',
    localField: '_id',
    foreignField: 'formation_id',
});

// Virtual for students enrolled
formationSchema.virtual('etudiants', {
    ref: 'EleveFormation',
    localField: '_id',
    foreignField: 'formation_id',
});

const Formation = mongoose.model('Formation', formationSchema);

export default Formation;
