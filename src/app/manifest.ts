import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Double King Shop Hub',
    short_name: 'DKS Hub',
    description: 'Hub Technologique Hybride - Elite Hardware & Academy',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#00e5ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
