const { auth, db } = require('../config/firebase');

/**
 * Verify Firebase ID token from Authorization header
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

/**
 * Middleware: Only allow job seekers
 */
const requireSeeker = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists) {
            req.userProfile = { id: userDoc.id, ...userDoc.data() };
            return next();
        }
        return res.status(403).json({ error: 'Access denied. Job seeker account required.' });
    } catch (error) {
        console.error('Seeker check error:', error.message);
        return res.status(500).json({ error: 'Server error checking user role.' });
    }
};

/**
 * Middleware: Only allow companies
 */
const requireCompany = async (req, res, next) => {
    try {
        const companyDoc = await db.collection('companies').doc(req.user.uid).get();
        if (companyDoc.exists) {
            req.companyProfile = { id: companyDoc.id, ...companyDoc.data() };
            return next();
        }
        return res.status(403).json({ error: 'Access denied. Company account required.' });
    } catch (error) {
        console.error('Company check error:', error.message);
        return res.status(500).json({ error: 'Server error checking company role.' });
    }
};

module.exports = { verifyToken, requireSeeker, requireCompany };
