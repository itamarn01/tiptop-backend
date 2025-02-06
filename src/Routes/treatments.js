const express = require('express');
const router = express.Router();
const Treatment = require('../models/Treatment');
const Client = require('../models/Client');

/* router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;

        let dateQuery = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            dateQuery = {
                treatmentDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            };
        }

        const treatments = await Treatment.find({
            userId,
            ...dateQuery
        }).populate('clientId', 'firstName lastName');

        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}); */

// Get all treatments for a specific user with month and year filter
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;

        // Create date range for the specified month
        const startDate = new Date(year, month - 1, 1); // Month is 0-based in Date constructor
        const endDate = new Date(year, month, 0); // Last day of the month

        const treatments = await Treatment.find({
            userId,
            treatmentDate: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .populate('clientId', 'name lastName') // Populate client details
            .sort({ treatmentDate: 1 }); // Sort by date ascending

        res.json(treatments);
        console.log("treatments:", treatments)
    } catch (error) {
        console.error('Error fetching treatments:', error);
        res.status(500).json({
            message: 'Error fetching treatments',
            error: error.message
        });
    }
});

// Get treatments count by month for a specific user
router.get('/user/:userId/monthly-count', async (req, res) => {
    try {
        const { userId } = req.params;
        const { year } = req.query;

        const monthlyCount = await Treatment.aggregate([
            {
                $match: {
                    userId: userId,
                    treatmentDate: {
                        $gte: new Date(year, 0, 1),
                        $lte: new Date(year, 11, 31)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$treatmentDate" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        res.json(monthlyCount);

    } catch (error) {
        console.error('Error fetching monthly treatment count:', error);
        res.status(500).json({
            message: 'Error fetching monthly treatment count',
            error: error.message
        });
    }
});

// Get treatments statistics for a specific month
router.get('/user/:userId/monthly-stats', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.query;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const stats = await Treatment.aggregate([
            {
                $match: {
                    userId: userId,
                    treatmentDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTreatments: { $sum: 1 },
                    totalRevenue: { $sum: "$treatmentPrice" },
                    averagePrice: { $avg: "$treatmentPrice" },
                    uniqueClients: { $addToSet: "$clientId" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalTreatments: 1,
                    totalRevenue: 1,
                    averagePrice: { $round: ["$averagePrice", 2] },
                    uniqueClientsCount: { $size: "$uniqueClients" }
                }
            }
        ]);

        res.json(stats[0] || {
            totalTreatments: 0,
            totalRevenue: 0,
            averagePrice: 0,
            uniqueClientsCount: 0
        });

    } catch (error) {
        console.error('Error fetching monthly statistics:', error);
        res.status(500).json({
            message: 'Error fetching monthly statistics',
            error: error.message
        });
    }
});

// Get treatments by date range
router.get('/user/:userId/date-range', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const treatments = await Treatment.find({
            userId,
            treatmentDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        })
            .populate('clientId', 'name lastName')
            .sort({ treatmentDate: 1 });

        res.json(treatments);

    } catch (error) {
        console.error('Error fetching treatments by date range:', error);
        res.status(500).json({
            message: 'Error fetching treatments by date range',
            error: error.message
        });
    }
});
// Get treatments for a specific client with pagination and search
router.get('/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { page = 1, limit = 10, search = '' } = req.query;

        // Build the query for treatments based on clientId and search term
        const query = {
            clientId,
            treatmentSummary: { $regex: search, $options: 'i' }
        };

        // Get total count of matching treatments
        const totalTreatments = await Treatment.countDocuments(query);

        // Fetch treatments with pagination and search
        const treatments = await Treatment.find(query)
            .sort({ treatmentDate: -1 }) // Sort by treatment date, most recent first
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Return treatments with pagination info
        res.json({
            treatments,
            currentPage: page,
            totalPages: Math.ceil(totalTreatments / limit),
            totalTreatments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Add new treatment(s) for a client
router.post('/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const {
            treatmentDate,
            treatmentSummary,
            homework,
            whatNext,
            repeatStatus, // "never" or "every week"
            numberOfMeetings // Number of total meetings
        } = req.body;

        const client = await Client.findOne({ _id: clientId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        let existingTreatments = await Treatment.find({ clientId: clientId });
        let numberOfTreatments = existingTreatments.length;
        console.log("numberOfTreatments:", numberOfTreatments, "number of meetings:", numberOfMeetings)
        let treatments = [];

        if (numberOfTreatments >= numberOfMeetings - 1) {
            const newTreatment = new Treatment({
                userId: client.adminId,
                clientId,
                treatmentPrice: client.clientPrice > 0 ? client.clientPrice : 0,
                treatmentDate: new Date(treatmentDate), // Ensure this is a new Date object
                treatmentSummary,
                homework,
                whatNext,
                createdAt: new Date().toISOString(),
            });
            await newTreatment.save();
            res.json(newTreatment);
            return;
        }

        for (let i = numberOfTreatments; i < numberOfMeetings; i++) {
            const currentTreatmentDate = new Date(treatmentDate); // Create a new Date object for each iteration
            currentTreatmentDate.setDate(currentTreatmentDate.getDate() + (i * 7)); // Increment by weeks

            const newTreatment = new Treatment({
                userId: client.adminId,
                clientId,
                treatmentPrice: client.clientPrice > 0 ? client.clientPrice : 0,
                treatmentDate: currentTreatmentDate,
                treatmentSummary,
                homework,
                whatNext,
                createdAt: new Date().toISOString(),
            });

            treatments.push(newTreatment);
        }
        console.log("treaments:", treatments)
        const savedTreatments = await Treatment.insertMany(treatments);

        res.status(201).json(savedTreatments);
    } catch (error) {
        console.error("Error saving treatments:", error);
        res.status(500).json({ message: error.message });
    }
});

// Edit Treatment
router.put('/treatments/:id', async (req, res) => {
    try {
        console.log("id: ", req.params.id)
        console.log("req body:", req.body)

        // Check if treatmentSummary is not empty and set status to "COMPLETED"
        const updateData = { ...req.body };
        if (req.body.treatmentSummary) {
            updateData.status = "COMPLETED";
        }

        const updatedTreatment = await Treatment.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json(updatedTreatment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating treatment', error });
    }
});

// Delete Treatment
router.delete('/:id', async (req, res) => {
    try {
        const treatmentDeleted = await Treatment.findByIdAndDelete(req.params.id);
        res.status(200).json({ treatments: treatmentDeleted, message: 'Treatment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting treatment', error });
    }
});

// Update Treatment Date and Time
router.put('/dateTime/:id', async (req, res) => {
    const { treatmentDate } = req.body;

    try {
        const updatedTreatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            { treatmentDate },
            { new: true }
        );

        if (!updatedTreatment) {
            return res.status(404).json({ message: 'Treatment not found' });
        }

        res.status(200).json(updatedTreatment);
    } catch (error) {
        console.error('Error updating treatment date and time:', error);
        res.status(500).json({ message: 'Error updating treatment', error });
    }
});



module.exports = router;
