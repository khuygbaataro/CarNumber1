const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Keep files in memory so we can stream the buffer straight to Cloudinary.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Зөвхөн зураг болон видео оруулах боломжтой'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (covers videos)
});

module.exports = upload;
