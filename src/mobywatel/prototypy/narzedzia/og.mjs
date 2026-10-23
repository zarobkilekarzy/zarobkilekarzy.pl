/**
 * Grafika OG wariantu (1200×630) w układzie obrazków OG strony (lib/og/render.ts): logo, etykieta, tytuł, lead,
 * stopka, a po prawej telefon z prototypu ucięty dolną krawędzią (widać ok. połowy). Telefon to zrzut
 * z headless Chromium (DPR 3, przezroczyste tło) przez CDP. Teksty i ekran: pole `og` w opis.json wariantu.
 *
 * Uruchomienie (z katalogu repo, przy działającym podglądzie wariantów, np. mobywatel-cf-preview na 8801):
 *   node src/mobywatel/prototypy/narzedzia/og.mjs <wariant> [adres podglądu]
 * Chromium: zmienna CHROME (domyślnie /Applications/Chromium.app). Wynik: src/assets/mobywatel/og-<wariant>.png
 * — PNG bez metadanych; obrazek i tagi og:* wpina wpis w src/data/og.ts (patrz zloz.mjs).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const [slug, podglad = 'http://localhost:8801'] = process.argv.slice(2);
if (!slug) throw new Error('Podaj wariant, np. moje-zdrowie');
const root = join(import.meta.dirname, '..');
const site = join(root, '..', '..', '..');
const opis = JSON.parse(readFileSync(join(root, 'warianty', slug, 'opis.json'), 'utf8'));
if (!opis.og) throw new Error(`${slug}: brak pola og w opis.json`);
const { tytul, lead, ekran = '', osoba = 'marta' } = opis.og;
const out = join(site, 'src', 'assets', 'mobywatel', `og-${slug}.png`);

/* ---------- Zrzut telefonu ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function zrzut(url, prep) {
  const port = 9333;
  const profil = mkdtempSync(join(tmpdir(), 'og-chromium-'));
  const chrome = spawn(process.env.CHROME ?? '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  try {
    let ws;
    for (let i = 0; i < 50 && !ws; i++) {
      const strona = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => undefined);
      if (strona) ws = new WebSocket(strona.webSocketDebuggerUrl);
      else await sleep(200);
    }
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0;
    const czeka = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); czeka.get(m.id)?.(m); czeka.delete(m.id); });
    const send = (method, params = {}) => new Promise((r) => { czeka.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expression) => {
      const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(`${expression}: ${result.exceptionDetails.text}`);
      return result.result.value;
    };

    // szerokie okno = widok na komputer (telefon w skali 1, panel z opisem, który chowamy)
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 3, mobile: false });
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await send('Page.navigate', { url });
    await sleep(2500);
    await ev(`document.documentElement.style.background = document.body.style.background = 'transparent';
      document.querySelectorAll('.ch-bar,.ch-panel').forEach((e) => (e.style.visibility = 'hidden')); 1`);
    if (prep) await ev(`(async () => { ${prep} })()`);
    await sleep(1500);
    const [x, y, w, h] = await ev(`(() => { const r = document.querySelector('#app').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`);
    const m = 16; // obręcz telefonu (box-shadow #app)
    const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: x - m, y: y - m, width: w + 2 * m, height: h + 2 * m, scale: 1 } });
    ws.close();
    return Buffer.from(result.data, 'base64');
  } finally {
    // profil kasujemy dopiero po wyjściu Chromium — wcześniej jeszcze do niego pisze
    await new Promise((r) => { chrome.once('exit', r); chrome.kill(); });
    rmSync(profil, { recursive: true, force: true, maxRetries: 5 });
  }
}

/* ---------- Grafika (wymiary, kolory i krój jak lib/og/render.ts) ---------- */
const C = { blue: '#2664EC', ink: '#040B1B', text: '#4B5466', muted: '#666E80', line: '#E6E9EF' };
const W = 1200, H = 630, PAD_X = 64, PAD_Y = 56, GAP = 56;
const PHONE_W = 500, PHONE_TOP = 92, PHONE_RIGHT = 70, FIELD_W = PHONE_W + PHONE_RIGHT + 40; // FIELD_W: kolumna telefonu (tekst obok niej)
const DISPLAY = 'Inter Tight, Inter Tight Ext', BODY = 'Plex Sans, Plex Sans Ext', MONO = 'Plex Mono, Plex Mono Ext';

// podzbiór latin-ext jako osobna rodzina „… Ext” (inaczej Satori gubi polskie znaki)
const family = (name, pkg, weights) => weights.flatMap((weight) => ['latin', 'latin-ext'].map(async (subset) => ({
  name: subset === 'latin' ? name : `${name} Ext`, weight, style: 'normal',
  data: await readFile(join(site, 'node_modules', '@fontsource', pkg, 'files', `${pkg}-${subset}-${weight}-normal.woff`)),
})));

const h = (type, props = {}, ...children) => {
  const { style = {}, ...rest } = props;
  return { type, props: { ...rest, style: type === 'div' ? { display: 'flex', boxSizing: 'border-box', ...style } : style, children: children.flat().filter((c) => c !== false && c != null) } };
};
const svgUri = (inner) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`).toString('base64')}`;
// ikony logo i x z src/icons.ts
const LOGO = '<rect width="24" height="24" fill="#2664EC"/><path d="M0 14H7.5L10 5.5 13.5 18.5 15.5 14H24" fill="none" stroke="#fff" stroke-width="2" stroke-miterlimit="5"/>';
const X = `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="${C.ink}"/>`;

const telefon = await zrzut(`${podglad}/mobywatel/${slug}/?osoba=${osoba}`, ekran);
const { width, height } = await sharp(telefon).metadata();
const widac = H - PHONE_TOP;
const kadr = await sharp(telefon).resize(PHONE_W, Math.round((PHONE_W * height) / width), { kernel: 'lanczos3' })
  .extract({ left: 0, top: 0, width: PHONE_W, height: widac }).png().toBuffer();

const wiersze = tytul.map((w, i) => (i < tytul.length - 1 ? h('div', {}, w) : h('div', {}, w, h('span', { style: { color: C.blue } }, '.'))));
const drzewo = h('div', { style: { position: 'relative', width: W, height: H, background: '#fff', fontFamily: BODY, color: C.text } },
  h('img', { src: `data:image/png;base64,${kadr.toString('base64')}`, width: PHONE_W, height: widac, style: { position: 'absolute', right: PHONE_RIGHT, top: PHONE_TOP } }),
  h('div', { style: { position: 'absolute', left: PAD_X, top: PAD_Y, bottom: PAD_Y, width: W - PAD_X - FIELD_W - GAP, flexDirection: 'column' } },
    h('div', { style: { alignItems: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: 26, letterSpacing: '-0.03em', color: C.ink } },
      h('img', { src: svgUri(LOGO), width: 30, height: 30, style: { marginRight: 14 } }), 'zarobkilekarzy', h('span', { style: { color: C.muted } }, '.pl')),
    h('div', { style: { flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', paddingTop: 24, paddingBottom: 24 } },
      h('div', { style: { alignItems: 'center', fontFamily: MONO, fontWeight: 500, fontSize: 16, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.blue } },
        h('div', { style: { width: 10, height: 10, marginRight: 12, background: C.blue } }), 'Prototyp · mObywatel Challenge'),
      h('div', { style: { flexDirection: 'column', marginTop: 26, fontFamily: DISPLAY, fontWeight: 400, fontSize: 72, lineHeight: 1, letterSpacing: '-0.04em', color: C.ink } }, ...wiersze),
      h('div', { style: { marginTop: 24, fontSize: 21, lineHeight: 1.5 } }, lead)),
    h('div', { style: { flexDirection: 'column', paddingTop: 20, borderTop: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 15, color: C.muted } },
      h('div', {}, 'Klikalny prototyp, bez logowania'),
      h('div', { style: { alignItems: 'center', marginTop: 12, whiteSpace: 'nowrap' } }, 'Obserwuj', h('span', { style: { margin: '0 0.6em', color: C.ink } }, '@ZarobkiLekarzy'), 'na',
        h('img', { src: svgUri(X), width: 15, height: 15, style: { marginLeft: 7 } })))));

const fonts = await Promise.all([...family('Inter Tight', 'inter-tight', [400, 500]), ...family('Plex Sans', 'ibm-plex-sans', [400, 600]), ...family('Plex Mono', 'ibm-plex-mono', [400, 500])]);
const svg = await satori(drzewo, { width: W, height: H, fonts });
// sharp nie zapisuje metadanych (autor, ścieżki), o ile nie poprosi się o nie wprost
await sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(out);
console.log(`${out} (widać ${Math.round((widac / ((PHONE_W * height) / width)) * 100)}% telefonu)`);
