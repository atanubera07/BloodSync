const configuredSiteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);
if (process.env.NODE_ENV === 'production' && !configuredSiteUrl?.startsWith('https://'))
  throw new Error('Set SITE_URL to the HTTPS canonical web origin for production builds');
export const siteUrl = configuredSiteUrl || 'http://localhost:3000';
