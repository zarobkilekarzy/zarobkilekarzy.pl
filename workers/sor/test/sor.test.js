// Testy Workera SOR bez sieci: zaślepiony fetch, atrapa D1 i atrapa Cache API, a dla schematu tabel
// i pliku migracji — prawdziwy SQLite (node:sqlite, pamięć).
// Uruchomienie z katalogu głównego repo:  node --test workers/sor/test/sor.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync, gzipSync } from 'node:zlib';
import lista from '../../../src/data/sor/lista.json' with { type: 'json' };
import worker, {
  ETAPY,
  OKRES_MS,
  PARTIE,
  USER_AGENT,
  ZRODLO,
  kluczPomiaru,
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
  pomiary = new Map(); // uruchomienie (s unix) → { partia, gz }
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
    if (sql.startsWith('INSERT OR REPLACE INTO pomiary')) {
      assert.ok(Number.isInteger(args[0]), 'klucz pomiaru jako liczba całkowita');
      assert.ok(args[2] instanceof Uint8Array, 'pomiar jako BLOB');
      this.pomiary.set(args[0], { partia: args[1], gz: args[2] });
      return null;
    }
    throw new Error(`atrapa D1: nieznane zapytanie ${sql}`);
  }
  czytaj() {
    return this.teraz && JSON.parse(this.teraz.json);
  }
  czytajPomiar(klucz) {
    const w = this.pomiary.get(klucz);
    return w && { kolumnaPartia: w.partia, ...JSON.parse(gunzipSync(w.gz).toString('utf8')) };
  }
}

// D1 na prawdziwym SQLite: ten sam interfejs co atrapa, ale zapytania wykonuje silnik — sprawdza
// składnię i skutki SCHEMAT, zapisów Workera i pliku migracji. batch = transakcja, jak w D1.
// node:sqlite nie wiąże `?1`, `?2` pozycyjnie, więc zamieniamy je na `?` z argumentami w kolejności wystąpień.
class SqliteD1 {
  db = new DatabaseSync(':memory:');
  prepare(sqlD1) {
    const numery = [...sqlD1.matchAll(/\?(\d+)/g)].map((m) => Number(m[1]) - 1);
    const sql = sqlD1.replace(/\?\d+/g, '?');
    const zapytanie = (args) => {
      const wartosci = numery.length ? numery.map((i) => args[i]) : args;
      return {
        bind: (...nowe) => zapytanie(nowe),
        first: async (kolumna) => this.db.prepare(sql).get(...wartosci)?.[kolumna] ?? null,
        run: async () => (this.db.prepare(sql).run(...wartosci), { success: true }),
      };
    };
    return zapytanie([]);
  }
  async batch(zapytania) {
    this.db.exec('BEGIN');
    try {
      const wyniki = [];
      for (const z of zapytania) wyniki.push(await z.run());
      this.db.exec('COMMIT');
      return wyniki;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
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

  const kluczP = kluczPomiaru(czas);
  assert.equal(kluczP, czas / 1000);
  const pomiar = db.czytajPomiar(kluczP);
  assert.equal(pomiar.partia, 0);
  assert.equal(pomiar.kolumnaPartia, 0);
  assert.equal(pomiar.uruchomienie, new Date(czas).toISOString().slice(0, 19) + 'Z');
  assert.ok(db.pomiary.get(kluczP).gz.length < 4000, 'pomiar skompresowany');
  assert.deepEqual(pomiar.sor, migawka.sor);
});

test('kluczPomiaru: czas crona w sekundach unix, bez milisekund', () => {
  assert.equal(kluczPomiaru(Date.UTC(2026, 9, 17, 8, 4)), 1792224240);
  // na produkcji cron startuje kilkanaście sekund po pełnej minucie (np. 00:50:28)
  assert.equal(kluczPomiaru(Date.UTC(2026, 9, 17, 0, 50, 28, 999)), 1792198228);
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

  // pomiar trzyma surowy wynik uruchomienia — bez `poprzedni`
  const pomiar = db.czytajPomiar(kluczPomiaru(czas + PARTIE * OKRES_MS));
  assert.deepEqual(Object.keys(pomiar.sor[n503]), ['t', 'blad']);

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
    assert.ok(db.czytajPomiar(kluczPomiaru(czas)));
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


/* ---------- prawdziwy SQLite: tabela `pomiary` i migracja z `archiwum` ---------- */

const isoS = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

test('SQLite: pomiar w zwykłej tabeli (bez WITHOUT ROWID), klucz w sekundach, treść jako BLOB', async () => {
  const d1 = new SqliteD1();
  const czas = czasPartii(0) + 28_000;
  await zbierz({ SOR_DB: d1 }, czas, { fetchFn: zaslepka().fetchFn });

  const { sql } = d1.db.prepare("SELECT sql FROM sqlite_schema WHERE name = 'pomiary'").get();
  assert.doesNotMatch(sql, /WITHOUT ROWID/i);
  assert.equal(d1.db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE name = 'archiwum'").get().n, 0);
  const wiersze = d1.db.prepare('SELECT uruchomienie, typeof(uruchomienie) AS typ, partia, gz FROM pomiary').all();
  assert.equal(wiersze.length, 1);
  assert.equal(wiersze[0].uruchomienie, kluczPomiaru(czas));
  assert.equal(wiersze[0].typ, 'integer');
  assert.equal(wiersze[0].partia, 0);
  const tresc = JSON.parse(gunzipSync(wiersze[0].gz));
  assert.equal(tresc.uruchomienie, isoS(czas));
  assert.equal(Object.keys(tresc.sor).length, 49);
});

// Bloki pliku migracji: „-- Krok N:” albo „-- Wycofanie:”, potem komentarze i jedno zapytanie.
const MIGRACJA = readFileSync(new URL('../migracje/0001-pomiary.sql', import.meta.url), 'utf8');
const BLOKI = (() => {
  const czesci = MIGRACJA.split(/^-- (Krok \d+|Wycofanie):.*$/m);
  const bloki = {};
  for (let i = 1; i < czesci.length; i += 2) {
    bloki[czesci[i]] = czesci[i + 1].split('\n').filter((l) => !l.startsWith('--')).join('\n').trim();
  }
  return bloki;
})();

// Stan bazy w chwili migracji: stara tabela z pomiarami sprzed wdrożenia (klucze jak na produkcji,
// z sekundami :28) i nowy Worker, który zdążył już zapisać jeden pomiar do `pomiary`.
async function bazaPrzedMigracja() {
  const d1 = new SqliteD1();
  d1.db.exec('CREATE TABLE archiwum (uruchomienie TEXT PRIMARY KEY, partia INTEGER NOT NULL, gz BLOB NOT NULL) WITHOUT ROWID');
  const stare = [
    ['2026-10-17T00:48:28Z', 4],
    ['2026-10-17T00:50:28Z', 0],
  ].map(([klucz, partia]) => ({ klucz, partia, gz: gzipSync(JSON.stringify({ uruchomienie: klucz, partia, sor: {} })) }));
  for (const w of stare) d1.db.prepare('INSERT INTO archiwum (uruchomienie, partia, gz) VALUES (?, ?, ?)').run(w.klucz, w.partia, w.gz);
  const czasNowego = Date.UTC(2026, 10, 1, 12, 0, 28);
  await zbierz({ SOR_DB: d1 }, czasNowego, { fetchFn: zaslepka().fetchFn });
  return { d1, stare, czasNowego };
}

test('migracja: plik ma kroki 0–3 i wycofanie, każdy z jednym zapytaniem', () => {
  assert.deepEqual(Object.keys(BLOKI), ['Krok 0', 'Krok 1', 'Krok 2', 'Krok 3', 'Wycofanie']);
  for (const [nazwa, zapytanie] of Object.entries(BLOKI)) {
    assert.ok(zapytanie.endsWith(';'), `${nazwa}: zapytanie kończy się średnikiem`);
    assert.equal(zapytanie.split(';').length, 2, `${nazwa}: jedno zapytanie`);
  }
});

test('migracja: archiwum → pomiary — klucz w sekundach, BLOB bajt w bajt, kontrola, DROP', async () => {
  const { d1, stare, czasNowego } = await bazaPrzedMigracja();
  const wykonaj = (krok) => d1.db.prepare(BLOKI[krok]).all();

  assert.deepEqual(wykonaj('Krok 0').map((w) => ({ ...w })), [{ nowe: 1, od: isoS(czasNowego) }]);

  wykonaj('Krok 1');
  wykonaj('Krok 1'); // powtórzenie niczego nie psuje
  const pomiary = d1.db.prepare('SELECT uruchomienie, partia, gz FROM pomiary ORDER BY uruchomienie').all();
  assert.deepEqual(
    pomiary.map((w) => w.uruchomienie),
    [1792198108, 1792198228, kluczPomiaru(czasNowego)],
  );
  for (const [i, w] of stare.entries()) {
    assert.equal(pomiary[i].uruchomienie, Date.parse(w.klucz) / 1000);
    assert.equal(pomiary[i].partia, w.partia);
    assert.deepEqual(Buffer.from(pomiary[i].gz), w.gz);
  }

  assert.equal(wykonaj('Krok 2')[0].brakuje, 0);
  wykonaj('Krok 3');
  assert.equal(d1.db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE name = 'archiwum'").get().n, 0);
  assert.equal(d1.db.prepare('SELECT COUNT(*) AS n FROM pomiary').get().n, 3);

  // Worker po migracji pisze dalej bez przeszkód (SCHEMAT nie odtwarza `archiwum`)
  await zbierz({ SOR_DB: d1 }, czasNowego + OKRES_MS, { fetchFn: zaslepka().fetchFn });
  assert.equal(d1.db.prepare('SELECT COUNT(*) AS n FROM pomiary').get().n, 4);
  assert.equal(d1.db.prepare("SELECT COUNT(*) AS n FROM sqlite_schema WHERE name = 'archiwum'").get().n, 0);
});

test('migracja: kontrola wyłapuje klucz nie do odczytania i inną treść; krok 1 nie zmyśla klucza', async () => {
  const { d1 } = await bazaPrzedMigracja();
  const wykonaj = (krok) => d1.db.prepare(BLOKI[krok]).all();
  d1.db.prepare('INSERT INTO archiwum (uruchomienie, partia, gz) VALUES (?, ?, ?)').run('zly-klucz', 1, gzipSync('{}'));

  wykonaj('Krok 1');
  assert.equal(d1.db.prepare('SELECT COUNT(*) AS n FROM pomiary').get().n, 3, 'zły klucz pominięty, bez nowego numeru wiersza');
  assert.equal(wykonaj('Krok 2')[0].brakuje, 1);

  d1.db.exec("DELETE FROM archiwum WHERE uruchomienie = 'zly-klucz'");
  assert.equal(wykonaj('Krok 2')[0].brakuje, 0);
  d1.db.prepare('UPDATE pomiary SET gz = ? WHERE uruchomienie = 1792198108').run(gzipSync('inna treść'));
  assert.equal(wykonaj('Krok 2')[0].brakuje, 1);
});

test('migracja: wycofanie dopisuje do archiwum pomiary nowego Workera z kluczem ISO', async () => {
  const { d1, czasNowego } = await bazaPrzedMigracja();
  const wykonaj = (krok) => d1.db.prepare(BLOKI[krok]).all();
  wykonaj('Krok 1');
  wykonaj('Wycofanie');
  const klucze = d1.db.prepare('SELECT uruchomienie FROM archiwum ORDER BY uruchomienie').all().map((w) => w.uruchomienie);
  assert.deepEqual(klucze, ['2026-10-17T00:48:28Z', '2026-10-17T00:50:28Z', isoS(czasNowego)]);
  const nowy = d1.db.prepare('SELECT gz FROM archiwum WHERE uruchomienie = ?').get(isoS(czasNowego));
  assert.equal(JSON.parse(gunzipSync(nowy.gz)).uruchomienie, isoS(czasNowego));
});
