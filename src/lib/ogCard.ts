// Wspólne klocki kart OG (satori + resvg, build-time). Używane przez DWA endpointy:
//   src/pages/og/[...route].png.ts        — karta 1200×630 (og:image, X/FB/LinkedIn)
//   src/pages/og-wykop/[...route].png.ts  — karta 880×568 pod miniaturę wykop.pl
// Wszystko, co wspólne (fonty, logo, tło EKG), trzymamy TU — inaczej obie karty
// rozjadą się stylistycznie przy pierwszej zmianie.
import { readFileSync } from 'node:fs';

// Fonty: latin + latin-ext SCALONE w jeden plik na krój (src/assets/fonts, wygenerowane
// przez fonttools) → pełne pokrycie polskich znaków (ł, ę, ś, ć, ń, ż, ź, ą) BEZ
// polegania na fallbacku satori (który dobiera font po kolejności tablicy, nie po rodzinie).
// Archivo jak na stronie, ale jako statyczne instancje — satori nie obsługuje fontów
// zmiennych: 400 i 600 w szerokości 100, „Archivo Wide” 800 w szerokości 112 (tytuły
// i liczby, jak nagłówki serwisu). Plex Mono zostaje tylko dla karty gry (styl automatu).
const ff = (p: string) => readFileSync(`src/assets/fonts/${p}`);
export const fonts = [
  { name: 'Archivo', data: ff('archivo-latin-full-400.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Archivo', data: ff('archivo-latin-full-600.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Archivo Wide', data: ff('archivo-wide-latin-full-800.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: ff('ibm-plex-mono-latin-full-500.woff'), weight: 500 as const, style: 'normal' as const },
];

// Paleta kart: granat jako tło, jasna farba, czerwień tylko w pasie marki
// i przy brakującej sumie. Odcienie tekstu dobrane pod kontrast ≥ 6:1 na granacie.
export const OG = {
  bg: '#0b2a5b',
  night: '#0a1222',
  ink: '#ffffff',
  soft: '#c6d3e8',
  faint: '#9fb1cf',
  link: '#8fb3ff',
  rule: '#2c4a7c',
  signal: '#d42a24',
};

// Twarda spacja po jednoliterowych spójnikach i przyimkach („z”, „i”, „w”…), żeby nie
// wisiały na końcu wiersza — satori sam tego nie robi.
export const sierotki = (t: string) => t.replace(/(^|[\s(„])([aiouwzAIOUWZ])\s+/g, '$1$2\u00a0');

// Minimalny konstruktor vnode dla satori (bez JSX/satori-html — zero whitespace).
export type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string; [attr: string]: unknown } };
export const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({ type: 'div', props: { style, children } });

// Czerwony pas przez całą szerokość górnej krawędzi — stały znak marki na kartach, jak
// pasek winiety gazety (zamiast grubego paska z lewej). Absolute, a nie borderTop: nie przesuwa układu, więc zmierzone
// pozycje (linia EKG pod stopką) zostają ważne. Wstawiać PO obrazku tła — kryjące tło
// karty arcade by go zasłoniło.
export const topBand = (width: number, height: number): Node =>
  el({ position: 'absolute', top: 0, left: 0, width: `${width}px`, height: `${height}px`, background: OG.signal });

// Logo — to samo źródło co favicon i znak w nawigacji (public/favicon.svg). Satori nie
// renderuje inline SVG jako drzewa vnode, więc plik wchodzi jako <img> z data URI.
// Granatowe tło znaku ginęłoby na granacie karty, więc na OG znak jest odwrócony:
// biały kwadrat, granatowy puls — kształt bez zmian.
const logoSvg = readFileSync('public/favicon.svg', 'utf8')
  .replace('fill="#1446a0"', 'fill="#ffffff"')
  .replace('stroke="#ffffff"', `stroke="${OG.bg}"`);
const logoSrc = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;
export const logo = (size: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src: logoSrc, width: size, height: size, style },
});

// Tło: wielki, ledwie widoczny zapis EKG — element graficzny, nie treść. Ta sama droga
// co logo (<img> z data URI), bo satori nie rysuje ścieżek SVG.
//
// WYŁĄCZNIE odcinki proste — krzywe (Q/C) dawały z załamków P i T półkola, których EKG
// nie ma. Jeden cykl w proporcjach szerokości cyklu (w) i amplitudy załamka R (a): długi
// odcinek izoelektryczny → wąski, ostry zespół QRS → niski, szeroki załamek T. Załamka P
// celowo nie ma: mniej szczegółów, bardziej czytelny rysunek. Ten sam język co logo
// (public/favicon.svg) — sama łamana, zero krzywizn.
const ecgCycle = (x: number, y: number, w: number, a: number) =>
  [
    `M${x},${y}`,
    `L${x + 0.3 * w},${y}`,
    `L${x + 0.35 * w},${y + 0.09 * a}`, // Q
    `L${x + 0.41 * w},${y - a}`, // R
    `L${x + 0.47 * w},${y + 0.28 * a}`, // S
    `L${x + 0.52 * w},${y}`,
    `L${x + 0.62 * w},${y}`,
    `L${x + 0.72 * w},${y - 0.15 * a}`, // T
    `L${x + 0.84 * w},${y}`,
    `L${x + w},${y}`,
  ].join(' ');

export interface EcgOpts {
  width: number;
  height: number;
  baseline: number;   // y linii izoelektrycznej (px)
  amplitude: number;  // wysokość załamka R (px)
  cycles: number;
  stroke: number;
  opacity: number;
  fadeFrom: number;   // ułamek wysokości, od którego trace zaczyna nikać w dół
  fadeTo: number;     // ułamek wysokości, na którym znika całkiem
}

export function ecgBackground(o: EcgOpts): Node {
  const cw = o.width / o.cycles;
  const d = Array.from({ length: o.cycles }, (_, i) => ecgCycle(i * cw, o.baseline, cw, o.amplitude)).join(' ');
  // Dwa wygaszenia: poziome (linia nie urywa się twardo na krawędziach karty) i pionowe
  // przez maskę (załamki S nikną, zamiast przecinać to, co jest pod linią).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8fb3ff" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#8fb3ff" stop-opacity="1"/>
      <stop offset="0.78" stop-color="#8fb3ff" stop-opacity="1"/>
      <stop offset="1" stop-color="#8fb3ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="v" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${o.height}">
      <stop offset="${o.fadeFrom}" stop-color="#ffffff"/>
      <stop offset="${o.fadeTo}" stop-color="#000000"/>
    </linearGradient>
    <mask id="m"><rect width="${o.width}" height="${o.height}" fill="url(#v)"/></mask>
  </defs>
  <!-- linejoin=miter daje ostre wierzchołki, ale WYMAGA wysokiego miterlimit: przy kącie
       załamka R (~11°) potrzebny jest ~10, a poniżej progu SVG po cichu ścina wierzchołek
       do bevela (płaski szczyt). Nie zjeżdżać z limitem, bo stożki tępieją. -->
  <path d="${d}" fill="none" stroke="url(#f)" stroke-width="${o.stroke}" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="14" opacity="${o.opacity}" mask="url(#m)"/>
</svg>`;
  return {
    type: 'img',
    props: {
      src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      width: o.width,
      height: o.height,
      style: { position: 'absolute', top: 0, left: 0 },
    },
  };
}
