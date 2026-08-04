/**
 * Print the delivery URL the watermark settings produce, so the branding can
 * be checked in a browser before any photo is uploaded.
 *
 *   node scripts/previewWatermark.js <cloud_name> <sample_image_url>
 *
 * Settings are read from the live API when API_URL is set, otherwise the
 * defaults below are used. Nothing is uploaded and nothing is modified.
 */
const cloudinary = require('cloudinary').v2;
const { buildImageTransformation } = require('../src/controllers/upload.controller');

const CLOUD = process.argv[2] || process.env.CLOUDINARY_CLOUD_NAME;
const SAMPLE = process.argv[3];

if (!CLOUD || !SAMPLE) {
  console.error('Usage: node scripts/previewWatermark.js <cloud_name> <sample_image_url>');
  process.exit(1);
}

// Public id of the sample photo, pulled out of its delivery URL.
const publicId = String(SAMPLE)
  .split('/upload/')[1]
  .replace(/^v\d+\//, '')
  .replace(/\.[a-z0-9]+$/i, '');

async function loadSettings() {
  if (!process.env.API_URL) return null;
  const res = await fetch(`${process.env.API_URL}/settings`);
  const json = await res.json();
  return json.data;
}

(async () => {
  cloudinary.config({ cloud_name: CLOUD });

  const settings = (await loadSettings()) || {
    companyName: 'Victory car',
    logo: '',
    contact: { phone: '80004020' },
    images: {
      maxWidth: 1600,
      watermark: {
        enabled: true,
        text: '',
        position: 'bottom-left',
        fontFamily: 'Montserrat',
        color: '#b3121b',
      },
    },
  };

  const transformation = buildImageTransformation(settings, true);
  console.log('\nTransformation:');
  console.log(JSON.stringify(transformation, null, 2));
  console.log('\nPreview URL:');
  console.log(cloudinary.url(publicId, { transformation, secure: true }));
  console.log();
})();
