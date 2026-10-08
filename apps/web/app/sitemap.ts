import type { MetadataRoute } from 'next';
import { siteUrl } from '../lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/privacy', '/terms', '/about', '/faq', '/contact'].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.4,
  }));
}
