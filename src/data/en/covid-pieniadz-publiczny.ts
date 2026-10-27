/**
 * Wersja angielska modułu src/data/covid-pieniadz-publiczny.ts: te same liczby (importowane),
 * tylko teksty po angielsku. Na wykresach kwoty w „PLN bn” bez euro; w tekście artykułu kwoty
 * idą przez ui/Money. Treść artykułu: src/content/en/articles/covid-19-public-money.mdx.
 *
 * Dwie sumy Funduszu — nie mieszać (opis w module polskim): wydatki OGÓŁEM (FUND.total, z obsługą
 * obligacji i prowizją BGK) i wydatki NA ZADANIA (FUND.tasks); udziały dysponentów liczą się od zadań.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import { DISPONENTS, FUND, NATIONAL_HOSPITAL, NRZ, nrzGrowth } from '@/data/covid-pieniadz-publiczny';

export { FUND, LINKS, NATIONAL_HOSPITAL } from '@/data/covid-pieniadz-publiczny';

export const UNIT = 'PLN bn';

const bn = (mln: number) => mln / 1000;
const share = (mln: number) => (mln / FUND.tasks) * 100;

/** Dysponenci z modułu polskiego → angielskie nazwy. */
const DISPONENT_NAMES: Record<string, string> = {
  'Minister Zdrowia': 'Minister of Health',
  'Minister właściwy ds. pracy': 'Minister responsible for labour',
  'Zakład Ubezpieczeń Społecznych': 'Social Insurance Institution (ZUS)',
  'Szef Kancelarii Prezesa Rady Ministrów': 'Head of the Chancellery of the Prime Minister',
  'Minister właściwy ds. energii': 'Minister responsible for energy',
};

const disponent = (pl: string) => {
  const en = DISPONENT_NAMES[pl];
  if (!en) throw new Error(`[en] brak angielskiej nazwy dysponenta „${pl}”`);
  return en;
};

const othersMln = FUND.tasks - DISPONENTS.reduce((s, d) => s + d.value, 0);

export const fundRows: BarRow[] = [
  ...DISPONENTS.map((d) => ({
    label: disponent(d.label),
    note: `${formatEN(share(d.value), 1)}%`,
    value: bn(d.value),
    display: `PLN ${formatEN(bn(d.value), 1)} bn`,
    highlight: d.highlight,
  })),
  {
    label: 'Other spending authorities combined',
    note: `${formatEN(share(othersMln), 1)}%`,
    value: bn(othersMln),
    display: `PLN ${formatEN(bn(othersMln), 1)} bn`,
  },
];

export const fundCaption = `Spending of the COVID-19 Response Fund on tasks in 2020–2022 by spending authority, PLN billion: ${fundRows
  .map((r) => `${r.label} — ${r.display} (${r.note})`)
  .join('; ')}.`;

/** Liczby do treści: zapis angielski, zaokrąglenia jak w wersji polskiej (fundFmt). */
export const fundFmt = {
  health: formatEN(bn(FUND.health), 1),
  healthShare: formatEN(share(FUND.health), 0),
  nonHealthShare: formatEN(100 - share(FUND.health), 0),
  tasks: formatEN(bn(FUND.tasks), 1),
};

/* ---------- National Health Account (GUS) ---------- */

export const nrzRows: BarRow[] = NRZ.map((r, i) => {
  const g = nrzGrowth[i].pct;
  return {
    label: String(r.year),
    note: g === undefined ? undefined : `+${formatEN(g, 1)}% y/y`,
    value: bn(r.value),
    display: `PLN ${formatEN(bn(r.value), 1)} bn`,
    highlight: r.year === 2021,
  };
});

export const nrzCaption = `Current spending on healthcare in total according to the National Health Account of Statistics Poland (GUS), PLN billion: ${NRZ.map(
  (r, i) => `${r.year} — ${formatEN(bn(r.value), 1)}${i ? ` (+${formatEN(nrzGrowth[i].pct!, 1)}%)` : ''}`,
).join('; ')}.`;

/* ---------- National Stadium hospital ---------- */

const nh = NATIONAL_HOSPITAL;
/** Średnie miesięczne (zł) — do <Money> w treści. */
export const nhPerMonth = nh.operation / nh.months;
export const nhPerMonthAll = (nh.adaptation + nh.operation) / nh.months;
export const nhPatients = formatEN(nh.patients);
