// Worker `zarobkilekarzy-sor`: kolejki na szpitalnych oddziałach ratunkowych (SOR) z pacjent.gov.pl
// (system TOPSOR) zapisywane do D1 (binding SOR_DB → baza `zarobki-sor`). Osobny od Workera strony
// (worker/), z własną domeną dane.zarobkilekarzy.pl (przypina ją OpenTofu w repo infrastruktury).
//   - `scheduled` (cron): zbiera kolejki i zapisuje migawkę oraz archiwum;
//   - `fetch`: GET /sor/teraz.json podaje ostatnią migawkę — stąd czyta ją strona. Odpowiedź siedzi
//     minutę w cache Workera (Cache API, osobno w każdej lokalizacji Cloudflare) i w przeglądarce,
//     więc bazę czytamy najwyżej raz na minutę na lokalizację. Każde zapytanie to jednak wywołanie
//     Workera, liczone do dziennego limitu konta (plan Free: 100 tys.).
//
// Rytm: cron co 2 minuty (w wrangler.jsonc domyślnie WYŁĄCZONY). Każde uruchomienie pyta o 1/5
// oddziałów — partia = floor(scheduledTime / 120 000) % 5, ≤ 49 zapytań, bo plan Free pozwala
// na 50 zapytań zewnętrznych na wywołanie (zapytania do D1 przez binding liczą się osobno, tu 4).
// Każdy SOR odświeża się więc co 10 minut. Czekanie na sieć nie liczy się do limitu 10 ms CPU —
// liczy się tylko parsowanie i składanie JSON-ów, dlatego bez bibliotek i bez zbędnych kopii.
//
// Źródło: GET https://pacjent.gov.pl/api/v1/datatopsor/{numer}?_format=json&t={unix, s}
//   `t` jest OBOWIĄZKOWE: bez niego serwer oddaje starą kopię z własnego cache (bywa sprzed
//   tygodni, czasem z `data: null`) — tak samo pyta frontend portalu. Pole `t` odpowiedzi to
//   chwila jej wygenerowania (unix, s); rozjazd > 10 min od zapytania → błąd „nieaktualne”.
//
// Zapis do D1 (tabele tworzy Worker sam, SCHEMAT niżej):
//   teraz    — jeden wiersz z migawką wszystkich SOR (JSON); podmieniamy wpisy tej partii;
//   archiwum — wiersz na uruchomienie: czas crona (ISO UTC), partia i surowa partia jako JSON
//              skompresowany gzipem (BLOB, ok. 1,5 KB) — pod przyszłą warstwę „typowe obciążenie”.
//              Limit bazy na planie Free to 500 MB, co przy 720 wierszach na dobę starcza na ok. rok;
//              potem archiwum trzeba wyeksportować albo założyć nową bazę.
//
// Schemat /sor/teraz.json (z niego korzysta strona):
//   { "zrodlo": "pacjent.gov.pl (TOPSOR)", "aktualizacja": ISO UTC ostatniego zapisu,
//     "etapy": [7 nazw w stałej kolejności — ETAPY niżej],
//     "sor": { "<numer>": wpis } }
//   wpis poprawny: { t, ts, w, e, inne? }
//     t    — ISO UTC zapytania; ts — ISO UTC wygenerowania odpowiedzi (pole `t` źródła);
//     w    — `expecting`: wszyscy pacjenci obecni na SOR;
//     e    — 7 par [count, "wait"] w kolejności `etapy`; brakujący etap → [null, null];
//            `wait` to tekst źródła („9 min”, „powyżej 2 godzin”, „-” = nikt nie czeka);
//     inne — etapy spoza listy 7 (np. „Rejestracja Ginekologia”, „Triaż ZRM”), surowo:
//            [[name, count, wait], …]; pole tylko, gdy takie etapy są.
//   wpis błędu: { t, blad, ts?, poprzedni? }
//     blad      — "HTTP 503" (status), "limit czasu", "połączenie", "format", "brak danych"
//                 (`data: null` albo pusta lista), "nieaktualne" (rozjazd `t` > 10 min);
//     poprzedni — ostatni poprawny pomiar (cały wpis), jeśli nie starszy niż 24 h; starszy
//                 wypada, żeby strona nie pokazywała w nieskończoność danych sprzed doby.
//   Numery, których nie ma już na liście SOR, wypadają z migawki przy najbliższym zapisie.
import lista from '../../../src/data/sor/lista.json' with { type: 'json' };

export const ZRODLO = 'pacjent.gov.pl (TOPSOR)';
export const ETAPY = [
  'Rejestracja',
  'Triaż',
  'Priorytet najwyższy',
  'Priorytet wysoki',
  'Priorytet średni',
  'Priorytet niski',
  'Priorytet najniższy',
];
const INDEKS_ETAPU = new Map(ETAPY.map((nazwa, i) => [nazwa, i]));

const API = 'https://pacjent.gov.pl/api/v1/datatopsor/';
// Jawny podpis klienta: administrator źródła widzi, kto pyta i gdzie szukać kontaktu.
export const USER_AGENT = 'zarobkilekarzy.pl SOR (+https://zarobkilekarzy.pl/o-projekcie/)';
const NUMER_RE = /^\d{12}-\d{3}$/;

export const OKRES_MS = 120_000; // odstęp crona (*/2 * * * *) — od niego zależy numer partii
export const PARTIE = 5;
const MAKS_ZAPYTAN = 49; // limit Free: 50 zapytań zewnętrznych na wywołanie
const NARAZ = 6; // Workers i tak trzymają najwyżej 6 otwartych połączeń naraz
const LIMIT_CZASU_MS = 8_000;
const MAKS_ROZJAZD_MS = 10 * 60_000;
const POPRZEDNI_MAKS_MS = 24 * 3_600_000;

export const SCIEZKA_TERAZ = '/sor/teraz.json';
const SCHEMAT = [
  'CREATE TABLE IF NOT EXISTS teraz (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL, aktualizacja TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS archiwum (uruchomienie TEXT PRIMARY KEY, partia INTEGER NOT NULL, gz BLOB NOT NULL) WITHOUT ROWID',
];
const SQL_ODCZYT = 'SELECT json FROM teraz WHERE id = 1';
const SQL_TERAZ =
  'INSERT INTO teraz (id, json, aktualizacja) VALUES (1, ?1, ?2) ON CONFLICT (id) DO UPDATE SET json = excluded.json, aktualizacja = excluded.aktualizacja';
const SQL_ARCHIWUM = 'INSERT OR REPLACE INTO archiwum (uruchomienie, partia, gz) VALUES (?1, ?2, ?3)';
// Dane są publiczne (jawne z mocy ustawy o PRM, art. 33a ust. 6) — może je czytać każda strona.
const NAGLOWKI_TERAZ = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60',
  'Access-Control-Allow-Origin': '*',
  'X-Robots-Tag': 'noindex',
};
const CACHE_TERAZ_S = 60;

// ISO UTC z dokładnością do sekundy (bez milisekund — krótszy plik, a dokładniej i tak nie mierzymy).
const iso = (ms) => new Date(ms).toISOString().slice(0, 19) + 'Z';

// Liczba ze źródła: liczba albo tekst z liczbą; wszystko inne → null.
const liczba = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

// Posortowane, unikalne numery z listy SOR (5 par oddziałów dzieli jeden numer = jedną kolejkę).
export function numeryZListy(dane) {
  const zbior = new Set();
  for (const s of dane.sor) {
    if (typeof s.numer === 'string' && NUMER_RE.test(s.numer)) zbior.add(s.numer);
    else console.warn(`SOR: pomijam numer w złym formacie: ${JSON.stringify(s.numer)}`);
  }
  return [...zbior].sort();
}

const NUMERY = numeryZListy(lista);

// Partia tego uruchomienia: kolejne uruchomienia co OKRES_MS przechodzą przez partie 0…4.
export function numeryPartii(numery, scheduledTime) {
  const partia = Math.floor(scheduledTime / OKRES_MS) % PARTIE;
  const rozmiar = Math.ceil(numery.length / PARTIE);
  let wybrane = numery.slice(partia * rozmiar, (partia + 1) * rozmiar);
  if (wybrane.length > MAKS_ZAPYTAN) {
    // Lista urosła ponad 5 × 49: reszta partii nie zostanie odpytana, dopóki nie zwiększymy liczby partii.
    console.error(`SOR: partia ${partia} ma ${wybrane.length} numerów, pytam o ${MAKS_ZAPYTAN}`);
    wybrane = wybrane.slice(0, MAKS_ZAPYTAN);
  }
  return { partia, numery: wybrane };
}

// Odpowiedź źródła (już sparsowany JSON) → wpis migawki.
export function przetworz(json, t, tMs) {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return { t, blad: 'format' };
  const tsS = json.t == null ? NaN : Number(json.t);
  if (!Number.isFinite(tsS)) return { t, blad: 'format' };
  const ts = iso(tsS * 1000);
  if (Math.abs(tsS * 1000 - tMs) > MAKS_ROZJAZD_MS) return { t, ts, blad: 'nieaktualne' };
  const dane = json.data;
  if (dane == null || (Array.isArray(dane) && dane.length === 0)) return { t, ts, blad: 'brak danych' };
  if (!Array.isArray(dane)) return { t, ts, blad: 'format' };

  const e = new Array(ETAPY.length);
  let inne;
  for (const p of dane) {
    if (p === null || typeof p !== 'object' || typeof p.name !== 'string') return { t, ts, blad: 'format' };
    const para = [liczba(p.count), typeof p.wait === 'string' ? p.wait : null];
    const i = INDEKS_ETAPU.get(p.name.trim());
    // Etap spoza listy (albo powtórzony) nie psuje odpowiedzi — trafia surowo do `inne`.
    if (i === undefined || e[i]) (inne ??= []).push([p.name, para[0], para[1]]);
    else e[i] = para;
  }
  for (let i = 0; i < e.length; i++) if (!e[i]) e[i] = [null, null];

  const wpis = { t, ts, w: liczba(json.expecting), e };
  if (inne) wpis.inne = inne;
  return wpis;
}

// Jedno zapytanie o jeden SOR. Nigdy nie rzuca — błąd sieci, czasu czy formatu to wpis z `blad`.
async function zapytaj(numer, fetchFn) {
  const tMs = Date.now();
  const t = iso(tMs);
  let odp;
  try {
    odp = await fetchFn(`${API}${numer}?_format=json&t=${Math.floor(tMs / 1000)}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(LIMIT_CZASU_MS),
      // `t` i tak czyni każdy adres unikalnym; bez zapisu do cache brzegu nie zaśmiecamy go.
      cache: 'no-store',
    });
  } catch (err) {
    return { t, blad: przekroczonyCzas(err) ? 'limit czasu' : 'połączenie' };
  }
  if (!odp.ok) {
    try {
      await odp.body?.cancel(); // zwalnia połączenie bez czytania treści strony błędu
    } catch {}
    return { t, blad: `HTTP ${odp.status}` };
  }
  let json;
  try {
    json = await odp.json();
  } catch (err) {
    return { t, blad: przekroczonyCzas(err) ? 'limit czasu' : 'format' };
  }
  return przetworz(json, t, tMs);
}

const przekroczonyCzas = (err) => err?.name === 'TimeoutError' || err?.name === 'AbortError';

// Najwyżej `naraz` zadań jednocześnie; wyniki w kolejności wejścia.
async function pula(elementy, naraz, zadanie) {
  const wyniki = new Array(elementy.length);
  let nastepny = 0;
  const robotnik = async () => {
    while (nastepny < elementy.length) {
      const k = nastepny++;
      wyniki[k] = await zadanie(elementy[k]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(naraz, elementy.length) }, robotnik));
  return wyniki;
}

const zgodneEtapy = (etapy) =>
  Array.isArray(etapy) && etapy.length === ETAPY.length && etapy.every((n, i) => n === ETAPY[i]);

// Nowa migawka = poprzednia (jeśli czytelna i z tymi samymi etapami) + wpisy tej partii.
// Obiekt poprzedniej migawki jest modyfikowany w miejscu — bez kopii 245 wpisów.
export function scal(stara, wpisy, numery, terazMs) {
  const sor =
    stara && typeof stara.sor === 'object' && stara.sor !== null && !Array.isArray(stara.sor) && zgodneEtapy(stara.etapy)
      ? stara.sor
      : {};
  for (const [numer, wpis] of wpisy) {
    if (!wpis.blad) {
      sor[numer] = wpis;
      continue;
    }
    const byl = sor[numer];
    const poprzedni = byl ? (byl.blad ? byl.poprzedni : byl) : undefined;
    const swiezy = poprzedni && terazMs - Date.parse(poprzedni.t) <= POPRZEDNI_MAKS_MS;
    sor[numer] = swiezy ? { ...wpis, poprzedni } : wpis;
  }
  const dozwolone = new Set(numery);
  for (const numer of Object.keys(sor)) if (!dozwolone.has(numer)) delete sor[numer];
  return { zrodlo: ZRODLO, aktualizacja: iso(terazMs), etapy: ETAPY, sor };
}

// Klucz wiersza archiwum: czas crona (ISO UTC).
export const kluczArchiwum = (scheduledTime) => iso(scheduledTime);

// Tekst → gzip (BLOB do D1). CompressionStream jest w Workers i w Node.
export async function gzip(tekst) {
  const strumien = new Blob([tekst]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(strumien).arrayBuffer());
}

// Całe uruchomienie: zapytania tej partii → scalenie z migawką → zapis migawki i archiwum do D1.
// Domyślny fetch w opakowaniu: wywołany „luzem” z innym `this` w Workers rzuca „Illegal invocation”.
export async function zbierz(env, scheduledTime, { fetchFn = (url, init) => fetch(url, init), numery = NUMERY } = {}) {
  const db = env.SOR_DB;
  if (!db) throw new Error('SOR: brak bindingu D1 `SOR_DB` (workers/sor/wrangler.jsonc → d1_databases)');
  const { partia, numery: doZapytania } = numeryPartii(numery, scheduledTime);
  const wyniki = await pula(doZapytania, NARAZ, (numer) => zapytaj(numer, fetchFn));
  const wpisy = doZapytania.map((numer, i) => [numer, wyniki[i]]);

  // Migawkę czytamy PO zapytaniach: najkrótsze okno między odczytem a zapisem. Uruchomienia
  // się nie nakładają (najdłużej ~9 rund × 8 s ≈ 72 s przy odstępie 120 s).
  await db.batch(SCHEMAT.map((sql) => db.prepare(sql)));
  let stara = null;
  const zapisana = await db.prepare(SQL_ODCZYT).first('json');
  if (zapisana) {
    try {
      stara = JSON.parse(zapisana);
    } catch {
      console.error('SOR: migawka w D1 nieczytelna — zaczynam od pustej');
    }
  }
  const teraz = Date.now();
  const migawka = scal(stara, wpisy, numery, teraz);
  const archiwum = { zrodlo: ZRODLO, etapy: ETAPY, uruchomienie: iso(scheduledTime), partia, sor: Object.fromEntries(wpisy) };
  await db.batch([
    db.prepare(SQL_TERAZ).bind(JSON.stringify(migawka), migawka.aktualizacja),
    db.prepare(SQL_ARCHIWUM).bind(kluczArchiwum(scheduledTime), partia, await gzip(JSON.stringify(archiwum))),
  ]);

  const bledy = {};
  for (const [, wpis] of wpisy) if (wpis.blad) bledy[wpis.blad] = (bledy[wpis.blad] ?? 0) + 1;
  const podsumowanie = { partia, zapytania: wpisy.length, poprawne: wpisy.length - Object.values(bledy).reduce((a, b) => a + b, 0), bledy };
  console.log(`SOR: ${JSON.stringify(podsumowanie)}`);
  return podsumowanie;
}

// GET /sor/teraz.json: ostatnia migawka z D1, minutę w cache Workera. Inne adresy → 404.
export async function odczytaj(request, env, ctx, cache = caches.default) {
  const url = new URL(request.url);
  if (url.pathname !== SCIEZKA_TERAZ) return new Response('Nie ma takiego zasobu.\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  // klucz cache bez parametrów zapytania — dopisany `?x=` nie omija cache ani nie męczy bazy
  const klucz = new Request(url.origin + SCIEZKA_TERAZ);
  let odp = await cache.match(klucz);
  if (!odp) {
    let json = null;
    try {
      json = await env.SOR_DB.prepare(SQL_ODCZYT).first('json');
    } catch (err) {
      console.error(`SOR: odczyt migawki: ${err?.message ?? err}`);
    }
    if (!json) {
      return new Response('{"blad":"brak danych"}', {
        status: 503,
        headers: { ...NAGLOWKI_TERAZ, 'Cache-Control': 'no-store', 'Retry-After': String(CACHE_TERAZ_S) },
      });
    }
    odp = new Response(json, { headers: NAGLOWKI_TERAZ });
    ctx.waitUntil(cache.put(klucz, odp.clone()));
  }
  return request.method === 'HEAD' ? new Response(null, { status: odp.status, headers: odp.headers }) : odp;
}

export default {
  fetch: (request, env, ctx) => odczytaj(request, env, ctx),

  async scheduled(controller, env) {
    // Bez ponowień po błędzie: następne uruchomienie i tak za 2 minuty, a ponowienie to kolejne
    // ~49 zapytań do pacjent.gov.pl.
    controller.noRetry?.();
    await zbierz(env, controller.scheduledTime);
  },
};
