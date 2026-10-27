/**
 * Wersja angielska modułu src/data/zarobki-lekarzy-polska-sasiedzi.ts: te same liczby (importowane),
 * tylko teksty po angielsku. Kwoty z tabel płac: euro bez przeliczenia, korony — z euro w nawiasie
 * po kursie z buildu (src/i18n/rates.ts), a nie po kursie z 15.10.2026 z wersji polskiej.
 * Treść artykułu: src/content/en/articles/doctor-salaries-poland-vs-neighbours.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur } from '@/i18n/money';
import { DENSITY, DENSITY_EU, DENSITY_OECD, RATIO, RATIO_OECD, TARIFFS, type Tariff } from '@/data/zarobki-lekarzy-polska-sasiedzi';

export { LINKS, RATIO_MAX, DENSITY_MAX, DENSITY_OECD } from '@/data/zarobki-lekarzy-polska-sasiedzi';

const rates = await getRates();

/** nazwy krajów z modułu polskiego → angielskie */
const COUNTRY: Record<string, string> = {
  Polska: 'Poland',
  Niemcy: 'Germany',
  Czechy: 'Czechia',
  Austria: 'Austria',
  Szwecja: 'Sweden',
};
const country = (name: string) => {
  const en = COUNTRY[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy kraju „${name}”`);
  return en;
};

/* ── Pay as a multiple of the average wage (OECD) ─────────────────────────────── */

export const ratioRows: BarRow[] = [
  ...RATIO.map((r) => ({
    label: country(r.country),
    note: r.year ? `${r.year} data` : undefined,
    value: r.value,
    display: `${formatEN(r.value, 1)}×`,
    highlight: r.country === 'Polska',
  })),
  { label: 'Average of 31 OECD countries', value: RATIO_OECD, display: `${formatEN(RATIO_OECD, 1)}×`, secondary: true },
];

export const ratioCaption = `Average pay of salaried specialists as a multiple of the average wage in the country, 2023: ${RATIO.map((r) => `${country(r.country)} ${formatEN(r.value, 1)}${r.year ? ` (${r.year})` : ''}`).join(', ')}; OECD average ${formatEN(RATIO_OECD, 1)}.`;

/* ── Practising doctors per 1,000 population (OECD) ───────────────────────────── */

export const densityRows: BarRow[] = DENSITY.map((r) => ({
  label: country(r.country),
  note: r.year ? `${r.year} data` : undefined,
  value: r.value,
  display: formatEN(r.value, 1),
  highlight: r.country === 'Polska',
}));

export const densityCaption = `Practising doctors per 1,000 population, 2023: ${DENSITY.map((r) => `${country(r.country)} ${formatEN(r.value, 1)}${r.year ? ` (${r.year})` : ''}`).join(', ')}; OECD average ${formatEN(DENSITY_OECD, 1)}, EU average ${formatEN(DENSITY_EU, 1)}.`;

/* ── What is public: overview of five countries ───────────────────────────────── */

/** Rows ordered from the narrowest to the broadest scope of transparency, as in the Polish table. */
export const OVERVIEW_TABLE: CompareTable = {
  columns: ['', 'Pay of a doctor in a public hospital', 'What is public', 'What remains hidden'],
  rows: [
    {
      cells: [
        'Poland',
        'Employment contract with a statutory minimum, or a civil-law contract at a rate agreed with the hospital',
        'The statutory minimum, resident doctors’ pay set by regulation, medians from a one-off AOTMiT compilation',
        'Contract rates and the total paid to one person by several facilities',
      ],
      marked: true,
    },
    {
      cells: [
        'Czechia',
        'A tarif from a government pay table in public facilities; contractual pay in companies and private facilities',
        'The tarif table, average pay from official statistics',
        'What an individual doctor is paid, including on-call duty and overtime',
      ],
    },
    {
      cells: [
        'Germany',
        'Salary from a collective agreement table; heads of department and some senior doctors outside the table',
        'The full table: job group and seniority step',
        'Above-table contracts, incomes of individual practices',
      ],
    },
    {
      cells: [
        'Austria',
        'Salary from the employer’s table in a given federal state',
        'Hospital pay tables; practice incomes only in studies based on pseudonymised data',
        'Incomes of individual practices',
      ],
    },
    {
      cells: [
        'Sweden',
        'Pay set individually within a collective agreement',
        'Averages from official statistics; the pay of any public employee on request',
        'Pay at private employers, including clinics funded by the regions',
      ],
    },
  ],
};

/* ── Public pay tables: base pay of a salaried specialist ─────────────────────── */

/** Angielskie opisy tabel z TARIFFS — w tej samej kolejności co w module polskim. */
const TARIFF_TEXT: Record<string, Pick<Tariff, 'table' | 'topLabel' | 'payments'>> = {
  Niemcy: {
    table: 'TV-Ärzte/VKA (municipal hospitals), group II — specialist; from 1 June 2026',
    topLabel: 'step 6, after 12 years as a specialist',
    payments: '12 payments a year; the agreement provides no extra annual payment',
  },
  Czechy: {
    table: 'Government Regulation 341/2017 Sb., table 3 (doctors), class 14; from 1 April 2026',
    topLabel: 'step 12, over 32 years of practice',
    payments: 'monthly tarif; allowances and bonuses are not part of the table',
  },
  Austria: {
    table: 'Styria, KAGes, SI/N scheme, group SI/N4 — specialists and senior physicians (Oberarzt); from 1 July 2026',
    topLabel: 'step 19',
    payments: '14 payments a year: an extra half-salary every quarter',
  },
};

export const TARIFF_TABLE: CompareTable = {
  columns: ['', 'Table', 'Lowest step', 'Highest step', 'Remarks'],
  rows: TARIFFS.map((t) => {
    const text = TARIFF_TEXT[t.country];
    if (!text) throw new Error(`[en] brak angielskiego opisu tabeli płac dla „${t.country}”`);
    return {
      cells: [
        country(t.country),
        text.table,
        withEur(t.first, t.currency, rates),
        `${withEur(t.top, t.currency, rates)} — ${text.topLabel}`,
        text.payments,
      ],
    };
  }),
};
