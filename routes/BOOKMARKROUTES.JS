// Mounted at /api/bookmarks in server.js
// All routes have two security layers:
//   Layer 1 – authMiddleware: validates JWT, attaches req.user
//   Layer 2 – ownership check: confirms req.user._id matches bookmark.user

const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const { authMiddleware } = require('../utils/auth');

// Apply auth to every route in this file — one line beats repeating it five times
router.use(authMiddleware);


// POST /api/bookmarks — create a bookmark for the logged-in user
router.post('/', async (req, res) => {
    try {
        const { title, url, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        // user is set server-side from the JWT — the client cannot forge ownership
        const bookmark = await Bookmark.create({
            user: req.user._id,
            title,
            url,
            description,
        });

        return res.status(201).json({ message: 'Bookmark created.', bookmark });

    } catch (error) {
        console.error('Create bookmark error:', error);
        return res.status(500).json({ message: 'Server error creating bookmark.' });
    }
});


// GET /api/bookmarks — return all bookmarks owned by the logged-in user
router.get('/', async (req, res) => {
    try {
        // Filtering by user: req.user._id means another user's bookmarks are never fetched
        const bookmarks = await Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 });

        return res.status(200).json({ count: bookmarks.length, bookmarks });

    } catch (error) {
        console.error('Get bookmarks error:', error);
        return res.status(500).json({ message: 'Server error fetching bookmarks.' });
    }
});


// GET /api/bookmarks/:id — get one bookmark by its MongoDB _id (must own it)
router.get('/:id', async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found.' });
        }

        // ObjectId comparison requires .toString() — can't use === on objects
        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You do not own this bookmark.' });
        }

        return res.status(200).json({ bookmark });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid bookmark ID format.' });
        }
        console.error('Get one bookmark error:', error);
        return res.status(500).json({ message: 'Server error fetching bookmark.' });
    }
});


// PUT /api/bookmarks/:id — update a bookmark by its MongoDB _id (must own it)
router.put('/:id', async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found.' });
        }

        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You do not own this bookmark.' });
        }

        const { title, url, description } = req.body;

        // Only apply fields that were actually sent — prevents overwriting with undefined
        if (title !== undefined) bookmark.title = title;
        if (url !== undefined) bookmark.url = url;
        if (description !== undefined) bookmark.description = description;

        const updatedBookmark = await bookmark.save();

        return res.status(200).json({ message: 'Bookmark updated.', bookmark: updatedBookmark });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid bookmark ID format.' });
        }
        console.error('Update bookmark error:', error);
        return res.status(500).json({ message: 'Server error updating bookmark.' });
    }
});


// DELETE /api/bookmarks/:id — delete a bookmark by its MongoDB _id (must own it)
router.delete('/:id', async (req, res) => {
    try {
        const bookmark = await Bookmark.findById(req.params.id);

        if (!bookmark) {
            return res.status(404).json({ message: 'Bookmark not found.' });
        }

        if (bookmark.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You do not own this bookmark.' });
        }

        await bookmark.deleteOne();

        return res.status(200).json({ message: 'Bookmark deleted successfully.' });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid bookmark ID format.' });
        }
        console.error('Delete bookmark error:', error);
        return res.status(500).json({ message: 'Server error deleting bookmark.' });
    }
});


module.exports = router;
 