const TOPIC_CONTENT_COLLECTION = 'topicContent';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const formatTopicKey = (topic = '') => topic.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

const getTopicDocRef = (db, topicKey) =>
  db.collection(TOPIC_CONTENT_COLLECTION).doc(topicKey);

async function getCachedTopicContent(db, topic) {
  const topicKey = formatTopicKey(topic);
  const doc = await getTopicDocRef(db, topicKey).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  // Check TTL (Time To Live)
  if (data.createdAt) {
    const createdAt = data.createdAt.toMillis();
    const now = Date.now();
    const age = now - createdAt;

    if (age > CACHE_TTL_MS) {
      console.log(`⏰ Cache expired for: ${topic} (${Math.round(age / 1000 / 60 / 60)}h old)`);
      // Delete expired cache
      await getTopicDocRef(db, topicKey).delete();
      return null;
    }

    console.log(`✅ Cache hit for: ${topic} (${Math.round(age / 1000 / 60)}min old)`);
  }

  return data;
}

async function cacheTopicContent(db, topic, content, admin) {
  const topicKey = formatTopicKey(topic);
  await getTopicDocRef(db, topicKey).set({
    topic,
    content,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + CACHE_TTL_MS),
  });
  console.log(`💾 Cached: ${topic} (expires in 24h)`);
}

module.exports = {
  formatTopicKey,
  getCachedTopicContent,
  cacheTopicContent,
  TOPIC_CONTENT_COLLECTION,
};
