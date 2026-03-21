const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { verifyToken, requireCompany } = require('../middleware/auth');

/**
 * POST /api/companies/register
 * Register a new company (stores profile data in Firestore)
 */
router.post('/register', async (req, res) => {
    try {
        const { uid, companyName, email, description } = req.body;

        if (!uid || !companyName || !email) {
            return res.status(400).json({ error: 'UID, company name, and email are required.' });
        }

        // Check if company already exists
        const existingCompany = await db.collection('companies').doc(uid).get();
        if (existingCompany.exists) {
            return res.status(400).json({ error: 'Company profile already exists.' });
        }

        const companyData = {
            companyName: companyName.trim(),
            email: email.trim().toLowerCase(),
            description: description?.trim() || '',
            logo: '',
            role: 'company',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('companies').doc(uid).set(companyData);

        res.status(201).json({
            message: 'Company registered successfully.',
            company: { id: uid, ...companyData },
        });
    } catch (error) {
        console.error('Error registering company:', error);
        res.status(500).json({ error: 'Failed to register company.' });
    }
});

/**
 * GET /api/companies/profile
 * Get current company's profile
 */
router.get('/profile', verifyToken, requireCompany, async (req, res) => {
    try {
        res.json(req.companyProfile);
    } catch (error) {
        console.error('Error fetching company profile:', error);
        res.status(500).json({ error: 'Failed to fetch company profile.' });
    }
});

/**
 * GET /api/companies/jobs
 * Get all jobs posted by the current company
 */
router.get('/jobs', verifyToken, requireCompany, async (req, res) => {
    try {
        const snapshot = await db
            .collection('jobs')
            .where('companyId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const now = new Date();
        const jobs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            let isExpired = false;

            // Check if the closing date has passed
            if (data.closingDate) {
                const closingDate = data.closingDate.toDate ? data.closingDate.toDate() : new Date(data.closingDate);
                if (closingDate < now && data.status === 'published') {
                    isExpired = true;
                    // Auto-update to expired in the background
                    db.collection('jobs').doc(doc.id).update({ status: 'expired' }).catch(() => { });
                }
            }

            jobs.push({
                id: doc.id,
                ...data,
                isExpired: isExpired || data.status === 'expired',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                closingDate: data.closingDate?.toDate ? data.closingDate.toDate().toISOString() : data.closingDate,
            });
        });

        res.json(jobs);
    } catch (error) {
        console.error('Error fetching company jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs.' });
    }
});

/**
 * PUT /api/companies/password
 * Change company password
 */
router.put('/password', verifyToken, requireCompany, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        await auth.updateUser(req.user.uid, { password: newPassword });

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password.' });
    }
});

module.exports = router;
