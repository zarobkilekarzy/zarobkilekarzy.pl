// Prototyp systemu OG (rodzina A): jeden szablon, trzy warianty mediów, preset → nadpisanie → render.
// To referencja dla wdrożenia (src/lib/og/*), nie kod produkcyjny — zob. docs/og-system.md.
// Zapis historyczny: napisany pod Satori 0.33.5. Na 0.57+ wymaga boxSizing: 'border-box' w h() — kod produkcyjny ma to w src/lib/og/render.ts.
// Uruchom: node docs/og-propozycje/system/prototyp.mjs  → PNG obok tego pliku
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';

const PROJECT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const OUT = new URL('./', import.meta.url).pathname;
const sharp = createRequire(PROJECT + '/package.json')('sharp');
const { typo, formatDate } = await import(PROJECT + '/src/lib/format.ts');
const { icons } = await import(PROJECT + '/src/icons.ts');

// ---------- Tokeny (w docelowej wersji czytane z src/styles/tokens.css) ----------
const C = { blue: '#2664EC', blue50: '#F0F4FE', blue700: '#1743AE', pale: '#C2D3F6', ink: '#040B1B', text: '#4B5466', muted: '#7B8394', line: '#E6E9EF', amber: '#8A5A00', amberBg: '#FFF4DB' };
const DISPLAY = 'Inter Tight, Inter Tight Ext', BODY = 'Plex Sans, Plex Sans Ext', MONO = 'Plex Mono, Plex Mono Ext';
const W = 1200, H = 630, PAD_X = 64, PAD_Y = 56, MEDIA_W = 470, MEDIA_H = H - 2 * PAD_Y, GAP = 56;

// ---------- Fonty: statyczne WOFF z Fontsource; latin-ext jako osobna rodzina „… Ext” ----------
const FS = PROJECT + '/node_modules/@fontsource/';
const load = (name, pkg, weight) => Promise.all(['latin', 'latin-ext'].map(async (sub) => ({
  name: sub === 'latin' ? name : `${name} Ext`, weight, style: 'normal',
  data: await readFile(`${FS}${pkg}/files/${pkg}-${sub}-${weight}-normal.woff`),
})));
const fonts = (await Promise.all([
  ...[300, 400, 500].map((w) => load('Inter Tight', 'inter-tight', w)),
  ...[400, 600].map((w) => load('Plex Sans', 'ibm-plex-sans', w)),
  ...[400, 500].map((w) => load('Plex Mono', 'ibm-plex-mono', w)),
])).flat();

// ---------- Mini-JSX dla Satori ----------
const h = (type, props = {}, ...children) => {
  const { style = {}, ...rest } = props;
  return { type, props: { ...rest, style: type === 'div' ? { display: 'flex', ...style } : style, children: children.flat().filter((c) => c !== false && c != null) } };
};
const svgUri = (inner, color) => 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" color="${color}">${inner.replaceAll('currentColor', color)}</svg>`).toString('base64');

// ---------- Reguły automatyczne ----------
/** Pierwsze zdanie leadu — bez cięcia na skrótach „ok.”, „r.”, „art.” (po kropce musi stać wielka litera). */
const ABBR = /(?:^|\s)(?:tys|mln|mld|ok|r|art|ust|pkt|nr|dr|prof|np|tj|m\.in|ds)\.$/i;
const firstSentence = (s) => {
  const parts = s.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„])/);
  let out = parts.shift();
  while (parts.length && ABBR.test(out)) out += ' ' + parts.shift();
  return out.length <= 120 ? out : null; // za długie zdanie → bez leadu (lepiej nic niż ucięte)
};
/** Rozmiar tytułu wg długości i szerokości kolumny. */
const titleSize = (t, wide) => {
  const lines = t.split('\n');
  // Ręczne podziały: rozmiar z najdłuższego wiersza (≈0,48 em na znak w Inter Tight)
  if (lines.length > 1) return Math.min(wide ? 104 : 80, Math.floor((wide ? 980 : 546) / (Math.max(...lines.map((l) => l.length)) * 0.48)));
  const n = t.length;
  const tiers = wide ? [[24, 104], [44, 88], [70, 72], [Infinity, 60]] : [[18, 80], [34, 70], [56, 60], [80, 52], [Infinity, 46]];
  return tiers.find(([max]) => n <= max)[1];
};
/** „1 358 placówek” → pogrubiona liczba + reszta (jak ui/Badge). */
const splitBadge = (s) => s.match(/^([~>< ]?[\d\s ,.]+)\s(.+)$/)?.slice(1) ?? [null, s];
const plural = (n, [one, few, many]) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);

// ---------- Atomy ----------
const logo = h('div', { style: { alignItems: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: 26, letterSpacing: '-0.03em', color: C.ink } },
  h('img', { src: svgUri(icons.logo, C.blue), width: 30, height: 30, style: { marginRight: 14 } }),
  'zarobkilekarzy', h('span', { style: { color: C.muted } }, '.pl'));

const eyebrow = (text) => h('div', { style: { alignItems: 'center', fontFamily: MONO, fontWeight: 500, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.blue } },
  h('div', { style: { width: 10, height: 10, background: C.blue, marginRight: 12 } }), text);

const flag = (acc) => h('div', { style: {
  padding: '5px 8px', fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
  background: acc === 'exact' ? C.blue50 : C.amberBg, color: acc === 'exact' ? C.blue700 : C.amber,
} }, acc === 'exact' ? 'Dokładna' : 'Szacunek');

const footer = (f) => h('div', { style: { alignItems: 'center', paddingTop: 20, borderTop: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 15, color: C.muted, gap: 10 } },
  f.flags ? [h('span', { style: { marginRight: 6 } }, f.text), flag('exact'), flag('est')] : f.text);

// Ramka z narożnymi uchwytami i cieniem (ui/Photo frame)
const frame = (...children) => h('div', { style: { position: 'relative', width: MEDIA_W, height: MEDIA_H, flexShrink: 0, boxShadow: '0 40px 60px -40px rgba(4,11,27,.45)' } },
  ...children,
  h('div', { style: { position: 'absolute', top: -4, left: -4, width: 9, height: 9, background: C.blue } }),
  h('div', { style: { position: 'absolute', bottom: -4, right: -4, width: 9, height: 9, background: C.blue } }));

// ---------- Media ----------
async function photoUri(src, position = '50% 50%') {
  const img = sharp(PROJECT + '/' + src);
  const { width, height } = await img.metadata();
  const scale = Math.max(MEDIA_W / width, MEDIA_H / height);
  const rw = Math.round(width * scale), rh = Math.round(height * scale);
  const [px, py] = position.split(' ').map((p) => parseFloat(p) / 100);
  const buf = await img.resize(rw, rh).extract({ left: Math.round((rw - MEDIA_W) * px), top: Math.round((rh - MEDIA_H) * py), width: MEDIA_W, height: MEDIA_H })
    .grayscale().linear(1.05, -6).jpeg({ quality: 85 }).toBuffer();
  return 'data:image/jpeg;base64,' + buf.toString('base64');
}

async function media(m) {
  if (m.kind === 'photo') {
    const [strong, rest] = m.badge ? splitBadge(typo(m.badge.text)) : [];
    return frame(
      h('img', { src: await photoUri(m.src, m.position), width: MEDIA_W, height: MEDIA_H }),
      m.badge && h('div', { style: { position: 'absolute', right: 14, bottom: 14, alignItems: 'center', padding: '15px 20px 15px 18px', background: C.blue, color: '#fff', fontFamily: BODY, fontSize: 18 } },
        m.badge.icon && h('img', { src: svgUri(icons[m.badge.icon], '#fff'), width: 24, height: 24, style: { marginRight: 12 } }),
        strong && h('span', { style: { fontWeight: 600, marginRight: 6 } }, strong), rest));
  }
  if (m.kind === 'stat') {
    const len = (m.prefix ?? '').length + m.value.length;
    const size = len <= 2 ? 200 : len <= 4 ? 168 : 128;
    return frame(h('div', { style: { flexDirection: 'column', width: '100%', height: '100%', padding: '34px 36px 36px', background: C.blue, color: '#fff' } },
      h('div', { style: { fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.75)' } }, m.label),
      h('div', { style: { flexDirection: 'column', marginTop: 'auto' } },
        h('div', { style: { alignItems: 'baseline', fontFamily: DISPLAY, fontWeight: 300, fontSize: size, lineHeight: 0.82, letterSpacing: '-0.05em' } },
          m.prefix && h('span', { style: { fontSize: size * 0.5, color: 'rgba(255,255,255,.6)', marginRight: 4 } }, m.prefix),
          m.value,
          m.unit && h('span', { style: { fontFamily: BODY, fontWeight: 400, fontSize: 30, letterSpacing: 0, marginLeft: 14, color: 'rgba(255,255,255,.85)' } }, typo(m.unit))),
        h('div', { style: { marginTop: 22, fontFamily: DISPLAY, fontSize: 22, lineHeight: 1.3, letterSpacing: '-0.01em', color: 'rgba(255,255,255,.92)' } }, typo(m.desc)),
        h('div', { style: { alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.3)', fontFamily: MONO, fontSize: 14, color: 'rgba(255,255,255,.75)' } },
          m.accuracy && flag(m.accuracy), m.source && typo(m.source)))));
  }
  return null;
}

// ---------- Szablon ----------
async function render(spec) {
  const wide = spec.media.kind === 'none';
  const title = typo(spec.title);
  const size = titleSize(title, wide);
  const lines = title.split('\n');
  const showLead = spec.lead && lines.length <= 3 && title.length <= (wide ? 48 : 34);
  const tree = h('div', { style: { width: W, height: H, padding: `${PAD_Y}px ${PAD_X}px`, background: '#fff', fontFamily: BODY, color: C.text } },
    h('div', { style: { flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: wide ? 0 : GAP } },
      logo,
      h('div', { style: { flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', paddingTop: 24, paddingBottom: 24 } },
        spec.eyebrow && eyebrow(spec.eyebrow),
        h('div', { style: { flexDirection: 'column', marginTop: 26, maxWidth: wide ? 980 : '100%', fontFamily: DISPLAY, fontWeight: 400, fontSize: size, lineHeight: 1.0, letterSpacing: '-0.04em', color: C.ink } },
          ...lines.map((line, i) => h('div', {}, i === lines.length - 1 && spec.punct ? [line, h('span', { style: { color: C.blue } }, spec.punct)] : line))),
        showLead && h('div', { style: { marginTop: 24, maxWidth: wide ? 820 : '100%', fontSize: 21, lineHeight: 1.5, color: C.text } }, typo(spec.lead))),
      spec.footer && footer(spec.footer)),
    await media(spec.media));
  const svg = await satori(tree, { width: W, height: H, fonts });
  return sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
}

// ---------- Przykładowe strony (presety + nadpisania) ----------
const article = (o) => ({ media: { kind: 'none' }, ...o });
const pages = {
  '1-strona-glowna': {
    eyebrow: 'Przewodnik po pracy i zarobkach', title: 'Zarobki lekarzy.\nBez emocji,\nze źródłami', punct: '.',
    footer: { text: 'Każda liczba ze źródłem', flags: true },
    media: { kind: 'photo', src: 'src/assets/img/hero-pokoj-lekarski.jpg', position: '38% 50%', badge: { text: '3 746 rozliczeń w bazie', icon: 'db' } },
  },
  '2-artykul-bez-okladki': article({
    eyebrow: 'Mechanizmy', title: 'Wizyty, których nie było',
    lead: firstSentence('NFZ płaci za wpis w systemie, a nie za samą wizytę. Jedyną osobą spoza układu placówka–Fundusz…'),
    footer: { text: `6 ${plural(6, ['źródło', 'źródła', 'źródeł'])} · aktualizacja ${formatDate(new Date('2026-07-16'))} · 5 min czytania` },
  }),
  '3-artykul-z-okladka': {
    eyebrow: 'Narzędzie', title: 'Przeglądarka monitoringu płac lekarzy',
    footer: { text: `Dane · ${formatDate(new Date('2026-10-12'))}` },
    media: { kind: 'photo', src: 'src/assets/img/nowe-archiwum-szpitala.jpg', position: '50% 50%', badge: { text: '1 358 placówek', icon: 'db' } },
  },
  '4-artykul-nadpisanie-stat': {
    eyebrow: 'Analizy', title: 'Lekarze-radni: jedyni, których dochód widać w całości',
    footer: { text: `4 ${plural(4, ['źródło', 'źródła', 'źródeł'])} · 8 min czytania` },
    media: { kind: 'stat', label: 'Mediana dochodu', prefix: '~', value: '633', unit: 'tys. zł', desc: 'rocznie u 183 lekarzy-radnych; 30 osób powyżej 1 mln zł', accuracy: 'est', source: 'oświadczenia majątkowe' },
  },
  '5-dzial-danych': {
    eyebrow: 'Dane', title: 'Zadłużenie szpitali',
    lead: 'Ile są winne szpitale publiczne i jaką część długu tworzą wynagrodzenia.',
    footer: { text: `Dział danych · stan na ${formatDate(new Date('2026-10-12'))}` },
    media: { kind: 'stat', label: 'Zobowiązania ogółem', value: '34', unit: 'mld zł', desc: 'zadłużenia szpitali — w większości związanego z kosztami wynagrodzeń', accuracy: 'exact', source: 'Zadłużenie SPZOZ' },
  },
  '6-dlugi-tytul': article({
    eyebrow: 'Analizy', title: 'Kanada: gdy rząd narzuca lekarzom warunki ustawą',
    lead: firstSentence('Quebec obciął stawki o 13,04% i wprowadził kary do 500 tys. CAD dziennie. Rozdział o karach uchylono.'),
    footer: { text: `9 źródeł · publikacja ${formatDate(new Date('2026-10-11'))} · 7 min czytania` },
  }),
  '7-krotki-tytul': article({
    eyebrow: 'Mechanizmy', title: 'Kontrakt a etat',
    lead: firstSentence('Ok. 73% specjalistów rozlicza się jako firma. Forma zatrudnienia decyduje o tym, co jest jawne.'),
    footer: { text: '3 źródła · 4 min czytania' },
  }),
};

for (const [name, spec] of Object.entries(pages)) {
  const t = performance.now();
  const png = await render(spec);
  await sharp(png).toFile(`${OUT}${name}.png`);
  console.log(`${name}: ${Math.round(performance.now() - t)} ms, ${Math.round(png.length / 1024)} KB`);
}
