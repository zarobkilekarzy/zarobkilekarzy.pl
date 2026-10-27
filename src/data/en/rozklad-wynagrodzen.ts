/**
 * Wersja angielska modułu src/data/rozklad-wynagrodzen.ts: te same liczby (importowane), tylko teksty
 * po angielsku — wykres median, tabela minimów na etacie, tabela „ponad 100 tys. zł”. Kwoty w tabelach
 * w złotych; przy minimum miesięcznym euro w nawiasie po kursie z buildu (src/i18n/rates.ts).
 * Treść artykułu: src/content/en/articles/doctor-pay-distribution.mdx.
 */
import type { BarRow, CompareTable } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur, type MoneyOptions } from '@/i18n/money';
import { BASE } from '@/data/personel-medyczny';
import { BRACKETS, FLOOR, OVER_100K, SUMMED, medianRows as medianRowsPl } from '@/data/rozklad-wynagrodzen';

export {
  LINKS,
  MEDIANS,
  KONTRAKT_PREMIUM,
  MEDIAN_MAX,
  ETAT_SPEC,
  SHARES,
  RESIDENT_AVERAGE,
  OVER_100K,
  SUMMED,
  CRU,
  MONTH_HOURS,
  SPECIALIST_FLOOR,
  NON_SPECIALIST_FLOOR,
  INTERN_FLOOR,
  B2B,
  B2B_RATIO,
  PER_100H,
  INVOICE_EXAMPLE,
} from '@/data/rozklad-wynagrodzen';

const rates = await getRates();

/** „PLN 12,910.16 (≈ €3,040)” */
export const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);

/** Data, od której obowiązuje minimum (BASE.from w module płac) — tekst stoi w artykule, więc zmiana zatrzyma build. */
export const FLOOR_FROM = '1 July 2026';
if (BASE.from !== '1 lipca 2026 r.') {
  throw new Error(`[en] rozklad-wynagrodzen: nowa data minimum („${BASE.from}”) — popraw FLOOR_FROM`);
}

/* ── Medians by form of employment (AOTMiT, February 2026) ────────────────────── */

/** podpisy z modułu polskiego → angielskie */
const MEDIAN_LABEL: Record<string, string> = {
  'Specjalista na kontrakcie': 'Specialist, contractor',
  'Specjalista na etacie': 'Specialist, salaried',
  'Bez specjalizacji, na etacie': 'Non-specialist, salaried',
  'Bez specjalizacji, na kontrakcie': 'Non-specialist, contractor',
  'Bez specjalizacji, na zleceniu lub umowie o dzieło': 'Non-specialist, mandate or specific-work contract',
  'Specjalista na zleceniu lub umowie o dzieło': 'Specialist, mandate or specific-work contract',
};
const medianLabel = (pl: string) => {
  const en = MEDIAN_LABEL[pl];
  if (!en) throw new Error(`[en] rozklad-wynagrodzen: brak angielskiego podpisu „${pl}”`);
  return en;
};

export const medianRows: BarRow[] = medianRowsPl.map((r) => ({
  label: medianLabel(r.label),
  value: r.value,
  display: `PLN ${formatEN(r.value)}`,
  highlight: r.highlight,
}));

export const medianCaption = `Median monthly gross pay of doctors under a single contract in a hospital, February 2026: ${medianRowsPl
  .map((r) => `${medianLabel(r.label).toLowerCase()} — PLN ${formatEN(r.value)}`)
  .join(', ')}.`;

/* ── The most common pay ranges of specialists ────────────────────────────────── */

const BRACKET_LABEL: Record<string, string> = {
  '10–15 tys. zł': 'PLN 10,000–15,000',
  '15–20 tys. zł': 'PLN 15,000–20,000',
};
const bracketLabel = (pl: string) => {
  const en = BRACKET_LABEL[pl];
  if (!en) throw new Error(`[en] rozklad-wynagrodzen: brak angielskiego podpisu przedziału „${pl}”`);
  return en;
};
export const BRACKETS_EN = {
  kontrakt: { ...BRACKETS.kontrakt, label: bracketLabel(BRACKETS.kontrakt.label) },
  etat: { ...BRACKETS.etat, label: bracketLabel(BRACKETS.etat.label) },
};

/* ── Over PLN 100,000 a month: what is counted ────────────────────────────────── */

export const over100kTable: CompareTable = {
  columns: ['What is counted', 'How many', 'Type of figure'],
  rows: [
    {
      cells: [
        'Specialists’ contracts worth over PLN 100,000 a month in one hospital',
        `${formatEN(OVER_100K.contracts)}, or ${formatEN(OVER_100K.contractsShare, 1)}% of contracts`,
        'AOTMiT measurement, February 2026; the unit is a contract',
      ],
    },
    {
      cells: [
        'Salaried specialists paid over PLN 100,000 in one hospital',
        `${formatEN(OVER_100K.etat)}, or ${formatEN(OVER_100K.etatShare, 1)}% of employment contracts`,
        'AOTMiT measurement, February 2026; the unit is a contract',
      ],
    },
    {
      cells: [
        'Doctors paid over PLN 100,000 in one facility',
        `about ${formatEN(OVER_100K.persons)}, just over 1% of doctors`,
        'AOTMiT data according to the agency’s president',
      ],
    },
    {
      cells: [
        'Doctors paid over PLN 100,000 after adding up all workplaces',
        `${SUMMED.share.from}–${SUMMED.share.to}% of doctors, or ${formatEN(SUMMED.persons.from)}–${formatEN(SUMMED.persons.to)} people`,
        'estimate by the president of AOTMiT; the number of people calculated by Rynek Zdrowia',
      ],
      marked: true,
    },
  ],
};

/* ── Statutory minimum for employees ──────────────────────────────────────────── */

const FLOOR_TITLE: Record<string, string> = {
  'Lekarz specjalista': 'Specialist doctor',
  'Lekarz bez specjalizacji': 'Doctor without specialisation',
  'Lekarz stażysta': 'Intern doctor',
};

export const floorTable: CompareTable = {
  columns: ['', 'Monthly minimum', 'Per hour', 'On-call hour on a weekday', 'On-call hour at night, on a Sunday or public holiday'],
  rows: FLOOR.map((f) => {
    const title = FLOOR_TITLE[f.title];
    if (!title) throw new Error(`[en] rozklad-wynagrodzen: brak angielskiej nazwy „${f.title}”`);
    return {
      cells: [title, pln(f.monthly, { decimals: 2 }), `about PLN ${formatEN(f.hourly)}`, `about PLN ${formatEN(f.dutyDay)}`, `about PLN ${formatEN(f.dutyNight)}`],
    };
  }),
};
