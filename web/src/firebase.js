/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase Auth for client-side authentication.
 * 
 * Environment Variables Required (from .env):
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * 
 * Usage:
 * - Import auth from this file: `import { auth } from './firebase'`
 * - Use Firebase Auth methods: signInWithEmailAndPassword, createUserWithEmailAndPassword
 * - Get ID tokens for API calls: `await user.getIdToken()`
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase (with error handling)
let app;
let auth;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== '') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
  } else {
    console.error('❌ Firebase config not found. Please set up .env file in web/ directory with:');
    console.error('   VITE_FIREBASE_API_KEY=your_key');
    console.error('   VITE_FIREBASE_AUTH_DOMAIN=your_domain');
    console.error('   VITE_FIREBASE_PROJECT_ID=your_project_id');
    console.error('   VITE_FIREBASE_STORAGE_BUCKET=your_bucket');
    console.error('   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id');
    console.error('   VITE_FIREBASE_APP_ID=your_app_id');
    // Create a mock auth object to prevent crashes
    auth = null;
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('💡 Make sure all Firebase environment variables are set in web/.env file');
  auth = null;
}

export { auth };

export default app;

