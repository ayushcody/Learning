const express = require('express');
const {
  generateAssessmentQuestions,
  analyzeAssessmentResults,
  generateRemarks,
  generateCodeProblem,
} = require('../services/assessmentService');
const { assessmentLimiter, geminiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply assessment rate limiting (3 requests per 15 minutes)
router.post('/generate-assessment', assessmentLimiter, async (req, res) => {
  try {
    const questions = await generateAssessmentQuestions(req.body);
    res.json({ success: true, questions });
  } catch (error) {
    const status = error.status || 500;
    console.error('Gemini assessment generation failed:', error.message);
    res.status(status).json({ error: 'Failed to generate assessment', message: error.message });
  }
});

router.post('/analyze-assessment', async (req, res) => {
  try {
    const analysis = await analyzeAssessmentResults(req.body);
    res.status(200).json(analysis);
  } catch (error) {
    const status = error.status || 500;
    if (status === 503) {
      return res.status(status).json({ error: 'Gemini AI is not configured' });
    }
    res.status(status).json({ error: 'Failed to analyze assessment' });
  }
});

router.post('/generate-remarks', async (req, res) => {
  try {
    const remarks = await generateRemarks(req.body);
    res.json(remarks);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: 'Failed to generate remarks' });
  }
});

router.post('/generate-code-problem', async (req, res) => {
  try {
    const problem = await generateCodeProblem(req.body);
    res.json(problem);
  } catch (error) {
    const status = error.status || 500;
    console.error('Gemini code problem generation failed:', error.message);
    res.status(status).json({ error: 'Failed to generate code problem', message: error.message });
  }
});

module.exports = router;
