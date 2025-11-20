/**
 * Pre-caching Service
 * 
 * Pre-caches popular topics on server startup to minimize Gemini API calls.
 * This ensures the most requested topics are always available from cache.
 * 
 * Strategy:
 * - Cache 10 most popular topics on startup
 * - Run in background (non-blocking)
 * - Skip if already cached (check TTL)
 */

const { generateTopicContent } = require('../services/topicContentService');

// Top 10 most requested topics (update based on analytics)
const POPULAR_TOPICS = [
    'Python Basics',
    'JavaScript Fundamentals',
    'React Hooks',
    'Machine Learning',
    'Data Structures',
    'Node.js APIs',
    'SQL Basics',
    'Docker Basics',
    'Git and GitHub',
    'HTML and CSS',
];

let preCacheInProgress = false;
let preCacheComplete = false;
let cachedTopics = 0;

async function preCachePopularTopics() {
    if (preCacheInProgress) {
        console.log('⏳ Pre-caching already in progress...');
        return;
    }

    preCacheInProgress = true;
    console.log('🚀 Starting pre-cache of popular topics...');

    const startTime = Date.now();

    for (const topic of POPULAR_TOPICS) {
        try {
            console.log(`  Checking cache for: ${topic}`);
            const result = await generateTopicContent(topic);

            if (result.cached) {
                console.log(`  ✅ Already cached: ${topic}`);
            } else {
                console.log(`  💾 Newly cached: ${topic}`);
                cachedTopics++;
                // Add delay to avoid hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }
        } catch (error) {
            console.error(`  ❌ Failed to cache ${topic}:`, error.message);
            // Continue with next topic even if one fails
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    preCacheComplete = true;
    preCacheInProgress = false;

    console.log(`✨ Pre-caching complete! ${cachedTopics} new topics cached in ${duration}s`);
}

function getPreCacheStatus() {
    return {
        inProgress: preCacheInProgress,
        complete: preCacheComplete,
        cachedTopics: cachedTopics,
        totalTopics: POPULAR_TOPICS.length,
        popularTopics: POPULAR_TOPICS,
    };
}

module.exports = {
    preCachePopularTopics,
    getPreCacheStatus,
    POPULAR_TOPICS,
};
