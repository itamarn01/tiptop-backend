const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Treatment = require('../models/Treatment')

// Add new payment
router.post('/', async (req, res) => {
    const { clientId, userId, amount, paymentMethod } = req.body;

    try {
        const newPayment = new Payment({
            clientId,
            userId,
            amount,
            paymentMethod,
        });

        await newPayment.save();
        /*   const treatments = await Treatment.find({ clientId, paymentStatus: { $in: ['pending', 'partially paid'] } }).sort({ treatmentDate: 1 });
  
          for (const treatment of treatments) {
              if (treatment.paymentStatus === 'pending') {
                  if (treatment.treatmentPrice === amount) {
                      await Treatment.findByIdAndUpdate(treatment.id, { paymentStatus: 'paid' });
                  } else if (treatment.treatmentPrice > amount) {
                      await Treatment.findByIdAndUpdate(treatment.id, { paymentStatus: 'partially paid' });
                  }
              } else if (treatment.paymentStatus === 'partially paid') {
                  if (treatment.treatmentPrice - amount <= 0) {
                      await Treatment.findByIdAndUpdate(treatment.id, { paymentStatus: 'paid' });
                  }
              }
          } */
        res.status(201).json(newPayment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Edit payment
router.put('/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    const updates = req.body;

    try {
        const updatedPayment = await Payment.findByIdAndUpdate(paymentId, updates, { new: true, runValidators: true });

        if (!updatedPayment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(updatedPayment);
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete payment
router.delete('/:paymentId', async (req, res) => {
    const { paymentId } = req.params;

    try {
        const deletedPayment = await Payment.findByIdAndDelete(paymentId);

        if (!deletedPayment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all payments for a specific client
router.get('/client/:clientId', async (req, res) => {
    const { clientId } = req.params;
    // console.log("clientId:", req.params)
    try {
        const payments = await Payment.find({ clientId });

        /*  if (payments.length === 0) {
             return res.status(404).json({ message: 'No payments found for this client' });
         } */

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all payments for a specific user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const payments = await Payment.find({ userId });

        if (payments.length === 0) {
            return res.status(404).json({ message: 'No payments found for this user' });
        }

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 