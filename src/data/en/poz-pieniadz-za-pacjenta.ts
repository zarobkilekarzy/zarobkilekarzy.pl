/**
 * Wersja angielska wyliczeń z src/content/articles/poz-pieniadz-za-pacjenta.mdx (w oryginale są w samym MDX):
 * te same liczby z modułu src/data/poz.ts (wspólnego z rozkładem wynagrodzeń), tylko teksty po angielsku.
 * Treść artykułu: src/content/en/articles/primary-care-capitation.mdx.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import { AGE_WEIGHTS, LIST, RATE, RATE_HISTORY } from '@/data/poz';

export { AGE_WEIGHTS, LIST, RATE, RATE_HISTORY } from '@/data/poz';

/** grupy wieku z modułu polskiego → angielskie */
const AGE_GROUP: Record<string, string> = {
  'do 2. roku życia': 'up to age 2',
  '3–6 lat': 'aged 3–6',
  '7–19 lat': 'aged 7–19',
  '20–39 lat': 'aged 20–39',
  '40–65 lat': 'aged 40–65',
  '66–75 lat': 'aged 66–75',
  'powyżej 75 lat': 'over 75',
  'podopieczny DPS': 'care home (DPS) resident',
};
const ageGroup = (group: string) => {
  const en = AGE_GROUP[group];
  if (!en) throw new Error(`[en] brak angielskiej nazwy grupy wieku „${group}”`);
  return en;
};

export const change = (now: number, before: number) => (now === before ? '0%' : `+${formatEN((now / before - 1) * 100, 1)}%`);
export const weight = (w: number) => `×${formatEN(w, Math.max(1, String(w).split('.')[1]?.length ?? 0))}`;

export const first = RATE_HISTORY[0];
export const jumps = RATE_HISTORY.slice(1).map((r, i) => ({
  year: r.year,
  ratio: r.rate / RATE_HISTORY[i].rate,
  label: change(r.rate, RATE_HISTORY[i].rate),
}));
export const biggest = jumps.reduce((a, b) => (b.ratio > a.ratio ? b : a));

export const rateRows: BarRow[] = RATE_HISTORY.map((r, i) => ({
  label: String(r.year),
  note: i > 0 ? change(r.rate, RATE_HISTORY[i - 1].rate) : undefined,
  value: r.rate,
  display: formatEN(r.rate, 2),
  highlight: r.year === biggest.year,
}));

export const ageRows: BarRow[] = AGE_WEIGHTS.map((a) => ({
  label: ageGroup(a.group),
  note: weight(a.weight),
  value: a.weight * RATE.rate,
  display: formatEN(a.weight * RATE.rate),
}));

/** kapitacja lekarska z pełnej listy przy współczynniku 1,0 i przy średnim współczynniku wieku listy, zł/rok */
export const listYear = LIST.patients * RATE.rate;
export const listReal = listYear * LIST.avgWeight;
