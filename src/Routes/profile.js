const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const User = require('../models/User'); // Path to your User model
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require("path");
const Client = require('../models/Client')
const streamifier = require('streamifier');

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

// Route to upload logo image
router.post('/users/:id/logo-image', upload.single('logoImage'), async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'logo_images', // Optional: Organize uploads in a specific folder
        });

        // Update the user's profile image URL in MongoDB
        const user = await User.findByIdAndUpdate(
            id,
            { logo: result.secure_url },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'logo image uploaded successfully',
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to upload logo image', error });
    }
});

// Route to delete profile image
router.delete('/users/:id/profile-image', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the user in the database
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.profileImage) {
            return res.status(400).json({ message: 'No profile image to delete' });
        }

        // Extract the public_id from the image URL
        const imageUrl = user.profileImage;
        const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public_id from URL

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);

        // Update the user's profile to remove the image URL
        user.profileImage = null; // Clear the profile image field
        await user.save();

        res.status(200).json({
            message: 'Profile image deleted successfully',
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete profile image', error });
    }
});

// Route to delete logo image
router.delete('/users/:id/logo-image', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the user in the database
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.logo) {
            return res.status(400).json({ message: 'No logo image to delete' });
        }

        // Extract the public_id from the image URL
        const imageUrl = user.logo;
        const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public_id from URL

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(`logo_images/${publicId}`);

        // Update the user's profile to remove the image URL
        user.logo = null; // Clear the profile image field
        await user.save();

        res.status(200).json({
            message: 'logo image deleted successfully',
            user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete logo image', error });
    }
});
router.post('/:clientId/files', upload.single('file'), async (req, res) => {
    const { clientId } = req.params;

    try {
        // Ensure a file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'files', }, // Handles all file types
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    return res.status(500).json({ error: 'Failed to upload file' });
                }

                // Update client record in database
                const client = await Client.findByIdAndUpdate(
                    clientId,
                    {
                        $push: {
                            files: {
                                url: result.secure_url,
                                public_id: result.public_id,
                                resource_type: result.resource_type,
                                format: result.format,
                                created_at: result.created_at,
                                bytes: result.bytes,
                            },
                        },
                    },
                    { new: true }
                );

                // Return the updated client record
                res.status(200).json(client);
            }
        );

        // Write the file buffer to the Cloudinary upload stream
        streamifier.createReadStream(req.file.buffer).pipe(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Route to add a file to a client
// router.post('/:clientId/files', upload.single('file'), async (req, res) => {
//     const { clientId } = req.params;
//     const { file } = req.body; // Assuming file is sent in the request body

//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded' });
//         }

//         // Convert buffer to base64
//         const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
//         console.log("req.file.uri:", req.file.uri)




//             // Upload image to Cloudinary
//             const result = await cloudinary.uploader.upload(base64Image, {
//                 folder: 'files', // Optional: Organize uploads in a specific folder
//                 resource_type:'auto'
//             });
//             /*  const result = await cloudinary.uploader.upload(file); */
//             const client = await Client.findByIdAndUpdate(clientId, {
//                 $push: {
//                     files: {
//                         url: result.secure_url,
//                         /* public_id: result.public_id, 
//                         version: result.version, 
//                         signature: result.signature, 
//                         width: result.width, 
//                         height: result.height,  */
//                         resource_type: result.resource_type,
//                         format: result.format,
//                         created_at: result.created_at,
//                         bytes: result.bytes,
//                         /* type: result.type  */
//                     }
//                 }
//             }, { new: true });
//             res.status(200).json(client);

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });



// Route to delete a file from a client
router.delete('/:clientId/files/index/:index', async (req, res) => {
    const { clientId, index } = req.params;

    try {
        // Find the client
        const client = await Client.findById(clientId);
        if (!client || !client.files[index]) {
            return res.status(404).json({ message: 'Client or file not found' });
        }

        // Get the file's public_id from the database
        const fileToDelete = client.files[index];
        const publicId = fileToDelete.public_id; // Ensure public_id is stored in the files array

        // Delete the file from Cloudinary
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        // Remove the file from the database
        client.files.splice(index, 1);
        await client.save();

        res.status(200).json({ message: 'File deleted successfully', client });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to get all files for a client
router.get('/:clientId/files', async (req, res) => {
    const { clientId } = req.params;

    try {
        const client = await Client.findById(clientId);
        res.status(200).json(client.files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;