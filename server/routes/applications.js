const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
const https = require('https');
const http = require('http');
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
        let cvFileName = '';

        // Upload CV to Firebase Storage
        if (req.file) {
            cvFileName = req.file.originalname;
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
            cvFileName,
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

        // Sort by createdAt descending in-memory
        applications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

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

        // Sort by createdAt descending in-memory
        applications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.json(applications);
    } catch (error) {
        console.error('Error fetching job applications:', error);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

/**
 * GET /api/applications/job/:jobId/download-cvs
 * Download all CVs for a job as a ZIP file (Company only, must own the job)
 */
router.get('/job/:jobId/download-cvs', verifyToken, requireCompany, async (req, res) => {
    try {
        // Verify ownership
        const jobDoc = await db.collection('jobs').doc(req.params.jobId).get();
        if (!jobDoc.exists) {
            return res.status(404).json({ error: 'Job not found.' });
        }
        const jobData = jobDoc.data();
        if (jobData.companyId !== req.user.uid) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Get all applications for this job
        const snapshot = await db
            .collection('applications')
            .where('jobId', '==', req.params.jobId)
            .get();

        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.cvUrl) {
                applications.push({
                    id: doc.id,
                    username: data.username,
                    email: data.email,
                    cvUrl: data.cvUrl,
                    cvFileName: data.cvFileName || 'cv',
                });
            }
        });

        if (applications.length === 0) {
            return res.status(404).json({ error: 'No CVs found for this job.' });
        }

        // Set response headers for ZIP download
        const safeTitle = jobData.title.replace(/[^a-zA-Z0-9_-]/g, '_');
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_CVs.zip"`);

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 5 } });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create ZIP file.' });
            }
        });

        // Pipe archive to response
        archive.pipe(res);

        // Helper to download a file from URL and return buffer
        const downloadFile = (url) => {
            return new Promise((resolve, reject) => {
                const protocol = url.startsWith('https') ? https : http;
                protocol.get(url, (response) => {
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        // Follow redirect
                        return downloadFile(response.headers.location).then(resolve).catch(reject);
                    }
                    if (response.statusCode !== 200) {
                        return reject(new Error(`Failed to download: ${response.statusCode}`));
                    }
                    const chunks = [];
                    response.on('data', (chunk) => chunks.push(chunk));
                    response.on('end', () => resolve(Buffer.concat(chunks)));
                    response.on('error', reject);
                }).on('error', reject);
            });
        };

        // Add each CV to the archive
        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            try {
                const buffer = await downloadFile(app.cvUrl);
                // Create a unique filename: ApplicantName_email_originalFilename
                const safeName = app.username.replace(/[^a-zA-Z0-9_-]/g, '_');
                const ext = app.cvFileName.includes('.')
                    ? app.cvFileName.substring(app.cvFileName.lastIndexOf('.'))
                    : '.pdf';
                const fileName = `${safeName}_${app.email.split('@')[0]}${ext}`;
                archive.append(buffer, { name: fileName });
            } catch (downloadErr) {
                console.error(`Failed to download CV for ${app.username}:`, downloadErr.message);
                // Skip this file and continue
            }
        }

        // Finalize the archive
        await archive.finalize();
    } catch (error) {
        console.error('Error downloading CVs:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download CVs.' });
        }
    }
});

module.exports = router;
