require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

/**
 * Creates the single admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Idempotent: running it again does nothing if the admin exists.
 * Run with: npm run seed:admin
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.error('❌ ADMIN_EMAIL болон ADMIN_PASSWORD тохируулна уу (.env)');
      process.exit(1);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`ℹ️  Admin аль хэдийн үүссэн байна: ${email}`);
    } else {
      await User.create({ email, password, role: 'admin' });
      console.log(`✅ Admin үүсгэлээ: ${email}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Алдаа: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
