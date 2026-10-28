/**
 * Obrazki OG stron angielskich (lib/og/registry.ts → collectEn). Ten sam szablon co po polsku, tylko napisy:
 * - `ogPagesEn` — strony spoza kolekcji, trasa EN → treść (jak `ogPages` w src/data/og.ts);
 * - `ogArticleMediaEn` — wykresy z podpisami po angielsku, klucz = adres POLSKIEGO oryginału (artykułu albo wpisu
 *   aktualności). Media bez napisów (ilustracje, wirus COVID-19) przechodzą z polskiej strony same.
 * Liczby z modułów danych, tekst tutaj. Na OG bez euro i bez niczego, co się zmienia (README → „Obrazki OG”).
 */
import { createHmac } from 'node:crypto';
import type { OgPage, OgStamp } from '@/types';
import { formatDateIn, formatEN } from '@/lib/format';
import { helpline } from '@/data/prawa-pacjenta';
import { MEDIANS } from '@/data/rozklad-wynagrodzen';
import { pseudonymDemo } from '@/data/en/postulat';
import sorOgSnapshot from '@/data/sor/migawka-og.json';
import { frozenLayer } from '@/lib/sor/map';
import { columnChart, svg } from '@/lib/og/charts';
import { KANADA, TAJWAN } from '@/lib/siatka/kraje';
import { globeOgBody } from '@/lib/swiat/og';
import { newsIllustration } from '@/lib/news';
import { dataUpdated, hemicyclePanel } from '@/data/og';
import { BUDGET } from '@/data/budzet-nfz';
import { AOS_FIRST, AOS_LAST, WHC_2022, WHC_2024, pct as change } from '@/data/wizyty-prywatne-kolejka-cena';
import { WINDOW, ratePer100k, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { COUNTRY_EN } from '@/data/en/odpowiedzialnosc-zawodowa-lekarzy';
import { ageRows, dayRows } from '@/data/en/ciecie-limitow-na-medycyne';
import { funnelRows } from '@/data/en/odsiew-na-medycynie';

const MEDIA_W = 470; // kolumna mediów w lib/og/render.ts
const PANEL_H = 440;
const TWO_PANELS_H = 196;

// Postulat: identyfikator z przykładu na /en/demand/ (klucz pokazowy po angielsku, więc inny niż na polskim obrazku)
const demoId = `${createHmac('sha256', pseudonymDemo.key).update(pseudonymDemo.pwz).digest('hex').slice(0, 8)}…`;

/* ---------- Wykresy (jak w src/data/og.ts, z podpisami po angielsku) ---------- */

const HEMICYCLE = hemicyclePanel({ legend: ['for', 'against', 'abst.', 'no vote'], result: 'for : against' });
const VOTE_PANEL: OgPage['panels'] = [{ head: 'Sejm, 22 October 2026 — final vote', height: 300, svg: HEMICYCLE }];

const COURT_STAMPS: OgStamp[] = [
  { kicker: 'The court ruled', label: 'Acquittal', level: 0, tone: 'muted' },
  { kicker: 'The court ruled', label: 'Fine', level: 3 },
  { kicker: 'The court ruled', label: 'Suspension of the licence to practise', level: 6 },
];

const LIMITY_BARS: OgPage['bars'] = {
  head: 'Monthly cap in multiples of the minimum wage',
  unit: '×',
  rows: [
    { label: 'Half-time post with one provider', value: 4 },
    { label: 'Full-time post with one provider', value: 8 },
    { label: 'Post with allowances', sub: 'e.g. for a management role', value: 12 },
    { label: 'In total across all providers', sub: 'no more than two full-time posts', value: 16, marked: true },
  ],
};

// Cięcie limitów: rok naboru skrócony do podpisu pod kolumną („2015/16” → „2015”, „1994–2000” → „94–00”)
const shortYear = (label: string) => (label.includes('–') ? label.replace(/\d\d(\d\d)–\d\d(\d\d)/, '$1–$2') : label.slice(0, 4));
const intakeCols = dayRows.map((r, i) => ({
  label: shortYear(r.label),
  value: r.value,
  display: i === 0 ? `>${formatEN(r.value)}` : r.highlight || i === dayRows.length - 1 ? r.display : undefined,
  highlight: r.highlight,
}));
const ageCols = [...ageRows].reverse().map((r) => ({ label: r.label.replace('aged ', ''), value: r.value, display: r.highlight ? r.display : undefined, highlight: r.highlight }));

const finals = BUDGET.filter((r) => r.status === 'final');
const costCols = finals.map((r, i) => ({
  label: r.year % 5 === 0 ? String(r.year) : '',
  value: r.costs,
  display: i === 0 || i === finals.length - 1 ? formatEN(r.costs, 1) : undefined,
  highlight: i === finals.length - 1,
}));

const country = (key: CountryKey) => ({
  label: COUNTRY_EN[key].name,
  sub: COUNTRY_EN[key].body,
  value: ratePer100k(key),
  display: formatEN(ratePer100k(key), 1),
  marked: key === 'pl',
});

const aosCost = change(AOS_FIRST.cost, AOS_LAST.cost);
const aosServices = change(AOS_FIRST.services, AOS_LAST.services);
const queueGrowth = change(WHC_2022.single, WHC_2024.single);

export const ogArticleMediaEn: Record<string, Pick<OgPage, 'bars' | 'panels' | 'dots' | 'stamps' | 'illustration' | 'position'>> = {
  // aktualności
  '/aktualnosci/gra-i-katalog-orzeczen/': { stamps: COURT_STAMPS },
  '/aktualnosci/limity-plac-medykow-w-sejmie/': { bars: LIMITY_BARS },
  '/aktualnosci/sejm-uchwalil-limity-plac-medykow/': { panels: VOTE_PANEL },
  // artykuły
  '/analizy/kanada-lekarze-ustawa-specjalna/': {
    dots: {
      mask: KANADA,
      codes: { q: { size: 'on', color: 'blue' }, a: { size: 'on', color: 'seq-0' }, j: { size: 'on', color: 'ok' }, o: { size: 'mid', color: 'chart' } },
      legend: [
        { code: 'q', label: 'Quebec — Bill 2 of 2025' },
        { code: 'a', label: 'Ontario and Alberta — terms imposed earlier' },
        { code: 'j', label: 'British Columbia and New Brunswick — public payments' },
      ],
    },
  },
  '/analizy/tajwan-ochrona-zdrowia/': {
    dots: { mask: TAJWAN, codes: { '#': { size: 'on', color: 'blue' } }, legend: [{ code: '#', label: 'A single payer for the whole country' }] },
  },
  '/analizy/ciecie-limitow-na-medycyne/': {
    panels: [
      { head: 'First-year places in medicine', height: TWO_PANELS_H, svg: svg(MEDIA_W, TWO_PANELS_H, columnChart(intakeCols, MEDIA_W, TWO_PANELS_H)) },
      { head: 'Doctors today by age', height: TWO_PANELS_H, svg: svg(MEDIA_W, TWO_PANELS_H, columnChart(ageCols, MEDIA_W, TWO_PANELS_H)) },
    ],
  },
  '/dane/budzet-nfz/': {
    panels: [{ head: 'Costs in the NFZ plan, PLN bn', height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, columnChart(costCols, MEDIA_W, PANEL_H)) }],
  },
  '/analizy/wizyty-prywatne-kolejka-cena/': {
    bars: {
      head: `NFZ specialist clinics, ${AOS_FIRST.year}–${AOS_LAST.year}`,
      unit: '%',
      rows: [
        { label: 'NFZ money', sub: `from PLN ${formatEN(AOS_FIRST.cost / 1e6, 1)} to ${formatEN(AOS_LAST.cost / 1e6, 1)} bn`, value: aosCost, display: `+${formatEN(aosCost, 1)}`, marked: true },
        { label: 'Services', sub: `from ${formatEN(AOS_FIRST.services / 1e6, 1)} to ${formatEN(AOS_LAST.services / 1e6, 1)} million`, value: aosServices, display: `+${formatEN(aosServices, 1)}` },
        { label: 'Waiting time', sub: `from ${formatEN(WHC_2022.single, 1)} to ${formatEN(WHC_2024.single, 1)} months`, value: queueGrowth, display: `+${formatEN(queueGrowth)}` },
      ],
    },
  },
  '/analizy/odsiew-na-medycynie/': {
    bars: {
      head: 'Of 100 people who start medical school',
      rows: funnelRows.map((r) => ({ label: r.label, value: r.value, display: r.display, marked: r.highlight })),
    },
  },
  '/analizy/limity-wynagrodzen-medykow/': { panels: VOTE_PANEL },
  '/analizy/odpowiedzialnosc-zawodowa-lekarzy/': {
    bars: {
      head: `Licence revocations per 100,000 doctors a year, ${WINDOW.from}–${WINDOW.to}`,
      rows: (['no', 'se', 'uk', 'pl'] as const).map(country),
    },
  },
};

/* ---------- Strony spoza kolekcji ---------- */

export const ogPagesEn: Record<string, OgPage> = {
  // obrazek domyślny stron /en/ bez własnego wpisu (lib/og/registry.ts → ogImageFor)
  '/en/': {
    eyebrow: 'A guide to doctors’ work and pay',
    title: 'Doctors’ pay.\nCalmly,\nwith sources',
    cover: { lines: ['Doctors’ pay in Poland', 'calmly, with sources'], label: 'zarobkilekarzy.pl · in English', theme: 'ciemny' },
    footer: { text: 'Every figure with a source', flags: true },
  },
  '/en/data/doctors-pay-worldwide/': {
    eyebrow: 'Data · international comparison',
    title: 'What doctors earn\naround the world',
    lead: 'A doctor’s pay relative to the average wage, the amount and purchasing power.',
    panels: [{ height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, globeOgBody(MEDIA_W, PANEL_H)) }],
    footer: { text: 'OECD and national statistical offices' },
  },
  '/en/data/': {
    eyebrow: 'Data',
    title: 'Doctors’ pay\nand public money',
    lead: 'Pay, the NFZ budget, hospital debt and waiting lists — every figure with a source.',
    media: 'stat',
    stat: {
      // roczna = 12 × mediana miesięczna z lutego 2026 r., dlatego szacunek (jak na polskim obrazku)
      value: formatEN(MEDIANS.specKontrakt * 12),
      unit: 'PLN',
      label: 'Annual median of a specialist’s contract',
      desc: 'gross, from one contract with one hospital: 12 × the monthly median from February 2026',
      accuracy: 'est',
      source: 'AOTMiT · Rzeczpospolita, 27 May 2026',
    },
    footer: { text: `Data section${dataUpdated ? ` · as of ${formatDateIn(dataUpdated, 'en')}` : ''}`, flags: true },
  },
  '/en/mechanisms/': {
    eyebrow: 'Mechanisms',
    title: 'How the system works,\nnot who works in it',
    lead: 'NFZ payments, contracts, on-call duty and access to the profession — we describe mechanisms, not names.',
    footer: { text: 'Every claim with a source' },
  },
  '/en/analysis/': {
    eyebrow: 'Analysis',
    title: 'In-depth topics\nwith sources',
    lead: 'Transparency and the register, public money, medical education and international comparisons.',
    footer: { text: 'Every claim with a source' },
  },
  '/en/demand/': {
    eyebrow: 'Our demand',
    title: 'Public amounts,\nprotected names',
    redact: demoId,
    footer: { text: 'Each person’s total · every quarter · permanent identifier' },
  },
  '/en/about/': {
    eyebrow: 'About the site',
    title: 'About the project\nzarobkilekarzy.pl',
    lead: 'Why the site exists, how we choose sources and how to report an error.',
    footer: { text: 'Mechanisms, not names' },
  },
  '/en/news/': {
    eyebrow: 'About the site',
    title: 'News',
    lead: 'What changes on the site and in the project — each entry dated.',
    photo: newsIllustration.src,
    position: '70% 50%',
    footer: { text: 'What’s new in the project' },
  },
  '/en/faq/': {
    eyebrow: 'Questions and objections',
    title: 'Common objections\nto pay transparency',
    lead: 'Populism, emigration, GDPR, OECD comparisons — how we answer the counter-arguments we hear most often.',
    footer: { text: 'We criticise the mechanism, not the profession' },
  },
  '/en/glossary/': {
    eyebrow: 'Glossary',
    title: 'Contract, capitation,\nlump sum — in plain words',
    lead: 'Key healthcare terms in a few sentences. Each entry gives its legal basis or source.',
    footer: { text: 'Definitions without judgement, with sources' },
  },
  '/en/patient-rights/': {
    eyebrow: 'For patients',
    title: 'Patient rights in Poland.\nWhat you are entitled to\nand where to report it',
    media: 'stat',
    stat: {
      value: 'PLN 0',
      label: 'First copy of medical records',
      desc: `Reception rarely mentions it. Free patient helpline: ${helpline.phone.display}.`,
      source: 'Article 28 of the Act on patient rights',
    },
    footer: { text: 'In plain language, with sources' },
  },
  '/en/patient-rights/print/': {
    eyebrow: 'Patient rights · print',
    title: 'Pocket card\nand large print',
    lead: 'Two cards on an A4 sheet: cut and fold. Or two pages in large print — for an older person and for a notice board.',
    footer: { text: 'PDF, black and white, free to hand out' },
  },
  '/en/patient-rights/emergency-department/': {
    eyebrow: 'For patients · live',
    title: 'Emergency department\nqueues. How long\nthe wait is',
    lead: 'All hospital emergency departments on one map, refreshed every 10 minutes — with the time standards from the regulation.',
    footer: { text: 'TOPSOR system data, with sources' },
    // ta sama zamrożona migawka co na polskim obrazku — na OG nic się nie zmienia
    map: { layer: frozenLayer(sorOgSnapshot), theme: 'ciemny', legend: [[1, 'within the standard'], [2, 'above the standard'], [3, 'over 2× the standard']] },
  },
  '/en/search/': {
    eyebrow: 'Search',
    title: 'Search the site',
    lead: 'Articles, data pages and glossary terms in English.',
  },
};
