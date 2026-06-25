require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const ensureAdmin = require('./src/seed/ensureAdmin');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Handy for cloud deploys without shell access: create the admin on boot.
  if (process.env.SEED_ON_START === 'true') {
    await ensureAdmin();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

start();
