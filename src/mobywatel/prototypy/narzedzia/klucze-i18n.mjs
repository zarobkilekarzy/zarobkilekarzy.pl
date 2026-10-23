/**
 * Klucze tłumaczeń wariantu „Moje zdrowie”: uruchamia złożony wariant w jsdom dla czterech osób, przechodzi ekrany
 * i sprawy w rozmowie i zbiera teksty tak jak i18n.js bazy (liczby → {0}, {1}…; bez [data-t="0"]).
 * Wynik: nowe klucze (bez tych ze słownika bazy i nazw własnych) w <katalog roboczy>/do-tlumaczenia.json —
 * do przetłumaczenia na języki z baza-i18n/ i zapisania w warianty/moje-zdrowie/i18n/<język>.json.
 *
 * Wymaga jsdom (nie jest zależnością strony) i migawki kolejek SOR:
 *   cd <katalog roboczy> && npm i jsdom@25 && curl -s https://dane.zarobkilekarzy.pl/sor/teraz.json -o teraz.json
 *   node -e "import('<repo>/src/mobywatel/prototypy/zloz.mjs').then(m=>m.zloz('<katalog roboczy>/zlozone'))"
 *   node <repo>/src/mobywatel/prototypy/narzedzia/klucze-i18n.mjs <katalog roboczy>
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const H = process.argv[2];
const DIST = join(H, 'zlozone', 'moje-zdrowie');
const { JSDOM, VirtualConsole } = createRequire(join(H, 'package.json'))('jsdom');
const teraz = readFileSync(join(H, 'teraz.json'), 'utf8');
const NUM = /\d+(?:[.,:/]\d+)*/g;
const szablon = (s) => s.replace(NUM, (() => { let i = 0; return () => '{' + i++ + '}'; })());
const doT = (s) => s && (/\b(OC|PESEL|ZUS|KDR|UFG)\b/.test(s) || /[a-ząćęłńóśźż]/.test(s)) && s.length <= 700;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const klucze = new Map();

function zbierz(doc, gdzie) {
  const w = doc.createTreeWalker(doc.body, 0x1 | 0x4, {
    acceptNode: (n) => n.nodeType === 1 ? (n.matches('[data-t="0"],SCRIPT,STYLE,TEXTAREA,INPUT,SVG,svg,CODE') ? 2 : 3) : 1,
  });
  let n;
  while ((n = w.nextNode())) {
    const s = n.nodeValue.trim();
    if (doT(s)) { const k = szablon(s); if (!klucze.has(k)) klucze.set(k, gdzie); }
  }
  doc.body.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach((el) => {
    if (el.closest('[data-t="0"],SCRIPT,STYLE')) return;
    for (const a of ['placeholder', 'aria-label', 'title', 'alt']) {
      const s = (el.getAttribute(a) || '').trim();
      if (doT(s)) { const k = szablon(s); if (!klucze.has(k)) klucze.set(k, gdzie + ' @' + a); }
    }
  });
}

async function osoba(id) {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented|Could not parse CSS/.test(e.message)) console.error('[jsdom]', id, e.message, (e.detail&&e.detail.stack||'').split('\n').slice(0,3).join(' | ')); });
  const dom = new JSDOM(html, {
    url: `file://${join(DIST, 'index.html')}?osoba=${id}`, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.FAST = true;
      w.matchMedia = () => ({ matches: false, addListener() {}, addEventListener() {} });
      w.Element.prototype.scrollTo = function () {};
      w.Element.prototype.scrollIntoView = function () {};
      w.fetch = async (u) => {
        u = String(u);
        const ok = (t) => ({ ok: true, json: async () => JSON.parse(t), text: async () => t });
        if (u.includes('teraz.json')) return ok(teraz);
        if (/^(sor-mapa|opis)\.json/.test(u)) return ok(readFileSync(join(DIST, u), 'utf8'));
        throw new TypeError('offline');
      };
    },
  });
  const w = dom.window;
  await new Promise((r) => w.addEventListener('load', r));
  await sleep(300);
  const ev = (src) => w.eval(src);
  const ekran = async (src, gdzie) => { ev(src); await sleep(150); zbierz(w.document, gdzie); };

  zbierz(w.document, 'start');
  ev('openTodo()'); await sleep(50); zbierz(w.document, 'todo'); ev('closeTodo()');
  await ekran('zdOpen()', 'karta');
  await ekran('zdBilet()', 'bilecik');
  await ekran('zdWizytyEkran()', 'wizyty');
  await ekran('zdReceptyEkran()', 'recepty');
  ev("ZD_RX_Q='amok';zdReceptyEkran()"); zbierz(w.document, 'recepty-szukaj');
  ev("ZD_RX_Q='xyzq';zdReceptyEkran()"); zbierz(w.document, 'recepty-szukaj'); ev("ZD_RX_Q=''");
  for (let i = 0; i < ev('ZD.recepty.length'); i++) await ekran(`zdRecepta(${i})`, 'recepta');
  await ekran('zdKoszty()', 'koszty');
  await ekran('zdBadania()', 'badania');
  for (let i = 0; i < ev('ZD.badania.length'); i++) await ekran(`zdBadanie(${i})`, 'badanie');
  await ekran('zdEksport()', 'eksport');
  ev("URL.createObjectURL=()=>'blob:x';HTMLAnchorElement.prototype.click=function(){}"); ev("zdPobierz('fhir')"); zbierz(w.document, 'eksport');
  await ekran('zdLekarzeEkran()', 'lekarze');
  await ekran('zdHistoria()', 'historia');
  for (let i = 0; i < 5; i++) await ekran(`zdRachunek(${i})`, 'rachunek');
  await ekran('zdPrawa()', 'prawa');
  for (const n of Object.keys(ev('ZD.lekarze'))) await ekran(`zdLekarz(${JSON.stringify(n)})`, 'lekarz');
  await ekran('zdSor()', 'sor'); await sleep(400); zbierz(w.document, 'sor');
  ev("SOR.q='lub';SOR.tryb='szukaj';sorRysuj()"); zbierz(w.document, 'sor-szukaj');
  ev("SOR.q='xyzq';SOR.tryb='szukaj';sorRysuj()"); zbierz(w.document, 'sor-szukaj');
  ev("sorGps(document.querySelector('.zd-gps'))"); await sleep(50); zbierz(w.document, 'sor-gps'); await sleep(1300); zbierz(w.document, 'sor-gps');
  ev("SOR.blad=true;SOR.mapa=null;sorRysuj()"); zbierz(w.document, 'sor-blad');

  // sprawy w rozmowie: kliknij przycisk o danym tekście / ostatnie „primary”
  const klik = async (tekst) => {
    const b = [...w.document.querySelectorAll('#chat button')].reverse().find((x) => x.textContent.trim().startsWith(tekst));
    if (!b) throw new Error(`${id}: brak przycisku „${tekst}”`);
    b.click(); await sleep(400); zbierz(w.document, 'rozmowa');
  };
  const potwierdz = async () => { const b = [...w.document.querySelectorAll('#chat .ui .actions .btn.primary')].pop(); b.click(); await sleep(600); zbierz(w.document, 'rozmowa'); };
  const temat = async (t, fn) => { ev(`$('#detail').classList.remove('on');startTopic(${JSON.stringify(t)},${fn})`); await sleep(600); zbierz(w.document, 'rozmowa'); };

  await temat('Co jest na mojej karcie zdrowia?', 'S.zdKarta');
  await temat('Wizyta', 'S.zdPrzypomnienie'); await klik('Potwierdzam'); await potwierdz();
  await temat('Wizyta', 'S.zdPrzypomnienie');
  ev('ZD.umowione[0].potwierdzona=false');
  await temat('Wizyta', 'S.zdPrzypomnienie'); await klik('Odwołuję'); await potwierdz();
  await temat('Wizyta', 'S.zdPrzypomnienie');
  await temat('Wizyta', 'S.zdPoWizycie'); await klik('Tak'); for (const n of ['5', '4', '3']) await klik(n);
  await temat('Wizyta', 'S.zdPoWizycie'); await klik('Nie'); await potwierdz();
  await temat('Ocena wizyty', '()=>S.zdOcena(ZD.wizyty[1])'); for (const n of ['5', '4', '3']) await klik(n);
  await temat('Brak', 'S.zdBrakLekarza'); await potwierdz();
  for (const s of ['Odmówiono mi informacji', 'Odmówiono mi dokumentacji', 'Zabrakło szacunku']) { await temat('Skarga', 'S.zdSkarga'); await klik(s); await potwierdz(); }
  await temat('Co mam do załatwienia?', 'S.todo');
  await temat('Badanie', '()=>S.zdBadanieNieBylo(0)'); await potwierdz();
  for (let i = 0; i < 2; i++) {
    await temat('Lek', `()=>S.zdNiepozadane(${i})`);
    const wiele = ev(`ZD.recepty[${i}].leki.length`) > 1;
    if (wiele) await klik(ev(`ZD.recepty[${i}].leki[0].n`));
    await klik('Wysypka'); await klik('Ból głowy'); await klik('Dalej'); await klik('Wczoraj'); await potwierdz();
  }
  // anulowanie potwierdzenia
  await temat('Brak', 'S.zdBrakLekarza'); [...w.document.querySelectorAll('#chat .ui .actions .btn.ghost')].pop().click(); await sleep(500);
  zbierz(w.document, 'rozmowa');
  w.close();
}

for (const id of ['marta', 'jan', 'ewa', 'kacper']) await osoba(id);

// bez nazw własnych: SOR-y, osoby, lekarze (zostają jak są)
const mapa = JSON.parse(readFileSync(join(DIST, 'sor-mapa.json'), 'utf8'));
const wlasne = new Set(mapa.sor.flatMap((s) => [s.n, s.c, s.a, `${s.c}, ${s.a}`].map(szablon)));
const wynik = [...klucze].filter(([k]) => !wlasne.has(k) && !/^lek\.( dent\.)? [A-ZŁŚŻ]\w+ [A-ZŁŚŻ]\w+$/u.test(k));
const baza = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'baza-i18n', 'en.json'), 'utf8'));
const POMIN = /^(Polski|English|Deutsch|Français|Español|Italiano|Português|Nederlands|Čeština|Slovenčina|Slovenščina|Magyar|Română|Ελληνικά|Svenska|Українська|kancelaria@rpp\.gov\.pl|ePUAP|mObywatel Challenge)$/;
const nowe = wynik.filter(([k]) => !(k in baza) && !POMIN.test(k)).map(([klucz, gdzie]) => ({ klucz, gdzie }));
writeFileSync(join(H, 'do-tlumaczenia.json'), JSON.stringify(nowe, null, 1));
console.log(`kluczy: ${wynik.length}, nowych do tłumaczenia: ${nowe.length}`);
