const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Loads environment variables and warns if the local .env file is missing.
 * This mirrors the behavior from the previous monolithic server entry point.
 */
function loadEnv() {
  dotenv.config();

  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  No .env file found in server directory. Create one from .env.example');
  }
}

loadEnv();

module.exports = {};
