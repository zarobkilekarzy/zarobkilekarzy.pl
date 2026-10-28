/**
 * Wersja angielska src/data/o-serwisie.ts (strona /en/about/). Te same typy i ta sama kolejność zasad;
 * adres kontaktowy importowany z modułu polskiego. Serwis jest anonimowy — żadnych nazwisk, firm ani osób w treści.
 */
import type { TextItem } from '@/types';
import { contact, legalPages as legalPagesPl } from '@/data/o-serwisie';

export { contact };

export const legalPages: typeof legalPagesPl = {
  prywatnosc: {
    title: 'Privacy',
    docTitle: 'Privacy policy',
    lead: 'We do not run user accounts, do not use cookies and do not collect personal data. Here we describe everything that happens to data while you use the site.',
    leadNewsletter: 'We do not run user accounts and do not use cookies. The only personal data we accept are the addresses of people who have signed up for the newsletter. Here we describe everything that happens to data.',
    description: 'Privacy policy of zarobkilekarzy.pl: no accounts or cookies, aggregate Cloudflare analytics, settings stored only in your browser.',
    updated: '16.10.2026',
  },
  oProjekcie: {
    title: 'About the project',
    docTitle: 'About: aims, principles and corrections',
    lead: 'A citizens’ site about how public money flows through healthcare in Poland — from the health contribution to salaries. We criticise mechanisms, not the profession.',
    description: 'Why zarobkilekarzy.pl was set up, how the texts are made, where the money comes from, the principles by which we choose sources, and how to report an error.',
    updated: '28.10.2026',
  },
};

/** Editorial principles — the same four as in the Polish version, in the same order. */
export const editorialRules: TextItem[] = [
  {
    title: 'A source for every number',
    text: 'We use only publicly available documents, data and replies to requests for access to public information (FOI). Every number has a footnote with a link, so you can check it yourself.',
  },
  {
    title: 'An estimate is not a fact',
    text: 'We mark data as exact or estimated and do not mix the two categories. When something is not known, we say that it is not known — we do not guess.',
  },
  {
    title: 'Mechanisms, not names',
    text: 'We describe how the system works. We do not point to individual doctors and do not publish personal data. The exception is the roll-call results of votes in the Sejm (the lower house of the Polish parliament), which we show from the Sejm’s official data, without comment on the MPs.',
  },
  {
    title: 'Quotation within the law',
    text: 'We quote short passages and link to the original. We write our texts in our own words.',
  },
];
