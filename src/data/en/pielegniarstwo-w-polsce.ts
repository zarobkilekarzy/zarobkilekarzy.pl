/**
 * Wersja angielska modułu src/data/pielegniarstwo-w-polsce.ts: te same liczby (importowane),
 * tylko teksty po angielsku (etykiety wykresów, tabela prognozy, zapis liczb przez formatEN).
 * Treść artykułu: src/content/en/articles/nursing-in-poland-age-ladder.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import {
  AGE_LADDER,
  AGE_BASE as AGE_BASE_PL,
  MODEL_INFLOW,
  MODEL_RETIREMENTS,
  NEW_LICENSES,
  checkedYears,
  licensesTotal,
} from '@/data/pielegniarstwo-w-polsce';

export {
  LINKS,
  OVER_60,
  UNDER_40,
  REGISTRY,
  MODEL_INFLOW,
  checkedYears,
  actualGap,
  modelGap,
  employedShare,
  employed2021,
  employed2025,
  RETIREMENT_NOW,
  RETIREMENT_2030,
} from '@/data/pielegniarstwo-w-polsce';

/** −317 / +288 — ze znakiem minus typograficznym, zapis angielski */
export const signed = (n: number) => (n > 0 ? `+${formatEN(n)}` : n < 0 ? `−${formatEN(-n)}` : '0');

/* ---------- Age ladder: registered nurses, January 2023 ---------- */

const AGE_GROUP: Record<string, string> = {
  '71 lat i więcej': '71 and over',
  '61–70 lat': '61–70',
  '51–60 lat': '51–60',
  '41–50 lat': '41–50',
  '31–40 lat': '31–40',
  '20–30 lat': '20–30',
};
const ageGroup = (group: string) => {
  const en = AGE_GROUP[group];
  if (!en) throw new Error(`[en] brak angielskiej nazwy grupy wieku „${group}”`);
  return en;
};

const DATE: Record<string, string> = { 'styczeń 2023': 'January 2023' };
if (!DATE[AGE_BASE_PL.date]) throw new Error(`[en] brak angielskiej daty „${AGE_BASE_PL.date}”`);

export const AGE_BASE = { nurses: AGE_BASE_PL.nurses, date: DATE[AGE_BASE_PL.date]! } as const;

export const ageRows: BarRow[] = AGE_LADDER.map((g) => ({
  label: ageGroup(g.group),
  value: g.pct,
  display: `${formatEN(g.pct, 1)}%`,
  highlight: 'over60' in g,
}));

/* ---------- Density: practising nurses per 1,000 population, 2023 (OECD) ---------- */

export const densityRows: BarRow[] = [
  { label: 'Poland', value: 5.9, display: '5.9', highlight: true },
  { label: 'EU average', note: '(unweighted)', value: 8.5, display: '8.5' },
  { label: 'OECD average', value: 9.2, display: '9.2' },
];

/* ---------- Inflow: new licences to practise, nurses + midwives ---------- */

export const licenseRows: BarRow[] = NEW_LICENSES.map((r) => ({
  label: String(r.year),
  value: r.nurses + r.midwives,
  display: formatEN(r.nurses + r.midwives),
  highlight: r.year >= MODEL_RETIREMENTS[0].year,
}));

/* ---------- NIPiP forecast of April 2022 against the data ---------- */

const CHECKED = MODEL_RETIREMENTS.filter((r) => r.year >= checkedYears.from && r.year <= checkedYears.to);
const actual = CHECKED.reduce((sum, r) => sum + licensesTotal(r.year) - r.people, 0);

export const modelTable: CompareTable = {
  columns: ['', 'Reaching 60 (forecast)', 'New licences: assumption', 'New licences: actual', 'Actual balance'],
  rows: [
    ...CHECKED.map((r) => ({
      cells: [
        String(r.year),
        formatEN(r.people),
        formatEN(MODEL_INFLOW),
        formatEN(licensesTotal(r.year)),
        signed(licensesTotal(r.year) - r.people),
      ],
    })),
    {
      cells: [
        `Total ${checkedYears.from}–${checkedYears.to}`,
        formatEN(CHECKED.reduce((sum, r) => sum + r.people, 0)),
        formatEN(MODEL_INFLOW * CHECKED.length),
        formatEN(CHECKED.reduce((sum, r) => sum + licensesTotal(r.year), 0)),
        signed(actual),
      ],
      marked: true,
    },
  ],
};
