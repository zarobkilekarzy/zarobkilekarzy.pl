/**
 * Mapa SOR do prototypu: ta sama geometria co mapa „Kolejki na SOR” na zarobkilekarzy.pl.
 * Bierze ze zbudowanej strony (dist/prawa-pacjenta/sor/) kontury województw
 * i rozsunięte punkty SOR, a z listy pacjent.gov.pl (src/data/sor/lista.json) — nazwy i adresy,
 * skrócone tak jak na stronie (prettyName z src/lib/monitoring/name.ts).
 * Kolejki dociąga na żywo prototyp (dane.zarobkilekarzy.pl/sor/teraz.json) — tu są tylko stałe dane.
 *
 * Uruchomienie (po `npm run build`, z katalogu repo):
 *   node --experimental-strip-types src/mobywatel/prototypy/narzedzia/sor-mapa.mjs
 * Wynik: warianty/moje-zdrowie/sor-mapa.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const site = join(root, '..', '..', '..');
const out = join(root, 'warianty', 'moje-zdrowie', 'sor-mapa.json');

const { prettyName } = await import(join(site, 'src/lib/monitoring/name.ts'));
const list = JSON.parse(readFileSync(join(site, 'src/data/sor/lista.json'), 'utf8'));
const html = readFileSync(join(site, 'dist/prawa-pacjenta/sor/index.html'), 'utf8');

const svgStart = html.indexOf('<svg class="pm-svg"');
const svg = html.slice(svgStart, html.indexOf('</svg>', svgStart));
const viewBox = /viewBox="([^"]+)"/.exec(svg)[1];
const regiony = [...svg.matchAll(/<path class="pm-reg"[^>]* d="([^"]+)"/g)].map((m) => m[1]);
const pts = [...svg.matchAll(/<circle class="pm-pt[^"]*" data-i="(\d+)" cx="([\d.]+)" cy="([\d.]+)"/g)]
  .map((m) => ({ i: +m[1], x: +m[2], y: +m[3] }))
  .sort((a, b) => a.i - b.i);
if (pts.length !== list.sor.length) throw new Error(`punkty: ${pts.length}, SOR na liście: ${list.sor.length}`);

// jak lib/sor/map.ts: wersaliki → nazwa własna, delegatury dużych miast → samo miasto
const unshout = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase('pl')) : s);
const city = (s) => unshout(s.miasto).replace(/^(Kraków|Łódź|Poznań|Wrocław)-.*$/i, '$1');
const street = (s) => [s.ulica, s.nr].map(unshout).filter(Boolean).join(' ');

const sor = list.sor.map((s, i) => ({
  k: s.numer,
  x: pts[i].x,
  y: pts[i].y,
  lat: +s.lat.toFixed(5),
  lng: +s.lng.toFixed(5),
  n: prettyName(s.nazwa).replace(/ - /g, ' – '),
  c: city(s),
  a: street(s),
}));

// współrzędne → punkt mapy (znacznik „Ty” przy najbliższych SOR): przekształcenie afiniczne dopasowane
// metodą najmniejszych kwadratów do 250 punktów — na skalę kraju wystarczy, rozsunięcie w miastach to ułamek piksela
function fit(target) {
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (const s of sor) {
    const r = [s.lng, s.lat, 1];
    for (let i = 0; i < 3; i++) { b[i] += r[i] * s[target]; for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j]; }
  }
  for (let i = 0; i < 3; i++) for (let k = i + 1; k < 3; k++) {
    const f = A[k][i] / A[i][i];
    for (let j = i; j < 3; j++) A[k][j] -= f * A[i][j];
    b[k] -= f * b[i];
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < 3; j++) sum -= A[i][j] * x[j];
    x[i] = sum / A[i][i];
  }
  return x.map((v) => +v.toFixed(6));
}
const geo = { x: fit('x'), y: fit('y') };

writeFileSync(out, JSON.stringify({ zrodlo: list.zrodlo, viewBox, regiony, geo, sor }));
console.log(`sor-mapa.json: ${sor.length} SOR, ${regiony.length} województw`);
