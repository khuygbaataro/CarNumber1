import { v2 as cloudinary } from 'cloudinary';
import { Settings } from './models';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const POSITION_GRAVITY: Record<string, string> = {
  'bottom-right': 'south_east',
  'bottom-left': 'south_west',
  'top-right': 'north_east',
  'top-left': 'north_west',
  center: 'center',
};

// Build the same resize + compress + watermark transformation the admin
// upload uses, from the site Settings. Applied as an incoming transformation
// so only the processed image is stored.
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
  const text = (wm.text || settings?.companyName || '').trim();
  if (wm.enabled !== false && text) {
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
}

// Fetch a remote image (e.g. a Facebook attachment URL) into Cloudinary,
// resized/compressed/watermarked. Returns the stored secure URL.
export async function uploadImageFromUrl(url: string): Promise<string> {
  const transformation = await buildTransformation();
  const result = await cloudinary.uploader.upload(url, {
    folder: 'dealership/images',
    resource_type: 'image',
    transformation,
  });
  return result.secure_url;
}
