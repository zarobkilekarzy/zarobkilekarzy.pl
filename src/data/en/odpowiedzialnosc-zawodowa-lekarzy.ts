/**
 * Wersja angielska modułu src/data/odpowiedzialnosc-zawodowa-lekarzy.ts: te same liczby (importowane),
 * tylko teksty po angielsku — nazwy kar, kraje, podpisy wykresów i mianowników.
 * Treść artykułu: src/content/en/articles/doctor-discipline-licence-revocation.mdx;
 * COUNTRY_EN czyta też components/odpowiedzialnosc-zawodowa-lekarzy/RevocationTable na stronie EN.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import {
  COUNTRIES,
  PENALTIES,
  PENALTIES_TOTAL,
  WINDOW,
  penalty,
  ratePer100k,
  type CountryKey,
} from '@/data/odpowiedzialnosc-zawodowa-lekarzy';

export {
  FIRST_INSTANCE,
  FIRST_INSTANCE_2000_2009,
  FIRST_INSTANCE_TOTAL,
  FIRST_YEAR,
  LAST_YEAR,
  LINKS,
  NO_DOCTORS,
  OROZ_CASES,
  OSL_CASES_2025,
  PENALTIES,
  PENALTIES_MILD,
  PENALTIES_TOTAL,
  PL_DOCTORS,
  PL_ONE_YEARS,
  PL_ZERO_YEARS,
  RATIO_ROUNDED,
  RATIO_UK,
  SE_DOCTORS_2025,
  UK_DOCTORS_2020,
  UK_DOCTORS_2024,
  WINDOW,
  YEARS_COUNT,
  firstInstance,
  plIn,
  rate,
  ratePer100k,
  share,
  total,
} from '@/data/odpowiedzialnosc-zawodowa-lekarzy';

const span = `${WINDOW.from}–${WINDOW.to}`;

/* ── Penalties (Article 83 of the Act on medical chambers) ───────────────────── */

/** nazwy kar z modułu polskiego → angielskie */
const PENALTY_EN: Record<string, string> = {
  'Upomnienie': 'Admonition',
  'Nagana': 'Reprimand',
  'Kara pieniężna': 'Fine',
  'Zakaz pełnienia funkcji kierowniczych': 'Ban on holding managerial positions',
  'Ograniczenie zakresu czynności': 'Restriction of the scope of practice',
  'Zawieszenie prawa wykonywania zawodu': 'Suspension of the licence to practise',
  'Pozbawienie prawa wykonywania zawodu': 'Revocation of the licence to practise',
};
const penaltyName = (name: string) => {
  const en = PENALTY_EN[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy kary „${name}”`);
  return en;
};

/** zakresy czasowe kar z modułu polskiego → angielskie */
const RANGE_EN: Record<string, string> = {
  '1–5 lat': '1–5 years',
  '6 mies. – 2 lata': '6 months – 2 years',
};
const rangeOf = (range?: string) => {
  if (!range) return undefined;
  const en = RANGE_EN[range];
  if (!en) throw new Error(`[en] brak angielskiego zakresu kary „${range}”`);
  return en;
};

/** liczby kar w oknie (te same wywołania co w polskim artykule) */
export const PENALTY_COUNT = {
  suspension: penalty('Zawieszenie prawa wykonywania zawodu'),
  revocation: penalty('Pozbawienie prawa wykonywania zawodu'),
  ban: penalty('Zakaz pełnienia funkcji kierowniczych'),
  restriction: penalty('Ograniczenie zakresu czynności'),
};

export const penaltyRows: BarRow[] = PENALTIES.rows.map((p) => ({
  label: penaltyName(p.name),
  note: rangeOf(p.range),
  value: p.n,
  display: formatEN(p.n),
  highlight: p.mild,
}));

export const PENALTY_MAX = Math.max(...PENALTIES.rows.map((p) => p.n));

export const penaltyCaption = `Penalties imposed by regional medical courts in ${PENALTIES.period}, ${formatEN(PENALTIES_TOTAL)} in total: ${PENALTIES.rows.map((p) => `${penaltyName(p.name).toLowerCase()} ${formatEN(p.n)}`).join(', ')}.`;

/* ── Countries compared ───────────────────────────────────────────────────────── */

const thousands = (n: number) => `about ${formatEN(Math.round(n / 1000) * 1000)}`;
const doctorsOf = (key: CountryKey) => COUNTRIES.find((c) => c.key === key)!.doctors;

export interface CountryEn {
  name: string;
  /** kto decyduje */
  body: string;
  doctorsLabel: string;
  doctorsNote: string;
}

export const COUNTRY_EN: Record<CountryKey, CountryEn> = {
  pl: {
    name: 'Poland', body: 'medical courts',
    doctorsLabel: formatEN(doctorsOf('pl')),
    doctorsNote: 'practising at the end of 2025, excluding dentists',
  },
  no: {
    name: 'Norway', body: 'state authority',
    doctorsLabel: thousands(doctorsOf('no')),
    doctorsNote: `employed, average for ${span}`,
  },
  se: {
    name: 'Sweden', body: 'state authority',
    doctorsLabel: thousands(doctorsOf('se')),
    doctorsNote: `employed in healthcare, estimated average for ${span}`,
  },
  uk: {
    name: 'United Kingdom', body: 'tribunal',
    doctorsLabel: thousands(doctorsOf('uk')),
    doctorsNote: `licensed, estimated average for ${span}`,
  },
};

/* ── Revocations per 100,000 doctors ──────────────────────────────────────────── */

export const RATES = { pl: ratePer100k('pl'), no: ratePer100k('no'), se: ratePer100k('se'), uk: ratePer100k('uk') };

const RATE_ORDER: CountryKey[] = ['no', 'se', 'uk', 'pl'];

export const rateRows: BarRow[] = RATE_ORDER.map((key) => ({
  label: COUNTRY_EN[key].name,
  note: COUNTRY_EN[key].body,
  value: RATES[key],
  display: `≈${formatEN(RATES[key], 1)}`,
  highlight: key === 'pl' ? true : undefined,
}));

export const RATE_MAX = Math.max(RATES.no, RATES.se);

export const rateCaption = `Revocations of doctors’ licences to practise, annual average per 100,000 doctors, ${span}: ${RATE_ORDER.map((key) => `${COUNTRY_EN[key].name} about ${formatEN(RATES[key], 1)}`).join(', ')}.`;
