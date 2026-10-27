/**
 * Wersja angielska modułu src/data/budzet-nfz.ts: te same liczby (importowane), tylko teksty po angielsku —
 * wykres kosztów (IndexChart), animowany wykres dotacji (SubsidyChart) i tabela wszystkich kolumn.
 * Kwoty na wykresach i w tabeli w „PLN bn”, bez euro; w tekście artykułu kwoty idą przez ui/Money
 * z wartością `bn()` (zaokrągloną jak `formatMld` w module polskim, żeby liczba złotych była ta sama).
 * Od 27.10.2026 także część o kolejkach (scalone z dawnym /dane/kolejki/): wykres indeksowy, tabela lat,
 * kolejki do specjalistów, dwa źródła i składka — liczby z src/data/kolejki.ts.
 * Treść artykułu: src/content/en/articles/nfz-budget.mdx.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import {
  BUDGET,
  CURRENT,
  CURRENT_PLAN as CURRENT_PLAN_PL,
  DRAFT_2027,
  FUS_LINKS as FUS_LINKS_PL,
  FUS_SUBSIDY,
  LAST_FINAL,
  change,
  type BudgetYear,
} from '@/data/budzet-nfz';
import {
  CPI,
  FROM,
  GROWTH,
  MEDIAN_WAGES,
  MIN_WAGE,
  SPECIALISTS_2025,
  TO,
  TWO_SOURCES,
  WHC_BASE,
  WHC_EDITIONS,
  WHC_LATEST,
  contribution,
  priceLevel,
} from '@/data/kolejki';

export {
  BUDGET,
  COVID_IN_NFZ,
  CURRENT,
  DRAFT_2026,
  DRAFT_2027,
  GAP_2027,
  LAST_FINAL,
  LINKS,
  OVERRUN_2021_2025,
  budget,
  change,
} from '@/data/budzet-nfz';
export {
  FROM,
  GROWTH,
  MEDIAN_WAGES,
  MIN_WAGE,
  NFZ_ORTHOPEDIST,
  OOP_PER_PERSON_2024,
  OUT_OF_POCKET,
  POPULATION_2024,
  PRIVATE_TOTAL_2024,
  SPECIALISTS_2025,
  TO,
  WHC_2021,
  WHC_LATEST,
  contribution,
  priceLevel,
  LINKS as QUEUE_LINKS,
} from '@/data/kolejki';

/** jednostka na wykresach i w tabeli */
export const UNIT = 'PLN bn';

const round = (n: number, decimals: number) => {
  const k = 10 ** decimals;
  return Math.round(n * k + 1e-6) / k;
};

/**
 * Liczba z jednym miejscem po przecinku, zaokrąglona połówką w górę jak `formatMld` w module polskim
 * (227.35 → 227.4), w zapisie angielskim.
 */
export const f1 = (n: number, decimals = 1) => formatEN(round(n, decimals), decimals);
const bnCell = (n: number | null) => (n === null ? '—' : f1(n));

/**
 * Kwota w mld zł → wartość w złotych dla <Money scale="billion" />, zaokrąglona tak samo jak w tekście
 * polskim (Money sam robi toFixed, które dla 227.35 dałoby 227.3).
 */
export const bn = (n: number, decimals = 1) => round(n, decimals) * 1e9;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** „5.10.2026” → „5 October 2026” (albo „5 Oct 2026” z `short`) */
const dateEN = (dmy: string, short = false) => {
  const [d, m, y] = dmy.split('.').map(Number);
  const month = MONTHS[m - 1];
  return `${d} ${short ? month.slice(0, 3) : month} ${y}`;
};

/** Stan planu na rok w toku — jak CURRENT_PLAN w module polskim, z datą po angielsku. */
export const CURRENT_PLAN = {
  ...CURRENT_PLAN_PL,
  date: dateEN(CURRENT_PLAN_PL.dateShort),
  dateShort: dateEN(CURRENT_PLAN_PL.dateShort, true),
};

/* ── Costs in the plan, line chart (components/budzet/IndexChart) ─────────────── */

const mid = (year: number) => year + 0.5;
const FINALS = BUDGET.filter((r) => r.status === 'final');

export const COST_CHART = {
  xMin: BUDGET[0].year,
  xMax: DRAFT_2027.year + 1,
  yMin: 0,
  yMax: 300,
  ticks: [0, 50, 100, 150, 200, 250, 300],
  unit: UNIT,
  years: [...BUDGET.map((r) => r.year), DRAFT_2027.year],
  series: [
    {
      id: 'draft',
      label: `${DRAFT_2027.year}, draft plan`,
      tone: 'ref' as const,
      end: f1(DRAFT_2027.total),
      labelShift: -1,
      markers: true,
      points: [
        { x: mid(LAST_FINAL.year), v: LAST_FINAL.costs, note: 'final plan' },
        { x: mid(CURRENT.year), v: CURRENT.costs, note: `plan in progress, after the amendment of ${CURRENT_PLAN.dateShort}` },
        { x: mid(DRAFT_2027.year), v: DRAFT_2027.total, note: 'draft plan of July 2026' },
      ],
    },
    {
      id: 'final',
      label: `Final plan, ${LAST_FINAL.year}`,
      tone: 'accent' as const,
      end: f1(LAST_FINAL.costs),
      labelShift: 1,
      markers: true,
      points: FINALS.map((r) => ({ x: mid(r.year), v: r.costs, note: 'final plan' })),
    },
  ],
  caption:
    `Line chart. Total costs in the final NFZ financial plan, PLN billion: ${FINALS.map((r) => `${r.year} — ${f1(r.costs)}`).join('; ')}. ` +
    `Dashed line: ${CURRENT.year} — plan in progress after the amendment of ${CURRENT_PLAN.date}, PLN ${f1(CURRENT.costs)} billion; ` +
    `${DRAFT_2027.year} — draft plan of July 2026, PLN ${f1(DRAFT_2027.total)} billion.`,
};

/* ── State budget subsidy, animated bar chart (components/budzet/SubsidyChart) ─── */

/** Dokumenty ZUS z kwotami dotacji dla FUS — te same adresy, podpisy po angielsku. */
export const FUS_LINKS = FUS_LINKS_PL.map((l) => ({ ...l, label: l.label === 'plan na 2026' ? '2026 plan' : l.label }));

const SUBSIDY_YEARS = BUDGET.filter((r): r is BudgetYear & { subsidy: number } => r.subsidy !== null);
export const SUBSIDY_CHART = {
  name: { full: 'National Health Fund', short: 'NFZ' },
  compare: { name: { full: 'Social Insurance Fund', short: 'FUS (ZUS)' }, values: FUS_SUBSIDY.map((r) => r.value) },
  unit: UNIT,
  bars: SUBSIDY_YEARS.map((r) => ({ year: r.year, value: r.subsidy, note: r.status === 'current' ? 'plan in progress' : undefined })),
  caption:
    `Bar chart. General subsidy from the state budget in the NFZ financial plan, PLN billion: ` +
    `${SUBSIDY_YEARS.map((r) => `${r.year} — ${bnCell(r.subsidy)}${r.status === 'current' ? ' (current plan, year in progress)' : ''}`).join('; ')}.`,
};

/* ── All columns of the series, table (Comparison) ────────────────────────────── */

/** Zmiana r/r tylko w obrębie kolumny kosztów — jak w module polskim. */
export const BUDGET_TABLE: CompareTable = {
  caption: 'PLN billion. Plan — final NFZ financial plan; 2026 — current plan, year in progress. Outturn — operating costs from the financial statements.',
  columns: ['Year', 'Costs in the plan', 'Change in costs y/y', 'Revenue in the plan', 'Outturn: costs', 'State budget subsidy'],
  rows: BUDGET.map((r, i) => {
    const prev = BUDGET[i - 1];
    const rr = prev ? change(prev.costs, r.costs) : null;
    return {
      cells: [
        r.status === 'current' ? `${r.year} (plan in progress)` : String(r.year),
        bnCell(r.costs),
        rr === null ? '—' : `${rr < 0 ? '−' : '+'}${formatEN(Math.abs(rr), 1)}%`,
        bnCell(r.revenue),
        bnCell(r.executed),
        bnCell(r.subsidy),
      ],
      marked: r.status === 'current',
    };
  }),
};

/* ── Money and the waiting list: index chart (components/budzet/IndexChart) ─────── */

/** okres edycji Barometru WHC po angielsku: „IX/X 2025” → „Sep/Oct 2025”, „XII/I 2019” → „Dec/Jan 2019” */
const ROMAN: Record<string, string> = {
  I: 'Jan', II: 'Feb', III: 'Mar', IV: 'Apr', V: 'May', VI: 'Jun',
  VII: 'Jul', VIII: 'Aug', IX: 'Sep', X: 'Oct', XI: 'Nov', XII: 'Dec',
};
export const editionEN = (label: string) => {
  const [months, year] = label.split(' ');
  const en = months.split('/').map((m) => {
    const month = ROMAN[m];
    if (!month) throw new Error(`[en] nieznany miesiąc „${m}” w okresie Barometru „${label}”`);
    return month;
  });
  return `${en.join('/')} ${year}`;
};

const queueYears = BUDGET.filter((r) => r.year >= FROM && r.year <= TO).map((r) => r.year);
const cost = (year: number) => BUDGET.find((r) => r.year === year)!.costs;

export const INDEX_CHART = {
  base: FROM,
  xMin: FROM,
  xMax: TO + 1,
  yMin: 80,
  yMax: 320,
  ticks: [100, 150, 200, 250, 300],
  years: queueYears,
  series: [
    {
      id: 'budget',
      label: 'Costs in the NFZ plan',
      tone: 'data' as const,
      end: `×${formatEN(GROWTH.budget, 1)}`,
      points: queueYears.map((y) => ({ x: mid(y), v: (cost(y) / cost(FROM)) * 100 })),
    },
    {
      id: 'prices',
      label: 'Prices (inflation)',
      tone: 'ref' as const,
      end: `+${formatEN(GROWTH.prices)}%`,
      labelShift: -1,
      points: queueYears.map((y) => ({ x: mid(y), v: priceLevel(y) * 100 })),
    },
    {
      id: 'queue',
      label: 'Waiting time (WHC)',
      tone: 'accent' as const,
      end: `+${formatEN(GROWTH.queue)}%`,
      labelShift: 1,
      markers: true,
      // 2020: no Barometer survey — the 2019–2021 segment is dashed
      points: WHC_EDITIONS.map((e) => ({
        x: e.x, v: (e.single / WHC_BASE) * 100, gapBefore: e.label === 'IX 2021',
        label: editionEN(e.label), tip: `${formatEN(e.single, 1)} months`, note: 'average per service (WHC)',
      })),
    },
  ],
  caption:
    `Indices, ${FROM} = 100, ${FROM}–${TO}. Costs in the final NFZ financial plan: from PLN ${f1(cost(FROM))} billion to ` +
    `PLN ${f1(cost(TO))} billion, i.e. ${formatEN(GROWTH.budget, 2)} times. Price level according to GUS: ${formatEN(GROWTH.prices, 1)}% higher. ` +
    `Average waiting time for a single service according to the WHC Barometer: from ${formatEN(WHC_BASE, 1)} months (average of three surveys ` +
    `in ${FROM}) to ${formatEN(WHC_LATEST.single, 1)} months (${editionEN(WHC_LATEST.label)}), up ${formatEN(GROWTH.queue)}%; there was no Barometer in 2020.`,
};

/* ── The longer view, table (Comparison) ─────────────────────────────────────── */

const whcCell = (year: number, key: 'single' | 'specialist') => {
  if (year === 2020) return 'no survey';
  const values = WHC_EDITIONS.filter((e) => e.year === year).map((e) => e[key]);
  if (!values.length || values.every((v) => v === null)) return '—';
  return values.map((v) => (v === null ? '—' : formatEN(v, 1))).join(' · ');
};

export const HISTORY_TABLE: CompareTable = {
  caption: 'Successive years in absolute terms. Waiting time: each edition of the WHC Barometer in a given year shown separately.',
  columns: ['Year', 'Costs in the NFZ plan, PLN bn', 'Inflation, %', 'Minimum wage, PLN', 'WHC: service, months', 'WHC: specialist, months'],
  rows: BUDGET.filter((r) => r.year >= FROM).map((r) => {
    const wage = MIN_WAGE.find((m) => m.year === r.year);
    const infl = CPI[r.year];
    return {
      cells: [
        String(r.year),
        `${bnCell(r.costs)}${r.status === 'current' ? ' (plan in progress)' : ''}`,
        infl === undefined ? '—' : `${infl < 100 ? '−' : ''}${formatEN(Math.abs(infl - 100), 1)}`,
        wage ? `${formatEN(wage.value)}${wage.july ? `, from July ${formatEN(wage.july)}` : ''}` : '—',
        r.year > TO ? '—' : whcCell(r.year, 'single'),
        r.year > TO ? '—' : whcCell(r.year, 'specialist'),
      ],
    };
  }),
};

/* ── Waiting times by specialist (BarChart) and two sources (Comparison) ────────── */

const SPECIALIST_EN: Record<string, string> = {
  Neurochirurg: 'Neurosurgeon',
  Endokrynolog: 'Endocrinologist',
  Gastroenterolog: 'Gastroenterologist',
  Kardiolog: 'Cardiologist',
  Okulista: 'Ophthalmologist',
};
const specialistEN = (label: string) => {
  const en = SPECIALIST_EN[label];
  if (!en) throw new Error(`[en] brak tłumaczenia specjalisty „${label}”`);
  return en;
};

export const SPECIALIST_ROWS = SPECIALISTS_2025.rows.map((r, i) => ({ label: specialistEN(r.label), value: r.value, display: `${formatEN(r.value, 1)} months`, highlight: i === 0 }));

export const SOURCES_TABLE: CompareTable = {
  columns: ['Clinic', 'NFZ, Q2 2025', 'WHC Barometer, Sep/Oct 2025'],
  rows: TWO_SOURCES.map((r) => ({ cells: [specialistEN(r.label), `${formatEN(r.nfz, 1)} months`, `${formatEN(r.whc, 1)} months`] })),
};

/* ── Health contribution for the median wage, table (Comparison) ───────────────── */

const SURVEY_EN: Record<string, string> = {
  'Struktura wynagrodzeń': 'Structure of wages and salaries by occupation',
  'Rozkład wynagrodzeń': 'Distribution of wages and salaries',
};

export const CONTRIBUTION_TABLE: CompareTable = {
  columns: ['Year', 'Median gross pay, October', 'Health contribution per year (our calculation)', 'GUS survey'],
  rows: MEDIAN_WAGES.map((m) => ({ cells: [String(m.year), `PLN ${formatEN(m.median, 2)}`, `about PLN ${formatEN(contribution(m.median))}`, `“${SURVEY_EN[m.survey]}”`] })),
};
