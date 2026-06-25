const express = require('express');
const {
  getSettings,
  updateSettings,
} = require('../controllers/settings.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getSettings); // public
router.put('/', protect, updateSettings); // admin

module.exports = router;
