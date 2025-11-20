const { getDb, isFirebaseInitialized } = require('../config/firebase');
const { buildFullStackRoadmap, DEFAULT_ROADMAP_ID, ROADMAP_COLLECTION } = require('../models/roadmapModel');

function ensureDb() {
  const db = getDb();
  if (!isFirebaseInitialized() || !db) {
    const error = new Error('Firestore not initialized');
    error.status = 503;
    throw error;
  }
  return db;
}

async function seedRoadmap() {
  const db = ensureDb();
  const roadmap = buildFullStackRoadmap();
  await db.collection(ROADMAP_COLLECTION).doc(DEFAULT_ROADMAP_ID).set(roadmap);
  return roadmap;
}

async function getRoadmap(id) {
  const db = ensureDb();
  const doc = await db.collection(ROADMAP_COLLECTION).doc(id).get();
  if (!doc.exists) {
    const error = new Error('Roadmap not found');
    error.status = 404;
    throw error;
  }
  return doc.data();
}

module.exports = {
  seedRoadmap,
  getRoadmap,
};
