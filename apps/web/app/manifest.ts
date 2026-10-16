import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BloodSync',
    short_name: 'BloodSync',
    description: 'Private blood donation coordination',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#1b1e4a',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
