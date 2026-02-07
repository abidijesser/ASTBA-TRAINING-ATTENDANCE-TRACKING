import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: [true, 'Le nom est requis'],
            trim: true,
        },
        prenom: {
            type: String,
            required: [true, 'Le prénom est requis'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "L'email est requis"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide'],
        },
        password: {
            type: String,
            required: [true, 'Le mot de passe est requis'],
            minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
            select: false, // Don't return password by default
        },
        role: {
            type: String,
            enum: ['formateur', 'responsable', 'admin'],
            default: 'formateur',
            required: true,
        },
        formations_assignees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Formation',
            },
        ],
        avatar: {
            type: String,
            default: '',
        },
        actif: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Automatically add createdAt and updatedAt
    }
);

/**
 * Pre-save middleware to hash password before saving to database
 * Only runs if password is modified
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Method to compare entered password with hashed password in database
 * @param {string} enteredPassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method to generate JWT token for user authentication
 * @returns {string} JWT token
 */
userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

const User = mongoose.model('User', userSchema);

export default User;
