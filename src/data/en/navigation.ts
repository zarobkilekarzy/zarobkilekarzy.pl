/**
 * Nawigacja stron angielskich (/en/…). W menu są tylko działy, które mają wersję angielską (src/pages/en/{data,mechanisms,analysis}/);
 * linki do stron tylko po polsku mają dopisek „(in Polish)”.
 */
import type { Link, NavGroup, SearchDoc } from '@/types';

const x: Link = { label: 'X @ZarobkiLekarzy', href: 'https://x.com/ZarobkiLekarzy' };
const youtube: Link = { label: 'YouTube @ZarobkiLekarzy', href: 'https://www.youtube.com/@ZarobkiLekarzy' };
const tiktok: Link = { label: 'TikTok @zarobkilekarzy.pl', href: 'https://www.tiktok.com/@zarobkilekarzy.pl' };

export const mainNav: Link[] = [
  { label: 'Home', href: '/en/' },
  { label: 'Data', href: '/en/data/', match: '/en/data/' },
  { label: 'Mechanisms', href: '/en/mechanisms/', match: '/en/mechanisms/' },
  { label: 'Analysis', href: '/en/analysis/', match: '/en/analysis/' },
  { label: 'For patients', href: '/en/for-patients/', match: '/en/for-patients/', also: '/en/patient-rights/' },
];

export const topbarLinks: Link[] = [{ label: 'Polish site', href: '/' }, x];

export const footerNav: NavGroup[] = [
  {
    title: 'In English',
    links: [
      { label: 'Home', href: '/en/' },
      { label: 'Data', href: '/en/data/' },
      { label: 'Mechanisms', href: '/en/mechanisms/' },
      { label: 'Analysis', href: '/en/analysis/' },
      { label: 'For patients', href: '/en/for-patients/' },
      { label: 'How much we pay', href: '/en/how-much-we-pay/' },
      { label: 'The road to the profession', href: '/en/road-to-the-profession/' },
      { label: 'Patient rights', href: '/en/patient-rights/' },
      { label: 'Emergency department queues', href: '/en/patient-rights/emergency-department/' },
      { label: 'Glossary', href: '/en/glossary/' },
      { label: 'Main site (in Polish)', href: '/' },
    ],
  },
  {
    title: 'The project',
    links: [
      { label: 'About the project', href: '/en/about/' },
      { label: 'News', href: '/en/news/' },
      { label: 'Common objections', href: '/en/faq/' },
      { label: 'Our demand', href: '/en/demand/' },
      { label: 'Principles', href: '/en/about/#principles' },
      { label: 'Corrections', href: '/en/about/#corrections' },
    ],
  },
  {
    title: 'Community',
    links: [
      x,
      youtube,
      tiktok,
      { label: 'Source code (GitHub)', href: 'https://github.com/zarobkilekarzy/zarobkilekarzy.pl' },
      { label: 'Support the project on Suppi', href: 'https://suppi.pl/zarobkilekarzy' },
    ],
  },
];

/** Cele wyszukiwarki EN spoza artykułów (lib/search/build-en.ts); id jak w polskim searchExtras, gdy strona ma odpowiednik. */
export const searchExtras: SearchDoc[] = [
  // strony-ścieżki: przystanki jako sekcje
  {
    id: 'dla-pacjenta',
    title: 'For patients: rights, queues, your account',
    category: 'For patients',
    href: '/en/for-patients/',
    summary: 'Five patient situations: what you are entitled to, how the emergency queue works, how to check your IKP, why you wait and where to go when something goes wrong.',
    keywords: ['patient', 'complaint', 'where to report', 'triage', 'IKP', 'waiting time', 'helpline'],
    sections: [
      { title: 'What am I entitled to?', anchor: 'prawa' },
      { title: 'How does the emergency department queue work?', anchor: 'pilnie' },
      { title: 'Is everything right on my account?', anchor: 'konto' },
      { title: 'Why am I waiting so long?', anchor: 'kolejka' },
      { title: 'Where do I take this?', anchor: 'skarga' },
    ],
  },
  {
    id: 'ile-placimy',
    title: 'How much we pay Polish doctors, and for what',
    category: 'Data',
    href: '/en/how-much-we-pay/',
    summary: 'From the health contribution to a doctor’s pay in four stops. Totals are visible at each of them, but the total for one person is public at none.',
    keywords: ['health contribution', 'contribution calculator', 'NFZ budget', 'lump sum', 'contract', 'who can see the total'],
    sections: [
      { title: 'Where does this money come from?', anchor: 'skladka' },
      { title: 'What happens to it in the NFZ?', anchor: 'plan' },
      { title: 'What does the NFZ pay a hospital for?', anchor: 'rozliczenie' },
      { title: 'How much of it does a doctor get?', anchor: 'wyplata' },
    ],
  },
  {
    id: 'droga-do-zawodu',
    title: 'The road to becoming a doctor in Poland',
    category: 'Analysis',
    href: '/en/road-to-the-profession/',
    summary: 'It takes 11 to 13 years from admission to medical school to the specialist title. Admissions, studies, the LEK with the internship, and specialist training.',
    keywords: ['medicine', 'thresholds', 'admissions', 'matura', 'internship', 'residency', 'how long specialist training takes', 'PES'],
    sections: [
      { title: 'How to get in?', anchor: 'rekrutacja' },
      { title: 'What the studies involve?', anchor: 'studia' },
      { title: 'What comes after the diploma?', anchor: 'staz' },
      { title: 'What to become and how long it takes?', anchor: 'specjalizacja' },
    ],
  },
  { id: 'postulat', title: 'Our demand: public amounts, protected names', category: 'Our demand', href: '/en/demand/', keywords: ['demand', 'transparency', 'register', 'pseudonym', 'permanent identifier', 'draft act', 'GDPR'] },
  {
    id: 'prawa-pacjenta',
    title: 'Patient rights in Poland, explained',
    category: 'For patients',
    href: '/en/patient-rights/',
    keywords: ['patient rights', 'complaint', 'Patient Ombudsman', 'RPP', 'helpline', 'medical records', 'compensation', 'Fund', 'NFZ'],
    sections: [
      { title: 'At the doctor’s and in hospital', anchor: 'now' },
      { title: 'Your medical records', anchor: 'documents' },
      { title: 'What happened?', anchor: 'what-happened' },
      { title: 'How much time you have', anchor: 'deadlines' },
      { title: 'The Fund or the court?', anchor: 'fund' },
      { title: 'Pocket card', anchor: 'print' },
    ],
  },
  { id: 'kolejki-sor', title: 'Emergency department queues, live', category: 'For patients', href: '/en/patient-rights/emergency-department/', keywords: ['emergency department', 'ED', 'A&E', 'SOR', 'queue', 'waiting time', 'hospital'] },
  { id: 'faq', title: 'Common objections to pay transparency', category: 'About', href: '/en/faq/', keywords: ['FAQ', 'objections', 'questions', 'populism', 'GDPR', 'OECD'] },
  { id: 'o-projekcie', title: 'About the project: aims, principles, corrections', category: 'About', href: '/en/about/', keywords: ['contact', 'correction', 'methodology', 'principles', 'who runs'] },
  { id: 'slownik', title: 'Glossary: contract, capitation, lump sum, standby', category: 'Glossary', href: '/en/glossary/', keywords: ['glossary', 'terms', 'definitions', 'abbreviations'] },
];
