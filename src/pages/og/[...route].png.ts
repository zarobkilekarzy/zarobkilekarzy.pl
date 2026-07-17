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

// Tło: wielki, ledwie widoczny zapis EKG — element graficzny, nie treść. Ta sama droga
// co logo (<img> z data URI), bo satori nie rysuje ścieżek SVG.
// Jeden cykl w proporcjach szerokości cyklu (w) i amplitudy załamka R (a): odcinek
// izoelektryczny → P → zespół QRS → T → izoelektryczny.
const ecgCycle = (x: number, y: number, w: number, a: number) =>
  [
    `M${x},${y}`,
    `L${x + 0.13 * w},${y}`,
    `Q${x + 0.185 * w},${y - 0.14 * a} ${x + 0.24 * w},${y}`, // P
    `L${x + 0.325 * w},${y}`,
    `L${x + 0.35 * w},${y + 0.1 * a}`, // Q
    `L${x + 0.39 * w},${y - a}`, // R
    `L${x + 0.43 * w},${y + 0.36 * a}`, // S
    `L${x + 0.46 * w},${y}`,
    `L${x + 0.55 * w},${y}`,
    `Q${x + 0.64 * w},${y - 0.3 * a} ${x + 0.73 * w},${y}`, // T
    `L${x + w},${y}`,
  ].join(' ');

// Linia izoelektryczna celowo pokrywa się z kreską nad stopką — trace wygląda wtedy na
// element kompozycji, a nie przypadkową krechę w poprzek tekstu, i zostawia akapity czyste
// (przez tekst przechodzą tylko pionowe załamki R). Wartość ZMIERZONA na wyrenderowanej
// karcie, nie wyliczona — zależy od metryk fontu stopki. Zmiana paddingu/rozmiaru stopki
// wymaga ponownego pomiaru, inaczej linia się rozjedzie z kreską.
const ECG_BASELINE = 506;

function ecgSvg(w: number, h: number, baseline: number, amplitude: number, cycles: number) {
  const cw = w / cycles;
  const d = Array.from({ length: cycles }, (_, i) => ecgCycle(i * cw, baseline, cw, amplitude)).join(' ');
  // Dwa wygaszenia: poziome (linia nie urywa się twardo na krawędziach karty) i pionowe
  // przez maskę (załamki S nikną, zamiast przecinać podpis w stopce).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7cc4f2" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#7cc4f2" stop-opacity="1"/>
      <stop offset="0.78" stop-color="#7cc4f2" stop-opacity="1"/>
      <stop offset="1" stop-color="#7cc4f2" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="v" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}">
      <stop offset="0.83" stop-color="#ffffff"/>
      <stop offset="0.95" stop-color="#000000"/>
    </linearGradient>
    <mask id="m"><rect width="${w}" height="${h}" fill="url(#v)"/></mask>
  </defs>
  <path d="${d}" fill="none" stroke="url(#f)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.1" mask="url(#m)"/>
</svg>`;
}

const ecgSrc = `data:image/svg+xml;base64,${Buffer.from(ecgSvg(1184, 630, ECG_BASELINE, 200, 3)).toString('base64')}`;
const ecgBg: Node = {
  type: 'img',
  props: { src: ecgSrc, width: 1184, height: 630, style: { position: 'absolute', top: 0, left: 0 } },
};

function template(p: OgPage): Node {
  const len = p.title.length;
  const titleSize = len > 46 ? 58 : len > 30 ? 68 : 78;
  return el(
    { height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: '#14233a', color: '#ffffff', padding: '70px 72px', fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e' },
    [
      ecgBg,
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '27px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontSize: '22px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '20px' }, p.tag),
        el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: `${titleSize}px`, lineHeight: 1.08, color: '#ffffff' }, p.title),
        el({ display: 'flex', fontSize: '31px', lineHeight: 1.42, color: '#aebccb', marginTop: '26px', maxWidth: '1010px' }, p.subtitle),
      ]),
      el({ display: 'flex', alignItems: 'center', borderTop: '1px solid #2f4a66', paddingTop: '24px', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, 'Jawność wynagrodzeń w ochronie zdrowia ze środków publicznych'),
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
