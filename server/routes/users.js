const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/users/register
 * Register a new job seeker (stores profile data in Firestore)
 */
router.post('/register', async (req, res) => {
    try {
        const { uid, fullName, email } = req.body;

        if (!uid || !fullName || !email) {
            return res.status(400).json({ error: 'UID, full name, and email are required.' });
        }

        // Check if user already exists
        const existingUser = await db.collection('users').doc(uid).get();
        if (existingUser.exists) {
            return res.status(400).json({ error: 'User profile already exists.' });
        }

        const userData = {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role: 'seeker',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('users').doc(uid).set(userData);

        res.status(201).json({ message: 'User registered successfully.', user: { id: uid, ...userData } });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        const userData = userDoc.data();
        res.json({
            id: userDoc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate
                ? userData.createdAt.toDate().toISOString()
                : userData.createdAt,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
});

module.exports = router;
