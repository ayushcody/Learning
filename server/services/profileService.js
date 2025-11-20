const { admin, getDb, isFirebaseInitialized } = require('../config/firebase');
const { getUserProfile, saveUserProfile, addSubmission, getUserRef } = require('../models/userModel');

function ensureDb() {
  const db = getDb();
  if (!isFirebaseInitialized() || !db) {
    const error = new Error('Firestore not initialized');
    error.status = 503;
    throw error;
  }
  return db;
}

async function fetchProfile(uid) {
  const db = ensureDb();
  return getUserProfile(db, uid);
}

async function upsertProfile(uid, data) {
  const db = ensureDb();
  const profileData = {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await saveUserProfile(db, uid, profileData);
  return profileData;
}

async function recordSubmission(uid, { stepId, passed, result, source }) {
  if (!stepId) {
    const error = new Error('Missing stepId');
    error.status = 400;
    throw error;
  }

  const db = ensureDb();

  // Flatten/serialize complex nested objects for Firestore
  // Firestore doesn't support deeply nested objects, so we stringify the result
  const submissionData = {
    userId: uid,
    stepId,
    passed: !!passed,
    result: result ? JSON.stringify(result) : '{}',  // Serialize to avoid nested entity error
    source: source || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await addSubmission(db, submissionData);

  const userRef = getUserRef(db, uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const progress = userData.progress || {};

  if (!progress[stepId]) {
    progress[stepId] = { completed: false, attempts: 0 };
  }
  progress[stepId].attempts = (progress[stepId].attempts || 0) + 1;
  if (passed) {
    progress[stepId].completed = true;
    progress[stepId].completedAt = admin.firestore.FieldValue.serverTimestamp();

    // Auto-increment streak when user successfully completes a coding problem
    try {
      const { updateUserStreak } = require('../models/userModel');
      await updateUserStreak(db, uid, admin);
      console.log('✅ Streak updated for user:', uid);
    } catch (streakError) {
      console.warn('Failed to update streak:', streakError.message);
      // Don't fail the submission if streak update fails
    }
  }

  await userRef.set({ progress }, { merge: true });

  return submissionData;
}

async function markModuleComplete(uid, { moduleId, topicId }) {
  const db = ensureDb();
  const userRef = getUserRef(db, uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const moduleProgress = userData.moduleProgress || {};

  if (!moduleProgress[topicId]) {
    moduleProgress[topicId] = {};
  }

  moduleProgress[topicId][moduleId] = {
    completed: true,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.set({ moduleProgress }, { merge: true });
  return { success: true };
}

async function markStepComplete(uid, { stepId }) {
  const db = ensureDb();
  const userRef = getUserRef(db, uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const progress = userData.progress || {};

  progress[stepId] = {
    completed: true,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    attempts: progress[stepId]?.attempts || 1,
  };

  await userRef.set({ progress }, { merge: true });
  return { success: true };
}

module.exports = {
  fetchProfile,
  upsertProfile,
  recordSubmission,
  markModuleComplete,
  markStepComplete,
};
