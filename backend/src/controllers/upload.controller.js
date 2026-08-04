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

// The contact chip goes in the corner opposite the logo.
const OPPOSITE_GRAVITY = {
  south_west: 'south_east',
  south_east: 'south_west',
  north_west: 'north_east',
  north_east: 'north_west',
  center: 'south_east',
};

// Watermark proportions, all as a share of the photo's own width so the
// branding reads the same on a 1200px photo and a 2600px one.
const LOGO_WIDTH_RATIO = 0.3;
const CHIP_WIDTH_RATIO = 0.22;
const FRAME_PX = 12;

/**
 * Turn a Cloudinary delivery URL into an overlay id:
 *   .../upload/v123/dealership/images/abc.jpg  ->  dealership:images:abc
 */
const overlayIdFromUrl = (url) => {
  const afterUpload = String(url || '').split('/upload/')[1];
  if (!afterUpload) return '';
  return afterUpload
    .replace(/^v\d+\//, '') // version prefix
    .replace(/\.[a-z0-9]+$/i, '') // file extension
    .replace(/\//g, ':'); // folder separators
};

// Cloudinary wants a bare 6-digit hex in rgb: values.
const hexColor = (value, fallback) => {
  const clean = String(value || '').replace('#', '').trim();
  return /^[0-9a-f]{6}$/i.test(clean) ? clean : fallback;
};

/**
 * Build the Cloudinary transformation applied to uploaded images.
 *
 * For vehicle photos the watermark is the company logo in one corner, a
 * contact chip in the other, and a frame around the whole photo. The logo is
 * run through `trim` (crops it out of whatever padding the source file has)
 * and `make_transparent` (drops its flat background), so swapping the logo in
 * admin keeps working without touching this code.
 *
 * @param {object} settings  the singleton Settings document
 * @param {boolean} watermark  vehicle photos only
 */
const buildImageTransformation = (settings, watermark) => {
  const cfg = settings.images || {};
  const maxWidth = Number(cfg.maxWidth) > 0 ? Number(cfg.maxWidth) : 1600;

  // 1. Resize (keep aspect ratio, never upscale)  2. Smart compression
  const transformation = [
    { width: maxWidth, crop: 'limit' },
    { quality: 'auto' },
  ];

  const wm = cfg.watermark || {};
  if (!watermark || wm.enabled === false) return transformation;

  const brand = hexColor(wm.color, 'b3121b');
  const gravity = POSITION_GRAVITY[wm.position] || 'south_west';
  const logoId = overlayIdFromUrl(settings.logo);

  // 3. Logo.
  if (logoId) {
    transformation.push(
      { overlay: logoId },
      { effect: 'trim' },
      { effect: 'make_transparent:30' },
      { width: LOGO_WIDTH_RATIO, crop: 'scale', flags: 'relative' },
      { effect: 'shadow:60', x: 4, y: 4 },
      { flags: 'layer_apply', gravity, x: 38, y: 34 }
    );
  }

  // 4. Contact chip. Rendered at a large font, then scaled down to a share of
  //    the photo width — sizing it in absolute points is what made the old
  //    watermark come out wildly different on different photos.
  const chipText = (wm.text || (settings.contact || {}).phone || '').trim();
  if (chipText) {
    transformation.push(
      {
        overlay: {
          font_family: wm.fontFamily || 'Montserrat',
          font_size: 100,
          font_weight: 'bold',
          text: ` ${chipText} `,
        },
        color: '#FFFFFF',
        background: `#${brand}`,
      },
      { width: CHIP_WIDTH_RATIO, crop: 'scale', flags: 'relative' },
      { flags: 'layer_apply', gravity: OPPOSITE_GRAVITY[gravity], x: 38, y: 40 }
    );
  }

  // 5. Frame, applied last so it wraps everything.
  transformation.push({ border: `${FRAME_PX}px_solid_rgb:${brand}` });

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
          ...(watermark
            ? // Vehicle photos: keep the untouched original and deliver a
              // watermarked derivative. An incoming `transformation` would
              // discard the original, which is what made the old watermark
              // impossible to change without re-uploading every car.
              { eager: [transformation] }
            : // Logo / banner / partner art carry no watermark, so there is
              // nothing to regret baking in.
              { transformation }),
        })
      )
    );

    const urls = results.map((result) => {
      if (!watermark) return result.secure_url;
      // Eager runs synchronously, but fall back to building the same derived
      // URL rather than ever handing back the un-watermarked original.
      return (
        (result.eager && result.eager[0] && result.eager[0].secure_url) ||
        cloudinary.url(result.public_id, {
          transformation,
          version: result.version,
          secure: true,
        })
      );
    });

    res.json({ success: true, data: { urls } });
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

// buildImageTransformation is exported so the watermark can be rendered and
// eyeballed without doing a real upload (see scripts/previewWatermark.js).
module.exports = { uploadImages, uploadVideo, buildImageTransformation };
