/**
 * Wersja angielska modułu src/data/specjalizacja-lekarska.ts: te same liczby (importowane), tylko teksty i zapis
 * liczb po angielsku. Artykuł EN (src/content/en/articles/specialist-training-for-doctors.mdx) importuje stąd
 * to samo, co PL z modułu polskiego.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { PES_2025, pesYear } from '@/data/odsiew-na-medycynie';
import {
  COUNTRIES as COUNTRIES_PL,
  DURATIONS as DURATIONS_PL,
  FIELDS,
  IN_TRAINING as IN_TRAINING_PL,
  LINKS,
  PES_ORAL as PES_ORAL_PL,
  pesAttempts as pesAttemptsPl,
  pesRows,
} from '@/data/specjalizacja-lekarska';

export { BUDGET, FIELDS, IN_TRAINING_2022, LINKS } from '@/data/specjalizacja-lekarska';

const share = (part: number, whole: number) => (part / whole) * 100;
const pct = (v: number) => formatEN(v, 1);

/* ── Czas trwania ───────────────────────────────────────────────────────────── */

const DURATION_LABELS = ['4 years', '4.5 years (radiology and diagnostic imaging)', '5 years', '6 years'];

export const durationRows = [
  ...DURATIONS_PL.map((d, i) => ({ label: DURATION_LABELS[i], value: d.value, display: formatEN(d.value) })),
  { label: 'only after another specialty', value: FIELDS.afterOther, display: formatEN(FIELDS.afterOther), kind: 'mid' as const, note: 'from 6 to 10 years including the earlier specialty' },
];

export const fiveOrSix = { count: 33 + 18, share: formatEN(share(33 + 18, FIELDS.all), 1) };

/* ── Inne kraje ──────────────────────────────────────────────────────────────── */

const COUNTRY_NAMES = ['Poland', 'Czechia', 'Germany', 'Sweden'];

export const countryColumns = COUNTRIES_PL.map((c, i) => ({
  label: COUNTRY_NAMES[i],
  value: c.start,
  display: formatEN(c.start),
  pair: { value: c.all, display: formatEN(c.all) },
}));

/* ── Liczba lekarzy w szkoleniu ─────────────────────────────────────────────── */

export const IN_TRAINING = { ...IN_TRAINING_PL, date: '30 September 2025' } as const;

/* ── Programy ───────────────────────────────────────────────────────────────── */

export const PROGRAMS_TABLE: CompareTable = {
  columns: ['', 'General surgery', 'Internal medicine', 'Cardiology', 'Family medicine'],
  rows: [
    { cells: ['Length of training', '6 years (2 + 4)', '5 years (2 + 3)', '5 years (2 years of internal medicine + 3)', '4 years, one module'] },
    { cells: ['Courses', '12 courses, 31 days', '12 courses, 41 days', '28 courses, 63 days', '16 courses, 60 days'] },
    {
      cells: [
        'Procedures performed independently, examples',
        '500 operations, including 65 inguinal hernia repairs and 60 on the bile ducts',
        '30 ECGs with assessment, 20 bladder catheterisations and 10 pleural punctures in the basic module',
        '200 ECGs and 200 transthoracic echocardiograms in the cardiology module',
        '10 home visits to newborns, 10 check-ups in the first year of life, 2 certifications of death',
      ],
      marked: true,
    },
    { cells: ['On-call duty in the programme', 'an average of 10 hours 5 minutes a week', 'an average of 10 hours 5 minutes a week', 'an average of 10 hours 5 minutes a week', 'the programme does not specify it'] },
  ],
};

export const programSources = [
  { label: 'CMKP, specialist training programme in general surgery (2023, in Polish)', href: LINKS.surgery },
  { label: 'CMKP, specialist training programme in internal medicine (2024 update, in Polish)', href: LINKS.internal },
  { label: 'CMKP, specialist training programme in cardiology (2024 update, in Polish)', href: LINKS.cardiology },
  { label: 'CMKP, specialist training programme in family medicine (2023, in Polish)', href: LINKS.family },
];

/* ── PES ────────────────────────────────────────────────────────────────────── */

const last = pesRows[pesRows.length - 1];
export const pesLatest = { when: `In spring ${last.sub}`, rate: pct(last.rate), firstRate: pct(last.firstRate) };

const yearLabel = (label: string) => label.replace('wiosna', 'spring');

export const pesAttempts = pesAttemptsPl.map((y) => ({ ...y, label: yearLabel(y.label) }));

export const pesAttemptColumns = pesAttempts.map((y) => ({
  label: y.label,
  value: y.first,
  display: `${pct(y.first)}%`,
  pair: { value: y.repeat, display: `${pct(y.repeat)}%` },
}));

export const pesAttemptRange = {
  first: [pct(Math.min(...pesAttempts.map((y) => y.first))), pct(Math.max(...pesAttempts.map((y) => y.first)))],
  repeat: [pct(Math.min(...pesAttempts.map((y) => y.repeat))), pct(Math.max(...pesAttempts.map((y) => y.repeat)))],
};

export const pes2025 = pesAttempts.find((y) => y.label === '2025')!;

const FIELD_NAMES: Record<string, string> = {
  'Medycyna rodzinna': 'family medicine',
  'Choroby wewnętrzne': 'internal medicine',
  Pediatria: 'paediatrics',
  Psychiatria: 'psychiatry',
  Anestezjologia: 'anaesthesiology',
  'Położnictwo i ginekologia': 'obstetrics and gynaecology',
  Kardiologia: 'cardiology',
};
const fieldRates = PES_2025.map((d) => ({ in: FIELD_NAMES[d.field], rate: pesYear(d).rate })).sort((a, b) => a.rate - b.rate);
export const pesFields = {
  low: { in: fieldRates[0].in, rate: pct(fieldRates[0].rate) },
  high: { in: fieldRates[fieldRates.length - 1].in, rate: pct(fieldRates[fieldRates.length - 1].rate) },
};

const ORAL_SESSIONS = ['in autumn 2025', 'in spring 2026'];
export const PES_ORAL = PES_ORAL_PL.map((o, i) => ({ session: ORAL_SESSIONS[i], rate: pct(share(o.passed, o.n)) }));
