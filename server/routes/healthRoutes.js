const express = require('express');
const { isFirebaseInitialized } = require('../config/firebase');
const { getGeminiClient } = require('../config/gemini');
const { getPreCacheStatus } = require('../services/preCacheService');

const router = express.Router();

router.get('/health', (req, res) => {
  const preCacheStatus = getPreCacheStatus();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firebase: isFirebaseInitialized(),
      gemini: !!getGeminiClient(),
    },
    cache: {
      preCacheComplete: preCacheStatus.complete,
      cachedTopics: preCacheStatus.cachedTopics,
      totalPopularTopics: preCacheStatus.totalTopics,
      popularTopics: preCacheStatus.popularTopics,
    },
  });
});

module.exports = router;
