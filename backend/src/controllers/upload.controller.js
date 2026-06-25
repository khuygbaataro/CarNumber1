const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

// Stream a file buffer to Cloudinary and resolve with the upload result.
const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });

// POST /api/upload/images  (protected) — field name: "images" (multiple)
// Also used for single images (logo / banner) — returns an array of URLs.
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'Зураг сонгоно уу');
    }
    const results = await Promise.all(
      req.files.map((file) =>
        uploadBuffer(file.buffer, {
          folder: 'dealership/images',
          resource_type: 'image',
        })
      )
    );
    res.json({ success: true, data: { urls: results.map((r) => r.secure_url) } });
  } catch (error) {
    next(error);
  }
};

// POST /api/upload/video  (protected) — field name: "video" (single)
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'Видео сонгоно уу');
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'dealership/videos',
      resource_type: 'video',
    });
    res.json({ success: true, data: { url: result.secure_url } });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImages, uploadVideo };
