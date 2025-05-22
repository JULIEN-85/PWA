import nextPwa from 'next-pwa';


/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" }
        ],
      },
    ]
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  reactStrictMode: false,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  }
};

export default nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
{
    urlPattern: /^.*$/, // met en cache toutes les routes et assets
    handler: 'CacheFirst',
    options: {
      cacheName: 'all-app',
      expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 jours
     },
    },
  ],
})(nextConfig);