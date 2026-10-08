import type { NextConfig } from 'next';
const origin =
  process.env.API_ORIGIN ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : undefined);
if (!origin || (process.env.NODE_ENV === 'production' && !origin.startsWith('https://'))) {
  throw new Error('Set API_ORIGIN to the HTTPS API origin for production builds');
}
const config: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${origin}/:path*` }];
  },
};
export default config;
