/**
 * Glob płac lekarzy, podatek dochodowy, wersja angielska: teksty do src/data/swiat/podatki.ts (opis skali krajowej
 * i dopiski). Stawki, lata i adresy przepisów biorą się z modułu polskiego; tutaj tylko tekst i nazwa przepisu.
 * Te same klucze co w module polskim.
 */
import type { TaxText } from '@/lib/swiat/types';

type Text = Omit<TaxText, 'href'>;

export const taxNationalEn: Record<string, Text> = {
  '158': {
    text: 'Scale 5–40%; top rate 40% — on taxable income (after exemptions and deductions) above 4,980,000 TWD a year.',
    law: 'Income Tax Act, Art. 5; Ministry of Finance notice of 28 November 2024 (2025 brackets) (in Chinese)',
  },
  '076': {
    text: 'Scale 7.5–27.5%; top rate 27.5% — on the tax base (after deductions, including social contributions) above 4,664.68 BRL a month.',
    law: 'Law 11.482/2007, Art. 1, as amended by Law 15.191/2025 (in Portuguese)',
  },
  '643': {
    text: 'Scale 13–22%; top rate 22% — on income above 50,000,000 RUB a year.',
    law: 'Tax Code of Russia, Art. 224(1), as amended by Federal Law No. 176-FZ of 12 July 2024 (in Russian)',
  },
  '112': {
    text: 'Rate 13%, and 25% on income above 220,000 BYN a year.',
    law: 'Tax Code of Belarus, Art. 214(8) (Ministry of Taxes commentary, in Russian)',
  },
  '398': {
    text: 'Flat rate 10%.',
    law: 'Tax Code of Kazakhstan of 25 December 2017, Art. 320(1) (in Russian)',
  },
};

/** te same zdania w tej samej kolejności co w module polskim */
export const taxNotesEn: Record<string, Text[]> = {
  '616': [
    {
      text: 'A doctor on a contract (sole proprietorship) may choose the lump-sum tax instead: 14% of revenue, with no deduction of costs (since 2022).',
      law: 'Lump-Sum Income Tax Act, Art. 12(1)(2a)(a) (in Polish)',
    },
    {
      text: 'The Ministry of Finance does not say how many doctors choose the lump-sum tax — only the number of taxpayers at the whole 14% rate, which is shared with architectural and engineering services: 99,490 in 2024.',
      law: 'Ministry of Finance, Information on the lump-sum tax on recorded revenue for 2024 (in Polish)',
    },
  ],
};
