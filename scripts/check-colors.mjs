#!/usr/bin/env node
// Strażnik trybu nocnego: szuka w stylach (src/**/*.astro, src/**/*.css) kolorów
// wpisanych na sztywno, które w nocy psują kontrast. Zasady: README, sekcja „Tryb nocny”.
//
//   npm run check:colors              błędy i ostrzeżenia
//   npm run check:colors -- --quiet   tylko błędy (ostrzeżenia jako liczba)
//   npm run check:colors -- plik…     tylko wskazane pliki
//
// Błąd (kod wyjścia 1):
//   - białe tło (`background: #fff`) — karta/pole to var(--surface), tło strony var(--bg);
//   - biały tekst w regule z tłem var(--ink) / --ink-2 / --ok / --bad — to var(--on-ink);
//   - tło var(--blue) w regule z białym tekstem — pod białym tekstem var(--blue-fill).
// Ostrzeżenie: każdy inny surowy hex poza tokens.css. Wartości w light-dark() przechodzą
// (para dzień/noc jest jawna), tak samo biel na stałym wypełnieniu (--blue-fill, --inverse…).
//
// Wyjątek celowy: komentarz w linii `/* kolor-stały */`, najlepiej z powodem
// (`/* kolor-stały: gałka przełącznika */`). Kilka reguł naraz obejmuje para
// `/* kolor-stały: początek … */` … `/* kolor-stały: koniec */`.
// Analiza obejmuje jedną regułę naraz: tło ustawione w innym selektorze nie jest widoczne.

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TOKENS = 'src/styles/tokens.css';
const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const only = args.filter((a) => !a.startsWith('--'));

const WHITE = /(?<![\w-])(?:#f{3}(?:f|f{3}|f{5})?|white|rgb\(\s*255[\s,]+255[\s,]+255\s*\))(?![\w-])/gi;
const HEX = /#[0-9a-f]{3,8}(?![\w-])/gi;
const FLIPPING_BG = /var\(\s*--(ink|ink-2|ok|bad)\s*[,)]/; // w nocy jaśnieją
const BLUE_BG = /var\(\s*--blue\s*[,)]/;
const CONSTANT_FILL = /var\(\s*--(blue-fill|blue-600|inverse|inverse-2|ink-soft)\s*[,)]/; // stałe w obu trybach
const NIGHT_CONTEXT = /data-theme=["']?dark|prefers-color-scheme:\s*dark/;
const MARKER = /kolor-stały/;

const isBg = (prop) => prop === 'background' || prop === 'background-color' || /^--[\w-]+-(bg|background)$/.test(prop);
const isFg = (prop) => prop === 'color' || /^--[\w-]+-(fg|color)$/.test(prop);

/* --- tokeny: dzienna wartość → nazwy, do podpowiedzi przy ostrzeżeniach --- */

const normHex = (hex) => {
  const h = hex.slice(1).toUpperCase();
  return '#' + (h.length === 3 ? [...h].map((c) => c + c).join('') : h);
};

const tokensByDayHex = new Map();
for (const [, name, value] of readFileSync(join(ROOT, TOKENS), 'utf8').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  const day = value.match(/^\s*(?:light-dark\(\s*)?(#[0-9a-f]{3,8})\b/i);
  if (!day) continue;
  const key = normHex(day[1]);
  tokensByDayHex.set(key, [...(tokensByDayHex.get(key) ?? []), name]);
}

/* --- pliki i fragmenty CSS --- */

function listFiles() {
  if (only.length) {
    return only.map((p) => {
      const rel = relative(ROOT, resolve(p));
      return rel.startsWith('..') ? resolve(p) : rel.split(sep).join('/');
    });
  }
  return readdirSync(join(ROOT, 'src'), { recursive: true })
    .map((p) => join('src', p).split(sep).join('/'))
    // prototypy mObywatela: aplikacja z mobywatel.ai z własną paletą, poza tokenami strony (src/mobywatel/prototypy/README.md)
    .filter((p) => /\.(astro|css)$/.test(p) && p !== TOKENS && !p.startsWith('src/mobywatel/prototypy/'))
    .sort();
}

/** Fragmenty CSS pliku: { start, text } — cały .css albo bloki <style> i atrybuty style="…" w .astro. */
function cssSegments(path, source) {
  if (path.endsWith('.css')) return [{ start: 0, text: source }];
  const segments = [];
  const blanked = source.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (all, open, body, close, at) => {
    segments.push({ start: at + open.length, text: body });
    return open + ' '.repeat(body.length) + close;
  });
  for (const m of blanked.matchAll(/\sstyle=(["'])([\s\S]*?)\1/g)) {
    segments.push({ start: m.index + m[0].indexOf(m[1]) + 1, text: m[2], inline: true });
  }
  return segments;
}

/** Komentarze zamienione na spacje (z zachowaniem długości), lista komentarzy osobno. */
function stripComments(text) {
  const comments = [];
  let out = '';
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      out += ch;
      if (ch === '\\') out += text[++i] ?? '';
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
    } else if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      comments.push({ at: i, text: text.slice(i, stop) });
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
    } else out += ch;
  }
  return { clean: out, comments };
}

/** Reguły z deklaracjami: [{ selector, night, decls: [{ prop, value, at }] }], `at` = przesunięcie wartości. */
function parseRules(clean, inline) {
  const root = { selector: inline ? '[style]' : '', night: false, decls: [] };
  const rules = [root];
  const stack = [root];
  let from = 0;
  let depth = 0;
  let quote = null;

  const addDecl = (to) => {
    const raw = clean.slice(from, to);
    const colon = raw.indexOf(':');
    if (colon === -1) return;
    const prop = raw.slice(0, colon).trim().toLowerCase();
    if (!/^(--[\w-]+|-?[a-z][a-z-]*)$/.test(prop)) return;
    stack.at(-1).decls.push({ prop, value: raw.slice(colon + 1), at: from + colon + 1 });
  };

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && ch === '{') {
      const selector = clean.slice(from, i).trim();
      const rule = { selector, night: stack.at(-1).night || NIGHT_CONTEXT.test(selector), decls: [] };
      rules.push(rule);
      stack.push(rule);
      from = i + 1;
    } else if (depth === 0 && (ch === ';' || ch === '}')) {
      addDecl(i);
      if (ch === '}' && stack.length > 1) stack.pop();
      from = i + 1;
    }
  }
  addDecl(clean.length);
  return rules;
}

/** Wartość z wyciętą treścią light-dark(…) i url(…) — tam hex jest świadomy albo nie jest kolorem. */
function maskValue(value) {
  let out = value;
  for (const fn of ['light-dark(', 'url(']) {
    let i = out.toLowerCase().indexOf(fn);
    while (i !== -1) {
      let depth = 0;
      let j = i + fn.length - 1;
      for (; j < out.length; j++) {
        if (out[j] === '(') depth++;
        else if (out[j] === ')' && --depth === 0) break;
      }
      const start = i + fn.length;
      out = out.slice(0, start) + ' '.repeat(Math.max(0, j - start)) + out.slice(j);
      i = out.toLowerCase().indexOf(fn, j);
    }
  }
  return out;
}

const tokenHint = (hex) => {
  const names = tokensByDayHex.get(normHex(hex));
  if (!names) return 'token z tokens.css albo light-dark(dzień, noc)';
  return names.slice(0, 3).map((n) => `var(${n})`).join(' / ') + ` (dzień: ${normHex(hex)})`;
};

/* --- sprawdzanie --- */

const findings = [];

for (const path of listFiles()) {
  const source = readFileSync(resolve(ROOT, path), 'utf8');
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) if (source[i] === '\n') lineStarts.push(i + 1);
  const lineAt = (offset) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  for (const segment of cssSegments(path, source)) {
    const { clean, comments } = stripComments(segment.text);

    // Znaczniki wyjątków: linie i zakresy linii
    const markedLines = new Set();
    const regions = [];
    for (const c of comments.filter((c) => MARKER.test(c.text))) {
      const line = lineAt(segment.start + c.at);
      if (/kolor-stały\s*:?\s*początek/.test(c.text)) regions.push({ from: line, to: Infinity });
      else if (/kolor-stały\s*:?\s*koniec/.test(c.text)) {
        const open = regions.findLast((r) => r.to === Infinity);
        if (open) open.to = line;
      } else markedLines.add(line);
    }
    const exempt = (...lines) => lines.some((l) => markedLines.has(l) || regions.some((r) => l >= r.from && l <= r.to));

    for (const rule of parseRules(clean, segment.inline)) {
      if (rule.night) continue; // reguła tylko dla nocy — hex jest tam świadomy
      const decls = rule.decls.map((d) => ({ ...d, masked: maskValue(d.value) }));
      const flipBg = decls.find((d) => isBg(d.prop) && FLIPPING_BG.test(d.masked));
      const blueBg = decls.find((d) => isBg(d.prop) && BLUE_BG.test(d.masked));
      const constantFill = decls.some((d) => !isFg(d.prop) && CONSTANT_FILL.test(d.masked));

      for (const d of decls) {
        const text = `${d.prop}: ${d.value.trim().replace(/\s+/g, ' ')}`;
        const lineOf = (index) => lineAt(segment.start + d.at + index);
        const report = (level, line, message, snippet = text) => findings.push({ level, path, line, message, snippet });
        const flagged = new Set(); // indeksy hexów już zgłoszonych jako błąd

        for (const w of d.masked.matchAll(WHITE)) {
          const line = lineOf(w.index);
          if (isBg(d.prop)) {
            if (!exempt(line)) report('error', line, 'białe tło zostaje białe w nocy → var(--surface) (karta, pole) albo var(--bg) (tło strony)');
            flagged.add(w.index);
          } else if (isFg(d.prop) && flipBg) {
            const bgLine = lineAt(segment.start + flipBg.at);
            const token = flipBg.masked.match(FLIPPING_BG)[1];
            if (!exempt(line, bgLine)) report('error', line, `biały tekst na var(--${token}), które w nocy jaśnieje → var(--on-ink)`);
            flagged.add(w.index);
          } else if (isFg(d.prop) && blueBg) {
            const bgLine = lineAt(segment.start + blueBg.at);
            const bgText = `${blueBg.prop}: ${blueBg.value.trim().replace(/\s+/g, ' ')}`;
            if (!exempt(line, bgLine)) report('error', bgLine, 'tło var(--blue) pod białym tekstem jaśnieje w nocy → var(--blue-fill) (stały kobalt)', bgText);
            flagged.add(w.index);
          } else if (constantFill) flagged.add(w.index); // biel na stałym wypełnieniu — wzorzec z README
        }

        for (const h of d.masked.matchAll(HEX)) {
          if (flagged.has(h.index) || ![4, 5, 7, 9].includes(h[0].length)) continue;
          const line = lineOf(h.index);
          if (exempt(line)) continue;
          const white = /^#f{3}(f|f{3}|f{5})?$/i.test(h[0]);
          const message = white && isFg(d.prop)
            ? 'biały tekst — jeśli tło w innej regule to --ink/--ok/--bad → var(--on-ink), --blue → var(--blue-fill)'
            : tokenHint(h[0]);
          report('warning', line, message);
        }
      }
    }
  }
}

/* --- raport --- */

findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
const errors = findings.filter((f) => f.level === 'error');
const warnings = findings.filter((f) => f.level === 'warning');
const snippet = (f) => (f.snippet.length > 70 ? f.snippet.slice(0, 69) + '…' : f.snippet);

if (!quiet && warnings.length) {
  console.log('Ostrzeżenia — surowe kolory poza tokens.css:\n');
  warnings.forEach((f) => console.log(`${f.path}:${f.line}  ${snippet(f)}  → ${f.message}`));
  console.log('');
}
if (errors.length) {
  console.log('Błędy — kolory, które psują tryb nocny:\n');
  errors.forEach((f) => console.log(`${f.path}:${f.line}  ${snippet(f)}\n    ${f.message}`));
  console.log('\nCelowy wyjątek? Dopisz w linii /* kolor-stały: powód */ (zasady: README, „Tryb nocny”).\n');
}
console.log(`check:colors — błędy: ${errors.length}, ostrzeżenia: ${warnings.length}${quiet && warnings.length ? ' (lista bez --quiet)' : ''}`);
process.exit(errors.length ? 1 : 0);
