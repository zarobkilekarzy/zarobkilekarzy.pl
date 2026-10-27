/**
 * Wersja angielska src/data/postulat.ts: ramka postulatu pod tekstami angielskimi (site/PostulatCta)
 * i strona /en/demand/ (src/pages/en/demand/index.astro + dwujęzyczne components/postulat/*).
 * Te same eksporty i typy co moduł PL; liczby, adresy i dokładność (accuracy) importowane z modułu PL,
 * tu tylko tekst. Etapy projektu ustawy — tłumaczenie `stages` z src/data/projekt-ustawy.ts (po etykiecie PL;
 * nowy etap bez tłumaczenia zostaje po polsku, a strona dostaje ramkę „nieaktualne” z rejestru src/i18n/pages.json).
 *
 * UWAGA: moduł czyta też site/PostulatCta na KAŻDEJ stronie (także polskiej) — bez `throw` na poziomie modułu.
 */
import type { Stage, Stat } from '@/types';
import * as pl from '@/data/postulat';
import { projekt as projektPl, stages as stagesPl } from '@/data/projekt-ustawy';
import { getRates } from '@/i18n/rates';
import { eurApprox, ratesNote, withEur, type MoneyOptions } from '@/i18n/money';
import { formatDateIn } from '@/lib/format';

const rates = await getRates();
const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);

/** Linijka o kursie euro pod treścią strony (jak w artykułach — layouts/ArticleLayout). */
export const ratesLine = ratesNote(rates, formatDateIn(new Date(rates.date), 'en'));

/** Ramka postulatu pod tekstami angielskimi (site/PostulatCta) — tłumaczenie `postulat`. */
export const postulat = {
  label: 'Editorial position',
  title: 'Public amounts, protected names',
  text: 'We call on the state to publish, every quarter, the total pay of each person working in facilities with a National Health Fund (NFZ) contract — summed across all their workplaces, under a permanent identifier instead of a name.',
  primary: { label: 'Our demand', href: '/en/demand/' },
};

export const postulatPage: typeof pl.postulatPage = {
  eyebrow: 'Our demand',
  title: 'Public amounts, protected names',
  docTitle: 'Our demand: public NFZ pay, no names',
  lead: 'We call for the total pay of each person working in facilities with a National Health Fund (NFZ) contract to be public: summed across all their workplaces, published every quarter as open data, under a permanent identifier instead of a name.',
  description: 'We call for public total pay of each person in facilities with an NFZ contract: from all workplaces, every quarter, under an identifier instead of a name.',
  quote: 'The point is not how much a doctor earns, but that nobody knows.',
};

/** Kotwice sekcji strony EN (PL: #problem, #postulat, #bez-nazwisk, #identyfikator, #droga, #dowody, #zarzuty). */
export const sectionIds = {
  problem: 'problem',
  postulat: 'demand',
  bezNazwisk: 'without-names',
  identyfikator: 'identifier',
  droga: 'route',
  dowody: 'evidence',
  zarzuty: 'objections',
};

/* ---------- Problem ---------- */

/** Kroki wyliczenia (PL: problem.finding.steps) — po kolei; liczba, dokładność i adres z modułu PL. */
const STEPS_EN = [
  {
    label: `of doctors earn more than ${pln(100_000)} a month in a single facility — about 560 people (in another statement the president of AOTMiT spoke of about 1.5%)`,
    sourceLabel: 'Rynek Zdrowia, 17.06.2026 (in Polish)',
  },
  {
    label: 'is what it could be after adding up one person’s payments from many facilities, estimates the president of AOTMiT',
    sourceLabel: 'Rynek Zdrowia, 17.06.2026 (in Polish)',
  },
];

export const problem: typeof pl.problem = {
  title: 'Each facility sees only its own piece',
  paragraphs: [
    'A doctor can work at the same time in a hospital, in an outpatient clinic and on on-call shifts in another town — as an employee, as a contractor and under a civil-law contract. Each facility pays separately and knows only its own part. Nobody adds up the total amount from public money: neither the NFZ nor the Agency for Health Technology Assessment and Tariff System (AOTMiT), which — as its president admits — has no data linking one person’s pay across facilities.',
  ],
  finding: {
    steps: pl.problem.finding.steps.map((step, i) => {
      const t = STEPS_EN[i];
      return t ? { ...step, label: t.label, source: { ...step.source, label: t.sourceLabel } } : step;
    }),
    result: {
      text: `With about 140,000 active doctors, that means 7,000 to 14,000 people with an income of more than ${pln(1_000_000, { scale: 'million', decimals: 0 })} a year, not the roughly 600 talked about until now.`,
      source: { ...pl.problem.finding.result.source, label: 'Rynek Zdrowia calculation, 31.08.2026 (in Polish)' },
    },
  },
  contracts: {
    title: 'Public contracts are not yet a public total',
    text: `Contracts concluded from 1 July 2026 by public finance sector units go into the Central Register of Contracts (Centralny Rejestr Umów; hospitals run as companies are outside the sector). At the end of August it held 54 contracts for healthcare services worth more than ${pln(1_000_000, { scale: 'million', decimals: 0 })}, some of them with individual medical practices. But the register shows individual contracts, not people: a doctor may have several, so still nobody sees the total for one person.`,
    source: { ...pl.problem.contracts.source, label: 'Rynek Zdrowia, 31.08.2026 (in Polish)' },
  },
};

/* ---------- Co postulujemy ---------- */

export const demands: typeof pl.demands = [
  {
    title: 'Every quarter, by law',
    text: 'Facilities with an NFZ contract submit pay data regularly, not at the minister’s request — including data on people working under civil-law contracts and as subcontractors.',
  },
  {
    title: 'One person, one identifier',
    text: 'The state replaces the PESEL number (the Polish national identification number) with a permanent pseudonym. The same person always has the same identifier, so their pay from many facilities can be added up.',
  },
  {
    title: 'Open data',
    text: 'For each identifier: the total amount and the number of facilities that pay, and broken down by facility — pay, working time, form of employment and specialisation.',
  },
  {
    title: 'A penalty for silence',
    text: 'A facility that fails to submit data, or submits unreliable data, pays a fine of up to 0.5% of the value of its NFZ contracts.',
  },
];

export const disclosure: typeof pl.disclosure = {
  public: {
    title: 'Public',
    note: 'because it is public spending',
    items: [
      'the total pay of one person from all facilities',
      'the number of facilities that pay them',
      'broken down by facility: pay, working time, form of employment, specialisation',
    ],
  },
  protected: {
    title: 'Protected',
    note: 'because they are not needed to scrutinise the spending',
    items: [
      'first name and surname',
      'PESEL number and licence to practise (PWZ) number',
      'titles, position, education',
      'address, assets, family data, patient data',
      'income from outside facilities with an NFZ contract',
    ],
  },
};

export const notDemanded: string =
  'We do not want to publish names or private data, and we do not judge specific people — we describe mechanisms. Honest doctors gain from transparency: they stop being lumped together with the abuses of a minority.';

/* ---------- Dlaczego bez nazwisk ---------- */

export const withoutNames: typeof pl.withoutNames = {
  title: 'Why without names',
  lead: 'The first version of our demand — and the petition of July 2026 — envisaged a register by name, searchable by licence to practise (PWZ) number. We have changed that. Scrutinising public money requires the total and its structure, not the name.',
  reasons: [
    {
      title: 'What matters is visible.',
      text: 'Under a permanent identifier you can see accumulated jobs and contracts, pay spikes and hours that cannot possibly be worked. None of this requires knowing who the person is.',
    },
    {
      title: 'Only the data that is necessary.',
      text: 'The GDPR requires data to be processed only to the extent necessary for the purpose (Article 5(1)(c)). The purpose is to scrutinise spending, not to judge people — and publication without names is easier to defend.',
    },
    {
      title: 'Mechanisms, not names.',
      text: 'This is how we have written about healthcare from the start: we do not attack people by name. The demand is now consistent with that principle and gives no grounds for the argument that it is about a public pillory.',
    },
  ],
};

/* ---------- Jak działa identyfikator ---------- */

export const identifier: typeof pl.identifier = {
  title: 'Like a number plate',
  lead: 'Anyone can see a number plate, but only an authorised institution, such as the police, can find out who owns the car. The identifier in pay data works the same way: anyone will see how much one person receives and from how many facilities, but who that person is can be established only by the body that holds the key.',
  analogy: {
    car: { title: 'Car', plate: pl.identifier.analogy.car.plate },
    pay: { title: 'Pay' },
    rows: [
      { label: 'Visible to everyone', car: 'the number on the plate', pay: 'a permanent identifier instead of a name' },
      { label: 'What it shows', car: 'that it is the same car — where it goes and how often', pay: 'that it is the same person — how much they receive and from how many facilities' },
      { label: 'Who can establish identity', car: 'only authorised institutions, e.g. the police in the vehicle database', pay: 'only the body with the key (the e-Health Centre, Centrum e-Zdrowia)' },
    ],
  },
};

/** Przykład pseudonimizacji — numer i algorytm z modułu PL; klucz pokazowy po angielsku (identyfikator liczy build). */
export const pseudonymDemo: typeof pl.pseudonymDemo = {
  title: 'Example: from a PWZ number to an identifier',
  intro: 'A cryptographic function with a secret key turns the number into a string of characters. Enter any seven-digit number and see how it behaves. The calculation happens in your browser — nothing is sent.',
  pwz: pl.pseudonymDemo.pwz,
  key: 'demo-key',
  algorithm: pl.pseudonymDemo.algorithm,
  algorithmNote: 'The draft act does not prescribe the algorithm. HMAC-SHA-256 (RFC 2104, FIPS 198-1) is a standard example of a hash function with a secret key.',
  properties: [
    { ok: true, title: 'Same number, same identifier.', text: 'That is why one person’s payments from many facilities can be added up.' },
    { ok: true, title: 'One digit different, a completely different result.', text: 'The identifiers do not reveal which numbers are similar to each other.' },
    { ok: false, title: 'The number cannot be recovered from the identifier.', text: 'The function works one way: there is no formula that would calculate the PWZ number from the result.' },
  ],
  whyKey: {
    title: 'Why a secret key',
    text: 'There are at most 10 million PWZ numbers. Anyone could compute an ordinary hash without a key for all of them — a laptop does it in a few seconds — and read from the resulting table who is who. With a key, only the body that holds it can build such a table — like the police, who alone can look up a number plate in the vehicle database.',
  },
  basis: 'In the draft act, the identifier is based on the PESEL number or, where there is none, on the PWZ number (Article 27a(5)). The principle is the same.',
};

/* ---------- Droga do ustawy ---------- */

export const route: typeof pl.route = {
  title: 'The state has taken half a step',
  text: 'The Act of 19 June 2026 (Dz.U. 2026 item 972, Journal of Laws) allowed the Minister of Health to require facilities to provide pay data linked to the PESEL number and the PWZ number. But it has three limitations: data are collected only at the minister’s request, nothing is published, and there is no penalty for failing to comply. Our draft removes these limitations by adding two points to Article 27a.',
};

/** Projekt ustawy: opis karty „Bieżąca forma” (PL: `projekt.kind`, `projekt.scope` z src/data/projekt-ustawy.ts). */
export const projekt = {
  ...projektPl,
  kind: 'Citizens’ working draft',
  scope: 'Article 27a(1a) and (5)–(7)',
};

/** Etapy projektu (StatusTrack) — tłumaczenie po etykiecie PL; daty, stan i odnośniki z modułu PL. */
const STAGE_EN: Record<string, { label: string; note?: string }> = {
  'Projekt roboczy': { label: 'Working draft', note: `version ${projektPl.version}` },
  'Weryfikacja prawna': { label: 'Legal review', note: 'questions in Annex B (in Polish)' },
  'Poparcie 15 posłów': { label: 'Support of 15 MPs', note: 'Article 32(2) of the Rules of Procedure of the Sejm' },
  'Złożenie u Marszałka Sejmu': { label: 'Submission to the Marshal of the Sejm', note: 'with an explanatory memorandum and regulatory impact statement' },
  'Opinie i pierwsze czytanie': { label: 'Opinions and first reading' },
};

export const stages: Stage[] = stagesPl.map((s) => {
  const t = STAGE_EN[s.label];
  return t ? { ...s, label: t.label, note: t.note } : s;
});

export const currentStage = stages.find((s) => s.state === 'current') ?? stages[stages.length - 1];

/* ---------- Dowody ---------- */

/** Liczby (PL: evidence) — po kolei; wartość, przedrostek, dokładność i adres z modułu PL, tu tylko tekst. */
const EVIDENCE_EN: ((stat: Stat) => Partial<Stat>)[] = [
  () => ({
    desc: 'of specialists work under contracts, which are easy to combine across many facilities at once',
    source: 'Gazeta Prawna (in Polish)',
  }),
  (stat) => ({
    unit: 'PLN',
    desc: `the highest disclosed contract per month (${eurApprox(stat.value, 'PLN', rates)}) — in a region whose hospitals have ${pln(1_400_000_000, { scale: 'billion' })} of debt`,
    source: 'Menedżer Zdrowia (in Polish)',
  }),
  (stat) => ({
    unit: 'thousand PLN',
    desc: `median annual income from work of doctor-councillors for 2025 (${eurApprox(stat.value * 1000, 'PLN', rates)}) — each amount checked against an asset declaration (113 declarations)`,
    source: 'zarobkilekarzy.pl, analysis of declarations',
    href: '/en/analysis/doctor-councillors-public-income/',
  }),
  () => ({
    desc: 'of respondents chose transparency of doctors’ contracts — more often than a ban on private practice or pay limits',
    source: 'UCE Research for Onet (in Polish)',
  }),
];

export const evidence: typeof pl.evidence = pl.evidence.map((stat, i) => ({ ...stat, ...EVIDENCE_EN[i]?.(stat) }));

/* ---------- Zarzuty ---------- */

export const objections: typeof pl.objections = [
  {
    question: 'Does publication require the doctor’s consent?',
    answer: [
      'No. Consent is only one of six legal bases for processing data. The GDPR also allows processing when it is necessary for compliance with a legal obligation (Article 6(1)(c)) or for the performance of a task carried out in the public interest (Article 6(1)(e)). The draft act provides such a basis.',
    ],
  },
  {
    question: 'Is the identifier still personal data?',
    answer: [
      'For the body that holds the key — yes. That is why only that body keeps the key, and the published data contain no first name, surname, PESEL number or PWZ number.',
      'Whether the identifier is personal data also for the recipients of the open data is one of the questions the draft refers for legal review (recital 26 of the GDPR). The act provides the basis for publication whatever the answer.',
    ],
  },
  {
    question: 'Could someone be recognised in a small hospital?',
    answer: [
      'That risk exists: specialisation broken down by facility can point to the only such person on a ward. The draft treats this as an open question and considers a threshold — for example, not publishing a specialisation held by fewer than 5 people in a facility.',
    ],
  },
  {
    question: 'Isn’t this an attack on doctors?',
    answer: [
      'No. Pay in public administration and the asset declarations of people holding public office are already public. Money from the health contribution should not be an exception. The demand does not concern names, and transparency protects honest doctors from collective suspicion.',
    ],
  },
];

export const programNote: string =
  'Other changes that follow from the same data — from working-time records to medical courts — we collect separately, outside our demand.';

/* ---------- Petycja a obecny postulat (archiwum) ---------- */

export const evolution: typeof pl.evolution = {
  columns: ['', 'Petition (July 2026)', 'Our demand today'],
  rows: [
    { cells: ['Who an entry concerns', 'a specific doctor, by public PWZ number', 'a permanent identifier — without first name, surname or PWZ number'] },
    { cells: ['Search', 'by PWZ number and by facility', 'open data to download; no searching for a person'] },
    { cells: ['Scope', 'amounts from NFZ funds, eventually all public funds', 'pay in facilities with an NFZ contract'] },
    { cells: ['Route', 'petition to the Minister of Health and the Senate', 'draft act submitted by 15 MPs'] },
  ],
};
