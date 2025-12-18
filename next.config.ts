import type { NextConfig } from 'next';

// Bundle analyzer for performance audits
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@hello-pangea/dnd',
      'framer-motion',
      'date-fns',
    ],
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Webpack configuration for face-api.js (browser compatibility)
  webpack: (config, { isServer }) => {
    // Ignore Node.js modules in client-side bundles (for face-api.js)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        encoding: false,
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
