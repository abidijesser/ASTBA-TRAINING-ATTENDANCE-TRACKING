import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['create', 'update', 'delete', 'login', 'logout', 'download', 'upload', 'assign'],
            required: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },
        entityType: {
            type: String,
            enum: ['User', 'Eleve', 'Formation', 'Seance', 'Certification', 'Presence', 'Niveau', 'EleveFormation'],
            default: null,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        entityName: {
            type: String,
            default: null,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success',
        },
        errorMessage: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

// Virtual for formatted date
activitySchema.virtual('formattedDate').get(function () {
    return this.createdAt?.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
