import type { APIRoute } from 'astro';
import { identity } from '@/data/seo/identity';

/** Manifest aplikacji: nazwa i ikony przy dodaniu serwisu do ekranu głównego telefonu. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: identity.name,
      short_name: identity.name,
      description: identity.description,
      lang: 'pl',
      start_url: '/',
      display: 'browser',
      background_color: identity.iconBackground,
      theme_color: identity.themeColor,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
