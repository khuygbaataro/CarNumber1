import { v2 as cloudinary } from 'cloudinary';
import { Settings } from './models';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * IMPORTANT: this mirrors `buildImageTransformation` in
 * backend/src/controllers/upload.controller.js. The two run on different
 * deployments (this one on Vercel for the Messenger bot, the other on the
 * REST API for the admin panel), so they cannot share a module — but a photo
 * must look identical whichever door it comes through. Change both together.
 */

const POSITION_GRAVITY: Record<string, string> = {
  'bottom-right': 'south_east',
  'bottom-left': 'south_west',
  'top-right': 'north_east',
  'top-left': 'north_west',
  center: 'center',
};

const OPPOSITE_GRAVITY: Record<string, string> = {
  south_west: 'south_east',
  south_east: 'south_west',
  north_west: 'north_east',
  north_east: 'north_west',
  center: 'south_east',
};

const LOGO_WIDTH_RATIO = 0.3;
const CHIP_WIDTH_RATIO = 0.22;
const FRAME_PX = 12;

/** `.../upload/v123/dealership/images/abc.jpg` → `dealership:images:abc` */
function overlayIdFromUrl(url?: string): string {
  const afterUpload = String(url || '').split('/upload/')[1];
  if (!afterUpload) return '';
  return afterUpload
    .replace(/^v\d+\//, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\//g, ':');
}

function hexColor(value: unknown, fallback: string): string {
  const clean = String(value || '').replace('#', '').trim();
  return /^[0-9a-f]{6}$/i.test(clean) ? clean : fallback;
}

// Build the resize + compress + watermark transformation from site Settings.
async function buildTransformation(): Promise<any[]> {
  let settings: any = null;
  try {
    settings = await Settings.findOne().lean();
  } catch {
    settings = null;
  }

  const cfg = settings?.images || {};
  const maxWidth = Number(cfg.maxWidth) > 0 ? Number(cfg.maxWidth) : 1600;
  const transformation: any[] = [
    { width: maxWidth, crop: 'limit' },
    { quality: 'auto' },
  ];

  const wm = cfg.watermark || {};
  if (wm.enabled === false) return transformation;

  const brand = hexColor(wm.color, 'b3121b');
  const gravity = POSITION_GRAVITY[wm.position] || 'south_west';
  const logoId = overlayIdFromUrl(settings?.logo);

  // Logo: trimmed out of its padding and with its flat background dropped,
  // so any logo the admin uploads drops in cleanly.
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

  // Contact chip, rendered large then scaled to a share of the photo width.
  const chipText = String(wm.text || settings?.contact?.phone || '').trim();
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

  transformation.push({ border: `${FRAME_PX}px_solid_rgb:${brand}` });
  return transformation;
}

/**
 * Fetch a remote image (e.g. a Facebook attachment URL) into Cloudinary and
 * return the watermarked delivery URL. The untouched original is kept — an
 * incoming transformation would discard it, which is what previously made the
 * watermark impossible to change without re-uploading every car.
 */
export async function uploadImageFromUrl(url: string): Promise<string> {
  const transformation = await buildTransformation();
  const result: any = await cloudinary.uploader.upload(url, {
    folder: 'dealership/images',
    resource_type: 'image',
    eager: [transformation],
  });

  // Eager runs synchronously, but never hand back the un-watermarked original
  // if it is somehow missing — rebuild the same derived URL instead.
  return (
    result?.eager?.[0]?.secure_url ||
    cloudinary.url(result.public_id, {
      transformation,
      version: result.version,
      secure: true,
    })
  );
}
