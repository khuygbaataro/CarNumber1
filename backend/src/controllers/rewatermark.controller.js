const cloudinary = require('../config/cloudinary');
const Vehicle = require('../models/Vehicle');
const Settings = require('../models/Settings');
const { buildImageTransformation } = require('./upload.controller');

/**
 * Re-stamps every car photo with the watermark the settings describe now.
 *
 * A photo's watermark lives in its delivery url, not in the file: Cloudinary
 * still holds the untouched upload behind it. So bringing an old car up to
 * the current branding is a matter of rebuilding the url from the same
 * public id — no re-upload, no loss, and nothing that cannot be run again.
 *
 * That makes it idempotent. The public id and version are read back out of
 * whatever url is stored, so running it twice lands on the same string, and
 * running it after the artwork changes picks the new artwork up.
 */

/** public id, version and format out of a Cloudinary delivery url. */
const partsOf = (url) => {
  const cut = String(url || '').indexOf('/upload/');
  if (cut === -1) return null;
  const segments = url.slice(cut + '/upload/'.length).split('/');
  const versionAt = segments.findIndex((s) => /^v\d+$/.test(s));
  // No version means no reliable boundary between the transformation and the
  // public id — a folder could look like either. Left alone rather than guessed.
  if (versionAt === -1) return null;
  const tail = segments.slice(versionAt + 1);
  if (!tail.length) return null;
  const last = tail[tail.length - 1];
  const dot = last.lastIndexOf('.');
  const format = dot > 0 ? last.slice(dot + 1) : '';
  if (dot > 0) tail[tail.length - 1] = last.slice(0, dot);
  return {
    publicId: tail.join('/'),
    version: segments[versionAt].slice(1),
    format,
  };
};

/** True when a delivery url carries no transformation at all. */
const isBare = (url) => {
  const cut = String(url || '').indexOf('/upload/');
  if (cut === -1) return false;
  // The version is the first segment, so nothing sits between it and
  // /upload/ — the url is the raw original.
  return /^v\d+\//.test(url.slice(cut + '/upload/'.length));
};

/** The same photo with `transformation` applied. Null when it cannot be read. */
const stamp = (url, transformation) => {
  const parts = partsOf(url);
  if (!parts) return null;
  return cloudinary.url(parts.publicId, {
    transformation,
    version: parts.version,
    ...(parts.format ? { format: parts.format } : {}),
    secure: true,
  });
};

/**
 * Stamps any photo that arrived with no watermark at all.
 *
 * Every upload path is supposed to hand back a watermarked url, but a car
 * saved before that was true — or by some future path that forgets — would
 * sit in the catalogue bare, and nothing would say so. Photos that already
 * carry a watermark are left alone: bringing those up to date is a
 * deliberate act, and it has its own button.
 */
const stampBareImages = async (images) => {
  if (!Array.isArray(images) || !images.some(isBare)) return images;
  const settings = await Settings.getSingleton();
  const transformation = buildImageTransformation(settings, true);
  return images.map((url) => (isBare(url) ? stamp(url, transformation) || url : url));
};

// POST /api/vehicles/rewatermark  (protected)
const rewatermarkVehicles = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const transformation = buildImageTransformation(settings, true);

    const vehicles = await Vehicle.find({}, 'images').exec();
    let touched = 0;
    let images = 0;
    let skipped = 0;

    for (const vehicle of vehicles) {
      const current = vehicle.images || [];
      const rebuilt = current.map((url) => {
        const parts = partsOf(url);
        if (!parts) {
          skipped++;
          return url;
        }
        images++;
        return stamp(url, transformation) || url;
      });

      if (rebuilt.some((url, i) => url !== current[i])) {
        vehicle.images = rebuilt;
        await vehicle.save();
        touched++;
      }
    }

    res.json({
      success: true,
      data: { vehicles: vehicles.length, updated: touched, images, skipped },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { rewatermarkVehicles, partsOf, isBare, stampBareImages };
