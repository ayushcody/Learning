const { GoogleGenerativeAI } = require('@google/generative-ai');

let geminiClient = null;

function initGemini() {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    console.log('ℹ️  Gemini API key not set - using fallback hints');
    console.log('💡 To enable Gemini, create a .env file in the server directory with: GEMINI_API_KEY=your_key_here');
    return null;
  }

  try {
    geminiClient = new GoogleGenerativeAI(geminiApiKey);
    console.log('✅ Gemini AI initialized');
  } catch (error) {
    console.warn('⚠️  Gemini initialization failed:', error.message);
    geminiClient = null;
  }

  return geminiClient;
}

initGemini();

const getGeminiClient = () => geminiClient;

module.exports = { getGeminiClient };
