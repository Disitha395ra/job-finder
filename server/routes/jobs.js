const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireCompany } = require('../middleware/auth');

/**
 * GET /api/jobs
 * Fetch jobs with optional filters: keyword, location, type, datePosted
 */
router.get('/', async (req, res) => {
    try {
        const { keyword, location, type, datePosted, page = 1, limit = 20 } = req.query;
        let query = db.collection('jobs').where('status', '==', 'published');

        // Filter by job type
        if (type && type !== 'all') {
            query = query.where('jobType', '==', type);
        }

        // Filter by location
        if (location && location.trim()) {
            query = query.where('locationLower', '==', location.trim().toLowerCase());
        }

        // Order by date posted (newest first)
        query = query.orderBy('createdAt', 'desc');

        // Date filter
        if (datePosted) {
            const now = new Date();
            let dateLimit;
            switch (datePosted) {
                case '24h':
                    dateLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    dateLimit = null;
            }
            if (dateLimit) {
                query = query.where('createdAt', '>=', dateLimit);
            }
        }

        const snapshot = await query.get();
        let jobs = [];

        snapshot.forEach((doc) => {
            jobs.push({ id: doc.id, ...doc.data() });
        });

        // Keyword search (client-side filtering since Firestore doesn't support full-text search)
        if (keyword && keyword.trim()) {
            const kw = keyword.trim().toLowerCase();
            jobs = jobs.filter(
                (job) =>
                    job.title?.toLowerCase().includes(kw) ||
                    job.description?.toLowerCase().includes(kw) ||
                    job.companyName?.toLowerCase().includes(kw) ||
                    job.keywords?.some((k) => k.toLowerCase().includes(kw))
            );
        }

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const paginatedJobs = jobs.slice(startIndex, startIndex + parseInt(limit));

        // Convert Firestore Timestamps to ISO strings for response
        const formattedJobs = paginatedJobs.map((job) => ({
            ...job,
            createdAt: job.createdAt?.toDate ? job.createdAt.toDate().toISOString() : job.createdAt,
            updatedAt: job.updatedAt?.toDate ? job.updatedAt.toDate().toISOString() : job.updatedAt,
        }));

        res.json({
            jobs: formattedJobs,
            total: jobs.length,
            page: parseInt(page),
            totalPages: Math.ceil(jobs.length / parseInt(limit)),
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs.' });
    }
});

/**
 * GET /api/jobs/:id
 * Get single job details
 */
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('jobs').doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        const job = { id: doc.id, ...doc.data() };
        job.createdAt = job.createdAt?.toDate ? job.createdAt.toDate().toISOString() : job.createdAt;
        job.updatedAt = job.updatedAt?.toDate ? job.updatedAt.toDate().toISOString() : job.updatedAt;

        res.json(job);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job details.' });
    }
});

/**
 * POST /api/jobs
 * Create a new job post (Company only)
 */
router.post('/', verifyToken, requireCompany, async (req, res) => {
    try {
        const { title, description, location, jobType, salary, keywords, cvLink } = req.body;

        if (!title || !description || !location || !jobType) {
            return res.status(400).json({ error: 'Title, description, location, and job type are required.' });
        }

        const jobData = {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            locationLower: location.trim().toLowerCase(),
            jobType,
            salary: salary || '',
            keywords: keywords || [],
            cvLink: cvLink || '',
            companyId: req.user.uid,
            companyName: req.companyProfile.companyName || '',
            companyLogo: req.companyProfile.logo || '',
            status: 'published',
            applicantCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection('jobs').add(jobData);

        res.status(201).json({
            id: docRef.id,
            ...jobData,
            createdAt: jobData.createdAt.toISOString(),
            updatedAt: jobData.updatedAt.toISOString(),
            message: 'Job published successfully!',
        });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job post.' });
    }
});

/**
 * PUT /api/jobs/:id
 * Update a job post (Company only, must own the job)
 */
router.put('/:id', verifyToken, requireCompany, async (req, res) => {
    try {
        const jobRef = db.collection('jobs').doc(req.params.id);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        if (jobDoc.data().companyId !== req.user.uid) {
            return res.status(403).json({ error: 'You can only update your own job posts.' });
        }

        const updates = { ...req.body, updatedAt: new Date() };
        if (updates.location) {
            updates.locationLower = updates.location.trim().toLowerCase();
        }
        // Remove fields that shouldn't be updated
        delete updates.companyId;
        delete updates.createdAt;

        await jobRef.update(updates);

        res.json({ message: 'Job updated successfully.' });
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job.' });
    }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job post (Company only, must own the job)
 */
router.delete('/:id', verifyToken, requireCompany, async (req, res) => {
    try {
        const jobRef = db.collection('jobs').doc(req.params.id);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        if (jobDoc.data().companyId !== req.user.uid) {
            return res.status(403).json({ error: 'You can only delete your own job posts.' });
        }

        await jobRef.delete();

        res.json({ message: 'Job deleted successfully.' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job.' });
    }
});

module.exports = router;
