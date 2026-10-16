/** Obrazki Open Graph generowane w buildzie: /og/index.png, /og/<sekcja>/<id>.png — zob. lib/og/registry.ts */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getOgEntries, ogSlug } from '@/lib/og/registry';
import { renderOg } from '@/lib/og/render';

export const getStaticPaths = (async () => {
  const entries = await getOgEntries();
  return entries.map((entry) => ({ params: { route: ogSlug(entry.route) }, props: { entry } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(new Uint8Array(await renderOg(props.entry)), { headers: { 'Content-Type': 'image/png' } });
