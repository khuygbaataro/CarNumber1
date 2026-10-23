const express = require('express');
const { trackView, getTraffic } = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public: the site reports its own page views here.
router.post('/view', trackView);
// Admin: the dashboard reads them back.
router.get('/traffic', protect, getTraffic);

module.exports = router;
