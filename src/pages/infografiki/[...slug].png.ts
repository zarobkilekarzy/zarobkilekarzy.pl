/** Infografiki do pobrania generowane w buildzie: /infografiki/<strona>/<id>-<szer>x<wys>[-ciemny].png — zob. lib/infografiki/render.ts */
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { FORMATS, THEMES, infographicUrl, renderInfographic, type FormatKey, type ThemeKey } from '@/lib/infografiki/render';
import { infographicSets } from '@/lib/infografiki/zestawy';

export const getStaticPaths = (() =>
  Object.values(infographicSets).flatMap((set) =>
    set.items.flatMap((item) =>
      (Object.keys(FORMATS) as FormatKey[]).flatMap((format) =>
        (Object.keys(THEMES) as ThemeKey[]).map((theme) => ({
          params: { slug: infographicUrl(set, item.id, format, theme).replace(/^\/infografiki\/|\.png$/g, '') },
          props: { set, item, format, theme },
        })),
      ),
    ),
  )) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(new Uint8Array(await renderInfographic(props.set, props.item, props.format, props.theme)), { headers: { 'Content-Type': 'image/png' } });
