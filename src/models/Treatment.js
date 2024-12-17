const mongoose = require('mongoose');
const { defaultMaxListeners } = require('nodemailer/lib/xoauth2');

const TreatmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    /* sessionNumber: {
        type: Number,
        // required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    }, */
    treatmentDate: {
        type: Date,
        // required: true
    },
    treatmentSummary: {
        type: String,
        default: ''
    },
    homework: {
        type: String,
        default: ''
    },
    whatNext: {
        type: String,
        default: ''
    },
    treatmentPrice: {
        type: Number,
        default: 0
    },
    /*  paymentStatus: {
         type: String,
         default: 'pending'
     }, */
    /*  PaymentMethod: {
         type: String,
         default: ''
     },
     payDate: Date, */
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

module.exports = mongoose.model('Treatment', TreatmentSchema);