import mongoose from 'mongoose';

/**
 * Élève (Student) Model
 * Represents students enrolled in training programs
 */

const eleveSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
            index: true,
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom est requis'],
            trim: true,
            index: true,
        },
        date_naissance: {
            type: Date,
            required: [true, 'La date de naissance est requise'],
        },
        email: {
            type: String,
            required: [true, "L'email est requis"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide'],
            index: true,
        },
        telephone: {
            type: String,
            required: [true, 'Le téléphone est requis'],
            trim: true,
        },
        adresse: {
            type: String,
            trim: true,
        },
        photo: {
            type: String,
            default: '',
        },
        actif: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for formations suivies
eleveSchema.virtual('formations_suivies', {
    ref: 'EleveFormation',
    localField: '_id',
    foreignField: 'eleve_id',
});

// Index for search performance
eleveSchema.index({ nom: 'text', prenom: 'text' });

const Eleve = mongoose.model('Eleve', eleveSchema);

export default Eleve;
