// Archiwum list oczekujących do programów lekowych. NFZ publikuje raz w miesiącu 16 plików XLSX i nie
// udostępnia poprzednich miesięcy, więc każdy niezapisany miesiąc przepada. Opis: README → „Archiwum list
// oczekujących”.
//
//   node tools/programy-lekowe/archiwum.mjs --raw <katalog surowy> [--dane <katalog>] [--raport <plik>]
//   --sucho            pobiera i sprawdza, nic nie zapisuje (test dostępu i formatu);
//   --zrodlo <katalog> czyta woj-01.xlsx … woj-16.xlsx z dysku zamiast z NFZ (import, praca bez sieci);
//   --wersja <data>    nazwa wersji, domyślnie dzisiejsza data UTC;
//   --przelicz         przelicza wszystkie miesiące z surowych plików po zmianie metody.
//
// Kolejność jest celowa: surowe pliki zapisujemy PRZED parsowaniem. Błąd parsera albo zmiana formatu nie
// mogą kosztować miesiąca, którego NFZ później nie odda. Odrzucamy tylko to, co nie jest plikiem XLSX.
//
// Kod wyjścia to 0 także przy błędzie danych: workflow ma jeszcze zapisać surowe pliki i zgłosić problem,
// a przebieg kończy się na czerwono w ostatnim kroku, według pola `status` w raporcie.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BladDanych, KODY_WOJ, URL_STRONY, czytajOkres, czytajPlik, urlPliku } from './format.mjs';
import { toXlsx } from './xlsx.mjs';
import { doPliku, nazwaProgramu, sha256, zlozIndeks, zlozOkres } from './przetworz.mjs';

const TUTAJ = dirname(fileURLToPath(import.meta.url));
export const KATALOG_DANYCH = join(TUTAJ, '..', '..', 'src', 'data', 'programy-lekowe');
const API_STAT = 'https://api.nfz.gov.pl/app-stat-api-pl';
const USER_AGENT = 'zarobkilekarzy.pl (archiwum danych publicznych NFZ)';
const PRZERWA_MS = 2000;
const MAKS_DNI_BEZ_NOWEGO_OKRESU = 45;

const uspij = (ms) => new Promise((r) => setTimeout(r, ms));

async function pobierzPlik(woj, { fetchFn = fetch, przerwa = PRZERWA_MS } = {}) {
  let blad = 'nieznany';
  for (let proba = 0; proba < 4; proba++) {
    if (proba) await uspij(przerwa * 5 * proba);
    try {
      const r = await fetchFn(urlPliku(woj), { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(120_000) });
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.ok && toXlsx(buf)) return { woj, buf };
      blad = r.ok ? `odpowiedź nie jest plikiem XLSX (${r.headers.get('content-type') ?? 'bez typu'}, ${buf.length} B)` : `HTTP ${r.status}`;
    } catch (e) {
      blad = e.name === 'TimeoutError' ? 'limit czasu' : `połączenie (${e.message})`;
    }
  }
  return { woj, blad };
}

/** Pobiera po kolei, z przerwami. Serwer NFZ stoi za filtrem antybotowym, więc bez równoległych zapytań. */
export async function pobierzWszystkie({ fetchFn, przerwa = PRZERWA_MS } = {}) {
  const out = [];
  for (const woj of KODY_WOJ) {
    if (out.length) await uspij(przerwa);
    out.push(await pobierzPlik(woj, { fetchFn, przerwa }));
  }
  return out;
}

function zDysku(katalog) {
  return KODY_WOJ.map((woj) => {
    const p = join(katalog, `woj-${woj}.xlsx`);
    if (!existsSync(p)) return { woj, blad: 'brak pliku' };
    const buf = readFileSync(p);
    return toXlsx(buf) ? { woj, buf } : { woj, blad: 'to nie jest plik XLSX' };
  });
}

const czytajManifest = (raw) => (existsSync(join(raw, 'manifest.json')) ? JSON.parse(readFileSync(join(raw, 'manifest.json'), 'utf8')) : { zrodlo: URL_STRONY, wersje: [] });

const ostatniaKompletna = (manifest) => manifest.wersje.filter((w) => w.kompletna).at(-1) ?? null;

function wolnaWersja(manifest, wersja) {
  const zajete = new Set(manifest.wersje.map((w) => w.wersja));
  if (!zajete.has(wersja)) return wersja;
  for (let n = 2; ; n++) if (!zajete.has(`${wersja}-${n}`)) return `${wersja}-${n}`;
}

/** Dopisuje wersję i zapisuje zmienione pliki. Bez nowej zawartości nic nie zmienia i zwraca null. */
export function zapiszSurowe(raw, manifest, pobrane, { wersja, teraz }) {
  const dobre = pobrane.filter((p) => p.buf);
  const ost = ostatniaKompletna(manifest);
  const nowe = dobre.filter((p) => ost?.pliki[p.woj]?.sha256 !== p.sha256);
  const juzByly = new Set(manifest.wersje.flatMap((w) => Object.values(w.pliki).map((p) => p.sha256)));
  if (!nowe.some((p) => !juzByly.has(p.sha256)) && dobre.length < KODY_WOJ.length) return null;
  if (!nowe.length) return null;

  const nazwa = wolnaWersja(manifest, wersja);
  const okresy = new Set(dobre.map((p) => p.okres));
  const okres = okresy.size === 1 && !okresy.has(null) ? [...okresy][0] : null;
  const pliki = {};
  for (const p of dobre) {
    const zapisany = manifest.wersje.flatMap((w) => Object.values(w.pliki)).find((x) => x.sha256 === p.sha256);
    if (zapisany) {
      pliki[p.woj] = zapisany;
      continue;
    }
    const sciezka = `${p.okres ?? 'nieodczytane'}/${nazwa}/woj-${p.woj}.xlsx`;
    mkdirSync(dirname(join(raw, sciezka)), { recursive: true });
    writeFileSync(join(raw, sciezka), p.buf);
    pliki[p.woj] = { sciezka, sha256: p.sha256, bajty: p.buf.length };
  }
  const wpis = { wersja: nazwa, okres, pobrano: teraz.toISOString(), kompletna: okres !== null && dobre.length === KODY_WOJ.length, pliki };
  manifest.wersje.push(wpis);
  writeFileSync(join(raw, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  return wpis;
}

function czytajMiesiace(katalog) {
  if (!existsSync(katalog)) return [];
  return readdirSync(katalog)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(katalog, f), 'utf8')));
}

/** Liczba leczonych z ostatniego roku przed okresem, żeby przeliczenie starych miesięcy dawało ten sam wynik. */
function czytajLeczonych(katalog, okres) {
  if (!existsSync(katalog)) return null;
  const rok = Number(okres.slice(0, 4));
  const pliki = readdirSync(katalog)
    .map((f) => f.match(/^leczeni-(\d{4})\.json$/))
    .filter((m) => m && Number(m[1]) < rok)
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  return pliki.length ? JSON.parse(readFileSync(join(katalog, pliki.at(-1)[0]), 'utf8')) : null;
}

/**
 * Mianownik flagi „skala”: leczeni w programie w ostatnim pełnym roku ze statystyki NFZ. Rocznik pojawia się
 * z dużym opóźnieniem, więc pytamy tylko o zakres dat, a pełne dane pobieramy, gdy jest nowszy rok.
 */
export async function odswiezLeczonych(katalog, { fetchFn = fetch, przerwa = 1200 } = {}) {
  const pobierz = async (sciezka) => {
    for (let i = 0; i < 6; i++) {
      await uspij(przerwa);
      const r = await fetchFn(`${API_STAT}/${sciezka}`, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(60_000) });
      if (r.status === 429 || r.status >= 500) {
        await uspij(przerwa * 5 * (i + 1));
        continue;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }
    throw new Error('limit zapytań');
  };
  const { 'end-date': koniec } = await pobierz('available-periods?format=json');
  const rok = Number(String(koniec).slice(0, 4));
  if (!(String(koniec).slice(5, 10) === '12-31')) return false;
  const p = join(katalog, `leczeni-${rok}.json`);
  if (existsSync(p)) return false;

  const programy = {};
  for (let strona = 1; ; strona++) {
    const q = new URLSearchParams({ dateFrom: `${rok}-01-01`, dateTo: `${rok}-12-31`, limit: '25', page: String(strona), format: 'json', 'api-version': '1.0' });
    const j = await pobierz(`drug-costs-by-drug-program?${q}`);
    for (const x of j.data.data ?? j.data) {
      const n = nazwaProgramu(x['drug-program-name']);
      programy[n] = (programy[n] ?? 0) + (x['number-of-patients'] ?? 0);
    }
    if (!j.links?.next) break;
  }
  mkdirSync(katalog, { recursive: true });
  const posortowane = Object.fromEntries(Object.entries(programy).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(p, `${JSON.stringify({ rok, zrodlo: `${API_STAT}/`, programy: posortowane }, null, 1)}\n`);
  return true;
}

function zapiszMiesiac(katalog, dane) {
  mkdirSync(katalog, { recursive: true });
  writeFileSync(join(katalog, `${dane.okres}.json`), doPliku(dane));
  writeFileSync(join(katalog, 'indeks.json'), `${JSON.stringify(zlozIndeks(czytajMiesiace(katalog)), null, 1)}\n`);
}

const sumyDoRaportu = ({ okres, wersja, sumy, flagi }) => ({ okres, wersja, sumy, flag: flagi.length });

/** Jeden przebieg. Zwraca raport: `status` to „bez-zmian”, „nowe-dane” albo „blad”. */
export async function przebieg({ raw, dane = KATALOG_DANYCH, sucho = false, pobrane, wersja, teraz = new Date(), odswiez }) {
  const raport = { status: 'bez-zmian', sucho, bledy: [], ostrzezenia: [], zapisanoSurowe: false, zapisanoDane: false };
  const manifest = sucho && !raw ? { wersje: [] } : czytajManifest(raw);
  const ost = ostatniaKompletna(manifest);
  const nazwaWersji = wersja ?? teraz.toISOString().slice(0, 10);

  for (const p of pobrane) {
    if (p.blad) {
      raport.bledy.push(`woj. ${p.woj}: ${p.blad}`);
      continue;
    }
    p.sha256 = sha256(p.buf);
    p.okres = czytajOkres(p.buf);
  }
  const komplet = !raport.bledy.length;
  const bezZmian = komplet && ost && pobrane.every((p) => ost.pliki[p.woj]?.sha256 === p.sha256);

  if (bezZmian) {
    raport.okres = ost.okres;
    const pierwsza = manifest.wersje.find((w) => w.okres === ost.okres && w.kompletna);
    const dni = (teraz - new Date(pierwsza.pobrano)) / 86_400_000;
    if (dni > MAKS_DNI_BEZ_NOWEGO_OKRESU) raport.ostrzezenia.push({ typ: 'brak-nowego-okresu', opis: `Od ${Math.floor(dni)} dni NFZ nie opublikował nowszego okresu niż ${ost.okres}.` });
    return raport;
  }

  if (!sucho) {
    const wpis = zapiszSurowe(raw, manifest, pobrane, { wersja: nazwaWersji, teraz });
    if (wpis) {
      raport.zapisanoSurowe = true;
      raport.wersja = wpis.wersja;
      raport.okres = wpis.okres;
    }
  }
  if (!komplet) {
    raport.status = 'blad';
    return raport;
  }

  try {
    const wersjaDanych = raport.wersja ?? nazwaWersji;
    const pliki = pobrane.map((p) => ({ woj: p.woj, sha256: p.sha256, ...czytajPlik(p.buf, p.woj) }));
    const okres = pliki[0].okres;
    if (!sucho && odswiez) {
      try {
        await odswiez(dane);
      } catch (e) {
        raport.ostrzezenia.push({ typ: 'leczeni', opis: `Nie udało się odświeżyć liczby leczonych: ${e.message}.` });
      }
    }
    const miesiace = czytajMiesiace(dane);
    const tenSam = miesiace.find((m) => m.okres === okres);
    const poprzedni = tenSam ?? miesiace.filter((m) => m.okres < okres).at(-1);
    const { dane: miesiac, ostrzezenia } = zlozOkres(pliki, { wersja: wersjaDanych, leczeni: czytajLeczonych(dane, okres), poprzedni });
    raport.status = 'nowe-dane';
    raport.okres = okres;
    raport.podsumowanie = sumyDoRaportu(miesiac);
    raport.ostrzezenia.push(...ostrzezenia);
    if (!sucho) {
      zapiszMiesiac(dane, miesiac);
      raport.zapisanoDane = true;
    }
  } catch (e) {
    if (!(e instanceof BladDanych)) throw e;
    raport.status = 'blad';
    raport.bledy.push(e.message);
  }
  return raport;
}

/** Przelicza wszystkie miesiące z ostatnich kompletnych wersji w archiwum. */
export function przelicz({ raw, dane = KATALOG_DANYCH }) {
  const manifest = czytajManifest(raw);
  const wersje = new Map(manifest.wersje.filter((w) => w.kompletna).map((w) => [w.okres, w]));
  let poprzedni;
  const wyniki = [];
  for (const okres of [...wersje.keys()].sort()) {
    const w = wersje.get(okres);
    const pliki = KODY_WOJ.map((woj) => ({ woj, sha256: w.pliki[woj].sha256, ...czytajPlik(readFileSync(join(raw, w.pliki[woj].sciezka)), woj) }));
    const { dane: miesiac } = zlozOkres(pliki, { wersja: w.wersja, leczeni: czytajLeczonych(dane, okres), poprzedni });
    zapiszMiesiac(dane, miesiac);
    wyniki.push(sumyDoRaportu(miesiac));
    poprzedni = miesiac;
  }
  return wyniki;
}

function podsumowanieMd(r) {
  const linie = [`### Archiwum list oczekujących NFZ: ${r.status}${r.sucho ? ' (suchy przebieg)' : ''}`, '', `- Okres: ${r.okres ?? 'nieznany'}`, `- Zapisano surowe: ${r.zapisanoSurowe ? 'tak' : 'nie'}, zapisano dane: ${r.zapisanoDane ? 'tak' : 'nie'}`];
  if (r.podsumowanie) {
    const s = r.podsumowanie.sumy;
    linie.push(`- Czeka: ${s.czeka} (pilni ${s.pilni}), przyjęci: ${s.przyjeci}, średnio ${s.sredniaDni} dni`, `- Bez podmiotów z flagą: czeka ${s.czekaBezFlag}, średnio ${s.sredniaDniBezFlag} dni`, `- Programów: ${s.programow}, podmiotów: ${s.podmiotow}, flag: ${r.podsumowanie.flag}`);
  }
  for (const b of r.bledy) linie.push(`- **Błąd:** ${b}`);
  for (const o of r.ostrzezenia) linie.push(`- Ostrzeżenie: ${o.opis}`);
  return `${linie.join('\n')}\n`;
}

function argumenty(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i].replace(/^--/, '');
    if (a === 'sucho' || a === 'przelicz') o[a] = true;
    else o[a] = argv[++i];
  }
  return o;
}

async function main() {
  const o = argumenty(process.argv.slice(2));
  const dane = o.dane ?? KATALOG_DANYCH;
  if (o.przelicz) {
    console.log(JSON.stringify(przelicz({ raw: o.raw, dane }), null, 1));
    return;
  }
  if (!o.raw && !o.sucho) throw new Error('Podaj --raw <katalog> albo --sucho');
  const raport = { status: 'blad', sucho: Boolean(o.sucho), bledy: [], ostrzezenia: [] };
  try {
    const pobrane = o.zrodlo ? zDysku(o.zrodlo) : await pobierzWszystkie();
    Object.assign(raport, await przebieg({ raw: o.raw, dane, sucho: Boolean(o.sucho), pobrane, wersja: o.wersja, odswiez: o.zrodlo ? undefined : odswiezLeczonych }));
  } catch (e) {
    raport.bledy.push(`nieoczekiwany błąd: ${e.message}`);
    console.error(e);
  }
  writeFileSync(o.raport ?? 'raport.json', `${JSON.stringify(raport, null, 1)}\n`);
  const md = podsumowanieMd(raport);
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, md, { flag: 'a' });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
