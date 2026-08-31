// Wariant karty OG dla /gra — jedyna strona, która wyłamuje się ze wspólnego szablonu.
// Powód: to satyryczny idle clicker, nie analiza. Karta gra estetyką automatu z lat 80.
// (neon, aberracja chromatyczna, siatka perspektywiczna, scanlines) — zamiast granatu
// i EKG. Marka trzyma się na stałych: czerwony border z lewej, logo + domena u góry.
//
// GRANICA SATYRY: forma jest arcade'owa, ale LICZBA na karcie jest prawdziwa —
// 316 tys. zł miesięcznie to udokumentowany rekord rozliczenia ze środków publicznych
// (patrz /dane/rekordy), nie wynik z gry. Podpis mówi to wprost, żeby nikt nie odczytał
// „HIGH SCORE" jako zmyślonego licznika.
import { el, logo, type Node } from './ogCard';
import type { OgPage } from './ogPages';

const W = 1184; // 1200 minus 16 px czerwonego bordera — absolute liczy się od padding boxa
const H = 630;

// Tło jako JEDEN obrazek (satori nie rysuje ścieżek SVG, a gradienty CSS w resvg bywają
// niedeterministyczne przy skalowaniu) — poświata, podłoga w perspektywie i scanlines
// razem, żeby warstwy nie rozjechały się względem siebie.
function arcadeBg(): Node {
  const vpx = W / 2;      // punkt zbiegu siatki
  const vpy = 356;
  const horizon = 430;    // od tej wysokości w dół rysuje się „podłoga"

  // Poziome linie podłogi: rozstaw rośnie kwadratowo w dół — tak wygląda perspektywa.
  const rows = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 9;
    const y = horizon + (H - horizon) * t * t;
    return `<line x1="0" y1="${y.toFixed(1)}" x2="${W}" y2="${y.toFixed(1)}"/>`;
  }).join('');
  // Pionowe: promienie z punktu zbiegu, przedłużone poza kadr, żeby dochodziły do krawędzi.
  const cols = Array.from({ length: 19 }, (_, i) => {
    const x = -900 + i * 220;
    return `<line x1="${vpx}" y1="${vpy}" x2="${x}" y2="${H}"/>`;
  }).join('');
  // Scanlines: ciemny pasek co 5 px. Karta renderuje się 1:1 (fitTo width 1200), więc
  // rastr nie moiré'uje. Przy zmianie skali renderu ten odstęp trzeba przeliczyć.
  const scan = Array.from({ length: Math.ceil(H / 5) }, (_, i) =>
    `<rect x="0" y="${i * 5}" width="${W}" height="2"/>`).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.72">
      <stop offset="0" stop-color="#1d4a7d" stop-opacity="0.85"/>
      <stop offset="0.55" stop-color="#0d1c33" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#05070f" stop-opacity="0"/>
    </radialGradient>
    <!-- Maska podłogi: linie wynurzają się z ciemności przy horyzoncie i PRZYGASAJĄ przy
         samym dole — inaczej siatka przecinałaby stopkę i utrudniała jej czytanie. -->
    <linearGradient id="floor" gradientUnits="userSpaceOnUse" x1="0" y1="${horizon}" x2="0" y2="${H}">
      <stop offset="0" stop-color="#000000"/>
      <stop offset="0.35" stop-color="#ffffff"/>
      <stop offset="0.72" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#4d4d4d"/>
    </linearGradient>
    <mask id="floorMask"><rect width="${W}" height="${H}" fill="url(#floor)"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#05070f"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g stroke="#45c4cf" stroke-width="2" opacity="0.34" mask="url(#floorMask)">${rows}${cols}</g>
  <g fill="#000000" opacity="0.3">${scan}</g>
</svg>`;
  return {
    type: 'img',
    props: {
      src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      width: W,
      height: H,
      style: { position: 'absolute', top: 0, left: 0 },
    },
  };
}

// Aberracja chromatyczna + poświata neonu. Rozjazd kanałów (czerwień w prawo, teal w lewo)
// to sygnał „kineskop"; bez niego sam glow wygląda jak zwykły cień.
const NEON = [
  '5px 0 0 rgba(255,107,97,0.55)',
  '-5px 0 0 rgba(69,196,207,0.5)',
  '0 0 22px rgba(245,197,66,0.55)',
  '0 0 56px rgba(245,197,66,0.32)',
].join(', ');

export function arcadeTemplate(p: OgPage): Node {
  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: '#05070f', color: '#ffffff', padding: '56px 64px',
      fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e',
    },
    [
      arcadeBg(),
      el({ display: 'flex', alignItems: 'center' }, [
        logo(28, { marginRight: '15px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '25px', color: '#7f93ad', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', alignItems: 'center' }, [
        el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '23px', letterSpacing: '9px', color: '#45c4cf', marginBottom: '26px' }, p.tag.toUpperCase()),
        el({
          display: 'flex', fontFamily: 'Plex Mono', fontSize: '102px', letterSpacing: '9px',
          color: '#ffdf7e', textShadow: NEON,
        }, p.title.toUpperCase()),
        el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '28px', letterSpacing: '5px', color: '#7ee08a', marginTop: '34px' }, '» INSERT PUBLIC MONEY «'),
        el({ display: 'flex', alignItems: 'baseline', marginTop: '40px' }, [
          el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '24px', letterSpacing: '4px', color: '#8aa0b6', marginRight: '18px' }, 'HIGH SCORE'),
          el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '44px', color: '#f5c542' }, '316 000 zł/mies.'),
        ]),
        el({ display: 'flex', fontSize: '21px', color: '#8aa0b6', marginTop: '12px' }, 'prawdziwy rekord rozliczenia ze środków publicznych — nie wynik z gry'),
      ]),
      el({ display: 'flex', alignItems: 'center', paddingTop: '22px', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, p.short ?? 'Każdy mechanizm z gry istnieje naprawdę'),
      ]),
    ],
  );
}
