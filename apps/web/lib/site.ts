if (process.env.NODE_ENV === 'production' && !process.env.SITE_URL?.startsWith('https://'))
  throw new Error('Set SITE_URL to the HTTPS canonical web origin for production builds');
export const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
