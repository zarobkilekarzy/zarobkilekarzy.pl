import type { APIRoute, GetStaticPaths } from 'astro';
import { ICONS, iconPng, type IconName } from '@/lib/seo/icons';

/** /apple-touch-icon.png, /icon-192.png, /icon-512.png, /icon-maskable-512.png — z SVG w lib/seo/icons.ts. */
export const getStaticPaths = (() => Object.keys(ICONS).map((icon) => ({ params: { icon } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const { size, source } = ICONS[params.icon as IconName];
  const png = await iconPng(size, source);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
