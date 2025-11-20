require('./config/env');
require('./config/firebase');
require('./config/gemini');

const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');
const codeRoutes = require('./routes/codeRoutes');
const topicRoutes = require('./routes/topicRoutes');
const profileRoutes = require('./routes/profileRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const streaksRoutes = require('./routes/streaks');

const { generalLimiter } = require('./middleware/rateLimiter');
const { preCachePopularTopics } = require('./services/preCacheService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

app.use('/api', healthRoutes);
app.use('/api', roadmapRoutes);
app.use('/api', codeRoutes);
app.use('/api', topicRoutes);
app.use('/api', profileRoutes);
app.use('/api', assessmentRoutes);
app.use('/api/streak', streaksRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

  // Pre-cache popular topics in background (non-blocking)
  console.log('🔄 Starting background pre-cache of popular topics...');
  setTimeout(() => {
    preCachePopularTopics().catch(err => {
      console.error('Pre-cache failed:', err.message);
    });
  }, 5000); // Wait 5 seconds after server starts
});
