/**
 * Szablon obrazka OG (rodzina A „Okładka”, 1200×630): logo, etykieta, tytuł, lead, stopka
 * i media po prawej (zdjęcie / karta liczby / mapa / wykres / logo / brak). Satori → SVG (tekst jako krzywe) → sharp → PNG.
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
import { formatPL, typo } from '@/lib/format';
import { raw } from '@/lib/images';
import { geo } from '@/lib/mapa/geo';
import { toneOfClass } from '@/lib/mapa/layout';
import { renderMapSvg, staticColors } from '@/lib/mapa/svg';
import { tokenColor } from '@/lib/tokens';
import { GEOMETRY, frameLines, polyline } from '@/lib/siatka';
import type { OgCover } from '@/types';
import type { Accuracy, OgDots, OgStamp, OgStat } from '@/types';
import { NARROW_TITLE_MAX, OG_HEIGHT, OG_WIDTH, type OgEntry, type OgMedia, type OgSpec } from './presets';

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
  // kotwica na początku wiersza (jak lib/tokens): nazwy tokenów padają też w komentarzach („--chart: słupek…”)
  const value = tokensCss.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'))?.[1].trim();
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
const assets = import.meta.glob<ImageMetadata>('/src/assets/**/*.{jpg,jpeg,png,webp,avif,svg}', { eager: true, import: 'default' });

function sourceFile(img: ImageMetadata): string {
  const key = Object.keys(assets).find((k) => raw(assets[k]).src === img.src);
  if (!key) throw new Error(`[og] obrazek spoza src/assets: ${img.src}`);
  return path.join(process.cwd(), key);
}

const photoCache = new Map<string, Promise<string>>();

/** Kadr jak object-fit: cover + object-position, w skali szarości jak na stronie (ui/Photo); ilustracja (`color`) zostaje w kolorze. */
function photoUri(tracked: ImageMetadata, position: string, color = false): Promise<string> {
  const img = raw(tracked);
  const key = `${img.src}|${position}|${color}`;
  if (!photoCache.has(key)) {
    photoCache.set(key, (async () => {
      if (img.width < MEDIA_W || img.height < MEDIA_H) console.warn(`[og] zdjęcie ${img.src} mniejsze niż ramka ${MEDIA_W}×${MEDIA_H}`);
      const scale = Math.max(MEDIA_W / img.width, MEDIA_H / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const [px = 50, py = 50] = position.split(/\s+/).map((p) => parseFloat(p));
      const crop = sharp(sourceFile(img))
        .resize(w, h)
        .extract({ left: Math.round(((w - MEDIA_W) * px) / 100), top: Math.round(((h - MEDIA_H) * py) / 100), width: MEDIA_W, height: MEDIA_H });
      const buf = await (color ? crop : crop.grayscale().linear(1.05, -6)) // ≈ contrast(1.05)
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
    h('img', { src: await photoUri(m.src, m.position, m.color), width: MEDIA_W, height: MEDIA_H }),
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

/**
 * Mapa tym samym rendererem co strona (lib/mapa/svg), bez ramki — wprost na tle; pod nią legenda klas.
 * W ciemnej wersji kropka legendy stoi na krążku w kolorze województw, bo jasne odcienie giną na bieli.
 */
function map(m: Extract<OgMedia, { kind: 'map' }>) {
  const theme = m.theme ?? 'jasny';
  const src = `data:image/svg+xml;base64,${Buffer.from(renderMapSvg([m.layer], { theme, active: m.layer.id, labels: false })).toString('base64')}`;
  const { seq, base, missing } = staticColors(theme === 'ciemny');
  const color = (cls: number | null) => (cls == null ? missing : seq[toneOfClass(cls, m.layer.scale)]);
  const dot = (classes: (number | null)[]) =>
    h('div', { style: { alignItems: 'center', height: 22, marginRight: 9, padding: theme === 'ciemny' ? '0 5px' : 0, borderRadius: 11, background: theme === 'ciemny' ? base : 'transparent' } },
      ...classes.map((cls, i) => h('div', { style: { width: 12, height: 12, marginLeft: i ? 3 : 0, borderRadius: '50%', background: color(cls) } })));
  return h('div', { style: { flexDirection: 'column', justifyContent: 'center', flexShrink: 0, width: MEDIA_W, height: MEDIA_H } },
    h('img', { src, width: MEDIA_W, height: Math.round((MEDIA_W * geo.height) / geo.width) }),
    m.legend && h('div', { style: { flexWrap: 'wrap', gap: '8px 22px', marginTop: 20, fontFamily: BODY, fontSize: 16, color: C.text } },
      ...m.legend.map(([cls, label]) => h('div', { style: { alignItems: 'center' } }, dot(Array.isArray(cls) ? cls : [cls]), typo(label)))));
}

/** Wiersze z paskami we wspólnej skali od zera, jak w infografikach: wyróżniony wiersz w kobalcie, reszta w łupku. */
function bars(b: Extract<OgMedia, { kind: 'bars' }>) {
  const max = Math.max(...b.rows.map((r) => r.value));
  // przy 5–6 wierszach układ gęsty (jak GD w infografikach); do 4 wierszy bez zmian
  const dense = b.rows.length > 4;
  const [gap, labelSize, valueSize, barH] = dense ? [18, 18, 42, 10] : [26, 20, 56, 14];
  return h('div', { style: { flexDirection: 'column', justifyContent: 'center', flexShrink: 0, width: MEDIA_W, height: MEDIA_H } },
    b.head && h('div', { style: { paddingBottom: 14, borderBottom: `1px solid ${C.line}`, fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted } }, typo(b.head)),
    ...b.rows.map((r) =>
      h('div', { style: { flexDirection: 'column', paddingTop: gap } },
        h('div', { style: { alignItems: 'flex-end', justifyContent: 'space-between' } },
          h('div', { style: { flexDirection: 'column', paddingBottom: 4, paddingRight: 16 } },
            h('span', { style: { fontSize: labelSize, lineHeight: 1.25, color: C.ink } }, typo(r.label)),
            r.sub && h('span', { style: { marginTop: 4, fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: r.marked ? C.blue : C.muted } }, typo(r.sub))),
          h('div', { style: { alignItems: 'baseline', flexShrink: 0, fontFamily: DISPLAY, fontWeight: 300, fontSize: valueSize, lineHeight: 0.9, letterSpacing: '-0.045em', color: r.marked ? C.blue : C.ink } },
            r.display ?? formatPL(r.value),
            b.unit && h('span', { style: { marginLeft: 4, fontSize: Math.round(valueSize * 0.5), letterSpacing: 0 } }, b.unit))),
        h('div', { style: { width: Math.max(2, Math.round((r.value / max) * MEDIA_W)), height: barH, marginTop: dense ? 9 : 12, background: r.marked ? C.blue : tokenColor('chart', false) } }))));
}

/**
 * Wykresy strony jeden pod drugim (np. symulator: nabór → wynik). Linie i pola zostają w SVG,
 * a podpisy <text> stają się tekstem Satori w tym samym miejscu — SVG w <img> nie zna krojów serwisu.
 */
const LABEL = 13;
const BIG_LABEL = 26;
const TEXT_RE = /<text class="([^"]*)" x="([^"]+)" y="([^"]+)"(?: text-anchor="([^"]+)")?>([^<]*)<\/text>/g;

function panel({ head, svg, height }: Extract<OgMedia, { kind: 'panels' }>['panels'][number]) {
  const labels = [...svg.matchAll(TEXT_RE)].map(([, cls, x, y, anchor = 'start', text]) => {
    const left = parseFloat(x);
    const big = cls.includes('c-label--big');
    const size = big ? BIG_LABEL : LABEL;
    const pos: Style = anchor === 'end' ? { right: MEDIA_W - left } : anchor === 'middle' ? { left: left - 60, width: 120, justifyContent: 'center' } : { left };
    return h('div', {
      style: {
        position: 'absolute', top: Math.round(parseFloat(y) - size * 0.85), ...pos,
        fontFamily: big ? DISPLAY : MONO, fontSize: size, lineHeight: 1, letterSpacing: big ? '-0.03em' : 0, whiteSpace: 'nowrap',
        color: cls.includes('c-label--blue') ? C.blue : cls.includes('c-label--strong') ? C.ink : C.muted,
      },
    }, text.replace(/&lt;/g, '<').replace(/&amp;/g, '&'));
  });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg.replace(TEXT_RE, '')).toString('base64')}`;
  return h('div', { style: { flexDirection: 'column' } },
    h('div', { style: { paddingBottom: 12, fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted } }, typo(head)),
    h('div', { style: { position: 'relative', width: MEDIA_W, height } },
      h('img', { src, width: MEDIA_W, height }),
      ...labels));
}

const panels = (m: Extract<OgMedia, { kind: 'panels' }>) =>
  h('div', { style: { flexDirection: 'column', justifyContent: 'center', gap: 30, flexShrink: 0, width: MEDIA_W, height: MEDIA_H } },
    ...m.panels.map(panel));

/**
 * Logo partii wprost na białej karcie, bez ramki i cienia. Każde logo ma tę samą powierzchnię (neutralność, jak karty
 * w barometr/PartyList): szerokie są niższe, wysokie węższe. 'serwis' = logo serwisu w miejscu logo partii (wzór).
 */
const LOGO_AREA = 63000;
const LOGO_MAX_W = 380;
const LOGO_MAX_H = 220;

async function partyLogo(m: Extract<OgMedia, { kind: 'logo' }>) {
  let inner: Node;
  if (m.logo === 'serwis') {
    // proporcje jak na stronie wzoru (barometr-polityczny/[id]: znak 40 px, napis 28 px), ×1,6
    inner = h('div', { style: { alignItems: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: 45, letterSpacing: '-0.03em', color: C.ink } },
      h('img', { src: iconUri('logo', C.blue), width: 64, height: 64, style: { marginRight: 22 } }),
      'zarobkilekarzy',
      h('span', { style: { color: C.muted } }, '.pl'));
  } else {
    const { width, height } = raw(m.logo);
    const ratio = width / height;
    let w = Math.sqrt(LOGO_AREA * ratio);
    let hh = w / ratio;
    const fit = Math.min(1, LOGO_MAX_W / w, LOGO_MAX_H / hh);
    w = Math.round(w * fit);
    hh = Math.round(hh * fit);
    // SVG rasteryzujemy gęściej, żeby krawędzie były ostre także po skalowaniu w górę
    const buf = await sharp(sourceFile(m.logo), { density: 300 }).resize(w * 2, hh * 2, { fit: 'inside' }).png().toBuffer();
    inner = h('img', { src: `data:image/png;base64,${buf.toString('base64')}`, width: w, height: hh });
  }
  return h('div', { style: { alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: MEDIA_W, height: MEDIA_H } }, inner);
}

/**
 * Grafika z kropek (lib/siatka, motyw „combo”) w kolumnie mediów: litery maski to kropki w kolorach z `codes`,
 * `.` to plus tła. Rysowana jako SVG w <img>; pod nią legenda kolorów (mapa kraju).
 */
function dots(m: Extract<OgMedia, { kind: 'dots' }>) {
  // rysunek dotykający brzegu (np. mapa kraju) dostaje pole marginesu z każdej strony, jak piktogramy
  const edge = (l: string) => /[^.]/.test(l);
  const touches = edge(m.mask[0]) || edge(m.mask[m.mask.length - 1]) || m.mask.some((l) => edge(l[0] ?? '.') || edge(l.at(-1) ?? '.'));
  const w = Math.max(...m.mask.map((l) => l.length));
  const mask = touches ? frameLines(m.mask, w + 2, m.mask.length + 2) : m.mask;
  const cols = Math.max(...mask.map((l) => l.length)), rows = mask.length;
  const legendH = m.legend ? 44 + 30 * m.legend.length : 0;
  const cell = Math.floor(Math.min(MEDIA_W / cols, (MEDIA_H - legendH) / rows));
  const W = cols * cell, H = rows * cell;
  const arm = cell * GEOMETRY.arm, rOn = cell * GEOMETRY.on, rMid = cell * GEOMETRY.mid;
  const color = (c: OgDots['codes'][string]['color']) => token(c);
  let plus = '', marks = '';
  mask.forEach((line, r) => [...line.padEnd(cols, '.')].forEach((ch, c) => {
    const x = c * cell + cell / 2, y = r * cell + cell / 2;
    const code = m.codes[ch];
    if (code) marks += `<circle cx="${x}" cy="${y}" r="${code.size === 'on' ? rOn : rMid}" fill="${color(code.color)}"/>`;
    else plus += `M${x} ${y - arm}v${2 * arm}M${x - arm} ${y}h${2 * arm}`;
  }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><path d="${plus}" stroke="${C.blue}" stroke-opacity=".4" stroke-width="${(cell * GEOMETRY.stroke).toFixed(2)}" fill="none"/>${marks}</svg>`;
  return h('div', { style: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexShrink: 0, width: MEDIA_W, height: MEDIA_H } },
    h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: W, height: H }),
    m.legend && h('div', { style: { flexDirection: 'column', alignSelf: 'stretch', gap: 10, marginTop: 24, fontFamily: BODY, fontSize: 17, color: C.text } },
      ...m.legend.map(({ code, label }) => h('div', { style: { alignItems: 'center' } },
        h('div', { style: { width: 14, height: 14, marginRight: 12, borderRadius: '50%', background: color(m.codes[code].color) } }),
        typo(label)))));
}

/**
 * Okładka na cały kadr (obrazek domyślny, wg propozycji motywu siatki): 40×21 pól po 30 px, tytuł na środku
 * pustego pola, w narożnikach krzyże medyczne złożone z kropek i dwa fragmenty zapisu EKG.
 */
const COVER_COLS = 40;
const COVER_ROWS = 21;
/** puste pole pod tytułem: kolumny i wiersze siatki (włącznie) */
const COVER_FIELD = { c0: 7, c1: 32, r0: 6, r1: 14 };

function coverMarks(): Set<string> {
  const lit = new Set<string>();
  const cross = (cx: number, cy: number, s = 1) => {
    for (let i = -s; i <= s; i++) { lit.add(`${cx + i},${cy}`); lit.add(`${cx},${cy + i}`); }
  };
  cross(2, 2); cross(37, 3, 2); cross(5, 17, 2); cross(35, 18);
  for (const k of ['0,0', '1,0', '0,1', '39,20', '38,20', '39,19']) lit.add(k);
  for (const k of polyline([[22, 3], [24, 3], [25, 4], [26, 0], [27, 5], [28, 3], [31, 3]])) lit.add(k);
  for (const k of polyline([[10, 19], [13, 19], [14, 18], [15, 19], [18, 19]])) lit.add(k);
  return lit;
}

function cover(c: OgCover): Node {
  const night = c.theme === 'ciemny';
  const col = (name: string) => tokenColor(name, night);
  const cell = OG_WIDTH / COVER_COLS;
  const lit = coverMarks();
  const { c0, c1, r0, r1 } = COVER_FIELD;
  let plus = '', marks = '';
  for (let r = 0; r < COVER_ROWS; r++) for (let q = 0; q < COVER_COLS; q++) {
    const x = q * cell + cell / 2, y = r * cell + cell / 2;
    if (lit.has(`${q},${r}`)) marks += `<circle cx="${x}" cy="${y}" r="${cell * GEOMETRY.on}" fill="${col('blue')}"/>`;
    else if (q < c0 || q > c1 || r < r0 || r > r1) plus += `M${x} ${y - cell * GEOMETRY.arm}v${2 * cell * GEOMETRY.arm}M${x - cell * GEOMETRY.arm} ${y}h${2 * cell * GEOMETRY.arm}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}"><path d="${plus}" stroke="${col('blue')}" stroke-opacity=".4" stroke-width="${(cell * GEOMETRY.stroke).toFixed(2)}" fill="none"/>${marks}</svg>`;
  const line = (text: string, color: string) =>
    h('div', { style: { fontFamily: DISPLAY, fontWeight: 500, fontSize: 76, lineHeight: 1.05, letterSpacing: '-0.03em', color } }, typo(text));
  return h('div', { style: { position: 'relative', width: OG_WIDTH, height: OG_HEIGHT, background: col('bg') } },
    h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: OG_WIDTH, height: OG_HEIGHT, style: { position: 'absolute', top: 0, left: 0 } }),
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: OG_WIDTH, height: OG_HEIGHT, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
      line(c.lines[0], col('ink')),
      line(c.lines[1], col('blue')),
      h('div', { style: { marginTop: 28, fontFamily: MONO, fontSize: 19, letterSpacing: '0.08em', textTransform: 'uppercase', color: col('text') } }, c.label)));
}

/**
 * Pieczątki jak ui/Stamp: podwójna ramka (obwódka cienka na zewnątrz), wersaliki, lekki obrót,
 * pod napisem skala z kropek (`level` z `max` zapalonych, reszta plusy). Jedna — duża na środku;
 * kilka — jedna pod drugą, na przemian przesunięte i obrócone, jak przybite na kolejnych kartach.
 */
const STAMP_TILT = [-3, 2.5, -1.5, 3];

function stampScale(level: number, max: number, cell: number, color: string) {
  const arm = cell * GEOMETRY.arm, r = cell * GEOMETRY.on;
  let plus = '', marks = '';
  for (let i = 0; i < max; i++) {
    const x = i * cell + cell / 2, y = cell / 2;
    if (i < level) marks += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
    else plus += `M${x} ${y - arm}v${2 * arm}M${x - arm} ${y}h${2 * arm}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${max * cell} ${cell}"><path d="${plus}" stroke="${color}" stroke-opacity=".4" stroke-width="${(cell * GEOMETRY.stroke).toFixed(2)}" fill="none"/>${marks}</svg>`;
  return h('img', { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width: max * cell, height: cell });
}

function stamp({ label, kicker, level, max = 7, tone = 'blue' }: OgStamp, k: number, tilt: number) {
  const color = tone === 'muted' ? C.ink : C.blue;
  return h('div', { style: { padding: 6 * k, border: `${Math.max(1, Math.round(1.2 * k))}px solid ${color}`, transform: `rotate(${tilt}deg)`, color } },
    h('div', { style: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 * k, padding: `${12 * k}px ${18 * k}px ${13 * k}px`, border: `${Math.round(2.5 * k)}px solid ${color}` } },
      kicker && h('div', { style: { fontFamily: MONO, fontWeight: 500, fontSize: Math.round(12 * k), letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 } }, typo(kicker)),
      h('div', { style: { fontFamily: DISPLAY, fontWeight: 500, fontSize: Math.round(22 * k), lineHeight: 1.1, letterSpacing: '0.05em', textTransform: 'uppercase' } }, noWidow(typo(label))),
      level !== undefined && stampScale(level, max, Math.round(15 * k), color)));
}

function stamps({ stamps: list }: Extract<OgMedia, { kind: 'stamps' }>) {
  const single = list.length === 1;
  const k = single ? 1.9 : 1.15;
  return h('div', { style: { flexDirection: 'column', justifyContent: 'center', alignItems: single ? 'center' : 'stretch', gap: 30, flexShrink: 0, width: MEDIA_W, height: MEDIA_H } },
    ...list.map((s, i) => h('div', { style: { justifyContent: single ? 'center' : i % 2 ? 'flex-end' : 'flex-start', paddingLeft: single ? 0 : 12, paddingRight: single ? 0 : 12 } },
      stamp(s, k, STAMP_TILT[i % STAMP_TILT.length]))));
}

/* ---------- Szablon ---------- */
async function layout(spec: OgSpec, route: string): Promise<Node> {
  const wide = spec.media.kind === 'none';
  const title = typo(spec.title);
  const size = titleSize(title, wide);
  if (!wide && !title.includes('\n') && title.length > NARROW_TITLE_MAX) console.warn(`[og] ${route}: tytuł ma ${title.length} znaków — skróć go albo ustaw og.title`);
  // Lead tylko przy krótkim tytule, żeby całość mieściła się w kadrze (chyba że strona prosi o niego wprost)
  const showLead = spec.lead && (spec.leadAlways || (title.split('\n').length <= 3 && title.length <= (wide ? 48 : 34)));

  return h('div', { style: { width: OG_WIDTH, height: OG_HEIGHT, padding: `${PAD_Y}px ${PAD_X}px`, background: '#fff', fontFamily: BODY, color: C.text } },
    h('div', { style: { flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: wide ? 0 : GAP } },
      logo(),
      h('div', { style: { flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', paddingTop: 24, paddingBottom: 24 } },
        spec.eyebrow && eyebrow(spec.eyebrow),
        h('div', { style: { flexDirection: 'column', marginTop: spec.eyebrow ? 26 : 0, maxWidth: wide ? WIDE_W : '100%', fontFamily: DISPLAY, fontWeight: 400, fontSize: size, lineHeight: 1, letterSpacing: '-0.04em', color: C.ink } },
          ...titleLines(title)),
        showLead && h('div', { style: { marginTop: 24, maxWidth: wide ? 820 : '100%', fontSize: 21, lineHeight: 1.5 } }, noWidow(typo(spec.lead!)))),
      spec.footer && footer(spec.footer, wide)),
    spec.media.kind === 'photo' ? await photo(spec.media) : spec.media.kind === 'stat' ? stat(spec.media.stat) : spec.media.kind === 'map' ? map(spec.media) : spec.media.kind === 'bars' ? bars(spec.media) : spec.media.kind === 'panels' ? panels(spec.media) : spec.media.kind === 'logo' ? await partyLogo(spec.media) : spec.media.kind === 'dots' ? dots(spec.media) : spec.media.kind === 'stamps' ? stamps(spec.media) : null);
}

/** PNG 1200×630 z paletą 8-bit: zdjęcia B&W + kolory marki mieszczą się w niej bez widocznej straty. */
export async function renderOg(entry: OgEntry): Promise<Buffer> {
  const png = (img: Sharp) => img.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  if (entry.file) return png(sharp(sourceFile(entry.file)).resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' }));

  const tree = entry.spec!.cover ? cover(entry.spec!.cover) : await layout(entry.spec!, entry.route);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: await loadFonts() });
  return png(sharp(Buffer.from(svg)));
}
