const mongoose = require("mongoose");
// const Joi = require("joi");
const bcrypt = require('bcryptjs');


const UserSchema = new mongoose.Schema({
    profileImage: String,
    name: String,
    email: { type: String, required: true, unique: true },
    authProvider: { type: String, default: "email" },
    appleId: { type: String, unique: true, sparse: true }, // Allow multiple null values
    googleId: { type: String, unique: true, sparse: true }, // Ensure uniqueness only for non-null values
    phone: String,
    logo: String,
    specialization: String,
    experience: Number,
    clinicName: String,
    clinicAddress: String,
    welcomeMessage: {
        type: String,

        default:
            "To ensure we have all the necessary details for your upcoming session, please take a few minutes to fill out the form below. Your information will remain private and secure.",
    },
    thankYouMessage: {
        type: String,

        default:
            "Thank you for filling out your information!",
    },
    password: { type: String, /* required: true */ },
    notificationToken: { type: String },
    package: { type: String, default: "free" },
    formLink: { type: String },
    createdAt: {
        type: String,
        default: new Date()
    },

}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);



