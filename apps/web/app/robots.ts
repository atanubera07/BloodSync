import type { MetadataRoute } from 'next';
import { siteUrl } from '../lib/site';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/faq', '/contact', '/privacy', '/terms'],
      disallow: [
        '/api/',
        '/account',
        '/admin',
        '/dashboard',
        '/donor',
        '/requests',
        '/sign-in',
        '/sign-up',
        '/verify-email',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
