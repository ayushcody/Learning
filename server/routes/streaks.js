const express = require('express');
const { admin, getDb, isFirebaseInitialized } = require('../config/firebase');
const { updateUserStreak, getUserStreakData } = require('../models/userModel');

const router = express.Router();

function ensureDb() {
    const db = getDb();
    if (!isFirebaseInitialized() || !db) {
        const error = new Error('Firestore not initialized');
        error.status = 503;
        throw error;
    }
    return db;
}

// Get current streak data
router.get('/', async (req, res) => {
    try {
        const db = ensureDb();
        const uid = req.user?.uid;

        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const streakData = await getUserStreakData(db, uid);
        res.json({ success: true, streak: streakData });
    } catch (error) {
        console.error('Get streak error:', error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

// Daily check-in to maintain/increment streak
router.post('/check-in', async (req, res) => {
    try {
        const db = ensureDb();
        const uid = req.user?.uid;

        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const updatedStreak = await updateUserStreak(db, uid, admin);

        // Check if it's a milestone (every 7 days)
        const isMilestone = updatedStreak.current > 0 && updatedStreak.current % 7 === 0;
        const isNewRecord = updatedStreak.current === updatedStreak.longest && updatedStreak.current > 1;

        res.json({
            success: true,
            streak: updatedStreak,
            milestone: isMilestone,
            newRecord: isNewRecord,
            message: isMilestone
                ? `🎉 Amazing! ${updatedStreak.current} day streak!`
                : isNewRecord
                    ? `🏆 New personal record: ${updatedStreak.current} days!`
                    : `🔥 ${updatedStreak.current} day streak!`,
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

module.exports = router;
