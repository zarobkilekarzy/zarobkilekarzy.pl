/**
 * Historia kolejek na SOR liczona przy buildzie: tabela wszystkich SOR, fakty pod mapą i profil
 * „zwykle o tej porze” w dymkach mapy (lib/sor/map). Surowe pomiary zapisuje co 2 minuty Worker
 * workers/sor do D1 `zarobki-sor` (tabela `pomiary`: czas crona w sekundach unix, partia jako JSON + gzip).
 * Wejścia na stronę nie odpytują ani D1, ani Workera — liczby są w plikach statycznych.
 *
 * D1 czyta jeden build na dobę (jak statystyki /egzamin/, lib/egzamin/site-stats.ts):
 *   - SOR_HISTORIA=d1 — `wrangler d1 execute --remote` (w CI z CLOUDFLARE_API_TOKEN i CLOUDFLARE_ACCOUNT_ID).
 *     Ustawia go deploy.yml dla nocnego i ręcznego przebiegu. Okno 28 dni = ok. 21 tys. wierszy na noc;
 *   - bez zmiennej — migawka z produkcji, /prawa-pacjenta/sor/dane.json (plik statyczny). Gdy produkcja jej
 *     nie ma, build w CI raz czyta D1; lokalny build pomija wtedy historię;
 *   - SOR_HISTORIA=<katalog> — pliki z `wrangler d1 execute --json` (kolumny `uruchomienie` i `h` = hex(gz)),
 *     do pracy bez sieci; klucz może być w sekundach unix (`pomiary`) albo ISO (dawne `archiwum`);
 *   - SOR_HISTORIA=0 — bez historii.
 * Każdy build publikuje wynik z powrotem (pages/prawa-pacjenta/sor/dane.json.ts), więc migawka przechodzi
 * z deployu na deploy aż do następnego odczytu D1. Bez danych zwracamy null — sekcje znikają.
 *
 * Liczby (definicje dla czytelnika: legenda tabeli, components/sor/grid.ts):
 *   - odczyt = kategoria żółta, zielona albo niebieska, w której w danym pomiarze ktoś czeka i portal podał
 *     czas; „ponad normą” = czas powyżej normy (lib/sor/measure), „powyżej 2 godzin” liczone jako 121 minut
 *     jak na mapie, więc to dolna granica. Czerwona i pomarańczowa mają w API zawsze tekst normy — poza liczbami;
 *   - „powyżej…” = portal nie podaje liczby: od 120 min w żółtej, 240 w zielonej, 360 w niebieskiej (reguła
 *     portalu, ta sama dla wszystkich SOR — sprawdzone na pomiarach z 17–28.10.2026);
 *   - czeka = osoby przed kontaktem z lekarzem (suma etapów), jak w dymku mapy;
 *   - braki = pomiary bez danych ze źródła („brak danych”, „nieaktualne”, zły format); błędy połączenia
 *     po naszej stronie (limit czasu, HTTP) się nie liczą.
 * Dni i godziny — czasu polskiego, według chwili uruchomienia crona.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { lowerMinutes, STAGES, type Entry } from './measure';
import { sorByKey, sorCity, sorTitle } from './places';

export { usualCalm } from './usual';

/** Okno tabeli i faktów: pełne dni przed dniem ostatniego pomiaru. */
export const WINDOW_DAYS = 28;
export const WEEK_DAYS = 7;
/** „Zwykle o tej porze” dopiero z tylu dni pomiarów… */
export const USUAL_MIN_DAYS = 7;
/** …i z tylu poprawnych pomiarów w danej godzinie (co 10 minut = 6 na godzinę na dobę). */
const USUAL_MIN_SAMPLES = 24;
/** Przerwa w źródle: kolejne uruchomienia z mniej niż 10% poprawnych odpowiedzi, razem co najmniej godzina. */
const OUTAGE_SHARE = 0.1;
const OUTAGE_MIN_MS = 3_600_000;
const SOURCE_ERRORS = new Set(['brak danych', 'nieaktualne', 'format']);
/** indeksy etapów żółtego, zielonego i niebieskiego w STAGES */
const COLORS = [4, 5, 6] as const;

/** Liczby jednego SOR w oknie; null = nie było z czego liczyć. Procenty z jednym miejscem po przecinku. */
export interface SorStats {
  /** % odczytów ponad normą (trzy kategorie razem) */
  over: number | null;
  /** to samo w kategoriach żółtej, zielonej, niebieskiej */
  byColor: (number | null)[];
  /** osoby przed kontaktem z lekarzem: średnio i najwięcej */
  waitingAvg: number | null;
  waitingMax: number | null;
  /** % odczytów „powyżej 2 (4, 6) godzin” */
  overCap: number | null;
  /** % pomiarów bez danych ze źródła */
  missing: number | null;
  /** zapytania o ten SOR w oknie */
  requests: number;
}

export interface SorHistoryRow {
  /** numer TOPSOR */
  key: string;
  title: string;
  city: string;
  region: string;
  /** miasto drugiego SOR z tym samym numerem (jedna kolejka) */
  twin?: string;
  window: SorStats;
  week: SorStats;
  /** średnio osób przed lekarzem w godzinach 0–23 (okno); puste = za mało dni, null = za mało pomiarów w godzinie */
  usual: (number | null)[];
}

export interface SorHistory {
  version: 1;
  /** ostatni pomiar, ISO UTC */
  asOf: string;
  /** pełne dni czasu polskiego, RRRR-MM-DD */
  window: { from: string; to: string; days: number };
  week: { from: string; to: string };
  rows: SorHistoryRow[];
  facts: {
    /** % ponad normą w całej Polsce: okno i ostatnie 7 dni */
    over: { window: number | null; week: number | null };
    /** % odczytów „powyżej…” w żółtej, zielonej, niebieskiej (okno) */
    overCap: (number | null)[];
    /** % ponad normą według województw, malejąco (okno) */
    regions: { region: string; over: number }[];
    /** najdłuższa przerwa bez poprawnych odpowiedzi portalu w oknie (≥ 1 h) */
    outage: { from: string; to: string; requests: number } | null;
    /** cała Polska: średnio osób przed lekarzem na jeden SOR w godzinach 0–23 (puste = za mało dni) */
    usual: (number | null)[];
  };
}

/* ---------- liczenie ---------- */

interface Acc {
  requests: number;
  missing: number;
  /** żółta, zielona, niebieska: [odczyty, ponad normą, „powyżej…”] */
  byColor: [number, number, number][];
  waitSum: number;
  waitN: number;
  waitMax: number;
  /** godziny 0–23: [suma czekających, pomiary] */
  hours: [number, number][];
}

const acc = (): Acc => ({
  requests: 0, missing: 0, byColor: COLORS.map(() => [0, 0, 0]),
  waitSum: 0, waitN: 0, waitMax: 0, hours: Array.from({ length: 24 }, () => [0, 0]),
});

function add(to: Acc, a: Acc) {
  for (const k of ['requests', 'missing', 'waitSum', 'waitN'] as const) to[k] += a[k];
  to.waitMax = Math.max(to.waitMax, a.waitMax);
  a.byColor.forEach((c, i) => c.forEach((v, j) => (to.byColor[i][j] += v)));
  a.hours.forEach(([s, n], h) => { to.hours[h][0] += s; to.hours[h][1] += n; });
  return to;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (part: number, all: number) => (all ? r1((100 * part) / all) : null);
/** suma kolumny `j` liczników kolorów */
const colors = (a: Acc, j: number) => a.byColor.reduce((s, c) => s + c[j], 0);

const stats = (a: Acc): SorStats => ({
  over: pct(colors(a, 1), colors(a, 0)),
  byColor: a.byColor.map(([n, o]) => pct(o, n)),
  waitingAvg: a.waitN ? r1(a.waitSum / a.waitN) : null,
  waitingMax: a.waitN ? a.waitMax : null,
  overCap: pct(colors(a, 2), colors(a, 0)),
  missing: pct(a.missing, a.requests),
  requests: a.requests,
});

const WARSAW = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
function local(ms: number) {
  const p = Object.fromEntries(WARSAW.formatToParts(ms).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}

/** Jedno uruchomienie crona: chwila (ms) i rozpakowana partia (workers/sor: { sor: { numer: wpis } }). */
export interface Run {
  at: number;
  sor: Record<string, Entry>;
}

/** Historia z uruchomień crona; okna kończą się na dniu przed ostatnim pomiarem. */
export function aggregate(runs: Run[]): SorHistory | null {
  if (!runs.length) return null;
  runs.sort((a, b) => a.at - b.at);
  const last = runs.at(-1)!.at;
  const today = local(last).day;
  const perDay = new Map<string, Map<string, Acc>>(); // dzień → numer → liczniki
  const health: { at: number; day: string; ok: number; all: number }[] = [];

  for (const run of runs) {
    const { day, hour } = local(run.at);
    if (day >= today) continue;
    const bySor = perDay.get(day) ?? perDay.set(day, new Map()).get(day)!;
    let ok = 0;
    let all = 0;
    for (const [key, entry] of Object.entries(run.sor)) {
      if (!sorByKey.has(key)) continue;
      const a = bySor.get(key) ?? bySor.set(key, acc()).get(key)!;
      a.requests++;
      all++;
      if (entry.blad) {
        if (SOURCE_ERRORS.has(entry.blad)) a.missing++;
        continue;
      }
      if (!entry.e) continue;
      ok++;
      const waiting = entry.e.reduce((sum, [count]) => sum + (count ?? 0), 0);
      a.waitSum += waiting;
      a.waitN++;
      a.waitMax = Math.max(a.waitMax, waiting);
      a.hours[hour][0] += waiting;
      a.hours[hour][1]++;
      COLORS.forEach((stage, c) => {
        const [count, wait] = entry.e![stage] ?? [null, null];
        const minutes = count ? lowerMinutes(wait) : null;
        if (minutes == null) return;
        a.byColor[c][0]++;
        if (minutes > STAGES[stage].norm!) a.byColor[c][1]++;
        if (/^powyżej/.test(wait!)) a.byColor[c][2]++;
      });
    }
    health.push({ at: run.at, day, ok, all });
  }

  const days = [...perDay.keys()].sort().slice(-WINDOW_DAYS);
  if (!days.length) return null;
  const week = days.slice(-WEEK_DAYS);
  const inWindow = new Set(days);
  const sum = (keys: string[], key: string) => keys.reduce((to, d) => { const a = perDay.get(d)!.get(key); return a ? add(to, a) : to; }, acc());

  const rows: SorHistoryRow[] = [...sorByKey.entries()].map(([key, places]) => {
    const w = sum(days, key);
    const [first, twin] = places;
    return {
      key,
      title: sorTitle(first),
      city: sorCity(first),
      region: first.wojewodztwo,
      ...(twin && { twin: sorCity(twin) }),
      window: stats(w),
      week: stats(sum(week, key)),
      usual: days.length < USUAL_MIN_DAYS ? [] : w.hours.map(([s, n]) => (n >= USUAL_MIN_SAMPLES ? r1(s / n) : null)),
    };
  });

  const total = (keys: string[]) => rows.reduce((to, r) => add(to, sum(keys, r.key)), acc());
  const all = total(days);
  const lastWeek = total(week);
  const regions = new Map<string, Acc>();
  for (const r of rows) add(regions.get(r.region) ?? regions.set(r.region, acc()).get(r.region)!, sum(days, r.key));

  // najdłuższa przerwa w źródle w oknie
  let outage: SorHistory['facts']['outage'] = null;
  let from = 0;
  let requests = 0;
  for (const h of health.filter((x) => inWindow.has(x.day))) {
    if (!h.all || h.ok / h.all >= OUTAGE_SHARE) {
      from = 0;
      continue;
    }
    if (!from) [from, requests] = [h.at, 0];
    requests += h.all;
    const longest = outage ? Date.parse(outage.to) - Date.parse(outage.from) : OUTAGE_MIN_MS - 1;
    if (h.at - from > longest) outage = { from: new Date(from).toISOString(), to: new Date(h.at).toISOString(), requests };
  }

  return {
    version: 1,
    asOf: new Date(last).toISOString(),
    window: { from: days[0], to: days.at(-1)!, days: days.length },
    week: { from: week[0], to: week.at(-1)! },
    rows,
    facts: {
      over: { window: pct(colors(all, 1), colors(all, 0)), week: pct(colors(lastWeek, 1), colors(lastWeek, 0)) },
      overCap: all.byColor.map(([n, , capped]) => pct(capped, n)),
      regions: [...regions.entries()]
        .map(([region, a]) => ({ region, over: pct(colors(a, 1), colors(a, 0)) }))
        .filter((r): r is { region: string; over: number } => r.over != null)
        .sort((a, b) => b.over - a.over),
      outage,
      usual: days.length < USUAL_MIN_DAYS ? [] : all.hours.map(([sum, n]) => (n ? r1(sum / n) : null)),
    },
  };
}

/* ---------- źródła danych ---------- */

/** Wiersz z `wrangler d1 execute --json`: czas crona (s unix albo ISO) i partia jako hex(gz). */
interface RawRow {
  uruchomienie: number | string;
  h: string;
}

const toRun = (r: RawRow): Run => ({
  at: typeof r.uruchomienie === 'number' ? r.uruchomienie * 1000 : Date.parse(r.uruchomienie),
  sor: (JSON.parse(gunzipSync(Buffer.from(r.h, 'hex')).toString('utf8')) as { sor: Record<string, Entry> }).sor,
});

const parseWrangler = (out: string) => (JSON.parse(out.slice(out.indexOf('['))) as { results: RawRow[] }[]).flatMap((d) => d.results);

function fromD1(): SorHistory | null {
  const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
  const now = Math.floor(Date.now() / 1000);
  const start = now - (WINDOW_DAYS + 2) * 86_400;
  const runs: Run[] = [];
  try {
    // tydzień na zapytanie (ok. 5 tys. wierszy, kilkanaście MB tekstu) — jedna odpowiedź dla całego okna byłaby zbyt duża
    for (let from = start; from <= now; from += 7 * 86_400) {
      const sql = `SELECT uruchomienie, hex(gz) AS h FROM pomiary WHERE uruchomienie >= ${from} AND uruchomienie < ${from + 7 * 86_400}`;
      const out = execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'zarobki-sor', '--remote', '--json', '--command', sql], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000, maxBuffer: 256 * 1024 * 1024,
      });
      runs.push(...parseWrangler(out).map(toRun));
    }
  } catch (e) {
    console.warn(`[sor] historia z D1 niedostępna (${(e as Error).message.split('\n')[0]})`);
    return null;
  }
  const history = aggregate(runs);
  if (history) console.info(`[sor] historia z D1: ${runs.length} uruchomień, ${history.window.from}–${history.window.to}`);
  return history;
}

function fromFiles(dir: string): SorHistory | null {
  const runs = readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => parseWrangler(readFileSync(join(dir, f), 'utf8')).map(toRun));
  const history = aggregate(runs);
  console.info(`[sor] historia z plików ${dir}: ${runs.length} uruchomień`);
  return history;
}

const isHistory = (v: unknown): v is SorHistory => {
  const h = v as SorHistory | null;
  return h?.version === 1 && typeof h.asOf === 'string' && Array.isArray(h.rows) && Array.isArray(h.facts?.regions);
};

/** Migawka na produkcji — ten sam plik publikuje każdy build. */
const SNAPSHOT_URL = new URL('/prawa-pacjenta/sor/dane.json', import.meta.env.SITE).href;

async function fromSnapshot(): Promise<SorHistory | null> {
  try {
    const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!isHistory(data)) throw new Error('brak historii w pliku');
    console.info(`[sor] historia z migawki produkcji (${data.window.from}–${data.window.to})`);
    return data;
  } catch (e) {
    console.warn(`[sor] brak migawki ${SNAPSHOT_URL} (${(e as Error).message})`);
    return null;
  }
}

let cache: Promise<SorHistory | null> | undefined;

/** Historia dla tego buildu; strona, mapa i plik migawki dzielą jeden odczyt. */
export function sorHistory(): Promise<SorHistory | null> {
  return (cache ??= load());
}

async function load(): Promise<SorHistory | null> {
  const mode = process.env.SOR_HISTORIA;
  if (mode === '0') return null;
  if (mode === 'd1') return fromD1();
  if (mode && existsSync(mode) && statSync(mode).isDirectory()) return fromFiles(mode);
  const snapshot = await fromSnapshot();
  if (snapshot || process.env.CI !== 'true') return snapshot;
  // Produkcja bez migawki — build w CI zakłada ją jednym odczytem D1; lokalny build nigdy nie czyta bazy
  return fromD1();
}
