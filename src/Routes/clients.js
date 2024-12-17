const express = require("express");
const router = express.Router();
const Client = require('../models/Client');
console.log("client:", Client)


// Get clients with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, search = '', adminId } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Ensure that adminId is provided
        if (!adminId) {
            return res.status(400).json({ message: 'adminId is required' });
        }

        const query = {
            adminId, // Filter by adminId
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { $expr: { $regexMatch: { input: { $concat: ["$name", " ", "$lastName"] }, regex: search, options: "i" } } },
                { $expr: { $regexMatch: { input: { $concat: ["$lastName", " ", "$name"] }, regex: search, options: "i" } } }
            ]
        };

        const clients = await Client.find(query).skip(skip).limit(limit);
        const total = await Client.countDocuments(query);

        res.json({ clients, total });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client by clientId and adminId
router.get('/:clientId/:adminId', async (req, res) => {
    try {
        const { clientId, adminId } = req.params;

        // Find the client with the specified clientId and adminId
        const client = await Client.findOne({ _id: clientId, adminId: adminId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

// Add new client
router.post('/', async (req, res) => {
    try {
        const { name, lastName, birthday, gender, adminId } = req.body;
        const newClient = new Client({ name, lastName, birthday, adminId, gender });
        console.log("newClient adminid:", newClient.adminId)
        await newClient.save();
        res.json(newClient);
    } catch (err) {
        res.status(400).json({ error: 'Invalid data' });
    }
});



router.post('/:clientId/addParent', async (req, res) => {
    try {
        const { parentName, gender, phone, email } = req.body;
        const clientId = req.params.clientId;

        // Find the client and add the parent
        const client = await Client.findById(clientId);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        client.parents.push({ parentName, gender, phone, email });
        await client.save();

        res.status(200).json({ message: 'Parent added successfully', client });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add parent', error });
    }
});

// Delete a parent by index from a client's parents array
router.delete('/:clientId/parent/index/:index', async (req, res) => {
    try {
        const { clientId, index } = req.params;

        // Convert index to an integer
        const parentIndex = parseInt(index, 10);

        // Fetch the client
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Check if the index is within bounds
        if (parentIndex < 0 || parentIndex >= client.parents.length) {
            return res.status(400).json({ message: 'Index out of bounds' });
        }

        // Remove the parent at the specified index
        client.parents.splice(parentIndex, 1);

        // Save the updated client document
        await client.save();

        res.json(client/* .parents */); // Send back the updated parents array
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete client
router.delete('/:clientId/:adminId', async (req, res) => {
    try {
        const { clientId, adminId } = req.params;

        const client = await Client.findOneAndDelete({ _id: clientId, adminId });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client
router.put('/:clientId/:adminId', async (req, res) => {
    try {
        const { clientId, adminId } = req.params;
        const updates = req.body;

        const client = await Client.findOneAndUpdate(
            { _id: clientId, adminId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/:clientId/updateField', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { field, value } = req.body;

        // Validate allowed fields
        const allowedFields = ['insuranceInfo', 'clientPrice', 'numberOfMeetings', 'birthday', 'description']; // Added 'description'
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid field name' });
        }

        // Validate value based on field type
        if (field === 'numberOfMeetings') {
            if (isNaN(value) || value < 0) {
                return res.status(400).json({ message: 'Invalid number of meetings' });
            }
        } else if (field === 'birthday') {
            // Validate that the value is a valid date
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ message: 'Invalid date' });
            }
        } else if (field === 'description') {
            // Validate that the description is a string and not empty
            if (typeof value !== 'string' || value.trim() === '') {
                return res.status(400).json({ message: 'Description must be a non-empty string' });
            }
        }

        // Create update object
        const updateObj = { [field]: value };

        const updatedClient = await Client.findByIdAndUpdate(
            clientId,
            { $set: updateObj },
            { new: true } // Return updated document
        );

        if (!updatedClient) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.json(updatedClient);
    } catch (error) {
        console.error('Error updating client field:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Search Clients
router.get('/search-clients', async (req, res) => {
    const { search, adminId } = req.query;
    console.log("search:", search)
    if (!search || !adminId) {
        return res.status(400).json({ message: 'Search text and admin ID are required.' });
    }

    try {
        // Use a regex to perform a case-insensitive search on name and lastName
        const regex = new RegExp(search, 'i'); // 'i' for case-insensitive
        const clients = await Client.find({
            adminId: adminId,
            $or: [
                { name: { $regex: regex } },
                { lastName: { $regex: regex } }
            ]
        });

        res.status(200).json(clients);
    } catch (error) {
        console.error('Error searching clients:', error);
        res.status(500).json({ message: 'Error searching clients', error });
    }
});

// Add parent to client
router.post('/:clientId/parents', async (req, res) => {
    try {
        const { clientId } = req.params;
        const parentData = req.body;

        const updatedClient = await Client.findByIdAndUpdate(
            clientId,
            { $push: { parents: parentData } },
            { new: true }
        );

        res.status(201).json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: 'Error adding parent', error });
    }
});

// Update parent
router.put('/:clientId/parents/:parentId', async (req, res) => {
    try {
        const { clientId, parentId } = req.params;
        const updateData = req.body;

        const updatedClient = await Client.findOneAndUpdate(
            { _id: clientId, "parents._id": parentId },
            { $set: { "parents.$": updateData } },
            { new: true }
        );

        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: 'Error updating parent', error });
    }
});

// Delete parent
router.delete('/:clientId/parents/:parentId', async (req, res) => {
    try {
        const { clientId, parentId } = req.params;

        const updatedClient = await Client.findByIdAndUpdate(
            clientId,
            { $pull: { parents: { _id: parentId } } },
            { new: true }
        );

        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting parent', error });
    }
});

module.exports = router;
