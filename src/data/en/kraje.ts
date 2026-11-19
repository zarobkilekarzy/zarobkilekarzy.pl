/**
 * Wersja angielska modułu src/data/kraje.ts (hub /en/countries/ i teksty o krajach): te same liczby, źródła i reguły
 * (importowane), tu tylko angielskie napisy — nazwy krajów, etykiety i zastrzeżenia miar, opisy `model` i `openness`,
 * noty krajów spoza Eurostatu i teksty porównawcze. Brak napisu dla nowego kraju albo miary to błąd typecheck
 * (rekordy po `CountryCode` / `MetricKey`); kraj, który w module polskim dostał opis, a tutaj go nie ma, wywraca build.
 */
import {
  COUNTRIES, METRICS, OECD_NOTE_PL, TOPIC_TEXTS, cellNote, country, metricValue,
  type CountryCode, type Metric, type MetricKey,
} from '@/data/kraje';
import { transparencyEn } from '@/data/en/swiat/jawnosc';
import { formatEN } from '@/lib/format';
import type { CompareTable } from '@/types';

export { OECD_NOTE_PL, metricValue, type CountryCode, type MetricKey } from '@/data/kraje';

/** Adres angielskiego hubu (okruszki tłumaczeń — src/lib/hubs.ts). */
export const COUNTRIES_HUB_EN = { label: 'Countries', href: '/en/countries/' };

const METRIC_TEXT: Record<MetricKey, { label: string; short: string; guardrail?: string; source?: string }> = {
  healthGdp: { label: 'Health spending as % of GDP', short: '% of GDP' },
  perCapitaPps: { label: 'Per inhabitant, adjusted for price differences (PPS)', short: 'Per inhabitant (PPS)', guardrail: 'PPS is an artificial unit with the same purchasing power everywhere, not the euro.' },
  perCapitaEur: { label: 'Per inhabitant, in euro', short: 'Per inhabitant (euro)' },
  publicShare: { label: 'Share of public money and compulsory contributions', short: 'Public' },
  oopShare: { label: 'Share of out-of-pocket spending by patients', short: 'Out of pocket', guardrail: 'Excludes premiums for voluntary insurance (a separate item, HF2).' },
  doctors: { label: 'Practising doctors per 100,000 inhabitants', short: 'Doctors per 100,000', guardrail: 'People, not full-time equivalents: doctors working with patients, not everyone licensed to practise.' },
  unmet: { label: 'Went without a medical examination because of cost, distance or waiting list', short: 'Unmet need', guardrail: 'Self-reported in the EU-SILC survey (aged 16+), not a measurement of waiting lists.' },
  unmetCost: { label: 'Went without a medical examination because of cost', short: '…because of cost' },
  unmetWait: { label: 'Went without a medical examination because of waiting list', short: '…because of waiting list' },
  lifeExp: { label: 'Life expectancy at birth, in years (Eurostat, 2024)', short: 'Life expectancy', guardrail: 'Depends on lifestyle and wealth, not only on healthcare.' },
  treatable: { label: 'Deaths from treatable causes per 100,000 inhabitants', short: 'Treatable mortality', guardrail: 'Deaths before the age of 75 that timely, good treatment could have prevented; age-standardised rate. The lower, the better.' },
  paySpecialistSalaried: { label: 'Salaried specialist relative to the average wage', short: 'Specialist, salaried', guardrail: 'Pay under an employment contract, without income from civil-law contracts or private practice.' },
  paySpecialistSelf: { label: 'Self-employed specialist relative to the average wage', short: 'Specialist, self-employed', guardrail: 'Income from practice, not a salary. The OECD has no data for Poland.' },
  payGpSelf: { label: 'Self-employed family doctor relative to the average wage', short: 'Family doctor, self-employed' },
  satOecd: { label: 'Satisfied with the availability of quality healthcare where they live (OECD / Gallup, 2024)', short: 'Satisfied with availability' },
  satStada: { label: 'Satisfied with the public healthcare system (STADA, 2026)', short: 'Satisfied with the system' },
  satIpsos: { label: 'Quality of care index from five questions (Ipsos, 2026)', short: 'Quality index' },
};

/** Miary z angielskimi napisami; liczby, skale i adresy źródeł z modułu polskiego. */
export const METRICS_EN = Object.fromEntries(
  (Object.keys(METRICS) as MetricKey[]).map((key) => {
    const { guardrail: _pl, ...metric } = METRICS[key];
    const text = METRIC_TEXT[key];
    return [key, { ...metric, label: text.label, short: text.short, ...(text.guardrail && { guardrail: text.guardrail }) }];
  }),
) as Record<MetricKey, Metric>;

interface CountryText {
  name: string;
  model?: string;
  openness?: string;
  /** nota kraju spoza Eurostatu (`alt.note`) */
  note?: string;
  /** nazwy źródeł `alt.sources` po angielsku, w tej samej kolejności */
  sources?: string[];
}

const OECD_SHA_EN = 'OECD, System of Health Accounts (2024)';

const COUNTRY_TEXT: Record<CountryCode, CountryText> = {
  PL: {
    name: 'Poland',
    model: 'A single public payer (the NFZ) and an income-based contribution; services are contracted with facilities.',
  },
  BE: {
    name: 'Belgium',
    model: 'Compulsory insurance through seven sickness funds; doctors are paid for each service according to a public fee schedule.',
    openness: 'The tariff status of every doctor and average payments by specialty are public. We found no publication of the total for an individual doctor.',
  },
  FR: {
    name: 'France',
    model: 'A single public fund with a budget voted by parliament; complementary insurance covers the rest of the cost.',
    openness: 'The tariff sector of every doctor and doctors’ incomes by specialty are public. We found no publication of the total for an individual doctor.',
  },
  CZ: {
    name: 'Czechia',
    model: 'Seven funds and a 13.5% contribution; the state pays for more than half of the insured, and rates are negotiated every year.',
    openness: 'Contracts between funds and facilities must be published or they do not take effect. An office will give the pay of an individual doctor only where an overriding public interest is shown.',
  },
  DE: {
    name: 'Germany',
    model: '93 statutory funds and separate private insurance; the funds’ money is divided among doctors by their own self-governing body.',
    openness: 'Pay scales, fee schedules and the remuneration of fund boards are public. The earnings of an individual doctor are not published.',
  },
  AT: {
    name: 'Austria',
    model: 'An assigned fund, contracted doctors and a growing group of doctors without a contract, whom the patient pays directly.',
    openness: 'Doctors’ incomes were calculated from tax data without names, and hospital pay scales are public. The state does not know the prices charged in non-contracted practices.',
  },
  SE: {
    name: 'Sweden',
    model: 'No funds: 21 regions pay for treatment from their own tax, and doctors are salaried.',
    openness: 'The pay of every regional employee is a public document on request, and waiting times are published every month. Pay in private companies paid by the region is not visible.',
  },
  DK: {
    name: 'Denmark',
    model: 'Treatment paid from taxes and free for the patient; regions run the hospitals, family doctors have their own practices.',
    openness: 'An agency publishes doctors’ ties to industry by name with the annual amount, and the pay of a public employee can be obtained on request. Payments to individual practices are not visible.',
  },
  NL: {
    name: 'Netherlands',
    model: 'A compulsory policy with private insurers, who must accept everyone; the state defines the benefits package.',
    openness: 'The remuneration of hospital boards is published by name by law, and hospitals report waiting times every two weeks. The cap and the publication do not cover self-employed specialists.',
  },
  HU: {
    name: 'Hungary',
    model: 'A single public payer and state hospitals; hospital doctors’ pay is set by a table in an act.',
    openness: 'A patient can check their place on the waiting list for surgery, and the doctors’ pay table is in an act. The earnings of individual doctors and permissions for additional work are not visible.',
  },
  IT: {
    name: 'Italy',
    model: 'A national health service financed from taxes and run by the regions.',
    openness: 'Every year the government reports to parliament on doctors’ private practice in public hospitals, and the remuneration of heads of department is published — without the amounts from private practice. A doctor’s total income is not visible.',
  },
  ES: {
    name: 'Spain',
    model: 'A national health system financed from taxes and run by 17 autonomous communities.',
    openness: 'Permissions to combine public and private work are public by law, and waiting lists are published every six months for each region. Doctors’ earnings remain protected.',
  },
  GB: {
    name: 'United Kingdom',
    model: 'Treatment paid from taxes and free for the patient; hospital doctors are on national pay scales.',
    openness: 'Waiting lists in every hospital are published every month, and every practice gives the average earnings of its doctors. The earnings of an individual hospital doctor are not visible.',
    sources: [OECD_SHA_EN, 'OECD, country note: United Kingdom'],
    note: 'United Kingdom: spending according to the OECD health accounts for 2024; doctors, unmet need, life expectancy and deaths from treatable causes from the OECD country note.',
  },
  CA: {
    name: 'Canada',
    model: 'Thirteen public plans of the provinces and territories; a visit to a doctor and hospital care are free of charge, and doctors are paid per service.',
    openness: 'British Columbia publishes payments from its plan by name, and the whole country measures waiting times for surgery to one definition. Nobody adds up the totals from different public sources.',
    sources: [OECD_SHA_EN, 'OECD, country note: Canada'],
    note: 'Canada: spending according to the OECD health accounts for 2024; the other measures from the OECD country note.',
  },
  US: {
    name: 'USA',
    model: 'Many payers: insurers chosen by employers and the public programmes Medicare and Medicaid; 7.9% of residents have no insurance.',
    openness: 'Medicare payments to every doctor and industry payments are published by name. Payments by private insurers and total income are not visible.',
    sources: [OECD_SHA_EN, 'OECD, country note: United States'],
    note: 'USA: spending according to the OECD health accounts for 2024. The share of public sources is an estimate: the sum of government schemes (27.4%) and compulsory public insurance (23.1%). The OECD gives 83.1% for the USA because it adds compulsory private insurance (32.6%), that is, employer-sponsored policies — a category that hardly exists in Europe. There is no comparable measurement of unmet need for the USA.',
  },
  TW: {
    name: 'Taiwan',
    model: 'A single public payer, a global budget and point-based pricing of services.',
    openness: 'The patient receives a bill for every visit, and hospital reports are public. Taiwan does not publish the earnings of individual doctors.',
    sources: [
      'Ministry of Health and Welfare of Taiwan, National Health Expenditure 2024',
      'Ministry of Health and Welfare of Taiwan, medical personnel statistics',
      'Ministry of the Interior of Taiwan, life tables',
    ],
    note: 'Taiwan: data from Taiwanese government bodies — current expenditure for 2024 (excluding investment), licensed doctors of Western medicine in 2024, life expectancy in 2025. Out-of-pocket spending is counted more broadly than in Europe (including over-the-counter medicines and supplements), so the 39.9% share is overstated relative to the other countries. Taiwan does not publish deaths from treatable causes.',
  },
  EU: { name: 'EU-27' },
};

// kraj, który w module polskim ma opis albo notę, musi mieć je także tutaj — inaczej strona EN pokazałaby pustą komórkę
for (const c of COUNTRIES) {
  const text = COUNTRY_TEXT[c.code];
  const missing = [c.model && !text.model && 'model', c.openness && !text.openness && 'openness', c.alt && !text.note && 'alt.note', c.alt && text.sources?.length !== c.alt.sources.length && 'alt.sources'].filter(Boolean);
  if (missing.length) throw new Error(`[kraje EN] ${c.code}: brak tłumaczenia (${missing.join(', ')}) — src/data/en/kraje.ts`);
}

export const countryEn = (code: CountryCode) => COUNTRY_TEXT[code];
export const countryNameEn = (code: CountryCode) => (code === 'EU' ? 'EU-27, average' : COUNTRY_TEXT[code].name);

/** Źródła kraju spoza Eurostatu z angielskimi nazwami. */
export const altSourcesEn = (code: CountryCode) => (country(code).alt?.sources ?? []).map((s, i) => ({ href: s.href, label: COUNTRY_TEXT[code].sources![i]! }));

/** Co jest jawne: własny opis kraju albo opis z globu płac. */
export const opennessOfEn = (code: CountryCode): string | undefined => {
  const iso = country(code).iso;
  return COUNTRY_TEXT[code].openness ?? (iso ? transparencyEn[iso]?.text : undefined);
};

/**
 * Teksty, które nie są opisem całego systemu — osobna lista na stronie hubu. Klucz = adres polskiego oryginału
 * (TOPIC_TEXTS); tytuł i lead bierze strona z tłumaczenia artykułu, tu tylko etykieta kolumny.
 */
const TOPIC_NAME: Record<string, string> = { Porównanie: 'Comparison', Kanada: 'Canada' };
export const TOPIC_TEXTS_EN = TOPIC_TEXTS.map((t) => {
  const name = TOPIC_NAME[t.name];
  if (!name) throw new Error(`[kraje EN] brak tłumaczenia etykiety „${t.name}” — src/data/en/kraje.ts`);
  return { href: t.href, flag: t.flag, name };
});

/** Tekst komórki: „11.07%”, „5.32× (2024)”, „11.08%*” (gwiazdka = inne źródło niż Eurostat), „approx. 50.5%*”, „no data”. */
export function formatMetricEn(code: CountryCode, key: MetricKey, withYear = true): string {
  const m = METRICS[key];
  const v = metricValue(code, key);
  if (!v) return 'no data';
  const text = `${v.estimate ? 'approx. ' : ''}${formatEN(v.value, v.decimals ?? m.decimals)}${m.unit}${v.alt ? '*' : ''}`;
  return withYear && v.year ? `${text} (${v.year})` : text;
}

/** Uwagi do pojedynczych liczb — angielskie odpowiedniki `CELL_NOTES` z modułu polskiego (te same klucze). */
const CELL_NOTES_EN: Partial<Record<`${CountryCode}:${MetricKey}`, string>> = {
  'BE:doctors': 'Doctors working with patients. Belgium has 660 licensed doctors per 100,000 inhabitants, almost twice as many.',
  'AT:doctors': 'Austria includes doctors in training in this figure.',
  'PL:paySpecialistSalaried': 'Salaried specialists only — without the civil-law contracts on which most Polish specialists work.',
  'US:publicShare': 'Estimate: the sum of government schemes (27.4%) and compulsory public insurance (23.1%) according to the OECD health accounts for 2024. The OECD gives 83.1% for the USA because it adds compulsory private insurance (32.6%), that is, employer-sponsored policies.',
  'TW:healthGdp': 'Data from Taiwan’s Ministry of Health and Welfare for 2024: current expenditure, excluding investment. Taiwan is covered by neither Eurostat nor the OECD.',
  'TW:publicShare': 'Data from Taiwan’s Ministry of Health and Welfare for 2024: the state budget and compulsory health insurance.',
  'TW:oopShare': 'Data from Taiwan’s Ministry of Health and Welfare for 2024. Counted more broadly than in Europe — including over-the-counter medicines and supplements — so the share is overstated relative to the other countries.',
  'TW:doctors': 'Data from Taiwan’s Ministry of Health and Welfare for 2024: licensed doctors of Western medicine.',
  'TW:lifeExp': 'Data from Taiwan’s Ministry of the Interior for 2025 — one year more recent than for the other countries.',
};
const SHA_KEYS: MetricKey[] = ['healthGdp', 'publicShare', 'oopShare'];
/** dokładność not OECD — jak ALT_DECIMALS w module polskim */
const NOTE_DECIMALS: Partial<Record<MetricKey, number>> = { healthGdp: 2, publicShare: 1, oopShare: 1, doctors: 0, unmet: 1, lifeExp: 1, treatable: 0 };

/** Objaśnienie pojedynczej liczby w tabeli hubu — jak `cellNote` w module polskim: jest tam, gdzie polska strona ma swoje. */
export function cellNoteEn(code: CountryCode, key: MetricKey): string | undefined {
  if (!cellNote(code, key)) return undefined;
  const own = CELL_NOTES_EN[`${code}:${key}`];
  if (own) return own;
  if (!metricValue(code, key)?.alt) throw new Error(`[kraje EN] brak tłumaczenia uwagi do liczby ${code}:${key} — src/data/en/kraje.ts`);
  if (SHA_KEYS.includes(key)) return 'According to the OECD health accounts for 2024 — compiled with the same method as Eurostat’s, which does not cover this country.';
  const pl = OECD_NOTE_PL[key as keyof typeof OECD_NOTE_PL];
  const m = METRICS[key];
  return `According to the OECD country note (Health at a Glance 2025), which counts this measure slightly differently from Eurostat${typeof pl === 'number' ? `: there Poland has ${formatEN(pl, NOTE_DECIMALS[key] ?? m.decimals)}${m.unit}, against ${formatMetricEn('PL', key)} in Eurostat` : ''}.`;
}

/** Tabela „kraje w wierszach, miary w kolumnach” — na stronę hubu. */
export function countryTableEn(caption: string, codes: CountryCode[], keys: MetricKey[], marked: CountryCode[] = ['PL']): CompareTable {
  return {
    caption,
    columns: ['', ...keys.map((key) => METRICS_EN[key].short)],
    // dymek przy nagłówku: pełna nazwa miary, rok, zastrzeżenie i źródło; przy kraju spoza Eurostatu — skąd liczby
    hints: [undefined, ...keys.map((key) => { const m = METRICS_EN[key]; return `${m.label}${m.year && !m.label.includes(String(m.year)) ? ` (${m.year})` : ''}. ${m.guardrail ? `${m.guardrail} ` : ''}Source: ${m.source.label}.`; })],
    rows: codes.map((c) => ({ cells: [COUNTRY_TEXT[c].name, ...keys.map((key) => formatMetricEn(c, key))], marked: marked.includes(c), cellHints: [undefined, ...keys.map((key) => cellNoteEn(c, key))] })),
  };
}

/** Wiersz wykresu rozrzutu (`blocks/SpreadRows`) — jak `spreadRow` w module polskim, z angielskimi nazwami. */
export function spreadRowEn(key: MetricKey, max: number, subject: CountryCode = 'PL') {
  const m = METRICS_EN[key];
  const others = COUNTRIES.filter((c) => c.code !== subject && c.code !== 'EU')
    .map((c) => {
      const v = metricValue(c.code, key);
      // wartość z innego źródła niż Eurostat pokazujemy tak jak w tabeli: z gwiazdką, szacunek z „approx.”
      return { label: COUNTRY_TEXT[c.code].name, value: v?.value, display: v?.alt ? formatMetricEn(c.code, key, false) : undefined };
    })
    .filter((d): d is { label: string; value: number; display: string | undefined } => d.value !== undefined);
  return {
    label: m.label,
    note: m.year ? String(m.year) : undefined,
    value: metricValue(subject, key)!.value,
    average: metricValue('EU', key)?.value,
    dots: others,
    max: Math.max(max, metricValue(subject, key)!.value, ...others.map((d) => d.value)),
    unit: m.unit,
    decimals: m.decimals,
  };
}
