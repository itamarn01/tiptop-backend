const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwkToPem = require('jwk-to-pem');
var axios = require("axios");
const router = express.Router();
require('dotenv').config();
const ResetToken = require('../models/resetToken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ email, password, name, authProvider: 'email', package: 'free' });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Convert user to a plain object and remove the password field
        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({ token, user: userObj });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/auth', async (req, res) => {
    try {

        const { token, authProvider } = req.body;

        // Verify token with Apple or Google (implement this part)
        const verifiedToken = await verifyToken(token, authProvider);
        // console.log("verifiedToken:", verifiedToken)

        if (verifiedToken.decodedToken) {

            let user = await User.findOne({ /* email: verifiedToken.decodedToken.email */appleId: verifiedToken.decodedToken.sub });

            if (!user) {
                console.log("new user start create...")
                appleName = verifiedToken.name || verifiedToken.decodedToken.email.substring(0, verifiedToken.decodedToken.email.lastIndexOf("@"));
                console.log("appleName:", appleName)
                console.log("sub:", verifiedToken.decodedToken.sub)
                // Create new user if not exists
                user = new User({
                    email: verifiedToken.decodedToken.email,
                    name: verifiedToken.name || appleName,
                    authProvider: authProvider,
                    appleId: verifiedToken.decodedToken.sub,
                });
                await user.save();
            }
            console.log("user:", user)

            // Generate JWT
            const jwtToken = jwt.sign({ userId: user._id }, 'secret-tiptop', { expiresIn: '1d' });

            res.json({ token: jwtToken, user });
        } else {

            res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.log("error creat new apple user:", error)
        res.status(500).json({ error: 'Server error' });
    }
});

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        console.log("req.userId", req.userId)
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Protected route example
router.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: 'Access granted to protected route' });
});

async function verifyToken(token, provider) {
    try {
        if (provider === "apple") {

            // Get Apple's public keys
            const appleKeysResponse = await axios.get('https://appleid.apple.com/auth/keys');
            const appleKeys = appleKeysResponse.data.keys;

            // Decode the token header to find the kid
            const decodedHeader = jwt.decode(token, { complete: true });
            const kid = decodedHeader.header.kid;

            // Find the corresponding public key
            const appleKey = appleKeys.find(key => key.kid === kid);

            if (!appleKey) {
                throw new Error('Apple public key not found');
            }

            // Create a public key from the JWK (JSON Web Key)
            const publicKey = jwkToPem(appleKey);

            // Verify the token
            const decodedToken = jwt.verify(token, publicKey, {
                algorithms: ['RS256'],
            });

            // Extract full name from the decoded token
            const name = decodedToken.name
                ? `${decodedToken.name.firstName || ''} ${decodedToken.name.lastName || ''}`.trim()
                : `${decodedToken.given_name || ''} ${decodedToken.family_name || ''}`.trim() || null;
            console.log("name:", name)
            return {
                decodedToken,
                name,
            };
        } else return;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }

}



router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId, { password: 0 }); // Exclude the password field
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});



// Generate 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot password - send verification code
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();

        // Save token to database
        await ResetToken.findOneAndDelete({ userId: user._id }); // Remove any existing token
        await ResetToken.create({
            userId: user._id,
            token: verificationCode
        });

        // Configure email transporter (replace with your email service credentials)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'gmail',
            port: 587,
            secure: 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Verification Code',
            text: `Your verification code is: ${verificationCode}\nThis code will expire in 1 hour.`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify code and reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find and verify token
        const resetToken = await ResetToken.findOne({
            userId: user._id,
            token: code
        });

        if (!resetToken) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        // Delete used token
        await ResetToken.findByIdAndDelete(resetToken._id);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error in reset password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify code endpoint
router.post('/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find and verify token
        const resetToken = await ResetToken.findOne({
            userId: user._id,
            token: code
        });

        if (!resetToken) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        res.json({ message: 'Code verified successfully' });
    } catch (error) {
        console.error('Error in verify code:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;