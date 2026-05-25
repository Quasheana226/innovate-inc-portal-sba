// Mounted at /api/users in server.js
// POST /api/users/register
// POST /api/users/login
// GET  /api/users/auth/github
// GET  /api/users/auth/github/callback

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/User');
const { signToken } = require('../utils/auth');


// Register a new local account (email + password)
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with that email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
        });

        return res.status(201).json({
            message: 'User registered successfully. Please log in.',
            user: { id: newUser._id, email: newUser.email },
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration.' });
    }
});


// Log in with email + password, returns a JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Generic error prevents email enumeration attacks
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // GitHub-only accounts have no password field
        if (!user.password) {
            return res.status(401).json({ message: 'This account uses GitHub login. Please sign in with GitHub.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = signToken(user);

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user._id, email: user.email, displayName: user.displayName },
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
});


// Redirects user to GitHub's authorization page
router.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);


// GitHub redirects here after user approves or denies access
router.get('/auth/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/api/users/auth/failure' }),
    (req, res) => {
        const token = signToken(req.user);

        return res.status(200).json({
            message: 'GitHub authentication successful.',
            token,
            user: { id: req.user._id, email: req.user.email, displayName: req.user.displayName },
        });
    }
);


// Fallback when GitHub auth fails or is denied
router.get('/auth/failure', (req, res) => {
    return res.status(401).json({ message: 'GitHub authentication failed or was denied.' });
});


module.exports = router;
