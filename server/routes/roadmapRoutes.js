const express = require('express');
const { seedRoadmap, getRoadmap } = require('../services/roadmapService');

const router = express.Router();

router.post('/seed', async (req, res) => {
  try {
    const roadmap = await seedRoadmap();
    res.json({ success: true, message: 'Roadmap seeded successfully', roadmap });
  } catch (error) {
    const status = error.status || 500;
    console.error('Error seeding roadmap:', error);
    res.status(status).json({ error: error.message || 'Failed to seed roadmap', message: error.message });
  }
});

router.get('/roadmap/:id', async (req, res) => {
  try {
    const roadmap = await getRoadmap(req.params.id);
    res.json(roadmap);
  } catch (error) {
    const status = error.status || 500;
    console.error('Error fetching roadmap:', error);
    res.status(status).json({ error: status === 404 ? 'Roadmap not found' : 'Failed to fetch roadmap', message: error.message });
  }
});

module.exports = router;
