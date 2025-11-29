// next.config.js
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // IGNORE lint errors during build (temporary)
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.3dview.ai',
          },
        ],
        destination: 'https://3dview.ai/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;