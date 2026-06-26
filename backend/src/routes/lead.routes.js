const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
} = require('../controllers/lead.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Throttle public submissions to limit spam.
const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Хэт олон хүсэлт илгээлээ. Түр хүлээнэ үү.' },
});

router.post('/', createLimiter, createLead); // public
router.get('/', protect, getLeads); // admin
router.patch('/:id', protect, updateLeadStatus); // admin
router.delete('/:id', protect, deleteLead); // admin

module.exports = router;
