const express = require('express');
const {
  getVehicles,
  getFeatured,
  getLatest,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateStatus,
  deleteVehicle,
} = require('../controllers/vehicle.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public
router.get('/', getVehicles);
router.get('/featured', getFeatured);
router.get('/latest', getLatest);
router.get('/:id', getVehicle);

// Admin
router.post('/', protect, createVehicle);
router.put('/:id', protect, updateVehicle);
router.patch('/:id/status', protect, updateStatus);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;
