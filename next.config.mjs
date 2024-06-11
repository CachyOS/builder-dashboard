/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,
  async redirects() {
    return [
      {
        destination: '/api/logs/:arch/:pkgbase',
        has: [
          {
            key: 'raw',
            type: 'query',
          },
        ],
        permanent: false,
        source: '/logs/:arch/:pkgbase',
      },
    ];
  },
};

export default nextConfig;
