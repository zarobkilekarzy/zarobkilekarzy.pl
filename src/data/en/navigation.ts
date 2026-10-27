/**
 * Nawigacja stron angielskich (/en/…). W menu są tylko działy, które mają wersję angielską (src/pages/en/{data,mechanisms,analysis}/);
 * linki do stron tylko po polsku mają dopisek „(in Polish)”.
 */
import type { Link, NavGroup, SearchDoc } from '@/types';

const x: Link = { label: 'X @ZarobkiLekarzy', href: 'https://x.com/ZarobkiLekarzy' };

export const mainNav: Link[] = [
  { label: 'Home', href: '/en/' },
  { label: 'Data', href: '/en/data/', match: '/en/data/' },
  { label: 'Mechanisms', href: '/en/mechanisms/', match: '/en/mechanisms/' },
  { label: 'Analysis', href: '/en/analysis/', match: '/en/analysis/' },
  { label: 'For patients', href: '/en/patient-rights/', match: '/en/patient-rights/' },
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
      { label: 'Source code (GitHub)', href: 'https://github.com/zarobkilekarzy/zarobkilekarzy.pl' },
      { label: 'Support the project on Suppi', href: 'https://suppi.pl/zarobkilekarzy' },
    ],
  },
];

/** Cele wyszukiwarki EN spoza artykułów (lib/search/build-en.ts); id jak w polskim searchExtras, gdy strona ma odpowiednik. */
export const searchExtras: SearchDoc[] = [
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
