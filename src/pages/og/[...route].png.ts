import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogPages, type OgPage } from '../../lib/ogPages';
import { fonts, el, logo, ecgBackground, topBand, OG, sierotki, type Node } from '../../lib/ogCard';
import { arcadeTemplate } from '../../lib/ogCardGra';
import { egzaminTemplate } from '../../lib/ogCardEgzamin';

// Karta 1200×630 = og:image dla X / Facebooka / LinkedIna. Miniatura wykop.pl ma inne
// proporcje i powstaje osobno — patrz src/pages/og-wykop/[...route].png.ts.

// Linia izoelektryczna PEŁNI ROLĘ kreski oddzielającej stopkę (osobnego bordera nie ma —
// byłby zdublowany). Dzięki temu trace czyta się jako element kompozycji, a nie przypadkowa
// krecha w poprzek tekstu, i zostawia akapity czyste: przez tekst przechodzą tylko pionowe
// załamki R. Wartość ZMIERZONA na wyrenderowanej karcie, nie wyliczona — zależy od metryk
// fontu stopki. Zmiana paddingu/rozmiaru stopki wymaga ponownego pomiaru, inaczej linia
// oderwie się od stopki. Stopka ma jawne lineHeight 29 px, więc góra stopki = 630 − 70
// (padding) − 29 − 25 (paddingTop) = 506 niezależnie od metryk kroju.
const ECG_BASELINE = 506;

const ecgBg = ecgBackground({
  width: 1200,
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
  // Archivo Wide jest szersze niż dawny szeryf — stopnie o ~7% mniejsze, żeby długie
  // tytuły mieściły się w dwóch–trzech wierszach, a podtytuł nie spychał stopki.
  const titleSize = len > 60 ? 46 : len > 46 ? 52 : len > 30 ? 62 : 72;
  return el(
    { height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: OG.bg, color: OG.ink, padding: '70px 72px', fontFamily: 'Archivo' },
    [
      ecgBg,
      topBand(1200, 10),
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontSize: '27px', fontWeight: 600, color: OG.soft }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontSize: '27px', fontWeight: 600, color: OG.link, marginBottom: '18px' }, p.tag),
        el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: `${titleSize}px`, lineHeight: 1.04, letterSpacing: '-0.5px', color: OG.ink }, sierotki(p.title)),
        el({ display: 'flex', fontSize: '31px', lineHeight: 1.42, color: OG.soft, marginTop: '26px', maxWidth: '1010px' }, sierotki(p.subtitle)),
      ]),
      // paddingTop 25 (a nie 24) kompensuje usunięty 1 px bordera — wysokość bloku stopki
      // musi zostać ta sama, bo od niej zależy zmierzone ECG_BASELINE.
      el({ display: 'flex', alignItems: 'center', paddingTop: '25px', color: OG.faint, fontSize: '22px', lineHeight: '29px' }, [
        el({ display: 'flex' }, 'Jawność wynagrodzeń w ochronie zdrowia ze środków publicznych'),
      ]),
    ],
  );
}

export function getStaticPaths() {
  return Object.entries(ogPages).map(([route, page]) => ({ params: { route }, props: page }));
}

export const GET: APIRoute = async ({ props }) => {
  const page = props as OgPage;
  const node = page.variant === 'arcade' ? arcadeTemplate(page) : page.variant === 'egzamin' ? egzaminTemplate(page) : template(page);
  const svg = await satori(node as never, { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
