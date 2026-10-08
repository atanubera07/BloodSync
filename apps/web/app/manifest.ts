import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BloodSync',
    short_name: 'BloodSync',
    description: 'Private blood donation coordination',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf8',
    theme_color: '#a32635',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
