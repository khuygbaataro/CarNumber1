/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Real uploaded media (admin) is served from Cloudinary.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Placeholder images used by the sample-data seed (demo only).
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
