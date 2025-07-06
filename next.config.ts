import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  devIndicators: {
    position: 'bottom-right',
  },
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
      {
        destination: '/dashboard/package-list',
        permanent: false,
        source: '/dashboard',
      },
    ];
  },
};

export default nextConfig;
