import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogPages, type OgPage } from '../../lib/ogPages';

// Fonty z @fontsource (woff — satori czyta je bezpośrednio). Dla polskich znaków
// (ł, ę, ś, ć, ń, ż, ź, ą) potrzebny jest subset latin-ext obok latin — dokładamy oba.
const fp = (p: string) => readFileSync(`node_modules/@fontsource/${p}`);
// Subset latin-ext dostaje UNIKALNĄ nazwę (nieużywaną w font-family) — inaczej satori
// deduplikuje po name+weight i odrzuca go. Pod inną nazwą służy jako fallback glifów PL.
const face = (name: string, base: string, weight: 400 | 500 | 600 | 700) => [
  { name, data: fp(`${base}-latin-${weight}-normal.woff`), weight, style: 'normal' as const },
  { name: `${name} Ext`, data: fp(`${base}-latin-ext-${weight}-normal.woff`), weight, style: 'normal' as const },
];
const fonts = [
  ...face('Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans', 400),
  ...face('Plex Sans', 'ibm-plex-sans/files/ibm-plex-sans', 600),
  ...face('Plex Serif', 'ibm-plex-serif/files/ibm-plex-serif', 700),
  ...face('Plex Mono', 'ibm-plex-mono/files/ibm-plex-mono', 500),
];

// Minimalny konstruktor vnode dla satori (bez JSX/satori-html — zero whitespace).
type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string } };
const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({ type: 'div', props: { style, children } });

function template(p: OgPage): Node {
  const len = p.title.length;
  const titleSize = len > 46 ? 58 : len > 30 ? 68 : 78;
  return el(
    { height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#14233a', color: '#ffffff', padding: '70px 72px', fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e' },
    [
      el({ display: 'flex', alignItems: 'center' }, [
        el({ width: '26px', height: '26px', background: '#4aa9e0', borderRadius: '6px', marginRight: '16px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '27px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontSize: '22px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '20px' }, p.tag),
        el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: `${titleSize}px`, lineHeight: 1.08, color: '#ffffff' }, p.title),
        el({ display: 'flex', fontSize: '31px', lineHeight: 1.42, color: '#aebccb', marginTop: '26px', maxWidth: '1010px' }, p.subtitle),
      ]),
      el({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #2f4a66', paddingTop: '24px', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, 'Jawność wynagrodzeń w ochronie zdrowia'),
        el({ display: 'flex' }, 'ze środków publicznych'),
      ]),
    ],
  );
}

export function getStaticPaths() {
  return Object.entries(ogPages).map(([route, page]) => ({ params: { route }, props: page }));
}

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(template(props as OgPage) as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
