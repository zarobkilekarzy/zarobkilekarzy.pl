/**
 * Zbiorcze wyniki modułu /egzamin z D1 (worker/egzamin.js) dla sekcji „Wyniki na tej stronie”
 * (components/egzamin/SiteStats). Wejścia na stronę nie odpytują ani D1, ani Workera — liczby składa build.
 *
 * D1 czyta jeden build na dobę. Grupowanie przechodzi przez całą tabelę `wyniki` (≈ dwie liczby jej
 * wierszy w dziennym limicie odczytów D1 konta), a buildów jest kilkadziesiąt dziennie, więc:
 *   - EGZAMIN_STATS=d1 — odczyt przez `wrangler d1 execute --remote` (w CI z CLOUDFLARE_API_TOKEN
 *     i CLOUDFLARE_ACCOUNT_ID). Ustawia go deploy.yml tylko dla nocnego i ręcznego przebiegu;
 *   - bez zmiennej — migawka z produkcji, /egzamin/statystyki.json (plik statyczny, bez Workera i D1).
 *     Tak budują pushe w CI i buildy lokalne. Gdy produkcja migawki nie ma (pierwszy deploy, nieudany
 *     odczyt), build w CI raz sięga do D1, żeby ją założyć; lokalny build pomija wtedy sekcję;
 *   - EGZAMIN_STATS=0 — bez statystyk.
 * Każdy build publikuje wynik z powrotem jako /egzamin/statystyki.json (pages/egzamin/statystyki.json.ts),
 * więc migawka przechodzi z deployu na deploy aż do następnego odczytu D1. Bez danych zwracamy null,
 * a sekcja znika.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface TimeBucket {
  label: string;
  n: number;
  /** średni wynik jako ułamek */
  mean: number;
}

export interface AgentRow {
  model: string;
  reasoning: string;
  mode: string;
  n: number;
  mean: number;
  best: number;
}

export interface SiteStats {
  /** chwila odczytu, np. „25.10.2026, 3:00” (Europe/Warsaw) */
  asOf: string;
  /** pierwszy dzień z wynikiem, „2026-10-09” */
  since: string;
  exam: { n: number; passed: number; points: { minutes: number; share: number }[] };
  quick: { n: number; passed: number; median: number; byPoints: number[]; byTime: TimeBucket[] };
  agents: AgentRow[];
}

/** Czas szybkiego testu w pełnych minutach (worker zapisuje czas_min zaokrąglony). */
const TIME_BUCKETS: { label: string; to: number }[] = [
  { label: 'do 2 min', to: 2 },
  { label: '3–5 min', to: 5 },
  { label: '6–8 min', to: 8 },
  { label: '9–12 min', to: 12 },
  { label: '13–18 min', to: 18 },
  { label: '19 min i dłużej', to: Infinity },
];

const QUICK_MAX = 20;

type Row = Record<string, string | number | null>;

function query(sql: string): Row[][] {
  const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
  const out = execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'zarobki-egzamin', '--remote', '--json', '--command', sql], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90_000,
  });
  const data = JSON.parse(out.slice(out.indexOf('['))) as { results: Row[] }[];
  return data.map((d) => d.results);
}

const warsawNow = () =>
  new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    .format(new Date());

/** Migawka na produkcji — ten sam plik publikuje każdy build (pages/egzamin/statystyki.json.ts). */
const SNAPSHOT_URL = new URL('/egzamin/statystyki.json', import.meta.env.SITE).href;

let cache: Promise<SiteStats | null> | undefined;

/** Statystyki dla tego buildu; strona i plik migawki dzielą jeden odczyt. */
export function siteStats(): Promise<SiteStats | null> {
  return (cache ??= load());
}

async function load(): Promise<SiteStats | null> {
  const mode = process.env.EGZAMIN_STATS;
  if (mode === '0') return null;
  if (mode === 'd1') return fromD1();
  const snapshot = await fromSnapshot();
  if (snapshot || process.env.CI !== 'true') return snapshot;
  // Produkcja bez migawki — build w CI zakłada ją jednym odczytem D1; lokalny build nigdy nie czyta bazy
  return fromD1();
}

const isStats = (v: unknown): v is SiteStats => {
  const s = v as SiteStats | null;
  return typeof s?.asOf === 'string' && typeof s.since === 'string' && Array.isArray(s.exam?.points)
    && Array.isArray(s.quick?.byPoints) && Array.isArray(s.quick.byTime) && Array.isArray(s.agents);
};

async function fromSnapshot(): Promise<SiteStats | null> {
  try {
    const res = await fetch(SNAPSHOT_URL, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!isStats(data)) throw new Error('brak statystyk w pliku');
    console.info(`[egzamin] statystyki z migawki produkcji (stan na ${data.asOf})`);
    return data;
  } catch (e) {
    console.warn(`[egzamin] brak migawki ${SNAPSHOT_URL} (${(e as Error).message})`);
    return null;
  }
}

function fromD1(): SiteStats | null {
  let rows: Row[], since: string;
  try {
    // Wiersze przybywają w kolejności dni, więc pierwszy rowid to pierwszy dzień: 1 odczytany wiersz zamiast MIN() po całej tabeli
    const [grouped, first] = query(
      'SELECT tryb, pkt, max, czas_min, zdany, COUNT(*) AS n FROM wyniki GROUP BY tryb, pkt, max, czas_min, zdany; ' +
      'SELECT dzien AS od FROM wyniki ORDER BY rowid LIMIT 1',
    );
    rows = grouped;
    since = String(first[0]?.od ?? '');
  } catch (e) {
    console.warn(`[egzamin] statystyki strony pominięte — brak odczytu D1 (${(e as Error).message.split('\n')[0]})`);
    return null;
  }
  console.info('[egzamin] statystyki odczytane z D1');
  if (!rows.length || !since) return null;

  const exam = { n: 0, passed: 0, points: [] as { minutes: number; share: number }[] };
  const quick = { n: 0, passed: 0, byPoints: Array.from({ length: QUICK_MAX + 1 }, () => 0) };
  const time = TIME_BUCKETS.map(() => ({ n: 0, sum: 0 }));
  for (const r of rows) {
    const n = Number(r.n), pkt = Number(r.pkt), max = Number(r.max), minutes = Number(r.czas_min), passed = Number(r.zdany);
    if (r.tryb === 'egzamin') {
      exam.n += n;
      exam.passed += passed * n;
      for (let k = 0; k < n; k++) exam.points.push({ minutes, share: pkt / max });
    } else if (r.tryb === 'szybki' && max === QUICK_MAX) {
      quick.n += n;
      quick.passed += passed * n;
      quick.byPoints[pkt] += n;
      const t = time[TIME_BUCKETS.findIndex((b) => minutes <= b.to)];
      t.n += n;
      t.sum += (pkt / max) * n;
    }
  }
  let acc = 0;
  const median = quick.byPoints.findIndex((c) => (acc += c) >= quick.n / 2);

  let agents: AgentRow[] = [];
  try {
    // Tabela `agenci` powstaje przy pierwszym zgłoszeniu asystenta — wcześniej zapytanie zwraca błąd
    agents = query(
      'SELECT model, reasoning, tryb, COUNT(*) AS n, AVG(pkt * 1.0 / max) AS sr, MAX(pkt * 1.0 / max) AS best ' +
      'FROM agenci GROUP BY model, reasoning, tryb ORDER BY tryb, sr DESC',
    )[0].map((r) => ({
      model: String(r.model), reasoning: String(r.reasoning), mode: String(r.tryb),
      n: Number(r.n), mean: Number(r.sr), best: Number(r.best),
    }));
  } catch { /* brak tabeli = brak wyników asystentów */ }

  return {
    asOf: warsawNow(),
    since,
    exam: { ...exam, points: exam.points.sort((a, b) => a.minutes - b.minutes) },
    quick: {
      ...quick, median,
      byTime: TIME_BUCKETS.map((b, i) => ({ label: b.label, n: time[i].n, mean: time[i].n ? time[i].sum / time[i].n : 0 })),
    },
    agents,
  };
}
