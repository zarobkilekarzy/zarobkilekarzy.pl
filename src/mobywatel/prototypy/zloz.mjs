/**
 * Składa warianty prototypu (konkurs mObywatel Challenge) w statyczne aplikacje: <out>/<wariant>/ =
 *   baza/      — front z paczki mobywatel-ai.zip (mobywatel.ai), bez zmian,
 *   wspolne/   — warstwa wszystkich wariantów: działanie bez serwera, napis „mObywatel Challenge”,
 *   warianty/<wariant>/ — nakładka jednej wersji do zgłoszenia (ten sam plik = podmiana, nowy = dodanie).
 * W index.html: wspólne pliki na początku <head>, wariant.css po stylach bazy, wariant-dane.js przed core.js
 * (po osobach z osoby.js), wariant.js na końcu <body>. Bez Google Fonts (CSP strony ich nie przepuszcza; baza
 * ma fonty systemowe w zapasie). Do tego to, czego audyt SEO strony wymaga od każdej strony (składamy przed nim):
 * tytuł, opis i <h1> z opis.json wariantu, canonical, noindex. Tagi og:* dostaje wariant z grafiką
 * src/assets/mobywatel/og-<wariant>.png (obrazek /og/mobywatel/<wariant>.png robi endpoint OG strony z wpisu
 * w src/data/og.ts — wariant nie przechodzi przez BaseLayout). komputer.html (pokaz przekazywania danych
 * „znakiem”) pomijamy — wymaga serwera paczki.
 * Tłumaczenia: baza pobiera słownik z serwera (/api/i18n.js) — tu zamiast tego statyczny i18n/<język>.js
 * ze słownika bazy (baza-i18n/, z serwera paczki) i słownika wariantu (warianty/<wariant>/i18n/<język>.json).
 *
 * Używa go integracja src/mobywatel/integracja.ts (build: dist/mobywatel/, dev: katalog tymczasowy).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = import.meta.dirname;
const baza = join(root, 'baza');
const bazaI18n = join(root, 'baza-i18n');
const wspolne = join(root, 'wspolne');
const warianty = join(root, 'warianty');

export const slugi = () =>
  readdirSync(warianty, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

const WSPOLNE_HEAD = '<script src="bez-serwera.js"></script>\n<link rel="stylesheet" href="challenge.css">\n';
const JEZYKI = readdirSync(bazaI18n).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

const SITE = 'https://zarobkilekarzy.pl';

/** Tagi podglądu linku, gdy wariant ma grafikę OG (wpis w src/data/og.ts z tą samą grafiką). */
function ogTagi(slug, tytul, opis) {
  const grafika = join(root, '..', '..', 'assets', 'mobywatel', `og-${slug}.png`);
  if (!existsSync(grafika)) return '';
  const v = createHash('sha1').update(readFileSync(grafika)).digest('hex').slice(0, 8);
  const url = `${SITE}/mobywatel/${slug}/`;
  return [
    ['og:type', 'website'], ['og:site_name', 'zarobkilekarzy.pl'], ['og:url', url], ['og:title', tytul], ['og:description', opis],
    ['og:image', `${SITE}/og/mobywatel/${slug}.png?v=${v}`], ['og:image:width', '1200'], ['og:image:height', '630'], ['og:image:alt', tytul],
  ].map(([k, c]) => `<meta property="${k}" content="${esc(c)}">\n`).join('') +
    `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:site" content="@ZarobkiLekarzy">\n`;
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function html(plik, nakladka, slug) {
  const opis = JSON.parse(readFileSync(join(nakladka, 'opis.json'), 'utf8'));
  const tytul = `${opis.tytul} — prototyp mObywatela`;
  const opisStrony = `${opis.opis.split('. ')[0]}.`;
  let s = readFileSync(plik, 'utf8');
  s = s
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.g[^>]*>\n?/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(tytul)}</title>`)
    .replace(
      '<meta charset="utf-8">\n',
      `<meta charset="utf-8">\n<meta name="robots" content="noindex">\n<meta name="description" content="${esc(opisStrony)}">\n` +
        `<link rel="canonical" href="${SITE}/mobywatel/${slug}/">\n${ogTagi(slug, tytul, opisStrony)}${WSPOLNE_HEAD}`,
    )
    .replace('<body>\n', `<body>\n<h1 class="ch-sr">${esc(tytul)}</h1>\n`);
  if (!s.includes('bez-serwera.js') || !s.includes('ch-sr')) throw new Error(`${plik}: nie znalazłem <meta charset> albo <body> — baza się zmieniła?`);
  if (existsSync(join(nakladka, 'wariant.css'))) s = s.replace('</head>', '<link rel="stylesheet" href="wariant.css">\n</head>');
  if (existsSync(join(nakladka, 'wariant-dane.js'))) s = s.replace('<script src="core.js', '<script src="wariant-dane.js"></script>\n<script src="core.js');
  s = s.replace('</body>', '<script src="challenge.js"></script>\n' + (existsSync(join(nakladka, 'wariant.js')) ? '<script src="wariant.js"></script>\n' : '') + '</body>');
  writeFileSync(plik, s);
}

/** Składa wszystkie warianty do katalogu `out` (czyści go). Zwraca listę wariantów. */
export function zloz(out) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const lista = slugi();
  for (const slug of lista) {
    const cel = join(out, slug);
    const nakladka = join(warianty, slug);
    cpSync(baza, cel, { recursive: true, filter: (src) => src !== join(baza, 'komputer.html') });
    cpSync(wspolne, cel, { recursive: true });
    cpSync(nakladka, cel, { recursive: true, filter: (src) => !src.startsWith(join(nakladka, 'i18n')) });
    html(join(cel, 'index.html'), nakladka, slug);

    // słownik bez serwera: i18n/<język>.js zamiast /api/i18n.js
    const i18n = join(cel, 'i18n.js');
    const zrodlo = readFileSync(i18n, 'utf8'), stary = `'<script src="/api/i18n.js?lang='+L+'"><\\/script>'`;
    if (!zrodlo.includes(stary)) throw new Error('i18n.js: nie znalazłem wczytania słownika z serwera — baza się zmieniła?');
    writeFileSync(i18n, zrodlo.replace(stary, `'<script src="i18n/'+L+'.js"><\\/script>'`));
    mkdirSync(join(cel, 'i18n'));
    for (const j of JEZYKI) {
      const slownik = JSON.parse(readFileSync(join(bazaI18n, `${j}.json`), 'utf8'));
      const wlasny = join(nakladka, 'i18n', `${j}.json`);
      if (existsSync(wlasny)) Object.assign(slownik, JSON.parse(readFileSync(wlasny, 'utf8')));
      writeFileSync(join(cel, 'i18n', `${j}.js`), `window.I18N=${JSON.stringify(slownik)};window.__i18nStart&&window.__i18nStart();`);
    }
  }
  return lista;
}
