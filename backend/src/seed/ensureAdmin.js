const User = require('../models/User');

/**
 * Create the single admin from ADMIN_EMAIL / ADMIN_PASSWORD if it does not
 * already exist. Assumes the DB connection is already open. Idempotent.
 */
async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD тохируулаагүй тул admin үүсгэсэнгүй.');
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`ℹ️  Admin аль хэдийн үүссэн байна: ${email}`);
    return;
  }

  await User.create({ email, password, role: 'admin' });
  console.log(`✅ Admin үүсгэлээ: ${email}`);
}

module.exports = ensureAdmin;
