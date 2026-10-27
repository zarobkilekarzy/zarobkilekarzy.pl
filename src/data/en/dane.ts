/**
 * Wersja angielska modułu src/data/dane.ts (strona /en/data/; oryginał: src/pages/dane/index.astro):
 * opisy działów, kluczowe liczby i napisy układu, które w PL stoją w stronie. Liczby kart (`keyNumbers`)
 * mają `of` — wartość w module polskim; gdy polska liczba się zmieni, karta EN znika (ostrzeżenie w buildzie)
 * do czasu poprawki tutaj. Działy i materiały — src/data/en/spis.ts.
 */
import type { DATA_TOPICS, KeyNumber, TopicInfo } from '@/types';
import { danePage as danePagePl, keyNumbers as keyNumbersPl } from '@/data/dane';

export const danePage = {
  title: 'Data',
  /** tytuł w karcie i wynikach wyszukiwania (PL: wpisany w stronę) */
  docTitle: 'Data: doctors’ pay and the NFZ budget',
  eyebrow: 'Figures',
  lead: 'We compile public spending, pay and patients’ access to care. There is one rule: no figure without a source. We label each one as exact or as an estimate, and we do not mix the two.',
  description: 'Doctors’ pay, the NFZ budget, hospital debt and queues in figures. Every number has a source and a label: exact or estimate — never mixed.',
  flagship: danePagePl.flagship,
  note: 'We do not publish figures “from memory”. Until a field has a source, it stays marked “—”.',
};

/** Napisy układu strony (w PL wpisane w stronę). */
export const labels = {
  meta: { items: 'Datasets', sections: 'Sections', updated: 'Updated' },
  jump: 'Sections',
  noun: ['dataset', 'datasets', 'datasets'] as [string, string, string],
  howToRead: 'How to read these data',
  tools: {
    eyebrow: 'Tools',
    title: 'Check for yourself',
    aside: 'Interactive tools based on open data. No login, no collection of answers.',
  },
  numbers: {
    eyebrow: 'To start with',
    title: (count: string) => `${count} figures that show the scale`,
    aside: 'The strongest data from across the site. Click any of them to go deeper — with the full breakdown and sources.',
  },
};

export const dataTopics: Record<(typeof DATA_TOPICS)[number], TopicInfo> = {
  wynagrodzenia: {
    label: 'Pay',
    lead: 'From a resident’s salary to the top 1% — employment, contracts, rates and records, from documents.',
  },
  finanse: {
    label: 'Public money',
    lead: 'The NFZ budget, hospital debt and what the patient in the queue gets for that money.',
  },
  zawod: {
    label: 'The road to the profession',
    lead: 'The LEK exam, residency and 29 specialties — pay, places and competition.',
  },
  kadry: {
    label: 'Workforce and comparisons',
    lead: 'Nurses, paramedics, diagnosticians — and Poland next to Czechia, Germany and Austria.',
  },
};

type KeyNumberRef = Omit<KeyNumber, 'href' | 'target'> & { ref: string };

/** Kolejność i odnośniki jak w module polskim; `of` = wartość karty w PL. */
const KEY_NUMBERS: (Omit<KeyNumberRef, 'ref'> & { of: string })[] = [
  { of: '300 tys.', value: '300,000', unit: 'PLN / day', desc: 'A neurosurgeon’s record day (an allegation — the case is ongoing).' },
  { of: '316 079', value: '316,079', unit: 'PLN / month', desc: 'The highest contract — in a region whose hospitals owe PLN 1.4 billion.' },
  { of: '0', value: '0', unit: 'registers', desc: 'Public registers that add up the payments to one doctor. This is the heart of the problem.' },
  { of: '~73%', value: '~73%', unit: 'on contracts', desc: 'Specialists are paid under civil-law contracts — and nobody adds up the payments to one person.' },
  { of: '4,2', value: '4.2', unit: 'months', desc: 'The average wait for a specialist appointment (WHC Barometer 2025), although NFZ costs in the plan have doubled in real terms since 2015.' },
  { of: '40,8', value: '40.8', unit: 'PLN bn', desc: 'Debt of public hospitals in mid-2026 — it goes mainly on wages paid “on credit”.' },
  { of: '2,15', value: '2.15', unit: 'PLN m / year', desc: 'The highest annual income from work of a doctor-councillor in the asset declarations for 2025 that we checked.' },
  { of: '5,9', value: '5.9', unit: 'nurses / 1,000', desc: 'Nurses per 1,000 population — against 9.2 on average in the OECD.' },
];

export const keyNumbers: KeyNumberRef[] = keyNumbersPl.flatMap((pl, i) => {
  const en = KEY_NUMBERS[i];
  if (!en || en.of !== pl.value) {
    console.warn(`[i18n] /en/data/: kluczowa liczba nr ${i + 1} („${pl.value}”) nie ma wersji EN — popraw src/data/en/dane.ts`);
    return [];
  }
  return [{ value: en.value, unit: en.unit, desc: en.desc, ref: pl.ref }];
});

/**
 * Cele kart bez tłumaczenia: strona tylko po polsku z angielską nazwą („(in Polish)”).
 * Cel bez tłumaczenia i bez wpisu tutaj — karta znika ze strony EN.
 */
export const polishTargets: Record<string, string> = {
  'projekt-nowelizacji-art-27a': 'Draft amendment to Article 27a',
};
