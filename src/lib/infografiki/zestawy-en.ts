/**
 * Infografiki po angielsku (spec wersji EN, §8): te same zestawy co w ./zestawy.ts, z tekstami EN, zapisem liczb EN
 * i kodem QR do strony EN. Klucz = klucz polskiego zestawu (id polskiego artykułu); tylko strony z tłumaczeniem
 * (egzamin, symulator i monitoring są tylko po polsku). Liczby z tych samych modułów danych co wersja polska,
 * nazwy z angielskich modułów stron (src/data/en/); kwoty tylko w PLN — grafika krąży jako plik, bez kursu euro.
 * Zmiana zestawu polskiego (nowa grafika, inny podział) = ta sama zmiana tutaj.
 */
import { COUNTRIES, FIRST_YEAR, LAST_YEAR, REVOCATIONS, WINDOW, ratePer100k, total, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { COUNTRY_EN } from '@/data/en/odpowiedzialnosc-zawodowa-lekarzy';
import { LATEST } from '@/data/english-division';
import { dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { BUDGET, CURRENT, DRAFT_2027, GAP_2027, budget } from '@/data/budzet-nfz';
import { MEDIAN_WAGES, OUT_OF_POCKET, SPECIALISTS_2025, TO, WHC_EDITIONS, WHC_LATEST, contribution } from '@/data/kolejki';
import { SPECIALIST_ROWS } from '@/data/en/budzet-nfz';
import { SPZOZ_QUARTERS } from '@/data/zadluzenie';
import { AGE_LADDER } from '@/data/pielegniarstwo-w-polsce';
import { AGE_BASE } from '@/data/en/pielegniarstwo-w-polsce';
import { FIRST_YEAR as STUDENTS_FIRST_YEAR, LINKS as ODSIEW_LINKS, PES_2025, PES_2025_ALL, PES_LINK, pesYear } from '@/data/odsiew-na-medycynie';
import { funnelRows } from '@/data/en/odsiew-na-medycynie';
import { AOS_FIRST, AOS_LAST, LINKS as WIZYTA_LINKS, NIL_N, NO_CLINICAL, WHC_2022, WHC_2024, WORK_MODEL, combined, pct as change } from '@/data/wizyty-prywatne-kolejka-cena';
import { BEAN, NORI } from '@/data/ai-w-medycynie-2026';
import { SELF_GOVERNMENT_STANCES, SURPLUS_YEAR } from '@/data/reglamentacja-dostepu';
import { DOBA_MODEL } from '@/data/film';
import { formatEN } from '@/lib/format';
import type { ComparisonRow, DataTable, InfographicSet, SplitBar, SplitSegment, ViewPart } from './render';

/** Tłumaczenie z polskiej etykiety z modułu danych; brak tłumaczenia wywraca build (nowy wiersz po polsku = tłumaczenie tutaj). */
const translate = (map: Record<string, string>, pl: string, what: string) => {
  const en = map[pl];
  if (!en) throw new Error(`[infografiki EN] brak tłumaczenia (${what}): „${pl}”`);
  return en;
};
const f1 = (n: number) => formatEN(n, 1);
/** „2026, poz. 864” → „2026 item 864” (Dziennik Ustaw po angielsku: Journal of Laws) */
const journal = (label: string) => `Journal of Laws ${label.replace(', poz. ', ' item ')}`;

/* ---------- Odpowiedzialność zawodowa: odebrania prawa do zawodu ---------- */

const span = `${WINDOW.from}–${WINDOW.to}`;
const years = `${FIRST_YEAR}–${LAST_YEAR}`;
const SOURCES_REVOCATIONS = 'Sources: Helsetilsynet, HSAN, GMC, NIL · definitions differ between countries';

// jak w wersji polskiej: liczby całkowite, bo to porównanie rzędu wielkości
const country = (key: CountryKey): ComparisonRow => {
  const value = ratePer100k(key);
  return { label: COUNTRY_EN[key].name, sub: COUNTRY_EN[key].body, value, display: formatEN(value), highlight: key === 'pl' };
};
const rows = [country('no'), country('se'), country('uk'), country('pl')];

const tableCountries = [...COUNTRIES.filter((c) => c.key !== 'pl'), ...COUNTRIES.filter((c) => c.key === 'pl')];
const revocationTable: DataTable = {
  periods: REVOCATIONS.map((r) => String(r.year)),
  series: tableCountries.map((c) => ({ label: COUNTRY_EN[c.key].name, sub: COUNTRY_EN[c.key].body, values: REVOCATIONS.map((r) => r[c.key]), highlight: c.key === 'pl' })),
  summary: [
    { label: 'Total', sub: years, values: tableCountries.map((c) => formatEN(total(c.key))) },
    { label: 'Per 100,000 doctors', sub: `a year, ${span}`, values: tableCountries.map((c) => formatEN(ratePer100k(c.key))) },
  ],
};

const odpowiedzialnosc: InfographicSet = {
  route: '/en/analysis/doctor-discipline-licence-revocation/',
  page: 'Analysis: Poland’s harshest penalty for doctors is almost never imposed',
  filePrefix: 'zarobkilekarzy-en-licence-revocations',
  locale: 'en',
  items: [
    {
      id: 'country-comparison',
      title: 'How many doctors lost their licence to practise',
      measure: `per 100,000 doctors a year · ${span}`,
      rows,
      sources: SOURCES_REVOCATIONS,
      alt: `Infographic: revocations of doctors’ licences to practise per 100,000 doctors, annual average ${span}: ${rows.map((r) => `${r.label} ${r.display}`).join(', ')}. Definitions differ between countries. Sources: Helsetilsynet, HSAN, GMC, NIL.`,
    },
    {
      id: 'year-by-year',
      title: 'How many doctors lost their licence to practise',
      measure: `revocations year by year · ${years}`,
      table: revocationTable,
      sources: SOURCES_REVOCATIONS,
      alt: `Infographic: revocations of doctors’ licences to practise year by year, ${years}. Total: ${tableCountries.map((c) => `${COUNTRY_EN[c.key].name} ${total(c.key)}`).join(', ')}. Annual average per 100,000 doctors, ${span}: ${tableCountries.map((c) => `${COUNTRY_EN[c.key].name} ${formatEN(ratePer100k(c.key))}`).join(', ')}. ${REVOCATIONS.map((r) => `${r.year}: ${tableCountries.map((c) => `${COUNTRY_EN[c.key].name} ${r[c.key]}`).join(', ')}`).join('; ')}. Definitions differ between countries. Sources: Helsetilsynet, HSAN, GMC, NIL.`,
    },
  ],
};

/* ---------- English Division: miejsca na medycynie ---------- */

const stationaryRow = dayRows.find((r) => r.label === LATEST.year);
if (!stationaryRow) throw new Error(`[infografiki EN] brak miejsc stacjonarnych ${LATEST.year} w ciecie-limitow-na-medycyne`);
const stationary = stationaryRow.value;
const extramural = LATEST.total - LATEST.foreign - stationary;
const act = journal(LATEST.act.label);
const shareOf = (n: number) => `${f1((100 * n) / LATEST.total)}%`;
const seatSegments: SplitSegment[] = [
  { label: 'Full-time', sub: 'in Polish', value: stationary, display: formatEN(stationary), share: shareOf(stationary), tone: 'slate' },
  { label: 'Part-time', sub: 'in Polish, fee-paying', value: extramural, display: formatEN(extramural), share: shareOf(extramural), tone: 'soft' },
  { label: 'In a foreign language', sub: 'English Division, fee-paying', value: LATEST.foreign, display: formatEN(LATEST.foreign), share: shareOf(LATEST.foreign), tone: 'blue' },
];
const foreignShare = (100 * LATEST.foreign) / LATEST.total;
const edBars: SplitBar[] = [
  {
    label: `First-year places, ${LATEST.year}`,
    segments: [
      { label: 'in English', sub: 'English Division', value: foreignShare, display: f1(foreignShare), tone: 'blue' },
      { label: 'in Polish', value: 100 - foreignShare, display: f1(100 - foreignShare), tone: 'slate' },
    ],
  },
  {
    // ELA: < 1% — segment rysowany jako 1% (górna granica), jak w wersji polskiej
    label: 'Foreign graduates a year after the diploma',
    segments: [
      { label: 'work in Poland', value: 1, display: '<1', tone: 'blue' },
      { label: 'do not work in Poland', value: 99, display: '>99', tone: 'slate' },
    ],
  },
];

const englishDivision: InfographicSet = {
  route: '/en/analysis/english-division-medical-studies/',
  page: 'Analysis: English Division medical studies',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'places-in-medicine',
      title: 'How many places in medicine, and on which programmes',
      measure: `admission limit for medicine · ${LATEST.year} · ${formatEN(LATEST.total)} in total`,
      split: { bars: [{ segments: seatSegments }] },
      sources: `Source: Ministry of Health regulation, ${act} · places in the limit, not the number admitted`,
      alt: `Infographic: the admission limit for medicine in ${LATEST.year} — ${formatEN(LATEST.total)} places in total: full-time programmes in Polish ${formatEN(stationary)}, part-time programmes in Polish (fee-paying) ${formatEN(extramural)}, programmes in a foreign language (English Division, fee-paying) ${formatEN(LATEST.foreign)}. Source: regulation of the Minister of Health, ${act}.`,
    },
    {
      id: 'english-division',
      title: 'One in six places in medicine is taught in English',
      measure: `share of the ${LATEST.year} admission limit · working in Poland a year after graduation`,
      split: { unit: '%', bars: edBars },
      sources: `Sources: ${act}, ELA (2021 graduates) · separate admission, full tuition fees`,
      alt: `Infographic: programmes in a foreign language (English Division) make up ${f1(foreignShare)}% of places in the admission limit for medicine in ${LATEST.year} (${formatEN(LATEST.foreign)} of ${formatEN(LATEST.total)}). A year after graduation, fewer than 1% of foreign graduates in medical sciences work in Poland (ELA, 2021 graduates). This is a separate admission with tuition fees. Sources: regulation of the Minister of Health, ${act}; Economic Fates of Graduates (ELA).`,
    },
    {
      id: 'for-export',
      title: 'We train doctors',
      titleAccent: 'for export',
      measure: `admission limit ${LATEST.year} · working in Poland a year after graduation`,
      unit: '%',
      dots: {
        panels: [
          { display: f1(foreignShare), label: 'of places in medicine are programmes taught in English', sub: `English Division · ${LATEST.year}`, blue: Math.round(foreignShare), blueCell: 'on', rest: 'on', from: 'end' },
          { display: '<1', label: 'of foreign graduates work in Poland a year after graduation', sub: 'ELA · 2021 graduates', blue: 1, blueCell: 'mid', rest: 'off', from: 'start' },
        ],
      },
      sources: `Sources: ${act}; ELA, 2021 graduates · separate admission, full tuition fees`,
      alt: `Infographic “We train doctors for export”: two boards of 100 squares. On the first, ${Math.round(foreignShare)} squares in cobalt — programmes in a foreign language (English Division) make up ${f1(foreignShare)}% of places in the admission limit for medicine in ${LATEST.year} (${formatEN(LATEST.foreign)} of ${formatEN(LATEST.total)}). On the second, one smaller square: a year after graduation, fewer than 1% of foreign graduates in medical sciences work in Poland (ELA, 2021 graduates). This is a separate admission with tuition fees. Sources: regulation of the Minister of Health, ${act}; Economic Fates of Graduates (ELA).`,
    },
  ],
};

/* ---------- Budżet NFZ i kolejki ---------- */

// rok bazowy i serie jak w wersji polskiej (zestawy.ts → kolejki)
const BASE_YEAR = 2022;
const DRAFT_YEAR = 2027;
const SINCE = 2020;
const pct = (to: number, from: number) => `+${formatEN((to / from - 1) * 100)}%`;
const budgetIndex = (costs: number) => (costs / budget(BASE_YEAR).costs) * 100;
const medianOf = (year: number) => MEDIAN_WAGES.find((m) => m.year === year)!.median;
const oopOf = (year: number) => OUT_OF_POCKET.find((o) => o.year === year)!.value;
const whcOf = (year: number) => WHC_EDITIONS.find((e) => e.year === year)!;
const lastMedian = MEDIAN_WAGES.at(-1)!;
const lastOop = OUT_OF_POCKET.at(-1)!;
const yearly = (n: number) => formatEN(Math.round(n));
const bnEN = (n: number) => f1(Math.round(n * 10 + 1e-6) / 10);
const queueLatestYear = Number(WHC_LATEST.label.slice(-4));

const specialistRows: ComparisonRow[] = [
  ...SPECIALIST_ROWS.map((r) => ({ label: r.label, value: r.value, display: f1(r.value) })),
  { label: 'On average', sub: '41 types of clinic', value: SPECIALISTS_2025.average, display: f1(SPECIALISTS_2025.average), highlight: true },
];

const kolejki: InfographicSet = {
  route: '/en/data/nfz-budget/',
  page: 'Data: The NFZ budget and waiting lists',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'money-and-waiting-lists',
      title: 'The money is growing.',
      titleAccent: 'The waiting list is not getting shorter.',
      measure: `index, ${BASE_YEAR} = 100 · change since ${BASE_YEAR}`,
      chart: {
        xMin: SINCE,
        xMax: DRAFT_YEAR + 1,
        yMin: 70,
        yMax: 200,
        yTicks: [80, 100, 120, 140, 160, 180],
        xTicks: Array.from({ length: DRAFT_YEAR - SINCE + 1 }, (_, k) => ({ x: SINCE + k + 0.5, label: String(SINCE + k) })),
        series: [
          {
            label: 'NFZ costs',
            tone: 'blue',
            points: [
              ...BUDGET.filter((r) => r.year >= SINCE).map((r) => ({ x: r.year + 0.5, v: budgetIndex(r.costs) })),
              { x: DRAFT_YEAR + 0.5, v: budgetIndex(DRAFT_2027.total) },
            ],
            dashedFrom: CURRENT.year + 0.5,
            value: pct(budget(TO).costs, budget(BASE_YEAR).costs),
            detail: `from PLN ${bnEN(budget(BASE_YEAR).costs)} to ${bnEN(budget(TO).costs)} bn (${TO})`,
          },
          {
            label: 'Health contribution',
            tone: 'amber',
            points: MEDIAN_WAGES.map((m) => ({ x: m.year + 0.8, v: (m.median / medianOf(BASE_YEAR)) * 100 })),
            value: pct(lastMedian.median, medianOf(BASE_YEAR)),
            detail: `from PLN ${yearly(contribution(medianOf(BASE_YEAR)))} to ${yearly(contribution(lastMedian.median))} a year (${lastMedian.year})`,
          },
          {
            label: 'Out-of-pocket spending',
            tone: 'slate',
            points: OUT_OF_POCKET.map((o) => ({ x: o.year + 0.5, v: (o.value / oopOf(BASE_YEAR)) * 100 })),
            value: pct(lastOop.value, oopOf(BASE_YEAR)),
            detail: `from PLN ${bnEN(oopOf(BASE_YEAR))} to ${bnEN(lastOop.value)} bn (${lastOop.year})`,
          },
          {
            label: 'Waiting time',
            tone: 'red',
            points: WHC_EDITIONS.filter((e) => e.x >= SINCE).map((e) => ({ x: e.x, v: (e.single / whcOf(BASE_YEAR).single) * 100 })),
            value: pct(WHC_LATEST.single, whcOf(BASE_YEAR).single),
            detail: `from ${f1(whcOf(BASE_YEAR).single)} to ${f1(WHC_LATEST.single)} months (${queueLatestYear})`,
          },
        ],
        note: {
          x: DRAFT_YEAR + 0.5,
          v: budgetIndex(DRAFT_2027.total),
          lines: [`${DRAFT_YEAR}: PLN ${bnEN(DRAFT_2027.total)} bn in the draft plan`, `about PLN ${formatEN(GAP_2027.value)} bn short, says the Fiscal Council`],
        },
      },
      sources: 'Sources: NFZ plans, GUS, WHC Barometer, Fiscal Council · contribution at median pay: our calculation',
      alt: `Infographic, index chart (${BASE_YEAR} = 100), ${SINCE}–${DRAFT_YEAR}. Since ${BASE_YEAR}: costs in the NFZ plan ${pct(budget(TO).costs, budget(BASE_YEAR).costs)} (from PLN ${bnEN(budget(BASE_YEAR).costs)} to ${bnEN(budget(TO).costs)} billion in ${TO}), the health contribution at median pay ${pct(lastMedian.median, medianOf(BASE_YEAR))} (to PLN ${yearly(contribution(lastMedian.median))} a year in ${lastMedian.year}), household out-of-pocket spending on healthcare ${pct(lastOop.value, oopOf(BASE_YEAR))} (to PLN ${bnEN(lastOop.value)} billion in ${lastOop.year}), and the average waiting time for a service according to the WHC Barometer ${pct(WHC_LATEST.single, whcOf(BASE_YEAR).single)} (from ${f1(whcOf(BASE_YEAR).single)} to ${f1(WHC_LATEST.single)} months). The draft NFZ plan for ${DRAFT_YEAR}: PLN ${bnEN(DRAFT_2027.total)} billion; the Fiscal Council estimates a shortfall of about PLN ${formatEN(GAP_2027.value)} billion.`,
    },
    {
      id: 'specialist-waiting-times',
      title: 'How many months the wait for a specialist takes',
      measure: `average waiting time for an appointment · WHC Barometer ${WHC_LATEST.label}`,
      unit: 'months',
      rows: specialistRows,
      sources: `Source: Watch Health Care Foundation, WHC Barometer ${WHC_LATEST.label}`,
      alt: `Infographic: average waiting time for a specialist appointment according to the WHC Barometer (${WHC_LATEST.label}): ${SPECIALIST_ROWS.map((r) => `${r.label.toLowerCase()} ${f1(r.value)} months`).join(', ')}; on average across 41 types of clinic ${f1(SPECIALISTS_2025.average)} months. Source: Watch Health Care Foundation.`,
    },
  ],
};

/* ---------- Zadłużenie: zobowiązania SPZOZ kwartał po kwartale ---------- */

const DEBT_FROM = 2020;
const debtQuarters = SPZOZ_QUARTERS.filter(([label]) => Number(label.split(' ')[1]) >= DEBT_FROM);
const ROMAN = ['I', 'II', 'III', 'IV'];
const quarterX = (label: string) => {
  const [q, y] = label.split(' ');
  return Number(y) + (ROMAN.indexOf(q) + 0.5) / 4;
};
/** „III 2024” → „Q3 2024” */
const quarterName = (label: string) => {
  const [q, y] = label.split(' ');
  return `Q${ROMAN.indexOf(q) + 1} ${y}`;
};
const [debtFirst, debtLast] = [debtQuarters[0], debtQuarters.at(-1)!];
const yearAgo = SPZOZ_QUARTERS[SPZOZ_QUARTERS.length - 5];
const debtGrowth = (debtLast[1] / yearAgo[1] - 1) * 100;
const bn = (mln: number) => f1(mln / 1000);

const zadluzenie: InfographicSet = {
  route: '/en/data/hospital-debt/',
  page: 'Data: Hospital debt in Poland',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'spzoz-debt',
      title: `Debts of public facilities: ${f1(debtLast[1] / debtFirst[1])} times as high as in ${DEBT_FROM}`,
      measure: `liabilities of all SPZOZ, PLN bn · ${quarterName(debtFirst[0])} – ${quarterName(debtLast[0])}`,
      chart: {
        xMin: DEBT_FROM,
        xMax: Number(debtLast[0].split(' ')[1]) + 0.5,
        yMin: 0,
        yMax: 40,
        yTicks: [0, 10, 20, 30],
        xTicks: Array.from({ length: Number(debtLast[0].split(' ')[1]) - DEBT_FROM + 1 }, (_, k) => ({ x: DEBT_FROM + k + 0.5, label: String(DEBT_FROM + k) })),
        series: [
          {
            label: 'Total liabilities',
            tone: 'blue',
            points: debtQuarters.map(([label, sum]) => ({ x: quarterX(label), v: sum / 1000 })),
            value: bn(debtLast[1]),
            unit: 'PLN bn',
            detail: `from PLN ${bn(debtFirst[1])} bn in ${quarterName(debtFirst[0])}`,
          },
          {
            label: 'Of which overdue',
            tone: 'red',
            points: debtQuarters.map(([label, , overdue]) => ({ x: quarterX(label), v: overdue / 1000 })),
            value: bn(debtLast[2]),
            unit: 'PLN bn',
            detail: `past the payment date; from PLN ${bn(debtFirst[2])} bn`,
          },
        ],
        note: { x: quarterX(debtLast[0]), v: debtLast[1] / 1000, lines: ['over the last year', `+${f1(debtGrowth)}%`] },
      },
      sources: 'Source: Ministry of Health, total and overdue liabilities of SPZOZ (quarterly data)',
      alt: `Infographic, chart: the liabilities of all independent public healthcare facilities (SPZOZ) rose from PLN ${bn(debtFirst[1])} billion in ${quarterName(debtFirst[0])} to PLN ${bn(debtLast[1])} billion in ${quarterName(debtLast[0])}, by ${f1(debtGrowth)}% over the last year. Overdue liabilities, i.e. those past the payment date, rose from PLN ${bn(debtFirst[2])} to ${bn(debtLast[2])} billion. Source: Ministry of Health.`,
    },
  ],
};

/* ---------- Pielęgniarstwo: wiek zarejestrowanych pielęgniarek ---------- */

const agePct = (groups: string[]) => Math.round(AGE_LADDER.filter((g) => groups.includes(g.group)).reduce((n, g) => n + g.pct, 0) * 10) / 10;
const nursesOld = agePct(['71 lat i więcej', '61–70 lat']);
const nursesMid = agePct(['51–60 lat', '41–50 lat']);
const nursesYoung = agePct(['31–40 lat', '20–30 lat']);
const nurses71 = AGE_LADDER.find((g) => g.group === '71 lat i więcej')!.pct;

const pielegniarstwo: InfographicSet = {
  route: '/en/analysis/nursing-in-poland-age-ladder/',
  page: 'Analysis: Nursing in Poland — the age ladder',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'age-of-nurses',
      title: 'One in three nurses is over 60',
      measure: `registered nurses by age · ${AGE_BASE.date} · ${formatEN(AGE_BASE.nurses)} in total`,
      split: {
        unit: '%',
        bars: [
          {
            segments: [
              { label: '61 and over', sub: `including ${f1(nurses71)}% over 70`, value: nursesOld, display: f1(nursesOld), tone: 'blue' },
              { label: '41–60', value: nursesMid, display: f1(nursesMid), tone: 'slate' },
              { label: 'up to 40', value: nursesYoung, display: f1(nursesYoung), tone: 'soft' },
            ],
          },
        ],
      },
      sources: 'Source: Supreme Chamber of Nurses and Midwives, report on the state of nursing (2023)',
      alt: `Infographic: the age of nurses entered in the Central Register of Nurses and Midwives (${AGE_BASE.date}, ${formatEN(AGE_BASE.nurses)} in total): ${f1(nursesOld)}% are 61 or over (including ${f1(nurses71)}% over 70), ${f1(nursesMid)}% are 41–60, ${f1(nursesYoung)}% are up to 40. Source: Supreme Chamber of Nurses and Midwives.`,
    },
  ],
};

/* ---------- Odsiew: od studiów do NFZ i zdawalność PES ---------- */

const fy2018 = STUDENTS_FIRST_YEAR.find((r) => r.year === '2018/19')!;
const firstAll = fy2018.pl.first + fy2018.foreign.first;
const plShare = fy2018.pl.first / firstAll;
// jak w wersji polskiej: kroki z samym odsetkiem dostają dopisek, czego dotyczy
const funnelSub = (note?: string) => {
  const text = note?.replace(/^·\s*/, '');
  return text && /^[\d.]+%$/.test(text) ? `${text} of graduates after 6 years` : text;
};
const funnel: ComparisonRow[] = [
  { label: 'Start medical school', sub: `${formatEN(firstAll)} people in the first semester of 2018/19`, value: 100, display: '100' },
  {
    label: 'Of whom Poles',
    sub: `${formatEN(Math.round((1 - plShare) * 100))} in 100 are foreigners, many study in English`,
    value: plShare * 100,
    display: formatEN(Math.round(plShare * 100)),
  },
  ...funnelRows.slice(1).map((r) => ({ label: r.label, sub: funnelSub(r.note), value: r.value * plShare, display: formatEN(Math.round(r.value * plShare)) })),
].map((r, i, all) => ({ ...r, highlight: i === all.length - 1 }));
const funnelEnd = funnel.at(-1)!.display;

const PES_FIELDS: Record<string, string> = {
  'Medycyna rodzinna': 'Family medicine',
  'Choroby wewnętrzne': 'Internal medicine',
  Pediatria: 'Paediatrics',
  Psychiatria: 'Psychiatry',
  Anestezjologia: 'Anaesthesiology',
  'Położnictwo i ginekologia': 'Obstetrics and gynaecology',
  Kardiologia: 'Cardiology',
};
const pesRows: ComparisonRow[] = [
  ...PES_2025.map((d) => ({ label: translate(PES_FIELDS, d.field, 'dziedzina PES'), y: pesYear(d), highlight: false })),
  { label: 'All fields', y: pesYear(PES_2025_ALL), highlight: true },
]
  .map(({ label, y, highlight }) => ({ label, sub: `${formatEN(y.passed)} of ${formatEN(y.n)} attempts`, value: y.rate, display: f1(y.rate), highlight }))
  .sort((a, b) => b.value - a.value);

const odsiew: InfographicSet = {
  route: '/en/analysis/medical-school-dropouts-and-emigration/',
  page: 'Analysis: Who drops out of medicine, and who leaves',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'from-medical-school-to-the-nfz',
      title: `From medical school to the NFZ: about ${funnelEnd} in 100`,
      measure: 'per 100 people who start medicine',
      rows: funnel,
      sources: 'Source: Ministry of Health BASiW (POL-on, ZUS, NFZ), our calculations · proportions from several cohorts',
      alt: `Infographic: of 100 people who start medicine (first semester of 2018/19, ${formatEN(firstAll)} people), ${funnel.slice(1).map((r) => `${r.display} — ${r.label.toLowerCase()}`).join(', ')}. The others at the start are foreigners, many of whom study in English. Steps 1–3: first-semester students of 2018/19 and Polish graduates of 2023/24; further steps — what happened to the 2016/17 cohort in 2023. This combines proportions from several cohorts rather than following one group of people. Source: Ministry of Health, Base of System and Implementation Analyses (${ODSIEW_LINKS.mz}).`,
    },
    {
      id: 'pes-pass-rate',
      title: 'What share pass the test part of the specialty exam',
      measure: 'PES, test part · share of attempts scoring at least 60% · 2025',
      unit: '%',
      rows: pesRows,
      sources: 'Source: CEM, PES test results, spring and autumn 2025 sessions, our calculations · all attempts',
      alt: `Infographic: share of attempts at the test part of the State Specialisation Examination (PES) scoring at least 60% in 2025 (spring and autumn sessions, all attempts): ${pesRows.map((r) => `${r.label} ${r.display}% (${r.sub})`).join(', ')}. The seven fields with the most attempts. The infographic does not cover the oral part of the exam — the Medical Examinations Centre does not publish its results. Source: CEM, lists of PES test results (${PES_LINK}), our calculations.`,
    },
  ],
};

/* ---------- Wizyty prywatne: pieniądze, świadczenia i czekanie; lekarze w dwóch sektorach ---------- */

const aosCost = change(AOS_FIRST.cost, AOS_LAST.cost);
const aosServices = change(AOS_FIRST.services, AOS_LAST.services);
const queueGrowth = change(WHC_2022.single, WHC_2024.single);
const aosRows: ComparisonRow[] = [
  { label: 'NFZ money', sub: `from PLN ${f1(AOS_FIRST.cost / 1e6)} to ${f1(AOS_LAST.cost / 1e6)} bn`, value: aosCost, display: `+${f1(aosCost)}`, highlight: true },
  { label: 'Services', sub: `from ${f1(AOS_FIRST.services / 1e6)} to ${f1(AOS_LAST.services / 1e6)} million`, value: aosServices, display: `+${f1(aosServices)}` },
  { label: 'Waiting time', sub: `from ${f1(WHC_2022.single)} to ${f1(WHC_2024.single)} months`, value: queueGrowth, display: `+${formatEN(queueGrowth)}` },
];
const shareIn = (n: number) => `${f1(n)}%`;

const wizytyPrywatne: InfographicSet = {
  route: '/en/analysis/private-visits-queues-and-prices/',
  page: 'Analysis: Private visits — the longer the queue, the higher the price',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'money-and-services',
      title: 'Adding money does not shorten waiting lists',
      measure: `specialist clinics with an NFZ contract · change ${AOS_FIRST.year}–${AOS_LAST.year}`,
      unit: '%',
      rows: aosRows,
      sources: `Sources: NFZ, report for ${AOS_LAST.year} (tables II.19–20), WHC Barometer · services: consultations and tests`,
      alt: `Infographic: in ${AOS_FIRST.year}–${AOS_LAST.year} NFZ costs of outpatient specialist care rose by ${f1(aosCost)}% (from PLN ${f1(AOS_FIRST.cost / 1e6)} to ${f1(AOS_LAST.cost / 1e6)} billion), the number of services by ${f1(aosServices)}% (from ${f1(AOS_FIRST.services / 1e6)} to ${f1(AOS_LAST.services / 1e6)} million), and the average waiting time for a service according to the WHC Barometer by ${formatEN(queueGrowth)}% (from ${f1(WHC_2022.single)} to ${f1(WHC_2024.single)} months). Sources: NFZ, activity report for ${AOS_LAST.year} (${WIZYTA_LINKS.nfz2024}); Watch Health Care Foundation, WHC Barometer.`,
    },
    {
      id: 'doctors-in-both-sectors',
      title: 'Over half of the doctors surveyed work in both sectors',
      measure: `NIL survey “Perspektywa 27” · 2026 · ${formatEN(NIL_N)} doctors and dentists`,
      split: {
        unit: '%',
        bars: [
          {
            segments: [
              { label: 'Public only', sub: 'NFZ-funded services', value: WORK_MODEL.publicOnly, display: f1(WORK_MODEL.publicOnly), share: shareIn(WORK_MODEL.publicOnly), tone: 'slate' },
              { label: 'Public and private', sub: `including ${f1(WORK_MODEL.both)}% equally`, value: combined, display: f1(combined), share: shareIn(combined), tone: 'blue' },
              { label: 'Private only', value: WORK_MODEL.privateOnly, display: f1(WORK_MODEL.privateOnly), share: shareIn(WORK_MODEL.privateOnly), tone: 'slate' },
              { label: 'No clinical work', value: NO_CLINICAL, display: f1(NO_CLINICAL), tone: 'soft' },
            ],
          },
        ],
      },
      sources: 'Source: Supreme Medical Chamber, “Perspektywa 27” (May 2026) · online survey, non-random sample',
      alt: `Infographic: model of clinical work in the Supreme Medical Chamber’s survey “Perspektywa 27” (29 April – 4 May 2026, ${formatEN(NIL_N)} doctors and dentists, non-random sample): ${f1(WORK_MODEL.publicOnly)}% worked only in publicly funded services, ${f1(combined)}% combined public and private work (${f1(WORK_MODEL.mostlyPublic)}% mainly public, ${f1(WORK_MODEL.both)}% to a similar extent, ${f1(WORK_MODEL.mostlyPrivate)}% mainly private), ${f1(WORK_MODEL.privateOnly)}% only privately, and ${f1(NO_CLINICAL)}% did no clinical work. Source: ${WIZYTA_LINKS.nil}.`,
    },
  ],
};

/* ---------- AI w medycynie ---------- */

const ai: InfographicSet = {
  route: '/en/analysis/ai-in-medicine-2026/',
  page: 'Analysis: Artificial intelligence in medicine in 2026',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'ai-and-doctors',
      title: `In difficult cases AI got the diagnosis right ${f1(NORI.nejm.ai / NORI.nejm.doctors)} times as often as doctors`,
      measure: 'correct diagnoses in a simulation · share of cases',
      unit: '%',
      rows: [
        { label: 'AI (MAI-DxO)', sub: 'difficult NEJM cases', value: NORI.nejm.ai, display: f1(NORI.nejm.ai), highlight: true },
        { label: 'Doctors', sub: 'difficult NEJM cases', value: NORI.nejm.doctors, display: f1(NORI.nejm.doctors) },
        { label: 'AI (MAI-DxO)', sub: 'patients admitted via the ED', value: NORI.sor.ai, display: f1(NORI.sor.ai), highlight: true },
        { label: 'Doctors', sub: 'patients admitted via the ED', value: NORI.sor.doctors, display: f1(NORI.sor.doctors) },
      ],
      sources: `Source: Nori et al., Science (2026), Microsoft AI · simulation on ${formatEN(NORI.cases)} cases, no patients`,
      alt: `Infographic: in a simulation described in Science (2026), Microsoft’s AI system MAI-DxO got the diagnosis right in ${f1(NORI.nejm.ai)}% of difficult cases from the New England Journal of Medicine, and doctors in ${f1(NORI.nejm.doctors)}% — ${f1(NORI.nejm.ai / NORI.nejm.doctors)} times less often. For patients admitted via the emergency department: AI ${f1(NORI.sor.ai)}%, doctors ${f1(NORI.sor.doctors)}%. ${formatEN(NORI.cases)} cases, without patients. Source: H. Nori et al., ${NORI.href}.`,
    },
    {
      id: 'model-and-patient',
      title: 'The model alone is right more often than the person using it',
      measure: 'naming the right condition from a description of symptoms · share of cases',
      unit: '%',
      rows: [
        { label: 'The language model alone', sub: 'GPT-4o, Llama 3, Command R+', value: BEAN.modelAlone, display: f1(BEAN.modelAlone) },
        { label: 'People using the model', sub: `${formatEN(BEAN.participants)} study participants`, value: BEAN.withModelBelow, display: `<${f1(BEAN.withModelBelow)}`, highlight: true },
      ],
      sources: 'Source: Bean et al., Nature Medicine 32 (2026), University of Oxford · scenarios, not real patients',
      alt: `Infographic: in a University of Oxford study (Nature Medicine, 2026), language models alone (GPT-4o, Llama 3, Command R+) named the right condition from a description of symptoms in ${f1(BEAN.modelAlone)}% of cases, and the ${formatEN(BEAN.participants)} study participants who used them — in fewer than ${f1(BEAN.withModelBelow)}%. Source: A. M. Bean et al., ${BEAN.href}.`,
    },
  ],
};

/* ---------- Samorząd lekarski o ustawie z 19.06.2026 (cytat, tłumaczenie własne jak w artykule) ---------- */

const nil: InfographicSet = {
  route: '/en/analysis/medical-chamber-and-doctors-contracts/',
  page: 'Analysis: The medical chamber and doctors’ contracts',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'quote-tribunals',
      title: 'The medical self-government on the act of 19 June 2026',
      measure: 'The medical self-government on the act of 19 June 2026',
      quote: {
        lines: {
          poziom: ['If the President signs the act,', 'we will go to the **European Tribunals**', 'and demand that it be repealed”.'],
          pion: ['If the President', 'signs the act,', 'we will go to the', '**European Tribunals**', 'and demand that', 'it be repealed”.'],
        },
        who: 'President of the Supreme Medical Chamber',
        where: 'on RMF FM, June 2026 · our translation',
        facts: [
          { label: 'What the act does', text: 'Facilities send the minister of health, at the minister’s request, pay data with the PESEL and PWZ numbers. **The act does not provide for publishing it.**' },
          { label: 'The President', text: '**Signed the act on 17 July 2026.**\nJournal of Laws 2026 item 972' },
        ],
      },
      sources: 'Source: Gazeta Prawna, 27 June 2026 (report from RMF FM) · Journal of Laws 2026 item 972',
      alt: 'Infographic with a quote. The President of the Supreme Medical Chamber on RMF FM in June 2026: “If the President signs the act, we will go to the European Tribunals and demand that it be repealed” (our translation). What the act of 19 June 2026 does: facilities send the minister of health, at the minister’s request, pay data with the PESEL and PWZ numbers; the act does not provide for publishing it. The President signed the act on 17 July 2026 (Journal of Laws 2026 item 972). Source: Gazeta Prawna, 27 June 2026.',
    },
  ],
};

/* ---------- Reglamentacja dostępu: sprzeciwy samorządu na osi czasu ---------- */

const specialist2015 = WHC_EDITIONS.filter((e) => e.year === 2015 && e.specialist !== null);
const specialistFrom = specialist2015.reduce((sum, e) => sum + e.specialist!, 0) / specialist2015.length;
const specialistNow = WHC_LATEST.specialist!;
const stanceYears = `${SELF_GOVERNMENT_STANCES[0].year}–${SELF_GOVERNMENT_STANCES.at(-1)!.year}`;
const STANCE_WHO: Record<string, string> = { 'Prezydium NRL': 'Presidium of the NRL', 'Prezes NRL': 'President of the NRL', NRL: 'NRL' };
const STANCE_TEXT: Record<string, string> = {
  'Wniosek o mniejszy limit na stomatologii': 'Request for a smaller limit in dentistry',
  'Propozycja oceny absolwentów uczelni bez opinii PKA': 'Proposal to assess graduates of universities without a PKA opinion',
  'Krytyka 215 nowych miejsc na 4 uczelniach': 'Criticism of 215 new places at 4 universities',
  'Za uchyleniem trybów uproszczonych dla lekarzy spoza UE': 'For repealing the simplified procedures for doctors from outside the EU',
  'Przeciw limitowi 6 649 miejsc na studiach': 'Against a limit of 6,649 places at medical schools',
  'Przeciw samodzielnemu zlecaniu TK i RM przez pielęgniarki': 'Against nurses ordering CT and MRI scans on their own',
};
const stances = SELF_GOVERNMENT_STANCES.map((e) => ({ year: String(e.year), text: translate(STANCE_TEXT, e.text, 'stanowisko samorządu'), who: translate(STANCE_WHO, e.who, 'organ samorządu') }));

const reglamentacja: InfographicSet = {
  route: '/en/mechanisms/restricted-access-to-the-profession/',
  page: 'Mechanism: Restricted access to the profession',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'a-decade-of-no',
      title: 'A decade of one',
      titleAccent: '“no”',
      measure: `the medical self-government on increasing the number of doctors · ${stanceYears}`,
      timeline: {
        events: stances,
        note: 'The self-government’s reasons: the quality of education and patient safety.',
        figures: [
          { value: f1(specialistNow), unit: 'months', text: `average wait for a specialist appointment (${WHC_LATEST.year}); in 2015 — ${f1(specialistFrom)} months`, highlight: true },
          { value: String(SURPLUS_YEAR), text: 'from this year the number of doctors is to exceed demand — according to the medical chamber’s expert report' },
        ],
      },
      sources: `Sources: NIL — positions of the NRL and its Presidium ${stanceYears} (nil.org.pl, MedExpress, Puls Medycyny, Prawo.pl) · WHC Barometer ${WHC_LATEST.label}`,
      alt: `Infographic “A decade of one ‘no’”: a timeline of the medical self-government’s objections to increasing the number of doctors, ${stanceYears}. ${stances.map((e) => `${e.year} (${e.who}): ${e.text.charAt(0).toLowerCase()}${e.text.slice(1)}`).join('; ')}. The self-government justifies its positions by the quality of education and patient safety. The average wait for a specialist appointment is ${f1(specialistNow)} months (WHC Barometer ${WHC_LATEST.label}), compared with ${f1(specialistFrom)} months in 2015. According to the medical chamber’s expert report, from ${SURPLUS_YEAR} the number of doctors is to exceed demand.`,
    },
  ],
};

/* ---------- Film „Doba”: trzy umowy jednego lekarza (wpis w aktualnościach) ---------- */

// jak w wersji polskiej: 1 kropka = 10 000 zł rocznie, 24 + 40 + 36 = 100 pól
const DOT_ZL = 10_000;
const dobaParts = [
  { who: 'seen by hospital A', label: 'employment', value: DOBA_MODEL.etat },
  { who: 'seen by hospital B', label: 'contract, % of procedures', value: DOBA_MODEL.kontrakt },
  { who: 'seen by entity C', label: 'civil-law contract', value: DOBA_MODEL.ucp },
];
const dobaSum = dobaParts.reduce((n, p) => n + p.value, 0);
const dobaViews: ViewPart[] = dobaParts.reduce<ViewPart[]>((acc, p) => {
  const from = acc.reduce((n, x) => n + x.dots, 0);
  return [...acc, { who: p.who, label: p.label, display: formatEN(p.value), from, dots: Math.round(p.value / DOT_ZL) }];
}, []);
const dobaHours = DOBA_MODEL.hours * dobaParts.length;

const filmDoba: InfographicSet = {
  route: '/en/news/film-one-doctor-three-contracts/',
  page: 'News: New film — one doctor, three contracts',
  filePrefix: 'zarobkilekarzy-en',
  locale: 'en',
  items: [
    {
      id: 'three-windows',
      title: 'Each sees their own piece. Nobody sees the total',
      measure: `model example · three contracts · one year · 1 dot = PLN ${formatEN(DOT_ZL)} gross`,
      views: {
        parts: dobaViews,
        total: { display: formatEN(dobaSum), label: 'one doctor, one year', sub: `PLN ${formatEN(1_000_000 - dobaSum)} short of a million` },
        slogan: 'One person. One sum. Anonymously.',
        brackets: { part: `${DOBA_MODEL.hours} h`, total: `${dobaHours} h in a single day` },
      },
      sources: 'Model example from the film “Doba” (“24 hours”) · gross amounts · each contract complies with the rules in force',
      alt: `Infographic “Each sees their own piece. Nobody sees the total” — a model example from the film “Doba” (“24 hours”): one doctor with three contracts, gross amounts for a year, one dot is PLN ${formatEN(DOT_ZL)}. Three small boards of 100 squares, each with only the squares of one contract lit: hospital A sees the employment contract — PLN ${formatEN(DOBA_MODEL.etat)}, hospital B sees the contract with a percentage of procedures — PLN ${formatEN(DOBA_MODEL.kontrakt)}, entity C sees the civil-law contract — PLN ${formatEN(DOBA_MODEL.ucp)}. Above each board a bracket “${DOBA_MODEL.hours} h”: each contract bills a full 24 hours. Next to them a full board in cobalt with the bracket “${dobaHours} h in a single day”: PLN ${formatEN(dobaSum)} in total, one doctor, one year, PLN ${formatEN(1_000_000 - dobaSum)} short of a million — nobody sees this total. Slogan: One person. One sum. Anonymously.`,
    },
  ],
};

export const infographicSetsEn: Record<string, InfographicSet> = {
  'film-doba': filmDoba,
  'nil-a-kontrakty-lekarskie': nil,
  'odpowiedzialnosc-zawodowa-lekarzy': odpowiedzialnosc,
  'english-division': englishDivision,
  'budzet-nfz': kolejki,
  'zadluzenie-szpitali': zadluzenie,
  'pielegniarstwo-w-polsce': pielegniarstwo,
  'odsiew-na-medycynie': odsiew,
  'wizyty-prywatne-kolejka-cena': wizytyPrywatne,
  'ai-w-medycynie-2026': ai,
  'reglamentacja-dostepu': reglamentacja,
};
