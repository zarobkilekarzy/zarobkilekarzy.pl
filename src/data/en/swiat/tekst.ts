/**
 * Glob płac lekarzy, wersja angielska: napisy interfejsu, tabeli, szczegółów kraju, dymków, sekcji „Jak czytać”
 * i zwiastunu (ten sam typ co polski słownik w src/lib/swiat/text.ts) oraz teksty strony /en/data/doctors-pay-worldwide/.
 * Kwoty w US$, € albo PLN z „k” i „million”; waluta na starcie — dolar.
 */
import { formatDateIn, formatEN } from '@/lib/format';
import type { MethodFacts, WorldText } from '@/lib/swiat/text';
import type { Currency, Measure } from '@/lib/swiat/types';

const NBSP = ' ';
const LABEL: Record<Currency, string> = { PLN: 'PLN', EUR: '€', USD: 'US$' };
const NAME: Record<Currency, string> = { PLN: 'zloty', EUR: 'euro', USD: 'US dollars' };
const PPP_WHERE: Record<Currency, string> = {
  PLN: 'zloty at Polish purchasing power',
  EUR: 'euro at average EU purchasing power',
  USD: 'international dollars (purchasing power as in the US)',
};
const countries = (n: number) => `${formatEN(n)} ${n === 1 ? 'country' : 'countries'}`;

/** amount on a scale: „241k”, „1.10 million” (up to 3 significant digits below 100k) */
function scaled(v: number): [string, string] {
  if (v >= 1e6) return [formatEN(v / 1e6, 2), 'million'];
  if (v >= 1e5) return [formatEN(Math.round(v / 1e3)), 'k'];
  if (v >= 1e3) return [formatEN(v / 1e3, v >= 1e4 ? 0 : 1), 'k'];
  return [formatEN(Math.round(v)), ''];
}

/** „US$241k”, „€1.10 million”, „PLN 241k” */
function money(v: number, currency: Currency): string {
  const [n, s] = scaled(v);
  const prefix = currency === 'PLN' ? `PLN${NBSP}` : LABEL[currency];
  return `${prefix}${n}${s === 'million' ? `${NBSP}million` : s}`;
}

export const enText: WorldText = {
  locale: 'en',
  currency: 'USD',
  num: formatEN,
  /** English typography: only a non-breaking space before a dash */
  typo: (s: string) => s.replace(/ —/g, `${NBSP}—`),
  date: (iso: string) => formatDateIn(new Date(`${iso}T00:00:00Z`), 'en'),
  collator: 'en',
  countries,

  form: { e: 'Employed', f: 'Self-employed' },
  measure: { r: '× average wage', n: '× nurse', x: 'Amount', p: 'Purchasing power', j: 'Transparency' },
  level: ['none', 'rules and averages only', 'on request or partly', 'published by name by law'],
  levelShort: ['none', 'rules', 'on request', 'by name'],
  scope: { total: 'total income of the person', one: 'pay from one employer' },
  currencyButton: { PLN: 'PLN', EUR: '€', USD: 'US$' },
  flags: {
    E: 'OECD estimate',
    D: 'definition differs from the OECD standard',
    B: 'break in series',
    P: 'provisional data',
    O: 'indicative ratio',
  },
  oecdGroup: { se: 'Salaried specialists', sf: 'Self-employed specialists', gf: 'Self-employed general practitioners' },

  scaled,
  money,
  /** amounts in a country's currency in the text („2,564,501 NGN”, „4,440.3 thousand UZS”) */
  amount: /(\d[\d,]*(?:\.\d+)?)(?:–(\d[\d,]*(?:\.\d+)?))?\s(thousand\s)?([A-Z]{3})\b/g,
  parseNumber: (s: string) => Number(s.replace(/,/g, '')),

  view: {
    context: {
      r: 'the average wage',
      n: 'a nurse’s pay',
      x: 'a year',
      p: 'a year, purchasing power',
      j: 'whether an individual doctor’s publicly funded pay can be known',
    },
    sentence: (measure: Measure, currency: Currency) =>
      measure === 'r'
        ? 'A doctor’s pay divided by the average wage in the same country.'
        : measure === 'n'
          ? 'A doctor’s pay divided by the pay of a salaried hospital nurse in the same country and year (OECD data only).'
          : measure === 'x'
            ? `Gross annual pay in ${NAME[currency]}, at the exchange rate of the data year and the NBP rate.`
            : measure === 'p'
              ? `Gross annual pay in ${PPP_WHERE[currency]}.`
              : 'Whether the pay of an individual doctor paid from public money can be known. The legal provision is in the country details.',
    legend: { r: ['< 2×', '2–2.5×', '2.5–3×', '3–4×', '≥ 4×'], n: ['< 1.5×', '1.5–2×', '2–2.5×', '2.5–3×', '≥ 3×'] },
    thousands: (v: number) => formatEN(Math.round(v / 1000)),
    legendUnit: (currency: Currency) => `${LABEL[currency]} thousand`,
  },

  globe: {
    label: (sentence: string) => `Globe. ${sentence} The same data are in the country table.`,
    ctl: { measure: 'Measure', form: 'Employment', currency: 'Currency' },
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    kinds: { nat: 'national data, not OECD', partial: 'partial data', none: 'no data', notStudied: 'not studied' },
    hint: 'Drag to rotate · click a country',
    announce: 'Country details: ',
  },

  tips: {
    level: (label: string) => `Transparency: ${label}`,
    notStudied: 'Transparency not studied yet',
    noValue: 'No value in this view',
    noOfficial: 'No official data',
    click: 'Click to see what is known',
    nat: 'national data',
    noData: 'No data',
  },

  ranking: {
    title: 'All countries with data',
    note: {
      e: 'OECD: salaried specialists; national data: usually all salaried doctors, the group is given in the country details.',
      f: 'OECD: self-employed specialists, or general practitioners where specialists are missing. Income after practice costs.',
    },
    click: 'Click a country to expand its details.',
    rest: 'Other data, no value in this view',
    key: {
      pl: 'Poland',
      oecd: 'OECD',
      nat: 'national data',
      est: 'OECD estimate or indicative ratio',
      def: '* definition differs from the OECD standard',
      old: 'underlined year = older than 2022',
      rates: (date: string, usd: string, eur: string) => `NBP rates of ${date}: 1${NBSP}USD${NBSP}=${NBSP}PLN${NBSP}${usd}, 1${NBSP}EUR${NBSP}=${NBSP}PLN${NBSP}${eur}`,
    },
  },

  details: {
    kind: {
      avg: 'National data',
      partial: 'National data, partial',
      scale: 'Pay scale (a rate, not an average)',
      broad: 'Broader occupational group only',
      none: 'What is known',
    },
    tag: { oecd: 'OECD', nat: 'National data' },
    empty: {
      nurseNational: 'We compute the ratio to a nurse’s pay only from OECD data on both professions, and for this country we have national data on doctors.',
      nurse: 'The OECD has no pay data for hospital nurses for the same year.',
      measure: 'No conversion for this measure.',
      selfPoland: 'No data. The OECD has no data on self-employed doctors in Poland, and according to a working document of the Agency for Health Technology Assessment and Tariff System (AOTMiT), 73% of specialists work under civil-law (B2B) contracts.',
      self: 'The OECD has no data on self-employed doctors in this country.',
      employedHasSelf: 'No average pay for salaried doctors. Data on self-employed doctors are in the other view.',
      employed: 'No average pay for salaried doctors. What is known is described below.',
      notStudied: 'We have not yet studied pay transparency in this country.',
    },
    trend: {
      title: 'Change over time · × average wage',
      doctor: { se: 'salaried specialist', sf: 'self-employed specialist', ge: 'salaried general practitioner', gf: 'self-employed general practitioner' },
      nurse: 'hospital nurse',
      aria: (lines: string) => `Change over time, multiple of the average wage. ${lines}`,
      line: (label: string, first: string, y0: number, last: string, y1: number) => `${label}: ${first}× in ${y0}, ${last}× in ${y1}`,
    },
    more: 'More',
    moreParts: { j: 'pay transparency', oecd: 'OECD data', nat: 'national data', natSources: 'national data and sources', notes: 'notes' },
    jTitle: 'Pay transparency',
    oecdTitle: 'All OECD data',
    oecdHead: ['Employed', 'Self-employed'],
    oecdRows: { se: 'Specialists', ge: 'General practitioners', n: 'Hospital nurses' },
  },

  teaser: {
    href: '/en/data/doctors-pay-worldwide/',
    eyebrow: 'World · OECD and national offices',
    title: 'What doctors earn in other countries',
    action: 'Globe with the data',
    aria: 'Go to the globe of doctors’ pay',
    globe: 'Globe: doctors’ pay relative to the average wage in each country',
    lead: (lo: string, hi: string, n: number) =>
      `A salaried doctor earns from ${lo} to ${hi} times as much as the average employee in their country. We compare ${countries(n)}, in US dollars and in purchasing power.`,
    note: 'Multiple of the average wage in each country; the comparison is very approximate, because countries measure pay differently. OECD: salaried specialists; United States, Taiwan, Japan, Russia: national data, usually all doctors. Poland: employment contracts only, without civil-law (B2B) contracts and without adding up pay from several jobs.',
  },

  method: {
    anchor: 'how-to-read',
    title: 'How to read these data',
    sources: 'Sources',
    summary: {
      main: (n: number) => `OECD, exchange rates and conversion factors (${n})`,
      j: (n: number) => `Pay transparency: legal provisions (${countries(n)})`,
      nat: (n: number) => `National data (${countries(n)})`,
    },
    how: (f: MethodFacts) => [
      'For OECD countries, the employed view shows salaried specialists: average gross annual income, including tax and the social contributions paid by the doctor. The self-employed view shows income after practice costs. General practitioners are in the country details.',
      'National data come from statistical offices and ministries. They usually cover all salaried doctors, not only specialists, and sometimes only one sector. The country details say whom they cover; on the map they are marked with a ring.',
      '“× average wage” divides a doctor’s pay by the average wage of all employees in the same country. For national data both numbers come from the same office and year.',
      `“Amount”: the OECD converts pay into US dollars at the exchange rate of the data year, and we convert national data the same way, at the annual average rate. Into zloty and euro we convert at the National Bank of Poland (NBP) rate of ${f.date}, refreshed every time the site is updated.`,
      `“Purchasing power”: pay in US dollars at purchasing power parities for household consumption (PPP). In zloty it is what one would have to earn in Poland to buy the same (PLN${NBSP}${f.pplPpp} per international dollar, ${f.pppYear}). In euro, at average EU prices (Eurostat purchasing power standard, US$${f.usdPps} per PPS, ${f.ppsYear}). In US dollars, at US prices.`,
      `Amounts in a country’s own currency in the country details are followed by a conversion into the chosen currency in brackets, at the NBP rate: table A of ${f.date}, and for currencies outside it (e.g. the naira or the Ugandan shilling) table B ${f.bTable} of ${f.bDate}. This is the rate on the day of the update, not in the data year.`,
      'Each country shows the latest year available, from 2015 to 2026. The comparison mixes different years and definitions, so differences of a few tenths mean nothing.',
      'The OECD warns that in some countries salaried pay is understated: without overtime and bonuses, without private practice, for the public sector only, or including doctors in specialist training.',
      'A pay scale in a legal act says what the rate is, not what doctors actually earn, and the pay of a broader occupational group is not doctors’ pay. That is why such countries are grey on the map and their numbers appear only in the country details.',
      '“× nurse” divides a doctor’s pay by the pay of a salaried hospital nurse in the same year; both numbers come from the OECD. The chart of change in the country details shows both as multiples of the average wage; a gap in the line marks a change of method.',
      `“Transparency” shows whether the pay of an individual doctor paid from public money can be known: published by name by law, on request or partly, only pay scales and averages, or not at all. We studied ${countries(f.transparent)} and give the legal provision for each. None of them publishes the total payments from public money to each doctor; the closest are Italy (senior staff only) and British Columbia in Canada (payments from one plan).`,
    ],
    main: (f: MethodFacts) => [
      'OECD, Remuneration of health professionals (OECD Health Statistics 2025), downloaded via the API on 27 October 2026; sex: total',
      'OECD, Health at a Glance 2025 — Remuneration of general practitioners, section “Definition and comparability”',
      'OECD Health Statistics 2025 — Definitions, Sources and Methods: Remuneration of specialists',
      'Statistics Poland (GUS), Structure of wages and salaries by occupation in October 2024 — methodological notes (in Polish)',
      'World Bank, PPP conversion factor, private consumption (PA.NUS.PRVT.PP) and Official exchange rate (PA.NUS.FCRF)',
      'Eurostat, Purchasing power parities (prc_ppp_ind), household final consumption (A01)',
      `National Bank of Poland (NBP), mid rates, table ${f.aTable} of ${f.date} and table ${f.bTable} of ${f.bDate}`,
    ],
  },
};

/** „1st”, „2nd”, „16th” */
const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

/** Teksty strony /en/data/doctors-pay-worldwide/ (odpowiednik nagłówka i bloków src/pages/dane/zarobki-lekarzy-na-swiecie/). */
export const enPage = {
  title: 'What doctors earn around the world',
  seoTitle: 'Doctors’ pay around the world',
  eyebrow: 'Data · international comparison',
  lead: (n: number) =>
    `How many times more than the average employee a salaried doctor earns in ${countries(n)}, how much that is in US dollars and what it is worth in purchasing power. OECD data and national statistical offices, with a source for every country.`,
  description: (n: number) =>
    `Doctors’ pay in ${countries(n)} on an interactive globe: the ratio to the average wage, the amount in US dollars and purchasing power. OECD and national data.`,
  crumbs: { home: 'Home', data: 'Data', here: 'Doctors worldwide' },
  meta: { withValue: 'Countries with a value', partial: 'Partial data', rates: 'NBP rates' },
  aria: { globe: 'Globe of doctors’ pay', method: 'Method and sources' },
  note: { strong: 'A very approximate comparison:', text: 'countries measure pay differently, and the data come from 2015–2026.', link: 'How to read these data' },
  statsLabel: 'Poland against the world',
  stats: {
    ratio: (year: number, rank: number, of: number) =>
      `the average wage: the pay of a specialist on an employment contract in Poland (${year}), each job counted separately; ${ordinal(rank)} of ${countries(of)}`,
    ratioSource: 'OECD Health Statistics 2025',
    contracts: 'of specialists in Poland work under civil-law (B2B) contracts, and OECD statistics do not cover their pay',
    contractsSource: 'AOTMiT working document, via Rzeczpospolita (in Polish)',
  },
};
