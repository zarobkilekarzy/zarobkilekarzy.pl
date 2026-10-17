/**
 * Szablon obrazka OG (rodzina A „Okładka”, 1200×630): logo, etykieta, tytuł, lead, stopka
 * i media po prawej (zdjęcie / karta liczby / brak). Satori → SVG (tekst jako krzywe) → sharp → PNG.
 *
 * Pułapki Satori:
 * - fonty: statyczne WOFF z @fontsource (pliki z Fonts API Astro są zmienne),
 * - podzbiór latin-ext musi być osobną rodziną („… Ext”) w jawnym stosie, inaczej giną ł/ż/ą/ę,
 * - div z więcej niż jednym dzieckiem wymaga display: flex, a wymiary liczymy jako border-box (robi to h()).
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import satori, { type Font } from 'satori';
import sharp, { type Sharp } from 'sharp';
import tokensCss from '@/styles/tokens.css?raw';
import { icons, type IconName } from '@/icons';
import { site } from '@/data/navigation';
import { typo } from '@/lib/format';
import { raw } from '@/lib/images';
import type { Accuracy, OgStat } from '@/types';
import { OG_HEIGHT, OG_WIDTH, type OgEntry, type OgMedia, type OgSpec } from './presets';

const PAD_X = 64;
const PAD_Y = 56;
const GAP = 56;
const MEDIA_W = 470;
const MEDIA_H = OG_HEIGHT - 2 * PAD_Y;
const TEXT_W = OG_WIDTH - 2 * PAD_X - MEDIA_W - GAP; // kolumna tekstu obok mediów
const WIDE_W = OG_WIDTH - 2 * PAD_X; // tytuł bez mediów: cała szerokość

/* ---------- Tokeny: jedno źródło prawdy z src/styles/tokens.css ---------- */
// Klocki oznaczone `export` dzieli z tym szablonem szablon infografik (lib/infografiki/render.ts).
// Obrazki OG są zawsze jasne: z light-dark(dzień, noc) bierzemy wartość dzienną (Satori nie zna light-dark)
const lightOf = (value: string) =>
  value.replace(/light-dark\(((?:[^(),]|\([^()]*\))+),(?:[^()]|\([^()]*\))+\)/g, '$1').trim();
const token = (name: string) => {
  const value = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
  if (!value) throw new Error(`[og] brak tokenu --${name} w tokens.css`);
  return lightOf(value);
};
export const C = {
  blue: token('blue'),
  blue50: token('blue-50'),
  blue700: token('blue-700'),
  ink: token('ink'),
  text: token('text'),
  muted: token('muted'),
  line: token('line'),
  amber: token('amber'),
  amberBg: token('amber-bg'),
};
export const DISPLAY = 'Inter Tight, Inter Tight Ext';
export const BODY = 'Plex Sans, Plex Sans Ext';
export const MONO = 'Plex Mono, Plex Mono Ext';
const SHADOW = token('shadow-photo').split(/,(?![^(]*\))/)[0]; // Satori: jeden cień

/* ---------- Fonty (ładowane raz) ---------- */
const resolveModule = createRequire(path.join(process.cwd(), 'package.json')).resolve;

const family = (name: string, pkg: string, weights: Font['weight'][]) =>
  weights.flatMap((weight) =>
    (['latin', 'latin-ext'] as const).map(async (subset): Promise<Font> => ({
      name: subset === 'latin' ? name : `${name} Ext`,
      weight,
      style: 'normal',
      data: await readFile(resolveModule(`@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff`)),
    })),
  );

let fonts: Promise<Font[]> | undefined;
export const loadFonts = () =>
  (fonts ??= Promise.all([
    ...family('Inter Tight', 'inter-tight', [300, 400, 500]),
    ...family('Plex Sans', 'ibm-plex-sans', [400, 600]),
    ...family('Plex Mono', 'ibm-plex-mono', [400, 500]),
  ]));

/* ---------- Zdjęcia: plik źródłowy z src/assets, kadr i desaturacja w sharp ---------- */
// Publiczne API zamiast prywatnego ImageMetadata.fsPath: dopasowanie po src do importów z src/assets
const assets = import.meta.glob<ImageMetadata>('/src/assets/**/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' });

function sourceFile(img: ImageMetadata): string {
  const key = Object.keys(assets).find((k) => raw(assets[k]).src === img.src);
  if (!key) throw new Error(`[og] obrazek spoza src/assets: ${img.src}`);
  return path.join(process.cwd(), key);
}

const photoCache = new Map<string, Promise<string>>();

/** Kadr jak object-fit: cover + object-position, w skali szarości jak na stronie (ui/Photo). */
function photoUri(tracked: ImageMetadata, position: string): Promise<string> {
  const img = raw(tracked);
  const key = `${img.src}|${position}`;
  if (!photoCache.has(key)) {
    photoCache.set(key, (async () => {
      if (img.width < MEDIA_W || img.height < MEDIA_H) console.warn(`[og] zdjęcie ${img.src} mniejsze niż ramka ${MEDIA_W}×${MEDIA_H}`);
      const scale = Math.max(MEDIA_W / img.width, MEDIA_H / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const [px = 50, py = 50] = position.split(/\s+/).map((p) => parseFloat(p));
      const buf = await sharp(sourceFile(img))
        .resize(w, h)
        .extract({ left: Math.round(((w - MEDIA_W) * px) / 100), top: Math.round(((h - MEDIA_H) * py) / 100), width: MEDIA_W, height: MEDIA_H })
        .grayscale()
        .linear(1.05, -6) // ≈ contrast(1.05)
        .jpeg({ quality: 85 })
        .toBuffer();
      return `data:image/jpeg;base64,${buf.toString('base64')}`;
    })());
  }
  return photoCache.get(key)!;
}

/* ---------- Mini-JSX dla Satori ---------- */
type Child = Node | string | false | null | undefined;
export interface Node { type: string; props: Record<string, unknown> }
type Style = Record<string, string | number>;

export function h(type: string, props: { style?: Style; [k: string]: unknown } = {}, ...children: (Child | Child[])[]): Node {
  const { style = {}, ...rest } = props;
  return {
    type,
    props: {
      ...rest,
      // jak reset w base.css; Satori ≥0.40 liczy domyślnie content-box (jak przeglądarka)
      style: type === 'div' ? { display: 'flex', boxSizing: 'border-box', ...style } : style,
      children: children.flat().filter((c) => c !== false && c != null),
    },
  };
}

const iconUri = (name: IconName, color: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${icons[name].replaceAll('currentColor', color)}</svg>`,
  ).toString('base64')}`;

/* ---------- Reguły typograficzne ---------- */
/**
 * Rozmiar tytułu wg długości. Przy ręcznych podziałach krój rośnie do szerokości najdłuższego
 * wiersza (≈0,46 em/znak), ale nie maleje poniżej progu z długości — za długi wiersz się zawinie.
 */
function titleSize(title: string, wide: boolean): number {
  const tiers = wide ? [[24, 104], [44, 88], [70, 72], [Infinity, 60]] : [[18, 80], [34, 70], [56, 60], [80, 52], [Infinity, 46]];
  const byLength = tiers.find(([max]) => title.length <= max)![1];
  const lines = title.split('\n');
  if (lines.length === 1) return byLength;
  const longest = Math.max(...lines.map((l) => l.length));
  const fit = Math.floor((wide ? WIDE_W : TEXT_W) / (longest * 0.46));
  return Math.max(byLength, Math.min(wide ? 104 : 80, fit));
}

/** Bez wdowy: dwa ostatnie słowa razem (gdy wierszy jest więcej niż dwa słowa, żeby nie zablokować łamania). */
const noWidow = (text: string) => (text.split(' ').length > 2 ? text.replace(/ (\S+)$/, '\u00A0$1') : text);

/**
 * Wiersze tytułu; końcowy znak w kolorze akcentu jak w ui/Heading (brak znaku = dopisana kropka).
 * Słowa są osobnymi elementami flex-wrap: tylko tak Satori stawia kolorowy znak zaraz za ostatnim
 * słowem zawiniętego wiersza. Dzielimy po zwykłych spacjach, więc twarde spacje z typo() sklejają sierotki.
 */
function titleLines(title: string): Child[] {
  const [, body, end] = title.match(/^(.*?)([.?!…]?)$/s)!;
  const lines = body.split('\n');
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const words = (isLast ? noWidow(line) : line).split(' ');
    const last = words.pop()!;
    const tail = isLast ? h('span', { style: { color: C.blue } }, end || '.') : null;
    return h('div', { style: { flexWrap: 'wrap' } },
      ...words.map((w) => h('span', { style: { marginRight: '0.2em' } }, w)),
      tail ? h('div', {}, last, tail) : h('span', {}, last));
  });
}

/** „1 358 placówek” → pogrubiona liczba + reszta (jak ui/Badge). */
const splitBadge = (text: string): [string | undefined, string] => {
  const m = text.match(/^([~><]?[\d\s\u00A0,.]*\d)\s(.+)$/);
  return m ? [m[1], m[2]] : [undefined, text];
};

/* ---------- Atomy ---------- */
/** Logo; kolory domyślnie dzienne — ciemne infografiki podają nocne (lib/infografiki/render.ts). */
export const logo = (c: Pick<typeof C, 'ink' | 'muted' | 'blue'> = C) =>
  h('div', { style: { alignItems: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: 26, letterSpacing: '-0.03em', color: c.ink } },
    h('img', { src: iconUri('logo', c.blue), width: 30, height: 30, style: { marginRight: 14 } }),
    'zarobkilekarzy',
    h('span', { style: { color: c.muted } }, '.pl'));

/** „Obserwuj @konto na [logo X]” — dyskretna linia w stopce obrazków OG i infografik. */
export const followX = (c: Pick<typeof C, 'ink' | 'muted'>, size: number, style: Style = {}) =>
  h('div', { style: { alignItems: 'center', fontSize: size, color: c.muted, whiteSpace: 'nowrap', ...style } },
    'Obserwuj',
    h('span', { style: { margin: '0 0.6em', color: c.ink } }, site.twitter),
    'na',
    h('img', { src: iconUri('x', c.ink), width: size, height: size, style: { marginLeft: Math.round(size * 0.45) } }));

const eyebrow = (text: string) =>
  h('div', { style: { alignItems: 'center', fontFamily: MONO, fontWeight: 500, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.blue } },
    h('div', { style: { width: 10, height: 10, marginRight: 12, background: C.blue } }),
    text);

const flag = (accuracy: Accuracy) =>
  h('div', {
    style: {
      padding: '5px 8px', fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
      background: accuracy === 'exact' ? C.blue50 : C.amberBg,
      color: accuracy === 'exact' ? C.blue700 : C.amber,
    },
  }, accuracy === 'exact' ? 'Dokładna' : 'Szacunek');

/** Stopka; linia „Obserwuj” po prawej, a przy wąskiej kolumnie (obok zdjęcia lub liczby) w osobnym wierszu. */
const footer = ({ text, flags }: NonNullable<OgSpec['footer']>, wide: boolean) =>
  h('div', { style: { flexDirection: 'column', paddingTop: 20, borderTop: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 15, color: C.muted } },
    h('div', { style: { alignItems: 'center', gap: 10 } },
      h('span', { style: { marginRight: flags ? 6 : 0 } }, typo(text)),
      flags && [flag('exact'), flag('est')],
      wide && followX(C, 15, { marginLeft: 'auto' })),
    !wide && followX(C, 15, { marginTop: 12 }));

/** Ramka z narożnymi uchwytami i cieniem (ui/Photo frame). */
const frame = (...children: Child[]) =>
  h('div', { style: { position: 'relative', flexShrink: 0, width: MEDIA_W, height: MEDIA_H, boxShadow: SHADOW } },
    ...children,
    h('div', { style: { position: 'absolute', top: -4, left: -4, width: 9, height: 9, background: C.blue } }),
    h('div', { style: { position: 'absolute', right: -4, bottom: -4, width: 9, height: 9, background: C.blue } }));

/* ---------- Media ---------- */
async function photo(m: Extract<OgMedia, { kind: 'photo' }>) {
  const [strong, rest] = m.badge ? splitBadge(typo(m.badge)) : [];
  return frame(
    h('img', { src: await photoUri(m.src, m.position), width: MEDIA_W, height: MEDIA_H }),
    m.badge && h('div', { style: { position: 'absolute', right: 14, bottom: 14, alignItems: 'center', padding: '15px 20px 15px 18px', background: C.blue, color: '#fff', fontFamily: BODY, fontSize: 18 } },
      m.icon && h('img', { src: iconUri(m.icon, '#fff'), width: 24, height: 24, style: { marginRight: 12 } }),
      strong && h('span', { style: { fontWeight: 600, marginRight: 6 } }, strong),
      rest ?? ''));
}

function stat(s: OgStat) {
  const [, prefix = '', value = s.value] = s.value.match(/^([~><]?)\s*(.+)$/) ?? [];
  const len = value.length;
  const size = len <= 2 ? 200 : len <= 4 ? 168 : len <= 6 ? 128 : 96;
  return frame(
    h('div', { style: { flexDirection: 'column', width: '100%', height: '100%', padding: '34px 36px 36px', background: C.blue, color: '#fff' } },
      s.label && h('div', { style: { fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)' } }, s.label),
      h('div', { style: { flexDirection: 'column', marginTop: 'auto' } },
        h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: size, lineHeight: 0.82, letterSpacing: '-0.05em' } },
          prefix && h('span', { style: { fontSize: size * 0.5, marginRight: 4, color: 'rgba(255,255,255,.6)' } }, prefix),
          value,
          s.unit && h('span', { style: { marginLeft: 14, fontFamily: BODY, fontWeight: 400, fontSize: 30, letterSpacing: 0, color: 'rgba(255,255,255,.85)' } }, typo(s.unit))),
        s.desc && h('div', { style: { marginTop: 22, fontFamily: DISPLAY, fontSize: 22, lineHeight: 1.3, letterSpacing: '-0.01em', color: 'rgba(255,255,255,.92)' } }, typo(s.desc)),
        (s.accuracy || s.source) && h('div', { style: { alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.3)', fontFamily: MONO, fontSize: 14, color: 'rgba(255,255,255,.75)' } },
          s.accuracy && flag(s.accuracy),
          s.source && typo(s.source)))));
}

/* ---------- Szablon ---------- */
async function layout(spec: OgSpec, route: string): Promise<Node> {
  const wide = spec.media.kind === 'none';
  const title = typo(spec.title);
  const size = titleSize(title, wide);
  if (!wide && !title.includes('\n') && title.length > 80) console.warn(`[og] ${route}: tytuł ma ${title.length} znaków — skróć go albo ustaw og.title`);
  // Lead tylko przy krótkim tytule, żeby całość mieściła się w kadrze
  const showLead = spec.lead && title.split('\n').length <= 3 && title.length <= (wide ? 48 : 34);

  return h('div', { style: { width: OG_WIDTH, height: OG_HEIGHT, padding: `${PAD_Y}px ${PAD_X}px`, background: '#fff', fontFamily: BODY, color: C.text } },
    h('div', { style: { flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: wide ? 0 : GAP } },
      logo(),
      h('div', { style: { flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', paddingTop: 24, paddingBottom: 24 } },
        spec.eyebrow && eyebrow(spec.eyebrow),
        h('div', { style: { flexDirection: 'column', marginTop: spec.eyebrow ? 26 : 0, maxWidth: wide ? WIDE_W : '100%', fontFamily: DISPLAY, fontWeight: 400, fontSize: size, lineHeight: 1, letterSpacing: '-0.04em', color: C.ink } },
          ...titleLines(title)),
        showLead && h('div', { style: { marginTop: 24, maxWidth: wide ? 820 : '100%', fontSize: 21, lineHeight: 1.5 } }, noWidow(typo(spec.lead!)))),
      spec.footer && footer(spec.footer, wide)),
    spec.media.kind === 'photo' ? await photo(spec.media) : spec.media.kind === 'stat' ? stat(spec.media.stat) : null);
}

/** PNG 1200×630 z paletą 8-bit: zdjęcia B&W + kolory marki mieszczą się w niej bez widocznej straty. */
export async function renderOg(entry: OgEntry): Promise<Buffer> {
  const png = (img: Sharp) => img.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  if (entry.file) return png(sharp(sourceFile(entry.file)).resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' }));

  const tree = await layout(entry.spec!, entry.route);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: await loadFonts() });
  return png(sharp(Buffer.from(svg)));
}
