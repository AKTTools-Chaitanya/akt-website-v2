/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Emit a self-contained server bundle (.next/standalone/server.js) for a slim
  // production Docker image / node runtime — mirrors the Institute CRM deploy.
  output: 'standalone',
  // Product images come from the storefront today and (soon) S3/CDN. Allow those hosts
  // so next/image can optimize them. Add the CDN domain here when images move to S3.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'akinfotools.com' },
      { protocol: 'https', hostname: 'm.akinfotools.com' },
      { protocol: 'https', hostname: 'mrtechnobaba.co.in' },
      { protocol: 'https', hostname: 'images.akinfotools.com' },
    ],
  },
};

module.exports = nextConfig;
