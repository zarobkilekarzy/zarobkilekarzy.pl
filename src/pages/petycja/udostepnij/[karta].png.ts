// Grafiki do udostępniania petycji w social media (build-time PNG, satori→resvg —
// ten sam toolchain co OG). Dwie karty 1080×1350 (format 4:5, feed): „zero" (ile z NFZ
// trafia do jednego lekarza → 0 rejestrów) i „podpisz" (świadectwo + wezwanie).
// Serwowane pod /petycja/udostepnij/<karta>.png — pokazywane i pobieralne na
// /petycja/jak-to-dziala. Fonty scalone (src/assets/fonts) — pełne polskie znaki bez fallbacku.
import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fonts, OG, sierotki } from '../../../lib/ogCard';

// Fonty i paleta wspólne z kartami OG (src/lib/ogCard.ts): Archivo scalone z latin-ext,
// „Archivo Wide” 800 do tytułów i liczb — pełne polskie znaki bez fallbacku satori.

type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string } };
const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({
  type: 'div',
  props: { style, children },
});
const img = (src: string, style: Record<string, unknown>): Node =>
  ({ type: 'img', props: { src, style } } as unknown as Node);

// Logo marki na ciemne tło: biały kwadrat + granatowy „puls" EKG (wariant
// odwrócony, czytelny na obu kartach). Rasteryzujemy do PNG data URI, żeby resvg
// pewnie osadził go w karcie (bez ryzyka zagnieżdżonego SVG w obrazie).
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="3" fill="#ffffff"/><path d="M4 17h6l2-7 3.5 13L18 17h10" fill="none" stroke="#0b2a5b" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const LOGO_URI =
  'data:image/png;base64,' +
  Buffer.from(new Resvg(LOGO_SVG, { fitTo: { mode: 'width', value: 120 } }).render().asPng()).toString('base64');

const W = 1080;
const H = 1350;

// Wspólny pasek marki u góry karty (kwadracik + domena).
const brandRow = (mono: string) =>
  el({ display: 'flex', alignItems: 'center' }, [
    img(LOGO_URI, { width: '40px', height: '40px', marginRight: '18px' }),
    el({ fontWeight: 600, fontSize: '32px', color: mono }, 'zarobkilekarzy.pl'),
  ]);

function cardZero(): Node {
  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: OG.night, color: OG.ink, padding: '90px 80px',
      fontFamily: 'Archivo',
    },
    [
      // Czerwony pas przez całą górną krawędź, jak na kartach OG (src/lib/ogCard.ts, topBand) —
      // zamiast grubego paska z lewej. Absolute, więc nie przesuwa układu.
      el({ position: 'absolute', top: 0, left: 0, width: `${W}px`, height: '16px', background: OG.signal }),
      brandRow(OG.soft),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontSize: '46px', color: OG.soft, lineHeight: 1.3, marginBottom: '4px', maxWidth: '880px' },
          'Ile łącznie z NFZ trafia do jednego lekarza?'),
        // „0” w czerwieni, jak „0 rejestrów” i „?” na stronie głównej — brakująca suma
        // Na nocnym granacie, nie na granacie marki:
        // tam czerwień traciła kontrast.
        el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: '440px', lineHeight: 1, color: OG.signal }, '0'),
        el({ display: 'flex', fontSize: '48px', color: OG.ink, lineHeight: 1.35, marginTop: '20px', maxWidth: '900px' },
          'Tyle jest dziś ogólnodostępnych rejestrów, które to pokazują.'),
      ]),
      el({ display: 'flex', flexDirection: 'column', borderTop: `2px solid ${OG.rule}`, paddingTop: '26px', fontWeight: 600, fontSize: '36px', lineHeight: 1.3, color: OG.faint }, [
        el({ display: 'flex' }, 'Petycja to zmienia —'),
        el({ display: 'flex' }, 'zarobkilekarzy.pl/petycja/'),
      ]),
    ],
  );
}

function cardPodpisz(): Node {
  return el(
    {
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: OG.bg, color: OG.ink, padding: '90px 80px', fontFamily: 'Archivo',
    },
    [
      brandRow(OG.soft),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        // Znacznik „✓" złożony z obróconego prostokąta z dwoma krawędziami (bez zależności od glifu w foncie).
        el({ display: 'flex', width: '118px', height: '118px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: '46px' }, [
          el({ width: '38px', height: '66px', borderRight: `16px solid ${OG.link}`, borderBottom: `16px solid ${OG.link}`, transform: 'rotate(45deg) translateY(-8px)' }),
        ]),
        el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: '54px', lineHeight: 1.18, letterSpacing: '-0.5px', color: OG.ink, maxWidth: '900px' },
          sierotki('Podpisałem/-am petycję o jawność zarobków lekarzy ze środków publicznych.')),
        el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: '92px', lineHeight: 1.05, letterSpacing: '-1px', color: OG.link, marginTop: '40px' }, 'Podpisz i Ty.'),
      ]),
      el({ display: 'flex', alignItems: 'center', borderTop: `2px solid ${OG.rule}`, paddingTop: '30px', fontWeight: 600, fontSize: '38px', color: OG.soft },
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
