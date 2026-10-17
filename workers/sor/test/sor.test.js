// Testy Workera SOR bez sieci: zaślepiony fetch, atrapa D1 i atrapa Cache API.
// Uruchomienie z katalogu głównego repo:  node --test workers/sor/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import lista from '../../../src/data/sor/lista.json' with { type: 'json' };
import worker, {
  ETAPY,
  OKRES_MS,
  PARTIE,
  USER_AGENT,
  ZRODLO,
  kluczArchiwum,
  numeryPartii,
  numeryZListy,
  odczytaj,
  przetworz,
  scal,
  SCIEZKA_TERAZ,
  zbierz,
} from '../src/index.js';

const NUMERY = numeryZListy(lista);

// Odpowiedź w kształcie prawdziwej (pacjent.gov.pl, 17.10.2026) — etapy w innej kolejności niż ETAPY.
const odpowiedz = (tS, nadpisz = {}) => ({
  host: 'pacjent.gov.pl',
  t: tS,
  data: [
    { name: 'Priorytet najniższy', count: 0, wait: '-' },
    { name: 'Priorytet najwyższy', count: 1, wait: '9 min' },
    { name: 'Priorytet niski', count: 2, wait: '35 min' },
    { name: 'Priorytet średni', count: 8, wait: '60 min' },
    { name: 'Priorytet wysoki', count: 3, wait: '15 min' },
    { name: 'Rejestracja', count: 4, wait: '5 min' },
    { name: 'Triaż', count: 5, wait: 'powyżej 2 godzin' },
  ],
  resstatus: 200,
  expecting: 47,
  label_topsor_1: 'Aktualna liczba pacjentów: ',
  ...nadpisz,
});

// Atrapa D1: tylko zapytania, których używa Worker (prepare/bind/first/run i batch).
class Zapytanie {
  constructor(db, sql, args = []) {
    Object.assign(this, { db, sql, args });
  }
  bind(...args) {
    return new Zapytanie(this.db, this.sql, args);
  }
  async first(kolumna) {
    const wiersz = this.db.wykonaj(this.sql, this.args);
    return wiersz ? wiersz[kolumna] : null;
  }
  async run() {
    this.db.wykonaj(this.sql, this.args);
    return { success: true };
  }
}

class AtrapaD1 {
  teraz = null; // { json, aktualizacja }
  archiwum = new Map(); // uruchomienie → { partia, gz }
  odczyty = 0;
  prepare(sql) {
    return new Zapytanie(this, sql);
  }
  async batch(zapytania) {
    return Promise.all(zapytania.map((z) => z.run()));
  }
  wykonaj(sql, args) {
    if (sql.startsWith('CREATE TABLE IF NOT EXISTS')) return null;
    if (sql.startsWith('SELECT json FROM teraz')) {
      this.odczyty++;
      return this.teraz && { json: this.teraz.json };
    }
    if (sql.startsWith('INSERT INTO teraz')) {
      assert.equal(typeof args[0], 'string');
      this.teraz = { json: args[0], aktualizacja: args[1] };
      return null;
    }
    if (sql.startsWith('INSERT OR REPLACE INTO archiwum')) {
      assert.ok(args[2] instanceof Uint8Array, 'archiwum jako BLOB');
      this.archiwum.set(args[0], { partia: args[1], gz: args[2] });
      return null;
    }
    throw new Error(`atrapa D1: nieznane zapytanie ${sql}`);
  }
  czytaj() {
    return this.teraz && JSON.parse(this.teraz.json);
  }
  czytajArchiwum(klucz) {
    const w = this.archiwum.get(klucz);
    return w && { kolumnaPartia: w.partia, ...JSON.parse(gunzipSync(w.gz).toString('utf8')) };
  }
}

// Atrapa Cache API (caches.default): klucz = adres zapytania.
class AtrapaCache {
  wpisy = new Map();
  async match(zapytanie) {
    return this.wpisy.get(zapytanie.url)?.clone();
  }
  async put(zapytanie, odp) {
    this.wpisy.set(zapytanie.url, odp);
  }
}
const ctxTestowy = () => {
  const czekaj = [];
  return { waitUntil: (p) => czekaj.push(p), wszystko: () => Promise.all(czekaj) };
};

// Zaślepiony fetch: zapisuje zapytania, odpowiada według numeru; `t` odpowiedzi = `t` zapytania.
function zaslepka(odpowiedzNa = () => null) {
  const zapytania = [];
  const fetchFn = async (url, opcje) => {
    zapytania.push({ url, opcje });
    const u = new URL(url);
    const numer = u.pathname.split('/').pop();
    const tS = Number(u.searchParams.get('t'));
    const wlasna = odpowiedzNa(numer, tS);
    if (wlasna instanceof Error) throw wlasna;
    if (wlasna instanceof Response) return wlasna;
    return Response.json(wlasna ?? odpowiedz(tS));
  };
  return { fetchFn, zapytania };
}

// Czas crona dla wybranej partii (wielokrotność 2 minut).
const czasPartii = (partia, baza = Date.UTC(2026, 9, 17, 8, 0)) => {
  const start = Math.floor(baza / OKRES_MS) * OKRES_MS;
  const przesuniecie = (partia - (Math.floor(start / OKRES_MS) % PARTIE) + PARTIE) % PARTIE;
  return start + przesuniecie * OKRES_MS;
};

test('lista: 245 unikalnych, posortowanych numerów w poprawnym formacie', () => {
  assert.equal(NUMERY.length, 245);
  assert.deepEqual(NUMERY, [...NUMERY].sort());
  assert.ok(NUMERY.every((n) => /^\d{12}-\d{3}$/.test(n)));
});

test('lista: numer w złym formacie jest pomijany', () => {
  const ostrzezenia = [];
  const warn = console.warn;
  console.warn = (m) => ostrzezenia.push(m);
  try {
    const numery = numeryZListy({ sor: [{ numer: '000000001137-014' }, { numer: '1137-14' }, { numer: '000000001137-014' }, { numer: null }] });
    assert.deepEqual(numery, ['000000001137-014']);
  } finally {
    console.warn = warn;
  }
  assert.equal(ostrzezenia.length, 2);
});

test('partie: 5 rozłącznych partii po 49 numerów pokrywa całą listę', () => {
  const widziane = new Set();
  for (let p = 0; p < PARTIE; p++) {
    const { partia, numery } = numeryPartii(NUMERY, czasPartii(p));
    assert.equal(partia, p);
    assert.equal(numery.length, 49);
    for (const n of numery) {
      assert.ok(!widziane.has(n), `numer ${n} w dwóch partiach`);
      widziane.add(n);
    }
  }
  assert.equal(widziane.size, NUMERY.length);
});

test('partie: kolejne uruchomienia co 2 minuty przechodzą przez wszystkie partie', () => {
  const t0 = czasPartii(0);
  const partie = Array.from({ length: 10 }, (_, i) => numeryPartii(NUMERY, t0 + i * OKRES_MS).partia);
  assert.deepEqual(partie, [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]);
});

test('partie: nigdy więcej niż 49 zapytań, nawet gdy lista urośnie', () => {
  const duza = Array.from({ length: 300 }, (_, i) => `${String(i).padStart(12, '0')}-001`);
  const blad = console.error;
  console.error = () => {};
  try {
    for (let p = 0; p < PARTIE; p++) assert.ok(numeryPartii(duza, czasPartii(p)).numery.length <= 49);
  } finally {
    console.error = blad;
  }
});

test('przetworz: etapy w kolejności ETAPY, ts z pola t, w = expecting', () => {
  const tMs = Date.UTC(2026, 9, 17, 8, 4, 1);
  const tS = Math.floor(tMs / 1000);
  const wpis = przetworz(odpowiedz(tS), '2026-10-17T08:04:01Z', tMs);
  assert.deepEqual(wpis, {
    t: '2026-10-17T08:04:01Z',
    ts: '2026-10-17T08:04:01Z',
    w: 47,
    e: [
      [4, '5 min'],
      [5, 'powyżej 2 godzin'],
      [1, '9 min'],
      [3, '15 min'],
      [8, '60 min'],
      [2, '35 min'],
      [0, '-'],
    ],
  });
});

test('przetworz: brakujący etap → [null, null], nieznane etapy → inne', () => {
  const tMs = Date.UTC(2026, 9, 17, 8, 4, 1);
  const tS = Math.floor(tMs / 1000);
  const json = odpowiedz(tS);
  json.data = json.data.filter((p) => p.name !== 'Triaż');
  json.data.push({ name: 'Rejestracja Ginekologia', count: 2, wait: '20 min' }, { name: 'Triaż ZRM', count: '1', wait: '-' });
  const wpis = przetworz(json, 'x', tMs);
  assert.equal(wpis.blad, undefined);
  assert.deepEqual(wpis.e[1], [null, null]);
  assert.deepEqual(wpis.inne, [
    ['Rejestracja Ginekologia', 2, '20 min'],
    ['Triaż ZRM', 1, '-'],
  ]);
});

test('przetworz: błędy formatu, brak danych, nieaktualna odpowiedź', () => {
  const tMs = Date.UTC(2026, 9, 17, 8, 4, 1);
  const tS = Math.floor(tMs / 1000);
  assert.equal(przetworz(null, 'x', tMs).blad, 'format');
  assert.equal(przetworz([], 'x', tMs).blad, 'format');
  assert.equal(przetworz(odpowiedz(undefined), 'x', tMs).blad, 'format'); // brak pola t
  assert.equal(przetworz(odpowiedz(tS, { data: { a: 1 } }), 'x', tMs).blad, 'format');
  assert.equal(przetworz(odpowiedz(tS, { data: [{ count: 1 }] }), 'x', tMs).blad, 'format');
  assert.equal(przetworz(odpowiedz(tS, { data: null, resstatus: 0 }), 'x', tMs).blad, 'brak danych');
  assert.equal(przetworz(odpowiedz(tS, { data: [] }), 'x', tMs).blad, 'brak danych');
  // kopia z cache serwera sprzed 18 dni
  const stara = przetworz(odpowiedz(tS - 18 * 86400), 'x', tMs);
  assert.equal(stara.blad, 'nieaktualne');
  assert.equal(stara.ts, '2026-09-29T08:04:01Z');
  // 9 minut rozjazdu jeszcze przechodzi
  assert.equal(przetworz(odpowiedz(tS - 9 * 60), 'x', tMs).blad, undefined);
});

test('zbierz: zapytania z t, User-Agent, limitem czasu, najwyżej 6 naraz', async () => {
  const db = new AtrapaD1();
  let wToku = 0;
  let najwiecej = 0;
  const { fetchFn: bazowy, zapytania } = zaslepka();
  const fetchFn = async (url, opcje) => {
    wToku++;
    najwiecej = Math.max(najwiecej, wToku);
    await new Promise((r) => setTimeout(r, 2));
    try {
      return await bazowy(url, opcje);
    } finally {
      wToku--;
    }
  };
  const przed = Math.floor(Date.now() / 1000);
  const wynik = await zbierz({ SOR_DB: db }, czasPartii(2), { fetchFn });
  const po = Math.floor(Date.now() / 1000);

  assert.equal(zapytania.length, 49);
  assert.ok(najwiecej <= 6, `naraz: ${najwiecej}`);
  assert.equal(najwiecej, 6);
  const oczekiwane = numeryPartii(NUMERY, czasPartii(2)).numery;
  assert.deepEqual(new Set(zapytania.map((z) => new URL(z.url).pathname.split('/').pop())), new Set(oczekiwane));
  for (const { url, opcje } of zapytania) {
    const u = new URL(url);
    assert.equal(u.origin + u.pathname.replace(/[^/]+$/, ''), 'https://pacjent.gov.pl/api/v1/datatopsor/');
    assert.equal(u.searchParams.get('_format'), 'json');
    const t = Number(u.searchParams.get('t'));
    assert.ok(t >= przed && t <= po, `t=${t}`);
    assert.equal(opcje.headers['User-Agent'], USER_AGENT);
    assert.ok(opcje.signal instanceof AbortSignal);
  }
  assert.deepEqual(wynik, { partia: 2, zapytania: 49, poprawne: 49, bledy: {} });
});

test('zbierz: pierwsza migawka ma dokładnie schemat strony i metadane HTTP', async () => {
  const db = new AtrapaD1();
  const { fetchFn } = zaslepka();
  const czas = czasPartii(0, Date.UTC(2026, 9, 17, 8, 4));
  await zbierz({ SOR_DB: db }, czas, { fetchFn });

  const migawka = db.czytaj();
  assert.deepEqual(Object.keys(migawka), ['zrodlo', 'aktualizacja', 'etapy', 'sor']);
  assert.equal(migawka.zrodlo, ZRODLO);
  assert.match(migawka.aktualizacja, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
  assert.deepEqual(migawka.etapy, ETAPY);
  assert.equal(Object.keys(migawka.sor).length, 49);
  for (const wpis of Object.values(migawka.sor)) {
    assert.deepEqual(Object.keys(wpis), ['t', 'ts', 'w', 'e']);
    assert.equal(wpis.e.length, 7);
    assert.ok(wpis.e.every((p) => Array.isArray(p) && p.length === 2));
  }
  assert.equal(db.teraz.aktualizacja, migawka.aktualizacja);

  const kluczA = kluczArchiwum(czas);
  assert.match(kluczA, /^2026-10-17T\d\d:\d\d:00Z$/);
  const archiwum = db.czytajArchiwum(kluczA);
  assert.equal(archiwum.partia, 0);
  assert.equal(archiwum.kolumnaPartia, 0);
  assert.ok(db.archiwum.get(kluczA).gz.length < 4000, 'archiwum skompresowane');
  assert.deepEqual(archiwum.sor, migawka.sor);
});

test('kluczArchiwum: czas crona jako ISO UTC', () => {
  assert.equal(kluczArchiwum(Date.UTC(2026, 9, 17, 8, 4)), '2026-10-17T08:04:00Z');
  assert.equal(kluczArchiwum(Date.UTC(2026, 11, 31, 23, 58)), '2026-12-31T23:58:00Z');
});

test('zbierz: błędy HTTP, czasu, sieci i formatu; poprzedni pomiar zostaje w wpisie błędu', async () => {
  const db = new AtrapaD1();
  const czas = czasPartii(1);
  const numery = numeryPartii(NUMERY, czas).numery;
  const [n503, nCzas, nSiec, nHtml, nNull] = numery;

  // 1. przebieg: wszystko poprawne
  await zbierz({ SOR_DB: db }, czas, { fetchFn: zaslepka().fetchFn });
  const poprawny = db.czytaj().sor[n503];
  assert.equal(poprawny.w, 47);

  // 2. przebieg (10 minut później, ta sama partia): część zapytań pada
  const { fetchFn } = zaslepka((numer) => {
    if (numer === n503) return new Response('przeciążenie', { status: 503 });
    if (numer === nCzas) return new DOMException('limit', 'TimeoutError');
    if (numer === nSiec) return new TypeError('fetch failed');
    if (numer === nHtml) return new Response('<html>blokada</html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
    if (numer === nNull) return { t: Math.floor(Date.now() / 1000), data: null, resstatus: 0 };
    return null;
  });
  const wynik = await zbierz({ SOR_DB: db }, czas + PARTIE * OKRES_MS, { fetchFn });
  assert.deepEqual(wynik.bledy, { 'HTTP 503': 1, 'limit czasu': 1, połączenie: 1, format: 1, 'brak danych': 1 });
  assert.equal(wynik.poprawne, 44);

  const sor = db.czytaj().sor;
  assert.equal(sor[n503].blad, 'HTTP 503');
  assert.deepEqual(sor[n503].poprzedni, poprawny);
  assert.equal(sor[nCzas].blad, 'limit czasu');
  assert.equal(sor[nSiec].blad, 'połączenie');
  assert.equal(sor[nHtml].blad, 'format');
  assert.equal(sor[nNull].blad, 'brak danych');
  assert.ok(sor[nNull].ts);

  // archiwum trzyma surowy wynik uruchomienia — bez `poprzedni`
  const archiwum = db.czytajArchiwum(kluczArchiwum(czas + PARTIE * OKRES_MS));
  assert.deepEqual(Object.keys(archiwum.sor[n503]), ['t', 'blad']);

  // 3. przebieg: dalej błąd — `poprzedni` przechodzi dalej bez zagnieżdżania
  await zbierz({ SOR_DB: db }, czas + 2 * PARTIE * OKRES_MS, { fetchFn });
  const trzeci = db.czytaj().sor[n503];
  assert.deepEqual(trzeci.poprzedni, poprawny);
  assert.equal(trzeci.poprzedni.poprzedni, undefined);
});

test('scal: poprzedni starszy niż 24 h wypada, numery spoza listy znikają', () => {
  const teraz = Date.UTC(2026, 9, 17, 12, 0);
  const stara = {
    zrodlo: ZRODLO,
    aktualizacja: '2026-10-16T09:00:00Z',
    etapy: ETAPY,
    sor: {
      'A': { t: '2026-10-16T11:00:00Z', ts: '2026-10-16T11:00:00Z', w: 3, e: [] }, // 25 h temu
      'B': { t: '2026-10-17T11:50:00Z', ts: '2026-10-17T11:50:00Z', w: 5, e: [] },
      'X': { t: '2026-10-17T11:50:00Z', ts: '2026-10-17T11:50:00Z', w: 1, e: [] }, // już nie na liście
    },
  };
  const blad = { t: '2026-10-17T12:00:00Z', blad: 'HTTP 503' };
  const nowa = scal(stara, [['A', blad], ['B', blad]], ['A', 'B'], teraz);
  assert.deepEqual(nowa.sor.A, blad);
  assert.equal(nowa.sor.B.poprzedni.w, 5);
  assert.equal(nowa.sor.X, undefined);
  assert.equal(nowa.aktualizacja, '2026-10-17T12:00:00Z');
});

test('scal: migawka z innymi etapami albo uszkodzona zaczyna się od zera', () => {
  const teraz = Date.UTC(2026, 9, 17, 12, 0);
  const wpis = { t: '2026-10-17T12:00:00Z', ts: '2026-10-17T12:00:00Z', w: 1, e: [] };
  const inneEtapy = { etapy: ['Rejestracja'], sor: { B: wpis } };
  assert.deepEqual(Object.keys(scal(inneEtapy, [['A', wpis]], ['A', 'B'], teraz).sor), ['A']);
  assert.deepEqual(Object.keys(scal({ etapy: ETAPY, sor: [] }, [['A', wpis]], ['A'], teraz).sor), ['A']);
});

test('zbierz: nieczytelna migawka w D1 nie zatrzymuje zapisu', async () => {
  const db = new AtrapaD1();
  db.teraz = { json: '{uszkodzony', aktualizacja: '' };
  const blad = console.error;
  console.error = () => {};
  try {
    await zbierz({ SOR_DB: db }, czasPartii(3), { fetchFn: zaslepka().fetchFn });
  } finally {
    console.error = blad;
  }
  assert.equal(Object.keys(db.czytaj().sor).length, 49);
});

test('scheduled: wyłącza ponowienia i pracuje na czasie crona', async () => {
  // Handler domyślny używa globalnego fetch — podmieniamy go na czas testu.
  const db = new AtrapaD1();
  const { fetchFn, zapytania } = zaslepka();
  const oryginalny = globalThis.fetch;
  globalThis.fetch = fetchFn;
  let bezPonowien = false;
  try {
    const czas = czasPartii(4);
    await worker.scheduled({ scheduledTime: czas, cron: '*/2 * * * *', noRetry: () => (bezPonowien = true) }, { SOR_DB: db });
    assert.ok(bezPonowien);
    assert.equal(zapytania.length, 49);
    assert.ok(db.czytajArchiwum(kluczArchiwum(czas)));
  } finally {
    globalThis.fetch = oryginalny;
  }
});

test('zbierz: bez bindingu D1 kończy się czytelnym błędem i niczego nie odpytuje', async () => {
  const { fetchFn, zapytania } = zaslepka();
  await assert.rejects(zbierz({}, czasPartii(0), { fetchFn }), /brak bindingu D1/);
  assert.equal(zapytania.length, 0);
});

/* ---------- odczyt: GET /sor/teraz.json ---------- */

const ADRES = `https://dane.zarobkilekarzy.pl${SCIEZKA_TERAZ}`;

test('odczytaj: inne adresy → 404, inne metody → 405', async () => {
  const db = new AtrapaD1();
  const nieMa = await odczytaj(new Request('https://dane.zarobkilekarzy.pl/'), { SOR_DB: db }, ctxTestowy(), new AtrapaCache());
  assert.equal(nieMa.status, 404);
  const post = await odczytaj(new Request(ADRES, { method: 'POST' }), { SOR_DB: db }, ctxTestowy(), new AtrapaCache());
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('Allow'), 'GET, HEAD');
  assert.equal(db.odczyty, 0);
});

test('odczytaj: bez migawki → 503 bez cache', async () => {
  const cache = new AtrapaCache();
  const odp = await odczytaj(new Request(ADRES), { SOR_DB: new AtrapaD1() }, ctxTestowy(), cache);
  assert.equal(odp.status, 503);
  assert.equal(odp.headers.get('Cache-Control'), 'no-store');
  assert.equal(cache.wpisy.size, 0);
});

test('odczytaj: migawka z D1 z nagłówkami, potem z cache bez czytania bazy', async () => {
  const db = new AtrapaD1();
  await zbierz({ SOR_DB: db }, czasPartii(0), { fetchFn: zaslepka().fetchFn });
  const cache = new AtrapaCache();
  const ctx = ctxTestowy();
  const pierwsza = await odczytaj(new Request(ADRES), { SOR_DB: db }, ctx, cache);
  await ctx.wszystko();
  assert.equal(pierwsza.status, 200);
  assert.equal(pierwsza.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assert.equal(pierwsza.headers.get('Cache-Control'), 'public, max-age=60');
  assert.equal(pierwsza.headers.get('Access-Control-Allow-Origin'), '*');
  assert.deepEqual(await pierwsza.json(), db.czytaj());
  const odczytyPo1 = db.odczyty;

  // drugie zapytanie, z dopisanym parametrem: ten sam wpis cache, baza nieczytana
  const druga = await odczytaj(new Request(`${ADRES}?x=1`), { SOR_DB: db }, ctxTestowy(), cache);
  assert.equal(druga.status, 200);
  assert.deepEqual(await druga.json(), db.czytaj());
  assert.equal(db.odczyty, odczytyPo1);

  const head = await odczytaj(new Request(ADRES, { method: 'HEAD' }), { SOR_DB: db }, ctxTestowy(), cache);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

