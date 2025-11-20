const express = require('express');
const { generateTopicContent } = require('../services/topicContentService');
const { searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply search rate limiting (10 requests/hour)
router.post('/generate-topic-content', searchLimiter, async (req, res) => {
  try {
    const result = await generateTopicContent(req.body.topic);
    res.json({ success: true, ...result });
  } catch (error) {
    const status = error.status || 500;
    console.error('Gemini topic content generation failed:', error.message);
    res.status(status).json({
      success: false,
      error: 'Failed to generate content',
      message: error.message,
    });
  }
});

module.exports = router;
