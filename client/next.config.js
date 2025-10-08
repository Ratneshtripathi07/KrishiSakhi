const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline'
  },
  runtimeCaching: [
    // Always try network first for HTML/navigations so we don't serve stale pages
    {
      urlPattern: /^(?:http|https):\/\/[\w\-.:]+\/(?:$|\?.*|[^_].*)/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-pages',
        networkTimeoutSeconds: 10,
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Cache versioned Next.js build assets
    {
      urlPattern: /_next\/static\/.*\.js$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-js',
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /_next\/static\/.*\.css$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static-css',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Images and other assets
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // Everything else same-origin
    {
      urlPattern: /^https?:\/\/[^/]+\//i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'misc',
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en', 'hi', 'ml', 'pa'],
    defaultLocale: 'en',
    // Some Next.js versions require localeDetection=false with App Router i18n
    localeDetection: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*', // proxy to backend for dev
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
