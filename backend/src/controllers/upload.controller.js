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
 * The brand watermark set, from the design handoff.
 *
 * Positions and sizes are given against a 1024 × 771 (4:3) design base, with
 * a scale unit u = min(W, H·1024/771) / 1024 — so a mark is sized off the
 * width of the largest 4:3 box that fits in the photo, and never balloons on
 * a wide crop. Cloudinary reproduces that rule with a relative width AND a
 * relative height under c_fit: whichever side is tighter wins.
 *
 * FIT_HEADROOM is measured, not derived. Cloudinary fits an overlay into a
 * slightly taller box than the aspect ratio alone predicts, so at exactly the
 * design height it shrinks a 4:3 photo's marks by ~6%. Rendering a known
 * overlay over white at 1024×771, 1024×576 and 768×1024 and measuring the
 * result put the correction at 1.06: with it, all three land within 3% of the
 * spec; without it, 4:3 comes out 6% small; with width alone and no height at
 * all, a 16:9 photo comes out 33% large.
 */
const DESIGN_W = 1024;
const DESIGN_H = 771;
const FIT_HEADROOM = 1.06;
const BRAND_MARKS = [
  { key: 'websiteMark', w: 272.8, h: 47, gravity: 'north', x: 0, y: 22 },
  { key: 'logoMark', w: 180, h: 142.3, gravity: 'south_west', x: 30, y: 28 },
  { key: 'phoneMark', w: 258, h: 50, gravity: 'south_east', x: 44, y: 40 },
];

// Cloudinary takes relative values as decimals; four places is finer than a
// pixel on any photo this pipeline produces.
const rel = (n) => Math.round(n * 10000) / 10000;

/**
 * Pushes the brand marks onto `transformation`. Returns false when no mark
 * is configured, so the caller can fall back to the classic watermark rather
 * than publish photos with nothing on them.
 *
 * The frame comes last in the handoff but first on the photo: it is drawn
 * under the pills and the logo. It is one stretched piece of artwork rather
 * than four drawn edges because Cloudinary rounds a relative layer offset to
 * two decimals, and the 8u inset the design asks for is 0.0078 of the width
 * — which collapses to zero.
 */
const pushBrandMarks = (transformation, wm) => {
  const frameId = overlayIdFromUrl(wm.frameMark);
  const marks = BRAND_MARKS.map((mark) => ({
    ...mark,
    id: overlayIdFromUrl(wm[mark.key]),
  })).filter((mark) => mark.id);
  if (!frameId && !marks.length) return false;

  if (frameId) {
    transformation.push(
      { overlay: frameId },
      // Strings, not numbers. The SDK serialises 1.0 as `w_1`, which
      // Cloudinary reads as one pixel, and the frame silently disappears.
      { width: '1.0', height: '1.0', crop: 'scale', flags: 'relative' },
      { flags: 'layer_apply', gravity: 'center' }
    );
  }
  for (const mark of marks) {
    transformation.push(
      { overlay: mark.id },
      {
        width: rel(mark.w / DESIGN_W),
        height: rel((mark.h * FIT_HEADROOM) / DESIGN_H),
        crop: 'fit',
        flags: 'relative',
      },
      {
        flags: 'layer_apply',
        gravity: mark.gravity,
        // x against the width, y against the height — exact at 4:3, and
        // within about a percent of the width elsewhere.
        ...(mark.x ? { x: rel(mark.x / DESIGN_W) } : {}),
        y: rel(mark.y / DESIGN_H),
      }
    );
  }
  return true;
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

  // The brand marks are the watermark. The classic composition below is
  // kept only as a floor: with no artwork configured it still puts the
  // company on a photo, rather than publishing it bare.
  if (pushBrandMarks(transformation, wm)) return transformation;

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
