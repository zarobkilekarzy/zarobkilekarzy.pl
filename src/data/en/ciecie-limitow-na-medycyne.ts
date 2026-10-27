/**
 * Wersja angielska modułu src/data/ciecie-limitow-na-medycyne.ts: te same liczby (importowane), tylko
 * teksty po angielsku. Limit łączny i część po polsku — z LIMITS w data/english-division.ts, jak w module polskim.
 * Treść artykułu: src/content/en/articles/cutting-medical-school-places.mdx.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import { limitOf } from '@/data/english-division';
import { AGE, BEFORE, dayRows as dayRowsPL } from '@/data/ciecie-limitow-na-medycyne';

export { CUT_PCT, LINKS, RECOVERY, gapOlder, gapYounger } from '@/data/ciecie-limitow-na-medycyne';

/** Limit łączny w roku akademickim, w zapisie angielskim: „10,730” */
export const total = (year: string) => formatEN(limitOf(year).total);
/** Część po polsku (limit łączny bez puli w języku obcym): „8,892” */
export const polish = (year: string) => formatEN(limitOf(year).total - limitOf(year).foreign);

/* ── Poland: places in full-time (formerly “day”) programmes in Polish ────────── */

const FIRST_YEAR_PRESS = '· first-year places, according to the press';
const REGULATION = '· regulation of the Minister of Health';

/** Etykiety z modułu polskiego (rok) → dopisek i, gdzie trzeba, słowny zapis wartości. */
const DAY_TEXT: Record<string, { note: string; display?: string }> = {
  '1987': { note: FIRST_YEAR_PRESS, display: `over ${formatEN(BEFORE)}` },
  '1990': { note: FIRST_YEAR_PRESS, display: 'about 3,300' },
  '1994–2000': { note: '· according to the press, no annual data', display: 'just over 2,000' },
  '2003': { note: '· day programmes, according to the press' },
  '2005': { note: '· full-time programmes' },
  '2010': { note: '· full-time programmes' },
  '2015/16': { note: REGULATION },
  '2019/20': { note: REGULATION },
  '2022/23': { note: REGULATION },
  '2023/24': { note: `${REGULATION}, first year above 6,000` },
  '2026/27': { note: REGULATION },
};

export const dayRows: BarRow[] = dayRowsPL.map((r) => {
  const text = DAY_TEXT[r.label];
  if (!text) throw new Error(`[en] brak angielskiego opisu wiersza „${r.label}”`);
  return { ...r, note: text.note, display: text.display ?? formatEN(r.value) };
});

/* ── The gap in the register: practising doctors by age ───────────────────────── */

export const ageRows: BarRow[] = AGE.map((a) => ({
  label: `aged ${a.group}`,
  note: `· studies from about ${a.start}`,
  value: a.value,
  display: formatEN(a.value),
  highlight: a.group === '46–50',
}));
