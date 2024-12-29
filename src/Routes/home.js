const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const Treatment = require('../models/Treatment');
const mongoose = require('mongoose')
// Get user statistics
router.get('/user/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("getting user statistics")
        // Fetch client count
        const clientCount = await Client.countDocuments({ adminId: userId });

        // Fetch treatment count
        const treatmentCount = await Treatment.countDocuments({ userId });

        const treatmentPriceStats = await Treatment.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalTreatmentPrice: { $sum: '$treatmentPrice' }
                }
            }
        ]);
        const totalTreatmentPrice = treatmentPriceStats[0]?.totalTreatmentPrice || 0;

        // Fetch payment stats
        const payments = await Payment.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalPending = totalTreatmentPrice - payments[0]?.totalAmount || 0
        // console.log("payments by status:", payments)
        // Fetch next treatment
        const nextTreatment = await Treatment.findOne({
            userId,
            treatmentDate: { $gt: new Date() } // Only consider future treatments
        })
            .sort({ treatmentDate: 1 }) // Sort by date to get the earliest future treatment
            .populate('clientId', 'name lastName');
        res.json({
            clientCount,
            treatmentCount,
            totalTreatmentPrice,
            totalPending,
            payments,
            nextTreatment
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;