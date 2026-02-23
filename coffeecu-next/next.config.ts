import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseHostname = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : '';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname, pathname: '/storage/v1/object/**' }]
      : [],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Strict CSP — only allow resources from our own origin + Supabase + Google Fonts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `connect-src 'self' ${SUPABASE_URL} https://api.resend.com`,
              `img-src 'self' data: blob: ${supabaseHostname ? `https://${supabaseHostname}` : ''}`,
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HSTS (1 year)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Permissions policy — deny unnecessary browser APIs
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
