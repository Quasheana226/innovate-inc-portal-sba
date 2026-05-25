// Entry point — connects MongoDB, registers middleware, mounts routes, starts server

require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const configurePassport = require('./config/passport');
const userRoutes         = require('./routes/userRoutes');
const bookmarkRoutes     = require('./routes/bookmarkRoutes');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Initialize Passport — no sessions, JWT only
app.use(passport.initialize());
configurePassport(passport);

// Route mounting
app.use('/api/users',     userRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Innovate Inc. Portal API is running.' });
});

const PORT = process.env.PORT || 5000;

// Wait for MongoDB before accepting requests
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully.');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    });
