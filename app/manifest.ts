import {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#ffffff',
    description:
      'GU Fest 2024 - Fests at Gandhinagar University are a platform for students to learn and showcase their talents to self and the world',
    display: 'standalone',
    icons: [
      {
        sizes: 'any',
        src: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    name: 'GU Fest 2024',
    short_name: 'GU Fest 2024',
    start_url: '/',
    theme_color: '#3b82f6',
  };
}
