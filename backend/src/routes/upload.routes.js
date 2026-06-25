const express = require('express');
const {
  uploadImages,
  uploadVideo,
} = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/images', protect, upload.array('images', 12), uploadImages);
router.post('/video', protect, upload.single('video'), uploadVideo);

module.exports = router;
