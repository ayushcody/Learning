const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

let firebaseInitialized = false;
let db = null;

const WARN_PLACEHOLDER = '⚠️  Using placeholder service account. Please add your Firebase service account JSON.';

/**
 * Loads the Firebase service account JSON either from FIREBASE_SERVICE_ACCOUNT_JSON
 * or the local serviceAccountKey.json fallback file.
 */
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    return null;
  }

  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  if (parsed.PLACEHOLDER) {
    console.warn(WARN_PLACEHOLDER);
    return null;
  }

  return parsed;
}

/**
 * Initializes Firebase Admin SDK once and exposes helpers for other modules.
 */
function initFirebase() {
  if (firebaseInitialized) {
    return { admin, db };
  }

  try {
    const serviceAccount = loadServiceAccount();
    if (serviceAccount && serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      db = admin.firestore();
      console.log('✅ Firebase Admin initialized');
    } else {
      console.warn('⚠️  Firebase Admin not initialized - protected routes will fail');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    if (error.message.includes('PEM') || error.message.includes('private_key')) {
      console.error(
        '💡 Tip: Check your service account JSON. Use PowerShell: $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw .\\serviceAccountKey.json'
      );
    }
  }

  return { admin, db };
}

initFirebase();

const getDb = () => db;
const isFirebaseInitialized = () => firebaseInitialized;

module.exports = {
  admin,
  getDb,
  isFirebaseInitialized,
};
