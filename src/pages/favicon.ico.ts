import type { APIRoute } from 'astro';
import { faviconIco } from '@/lib/seo/icons';

/** /favicon.ico (16, 32 i 48 px) — przeglądarki i czytniki, które nie biorą SVG, pytają o ten adres same. */
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await faviconIco()), { headers: { 'Content-Type': 'image/x-icon' } });
