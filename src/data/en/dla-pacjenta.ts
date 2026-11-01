/**
 * Wersja angielska modułu src/data/dla-pacjenta.ts (strona /en/for-patients/): te same zdjęcia, efekty i liczby, teksty po angielsku.
 * Zrzuty IKP są po polsku, więc polskie nazwy przycisków zostają w cudzysłowie z objaśnieniem.
 */
import type { Stop } from '@/data/dla-pacjenta';
import { ikpEnd as ikpEndPl, ikpSteps as ikpStepsPl, privateVisit as privateVisitPl, stops as stopsPl, triageBasis as triageBasisPl, waitSource as waitSourcePl, waitOptions as waitOptionsPl } from '@/data/dla-pacjenta';
import { SPECIALIST_ROWS } from '@/data/en/budzet-nfz';
import { routes } from '@/data/en/prawa-pacjenta';
import type { PathLinkEn } from '@/data/en/sciezki';
import { formatEN } from '@/lib/format';

export const pathPage = {
  title: 'For patients',
  docTitle: 'For patients: rights, queues, your account',
  eyebrow: 'Path · five situations',
  description: 'Five patient situations: what you are entitled to, how the emergency queue works, how to check your IKP, why you wait and where to go when something goes wrong.',
  lead: 'Five situations in which it helps to know where you stand. Choose yours or go through them in order. Each one has something you can check straight away.',
};

type StopText = Pick<Stop, 'short' | 'question' | 'lead' | 'badge'> & { entryText: string; main: PathLinkEn; more: PathLinkEn[] };

const TEXT: Record<string, StopText> = {
  prawa: {
    short: 'My rights',
    question: 'What am I entitled to',
    lead: 'Patient rights are easiest to check on specific questions, and each answer cites the article of the act. See how many you know before you read the whole page.',
    entryText: 'A short test: each answer cites the article of the act.',
    badge: { value: 'PLN 0', label: 'first copy of your medical records', note: 'Article 28 of the Act on patient rights' },
    main: { href: '/en/patient-rights/', label: 'Patient rights — and where to report a breach' },
    more: [{ href: '/en/patient-rights/print/', label: 'Pocket card to print' }],
  },
  pilnie: {
    short: 'Urgent',
    question: 'How does the emergency department queue work',
    lead: 'The order depends on your state of health, not on when you arrived. After an initial assessment, called triage, you get one of five urgency categories, and each has a longest permitted time to a doctor.',
    entryText: 'How many people are waiting now and the longest you may wait after triage.',
    badge: { value: '5', label: 'urgency categories, each with its own time limit', note: 'regulation on emergency departments' },
    main: { href: '/en/patient-rights/emergency-department/', label: 'Emergency department queues, live' },
    more: [],
  },
  konto: {
    short: 'My account',
    question: 'Is everything right on my account',
    lead: 'The National Health Fund (NFZ) pays for an entry in the system, not for the visit as such. You can check refunded visits from 2008 onwards in your Internet Patient Account (IKP). Below you can see the way there step by step before you log in.',
    entryText: 'See step by step how to reach your visit history in the Internet Patient Account (IKP).',
    badge: { value: '>1,600', label: 'justified patient reports about IKP entries in 2024', note: 'NFZ via Rynek Zdrowia' },
    main: { ref: 'fikcyjne-wizyty' },
    more: [],
  },
  kolejka: {
    short: 'Waiting',
    question: 'Why am I waiting so long',
    lead: 'Costs in the NFZ plan have roughly doubled since 2015 after inflation, and the average wait has grown by about 43%. Money alone cannot quickly be turned into doctors: it takes 11 to 13 years from admission to medical school to the specialist title, and shortages concern specific places and fields. Those who do not want to wait pay at the private practice next door.',
    entryText: 'Choose a specialist and see when the average wait would get you an appointment.',
    badge: { value: formatEN(waitOptionsPl[0].value, 1), label: 'months on average for a specialist appointment', note: 'WHC Barometer, Sep/Oct 2025' },
    main: { ref: 'wizyty-prywatne-kolejka-cena' },
    more: [
      { ref: 'budzet-nfz', anchor: '#money-and-the-waiting-list', label: 'NFZ budget and queues, year by year' },
      { ref: 'dlaczego-brakuje-lekarzy' },
      { ref: 'publiczna-prywatna-ochrona-zdrowia' },
      { ref: 'poz-pieniadz-za-pacjenta' },
      { ref: 'apteka-pieniadz-publiczny' },
    ],
  },
  skarga: {
    short: 'Something went wrong',
    question: 'Where do I take this',
    lead: 'Institutions do not pass cases on to each other, and a report sent to the wrong address is lost. Each situation shows who will deal with it. Expand it to see how much time you have and what it costs.',
    entryText: 'Each case has its own address: who deals with it and how much time you have.',
    badge: { value: String(routes.length), label: 'situations, each with its own address', note: 'full description on the patient rights page' },
    main: { href: '/en/patient-rights/#what-happened', label: 'Where to report a breach of patient rights' },
    more: [
      { ref: 'jak-dzialaja-sady-lekarskie' },
      { ref: 'odpowiedzialnosc-zawodowa-lekarzy' },
      { href: '/sad-lekarski/', label: 'Game: do you rule like a medical court?', polish: true },
    ],
  },
};

export const stops = stopsPl.map((stop) => {
  const text = TEXT[stop.id];
  if (!text) throw new Error(`[en] brak tłumaczenia sekcji „${stop.id}”`);
  const { entryText, ...rest } = text;
  return { ...stop, ...rest, entry: { ...stop.entry, text: entryText } };
});

/** Te same pytania co po polsku, w kolejności testu; id strony EN są po angielsku. */
export const QUIZ_IDS = ['consent', 'second-opinion', 'parent-with-child', 'someone-with-you', 'dignity', 'pain'];

export const triageNotes = [
  'A patient in a more serious condition will go ahead of others, even if they arrived later.',
  'After triage, staff are required to tell you your assigned category, the number of people ahead of you and the longest expected waiting time.',
  'Staff reassess those waiting at least every 90 minutes, and the category may change. If you feel worse, say so straight away.',
  'The emergency department may refer you to primary care, including night and holiday care. The rules are set out in the hospital’s regulations.',
];
export const triageBasis = { label: 'regulation on hospital emergency departments, § 6(9–14)', href: triageBasisPl.href };

const IKP_TEXT = [
  {
    tip: 'Zaloguj się',
    text: 'Go to pacjent.gov.pl (in Polish) and choose “Zaloguj się” (log in). You confirm your identity with a trusted profile (“profil zaufany”), in the mObywatel app, with an e-ID or through your bank.',
    alt: 'The pacjent.gov.pl home page. In the top right corner, a blue “Zaloguj się” (log in) button.',
  },
  {
    tip: 'Zobacz',
    text: 'Find the “Historia leczenia” (treatment history) tile and click “Zobacz” (view).',
    alt: 'IKP tiles after logging in. The “Historia leczenia” (treatment history) tile includes, among other things, the visit history; below it, a “Zobacz” (view) button.',
  },
  {
    tip: 'Zobacz',
    text: 'In the “Świadczenia w ramach Narodowego Funduszu Zdrowia” (services under the NFZ) section, open “Historia wizyt” (visit history). It lists visits refunded by the NFZ from 2008 onwards, with the cost of the refund.',
    alt: 'The “Świadczenia w ramach Narodowego Funduszu Zdrowia” (services under the NFZ) section with a “Historia wizyt” (visit history) tile and a “Zobacz” (view) button.',
  },
  {
    tip: 'Szczegóły',
    text: 'Look for facilities you do not know, dates when you did not see a doctor, and services you paid for privately that nevertheless appear as refunded. “Szczegóły” (details) shows what was billed and for how much.',
    alt: 'The “Twoje wizyty” (your visits) list: outpatient visits with dates and “Szczegóły” (details) buttons.',
  },
];

export const ikpSteps = ikpStepsPl.map((step, i) => ({ ...step, ...IKP_TEXT[i] }));

export const ikpEnd = {
  title: 'Does an entry not add up?',
  text: 'In “Szczegóły” (details), choose “Zgłoś nieprawidłowość” (report an irregularity), fill in your contact details and send it. The report goes to the regional NFZ branch.',
  check: 'First rule out two false alarms: a teleconsultation is also recorded as a visit, and with subcontracting another facility’s name may appear even though the date is right.',
  source: { label: 'NFZ via Rynek Zdrowia', href: ikpEndPl.source.href },
};

export const waitOptions = [
  { label: 'Average', value: waitOptionsPl[0].value },
  ...SPECIALIST_ROWS.map((r) => ({ label: r.label, value: r.value })),
];
export const waitSource = { label: 'WHC Barometer, Sep/Oct 2025', href: waitSourcePl.href };
export const waitWhy = [
  { label: 'NFZ budget and queues', href: '/en/data/nfz-budget/#money-and-the-waiting-list' },
  { label: 'Why Poland is short of doctors', href: '/en/analysis/why-poland-is-short-of-doctors/' },
];
export const privateVisit = {
  ...privateVisitPl,
  source: { label: 'Statistics Poland (GUS), Local Data Bank', href: privateVisitPl.source.href },
};
