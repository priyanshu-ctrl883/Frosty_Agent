import type { NextConfig } from "next";
import path from "path";

// These headers apply to every response from the dashboard.
//
// CSP rationale:
//  - default-src 'self'          — baseline: only same-origin unless overridden below
//  - script-src 'self' 'unsafe-inline'  — Next.js inline scripts (hydration chunks) require this;
//                                         unsafe-eval is deliberately absent
//  - style-src 'self' 'unsafe-inline' fonts.googleapis.com — Tailwind inline + Google Fonts
//  - font-src 'self' fonts.gstatic.com data: — Google Fonts + material-symbols data URIs
//  - img-src 'self' data: blob: *.googleusercontent.com — Google profile pictures on OAuth
//  - connect-src 'self' *.supabase.co + the FastAPI origin — the dashboard and API are
//                        different hosts on testing/prod (testing.frostyagent.com vs
//                        api.testing.frostyagent.com), so 'self' is not enough
//  - frame-ancestors 'none' — replaces X-Frame-Options for modern browsers
//  - object-src 'none'      — no Flash/plugin embeds
//  - base-uri 'self'        — block base-tag injection attacks
const isDev = process.env.NODE_ENV !== "production";

const apiConnectOrigins = new Set<string>([
  "https://api.testing.frostyagent.com",
  "https://api.staging.frostyagent.com",
  "https://api.frostyagent.com",
]);
try {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw) apiConnectOrigins.add(new URL(raw).origin);
} catch {
  /* ignore malformed NEXT_PUBLIC_API_URL */
}

const apiWsOrigins = [...apiConnectOrigins].map((origin) =>
  origin.replace(/^https:/, "wss:")
);

const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  ...apiConnectOrigins,
  ...apiWsOrigins,
  // Meta Embedded Signup (FB.login / Graph calls from the SDK)
  "https://connect.facebook.net",
  "https://www.facebook.com",
  "https://graph.facebook.com",
  ...(isDev ? ["http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*"] : []),
].join(" ");

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  "https://checkout.razorpay.com",
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://connect.facebook.net",
].join(" ");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: https://*.googleusercontent.com https://*.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com",
      `connect-src ${connectSrc} https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com https://ipapi.co https://*.ipapi.co https://ipwho.is https://api.country.is https://ipinfo.io https://*.ipinfo.io https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`,
      "frame-src * 'self' data: blob: https: http: https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE === "true" || process.platform !== "win32" ? "standalone" : undefined,
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  // Trace from monorepo root so standalone nests under apps/merchant-dashboard/
  // and includes hoisted pnpm deps from the workspace root.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["react-grid-layout", "react-resizable"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/industry/:slug',
        destination: '/industries/:slug',
        permanent: true,
      },
      {
        source: '/industry/:slug/',
        destination: '/industries/:slug/',
        permanent: true,
      },
    ];
  },
  // Dev API proxy: same-origin /api-proxy/* → NEXT_PUBLIC_API_URL (or localhost:8000).
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const demoBase = process.env.SITEGUIDE_UPSTREAM || "http://127.0.0.1:8002";
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${apiBase}/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${apiBase}/v1/:path*`,
      },
      {
        source: "/demo-api/:path*",
        destination: `${demoBase.replace(/\/$/, "")}/:path*`,
      },
      {
        source: "/whatsapp/:path*",
        destination: `${demoBase.replace(/\/$/, "")}/whatsapp/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // Filesystem webpack cache on Windows + a next.config restart leaves
    // webpack-runtime.js pointing at numbered chunks that no longer exist
    // (`Cannot find module './5301.js'`), which the browser then reports as
    // /_next/static/... 404s. Memory cache dies with the process.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};


export default nextConfig;
