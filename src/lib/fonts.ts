// Fonty strony — jedno źródło dla astro.config.mjs (rejestracja w Fonts API) i BaseLayout (preload).
//
// Pliki w src/assets/fonts/ to przycięte wersje Fontsource: oś grubości zawężona do używanych
// grubości, a znaki podzielone na trzy pliki z rozłącznym unicode-range:
//   latin — podstawowy alfabet z „ó”, cyfry, interpunkcja („”, –, …)
//   pl    — pozostałe polskie litery (ąćęłńśźż), 3–6 KB zamiast całego latin-ext (46–88 KB)
//   ext   — reszta latin-ext (np. „ř”, „ő” w porównaniach krajów); przeglądarka pobiera go
//           tylko na stronie, która ma taki znak
// Preload tylko latin + pl grubości z pierwszego ekranu każdej strony. Preload wszystkiego
// (8 pełnych plików variable, ~300 KB) wydłużał LCP na telefonie o ~1,5 s — rywalizował z CSS o łącze.
//
// IBM Plex ma w licencji OFL zastrzeżoną nazwę „Plex”, więc przycięte pliki mają nazwę wewnętrzną
// „ZL Sans” / „ZL Mono” (licencje obok plików). Nowa grubość w CSS wymaga nowego pliku — bez niego
// przeglądarka weźmie najbliższą istniejącą.

type Part = 'latin' | 'pl' | 'ext';

const RANGES: Record<Part, [string, ...string[]]> = {
  latin: [
    'U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308',
    'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FEFF', 'U+FFFD',
  ],
  pl: ['U+0104-0107', 'U+0118-0119', 'U+0141-0144', 'U+015A-015B', 'U+0179-017C'],
  ext: [
    'U+0100-0103', 'U+0108-0117', 'U+011A-0140', 'U+0145-0159', 'U+015C-0178', 'U+017D-02BA', 'U+02BD-02C5',
    'U+02C7-02CC', 'U+02CE-02D7', 'U+02DD-02FF', 'U+1D00-1DBF', 'U+1E00-1E9F', 'U+1EF2-1EFF', 'U+2020',
    'U+20A0-20AB', 'U+20AD-20C0', 'U+2113', 'U+2C60-2C7F', 'U+A720-A7FF',
  ],
};

export interface FontVariant {
  src: [string];
  weight: string;
  style: 'normal';
  unicodeRange: [string, ...string[]];
  /** Plik z pierwszego ekranu — dostaje <link rel="preload"> */
  preload: boolean;
}

export interface FontFamily {
  name: string;
  cssVariable: '--font-inter-tight' | '--font-plex-sans' | '--font-plex-mono';
  fallbacks: string[];
  variants: [FontVariant, ...FontVariant[]];
}

/** Warianty w formacie Fonts API (`fontProviders.local()`) — bez naszej flagi preload */
export const localVariants = ({ variants }: FontFamily) =>
  variants.map(({ preload: _, ...variant }) => variant) as [Omit<FontVariant, 'preload'>, ...Omit<FontVariant, 'preload'>[]];

const variants = (file: string, weight: string, preload: boolean) =>
  (['latin', 'pl', 'ext'] as const).map((part): FontVariant => ({
    src: [`./src/assets/fonts/${file}-${part}.woff2`],
    weight,
    style: 'normal',
    unicodeRange: RANGES[part],
    preload: preload && part !== 'ext',
  })) as [FontVariant, FontVariant, FontVariant];

export const fontFamilies: FontFamily[] = [
  {
    // Nagłówki (.display, .h2) w 400, pozostałe użycia 300 i 500
    name: 'Inter Tight',
    cssVariable: '--font-inter-tight',
    fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    variants: variants('inter-tight', '300 500', true),
  },
  {
    // Tekst w 400; 500–700 w wyróżnieniach i <strong>
    name: 'ZL Sans',
    cssVariable: '--font-plex-sans',
    fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    variants: variants('plex-sans', '400 700', true),
  },
  {
    // Etykiety na każdej stronie w 500; 400 w tabelach i liczbach
    name: 'ZL Mono',
    cssVariable: '--font-plex-mono',
    fallbacks: ['Menlo', 'monospace'],
    variants: [...variants('plex-mono-500', '500', true), ...variants('plex-mono-400', '400', false)],
  },
];
