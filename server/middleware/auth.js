const { admin, getDb, isFirebaseInitialized } = require('../config/firebase');

/**
 * Express middleware that validates Firebase ID tokens and attaches user info to the request.
 */
async function verifyToken(req, res, next) {
  if (!isFirebaseInitialized() || !getDb()) {
    return res.status(503).json({ error: 'Firebase not initialized' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyToken };
