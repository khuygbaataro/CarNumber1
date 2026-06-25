require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ensureAdmin = require('./ensureAdmin');

/**
 * Standalone admin seeder. Run with: npm run seed:admin
 * (For cloud deploys without shell access, set SEED_ON_START=true instead.)
 */
(async () => {
  try {
    await connectDB();
    await ensureAdmin();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Алдаа: ${error.message}`);
    process.exit(1);
  }
})();
