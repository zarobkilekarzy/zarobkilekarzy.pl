/** Infografiki do pobrania generowane w buildzie: /infografiki/<strona>/<id>-<szer>x<wys>.png — zob. lib/infografiki/render.ts */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { FORMATS, infographicUrl, renderInfographic, type FormatKey } from '@/lib/infografiki/render';
import { infographicSets } from '@/lib/infografiki/zestawy';

export const getStaticPaths = (() =>
  Object.values(infographicSets).flatMap((set) =>
    set.items.flatMap((item) =>
      (Object.keys(FORMATS) as FormatKey[]).map((format) => ({
        params: { slug: infographicUrl(set, item.id, format).replace(/^\/infografiki\/|\.png$/g, '') },
        props: { set, item, format },
      })),
    ),
  )) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(new Uint8Array(await renderInfographic(props.set, props.item, props.format)), { headers: { 'Content-Type': 'image/png' } });
