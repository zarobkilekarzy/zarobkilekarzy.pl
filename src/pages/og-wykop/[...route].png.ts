import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogPages, type OgPage } from '../../lib/ogPages';
import { fonts, el, logo, ecgBackground, type Node } from '../../lib/ogCard';

// Miniatura pod wykop.pl. Osobna karta, bo Wykop ma własny, sztywny format i NIE czyta
// żadnego dedykowanego tagu meta (nie ma odpowiednika `twitter:image`) — obrazek wybiera
// się ręcznie przy dodawaniu znaleziska.
//
// Format zmierzony na żywym Wykopie (2026-07-17, lista tagu, „Hity dnia" i strona
// znaleziska — 9/9 miniatur identycznie): CDN serwuje `…,w440h284.png`, a element ma
// `object-fit: cover` i wymiar 220×142 CSS px. Czyli:
//   • proporcja 440/284 = 1,549 — NIE 1,905 karty og:image (tamta zostałaby przycięta
//     po bokach, ~9% z każdej strony),
//   • realny rozmiar oglądany przez człowieka to 220×142 (miniatura obok tytułu).
// Rysujemy w 880×568 = dokładnie 2× formatu CDN: proporcja idealna (zero przycięcia),
// a downscale Wykopu do 440×284 jest czystym 2:1.
const W = 880;
const H = 568;

// PROJEKT PODPORZĄDKOWANY CZYTELNOŚCI PRZY 220 px SZEROKOŚCI (skala 1:4):
//   • podtytuł WYPADA — 31 px karty og:image zeszłoby do ~6 px, czyli plamy,
//   • tytuł dostaje resztę miejsca i rośnie (72 px → 18 px na ekranie),
//   • tag zostaje, ale większy i rozstrzelony — przy tej skali czyta się jako etykieta.
// Nie dokładać tu treści: przy 220×142 każdy dodatkowy element odbiera miejsce tytułowi.
const ecgBg = ecgBackground({
  width: W - 12, // minus czerwony border: absolute pozycjonuje się od padding boxa
  height: H,
  baseline: 498,
  amplitude: 150,
  cycles: 2, // mniej cykli niż na dużej karcie — przy miniaturze 3 zlewały się w szum
  stroke: 5,
  opacity: 0.13, // ciut mocniej niż 0.1 na dużej karcie: po zejściu do 220 px linia blednie
  fadeFrom: 0.88,
  fadeTo: 0.99,
});

function template(p: OgPage): Node {
  const len = p.title.length;
  const titleSize = len > 46 ? 58 : len > 30 ? 70 : 82;
  return el(
    { height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: '#14233a', color: '#ffffff', padding: '44px 48px', fontFamily: 'Plex Sans', borderLeft: '12px solid #b3261e' },
    [
      ecgBg,
      el({ display: 'flex', alignItems: 'center' }, [
        logo(28, { marginRight: '14px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '25px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }, [
        el({ display: 'flex', fontSize: '26px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '18px' }, p.tag),
        el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: `${titleSize}px`, lineHeight: 1.06, color: '#ffffff' }, p.title),
      ]),
    ],
  );
}

export function getStaticPaths() {
  return Object.entries(ogPages).map(([route, page]) => ({ params: { route }, props: page }));
}

export const GET: APIRoute = async ({ props }) => {
  const svg = await satori(template(props as OgPage) as never, { width: W, height: H, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
