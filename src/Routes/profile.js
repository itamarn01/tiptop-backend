const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const User = require('../models/User'); // Path to your User model
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require("path");

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

// Route to upload profile image
router.post('/users/:id/profile-image', upload.single('profileImage'), async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'profile_images', // Optional: Organize uploads in a specific folder
        });

        // Update the user's profile image URL in MongoDB
        const user = await User.findByIdAndUpdate(
            id,
            { profileImage: result.secure_url },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Profile image uploaded successfully',
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to upload profile image', error });
    }
});
module.exports = router;