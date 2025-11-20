const { getGeminiClient } = require('../config/gemini');
const { FALLBACK_HINTS } = require('../utils/constants');

async function requestGeminiHint({ stepTitle, failingTest, userCode, hintLevel }) {
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    return null;
  }

  try {
    const model = geminiClient.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    });

    const prompt = `You are a helpful coding tutor. Provide a brief, friendly hint (1-3 sentences) to help the student solve this problem. DO NOT give the full solution, only a gentle nudge.

Step: ${stepTitle || 'Coding challenge'}
Failing test: ${failingTest || 'N/A'}
Student's code:
\`\`\`
${userCode || 'No code provided'}
\`\`\`

Hint level: ${hintLevel}

Provide a helpful hint:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.warn('Gemini hint failed, using fallback:', error.message);
    return null;
  }
}

async function getHint({ userCode, failingTest, stepTitle, hintLevel = 1 }) {
  const hint = await requestGeminiHint({ userCode, failingTest, stepTitle, hintLevel });
  if (hint) {
    return { hint, source: 'gemini' };
  }
  const fallbackHint = FALLBACK_HINTS[hintLevel % FALLBACK_HINTS.length];
  return { hint: fallbackHint, source: 'fallback' };
}

module.exports = {
  getHint,
};
