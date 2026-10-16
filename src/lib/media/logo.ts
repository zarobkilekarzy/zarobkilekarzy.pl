/**
 * Pakiet logo do pobrania na /media/ (endpoint: pages/media/logo/[plik].ts): logo poziome na jasne
 * i na ciemne tło oraz sam znak, każde jako SVG i PNG.
 *
 * Logo to ten sam układ co w nagłówku obrazków OG (lib/og/render.ts, `logo`): znak + „zarobkilekarzy”
 * Inter Tight 500 + „.pl” w kolorze stonowanym. Satori zamienia tekst na krzywe, więc SVG nie zależy
 * od fontów u odbiorcy. Pole SVG przycinamy do obrysu (sharp `trim` na podglądzie PNG) — margines
 * ochronny dokłada użytkownik według zasad na /media/. Kolory z tokens.css przez palety infografik.
 */
import sharp from 'sharp';
import satori from 'satori';
import { icons } from '@/icons';
import { DISPLAY, h, loadFonts } from '@/lib/og/render';
import { THEMES } from '@/lib/infografiki/render';

export type LogoFormat = 'svg' | 'png';

export interface LogoFile {
  /** nazwa pliku bez rozszerzenia */
  slug: string;
  label: string;
  /** tło podglądu na /media/ */
  background: 'jasne' | 'ciemne';
}

export const LOGOS: LogoFile[] = [
  { slug: 'zarobkilekarzy-logo', label: 'Logo na jasne tło', background: 'jasne' },
  { slug: 'zarobkilekarzy-logo-biale', label: 'Logo na ciemne tło', background: 'ciemne' },
  { slug: 'zarobkilekarzy-znak', label: 'Znak', background: 'jasne' },
];

export const LOGO_FORMATS: LogoFormat[] = ['svg', 'png'];

/** Adres pliku: /media/logo/<slug>.<svg|png> */
export const logoUrl = (logo: LogoFile, format: LogoFormat) => `/media/logo/${logo.slug}.${format}`;

/** Znak: kwadrat 24×24 z linią EKG (icons.logo), skalowany bez utraty jakości. */
const MARK = 512;
const markSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="${MARK}" height="${MARK}" viewBox="0 0 24 24">${icons.logo}</svg>`;

/** Logo poziome w skali ×4 względem nagłówka OG (znak 30 → 120 px, tekst 26 → 104 px). */
const SCALE = 4;
const CANVAS = { width: 1400, height: 200 };

async function wordmarkSvg(background: LogoFile['background']): Promise<string> {
  const night = background === 'ciemne';
  // na ciemne tło: biel zamiast nocnego atramentu (logo ma wyglądać tak samo na każdym ciemnym tle)
  const ink = night ? '#FFFFFF' : THEMES.jasny.colors.ink;
  const muted = THEMES[night ? 'ciemny' : 'jasny'].colors.muted;
  const mark = `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString('base64')}`;
  const tree = h('div', { style: { ...CANVAS, alignItems: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: 26 * SCALE, letterSpacing: '-0.03em', color: ink } },
    h('img', { src: mark, width: 30 * SCALE, height: 30 * SCALE, style: { marginRight: 14 * SCALE } }),
    'zarobkilekarzy',
    h('span', { style: { color: muted } }, '.pl'));
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { ...CANVAS, fonts: await loadFonts() });
  // obrys rysunku z rastra, potem to samo pole jako viewBox wektora
  const { info } = await sharp(Buffer.from(svg)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const [x, y] = [-(info.trimOffsetLeft ?? 0), -(info.trimOffsetTop ?? 0)];
  return svg.replace(/^<svg[^>]*>/, (open) =>
    open
      .replace(/width="[^"]*"/, `width="${info.width}"`)
      .replace(/height="[^"]*"/, `height="${info.height}"`)
      .replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${info.width} ${info.height}"`));
}

/** Plik logo: SVG wprost, PNG z przezroczystym tłem w dwukrotnej rozdzielczości SVG. */
export async function renderLogo(logo: LogoFile, format: LogoFormat): Promise<Buffer> {
  const svg = logo.slug.endsWith('znak') ? markSvg() : await wordmarkSvg(logo.background);
  if (format === 'svg') return Buffer.from(svg);
  return sharp(Buffer.from(svg), { density: 144 }).png({ compressionLevel: 9 }).toBuffer();
}
