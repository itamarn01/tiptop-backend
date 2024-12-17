const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    name: String,
    lastName: String,
    birthday: Date,
    gender: String,
    description: String,
    parents: [{
        parentName: String,
        gender: String,
        phone: String,
        email: String,
    }],
    insuranceInfo: String,
    clientPrice: { type: Number, default: 0, },
    numberOfMeetings: Number,
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: {
        type: String,
        default: new Date()
    },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);