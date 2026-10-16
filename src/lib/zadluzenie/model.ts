/**
 * Model licznika długu szpitali — czyste funkcje bez DOM, wspólne dla serwera (wykres, liczby
 * w treści) i przeglądarki (licznik na żywo).
 *
 *   kotwica  ostatni kwartał z danymi MZ: dług SPZOZ + szpitali-spółek i instytutów
 *            (tych drugich MZ podało tylko za koniec 2025 r. — dalej rosną w tempie SPZOZ)
 *   tempo    wzrost długu SPZOZ w ostatnich czterech kwartałach (rok do roku) — według niego liczy licznik
 *   wariant  średnie roczne tempo z ostatnich pięciu lat (IV kw. do IV kw.) — dolna granica projekcji
 *   zasięg   projekcja najwyżej 12 miesięcy od dziś; dalej byłoby to już zgadywanie, nie ekstrapolacja
 *
 * Wzrost jest składany w sposób ciągły: wartość(t) = kotwica · (1 + tempo)^(lata od kotwicy).
 */

import { formatPL } from '@/lib/format';

export const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const MLN = 1e6;
const ROMAN = ['I', 'II', 'III', 'IV'] as const;

export interface Quarter {
  /** „II 2026” */
  label: string;
  year: number;
  q: number;
  /** koniec kwartału (ms, UTC) */
  end: number;
  /** zł */
  spzoz: number;
  /** w tym wymagalne (przeterminowane), zł */
  overdue: number;
  /** szpitale-spółki i instytuty, zł — od kwartału, za który podało je MZ; wcześniej brak */
  others?: number;
  /** spzoz + others */
  total: number;
}

/** Parametry licznika — tyle trafia do przeglądarki. */
export interface DebtParams {
  /** dług w zł na chwilę `baseDate` */
  base: number;
  baseDate: number;
  /** roczne tempo licznika (0,257 = 25,7%) */
  rate: number;
  /** wolniejszy wariant projekcji */
  low: number;
  population: number;
}

export interface ProjectedQuarter {
  label: string;
  end: number;
  /** wartość przy tempie licznika */
  high: number;
  /** wartość w wolniejszym wariancie */
  low: number;
}

/** 40 816 700 000 zł → „40,8” (mld zł) */
export const mld = (zl: number, decimals = 1) => formatPL(zl / 1e9, decimals);

/** 0,2566 → „25,7” (%) */
export const pct = (rate: number, decimals = 1) => formatPL(rate * 100, decimals);

/** Ostatni dzień kwartału: quarterEnd(2026, 2) → 30.06.2026 */
export const quarterEnd = (year: number, q: number) => Date.UTC(year, q * 3, 0);

export const quarterLabel = (year: number, q: number) => `${ROMAN[q - 1]} ${year}`;

export function parseQuarter(label: string) {
  const [roman, year] = label.split(' ');
  const q = ROMAN.indexOf(roman as (typeof ROMAN)[number]) + 1;
  if (!q) throw new Error(`Nieznany kwartał „${label}”`);
  return { year: Number(year), q, end: quarterEnd(Number(year), q) };
}

/** Wartość długu w chwili t (ms) — przy tempie licznika albo podanym. */
export const valueAt = (p: DebtParams, t: number, rate = p.rate) =>
  p.base * (1 + rate) ** ((t - p.baseDate) / YEAR_MS);

/** O ile złotych dług rośnie na sekundę w chwili t (pochodna wzrostu wykładniczego). */
export const perSecond = (p: DebtParams, t: number) => (valueAt(p, t) * Math.log(1 + p.rate)) / (YEAR_MS / 1000);

/**
 * Kwartały po ostatnim odczycie, których koniec wypada najwyżej rok od `now` —
 * słupki projekcji na wykresie.
 */
export function projectQuarters(p: DebtParams, last: Pick<Quarter, 'year' | 'q'>, now: number): ProjectedQuarter[] {
  const out: ProjectedQuarter[] = [];
  for (let i = last.year * 4 + last.q; ; i++) {
    const year = Math.floor(i / 4), q = (i % 4) + 1;
    const end = quarterEnd(year, q);
    if (end > now + YEAR_MS) return out;
    out.push({ label: quarterLabel(year, q), end, high: valueAt(p, end), low: valueAt(p, end, p.low) });
  }
}

interface Raw {
  /** [kwartał, ogółem, wymagalne] w mln zł — od najstarszego */
  quarters: [string, number, number][];
  others: { quarter: string; companies: number; institutes: number };
  population: number;
}

/** Szereg kwartalny, tempa wzrostu i parametry licznika z surowych danych MZ. */
export function buildDebt({ quarters: raw, others, population }: Raw) {
  const quarters: Quarter[] = raw.map(([label, spzoz, overdue]) => ({
    label, ...parseQuarter(label), spzoz: spzoz * MLN, overdue: overdue * MLN, total: spzoz * MLN,
  }));

  // Spółki i instytuty: jeden odczyt MZ, dalej w tempie SPZOZ
  const ref = quarters.findIndex((q) => q.label === others.quarter);
  if (ref < 0) throw new Error(`Brak kwartału „${others.quarter}” w szeregu SPZOZ`);
  const othersRef = (others.companies + others.institutes) * MLN;
  for (const q of quarters.slice(ref)) {
    q.others = (othersRef * q.spzoz) / quarters[ref].spzoz;
    q.total = q.spzoz + q.others;
  }

  const last = quarters.at(-1)!;
  const yearAgo = quarters.at(-5)!;
  // Średnie tempo: od IV kw. sprzed pięciu lat do ostatniego IV kw. w danych
  const q4 = quarters.findLastIndex((q) => q.q === 4);
  const q4Start = quarters[q4 - 20];
  if (!q4Start) throw new Error('Szereg SPZOZ musi obejmować co najmniej pięć pełnych lat');

  const rate = last.spzoz / yearAgo.spzoz - 1;
  const low = (quarters[q4].spzoz / q4Start.spzoz) ** (1 / 5) - 1;

  return {
    quarters,
    last,
    yearAgo,
    rate,
    low,
    /** lata wariantu wolniejszego, np. „2020–2025” */
    lowSpan: `${q4Start.year}–${quarters[q4].year}`,
    /** wzrost przeterminowanych rok do roku */
    overdueRate: last.overdue / yearAgo.overdue - 1,
    params: { base: last.total, baseDate: last.end, rate, low, population } satisfies DebtParams,
  };
}
