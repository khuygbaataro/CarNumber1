/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // All media is served from Cloudinary.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
