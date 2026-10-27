/**
 * Wersja angielska modułu src/data/lekarze-ze-wschodu.ts: te same liczby (importowane),
 * tylko teksty po angielsku. Treść artykułu: src/content/en/articles/doctors-from-outside-the-eu.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { LEW, LEW_TOTAL, lapsedRows as lapsedRowsPl, REGIONS_MAY, REGIONS_MAY_TOTAL, regionsListed, STOCK } from '@/data/lekarze-ze-wschodu';

export { LINKS } from '@/data/lekarze-ze-wschodu';

const share = (part: number, whole: number) => (part / whole) * 100;
const pct = (v: number, decimals = 1) => `${formatEN(v, decimals)}%`;
const MINUS = '−';
const signed = (v: number) => `${v < 0 ? MINUS : '+'}${formatEN(Math.abs(v))}`;

/** Etykiety z modułu polskiego → angielskie; brak tłumaczenia przerywa build. */
const label = (dict: Record<string, string>, pl: string) => {
  const en = dict[pl];
  if (!en) throw new Error(`[en] brak angielskiej etykiety dla „${pl}”`);
  return en;
};

/* ── LEW since 2021: attempts and passes (CEM data for Rzeczpospolita) ─────────── */

const GROUP: Record<string, string> = {
  'Obywatele Białorusi': 'Citizens of Belarus',
  'Polacy z dyplomem spoza UE': 'Poles with a non-EU diploma',
  'Obywatele Ukrainy': 'Citizens of Ukraine',
  'Trzy grupy razem': 'Three groups combined',
};

export const lewRows: BarRow[] = [...LEW, LEW_TOTAL].map((r) => ({
  label: label(GROUP, r.label),
  note: `· ${formatEN(r.passed)} of ${formatEN(r.attempts)} attempts`,
  value: share(r.passed, r.attempts),
  display: pct(share(r.passed, r.attempts)),
  highlight: r === LEW_TOTAL,
}));

/* ── Licences declared expired after the B1 deadline (1.05.2026): cumulative ──── */

/** Te same wiersze i wartości co w module polskim, w tej samej kolejności; ostatni to szacunek. */
const LAPSED_TEXT: { label: string; note: string; about?: boolean }[] = [
  { label: 'by 12 May 2026', note: '· Rzeczpospolita' },
  { label: 'early June', note: '· Rynek Zdrowia', about: true },
  { label: 'by 11 June', note: '· NIL data' },
  { label: 'eventually', note: '· NIL estimate', about: true },
];
if (LAPSED_TEXT.length !== lapsedRowsPl.length) throw new Error('[en] lapsedRows: inna liczba wierszy niż w module polskim');

export const lapsedRows: BarRow[] = lapsedRowsPl.map((r, i) => ({
  ...r,
  label: LAPSED_TEXT[i].label,
  note: LAPSED_TEXT[i].note,
  display: `${LAPSED_TEXT[i].about ? 'about ' : ''}${formatEN(r.value)}`,
}));

/* ── Licences declared expired by 12 May 2026, by voivodeship (Rzeczpospolita) ── */

const REGION: Record<string, string> = {
  mazowieckie: 'Masovian',
  'warmińsko-mazurskie': 'Warmian-Masurian',
  podlaskie: 'Podlaskie',
  lubelskie: 'Lublin',
  śląskie: 'Silesian',
  dolnośląskie: 'Lower Silesian',
  wielkopolskie: 'Greater Poland',
  małopolskie: 'Lesser Poland',
};

export const regionRows: BarRow[] = [
  ...REGIONS_MAY.map((r, i) => ({ label: label(REGION, r.label), value: r.n, display: formatEN(r.n), highlight: i === 0 })),
  {
    label: 'not assigned in the source',
    value: REGIONS_MAY_TOTAL - regionsListed,
    display: formatEN(REGIONS_MAY_TOTAL - regionsListed),
    secondary: true,
  },
];

/* ── Licences of non-EU and foreign doctors (NIL, summary no. 7) ──────────────── */

/** W tej samej kolejności co STOCK w module polskim. */
const STOCK_TEXT = [
  'Conditional licence of a non-EU doctor (item 18)',
  'Licence of a non-EU doctor for a defined scope of activities (item 17)',
  'Licence of a foreign doctor, excluding EU citizens (items 13 and 14)',
];
if (STOCK_TEXT.length !== STOCK.length) throw new Error('[en] STOCK: inna liczba wierszy niż w module polskim');

export const stockTable: CompareTable = {
  columns: ['', '31 Dec 2024', '30 Jun 2026', 'Change'],
  rows: STOCK.map((s, i) => ({
    cells: [
      STOCK_TEXT[i],
      formatEN(s.before),
      formatEN(s.after),
      `${signed(s.after - s.before)} (${s.after < s.before ? MINUS : '+'}${formatEN(Math.abs(share(s.after - s.before, s.before)))}%)`,
    ],
  })),
};
