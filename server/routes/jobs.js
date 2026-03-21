const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken, requireCompany } = require('../middleware/auth');

/**
 * GET /api/jobs
 * Fetch jobs with optional filters: keyword, location, type, datePosted
 */
router.get('/', async (req, res) => {
    try {
        const { keyword, location, type, datePosted, page = 1, limit = 20 } = req.query;
        const now = new Date();

        // Fetch all published jobs (no orderBy to avoid composite index requirement)
        let query = db.collection('jobs')
            .where('status', '==', 'published');

        const snapshot = await query.get();
        let jobs = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            // Auto-expire: skip jobs whose closing date has passed
            if (data.closingDate) {
                const closingDate = data.closingDate.toDate ? data.closingDate.toDate() : new Date(data.closingDate);
                if (closingDate < now) {
                    // Auto-update status to 'expired' in the background
                    db.collection('jobs').doc(doc.id).update({ status: 'expired' }).catch(() => { });
                    return; // Skip this job
                }
            }
            jobs.push({ id: doc.id, ...data });
        });

        // Sort by createdAt descending (newest first) — done in-memory to avoid Firestore composite index
        jobs.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        // Filter by job type
        if (type && type !== 'all') {
            jobs = jobs.filter((job) => job.jobType === type);
        }

        // Filter by location
        if (location && location.trim()) {
            const loc = location.trim().toLowerCase();
            jobs = jobs.filter((job) => job.locationLower === loc);
        }

        // Date filter
        if (datePosted) {
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
                jobs = jobs.filter((job) => {
                    const created = job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt);
                    return created >= dateLimit;
                });
            }
        }

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
            closingDate: job.closingDate?.toDate ? job.closingDate.toDate().toISOString() : job.closingDate,
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

        // Check if job is expired
        if (job.closingDate) {
            const closingDate = job.closingDate.toDate ? job.closingDate.toDate() : new Date(job.closingDate);
            if (closingDate < new Date()) {
                job.isExpired = true;
            }
        }

        job.createdAt = job.createdAt?.toDate ? job.createdAt.toDate().toISOString() : job.createdAt;
        job.updatedAt = job.updatedAt?.toDate ? job.updatedAt.toDate().toISOString() : job.updatedAt;
        job.closingDate = job.closingDate?.toDate ? job.closingDate.toDate().toISOString() : job.closingDate;

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
        const { title, description, location, jobType, salary, keywords, cvLink, closingDate } = req.body;

        if (!title || !description || !location || !jobType) {
            return res.status(400).json({ error: 'Title, description, location, and job type are required.' });
        }

        if (!closingDate) {
            return res.status(400).json({ error: 'Closing date is required.' });
        }

        // Validate closing date is in the future
        const closingDateObj = new Date(closingDate);
        if (closingDateObj <= new Date()) {
            return res.status(400).json({ error: 'Closing date must be in the future.' });
        }

        const now = admin.firestore.Timestamp.now();

        const jobData = {
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            locationLower: location.trim().toLowerCase(),
            jobType,
            salary: salary || '',
            keywords: keywords || [],
            cvLink: cvLink || '',
            closingDate: admin.firestore.Timestamp.fromDate(closingDateObj),
            companyId: req.user.uid,
            companyName: req.companyProfile.companyName || '',
            companyLogo: req.companyProfile.logo || '',
            status: 'published',
            applicantCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const docRef = await db.collection('jobs').add(jobData);

        res.status(201).json({
            id: docRef.id,
            ...jobData,
            createdAt: jobData.createdAt.toDate().toISOString(),
            updatedAt: jobData.updatedAt.toDate().toISOString(),
            closingDate: closingDateObj.toISOString(),
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

        const updates = { ...req.body, updatedAt: admin.firestore.Timestamp.now() };
        if (updates.location) {
            updates.locationLower = updates.location.trim().toLowerCase();
        }
        // Convert closingDate string to Firestore Timestamp
        if (updates.closingDate) {
            updates.closingDate = admin.firestore.Timestamp.fromDate(new Date(updates.closingDate));
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
