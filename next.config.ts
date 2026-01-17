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
    // Note: Turbopack is enabled by default in Next.js 16
    // To disable, use: next dev --no-turbo (in package.json scripts)
  },
  
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Headers for CSP (Content Security Policy) - Allow Google Fonts
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://*.daily.co wss://*.daily.co https://thequietherapy.daily.co wss://thequietherapy.daily.co https://challenges.cloudflare.com https://*.cloudflare.com https://fonts.googleapis.com",
              "frame-src 'self' https://*.daily.co https://checkout.stripe.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
