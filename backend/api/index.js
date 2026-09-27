// Vercel entry point.
//
// The platform invokes an exported handler per request — there is no
// long-running process to call app.listen, so that stays in server.js for
// running locally. Everything routes here via vercel.json.
const mongoose = require('mongoose');
const app = require('../src/app');

// A warm function keeps its connection; a cold one opens it once. Without
// this guard every request would dial Mongo again and exhaust the pool.
// src/config/db.js is not reused here because it calls process.exit on
// failure, which would take the whole function down instead of failing
// the one request.
let connecting = null;

async function connect() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) connecting = mongoose.connect(process.env.MONGODB_URI);
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (err) {
    // Clear it so the next request retries rather than awaiting a promise
    // that already rejected.
    connecting = null;
    // Logged, because the response deliberately says nothing about why —
    // without this the only clue to a bad URI or a blocked IP is a 503.
    console.error('[db] connection failed:', err && err.message);
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end(
      JSON.stringify({ success: false, message: 'Database unavailable' })
    );
  }
  return app(req, res);
};
