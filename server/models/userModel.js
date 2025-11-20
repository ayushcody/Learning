const USERS_COLLECTION = 'users';
const SUBMISSIONS_COLLECTION = 'submissions';

const getUserRef = (db, uid) => db.collection(USERS_COLLECTION).doc(uid);

async function getUserProfile(db, uid) {
  const doc = await getUserRef(db, uid).get();
  return doc.exists ? doc.data() : null;
}

async function saveUserProfile(db, uid, data) {
  await getUserRef(db, uid).set(data, { merge: true });
}

async function addSubmission(db, submission) {
  await db.collection(SUBMISSIONS_COLLECTION).add(submission);
}

async function updateUserStreak(db, uid, admin) {
  const userRef = getUserRef(db, uid);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const streaks = userData.streaks || { current: 0, longest: 0, lastVisit: null };
  const dailyVisits = userData.dailyVisits || [];

  // Check if user already checked in today
  if (dailyVisits.includes(today)) {
    return streaks; // Already checked in today
  }

  const lastVisit = streaks.lastVisit;
  let newCurrent = streaks.current || 0;

  if (lastVisit) {
    const lastDate = new Date(lastVisit);
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      newCurrent += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      newCurrent = 1;
    }
    // If daysDiff === 0, same day (shouldn't happen due to check above)
  } else {
    // First visit
    newCurrent = 1;
  }

  const newLongest = Math.max(newCurrent, streaks.longest || 0);

  const updatedStreaks = {
    current: newCurrent,
    longest: newLongest,
    lastVisit: today,
  };

  // Keep only last 30 days of visits
  const updatedVisits = [...dailyVisits, today].slice(-30);

  await userRef.set({
    streaks: updatedStreaks,
    dailyVisits: updatedVisits,
    lastCheckin: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return updatedStreaks;
}

async function getUserStreakData(db, uid) {
  const userRef = getUserRef(db, uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return {
      current: 0,
      longest: 0,
      lastVisit: null,
      dailyVisits: [],
    };
  }

  const userData = userDoc.data();
  return {
    current: userData.streaks?.current || 0,
    longest: userData.streaks?.longest || 0,
    lastVisit: userData.streaks?.lastVisit || null,
    dailyVisits: userData.dailyVisits || [],
  };
}

module.exports = {
  USERS_COLLECTION,
  SUBMISSIONS_COLLECTION,
  getUserProfile,
  saveUserProfile,
  addSubmission,
  getUserRef,
  updateUserStreak,
  getUserStreakData,
};
