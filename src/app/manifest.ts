import {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: '#ffffff',
    description: 'CachyOS Builder Dashboard',
    display: 'standalone',
    icons: [
      {
        sizes: 'any',
        src: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    name: 'CachyOS Builder Dashboard',
    short_name: 'CachyOS Builder Dashboard',
    start_url: '/',
    theme_color: '#3b82f6',
  };
}
