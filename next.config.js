/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages for server components (moved from experimental)
  serverExternalPackages: ['surrealdb', 'winston'],

  // Enable TypeScript
  typescript: {
    // Temporarily ignore build errors during migration
    ignoreBuildErrors: true,
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'the-roundtable',
  },

  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    // Turbopack configuration options
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Redirects for clean URLs
  async redirects() {
    return [
      {
        source: '/council',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Image optimization settings (updated from deprecated domains to remotePatterns)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Output configuration
  output: 'standalone',

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;
