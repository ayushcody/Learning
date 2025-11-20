const express = require('express');
const { runCode, runCodeWithTests } = require('../services/codeExecutionService');
const { getHint } = require('../services/hintService');

const router = express.Router();

router.post('/run-code', async (req, res) => {
  const hasTests = Array.isArray(req.body.tests) && req.body.tests.length > 0;

  try {
    if (hasTests) {
      const result = await runCodeWithTests({
        language: req.body.language,
        source: req.body.source,
        tests: req.body.tests,
        functionSignature: req.body.functionSignature,
      });
      res.json(result);
      return;
    }

    const result = await runCode(req.body);
    res.json(result);
  } catch (error) {
    const status = error.status || 500;
    console.error('Judge0 error:', error.response?.data || error.message);
    res.status(status).json({
      error: 'Code execution failed',
      message: error.response?.data?.error || error.message,
    });
  }
});

router.post('/hint', async (req, res) => {
  try {
    const hintResponse = await getHint({
      userCode: req.body.user_code,
      failingTest: req.body.failing_test,
      stepTitle: req.body.step_title,
      hintLevel: req.body.hint_level,
    });
    res.json(hintResponse);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to get hint' });
  }
});

module.exports = router;
