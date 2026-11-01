/**
 * Wersja angielska modułu src/data/ile-placimy.ts (strona /en/how-much-we-pay/): liczby i rachunki z modułów polskich,
 * opisy przystanków z src/data/en/sladem-zlotowki.ts, tu teksty. Kwoty w tekście z przybliżeniem w euro po kursie NBP z buildu.
 */
import { GUS_2025 } from '@/data/apteka-pieniadz-publiczny';
import { BUDGET, LAST_FINAL } from '@/data/budzet-nfz';
import { STOPS } from '@/data/en/sladem-zlotowki';
import type { PathLinkEn } from '@/data/en/sciezki';
import { AOS_AVERAGE, PER_PERSON, WAGE_RANGE, YEARLY_RATE, planSplit as planSplitPl, sources as sourcesPl, stops as stopsPl, viewers as viewersPl, wagePresets as wagePresetsPl, type PathStop, type Viewer } from '@/data/ile-placimy';
import { OUT_OF_POCKET } from '@/data/kolejki';
import { RATE } from '@/data/poz';
import { MEDIANS, SHARES } from '@/data/rozklad-wynagrodzen';
import { PLAN_2026 } from '@/data/sladem-zlotowki';
import { AOS_LAST } from '@/data/wizyty-prywatne-kolejka-cena';
import { OTHER_HOSPITALS } from '@/data/zadluzenie';
import { DATA as LISTS_DATA, LISTS, MEDIAN as LISTS_MEDIAN, OVER_500K, POSITIONS } from '@/data/zarobki-ujawnione-listy';
import { withEur, type MoneyOptions } from '@/i18n/money';
import { getRates, toEur } from '@/i18n/rates';
import { formatEN } from '@/lib/format';

export { AOS_AVERAGE, PER_PERSON, WAGE_RANGE, YEARLY_RATE };

const rates = await getRates();
const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);
const plnBn = (billions: number, decimals = 1) => pln(billions * 1e9, { scale: 'billion', decimals });

/** ile euro za jedną złotówkę: kalkulator przelicza na żywo w przeglądarce */
export const EUR_PER_PLN = toEur(1, 'PLN', rates);

export const pathPage = {
  title: 'How much we pay, and for what',
  docTitle: 'How much we pay Polish doctors, and for what',
  eyebrow: 'Path · from contribution to pay',
  description: 'From the health contribution to a doctor’s pay in four stops. Totals are visible at each of them, but the total for one person is public at none.',
  lead: 'From your contribution to a doctor’s pay, in four stops. Totals are visible at each of them, but the total for one person is public at none.',
};

/* ---------- Rachunek na płacy czytelnika ---------- */

export const wagePresets = [
  { ...wagePresetsPl[0], label: 'Median', phrase: 'at the median wage' },
  { ...wagePresetsPl[1], label: 'Minimum wage', phrase: 'at the minimum wage' },
];

const startYearly = wagePresets[0].wage * YEARLY_RATE;
export const startFigures = {
  year: formatEN(Math.round(startYearly)),
  month: formatEN(Math.round(startYearly / 12)),
  ratio: formatEN(Math.round((startYearly / PER_PERSON) * 100)),
  visits: `about ${formatEN(Math.round(startYearly / AOS_AVERAGE))}`,
  person: formatEN(Math.round(PER_PERSON / 10) * 10),
  aos: formatEN(Math.round(AOS_AVERAGE)),
  aosYear: AOS_LAST.year,
  aosCost: formatEN(AOS_LAST.cost / 1e6, 1),
  aosServices: formatEN(AOS_LAST.services / 1e6, 1),
  phrase: wagePresets[0].phrase,
};

export const sources = {
  median: { ...sourcesPl.median, label: 'Statistics Poland (GUS), median wage, October 2025' },
  nik: { ...sourcesPl.nik, label: 'Supreme Audit Office (NIK), audit of the NFZ 2021–2024' },
  plan: { ...sourcesPl.plan, label: 'NFZ plan, as of 5 October 2026' },
  people: { ...sourcesPl.people, label: 'Statistics Poland (GUS), population 2024' },
  aos: { ...sourcesPl.aos, label: `NFZ report for ${AOS_LAST.year}` },
  pay: { ...sourcesPl.pay, label: 'AOTMiT, February 2026, via Rzeczpospolita' },
  draft: { ...sourcesPl.draft, label: 'Sejm Health Committee, 9 July 2025' },
  mz: { ...sourcesPl.mz, label: 'Ministry of Health, 18 September 2026' },
  whc: { ...sourcesPl.whc, label: 'WHC Barometer' },
  lump: { ...sourcesPl.lump, label: 'Minister of Health regulation of 22 September 2017, § 3(1), consolidated text Dz.U. 2025 item 878' },
};

/* ---------- Przystanki ---------- */

const oop = OUT_OF_POCKET.at(-1)!;
const oopGrowth = Math.round((oop.value / OUT_OF_POCKET.at(-2)!.value - 1) * 100);

const TEXT: Record<string, Pick<PathStop, 'question' | 'route' | 'lead' | 'body' | 'figure'> & { sourceLabels: string[] }> = {
  skladka: {
    question: 'Where does this money come from',
    route: STOPS[0],
    lead: STOPS[0].what,
    body: [
      'An employee pays <strong>9% of the contribution base</strong> towards health. Until the end of 2021 most of this amount could be deducted from tax; since 1 January 2022 there has been no deduction.',
      'A farmer in KRUS, the farmers’ social insurance fund, pays <strong>PLN 1 per conversion hectare</strong>, and for farms smaller than 6 ha the contribution is paid by the state budget. These are two different measures, so the comparison alone does not say who pays more.',
      `Some health spending does not pass through the National Health Fund (NFZ) at all. In ${oop.year}, households spent <strong>${plnBn(oop.value)}</strong> on healthcare out of their own pockets, ${oopGrowth}% more than a year earlier. For prescription medicines in pharmacies, patients paid PLN ${formatEN(GUS_2025.patients, 1)} billion in 2025 and the NFZ PLN ${formatEN(GUS_2025.refund, 1)} billion.`,
    ],
    sourceLabels: ['Commissioner for Human Rights (RPO), health contribution', 'KRUS', `Statistics Poland (GUS), National Health Account for ${oop.year}`, 'Statistics Poland (GUS), prescription medicine sales, 2025'],
    figure: { value: startFigures.year, my: 'year', suffix: ' PLN', unit: 'your contribution per year' },
  },
  plan: {
    question: 'What happens to it in the NFZ',
    route: { ...STOPS[1], hidden: 'How much of these costs is pay. The plan also changes during the year, so an “NFZ budget” without the date of the version says nothing.' },
    lead: STOPS[1].what,
    body: [
      `The plan must be balanced: costs may not exceed revenue. From ${BUDGET[0].year} to ${LAST_FINAL.year}, costs in the plan rose from <strong>PLN ${formatEN(BUDGET[0].costs, 1)} billion to ${plnBn(LAST_FINAL.costs)}</strong>: more than threefold in nominal terms and roughly twofold after inflation.`,
      'The plan does not show how much pay costs. The cost of the act on minimum pay is known from estimates: <strong>PLN 71–72 billion</strong> in 2026, about a third of costs.',
      `Nor does the plan say whether facilities have enough money. At the end of 2025, ${OTHER_HOSPITALS.hospitals} public hospitals owed <strong>${plnBn(OTHER_HOSPITALS.hospitalsTotal / 1000, 0)}</strong>, and the debt goes mainly on current expenses. Our estimate for today, which also covers SPZOZ facilities that are not hospitals, is over PLN 40 billion.`,
    ],
    sourceLabels: ['NFZ, financial plans', 'Statistics Poland (GUS), price indices', 'TVN24', 'Forsal.pl', 'Ministry of Health via Rynek Zdrowia', 'hospital debt counter'],
    figure: { value: startFigures.ratio, my: 'ratio', suffix: '%', unit: 'of average NFZ costs per resident' },
  },
  rozliczenie: {
    question: 'What does the NFZ pay a hospital for',
    route: STOPS[2],
    lead: `${STOPS[2].what} In 2015–2020 the independent tariff covered about 17% of the value of services; the remaining prices were set by the payer.`,
    body: [
      'A network hospital is not paid for each procedure separately but receives a <strong>lump sum</strong>: an amount set in advance for the settlement period, whose size depends on the points reported earlier. So the transfer does not show how much a single procedure cost.',
      `In primary care, the NFZ pays an annual rate for every patient on a doctor’s list, including those who do not come. Since July 2026 the base rate has been <strong>${pln(RATE.rate)}</strong>.`,
      'Payment does not always come straight away. According to the Supreme Audit Office (NIK), on 17 September 2024 the NFZ still owed <strong>PLN 1.65 billion</strong> for unlimited services from the first half of that year, and on 11 October about PLN 317 million.',
    ],
    sourceLabels: ['NIK, pricing of services 2015–2020', 'Ministry of Health regulation on the lump sum, consolidated text Dz.U. 2025 item 878', 'NFZ President’s order no. 65/2026', 'NIK, audit of the NFZ 2021–2024'],
    figure: { value: startFigures.visits, my: 'visits', unit: 'specialist clinic services for your annual contribution' },
  },
  wyplata: {
    question: 'How much of it does a doctor get',
    route: STOPS[3],
    lead: STOPS[3].what,
    body: [
      `According to data from the Agency for Health Technology Assessment and Tariff System (AOTMiT), <strong>${formatEN(SHARES.civil, 2)}% of specialists</strong> work under civil-law contracts, and the median payment under one specialist’s contract is <strong>${pln(MEDIANS.specKontrakt)}</strong> gross per month. Both figures concern contracts with a single hospital.`,
      'For salaried doctors, the statutory minimum pay is public. Nobody publishes contract amounts, and a doctor working in several facilities appears in the data as several unconnected entries.',
      `Some amounts were disclosed by the facilities themselves. Full payrolls for ${LISTS_DATA.year} were sent in the Watchdog Polska monitoring by ${LISTS} of the ${formatEN(LISTS_DATA.requests)} facilities asked: ${formatEN(POSITIONS)} payroll entries, a median of about <strong>${pln(LISTS_MEDIAN.rounded)}</strong> a year, and ${formatEN(Math.round((OVER_500K / POSITIONS) * 100))}% of the amounts exceed PLN 500,000. Each amount is a payment by one facility, so for a particular doctor it is a lower bound.`,
    ],
    sourceLabels: ['AOTMiT, February 2026, via Rzeczpospolita', 'Watchdog Polska, pay monitoring'],
    figure: { value: '—', unit: 'here the trail ends' },
  },
};

export const stops: PathStop[] = stopsPl.map((stop) => {
  const { sourceLabels, ...text } = TEXT[stop.id];
  if (sourceLabels.length !== stop.sources.length) throw new Error(`[en] ${stop.id}: inna liczba źródeł niż po polsku`);
  return { ...stop, ...text, sources: stop.sources.map((s, i) => ({ ...s, label: sourceLabels[i], href: s.href.startsWith('/dane/zadluzenie-szpitali/') ? '/en/data/hospital-debt/' : s.href })) };
});

const TEXTS = 'Texts at this stop';

export const links: Record<string, { label: string; items: PathLinkEn[] }[]> = {
  skladka: [{
    label: TEXTS,
    items: [{ ref: 'sladem-zlotowki' }, { ref: 'wizyty-prywatne-kolejka-cena' }, { ref: 'publiczna-prywatna-ochrona-zdrowia' }, { ref: 'apteka-pieniadz-publiczny' }],
  }],
  plan: [{
    label: TEXTS,
    items: [{ ref: 'budzet-nfz' }, { ref: 'zadluzenie-szpitali' }, { ref: 'covid-pieniadz-publiczny' }],
  }],
  rozliczenie: [{
    label: TEXTS,
    items: [{ ref: 'rozliczenia-nfz' }, { ref: 'wycena-swiadczen' }, { ref: 'poz-pieniadz-za-pacjenta' }, { ref: 'dyzur-w-szpitalu-powiatowym' }, { ref: 'fikcyjne-wizyty' }],
  }],
  wyplata: [
    {
      label: 'What is known about the amounts',
      items: [{ ref: 'rozklad-wynagrodzen' }, { ref: 'wedlug-specjalizacji' }, { ref: 'zarobki-ujawnione-listy' }, { ref: 'rekordy' }, { ref: 'monitoring-watchdog' }, { ref: 'lekarze-radni' }, { ref: 'zarobki-dyrektorow-szpitali' }, { ref: 'personel-medyczny' }],
    },
    {
      label: 'Why the total cannot be seen',
      items: [{ ref: 'kontrakt-vs-etat' }, { ref: 'wieloetatowosc' }, { ref: 'brak-jawnosci' }, { ref: 'nil-a-kontrakty-lekarskie' }, { ref: 'ustawa-o-danych-a-jawny-rejestr' }, { ref: 'limity-wynagrodzen-medykow' }],
    },
  ],
};

export const after = [
  {
    title: 'How it is elsewhere',
    lead: 'What other countries publish about doctors’ pay and how that pay compares with the average.',
    items: [{ ref: 'zarobki-lekarzy-polska-sasiedzi' }, { ref: 'zarobki-lekarzy-na-swiecie' }, { ref: 'tajwan-ochrona-zdrowia' }, { ref: 'kanada-lekarze-ustawa-specjalna' }] as PathLinkEn[],
  },
  {
    title: 'What can change',
    lead: 'Public amounts, protected names: what we propose, which laws already exist and what the parties say about it.',
    items: [
      { label: 'Our demand: public amounts, protected names', href: '/en/demand/', text: 'The total pay of every person from all facilities contracted with the NFZ, every quarter, under a permanent identifier instead of a name.' },
      { ref: 'projekt-nowelizacji-art-27a', polish: true, label: 'Draft amendment to art. 27a', text: 'Quarterly, pseudonymised pay data from facilities contracted with the NFZ. Two new points, with no changes to existing provisions.' },
      { label: 'Acts on this site', href: '/ustawy/', polish: true, text: 'Acts and bills described on the site, by stage: in force, in the Sejm and this site’s citizens’ draft. Each description is based on the text of the act, not on commentaries.' },
      { ref: 'barometr-polityczny', polish: true, label: 'Political barometer: the parties’ health policy', text: 'What parties propose in healthcare, with the same questions for each of them and a source for each claim. We start with an invitation: each party can present its programme.' },
      { label: 'Common objections to pay transparency', href: '/en/faq/', text: 'Is pay transparency an attack on doctors, populism or an encouragement to emigrate? The most common objections to this site and our answers.' },
    ] as PathLinkEn[],
  },
];

/* ---------- Przystanek 1: skąd są pieniądze ---------- */

const bnEn = (thousands: number) => formatEN(thousands / 1_000_000, 2);

const SPLIT_TEXT: Record<string, { label: string; amount: string; text: string }> = {
  skladka: {
    label: 'Contribution',
    amount: `PLN ${bnEn(PLAN_2026.contribution)} billion`,
    text: 'Paid by employees, entrepreneurs and farmers, and for some people by the budget. It is not enough on its own: in 2021–H1 2024 it covered from 90.3% to 96.26% of the cost of services.',
  },
  dotacja: {
    label: 'Budget subsidy',
    amount: `PLN ${bnEn(PLAN_2026.subsidy)} billion`,
    text: 'A top-up from the state budget that grows during the year: according to the Ministry of Health, the subsidy for 2026 rose from PLN 26 billion to PLN 33.6 billion.',
  },
  inne: {
    label: 'Other revenue',
    amount: `PLN ${bnEn(PLAN_2026.other)} billion`,
    text: 'A transfer from the Medical Fund, the sugar and alcohol levies, financial revenue and smaller items.',
  },
};

export const planSplit = planSplitPl.map((p) => ({ ...p, ...SPLIT_TEXT[p.id] }));

/* ---------- Przystanek 4: kto widzi sumę ---------- */

const VIEWER_TEXT: Record<string, Pick<Viewer, 'label' | 'sumLabel' | 'text'>> = {
  szpital: { label: 'Hospital', sumLabel: 'cannot see the total', text: 'Knows only its own payments. It does not know how much the same person receives at other facilities.' },
  nfz: { label: 'NFZ', sumLabel: 'cannot see the total', text: 'Pays the facility for services, not the doctor. The settlements do not show how much the facility pays a particular person.' },
  aotmit: { label: 'AOTMiT', sumLabel: 'cannot see the total', text: 'Collects pay data, but sees it within one facility: the same person in three hospitals is three unconnected entries.' },
  minister: { label: 'Minister of Health', sumLabel: 'can compile it', text: 'Since 5 August 2026 the minister can demand data with PESEL (national ID) and PWZ (licence) numbers, and so can add up one person’s payments. Facilities hand them over only on request, and the act does not provide for publication.' },
  ty: { label: 'You', sumLabel: 'you cannot see the total', text: 'You can ask a single facility, if it chooses to answer, and read councillors’ asset declarations. For most doctors, the total is in no public source.' },
};

export const viewers: Viewer[] = viewersPl.map((v) => ({ ...v, ...VIEWER_TEXT[v.id] }));
