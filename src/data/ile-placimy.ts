/**
 * Strona-ścieżka /ile-placimy/.
 * Oś strony to cztery przystanki z analizy „Śladem publicznej złotówki” (STOPS, ocena jawności redakcji):
 * płaca czytelnika zmienia liczby na trzech pierwszych, a na ostatnim ślad się urywa. Udziału płac w NFZ celowo nie liczymy.
 * Liczby pochodzą z modułów źródłowych; tu tylko układ ścieżki, rachunki na nich i krótkie wprowadzenia.
 * Moduł czyta też wersja angielska: src/data/en/ile-placimy.ts.
 */
import { GUS_2025, LINKS as PHARMACY_LINKS } from '@/data/apteka-pieniadz-publiczny';
import { BUDGET, CURRENT, CURRENT_PLAN, LAST_FINAL, LINKS as BUDGET_LINKS } from '@/data/budzet-nfz';
import { CONTRIBUTION_RATE, LINKS as QUEUE_LINKS, MEDIAN_WAGES, MIN_WAGE, OUT_OF_POCKET, POPULATION_2024, SOCIAL_SHARE, WHC_EDITIONS } from '@/data/kolejki';
import { RATE } from '@/data/poz';
import { LINKS as PAY_LINKS, MEDIANS, SHARES } from '@/data/rozklad-wynagrodzen';
import { bn, LINKS as ROUTE_LINKS, PLAN_2026, PLAN_2026_TOTAL, STOPS, type Stop as RouteStop } from '@/data/sladem-zlotowki';
import { AOS_LAST, LINKS as PRIVATE_LINKS } from '@/data/wizyty-prywatne-kolejka-cena';
import { LINKS as DEBT_LINKS, OTHER_HOSPITALS } from '@/data/zadluzenie';
import { DATA as LISTS_DATA, LISTS, MEDIAN as LISTS_MEDIAN, OVER_500K, POSITIONS } from '@/data/zarobki-ujawnione-listy';
import { formatPL } from '@/lib/format';

export const pathPage = {
  title: 'Ile i za co płacimy',
  docTitle: 'Ile i za co płacimy lekarzom: od składki do wypłaty',
  eyebrow: 'Ścieżka · od składki do wypłaty',
  description: 'Od składki zdrowotnej do wypłaty lekarza w czterech przystankach. Sumy widać na każdym z nich, a łącznej kwoty dla jednej osoby publicznie na żadnym.',
  lead: 'Od Twojej składki do wypłaty lekarza, w czterech przystankach. Sumy widać na każdym z nich, a łącznej kwoty dla jednej osoby publicznie na żadnym.',
};

/* ---------- Rachunek na płacy czytelnika ---------- */

const median = MEDIAN_WAGES.at(-1)!;
const minimum = MIN_WAGE.at(-1)!;

/** Pozycje do wyboru w kalkulatorze; pierwsza to stan startowy strony. */
export const wagePresets = [
  { id: 'mediana', label: 'Mediana', wage: median.median, phrase: 'przy medianie płac' },
  { id: 'minimalna', label: 'Płaca minimalna', wage: minimum.value, phrase: 'przy płacy minimalnej' },
];
export const WAGE_RANGE = { min: 4800, max: 30000, step: 100 };

/** Składka roczna od płacy brutto: 9% × (brutto − 13,71% składek społecznych) × 12, umowa o pracę (jak `contribution` w data/kolejki.ts). */
export const YEARLY_RATE = CONTRIBUTION_RATE * (1 - SOCIAL_SHARE) * 12;

/** Koszty planu NFZ na rok w toku na jednego mieszkańca, nasz rachunek (ludność z 2024 r.). */
export const PER_PERSON = (CURRENT.costs * 1e9) / POPULATION_2024;

/** Przeciętne świadczenie ambulatoryjnej opieki specjalistycznej, sprawozdanie NFZ za 2024 r. (koszt w tys. zł). */
export const AOS_AVERAGE = (AOS_LAST.cost * 1000) / AOS_LAST.services;

/** Stan startowy liczb, zanim czytelnik ruszy suwak: mediana płac (bez JS strona zostaje przy niej). */
const startYearly = wagePresets[0].wage * YEARLY_RATE;
export const startFigures = {
  year: formatPL(Math.round(startYearly)),
  month: formatPL(Math.round(startYearly / 12)),
  ratio: formatPL(Math.round((startYearly / PER_PERSON) * 100)),
  visits: `ok. ${formatPL(Math.round(startYearly / AOS_AVERAGE))}`,
  person: formatPL(Math.round(PER_PERSON / 10) * 10),
  aos: formatPL(Math.round(AOS_AVERAGE)),
  aosYear: AOS_LAST.year,
  aosCost: formatPL(AOS_LAST.cost / 1e6, 1),
  aosServices: formatPL(AOS_LAST.services / 1e6, 1),
  phrase: wagePresets[0].phrase,
};

export const sources = {
  median: { label: `GUS, mediana płac X ${median.year}`, href: median.href },
  nik: { label: 'NIK, kontrola NFZ 2021–2024', href: ROUTE_LINKS.nikNfz },
  plan: { label: `plan NFZ, stan na ${CURRENT_PLAN.dateShort}`, href: CURRENT_PLAN.href },
  people: { label: 'GUS, ludność 2024', href: QUEUE_LINKS.gusLudnosc },
  aos: { label: `sprawozdanie NFZ za ${AOS_LAST.year} rok`, href: PRIVATE_LINKS.nfz2024 },
  pay: { label: 'AOTMiT, luty 2026 r., za: Rzeczpospolita', href: PAY_LINKS.aotmit },
  draft: { label: 'Komisja Zdrowia, 9.07.2025', href: ROUTE_LINKS.kz88 },
  mz: { label: 'MZ, 18.09.2026', href: ROUTE_LINKS.mz19444 },
  whc: { label: 'Barometr WHC', href: QUEUE_LINKS.whcRaporty },
  lump: { label: 'rozporządzenie MZ z 22.09.2017, § 3 ust. 1, t.j. Dz.U. 2025 poz. 878', href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/878/text.pdf' },
};

/* ---------- Przystanki ---------- */

export interface PathLink {
  /** id artykułu; bez niego potrzebne `href`, `label` i `text` */
  ref?: string;
  href?: string;
  label?: string;
  /** opis strony spoza kolekcji artykułów */
  text?: string;
  anchor?: string;
}

export interface PathStop {
  id: string;
  question: string;
  /** przystanek z analizy: nazwa, ocena jawności, co się dzieje z pieniędzmi, co widać i czego nie */
  route: RouteStop;
  lead: string;
  /** objaśnienie mechanizmu, z HTML (`<strong>` przy kluczowych liczbach); każda teza ma adres w `sources` */
  body: string[];
  sources: { label: string; href: string }[];
  /** liczba na kroku; `my` to klucz kalkulatora, gdy zależy od płacy czytelnika */
  figure: { value: string; my?: string; suffix?: string; unit: string };
}

const oop = OUT_OF_POCKET.at(-1)!;
const oopGrowth = Math.round((oop.value / OUT_OF_POCKET.at(-2)!.value - 1) * 100);
const mld1 = (n: number) => formatPL(n, 1);

export const stops: PathStop[] = [
  {
    id: 'skladka',
    question: 'Skąd są te pieniądze',
    route: STOPS[0],
    lead: STOPS[0].what,
    body: [
      'Pracownik płaci na zdrowie <strong>9% podstawy</strong> wymiaru składki. Do końca 2021 r. większość tej kwoty odliczało się od podatku, a od 1 stycznia 2022 r. odliczenia nie ma.',
      'Rolnik w KRUS płaci <strong>1 zł od hektara</strong> przeliczeniowego, a za gospodarstwa mniejsze niż 6 ha składkę wnosi budżet. To dwie różne miary, więc samo zestawienie nie mówi, kto płaci więcej.',
      `Część wydatków na leczenie w ogóle nie przechodzi przez NFZ. W ${oop.year} r. gospodarstwa domowe wydały na leczenie z własnej kieszeni <strong>${mld1(oop.value)} mld zł</strong>, o ${oopGrowth}% więcej niż rok wcześniej. Za leki na receptę w aptekach pacjenci zapłacili w 2025 r. ${mld1(GUS_2025.patients)} mld zł, a NFZ ${mld1(GUS_2025.refund)} mld zł.`,
    ],
    sources: [
      { label: 'RPO, składka zdrowotna', href: 'https://bip.brpo.gov.pl/pl/content/rpo-podatki-skladka-zdrowotna-niemoznosc-odliczenia-mz-odpowiedz' },
      { label: 'KRUS', href: 'https://www.gov.pl/web/krus/ubezpieczenia-zdrowotne' },
      { label: `GUS, Narodowy Rachunek Zdrowia za ${oop.year} r.`, href: QUEUE_LINKS.nrz2024 },
      { label: 'GUS, sprzedaż leków na receptę, 2025', href: PHARMACY_LINKS.gus },
    ],
    figure: { value: startFigures.year, my: 'year', suffix: ' zł', unit: 'Twoja składka rocznie' },
  },
  {
    id: 'plan',
    question: 'Co się z nimi dzieje w NFZ',
    route: { ...STOPS[1], hidden: 'Ile z tych kosztów to płace. Plan zmienia się też w ciągu roku, więc „budżet NFZ” bez daty wersji nic nie mówi.' },
    lead: STOPS[1].what,
    body: [
      `Plan musi być zbilansowany: koszty nie mogą przekroczyć przychodów. Od ${BUDGET[0].year} do ${LAST_FINAL.year} r. koszty w planie wzrosły z <strong>${mld1(BUDGET[0].costs)} do ${mld1(LAST_FINAL.costs)} mld zł</strong>: nominalnie ponad trzykrotnie, a po odliczeniu inflacji mniej więcej dwukrotnie.`,
      'Plan nie pokazuje, ile kosztują płace. Koszt ustawy o najniższych wynagrodzeniach znamy z szacunków: <strong>71–72 mld zł</strong> w 2026 r., czyli ok. jednej trzeciej kosztów.',
      `Plan nie mówi też, czy pieniędzy wystarcza placówkom. Na koniec 2025 r. ${OTHER_HOSPITALS.hospitals} publiczne szpitale były winne <strong>${formatPL(OTHER_HOSPITALS.hospitalsTotal / 1000)} mld zł</strong>, a dług idzie głównie na bieżące wydatki. Nasz szacunek na dziś, który obejmuje też SPZOZ-y niebędące szpitalami, to ponad 40 mld zł.`,
    ],
    sources: [
      { label: 'NFZ, plany finansowe', href: BUDGET_LINKS.bip },
      { label: 'GUS, wskaźniki cen', href: 'https://stat.gov.pl/obszary-tematyczne/ceny-handel/wskazniki-cen/wskazniki-cen-towarow-i-uslug-konsumpcyjnych-pot-inflacja-/roczne-wskazniki-cen-towarow-i-uslug-konsumpcyjnych/' },
      { label: 'TVN24', href: BUDGET_LINKS.tvn },
      { label: 'Forsal.pl', href: BUDGET_LINKS.forsal },
      { label: 'MZ za: Rynek Zdrowia', href: DEBT_LINKS.rynekZdrowia },
      { label: 'licznik długu szpitali', href: '/dane/zadluzenie-szpitali/' },
    ],
    figure: { value: startFigures.ratio, my: 'ratio', suffix: '%', unit: 'średnich kosztów NFZ na mieszkańca' },
  },
  {
    id: 'rozliczenie',
    question: 'Za co NFZ płaci szpitalowi',
    route: STOPS[2],
    lead: `${STOPS[2].what} W latach 2015–2020 niezależna taryfa objęła ok. 17% wartości świadczeń, resztę cen ustalał płatnik.`,
    body: [
      'Szpital z sieci nie dostaje zapłaty za każdy zabieg osobno, tylko <strong>ryczałt</strong>: kwotę ustaloną z góry na okres rozliczeniowy, której wysokość zależy od punktów wykazanych wcześniej. Z przelewu nie wynika więc, ile kosztował pojedynczy zabieg.',
      `W podstawowej opiece zdrowotnej NFZ płaci roczną stawkę za każdego pacjenta na liście lekarza, także za tych, którzy nie przychodzą. Od lipca 2026 r. stawka bazowa to <strong>${formatPL(RATE.rate, 2)} zł</strong>.`,
      'Zapłata nie zawsze przychodzi od razu. Według NIK za świadczenia nielimitowane z I półrocza 2024 r. NFZ był 17 września tego roku winien jeszcze <strong>1,65 mld zł</strong>, a 11 października ok. 317 mln zł.',
    ],
    sources: [
      { label: 'NIK, wycena świadczeń 2015–2020', href: 'https://www.nik.gov.pl/plik/id,24432,vp,27176.pdf' },
      { label: 'rozporządzenie MZ o ryczałcie, t.j. Dz.U. 2025 poz. 878', href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/878/text.pdf' },
      { label: 'zarządzenie Prezesa NFZ nr 65/2026', href: 'https://baw.nfz.gov.pl/NFZ/document/43917/Zarzadzenie-65_2026_DSOZ' },
      { label: 'NIK, kontrola NFZ 2021–2024', href: ROUTE_LINKS.nikNfz },
    ],
    figure: { value: startFigures.visits, my: 'visits', unit: 'świadczeń w poradni za Twoją roczną składkę' },
  },
  {
    id: 'wyplata',
    question: 'Ile z tego dostaje lekarz',
    route: STOPS[3],
    lead: STOPS[3].what,
    body: [
      `Według danych AOTMiT na umowach cywilnoprawnych rozlicza się <strong>${formatPL(SHARES.civil, 2)}% specjalistów</strong>, a mediana wypłaty z jednego kontraktu specjalisty to <strong>${formatPL(MEDIANS.specKontrakt)} zł</strong> brutto miesięcznie. Obie liczby dotyczą umów z pojedynczym szpitalem.`,
      'Na etacie jawne jest ustawowe minimum płacy. Kwot kontraktów nikt nie publikuje, a lekarz pracujący w kilku placówkach jest w danych kilkoma niepowiązanymi wpisami.',
      `Część kwot ujawniły same placówki. Pełne listy płac za ${LISTS_DATA.year} r. przysłało w monitoringu Watchdog Polska ${LISTS} z ${formatPL(LISTS_DATA.requests)} zapytanych: ${formatPL(POSITIONS)} rozliczeń, mediana ok. <strong>${formatPL(LISTS_MEDIAN.rounded / 1000)} tys. zł</strong> rocznie, a ${formatPL(Math.round((OVER_500K / POSITIONS) * 100))}% kwot przekracza 500 tys. zł. Każda kwota to wypłata jednej placówki, więc dla konkretnego lekarza to dolna granica.`,
    ],
    sources: [
      { label: 'AOTMiT, luty 2026 r., za: Rzeczpospolita', href: PAY_LINKS.aotmit },
      { label: 'Watchdog Polska, monitoring płac', href: LISTS_DATA.source.url },
    ],
    figure: { value: '—', unit: 'tu ślad się urywa' },
  },
];

export const links: Record<string, { label: string; items: PathLink[] }[]> = {
  skladka: [{
    label: 'Teksty na tym przystanku',
    items: [{ ref: 'sladem-zlotowki' }, { ref: 'wizyty-prywatne-kolejka-cena' }, { ref: 'publiczna-prywatna-ochrona-zdrowia' }, { ref: 'apteka-pieniadz-publiczny' }],
  }],
  plan: [{
    label: 'Teksty na tym przystanku',
    items: [{ ref: 'budzet-nfz' }, { ref: 'zadluzenie-szpitali' }, { ref: 'covid-pieniadz-publiczny' }],
  }],
  rozliczenie: [{
    label: 'Teksty na tym przystanku',
    items: [{ ref: 'rozliczenia-nfz' }, { ref: 'wycena-swiadczen' }, { ref: 'poz-pieniadz-za-pacjenta' }, { ref: 'dyzur-w-szpitalu-powiatowym' }, { ref: 'fikcyjne-wizyty' }],
  }],
  wyplata: [
    {
      label: 'Co wiadomo o kwotach',
      items: [{ ref: 'rozklad-wynagrodzen' }, { ref: 'wedlug-specjalizacji' }, { ref: 'zarobki-ujawnione-listy' }, { ref: 'rekordy' }, { ref: 'monitoring-watchdog' }, { ref: 'lekarze-radni' }, { ref: 'zarobki-dyrektorow-szpitali' }, { ref: 'personel-medyczny' }],
    },
    {
      label: 'Dlaczego sumy nie widać',
      items: [{ ref: 'kontrakt-vs-etat' }, { ref: 'wieloetatowosc' }, { ref: 'brak-jawnosci' }, { ref: 'nil-a-kontrakty-lekarskie' }, { ref: 'ustawa-o-danych-a-jawny-rejestr' }, { ref: 'limity-wynagrodzen-medykow' }],
    },
  ],
};

/** Po ostatnim przystanku: porównania i to, co można zmienić. */
export const after = [
  {
    title: 'Jak jest gdzie indziej',
    lead: 'Co inne kraje publikują o płacach lekarzy i jak te płace wyglądają na tle przeciętnej.',
    items: [{ ref: 'zarobki-lekarzy-polska-sasiedzi' }, { ref: 'zarobki-lekarzy-na-swiecie' }, { ref: 'tajwan-ochrona-zdrowia' }, { ref: 'kanada-lekarze-ustawa-specjalna' }] as PathLink[],
  },
  {
    title: 'Co można zmienić',
    lead: 'Jawne kwoty, chronione nazwiska: co proponujemy, jakie ustawy już są i co mówią o tym partie.',
    items: [
      { label: 'Postulat: jawne kwoty, chronione nazwiska', href: '/postulat/', text: 'Łączne wynagrodzenie każdej osoby ze wszystkich placówek z umową z NFZ, co kwartał, pod stałym identyfikatorem zamiast nazwiska.' },
      { ref: 'projekt-nowelizacji-art-27a' },
      { label: 'Ustawy na stronie', href: '/ustawy/', text: 'Ustawy i projekty ustaw opisane na stronie, według etapu: obowiązujące, w Sejmie i projekt obywatelski tej strony. Każdy opis opiera się na tekście aktu, nie na omówieniach.' },
      { ref: 'barometr-polityczny' },
      { label: 'Najczęstsze zarzuty wobec jawności płac', href: '/faq/', text: 'Czy jawność płac to atak na lekarzy, populizm albo zachęta do emigracji? Najczęstsze zarzuty wobec serwisu i nasze odpowiedzi.' },
    ] as PathLink[],
  },
];

/* ---------- Przystanek 1: skąd są pieniądze ---------- */

const share = (thousands: number) => Math.round((thousands / PLAN_2026_TOTAL) * 100);

/** Na każde 100 zł w projekcie planu na 2026 r. (lipiec 2025 r.); udziały sumują się do 100. */
export const planSplit = [
  {
    id: 'skladka',
    label: 'Składka',
    share: share(PLAN_2026.contribution),
    amount: `${bn(PLAN_2026.contribution)} mld zł`,
    text: 'Płacą ją pracownicy, przedsiębiorcy i rolnicy, a za część osób budżet. Sama nie wystarcza: w latach 2021–I poł. 2024 pokrywała od 90,3% do 96,26% kosztów świadczeń.',
  },
  {
    id: 'dotacja',
    label: 'Dotacja z budżetu',
    share: share(PLAN_2026.subsidy),
    amount: `${bn(PLAN_2026.subsidy)} mld zł`,
    text: 'Dopłata z budżetu państwa, która rośnie w trakcie roku: według MZ dotacja na 2026 r. wzrosła z 26 do 33,6 mld zł.',
  },
  {
    id: 'inne',
    label: 'Inne przychody',
    share: share(PLAN_2026.other),
    amount: `${bn(PLAN_2026.other)} mld zł`,
    text: 'Przelew z Funduszu Medycznego, opłaty cukrowa i alkoholowa, przychody finansowe i mniejsze pozycje.',
  },
];

/* ---------- Przystanek 2: rok po roku ---------- */

/** Koszty w planie NFZ i kolejka z Barometru WHC: ostatnia edycja danego roku, null = tego roku edycji nie ma. */
export const years = BUDGET.map((row) => ({
  year: row.year,
  costs: row.costs,
  inProgress: row.status === 'current',
  href: row.href,
  queue: WHC_EDITIONS.filter((e) => e.year === row.year).at(-1)?.single ?? null,
}));

/* ---------- Przystanek 4: kto widzi sumę ---------- */

export type View = 'on' | 'mid' | 'off' | 'miss';

export interface Viewer {
  id: string;
  label: string;
  /** co widać na trzech planszach placówek i na planszy sumy */
  boards: [View, View, View];
  sum: View;
  /** odpowiedź na „kto widzi sumę?”, widoczna bez klikania */
  sumLabel: string;
  text: string;
}

/** Zdania z analiz „Brak jawności” i „Ustawa o danych płacowych”. Plansze to ilustracja bez kwot. */
export const viewers: Viewer[] = [
  {
    id: 'szpital',
    label: 'Szpital',
    boards: ['on', 'off', 'off'],
    sum: 'miss',
    sumLabel: 'sumy nie widzi',
    text: 'Zna tylko swoje wypłaty. Nie wie, ile ta sama osoba dostaje w innych placówkach.',
  },
  {
    id: 'nfz',
    label: 'NFZ',
    boards: ['off', 'off', 'off'],
    sum: 'miss',
    sumLabel: 'sumy nie widzi',
    text: 'Płaci placówce za świadczenia, a nie lekarzowi. Z rozliczeń nie wynika, ile placówka wypłaca konkretnej osobie.',
  },
  {
    id: 'aotmit',
    label: 'AOTMiT',
    boards: ['on', 'on', 'on'],
    sum: 'miss',
    sumLabel: 'sumy nie widzi',
    text: 'Zbiera dane o wynagrodzeniach, ale widzi je w obrębie jednej placówki: ta sama osoba w trzech szpitalach to trzy niepowiązane wpisy.',
  },
  {
    id: 'minister',
    label: 'Minister zdrowia',
    boards: ['on', 'on', 'on'],
    sum: 'mid',
    sumLabel: 'może ją zebrać',
    text: 'Od 5 sierpnia 2026 r. może żądać danych z numerem PESEL i PWZ, więc może zsumować wypłaty jednej osoby. Placówki przekazują je tylko na wniosek, a ustawa nie przewiduje publikacji.',
  },
  {
    id: 'ty',
    label: 'Ty',
    boards: ['mid', 'off', 'off'],
    sum: 'miss',
    sumLabel: 'sumy nie widzisz',
    text: 'Możesz zapytać jedną placówkę, jeśli zechce odpowiedzieć, i przeczytać oświadczenia majątkowe radnych. Dla większości lekarzy sumy nie ma w żadnym publicznym źródle.',
  },
];
