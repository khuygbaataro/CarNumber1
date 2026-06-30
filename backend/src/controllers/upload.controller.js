const cloudinary = require('../config/cloudinary');
const Settings = require('../models/Settings');
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

// Map a friendly position name to a Cloudinary gravity.
const POSITION_GRAVITY = {
  'bottom-right': 'south_east',
  'bottom-left': 'south_west',
  'top-right': 'north_east',
  'top-left': 'north_west',
  center: 'center',
};

/**
 * Build a Cloudinary "incoming" transformation from site settings.
 * Because we pass this on upload, Cloudinary stores ONLY the processed image —
 * the original high-res file is never persisted (saves storage).
 *
 * @param {object} settings  the singleton Settings document
 * @param {boolean} watermark  whether to bake the text watermark in (vehicle photos only)
 */
const buildImageTransformation = (settings, watermark) => {
  const cfg = settings.images || {};
  const maxWidth = Number(cfg.maxWidth) > 0 ? Number(cfg.maxWidth) : 1600;

  // 1. Resize (keep aspect ratio, never upscale)  2. Smart compression
  const transformation = [
    { width: maxWidth, crop: 'limit' },
    { quality: 'auto' },
  ];

  // 3. Text watermark (vehicle photos only, and only when enabled)
  const wm = cfg.watermark || {};
  const text = (wm.text || settings.companyName || '').trim();
  if (watermark && wm.enabled !== false && text) {
    transformation.push({
      overlay: {
        font_family: wm.fontFamily || 'Arial',
        font_size: Number(wm.fontSize) > 0 ? Number(wm.fontSize) : 48,
        font_weight: 'bold',
        text,
      },
      color: wm.color || '#FFFFFF',
      opacity: Number.isFinite(Number(wm.opacity)) ? Number(wm.opacity) : 40,
      gravity: POSITION_GRAVITY[wm.position] || 'south_east',
      x: 20,
      y: 20,
    });
  }

  return transformation;
};

// POST /api/upload/images  (protected) — field name: "images" (multiple)
// Also used for single images (logo / banner / partners) — returns an array of URLs.
// Pass ?watermark=1 for vehicle photos to bake the configured text watermark in.
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'Зураг сонгоно уу');
    }
    const watermark = req.query.watermark === '1' || req.query.watermark === 'true';
    const settings = await Settings.getSingleton();
    const transformation = buildImageTransformation(settings, watermark);

    const results = await Promise.all(
      req.files.map((file) =>
        uploadBuffer(file.buffer, {
          folder: 'dealership/images',
          resource_type: 'image',
          transformation,
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
