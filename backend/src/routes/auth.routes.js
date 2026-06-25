const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Throttle login attempts to slow down brute-force guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Хэт олон оролдлого. Түр хүлээнэ үү.' },
});

router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);

module.exports = router;
