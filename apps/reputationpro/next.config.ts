import type { NextConfig } from 'next';
const config: NextConfig = {
  // Allows a new build to be verified without replacing the live .next build.
  distDir: process.env.REPUTATION_BUILD_DIR || '.next',
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
    ] }];
  }
};
export default config;
