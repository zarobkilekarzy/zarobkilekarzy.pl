/**
 * Dane wersji angielskiej artykułu src/content/articles/publiczna-prywatna-ochrona-zdrowia.mdx.
 * Polski artykuł trzyma liczby w samym MDX (nie w module src/data/), więc są tu przepisane co do cyfry;
 * wspólny moduł src/data/kolejki.ts (wzrost kosztów NFZ i kolejki) importuje bezpośrednio treść EN (GROWTH).
 * Pojedyncze kwoty w tekstach list — z euro w nawiasie po kursie z buildu (src/i18n/rates.ts);
 * na wykresach i w tabelach — same PLN i USD, jak w przewodniku tłumaczenia.
 * Treść artykułu: src/content/en/articles/public-and-private-healthcare.mdx.
 */
import type { BarRow, CompareTable, TextItem } from '@/types';
import { formatEN } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur } from '@/i18n/money';

const rates = await getRates();
/** kwota w miliardach z euro w nawiasie; `decimals` jak w oryginale („4,1 mld zł” → 1, „10 mld zł” → 0) */
const bnMoney = (currency: 'PLN' | 'USD') => (amount: number, decimals: number) =>
  withEur(amount * 1e9, currency, rates, { scale: 'billion', decimals });
const pln = bnMoney('PLN');
const usd = bnMoney('USD');

export const LINKS = {
  oecdPerCapita: 'https://www.oecd.org/en/publications/health-at-a-glance-2025_8f9e3f98-en/full-report/health-expenditure-per-capita_affe6b0a.html',
  oecdSchemes: 'https://www.oecd.org/en/publications/health-at-a-glance-2025_8f9e3f98-en/full-report/health-expenditure-by-financing-scheme_074bead0.html',
  eurostatSha: 'https://ec.europa.eu/eurostat/databrowser/view/hlth_sha11_hf/',
  oddzialy: 'https://portal.abczdrowie.pl/539-zawieszonych-i-zamknietych-oddzialow-szpitalnych-powodem-glownie-braki-kadrowe/7242595503827456a',
  nrz2024: 'https://api.sejm.gov.pl/eli/acts/MP/2026/971/text.pdf',
  nrzSeria: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/wydatki-na-ochrone-zdrowia-w-latach-2022-2024,27,5.html',
  whc: 'https://www.korektorzdrowia.pl/wp-content/uploads/barometr-whc-2025.pdf',
  gw: 'https://gloswielkopolski.pl/za-9-lat-ta-operacja-nie-bedzie-mi-juz-potrzebna-pani-agnieszka-na-zabieg-na-cito-u-degi-w-poznaniu-ma-czekac-az-do-2035-roku/ar/c14p2-29386235',
  lop: 'https://www.termedia.pl/pobierz/28761ac10ff69d4055cd0f793cfa9175',
  ostrzeszow: 'https://tvn24.pl/poznan/ostrzeszow-lekarze-przechodza-do-innego-szpitala-oddzialy-zawieszone-st8797075',
  cms: 'https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet',
  gus60: 'https://stat.gov.pl/obszary-tematyczne/osoby-starsze/osoby-starsze/sytuacja-osob-starszych-w-polsce-w-2022-roku,2,5.html',
};

/* ── Health spending per capita, USD PPP, 2024 — OECD, System of Health Accounts ─────────────
   USA „public” = government schemes (HF11) + social insurance (HF121), without compulsory private
   insurance under the ACA (HF122) — as in the Polish original. */
export const USA_PUBLIC = 4_057 + 3_430;
export const PL_TOTAL = 4_328;
const PER_CAPITA = [
  { label: 'USA — all spending', value: 14_823 },
  { label: 'USA — public programmes only (Medicare, Medicaid and others)', value: USA_PUBLIC, highlight: true },
  { label: 'Germany — all spending', value: 9_584 },
  { label: 'Sweden — all spending', value: 7_906 },
  { label: 'France — all spending', value: 7_433 },
  { label: 'United Kingdom — all spending', value: 7_008 },
  { label: 'Czechia — all spending', value: 5_201 },
  { label: 'Poland — all spending', value: PL_TOTAL },
];
export const perCapitaRows: BarRow[] = PER_CAPITA.map((r) => ({ ...r, display: formatEN(r.value) }));
export const perCapitaCaption = `Bar chart, health spending per capita in 2024 in US dollars at purchasing power parity: ${PER_CAPITA.map((r) => `${r.label} ${formatEN(r.value)}`).join('; ')}.`;

/* ── Poland and the EU-27, 2024 — Eurostat hlth_sha11_hf (PPS per capita) ─────────────────── */
export const PL_PUBLIC_PPS = 2_011;
export const EU_PUBLIC_PPS = 3_273;
export const publicVsEu = Math.round((PL_PUBLIC_PPS / EU_PUBLIC_PPS) * 100);

/* ── National Health Accounts, PLN million — announcements of the President of GUS; 2024: M.P. 2026 item 971 */
export const NRZ = {
  2015: { total: 114_142.4, pub: 79_886.6, priv: 34_255.8 },
  2024: { total: 287_565.5, pub: 221_187.8, priv: 66_377.7, oop: 47_640.5 },
};
export const share = (y: 2015 | 2024) => (NRZ[y].priv / NRZ[y].total) * 100;
export const OOP = [
  { year: 2015, value: 26_533.9 }, { year: 2016, value: 27_787.2 }, { year: 2017, value: 29_679.2 },
  { year: 2018, value: 27_413.2 }, { year: 2019, value: 29_701.9 }, { year: 2020, value: 29_668.4 },
  { year: 2021, value: 33_625.3 }, { year: 2022, value: 36_963.4 }, { year: 2023, value: 38_633.2 },
  { year: 2024, value: 47_640.5 },
];
/** PLN million → PLN billion in English notation */
export const bn = (v: number, d = 1) => formatEN(v / 1000, d);

export const oopColumns = OOP.map((o) => ({ label: String(o.year), value: o.value, display: bn(o.value) }));
export const oopCaption = `Column chart, patients’ out-of-pocket spending in PLN billion: ${OOP.map((o) => `${o.year} — ${bn(o.value)}`).join('; ')}.`;

export const spendingGroups = [
  { value: NRZ[2024].pub, kind: 'on' as const, label: 'PLN bn — public money: NFZ, state budget, local government' },
  { value: NRZ[2024].oop, kind: 'mid' as const, label: 'PLN bn — patients out of pocket: visits, medicines, dentistry, tests' },
  { value: NRZ[2024].priv - NRZ[2024].oop, kind: 'off' as const, label: 'PLN bn — subscriptions, insurance policies, employers and other private spending' },
].map((g) => ({ ...g, value: Math.round(g.value / 1000) }));

/* ── Who pays and who treats ───────────────────────────────────────────────────────────────── */
export const MATRIX: CompareTable = {
  columns: ['', 'Public facility', 'Private facility'],
  rows: [
    { cells: ['The NFZ pays', 'county hospital, independent public healthcare facility (SPZOZ), research institute — the core of the system', 'a company with an NFZ contract: outpatient clinic, MRI unit, dialysis centre, some hospitals'] },
    { cells: ['The patient or their employer pays', 'paid services of a public hospital, e.g. a higher-standard room, a test without a referral', 'private practice, a chain of clinics with subscriptions, an insurance policy, a private hospital'] },
  ],
};

/* ── Job offers for doctors in 2023, average hourly rate — report “Lekarze — oferty pracy” ─── */
export const OFFER = { hospital: 162.79, aos: 248.58 };
export const pullOf = (l: number, r: number) => ((r - l) / (r + l)) * 2;

/* ── The same pathology, a different scale ─────────────────────────────────────────────────── */
export const USA_PL: CompareTable = {
  columns: ['', 'USA', 'Poland'],
  rows: [
    { cells: ['The most expensive risk', 'people aged 65+ are about 17% of the population and about 37% of spending; they are insured by the state Medicare programme', 'people aged 60+ are 25.9% of the population and 55.4% of NFZ spending on hospital treatment; 16% of people aged 65+ have additional insurance'] },
    { cells: ['Training doctors', 'Medicare: about $21.2 billion a year on residencies', 'state budget: PLN 4.1 billion on internships and specialist training in 2025; medical studies PLN 200,000–250,000 per doctor'] },
    { cells: ['Choosing profitable patients', 'private Medicare Advantage plans: the state pays about 14% more per senior, mainly because of favourable selection', 'Supreme Audit Office (NIK, 2016): in private cardiology centres 81–99% of procedures were invasive, priced 5–6 times higher; the public hospital took over the remaining patients'] },
    { cells: ['Referring to one’s own facility', 'banned by statute; doctors referring to their own units ordered about twice as many MRI and CT scans', 'no ban in the acts; adding patients outside the queue order is the problem of combining sectors most often named by doctors (41.4%)'] },
    { cells: ['Losses and unprofitable treatment', 'the emergency department must treat everyone; $42.7 billion of unpaid treatment in 2020', 'local governments added more than PLN 10 billion to hospitals in 2015–2025; 91% of county hospitals made a loss'] },
    { cells: ['How much doctors are paid from public money', 'Medicare publishes payments to each doctor every year — with the name', 'unknown; the data are collected by the Agency for Health Technology Assessment and Tariff System (AOTMiT), with nothing published for an individual'], marked: true },
  ],
};

/* ── NFZ report for Q2 2026 (annex to NFZ Council resolution no. 33/2026/V): table 3 (costs, PLN thousand) ── */
export const POZ_TABLE: CompareTable = {
  columns: ['', 'H1 2025', 'H1 2026', 'Change'],
  rows: [
    { cells: ['NFZ costs of primary care (POZ)', 'PLN 10.60 billion', 'PLN 12.17 billion', '+14.8%'] },
    { cells: ['Primary care patients', '24.40 million', '23.97 million', '−1.8%'] },
    { cells: ['Consultations by primary care doctors', '66.26 million', '58.65 million', '−11.5%'], marked: true },
    { cells: ['Visits by primary care nurses', '8.72 million', '8.18 million', '−6.2%'] },
    { cells: ['Primary care costs per doctor’s consultation (our calculation)', 'about PLN 160', 'about PLN 207', '+29.7%'] },
  ],
};

export const SENIORS: BarRow[] = [
  { label: 'USA — people aged 65+ in the population', value: 17, display: 'about 17%' },
  { label: 'USA — their share of spending on health services', value: 37, display: 'about 37%', highlight: true },
  { label: 'Poland — people aged 60+ in the population', value: 25.9, display: '25.9%' },
  { label: 'Poland — their share of NFZ spending on hospital treatment', value: 55.4, display: '55.4%', highlight: true },
];

/* ── WHC Barometer, IX/X 2025, average waiting time in months; the Poznań case — urgent referral of IX 2026, date 1.10.2035 */
export const QUEUES = [
  { label: 'Visit to a cardiologist', value: 4.6, display: '4.6 months' },
  { label: 'Gastroscopy', value: 5.8, display: '5.8 months' },
  { label: 'Hip replacement', value: 17.6, display: '17.6 months' },
  { label: 'Knee replacement (stable case)', value: 18.9, display: '18.9 months' },
  { label: 'Hand reconstruction with an urgent referral — a single case described in the press', value: 108, display: 'about 9 years', kind: 'mid' as const },
  { label: 'The route through a private practice: from a paid visit to surgery in a hospital with an NFZ contract', display: 'nobody measures it', missing: true },
];
export const queuesCaption = `Waiting time in months: ${QUEUES.map((q) => `${q.label} — ${q.display}`).join('; ')}.`;

/* ── The American model: lists ─────────────────────────────────────────────────────────────── */
export const US_MECHANISMS: TextItem[] = [
  { title: 'The state takes the most expensive risk.', text: 'People over 65 are about 17% of Americans but about 37% of spending on health services. They are insured by Medicare, that is by the taxpayer, while private insurers serve mainly people in work.' },
  { title: 'A private intermediary earns by choosing healthier people.', text: `In private Medicare Advantage plans the state pays about 14% more for the same senior than in traditional Medicare, about ${usd(76, 0)} in 2026. The main reason is selection: the plans enrol people who are healthier than the rate assumes.` },
  { title: 'The emergency department treats everyone.', text: `Since 1986 a hospital with an emergency department must examine and stabilise every patient regardless of insurance. Hospitals put the cost of unpaid treatment in 2020 at ${usd(42.7, 1)}.` },
  { title: 'Medicare pays for training doctors.', text: `Medicare spent about ${usd(21.2, 1)} on residencies in fiscal year 2023. The number of funded places was frozen by a 1997 act at the 1996 level.` },
  { title: 'A tax break instead of charity.', text: `Tax exemptions for non-profit hospitals were worth about ${usd(28, 0)} in 2020. These hospitals spent about ${usd(16, 0)} on free treatment for the poorest.` },
];

/* ── Socialising costs, privatising profits ────────────────────────────────────────────────── */
export const COST_SHIFTS: TextItem[] = [
  { title: 'The state pays for training, the doctor sells the skills.', text: `Six years of medical studies cost PLN 200,000–250,000 according to the Ministry of Health (a 2021 estimate). Internships and specialist training cost the state budget ${pln(4.1, 1)} in 2025. Only those who took out a loan for paid studies have an obligation to work in public healthcare. A graduate of free studies may work exclusively in the private sector from day one.` },
  { title: 'The NFZ treats the oldest and the most seriously ill.', text: 'People over 60 are 25.9% of the population but account for 55.4% of NFZ spending on hospital treatment. Additional insurance or a medical subscription is held by 49% of people aged 25–34 and 16% of people over 65. Subscriptions serve mainly people in work; the costly risk stays in the public system.' },
  { title: 'Profitable services go separately, the rest to the hospital.', text: 'In a 2016 audit, NIK found that in non-public cardiology centres invasive procedures accounted for 81–99% of all services, in public ones for 31–81%. The NFZ priced them 5–6 times higher than conservative treatment. The private wards usually operated in premises rented from public hospitals, and the hospital took over the remaining patients. In one case NIK found “deliberate selection of patients” (our translation).' },
  { title: 'The same rooms and the same hours.', text: 'In its audit of the Southern Hospital in Warsaw (Szpital Południowy), NIK found in 2026 that the orthopaedic ward did not separate NFZ services from paid ones, and for two of the four doctors the hours billed to the NFZ overlapped with hours of commercial work.' },
  { title: 'Local government covers the losses.', text: `Counties and cities with county rights added more than ${pln(10, 0)} to hospitals in 2015–2025. The liabilities of public hospitals reached ${pln(34, 0)} at the end of 2025. A listed medical group that earns more than half of its revenue in Poland, and 79% from private payers, reported an EBITDA margin of 15.6% in 2025.` },
];
