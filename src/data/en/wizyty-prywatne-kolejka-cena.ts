/**
 * Wersja angielska analizy /analizy/wizyty-prywatne-kolejka-cena/ (→ /en/analysis/private-visits-queues-and-prices/).
 * Polski artykuł liczy wykresy i tabele w samym MDX; tu te same konstrukcje z angielskimi tekstami.
 * Liczby importowane z modułów polskich: data/kolejki.ts (kolejka, płaca minimalna, ceny, wydatki z kieszeni),
 * data/budzet-nfz.ts (koszty w planie), data/ciecie-limitow-na-medycyne.ts (wiek lekarzy, limity),
 * data/wizyty-prywatne-kolejka-cena.ts (AOS — te same liczby, które polski MDX ma wpisane w tekście).
 * Ceny wizyty (GUS BDL, zmienna 5076) i adresy z polskiego MDX są wpisane w MDX — przepisane tu dokładnie.
 * Treść artykułu: src/content/en/articles/private-visits-queues-and-prices.mdx.
 */
import type { BarRow, CompareTable, TextItem } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur } from '@/i18n/money';
import { budget } from '@/data/budzet-nfz';
import { AGE, gapOlder } from '@/data/ciecie-limitow-na-medycyne';
import { GROWTH as Q, MIN_WAGE, OUT_OF_POCKET, POPULATION_2024 as POPULATION, PRIVATE_TOTAL_2024, WHC_BASE, WHC_EDITIONS, WHC_LATEST, priceLevel } from '@/data/kolejki';
import { AOS, AOS_FIRST, AOS_LAST, WHC_2022, WHC_2024, pct } from '@/data/wizyty-prywatne-kolejka-cena';

export { GROWTH as Q, LINKS as K, WHC_LATEST, priceLevel } from '@/data/kolejki';
export { LINKS as C, BEFORE, BOTTOM, gapOlder } from '@/data/ciecie-limitow-na-medycyne';
export { WHC_2022, WHC_2024, pct } from '@/data/wizyty-prywatne-kolejka-cena';
export { bn } from '@/data/en/budzet-nfz';

const rates = await getRates();

/** okres edycji Barometru WHC po angielsku: „IX/X 2025” → „Sep/Oct 2025”, „XII/I 2019” → „Dec/Jan 2019” */
const ROMAN: Record<string, string> = {
  I: 'Jan', II: 'Feb', III: 'Mar', IV: 'Apr', V: 'May', VI: 'Jun',
  VII: 'Jul', VIII: 'Aug', IX: 'Sep', X: 'Oct', XI: 'Nov', XII: 'Dec',
};
const editionEN = (label: string) => {
  const [months, year] = label.split(' ');
  const en = months.split('/').map((m) => {
    const month = ROMAN[m];
    if (!month) throw new Error(`[en] nieznany miesiąc „${m}” w okresie Barometru „${label}”`);
    return month;
  });
  return `${en.join('/')} ${year}`;
};

/** adresy z polskiego MDX (const LINKS) — bez zmian */
export const LINKS = {
  bdl: 'https://bdl.stat.gov.pl/api/v1/data/by-variable/5076?unit-level=0&format=json',
  gusIx: 'https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5464/2/179/1/wskazniki_cen_towarow_i_uslug_konsumpcyjnych_we_wrzesniu_2026_r_tablice.xlsx',
  nfz2024: 'https://www.nfz.gov.pl/gfx/nfz/userfiles/_public/bip/dzialalnosc_nfz/sprawozdania_z_dzialalnosci_nfz/zalacznik_do_uchwaly_nr_15-sig.pdf',
  cbos2025: 'https://www.cbos.pl/SPISKOM.POL/2025/K_069_25.PDF',
  nrz2024: 'https://api.sejm.gov.pl/eli/acts/MP/2026/971/text.pdf',
  nfzPlans: 'https://www.nfz.gov.pl/bip/finanse-nfz/',
  nil: 'https://nil.org.pl/uploaded_files/art_1778144361_perspektywa-27-final.pdf',
};

/* ── Wydatki z własnej kieszeni (GUS NRZ za 2024 r.), mld zł — te same co w polskim MDX ─── */

export const OOP_2024 = OUT_OF_POCKET.find((o) => o.year === 2024)!.value;
export const OOP_2023 = OUT_OF_POCKET.find((o) => o.year === 2023)!.value;
export const PRIVATE_2024 = PRIVATE_TOTAL_2024;
export const POPULATION_2024 = POPULATION;
/** zł na mieszkańca, zaokrąglone do 10 zł jak w wersji polskiej */
export const oopPerPerson = Math.round((OOP_2024 * 1e9) / POPULATION_2024 / 10) * 10;

/* ── Cena wizyty u lekarza specjalisty, zł — GUS BDL, zmienna 5076 (przepisane z polskiego MDX) ─── */

export const VISIT = [
  { year: 2015, value: 89.19 }, { year: 2016, value: 92.77 }, { year: 2017, value: 98.28 },
  { year: 2018, value: 103.97 }, { year: 2019, value: 112.45 }, { year: 2020, value: 126.37 },
  { year: 2021, value: 138.02 }, { year: 2022, value: 163.96 }, { year: 2023, value: 188.81 },
  { year: 2024, value: 209.4 }, { year: 2025, value: 231.52 },
];
export const visit = (y: number) => VISIT.find((v) => v.year === y)!.value;
/** płaca minimalna od stycznia, zł */
export const wage = (y: number) => MIN_WAGE.find((m) => m.year === y)!.value;
/** „PLN 231.52 (≈ €54)” — do napisów w propsach, gdzie nie da się wstawić ui/Money */
export const visit2025Text = withEur(visit(2025), 'PLN', rates);

const mid = (y: number) => y + 0.5;
const YEARS = VISIT.map((v) => v.year);
const x = (n: number, d = 1) => `×${formatEN(n, d)}`;

/* ── Visit, minimum wage and prices as an index chart (IndexChart) ─────────────── */

export const GROWTH_LINES = {
  base: 2015, xMin: 2015, xMax: 2026, yMin: 80, yMax: 300, ticks: [100, 150, 200, 250, 300], years: YEARS,
  series: [
    { id: 'wage', label: 'Minimum wage', tone: 'data' as const, end: x(wage(2025) / wage(2015)), labelShift: -1, points: YEARS.map((y) => ({ x: mid(y), v: (wage(y) / wage(2015)) * 100 })) },
    { id: 'visit', label: 'Visit to a specialist', tone: 'accent' as const, end: x(visit(2025) / visit(2015)), labelShift: 1, points: YEARS.map((y) => ({ x: mid(y), v: (visit(y) / visit(2015)) * 100 })) },
    { id: 'prices', label: 'Prices overall', tone: 'ref' as const, end: x(priceLevel(2025)), points: YEARS.map((y) => ({ x: mid(y), v: priceLevel(y) * 100 })) },
  ],
  caption: 'Indices, 2015 = 100, 2015–2025: average price of a visit to a specialist doctor according to GUS, minimum wage from January and the overall price level.',
};

/* ── NFZ budget, waiting time (WHC Barometer) and private visit price, index 2015 = 100 ─── */

export const CORR_CHART = {
  base: 2015, xMin: 2015, xMax: 2026, yMin: 80, yMax: 340, ticks: [100, 150, 200, 250, 300], years: YEARS,
  series: [
    { id: 'budget', label: 'NFZ budget', tone: 'data' as const, end: x(Q.budget), points: YEARS.map((y) => ({ x: mid(y), v: (budget(y).costs / budget(2015).costs) * 100 })) },
    { id: 'visit', label: 'Private visit', tone: 'accent' as const, end: x(visit(2025) / visit(2015)), points: YEARS.map((y) => ({ x: mid(y), v: (visit(y) / visit(2015)) * 100 })) },
    { id: 'queue', label: 'Waiting time (WHC)', tone: 'data' as const, end: `+${formatEN(Q.queue)}%`, markers: true, points: WHC_EDITIONS.map((e) => ({ x: e.x, v: (e.single / WHC_BASE) * 100, gapBefore: e.label === 'IX 2021', label: editionEN(e.label), tip: `${formatEN(e.single, 1)} months`, note: 'average per service (WHC)' })) },
  ],
  caption:
    `Indices, 2015 = 100. Costs in the final NFZ financial plan: ${formatEN(Q.budget, 2)} times higher in 2025 than in 2015. ` +
    `Average price of a visit to a specialist doctor according to GUS: from PLN ${formatEN(visit(2015), 2)} to PLN ${formatEN(visit(2025), 2)}. ` +
    `Average waiting time for a service according to the WHC Barometer: from ${formatEN(WHC_BASE, 1)} to ${formatEN(WHC_LATEST.single, 1)} months; there was no survey in 2020.`,
};

/* ── Visit, prices and minimum wage as a multiple of 2015, animated bars (SubsidyChart) ─── */

export const GROWTH_CHART = {
  name: { full: 'Visit to a specialist', short: 'Visit' },
  compare: [
    { name: { full: 'Prices overall', short: 'Prices' }, values: VISIT.map((v) => priceLevel(v.year)) },
    { name: { full: 'Minimum wage', short: 'Min. wage' }, values: VISIT.map((v) => wage(v.year) / wage(2015)) },
  ],
  unit: '2015 = 1',
  bars: VISIT.map((v) => ({ year: v.year, value: v.value / visit(2015) })),
  caption:
    'Bar chart, multiple of the 2015 level. ' +
    VISIT.map((v) => `${v.year}: visit to a specialist ${formatEN(v.value / visit(2015), 2)}, minimum wage ${formatEN(wage(v.year) / wage(2015), 2)}, prices overall ${formatEN(priceLevel(v.year), 2)}`).join('; ') + '.',
};

/* ── Price of a visit, year by year (BarChart) ──────────────────────────────────── */

export const VISIT_ROWS: BarRow[] = VISIT.map((v) => ({
  label: String(v.year),
  value: v.value,
  display: `PLN ${formatEN(v.value, 2)}`,
  highlight: v.year === 2025,
}));

export const visitCaption = `Average price of a visit to a specialist doctor according to GUS, PLN: ${VISIT.map((v) => `${v.year} — ${formatEN(v.value, 2)}`).join('; ')}.`;

/* ── Specialist outpatient care in the NFZ report (Comparison) ─────────────────── */

export const perService = (r: (typeof AOS)[number]) => (r.cost * 1000) / r.services;
export const A0 = AOS_FIRST;
export const A2 = AOS_LAST;

export const AOS_TABLE: CompareTable = {
  columns: ['Year', 'Costs incurred', 'Services', 'Patients', 'Cost per service (our calculation)'],
  rows: [
    ...AOS.map((r) => ({
      cells: [String(r.year), `PLN ${formatEN(r.cost / 1e6, 2)} bn`, `${formatEN(r.services / 1e6, 1)} million`, `${formatEN(r.patients / 1e6, 1)} million`, `PLN ${formatEN(perService(r))}`],
    })),
    {
      cells: [
        'Change 2022–2024',
        `+${formatEN(pct(A0.cost, A2.cost), 1)}%`,
        `+${formatEN(pct(A0.services, A2.services), 1)}%`,
        `+${formatEN(pct(A0.patients, A2.patients), 1)}%`,
        `+${formatEN(pct(perService(A0), perService(A2)), 1)}%`,
      ],
      marked: true,
    },
  ],
};

/* ── Doctors by age (ColumnChart) ────────────────────────────────────────────── */

export const AGE_COLUMNS = AGE.map((a) => ({
  label: a.group,
  sub: `studies ${a.start}`,
  value: a.value,
  display: formatEN(a.value / 1000, 1),
}));

export const ageCaption =
  `Column chart. Practising doctors by age, as at 31.12.2025: ${AGE.map((a) => `${a.group} years — ${formatEN(a.value)}`).join('; ')}. ` +
  `The fewest are doctors aged 41–55, who began their studies in the years when admission limits were cut; ` +
  `there are ${gapOlder}% fewer doctors aged 46–50 than aged 56–60.`;

/* ── Ticket through the private practice (NumberedList) ───────────────────────── */

export const TICKET_STEPS: TextItem[] = [
  { title: 'Paid consultation.', text: `The patient goes privately to a specialist who also works in a hospital with an NFZ contract. The average visit cost ${visit2025Text} in 2025.` },
  { title: 'Referral to hospital.', text: 'Any doctor can refer a patient for hospital treatment, including in a private practice. A specialist clinic with an NFZ contract requires a referral from a health insurance doctor, i.e. one working under an NFZ contract, but a hospital does not.' },
  { title: 'Category and date.', text: 'Whether a case is urgent or stable, and what date the patient gets, is decided by the hospital — the one in which the doctor from the private practice works.' },
  { title: 'Faster to the ward.', text: 'If a patient from the private practice gets a date ahead of people on the list, and their state of health does not justify it, they skip the queue. This is the only step that is an irregularity — and the one that nobody sees today.' },
];

/* ── Doctors’ support for regulating dual practice, NIL survey (BarChart) ────────── */

const NIL_SUPPORT = [
  { label: 'Separate waiting lists, schedules and billing', value: 71.9, highlight: true },
  { label: 'Restrictions only where there is a real conflict of interest', value: 69.9 },
  { label: 'No new restrictions, current freedom', value: 68.9 },
  { label: 'Open declaration of public and private workplaces', value: 51.9 },
  { label: 'Ban on private work in the same scope as for the NFZ', value: 22.9 },
  { label: 'Full ban on combining public and private work', value: 15.1 },
];

export const NIL_ROWS: BarRow[] = NIL_SUPPORT.map((r) => ({ ...r, display: `${formatEN(r.value, 1)}%` }));

export const nilCaption =
  'Doctors’ support for options for regulating work in two sectors: separate waiting lists, schedules and billing 71.9%; ' +
  'restrictions only where there is a real conflict of interest 69.9%; no new restrictions 68.9%; open declaration of workplaces 51.9%; ' +
  'ban on private work in the same scope as for the NFZ 22.9%; full ban on combining 15.1%.';

/* ── The loop (NumberedList) — hipoteza, jak w oryginale ───────────────────────── */

export const LOOP_STEPS: TextItem[] = [
  { title: 'Money goes into the price of an hour.', text: 'There are few specialists from the cohorts after the cuts to admission limits, and the NFZ budget is growing faster than the number of hours they work, so the Fund pays more and more for a similar number of services. In specialist clinics in 2022–2024: +55.6% in costs, +13.7% in services.' },
  { title: 'The waiting list does not get shorter.', text: 'The average waiting time for a service is 4.2 months, the longest in the history of WHC Barometer measurements.' },
  { title: 'Demand moves to private practices.', text: 'A private visit becomes a way to skip the waiting list: more and more patients pay, and 79% of them do so in order not to wait. The average private visit costs 2.6 times more than in 2015.' },
  { title: 'The private rate pushes up the public one.', text: 'A clinic with an NFZ contract and a private practice compete for the hours of the same specialists. The better the private practice pays, the more the clinic has to pay so that the doctor does not move their hours there — and the loop starts again.' },
];
