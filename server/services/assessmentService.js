const { getGeminiClient } = require('../config/gemini');

function requireGemini() {
  const client = getGeminiClient();
  if (!client) {
    const error = new Error('Gemini AI is not configured');
    error.status = 503;
    throw error;
  }
  return client;
}

function sanitizeJsonResponse(text) {
  return text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

async function generateAssessmentQuestions({ topic, difficulty = 'Beginner', count = 7, modules = [] }) {
  if (!topic) {
    const error = new Error('Topic is required');
    error.status = 400;
    throw error;
  }

  const client = requireGemini();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });

  // If modules provided, generate questions mapped to modules
  const moduleInfo = modules.length > 0
    ? `\nThe questions should cover these learning modules (distribute questions evenly):\n${modules.map((m, i) => `${i + 1}. ${m.name}: ${m.topics.join(', ')}`).join('\n')}\n\nFor each question, specify which module it tests using the "relatedModule" field with the exact module name.`
    : '';

  const prompt = `Generate exactly ${count} assessment questions about "${topic}" at ${difficulty} level.${moduleInfo}
    
The questions should test understanding of key concepts, practical applications, and problem-solving skills.
Include a mix of theoretical and practical questions.

Return a JSON array of questions, each with this structure:
[
  {
    "id": 1,
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct",
    "relatedModule": "${modules.length > 0 ? modules[0].name : 'General'}"
  }
]

IMPORTANT: 
- Return ONLY valid JSON array, no markdown, no code blocks, just the raw JSON
- Make sure there are exactly ${count} questions
- ${modules.length > 0 ? 'Each question MUST have a "relatedModule" field matching one of the module names provided' : ''}
- Distribute questions evenly across all modules`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jsonText = sanitizeJsonResponse(response.text());
  const questions = JSON.parse(jsonText);
  return Array.isArray(questions) ? questions.slice(0, count) : [questions].slice(0, count);
}

async function analyzeAssessmentResults({ topic, experienceLevel, answeredQuestions = [], score, totalQuestions }) {
  const client = requireGemini();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const wrongAnswers = answeredQuestions.filter((q) => !q.isCorrect);

  const prompt = `Analyze the assessment results for a student learning "${topic}":

Experience Level: ${experienceLevel}
Score: ${score}/${totalQuestions} (${percentage}%)
Wrong Answers: ${wrongAnswers.map((q) => q.question).join('; ')}

Provide analysis in JSON format:
{
  "weakAreas": ["Area 1", "Area 2", "Area 3"],
  "recommendations": "Specific recommendation text on what concepts to focus on",
  "strengths": ["Strength 1", "Strength 2"]
}

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = JSON.parse(sanitizeJsonResponse(response.text()));
    return {
      success: true,
      score,
      percentage,
      ...analysis,
      fallback: false,
    };
  } catch (error) {
    console.error('Gemini assessment analysis failed:', error.message);
    return {
      success: true,
      score,
      percentage,
      weakAreas: answeredQuestions.filter((q) => !q.isCorrect).map((q) => q.question).slice(0, 3),
      recommendations: 'Focus on the topics you got wrong. Review the concepts and practice more.',
      fallback: true,
    };
  }
}

async function generateRemarks({ topic, score, totalQuestions, percentage, weakAreas = [] }) {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: true,
      remarks: `Focus on reviewing the concepts you got wrong. Practice more exercises related to: ${weakAreas.slice(0, 2).join(', ') || 'the weak areas'
        }.`,
    };
  }

  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });

  const prompt = `The student scored ${score}/${totalQuestions} (${percentage}%) on an assessment about "${topic}".

Weak areas identified: ${weakAreas?.join(', ') || 'Various concepts'}

Provide specific, actionable feedback in 2-3 sentences focusing on:
1. What specific concepts they should focus on
2. How to improve their understanding
3. Practical steps to strengthen weak areas

Return ONLY the feedback text, no JSON, no quotes, just plain text recommendations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      remarks: response.text().trim(),
    };
  } catch (error) {
    console.error('Gemini remarks generation failed:', error.message);
    return {
      success: true,
      remarks: `Focus on reviewing the concepts you got wrong. Practice more exercises related to: ${weakAreas.slice(0, 2).join(', ') || 'the weak areas'
        }.`,
    };
  }
}

async function generateCodeProblem({ topic, difficulty = 'Easy', language = 'javascript' }) {
  if (!topic) {
    const error = new Error('Topic is required');
    error.status = 400;
    throw error;
  }

  const langSignatures = {
    javascript: 'function solve(param1, param2) {\n  // Your code here\n  return;\n}',
    python: 'def solve(param1, param2):\n    # Your code here\n    pass',
    java: 'public static int solve(int param1, int param2) {\n    // Your code here\n    return 0;\n}',
    cpp: 'int solve(int param1, int param2) {\n    // Your code here\n    return 0;\n}',
  };

  const initialCode = langSignatures[language] || langSignatures.javascript;

  const client = requireGemini();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  });

  const prompt = `Generate a ${difficulty} level coding problem specifically related to "${topic}". 
    
The problem MUST be directly related to ${topic} concepts, techniques, or applications. 
For example, if the topic is "Linear Algebra", create a problem involving matrix operations, vectors, or linear transformations.
If the topic is "HTML/CSS", create a problem about styling, layout, or markup.
Make it practical and educational.

Return a JSON object with this structure:
{
  "title": "Problem Title (related to ${topic})",
  "description": "Detailed problem description directly related to ${topic}. Explain what needs to be solved.",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "examples": [
    {
      "input": "example input",
      "output": "example output",
      "explanation": "explanation showing how this relates to ${topic}"
    }
  ],
  "constraints": ["Constraint 1", "Constraint 2"],
  "functionSignature": "${initialCode}",
  "initialCode": "${initialCode}",
  "language": "${language}",
  "testCases": [
    {
      "description": "Short label",
      "args": ["argument list or leave empty"],
      "expected": "expected return value"
    }
  ]
}

IMPORTANT: The problem MUST be directly related to ${topic}. Return ONLY valid JSON, no markdown, no code blocks, just the raw JSON object.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jsonText = sanitizeJsonResponse(response.text());
  const problem = JSON.parse(jsonText);
  return { success: true, problem };
}

/**
 * Calculate per-module performance from assessment results
 * Returns which modules the user is strong vs weak in
 * 
 * @param {Array} answeredQuestions - Questions with isCorrect and relatedModule
 * @param {Array} allModules - All modules from the roadmap
 * @returns {Object} { moduleScores, strongModules, weakModules }
 */
function calculateModulePerformance(answeredQuestions, allModules = []) {
  const moduleScores = {};
  const threshold = 0.75; // 75% correct = strong in module

  // Initialize all modules
  allModules.forEach(module => {
    moduleScores[module.name] = {
      correct: 0,
      total: 0,
      percentage: 0,
      isStrong: false,
    };
  });

  // Count correct/total per module
  answeredQuestions.forEach(q => {
    const moduleName = q.relatedModule || 'General';

    if (moduleScores[moduleName]) {
      moduleScores[moduleName].total++;
      if (q.isCorrect) {
        moduleScores[moduleName].correct++;
      }
    }
  });

  // Calculate percentages and determine strong vs weak
  const strongModules = [];
  const weakModules = [];

  Object.keys(moduleScores).forEach(moduleName => {
    const score = moduleScores[moduleName];

    if (score.total > 0) {
      score.percentage = Math.round((score.correct / score.total) * 100);
      score.isStrong = score.correct / score.total >= threshold;

      if (score.isStrong) {
        strongModules.push({
          name: moduleName,
          score: score.percentage,
          reason: `${score.correct}/${score.total} correct (${score.percentage}%)`
        });
      } else {
        weakModules.push({
          name: moduleName,
          score: score.percentage,
          reason: `${score.correct}/${score.total} correct (${score.percentage}%)`
        });
      }
    }
  });

  return {
    moduleScores,
    strongModules,
    weakModules,
    summary: {
      total: answeredQuestions.length,
      strong: strongModules.length,
      weak: weakModules.length,
    }
  };
}

module.exports = {
  generateAssessmentQuestions,
  analyzeAssessmentResults,
  generateRemarks,
  generateCodeProblem,
  calculateModulePerformance,
};
