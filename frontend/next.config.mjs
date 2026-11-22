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
  async headers() {
    return [
      {
        // The customs helper's installer. The admin page's link already asks
        // for a download; this makes the bare URL behave the same way, so a
        // link passed to a colleague saves the file rather than doing
        // whatever that browser happens to do with an .exe.
        source: '/downloads/:file*',
        headers: [{ key: 'Content-Disposition', value: 'attachment' }],
      },
    ];
  },
};

export default nextConfig;
