const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    name: String,
    lastName: String,
    birthday: Date,
    gender: String,
    idNumber: { type: String, default: "" },
    description: String,
    parents: [{
        parentName: String,
        gender: String,
        phone: String,
        email: String,
    }],
    insuranceInfo: String,
    clientPrice: { type: Number, default: 0, },
    numberOfMeetings: { type: Number, default: 0 },
    files: [{
        format: { type: String, required: true },
        resource_type: { type: String, required: true },
        created_at: { type: String, required: true },
        bytes: { type: Number, required: true },
        url: { type: String, required: true },
        public_id: { type: String, required: true },
    }],
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: {
        type: String,
        default: new Date()
    },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);