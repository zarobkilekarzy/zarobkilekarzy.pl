/**
 * Wersja angielska modułu src/data/home.ts (strona /en/; oryginał: src/pages/index.astro i src/components/home/*):
 * te same kształty danych, liczby i zdjęcia importowane z modułu polskiego, teksty po angielsku — plus napisy
 * sekcji, które w PL stoją w komponentach strony głównej (`homeText`).
 * Listy zgodne z PL pozycja po pozycji (`aligned`): gdy PL doda albo usunie pozycję, EN pokazuje część wspólną
 * i ostrzega w buildzie — polskiej publikacji to nie blokuje.
 * Pominięte na /en/ (strony i materiały tylko po polsku): aktualności, mapa monitoringu, film z lektorem,
 * blok „Sprawdź sam” (egzamin LEK, symulatory, przeglądarka monitoringu).
 */
import type { BarRow, Link, PathCard, Stat, TextItem, Topic } from '@/types';
import {
  keyNumbers as keyNumbersPl,
  paths as pathsPl,
  principles as principlesPl,
  rights as rightsPl,
  steps as stepsPl,
  topics as topicsPl,
  waitingTimes as waitingTimesPl,
} from '@/data/home';
import { CURRENT } from '@/data/budzet-nfz';
import { bn, f1 } from '@/data/en/budzet-nfz';
import { HEADLINE } from '@/data/zarobki-ujawnione-listy';
import { eur, facilities } from '@/data/en/zarobki-ujawnione-listy';
import { formatEN } from '@/lib/format';

/** Dzień tłumaczenia stron /en/, /en/data/, /en/mechanisms/, /en/analysis/ (nota o tłumaczeniu). */
export const translatedOn = new Date('2026-10-27');

/** Pozycje PL i EN pod tymi samymi indeksami: pola EN nadpisują tekst, reszta (liczby, zdjęcia) z PL. */
function aligned<P extends object, E extends Partial<P>>(name: string, pl: P[], en: E[]): (P & E)[] {
  if (pl.length !== en.length) {
    console.warn(`[i18n] /en/: „${name}” ma ${pl.length} pozycji w PL i ${en.length} w EN — popraw src/data/en/home.ts`);
  }
  return pl.slice(0, en.length).map((p, i) => ({ ...p, ...en[i]! }));
}

export const heroPopular: Link[] = [
  { label: 'Hourly rates', href: '/en/data/doctor-pay-distribution/' },
  { label: 'Residents’ pay', href: '/en/data/residents-pay-by-specialty/' },
  { label: 'Contract or employment?', href: '/en/mechanisms/contract-vs-employment/' },
  { label: 'Patient rights', href: '#patient' },
];

export const keyNumbers: Stat[] = aligned('keyNumbers', keyNumbersPl, [
  { unit: 'PLN / month', desc: 'the highest public contract of a doctor — provincial hospitals in Mazovia, 2025', source: 'Rynek Zdrowia' },
  { unit: '%', desc: 'of specialists work on a B2B contract — nobody publishes the amounts of these contracts', source: 'Forms of employment' },
  { unit: 'months', desc: 'average wait for a specialist, although the NFZ budget has doubled in real terms since 2015', source: 'WHC Barometer 2025' },
  { unit: 'PLN bn', desc: 'of hospital debt — mostly related to wage costs', source: 'Debt of SPZOZ hospitals' },
]);

export const paths: PathCard[] = aligned('paths', pathsPl, [
  {
    kicker: 'I am a patient',
    title: 'Rights, queues and your account',
    desc: 'What you are entitled to at the doctor’s, how to check the visits billed in your Internet Patient Account (IKP) and where to report a breach — with the legal basis.',
    tags: ['Patient rights', 'IKP', 'Queues'],
    href: '#patient',
  },
  {
    kicker: 'I want to understand pay',
    title: 'How much we pay doctors, and for what',
    desc: 'From a resident’s salary to the top 1%. Employment, contracts, on-call duty and hourly rates in 29 specialties.',
    tags: ['Specialties', 'Contracts', 'On-call duty'],
    href: '#data',
  },
  {
    kicker: 'I am going to study medicine',
    title: 'The road to the profession, step by step',
    desc: 'Limits on places, the LEK exam, residency and the choice of specialty. What awaits you after the diploma and how long it takes.',
    tags: ['LEK', 'Residency', 'Limits'],
    // PL: blok „Sprawdź sam” z egzaminem i symulatorami — w EN go nie ma, więc dział analiz o kształceniu
    href: '/en/analysis/#ksztalcenie',
  },
]);

export const topics: Topic[] = aligned('topics', topicsPl, [
  { title: 'Contracts and employment', desc: '~73% of specialists bill as a business. What does that change?', href: '/en/mechanisms/contract-vs-employment/' },
  { title: 'On-call duty and multiple jobs', desc: 'Several facilities, several contracts — and nobody sees the total.', href: '/en/mechanisms/multiple-jobs-parallel-contracts/' },
  { title: 'Money and queues', desc: 'The NFZ budget is growing, waiting times are not shrinking. Why?', href: '/en/data/nfz-budget/#money-and-the-waiting-list' },
  { title: 'Access to the profession', desc: 'Limits on places and empty residencies. Where do the shortages come from?', href: '/en/mechanisms/restricted-access-to-the-profession/' },
]);

const SPECIALISTS: Record<string, string> = {
  Neurochirurg: 'Neurosurgeon',
  Endokrynolog: 'Endocrinologist',
  Gastroenterolog: 'Gastroenterologist',
  Kardiolog: 'Cardiologist',
  Okulista: 'Ophthalmologist',
};

export const waitingTimes: { rows: BarRow[]; max: number; average: number } = {
  ...waitingTimesPl,
  rows: waitingTimesPl.rows.flatMap((row) => {
    const label = SPECIALISTS[row.label];
    if (!label) {
      console.warn(`[i18n] /en/: specjalność „${row.label}” (waitingTimes) nie ma nazwy EN — popraw src/data/en/home.ts`);
      return [];
    }
    return [{ ...row, label, display: formatEN(row.value, 1) }];
  }),
};

/** Opis wykresu czasu oczekiwania dla czytników ekranu (w PL wpisany w komponent). */
export const waitingCaption = `Average wait for a specialist appointment under the NFZ: ${waitingTimes.rows
  .map((row, i) => `${row.label.toLowerCase()} ${row.display}${i === 0 ? ' months' : ''}`)
  .join(', ')}. Average for all specialties: ${formatEN(waitingTimes.average, 1)} months.`;

export const steps: TextItem[] = aligned('steps', stepsPl, [
  {
    title: 'We all pay.',
    text: `From our contributions and subsidies from the state budget, the NFZ plans to spend about PLN ${f1(CURRENT.costs)} billion (${eur(bn(CURRENT.costs))}) in 2026. A large part goes to hospitals and clinics, and from there — to pay.`,
  },
  {
    title: 'Nobody sees the total.',
    text: 'A doctor can work in several facilities at once — on an employment contract, a civil-law contract and on-call duty. Each pays separately, and nobody publishes the combined amount.',
  },
  {
    title: 'The solution is simple.',
    text: 'Every quarter, public data on total pay from facilities with an NFZ contract — under a permanent identifier, without names.',
  },
]);

export const rights: TextItem[] = aligned('rights', rightsPl, [
  { title: 'Information about your health', text: 'Clear and complete — including the prognosis and alternative treatments.' },
  { title: 'A second opinion', text: 'You can ask the doctor to consult another doctor.' },
  { title: 'Pain relief', text: 'The facility must assess your pain and relieve it.' },
  { title: 'Medical records', text: 'The first copy in the requested scope is free of charge.' },
]);

export const principles: TextItem[] = aligned('principles', principlesPl, [
  { title: 'A source for every figure', text: 'We link only to publicly available documents, data and replies to freedom-of-information requests.' },
  { title: 'An estimate is not a fact', text: 'We label every figure as exact or estimated. We leave empty fields empty — we do not guess.' },
  { title: 'Mechanisms, not names', text: 'We describe how the system works. We do not point to individual doctors and do not publish personal data.' },
  { title: 'The right to a correction', text: 'Spotted an error? Write to us. We correct the text and change the update date.' },
]);

/** Rekord na karcie „Record payments” (w PL wpisany w komponent): ta sama kwota co pierwsza liczba na start. */
const RECORD = keyNumbersPl[0]!.value;
/** Dług szpitali regionu z rekordem (w PL „1,4 mld zł” wpisane w komponent i w src/data/dane.ts). */
const REGION_DEBT = 1.4e9;

/** Napisy sekcji strony głównej (w PL wpisane w komponenty src/components/home/). */
export const homeText = {
  hero: {
    eyebrow: 'A guide to doctors’ work and pay in Poland',
    title: ['Doctors’ pay.', 'Calmly, with sources'],
    lead: 'We explain how public money flows from the health contribution to the doctor’s office — and what follows for patients. For every figure we give a source and say whether it is exact or an estimate.',
    primary: 'Start with the guide',
    secondary: 'Key data',
    popular: 'Frequently searched',
    photoAlt: 'A doctors’ room in a public hospital: a desk with medical records, a stethoscope and a white coat on a chair',
    badge: 'payroll entries in the database',
    stats: 'Four figures to start with',
    note: 'The English section is new. Each text is translated from Polish and checked against the original, which remains authoritative. Guides, tools and our demand are on the main site in Polish.',
    noteLink: 'Main site (in Polish)',
  },
  start: {
    eyebrow: 'Where to start',
    title: 'Three paths through the subject',
    aside: 'You do not have to read everything. Choose the starting point that suits you — each path leads from the basics to detailed data.',
  },
  latest: { eyebrow: 'New and updated', title: 'What’s new in the guide', all: 'All analysis' },
  perspectives: {
    title: ['One subject.', 'Many perspectives'],
    text: 'Patient, doctor, hospital director, payer. We show how a decision in one part of the system is felt in the others — we describe mechanisms, not individuals.',
    button: 'How the system works',
  },
  data: {
    eyebrow: 'Data',
    title: 'Figures worth knowing',
    aside: 'Selected indicators from our data sections. Each chart leads to the full dataset with its method and links to sources.',
    chart: {
      label: 'Waiting times · NFZ',
      title: 'How many months a patient waits for a specialist',
      unit: 'months',
      source: 'Source: Watch Health Care Foundation Barometer 2025',
      link: 'NFZ budget and queues',
    },
    lists: {
      label: `Public pay lists · ${facilities(HEADLINE.lists)}`,
      title: `${HEADLINE.over500kPct}% of payroll entries exceed PLN 500,000 a year`,
      positions: 'Payroll entries',
      over500k: 'Over PLN 500,000',
      over1m: 'Over PLN 1 million',
    },
    record: {
      label: 'Record payments',
      value: RECORD,
      unit: 'PLN / month',
      text: `The highest documented contract (${eur(RECORD)} a month) — in a region whose hospitals owe PLN 1.4 billion (${eur(REGION_DEBT)}). No names, from documents.`,
      link: 'All records',
    },
    sections: 'Data sections',
    all: 'All datasets',
  },
  explainer: { eyebrow: 'The subject in 30 seconds', title: 'Where does the whole dispute come from' },
  patient: {
    eyebrow: 'For patients',
    title: 'Know your rights at the doctor’s',
    lead: 'Short and to the point: what you are entitled to, on what basis and where to turn when something goes wrong.',
    photoAlt: 'A doctor goes over a printout of medical records with a patient',
    badge: { value: 'PLN 0', label: 'the first copy of your medical records', note: 'Article 28 of the Act on Patient Rights' },
    primary: 'Your rights as a patient',
    secondary: 'Printable card',
  },
  principles: { eyebrow: 'How we work', title: 'Principles you can trust', link: 'Methodology' },
};

/** Etykiety w spisie „Data sections” krótsze niż tytuł tłumaczenia (PL: `label` w dataSections, src/data/navigation.ts). */
export const dataSectionLabels: Record<string, string> = {
  'wedlug-specjalizacji': 'By specialty',
  'zarobki-lekarzy-polska-sasiedzi': 'Poland and its neighbours',
};
