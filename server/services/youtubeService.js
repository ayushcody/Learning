/**
 * YouTube Service
 * 
 * Uses YouTube Data V3 API to validate and get proper YouTube video links.
 * Replaces Gemini's grounding redirect URLs with real YouTube URLs.
 * 
 * API Documentation: https://developers.google.com/youtube/v3/docs
 * 
 * Environment Variables:
 * - YOUTUBE_API_KEY: Your YouTube Data V3 API key
 * 
 * Features:
 * - Search for videos by title
 * - Extract video metadata (title, duration, thumbnail)
 * - Validate video IDs
 * - Get proper youtube.com/watch?v=VIDEO_ID URLs
 */

const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search YouTube for videos matching a query
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return (default: 3)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchYouTubeVideos(query, maxResults = 3) {
    if (!YOUTUBE_API_KEY) {
        console.warn('⚠️ YouTube API key not configured');
        return [];
    }

    try {
        const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: maxResults,
                key: YOUTUBE_API_KEY,
                relevanceLanguage: 'en',
                safeSearch: 'moderate',
                videoEmbeddable: 'true',
            },
        });

        const videos = response.data.items || [];

        // Get video durations (requires separate call)
        const videoIds = videos.map(v => v.id.videoId).join(',');
        const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
            params: {
                part: 'contentDetails,statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY,
            },
        });

        const videoDetails = detailsResponse.data.items || [];

        // Combine data
        return videos.map((video, index) => {
            const details = videoDetails.find(d => d.id === video.id.videoId);
            const duration = details ? parseDuration(details.contentDetails.duration) : 'Unknown';

            return {
                title: video.snippet.title,
                url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
                description: video.snippet.description.substring(0, 150) + '...',
                duration: duration,
                thumbnail: video.snippet.thumbnails.medium.url,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
            };
        });
    } catch (error) {
        console.error('YouTube API error:', error.response?.data || error.message);
        return [];
    }
}

/**
 * Parse ISO 8601 duration format to human-readable
 * Example: PT1H2M10S -> "1h 2m"
 */
function parseDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';

    const hours = match[1] ? `${match[1]}h ` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    const seconds = !hours && !minutes && match[3] ? `${match[3]}s` : '';

    return (hours + minutes + seconds).trim() || 'Unknown';
}

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - Grounding API redirects (attempts to extract)
 */
function extractVideoId(url) {
    if (!url) return null;

    // Standard youtube.com/watch?v=
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];

    // Short youtu.be/
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];

    // Try to find any 11-character YouTube video ID pattern
    const idMatch = url.match(/([a-zA-Z0-9_-]{11})/);
    if (idMatch) return idMatch[1];

    return null;
}

/**
 * Validate and fix YouTube URL
 * If URL is invalid or is a grounding redirect, searches for the video by title
 */
async function validateYouTubeUrl(url, title) {
    // Try to extract video ID first
    const videoId = extractVideoId(url);

    if (videoId) {
        // Validate that this video ID exists
        try {
            const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
                params: {
                    part: 'snippet',
                    id: videoId,
                    key: YOUTUBE_API_KEY,
                },
            });

            if (response.data.items && response.data.items.length > 0) {
                console.log(`✅ Valid YouTube video ID: ${videoId}`);
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        } catch (error) {
            console.log(`❌ Invalid video ID: ${videoId}`);
        }
    }

    // If URL is invalid or video doesn't exist, search by title
    if (title) {
        console.log(`🔍 Searching YouTube for: "${title}"`);
        const videos = await searchYouTubeVideos(title, 1);

        if (videos.length > 0) {
            console.log(`✅ Found replacement: ${videos[0].url}`);
            return videos[0].url;
        }
    }

    return null;
}

/**
 * Get YouTube videos for a topic
 * Searches for high-quality tutorials
 */
async function getYouTubeVideosForTopic(topic) {
    const query = `${topic} tutorial programming`;
    console.log(`🎥 Searching YouTube for: "${query}"`);

    const videos = await searchYouTubeVideos(query, 4);

    if (videos.length > 0) {
        console.log(`✅ Found ${videos.length} YouTube videos`);
    } else {
        console.log(`⚠️ No YouTube videos found for: ${topic}`);
    }

    return videos;
}

module.exports = {
    searchYouTubeVideos,
    validateYouTubeUrl,
    extractVideoId,
    getYouTubeVideosForTopic,
};
