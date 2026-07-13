// Grafiki do udostępniania petycji w social media (build-time PNG, satori→resvg —
// ten sam toolchain co OG). Dwie karty 1080×1350 (format 4:5, feed): „zero" (ile z NFZ
// trafia do jednego lekarza → 0 rejestrów) i „podpisz" (świadectwo + wezwanie).
// Serwowane pod /petycja/udostepnij/<karta>.png — pokazywane i pobieralne na
// /petycja/jak-to-dziala. Fonty latin + latin-ext (polskie znaki), jak w OG.
import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const fp = (p: string) => readFileSync(`node_modules/@fontsource/${p}`);
// Fonty satori. KLUCZOWE dla polskich znaków: cały tekst z latin-ext („ł/ę/ś/ć/ż/ą…")
// jest w JEDNEJ rodzinie i wadze — Plex Sans 600 — a JEDYNYM fontem niosącym subset
// latin-ext jest „Plex Sans Ext" (ta sama waga). Satori podmienia brakujące glify tylko
// z tego fontu → bez zmiany kroju i grubości. Serif (700) i Mono (500) niosą wyłącznie
// tekst BEZ latin-ext („0", „Podpisz i Ty.", domena), więc nie dostają subsetu latin-ext
// (to eliminuje błędny fallback serif→sans, który psuł polskie znaki w nagłówku).
const fonts = [
  { name: 'Plex Sans', data: fp('ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex Sans Ext', data: fp('ibm-plex-sans/files/ibm-plex-sans-latin-ext-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex Serif', data: fp('ibm-plex-serif/files/ibm-plex-serif-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: fp('ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
];

type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string } };
const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({
  type: 'div',
  props: { style, children },
});
const img = (src: string, style: Record<string, unknown>): Node =>
  ({ type: 'img', props: { src, style } } as unknown as Node);

// Logo marki na ciemne tło: biały rounded-square + brandowy „puls" EKG (wariant
// odwrócony, czytelny na obu kartach). Rasteryzujemy do PNG data URI, żeby resvg
// pewnie osadził go w karcie (bez ryzyka zagnieżdżonego SVG w obrazie).
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#ffffff"/><path d="M4 17h6l2-7 3.5 13L18 17h10" fill="none" stroke="#0f4c81" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const LOGO_URI =
  'data:image/png;base64,' +
  Buffer.from(new Resvg(LOGO_SVG, { fitTo: { mode: 'width', value: 120 } }).render().asPng()).toString('base64');

const W = 1080;
const H = 1350;

// Wspólny pasek marki u góry karty (kwadracik + domena).
const brandRow = (mono: string) =>
  el({ display: 'flex', alignItems: 'center' }, [
    img(LOGO_URI, { width: '40px', height: '40px', marginRight: '18px' }),
    el({ fontFamily: 'Plex Mono', fontWeight: 500, fontSize: '32px', color: mono, letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
  ]);

function cardZero(): Node {
  return el(
    {
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: '#14233a', color: '#ffffff', padding: '90px 80px',
      fontFamily: 'Plex Sans', borderLeft: '22px solid #b3261e',
    },
    [
      brandRow('#cdd6e0'),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontWeight: 600, fontSize: '46px', color: '#aebccb', lineHeight: 1.3, marginBottom: '4px', maxWidth: '880px' },
          'Ile łącznie z NFZ trafia do jednego lekarza?'),
        el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '440px', lineHeight: 1, color: '#ffffff' }, '0'),
        el({ display: 'flex', fontWeight: 600, fontSize: '48px', color: '#dfe6ee', lineHeight: 1.35, marginTop: '20px', maxWidth: '900px' },
          'Tyle jest dziś ogólnodostępnych rejestrów, które to pokazują.'),
      ]),
      el({ display: 'flex', alignItems: 'center', borderTop: '2px solid #2f4a66', paddingTop: '30px', fontFamily: 'Plex Mono', fontWeight: 500, fontSize: '36px', color: '#9fb3c8' },
        'Petycja to zmienia — zarobkilekarzy.pl/petycja/'),
    ],
  );
}

function cardPodpisz(): Node {
  return el(
    {
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: '#0f4c81', color: '#ffffff', padding: '90px 80px', fontFamily: 'Plex Sans',
    },
    [
      brandRow('#dbe7f2'),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        // Znacznik „✓" złożony z obróconego prostokąta z dwoma krawędziami (bez zależności od glifu w foncie).
        el({ display: 'flex', width: '118px', height: '118px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: '46px' }, [
          el({ width: '38px', height: '66px', borderRight: '16px solid #bfe0ff', borderBottom: '16px solid #bfe0ff', transform: 'rotate(45deg) translateY(-8px)' }),
        ]),
        el({ display: 'flex', fontFamily: 'Plex Sans', fontWeight: 600, fontSize: '58px', lineHeight: 1.22, color: '#ffffff', maxWidth: '900px' },
          'Podpisałem/-am petycję o jawność zarobków lekarzy ze środków publicznych.'),
        el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '92px', lineHeight: 1.1, color: '#bfe0ff', marginTop: '40px' }, 'Podpisz i Ty.'),
      ]),
      el({ display: 'flex', alignItems: 'center', borderTop: '2px solid rgba(255,255,255,0.28)', paddingTop: '30px', fontFamily: 'Plex Mono', fontWeight: 500, fontSize: '38px', color: '#d7e6f4' },
        'zarobkilekarzy.pl/petycja/'),
    ],
  );
}

const CARDS: Record<string, () => Node> = { zero: cardZero, podpisz: cardPodpisz };

export function getStaticPaths() {
  return Object.keys(CARDS).map((karta) => ({ params: { karta } }));
}

export const GET: APIRoute = async ({ params }) => {
  const build = CARDS[params.karta as string] ?? cardZero;
  const svg = await satori(build() as never, { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
