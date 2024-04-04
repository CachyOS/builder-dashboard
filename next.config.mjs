/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  poweredByHeader: false,
  reactStrictMode: false,
};

export default nextConfig;
