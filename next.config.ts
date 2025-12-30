import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.daily.co',
      },
    ],
  },
  
  // Ensure proper transpilation for Edge Runtime compatibility
  transpilePackages: [
    '@supabase/auth-helpers-nextjs',
    '@supabase/supabase-js',
    '@supabase/ssr',
    'lucide-react',
  ],
  
  // Experimental settings for Next.js 16
  experimental: {
    // serverComponentsExternalPackages is no longer experimental in Next.js 16
  },
  
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
