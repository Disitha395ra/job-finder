const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let credential;

// Try loading from JSON file first (local development)
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (fs.existsSync(keyPath)) {
  const serviceAccount = require(keyPath);
  credential = admin.credential.cert(serviceAccount);
  console.log('✅ Firebase initialized from serviceAccountKey.json');
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  // Fall back to environment variables (production/cloud deployment)
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
  console.log('✅ Firebase initialized from environment variables');
} else {
  console.error('❌ No Firebase credentials found! Provide serviceAccountKey.json or set env variables.');
  process.exit(1);
}

admin.initializeApp({
  credential,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'job-finder-bdd05.firebasestorage.app',
});

const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();

module.exports = { admin, db, auth, bucket };
