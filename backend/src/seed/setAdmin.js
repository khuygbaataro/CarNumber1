require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

/**
 * Change the admin login (email and/or password).
 *
 * Unlike `seed:admin`, this UPDATES the existing admin instead of skipping
 * when one already exists. Run with: npm run admin:set
 *
 * Env vars (set the NEW values you want):
 *   ADMIN_EMAIL      — new login email (required)
 *   ADMIN_PASSWORD   — new password (required)
 *   ADMIN_OLD_EMAIL  — optional: the current email, used to locate the record
 *                      when more than one admin exists. If omitted, the single
 *                      existing admin is updated (or one is created).
 */
(async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const oldEmail = process.env.ADMIN_OLD_EMAIL;

    if (!email || !password) {
      console.error('❌ ADMIN_EMAIL болон ADMIN_PASSWORD-г тохируулна уу.');
      process.exit(1);
    }

    await connectDB();

    // Locate the admin to update: by old email if given, otherwise the single admin.
    let admin = oldEmail
      ? await User.findOne({ email: oldEmail.toLowerCase() })
      : await User.findOne({ role: 'admin' });

    if (admin) {
      admin.email = email.toLowerCase();
      admin.password = password; // pre-save hook re-hashes it
      await admin.save();
      console.log(`✅ Admin шинэчлэгдлээ: ${admin.email}`);
    } else {
      admin = await User.create({ email, password, role: 'admin' });
      console.log(`✅ Admin үүсгэлээ: ${admin.email}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Алдаа: ${error.message}`);
    process.exit(1);
  }
})();
