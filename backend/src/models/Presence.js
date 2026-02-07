import mongoose from 'mongoose';

/**
 * Présence (Attendance) Model
 * Tracks student attendance for each session
 */

const presenceSchema = new mongoose.Schema(
    {
        eleve_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Eleve',
            required: [true, "L'élève est requis"],
            index: true,
        },
        seance_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seance',
            required: [true, 'La séance est requise'],
            index: true,
        },
        statut: {
            type: String,
            enum: ['present', 'absent', 'retard', 'justifie'],
            required: [true, 'Le statut est requis'],
        },
        date_marquage: {
            type: Date,
            default: Date.now,
        },
        marque_par: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Le marqueur est requis'],
        },
        remarques: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: an eleve can only have one attendance record per seance
presenceSchema.index({ eleve_id: 1, seance_id: 1 }, { unique: true });

const Presence = mongoose.model('Presence', presenceSchema);

export default Presence;
