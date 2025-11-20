const axios = require('axios');
const { admin, getDb, isFirebaseInitialized } = require('../config/firebase');
const { getGeminiClient } = require('../config/gemini');
const { getCachedTopicContent, cacheTopicContent } = require('../models/topicContentModel');

function ensureDb() {
  const db = getDb();
  if (!isFirebaseInitialized() || !db) {
    const error = new Error('Database not initialized');
    error.status = 503;
    throw error;
  }
  return db;
}

async function validateYouTubeUrl(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function fetchGeminiContent(topic) {
  const geminiClient = getGeminiClient();
  if (!geminiClient) {
    const error = new Error('Gemini AI is not configured');
    error.status = 503;
    throw error;
  }

  const model = geminiClient.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    tools: [{ googleSearch: {} }],
  });

  const prompt = `Generate educational content for "${topic}". 
  
  STEP 1: Use Google Search to find 3-4 REAL, HIGH-QUALITY YouTube tutorials for this topic. You MUST use the search tool.
  STEP 2: Generate the content in JSON format.
  
  Return ONLY valid JSON:
{
  "description": "Brief explanation (2 paragraphs)",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "prerequisites": ["Prereq 1", "Prereq 2"],
  "youtubeCourses": [
    {
      "title": "Exact Video Title from Search",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "description": "Brief description",
      "duration": "Duration"
    }
  ],
  "learningPath": {
    "duration": "Total duration",
    "difficulty": "Level",
    "modules": [
      {"id": "m1", "name": "Module Name", "duration": "Duration", "topics": ["Topic 1", "Topic 2"]}
    ]
  }
}
  
  Constraint: JSON only. No markdown. Ensure the YouTube URLs are from the search results.`;

  // Use unique timer label to avoid duplicates
  const timerLabel = `GeminiGeneration-${Date.now()}`;
  let timerStarted = false;

  try {
    console.time(timerLabel);
    timerStarted = true;

    const result = await model.generateContent(prompt);
    console.timeEnd(timerLabel);
    timerStarted = false;

    const response = await result.response;
    let jsonText = response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('🔍 Gemini Raw Response (Snippet):', jsonText.substring(0, 200) + '...');

    // Log grounding metadata if available to verify search was used
    if (result.response.candidates && result.response.candidates[0].groundingMetadata) {
      console.log('🌍 Grounding Metadata:', JSON.stringify(result.response.candidates[0].groundingMetadata, null, 2));
    }

    // Check if response is empty
    if (!jsonText || jsonText.length === 0) {
      console.error('⚠️ Gemini returned empty response text');
      throw new Error('Gemini returned empty response. The API may be overloaded. Please try again.');
    }

    // Better JSON parsing with error handling
    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw text that failed to parse:', jsonText);

      // Try to extract JSON from text if it's wrapped
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          throw new Error('Failed to parse Gemini response as JSON');
        }
      }
      throw new Error('Failed to parse Gemini response as JSON. The response may be incomplete.');
    }
  } catch (error) {
    // Clean up timer if it was started
    if (timerStarted) {
      try {
        console.timeEnd(timerLabel);
      } catch (timerError) {
        // Ignore timer errors
      }
    }
    throw error;
  }
}

async function sanitizeContent(content, topic) {
  const { validateYouTubeUrl, getYouTubeVideosForTopic } = require('./youtubeService');
  const result = { ...content };

  if (Array.isArray(result.youtubeCourses)) {
    const validCourses = [];

    for (const course of result.youtubeCourses) {
      if (!course?.url || !course?.title) {
        continue;
      }

      // Check if URL is a grounding redirect (not a real YouTube URL)
      const isGroundingRedirect = course.url.includes('vertexaisearch.cloud.google.com') ||
        course.url.includes('grounding-api-redirect');

      if (isGroundingRedirect) {
        console.log(`🔄 Grounding redirect detected, validating: ${course.title}`);
        // Try to find the real YouTube URL by searching for the title
        const validUrl = await validateYouTubeUrl(course.url, course.title);

        if (validUrl) {
          course.url = validUrl;
          validCourses.push(course);
          console.log(`✅ Replaced with: ${validUrl}`);
        } else {
          console.log(`❌ Could not find valid URL for: ${course.title}`);
        }
      } else if (course.url.includes('youtube.com/watch') || course.url.includes('youtu.be/')) {
        // Real YouTube URL, validate it
        const validUrl = await validateYouTubeUrl(course.url, course.title);
        if (validUrl) {
          course.url = validUrl;
          validCourses.push(course);
        }
      }
    }

    // If we have fewer than 3 valid courses, search YouTube directly
    if (validCourses.length < 3 && topic) {
      console.log(`⚠️ Only ${validCourses.length} valid videos, searching YouTube for more...`);
      const additionalVideos = await getYouTubeVideosForTopic(topic);

      // Add YouTube search results (avoid duplicates)
      const existingTitles = new Set(validCourses.map(c => c.title.toLowerCase()));
      for (const video of additionalVideos) {
        if (!existingTitles.has(video.title.toLowerCase()) && validCourses.length < 4) {
          validCourses.push(video);
          console.log(`✅ Added from YouTube search: ${video.title}`);
        }
      }
    }

    result.youtubeCourses = validCourses;
    console.log(`📺 Final video count: ${validCourses.length}`);
  }

  if (result.learningPath?.modules) {
    result.learningPath.modules = result.learningPath.modules.map((module, index) => ({
      ...module,
      id: module.id || `module-${index + 1}`,
    }));
  }

  return result;
}

async function generateTopicContent(topic) {
  if (!topic) {
    const error = new Error('Topic is required');
    error.status = 400;
    throw error;
  }

  const db = ensureDb();

  try {
    const cachedDoc = await getCachedTopicContent(db, topic);
    if (cachedDoc) {
      console.log(`✅ Using cached content for: ${topic}`);
      return { cached: true, content: cachedDoc.content };
    }
  } catch (error) {
    console.warn('Cache check failed:', error.message);
  }

  const rawContent = await fetchGeminiContent(topic);
  const content = await sanitizeContent(rawContent, topic);

  try {
    await cacheTopicContent(db, topic, content, admin);
    console.log(`✅ Cached content for: ${topic}`);
  } catch (cacheError) {
    console.warn('Failed to cache content:', cacheError.message);
  }

  return { cached: false, content };
}

module.exports = {
  generateTopicContent,
};
