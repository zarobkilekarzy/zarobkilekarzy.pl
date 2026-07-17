// Wspólne klocki kart OG (satori + resvg, build-time). Używane przez DWA endpointy:
//   src/pages/og/[...route].png.ts        — karta 1200×630 (og:image, X/FB/LinkedIn)
//   src/pages/og-wykop/[...route].png.ts  — karta 880×568 pod miniaturę wykop.pl
// Wszystko, co wspólne (fonty, logo, tło EKG), trzymamy TU — inaczej obie karty
// rozjadą się stylistycznie przy pierwszej zmianie.
import { readFileSync } from 'node:fs';

// Fonty: latin + latin-ext SCALONE w jeden plik na krój (src/assets/fonts, wygenerowane
// raz przez fonttools) → pełne pokrycie polskich znaków (ł, ę, ś, ć, ń, ż, ź, ą) BEZ
// polegania na fallbacku satori (który dobiera font po kolejności tablicy, nie po rodzinie
// — serif łapałby wtedy latin-ext z sans). Dzięki temu serif zostaje serifem.
const ff = (p: string) => readFileSync(`src/assets/fonts/${p}`);
export const fonts = [
  { name: 'Plex Sans', data: ff('ibm-plex-sans-latin-full-400.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Plex Sans', data: ff('ibm-plex-sans-latin-full-600.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Plex Serif', data: ff('ibm-plex-serif-latin-full-700.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Plex Mono', data: ff('ibm-plex-mono-latin-full-500.woff'), weight: 500 as const, style: 'normal' as const },
];

// Minimalny konstruktor vnode dla satori (bez JSX/satori-html — zero whitespace).
export type Node = { type: string; props: { style: Record<string, unknown>; children?: Node[] | string; [attr: string]: unknown } };
export const el = (style: Record<string, unknown>, children?: Node[] | string): Node => ({ type: 'div', props: { style, children } });

// Logo — to samo źródło co favicon i znak w nawigacji (public/favicon.svg). Satori nie
// renderuje inline SVG jako drzewa vnode, więc plik wchodzi jako <img> z data URI.
// Granatowe tło znaku (#0f4c81) ginie na granacie karty (#14233a), więc na potrzeby OG
// kwadrat dostaje jaśniejszy błękit — kształt i puls zostają bez zmian.
const logoSvg = readFileSync('public/favicon.svg', 'utf8').replace('#0f4c81', '#4aa9e0');
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
      <stop offset="0" stop-color="#7cc4f2" stop-opacity="0"/>
      <stop offset="0.22" stop-color="#7cc4f2" stop-opacity="1"/>
      <stop offset="0.78" stop-color="#7cc4f2" stop-opacity="1"/>
      <stop offset="1" stop-color="#7cc4f2" stop-opacity="0"/>
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
