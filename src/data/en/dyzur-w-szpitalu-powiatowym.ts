/**
 * Teksty angielskiej wersji artykułu src/content/articles/dyzur-w-szpitalu-powiatowym.mdx
 * (/en/analysis/county-hospital-on-call-duty/). Moduły polskie (rozklad-wynagrodzen, home) są wspólne
 * dla kilku tekstów, więc moduł nazywa się od artykułu i tylko z nich importuje.
 * Kwoty w liście „kto płaci” — z euro w nawiasie po kursie z buildu (src/i18n/rates.ts).
 * Treść: src/content/en/articles/county-hospital-on-call-duty.mdx.
 */
import type { CompareTable, TextItem, Tool } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur, type MoneyOptions } from '@/i18n/money';
import { SPECIALIST_FLOOR } from '@/data/rozklad-wynagrodzen';
import { monitoringTool } from '@/data/home';

const rates = await getRates();
const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);

/* ── How much an hour of on-call duty costs ───────────────────────────────────── */

export const dutyTable: CompareTable = {
  columns: ['', 'Employment (employment contract)', 'Contract (civil-law contract)'],
  rows: [
    { cells: ['Rate', `As for overtime: a 50% supplement on weekdays, 100% at night, on Sundays and public holidays. At a specialist’s minimum, about PLN ${formatEN(SPECIALIST_FLOOR.dutyDay)}–${formatEN(SPECIALIST_FLOOR.dutyNight)} per hour`, 'From the doctor’s bid in a competition in which the only criterion is sometimes price'] },
    { cells: ['Standby (on call by phone)', 'Half the hourly base rate', 'As set out in the contract'] },
    { cells: ['Limit on hours', 'On average 48 hours a week, more with written consent (opt-out clause, repealed with effect from 1 January 2028)', 'No limit from the Labour Code'] },
    { cells: ['What is public', 'The statutory minimum pay, known to the grosz', 'Usually only the result of the competition, without the rate'] },
  ],
};

/* ── Who pays: from the contribution to the county budget ─────────────────────── */

export const payers: TextItem[] = [
  { title: 'NFZ.', text: 'On average 93.8% of county hospitals’ revenue comes from contracts with the NFZ. The lump sum depends on the points for services reported in the previous period, their price and a quality coefficient. Staffing hours are not in the formula: a ward with few patients reports few points, although its on-call duty costs the same.' },
  { title: 'The hospital.', text: 'When the lump sum does not cover costs, the hospital makes a loss and first covers it itself. With a loss of more than 1% of revenue, it must prepare a recovery programme.' },
  { title: 'The county.', text: `The county “may cover” the hospital’s loss — it does not have to. After 2020, rural counties spent PLN 26–36 million a year on this. In Lubliniec, for example, the county council gave ${pln(700_000)} towards the loss for 2025, which amounted to ${pln(14_700_000, { scale: 'million' })}.` },
  { title: 'Creditors.', text: `The rest becomes debt. 125 of the 207 county hospitals had overdue liabilities, totalling almost ${pln(1_480_000_000, { scale: 'billion', decimals: 2 })}, and interest cost them ${pln(344_040_000, { scale: 'million', decimals: 2 })}. When an independent public facility is liquidated, the county takes over its debts.` },
];

/* ── Banner: the Watchdog monitoring browser (Polish page) ────────────────────── */

export const monitoringToolEn: Tool = {
  ...monitoringTool,
  label: 'Data · check for yourself',
  title: 'Doctors’ pay monitoring',
  desc: 'Which hospital disclosed its doctors’ pay, which refused and which did not reply. Facilities can be filtered by hospital network level. In Polish.',
};
