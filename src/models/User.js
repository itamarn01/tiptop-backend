const mongoose = require("mongoose");
// const Joi = require("joi");
const bcrypt = require('bcrypt');


const UserSchema = new mongoose.Schema({
    profileImage: String,
    name: String,
    email: { type: String, required: true, unique: true },
    authProvider: { type: String, default: "email" },
    appleId: { type: String, unique: true, default: "" },
    phone: String,
    password: { type: String, /* required: true */ },
    notificationToken: { type: String },
    package: { type: String, default: "free" },
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



