const express = require('express');
const {
  getVehicles,
  getFeatured,
  getLatest,
  getCategories,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateStatus,
  deleteVehicle,
} = require('../controllers/vehicle.controller');
const { rewatermarkVehicles } = require('../controllers/rewatermark.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public
router.get('/', getVehicles);
router.get('/featured', getFeatured);
router.get('/latest', getLatest);
router.get('/categories', getCategories);
router.get('/:id', getVehicle);

// Admin
router.post('/', protect, createVehicle);
// Brings every existing photo up to the current watermark. Safe to re-run.
router.post('/rewatermark', protect, rewatermarkVehicles);
router.put('/:id', protect, updateVehicle);
router.patch('/:id/status', protect, updateStatus);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;
