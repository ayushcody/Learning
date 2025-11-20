const express = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  fetchProfile,
  upsertProfile,
  recordSubmission,
  markModuleComplete,
  markStepComplete,
} = require('../services/profileService');

const router = express.Router();

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const profile = await fetchProfile(req.user.uid);
    res.json(profile || null);
  } catch (error) {
    const status = error.status || 500;
    console.error('Error fetching profile:', error);
    res.status(status).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

router.post('/profile', verifyToken, async (req, res) => {
  try {
    const profile = await upsertProfile(req.user.uid, req.body);
    res.json({ success: true, profile });
  } catch (error) {
    const status = error.status || 500;
    console.error('Error saving profile:', error);
    res.status(status).json({ error: 'Failed to save profile', message: error.message });
  }
});

router.post('/save-submission', verifyToken, async (req, res) => {
  try {
    const submission = await recordSubmission(req.user.uid, req.body);
    res.json({ success: true, submission });
  } catch (error) {
    const status = error.status || 500;
    console.error('Error saving submission:', error);
    res.status(status).json({ error: error.message || 'Failed to save submission' });
  }
});

router.post('/mark-module-complete', verifyToken, async (req, res) => {
  try {
    await markModuleComplete(req.user.uid, req.body);
    res.json({ success: true });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: 'Failed to mark module complete' });
  }
});

router.post('/mark-step-complete', verifyToken, async (req, res) => {
  try {
    await markStepComplete(req.user.uid, req.body);
    res.json({ success: true });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: 'Failed to mark step complete' });
  }
});

module.exports = router;
