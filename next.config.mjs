/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better tree-shaking
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github-readme-stats.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'github-readme-streak-stats.herokuapp.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.shields.io',
      },
      {
        protocol: 'https',
        hostname: 'githolo.bharatdn.com',
      },
      {
        protocol: 'https',
        hostname: 'gitchronicle.bharatdn.com',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.github.com https://raw.githubusercontent.com https://avatars.githubusercontent.com https://github-readme-stats.vercel.app https://github-readme-streak-stats.herokuapp.com https://img.shields.io https://githolo.bharatdn.com https://gitchronicle.bharatdn.com https://va.vercel-scripts.com; frame-src 'self' https://vercel.live;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
