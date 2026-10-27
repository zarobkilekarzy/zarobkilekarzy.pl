/**
 * Wersja angielska modułu src/data/odsiew-na-medycynie.ts: te same liczby (importowane), tylko teksty
 * po angielsku. Wykresy LEK i rachunek PWZ rysują dwujęzyczne components/odsiew-na-medycynie/*.astro,
 * które biorą stąd nazwy uczelni (schoolEN), etykietę wartości (lekDisplayEN) i kroki rachunku (LEDGER_EN).
 * Treść artykułu: src/content/en/articles/medical-school-dropouts-and-emigration.mdx.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import {
  FATES_2016,
  FIRST_YEAR,
  GRADUATES_PL,
  NIL_FIRST_YEAR,
  NO_ZUS,
  PWZ_26_30,
  START_2018,
  firstSemesterPoles,
  firstYearRows as firstYearRowsPL,
  foreignLanguage,
  foreigners,
  funnelRows as funnelRowsPL,
  graduatesPoles,
  limitTotal,
  noZusRows as noZusRowsPL,
  noZusShare,
  rate,
  seatsForPoles,
  type LedgerKind,
} from '@/data/odsiew-na-medycynie';

export { LINKS, LEDGER_TOTALS, NIL_MEDIANS } from '@/data/odsiew-na-medycynie';

const MINUS = '−';
const share = (part: number, whole: number) => (part / whole) * 100;
/** 16.73 → „16.7%” */
const pct = (v: number, decimals = 1) => `${formatEN(v, decimals)}%`;
/** Liczba ze znakiem: −9314 → „−9,314”, 974 → „+974”, 0.0 → „0.0” (jak `signed` w module polskim) */
const signed = (v: number, decimals = 0) => {
  const abs = formatEN(Math.abs(v), decimals);
  if (Number(abs.replace(/,/g, '')) === 0) return abs;
  return `${v < 0 ? MINUS : '+'}${abs}`;
};

/* ── Universities: Polish short names from the Polish module → English ────────── */

/** Nazwy, jakich uczelnie używają po angielsku (spójne z src/data/en/english-division.ts). */
const SCHOOL: Record<string, string> = {
  WUM: 'Medical University of Warsaw',
  'UWM w Olsztynie': 'University of Warmia and Mazury in Olsztyn',
  'Uniwersytet w Siedlcach': 'University of Siedlce',
  'AMiSNS w Elblągu': 'Academy of Applied Medical and Social Sciences in Elbląg',
  'UKSW w Warszawie': 'Cardinal Stefan Wyszyński University in Warsaw',
  UKSW: 'Cardinal Stefan Wyszyński University in Warsaw',
  'Uniwersytet Warszawski': 'University of Warsaw',
  'UM we Wrocławiu': 'Wroclaw Medical University',
  'UJK w Kielcach': 'Jan Kochanowski University in Kielce',
  'UM w Białymstoku': 'Medical University of Bialystok',
  'UM w Łodzi': 'Medical University of Lodz',
  'Uniwersytet Rzeszowski': 'University of Rzeszów',
  'Uniwersytet Radomski': 'Radom University',
  'ŚUM w Katowicach': 'Medical University of Silesia in Katowice',
  'UM w Poznaniu': 'Poznan University of Medical Sciences',
  'PUM w Szczecinie': 'Pomeranian Medical University in Szczecin',
  'Uniwersytet Opolski': 'University of Opole',
  'Politechnika Wrocławska': 'Wrocław University of Science and Technology',
  'UJD w Częstochowie': 'Jan Długosz University in Częstochowa',
  'CM UMK (Bydgoszcz)': 'Collegium Medicum UMK (Bydgoszcz)',
  'CM UJ (Kraków)': 'Jagiellonian University CM (Kraków)',
  'UM w Lublinie': 'Medical University of Lublin',
  'Krakowska Akademia AFM': 'Andrzej Frycz Modrzewski Krakow University',
  'Uniwersytet Zielonogórski': 'University of Zielona Góra',
  'GUMed (Gdańsk)': 'Medical University of Gdańsk',
  'Akademia Śląska': 'Silesian Academy (Akademia Śląska)',
};
export const schoolEN = (name: string) => {
  const en = SCHOOL[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy uczelni „${name}”`);
  return en;
};

/* ── 1. Removed in the first year (POL-on) ────────────────────────────────────── */

export const firstYearRows: BarRow[] = firstYearRowsPL.map((r, i) => ({
  ...r,
  note: `· foreigners ${pct(rate(FIRST_YEAR[i].foreign))}`,
  display: pct(r.value),
}));

/* ── 3. NIL “Barometr 25”: no promotion after the first year, by university ──── */

const NIL_NOTE: Record<string, string> = { 'razem z English Division': 'with English Division' };

export const nilRows: BarRow[] = NIL_FIRST_YEAR.map((u) => ({
  label: schoolEN(u.school),
  note:
    [u.type === 'nowa' ? 'new' : '', u.note ? (NIL_NOTE[u.note] ?? u.note) : ''].filter(Boolean).map((t) => `· ${t}`).join(' ') ||
    undefined,
  value: u.value,
  display: `${u.value}%`,
  highlight: u.type === 'nowa',
}));

/* ── 4. LEK: university score relative to the session average ────────────────── */

/** Etykieta wartości: „+6.2”, „−16.4”, „0.0”. */
export const lekDisplayEN = (diff: number) => signed(diff, 1);

/* ── 5. Graduates’ careers (POL-on × ZUS × NFZ), Poles ───────────────────────── */

const yearsAfter = [2, 3, 4, 5, 6];

export const noZusRows: BarRow[] = noZusRowsPL.map((r, i) => {
  const k = yearsAfter[i];
  return {
    ...r,
    label: `${k} years after graduation`,
    note: `· ${NO_ZUS['2016/17'].end + k}`,
    display: pct(r.value),
  };
});

export const noZusNote =
  `2016/17 cohort, graduates of Polish nationality: share of people for whom no payer paid a contribution in the given year. ` +
  `The year of graduation and the internship year are visible in younger cohorts: 2018/19 — ${pct(noZusShare('2018/19', 0))} and ${pct(noZusShare('2018/19', 1))}, ` +
  `2020/21 — ${pct(noZusShare('2020/21', 0))} and ${pct(noZusShare('2020/21', 1))}. ` +
  `This is an upper bound on emigration: it also includes career breaks, leave and gaps in the data.`;

/* ── 6. For every 100 who start ───────────────────────────────────────────────── */

const FUNNEL_TEXT = [
  { label: 'Start medical school', note: `· ${formatEN(START_2018)} Poles in the first semester of 2018/19` },
  { label: 'Graduate on time', note: `· ${formatEN(GRADUATES_PL['2023/24'])} graduates in 2023/24` },
  { label: 'Pay ZUS contributions in Poland', note: `· ${pct(share(FATES_2016.zus, FATES_2016.graduates))} of graduates after 6 years` },
  { label: 'Work in a healthcare provider', note: `· ${pct(share(FATES_2016.clinics, FATES_2016.graduates))}` },
  { label: 'Treat patients under NFZ contracts', note: `· ${pct(share(FATES_2016.nfz, FATES_2016.graduates))}` },
];

export const funnelRows: BarRow[] = funnelRowsPL.map((r, i) => ({
  ...r,
  ...FUNNEL_TEXT[i],
  display: formatEN(r.value),
}));

/* ── 7. From a university place to a licence to practise ─────────────────────── */

/** Te same kroki i ta sama arytmetyka co LEDGER w module polskim. */
export const LEDGER_EN: { label: string; note?: string; value: string; kind: LedgerKind }[] = [
  { kind: 'start', label: 'Admission limits 2015/16–2019/20', note: 'five regulations of the Minister of Health', value: formatEN(limitTotal) },
  {
    kind: 'step',
    label: 'Places in programmes taught in a foreign language and the pool for foreigners',
    note: `${formatEN(foreignLanguage)} and ${formatEN(foreigners)}; their graduates usually leave Poland`,
    value: signed(-(foreignLanguage + foreigners)),
  },
  { kind: 'subtotal', label: 'Places in Polish for Poles', value: formatEN(seatsForPoles) },
  {
    kind: 'step',
    label: 'There were more Poles in the first semester than such places',
    note: 'among others, students repeating the first year and Poles in English-language programmes',
    value: signed(firstSemesterPoles - seatsForPoles),
  },
  { kind: 'subtotal', label: 'Poles in the first semester in those years', note: 'POL-on', value: formatEN(firstSemesterPoles) },
  { kind: 'step', label: 'Did not graduate on time', value: signed(graduatesPoles - firstSemesterPoles) },
  { kind: 'subtotal', label: 'Polish graduates 2020/21–2024/25', note: 'POL-on; 2024/25 may be incomplete', value: formatEN(graduatesPoles) },
  {
    kind: 'step',
    label: 'Graduates outside the 26–30 age group or without a licence to practise',
    note: 'net of doctors with foreign degrees — these groups cannot be separated',
    value: signed(PWZ_26_30 - graduatesPoles),
  },
  { kind: 'result', label: 'Doctors with a licence to practise aged 26–30', note: 'NIL, 30.06.2026', value: formatEN(PWZ_26_30) },
];
