import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogPages, type OgPage } from '../../lib/ogPages';

// Fonty: latin + latin-ext SCALONE w jeden plik na krój (src/assets/fonts, wygenerowane
// raz przez fonttools) → pełne pokrycie polskich znaków (ł, ę, ś, ć, ń, ż, ź, ą) BEZ
// polegania na fallbacku satori (który dobiera font po kolejności tablicy, nie po rodzinie
// — serif łapałby wtedy latin-ext z sans). Dzięki temu serif zostaje serifem.
const ff = (p: string) => readFileSync(`src/assets/fonts/${p}`);
const fonts = [
  { name: 'Plex Sans', data: ff('ibm-plex-sans-latin-full-400.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex Sans', data: ff('ibm-plex-sans-latin-full-600.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex Serif', data: ff('ibm-plex-serif-latin-full-700.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: ff('ibm-plex-mono-latin-full-500.woff'), weight: 500 as const, style: 'normal' as const },
];

// Minimalny konstruktor vnode dla satori (bez JSX/satori-html — zero whitespace).
type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string; [attr: string]: unknown } };
const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({ type: 'div', props: { style, children } });

// Logo — to samo źródło co favicon i znak w nawigacji (public/favicon.svg). Satori nie
// renderuje inline SVG jako drzewa vnode, więc plik wchodzi jako <img> z data URI.
// Granatowe tło znaku (#0f4c81) ginie na granacie karty (#14233a), więc na potrzeby OG
// kwadrat dostaje jaśniejszy błękit — kształt i puls zostają bez zmian.
const logoSvg = readFileSync('public/favicon.svg', 'utf8').replace('#0f4c81', '#4aa9e0');
const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;
const logo = (size: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src: logoSrc, width: size, height: size, style },
});

function template(p: OgPage): Node {
  const len = p.title.length;
  const titleSize = len > 46 ? 58 : len > 30 ? 68 : 78;
  return el(
    { height: '100%', width: '100%', display: 'flex', flexDirection: 'column', background: '#14233a', color: '#ffffff', padding: '70px 72px', fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e' },
    [
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
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
