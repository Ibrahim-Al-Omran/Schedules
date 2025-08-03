import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for serverless deployment
  experimental: {
    // Keep Prisma external for proper serverless operation
    serverComponentsExternalPackages: ['@prisma/client'],
    // Optimize other packages (not Prisma)
    optimizePackageImports: ['bcryptjs', 'jsonwebtoken'],
  },
  
  // Optimize images for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Enable compression
  compress: true,
  
  // Optimize for production
  ...(process.env.NODE_ENV === 'production' && {
    // Disable source maps in production for smaller bundles
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
