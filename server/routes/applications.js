const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { db, bucket } = require('../config/firebase');
const { verifyToken, requireSeeker, requireCompany } = require('../middleware/auth');

// Configure multer for file uploads (memory storage for Firebase)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed.'), false);
        }
    },
});

/**
 * POST /api/applications
 * Submit a job application (Seeker only)
 */
router.post('/', verifyToken, requireSeeker, upload.single('cv'), async (req, res) => {
    try {
        const { jobId, username, email, phone, coverLetter } = req.body;

        if (!jobId || !username || !email || !phone) {
            return res.status(400).json({ error: 'Job ID, username, email, and phone are required.' });
        }

        // Check if job exists
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }

        // Check if already applied
        const existingApp = await db
            .collection('applications')
            .where('userId', '==', req.user.uid)
            .where('jobId', '==', jobId)
            .get();

        if (!existingApp.empty) {
            return res.status(400).json({ error: 'You have already applied for this job.' });
        }

        let cvUrl = '';

        // Upload CV to Firebase Storage
        if (req.file) {
            const fileName = `cvs/${req.user.uid}/${uuidv4()}_${req.file.originalname}`;
            const file = bucket.file(fileName);

            await file.save(req.file.buffer, {
                metadata: {
                    contentType: req.file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(),
                    },
                },
            });

            // Make file publicly accessible
            await file.makePublic();
            cvUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        }

        const jobData = jobDoc.data();

        const applicationData = {
            userId: req.user.uid,
            jobId,
            jobTitle: jobData.title,
            companyName: jobData.companyName,
            companyId: jobData.companyId,
            username: username.trim(),
            email: email.trim(),
            phone: phone.trim(),
            coverLetter: coverLetter?.trim() || '',
            cvUrl,
            status: 'submitted',
            createdAt: new Date(),
        };

        const docRef = await db.collection('applications').add(applicationData);

        // Increment applicant count on the job
        await db.collection('jobs').doc(jobId).update({
            applicantCount: (jobData.applicantCount || 0) + 1,
        });

        res.status(201).json({
            id: docRef.id,
            message: 'Your application has been successfully submitted.',
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        if (error.message?.includes('Only PDF')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to submit application.' });
    }
});

/**
 * GET /api/applications/user
 * Get current user's applications (Seeker only)
 */
router.get('/user', verifyToken, requireSeeker, async (req, res) => {
    try {
        const snapshot = await db
            .collection('applications')
            .where('userId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            applications.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            });
        });

        res.json(applications);
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

/**
 * GET /api/applications/job/:jobId
 * Get applications for a specific job (Company only, must own the job)
 */
router.get('/job/:jobId', verifyToken, requireCompany, async (req, res) => {
    try {
        // Verify ownership
        const jobDoc = await db.collection('jobs').doc(req.params.jobId).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }
        if (jobDoc.data().companyId !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        const snapshot = await db
            .collection('applications')
            .where('jobId', '==', req.params.jobId)
            .orderBy('createdAt', 'desc')
            .get();

        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            applications.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            });
        });

        res.json(applications);
    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

module.exports = router;
