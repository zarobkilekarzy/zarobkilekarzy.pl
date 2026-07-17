import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogPages, type OgPage } from '../../lib/ogPages';
import { fonts, el, logo, ecgBackground, type Node } from '../../lib/ogCard';

// Karta 1200×630 = og:image dla X / Facebooka / LinkedIna. Miniatura wykop.pl ma inne
// proporcje i powstaje osobno — patrz src/pages/og-wykop/[...route].png.ts.

// Linia izoelektryczna PEŁNI ROLĘ kreski oddzielającej stopkę (osobnego bordera nie ma —
// byłby zdublowany). Dzięki temu trace czyta się jako element kompozycji, a nie przypadkowa
// krecha w poprzek tekstu, i zostawia akapity czyste: przez tekst przechodzą tylko pionowe
// załamki R. Wartość ZMIERZONA na wyrenderowanej karcie, nie wyliczona — zależy od metryk
// fontu stopki. Zmiana paddingu/rozmiaru stopki wymaga ponownego pomiaru, inaczej linia
// oderwie się od stopki.
const ECG_BASELINE = 506;

const ecgBg = ecgBackground({
  width: 1184, // 1200 minus 16 px czerwonego bordera: absolute pozycjonuje się od padding boxa
  height: 630,
  baseline: ECG_BASELINE,
  amplitude: 190,
  cycles: 3,
  stroke: 6,
  opacity: 0.1,
  fadeFrom: 0.83,
  fadeTo: 0.95,
});

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
      // paddingTop 25 (a nie 24) kompensuje usunięty 1 px bordera — wysokość bloku stopki
      // musi zostać ta sama, bo od niej zależy zmierzone ECG_BASELINE.
      el({ display: 'flex', alignItems: 'center', paddingTop: '25px', color: '#8aa0b6', fontSize: '22px' }, [
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
