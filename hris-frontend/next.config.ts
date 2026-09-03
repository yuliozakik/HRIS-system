import type { NextConfig } from "next";

// Backend is proxied through this Next.js server so that the browser only
// ever talks to a single origin. That keeps the refresh-token cookie
// (SameSite=Lax, set by the backend under /api/v1/auth) same-site, which it
// would NOT be if the browser called the backend's own origin/port directly.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_INTERNAL_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
