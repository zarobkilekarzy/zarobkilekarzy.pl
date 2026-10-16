/** Pakiet logo generowany w buildzie: /media/logo/<slug>.svg — zob. lib/media/logo.ts */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { LOGOS, renderLogo } from '@/lib/media/logo';

export const getStaticPaths = (() => LOGOS.map((logo) => ({ params: { plik: logo.slug }, props: { logo } }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(new Uint8Array(await renderLogo(props.logo, 'svg')), { headers: { 'Content-Type': 'image/svg+xml' } });
