/**
 * Wersja angielska modułu src/data/specjalizacja-lekarska.ts: te same liczby (importowane), tylko teksty i zapis
 * liczb po angielsku. Artykuł EN (src/content/en/articles/specialist-training-for-doctors.mdx) importuje stąd
 * to samo, co PL z modułu polskiego.
 */
import type { CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import type { ProgramPlan } from '@/data/specjalizacja-lekarska';
import { PES_2025, pesYear } from '@/data/odsiew-na-medycynie';
import {
  COUNTRIES as COUNTRIES_PL,
  DURATIONS as DURATIONS_PL,
  FIELDS,
  IN_TRAINING as IN_TRAINING_PL,
  LINKS,
  PES_ORAL as PES_ORAL_PL,
  PLACES_2026,
  PROGRAM_PLANS as PROGRAM_PLANS_PL,
  twoFieldsNonRezShare as twoFieldsNonRezSharePl,
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

/* ── Miejsca szkoleniowe ─────────────────────────────────────────────────────── */

const PLACE_NAMES = ['Internal medicine', 'Family medicine', 'Paediatrics', 'Emergency medicine', 'General surgery'];

export const twoFieldsNonRezShare = twoFieldsNonRezSharePl;

export const placesColumns = PLACES_2026.top.map((f, i) => ({
  label: PLACE_NAMES[i],
  value: f.rez,
  display: formatEN(f.rez),
  pair: { value: f.nonRez, display: formatEN(f.nonRez) },
}));

export { PLACES_2026 };

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

/* Przebieg programów: te same dni co w PL, tylko nazwy; brak nazwy w słowniku zatrzymuje build. */
const PLAN_NAMES: Record<string, string> = {
  'Chirurgia ogólna': 'General surgery',
  'Choroby wewnętrzne': 'Internal medicine',
  Kardiologia: 'Cardiology',
  'Medycyna rodzinna': 'Family medicine',
  'Moduł podstawowy': 'Basic module',
  'Moduł podstawowy: choroby wewnętrzne': 'Basic module: internal medicine',
  'Moduł specjalistyczny': 'Specialist module',
  'Moduł jednolity': 'Single module',
  'Staż podstawowy': 'Basic placement',
  Kursy: 'Courses',
  Samokształcenie: 'Self-study',
  'Urlopy i dni wolne': 'Leave and days off',
  'Ortopedia i traumatologia': 'Orthopaedics and traumatology',
  'Anestezjologia i intensywna terapia': 'Anaesthesiology and intensive care',
  'Chirurgia laparoskopowa': 'Laparoscopic surgery',
  'Poradnia chirurgii ogólnej': 'General surgery outpatient clinic',
  'Szpitalny oddział ratunkowy': 'Hospital emergency department',
  Ultrasonografia: 'Ultrasonography',
  'Chirurgia naczyniowa': 'Vascular surgery',
  Endoskopia: 'Endoscopy',
  'Chirurgia nowotworów': 'Cancer surgery',
  Neurotraumatologia: 'Neurotraumatology',
  'Chirurgia klatki piersiowej': 'Thoracic surgery',
  Urologia: 'Urology',
  'Chirurgia ogólna w innym ośrodku': 'General surgery at another centre',
  'Intensywna opieka medyczna': 'Intensive medical care',
  'Choroby płuc': 'Pulmonology',
  Gastroenterologia: 'Gastroenterology',
  Endokrynologia: 'Endocrinology',
  Nefrologia: 'Nephrology',
  Hematologia: 'Haematology',
  Reumatologia: 'Rheumatology',
  'Choroby zakaźne': 'Infectious diseases',
  'Medycyna paliatywna': 'Palliative medicine',
  Psychiatria: 'Psychiatry',
  'Intensywna terapia kardiologiczna': 'Cardiac intensive care',
  'Elektrofizjologia i elektroterapia': 'Electrophysiology and electrotherapy',
  'Kardiologia interwencyjna': 'Interventional cardiology',
  Echokardiografia: 'Echocardiography',
  'Kardiologia dziecięca': 'Paediatric cardiology',
  'Wady serca u dorosłych': 'Heart defects in adults',
  Kardiochirurgia: 'Cardiac surgery',
  'Nieinwazyjna diagnostyka elektrokardiograficzna': 'Non-invasive electrocardiographic diagnostics',
  'Radiologia i diagnostyka obrazowa': 'Radiology and diagnostic imaging',
  Angiologia: 'Angiology',
  Diabetologia: 'Diabetology',
  Pediatria: 'Paediatrics',
  Neonatologia: 'Neonatology',
  Geriatria: 'Geriatrics',
  Dermatologia: 'Dermatology',
  Otorynolaryngologia: 'Otorhinolaryngology',
};

const planName = (name: string) => {
  const en = PLAN_NAMES[name];
  if (!en) throw new Error(`Brak angielskiej nazwy w PLAN_NAMES: ${name}`);
  return en;
};

export const PROGRAM_PLANS: ProgramPlan[] = PROGRAM_PLANS_PL.map((plan) => ({
  ...plan,
  name: planName(plan.name),
  modules: plan.modules.map((m) => ({
    ...m,
    name: planName(m.name),
    parts: m.parts.map((part) => ({
      ...part,
      name: planName(part.name),
      year: part.year?.replace('rok', 'year').replace('lub', 'or'),
    })),
  })),
}));

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
