import type { NextConfig } from "next";

// Build a single Content-Security-Policy string. Whitespace is collapsed so the
// header value is well-formed.
//
// Notes on choices:
// - 'unsafe-inline' is required for Next.js' inline bootstrap scripts and the
//   styles emitted by Next/Tailwind. (Switching to per-request nonces would
//   require a custom proxy middleware that injects them; left as a future
//   improvement.)
// - https://va.vercel-scripts.com is the host for @vercel/analytics.
// - https://vitals.vercel-insights.com receives analytics beacons.
// - img-src and media-src allow https: so audio/images served from the
//   configurable R2 public base URL (and any other CDN) keep working without
//   hard-coding a domain.
// - frame-ancestors 'none' is the modern equivalent of X-Frame-Options: DENY.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://challenges.cloudflare.com",
  // Turnstile renders its challenge inside an iframe served from
  // challenges.cloudflare.com — must be explicitly allowed.
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Disable browser APIs the app does not need. `microphone=(self)` is kept
    // open for the voice-search feature on the public site.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
];

const nextConfig: NextConfig = {
  // Strip the `X-Powered-By: Next.js` response header.
  poweredByHeader: false,
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Apply the security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
