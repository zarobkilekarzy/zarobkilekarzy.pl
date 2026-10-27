/**
 * Budżet NFZ — jedyne źródło liczb budżetu Funduszu w serwisie (/dane/budzet-nfz/ z częścią o kolejkach;
 * inne strony powinny importować stąd zamiast wpisywać kwoty).
 *
 * DEFINICJA SERII: koszty ogółem (poz. K) w OSTATECZNYM planie finansowym NFZ na dany rok, czyli ile
 * Fundusz mógł wydać po wszystkich zmianach planu. Rok w toku (2026) to plan aktualny według
 * ostatniego zarządzenia Prezesa NFZ zmieniającego plan. Obok, jako osobne kolumny (nigdy w tej samej
 * serii): przychody ogółem (poz. J) tego samego planu, koszty świadczeń (poz. B2), wykonanie (koszty
 * działalności operacyjnej z łącznego sprawozdania finansowego NFZ) i dotacja podmiotowa z budżetu
 * państwa (art. 97 ust. 8a ustawy o świadczeniach; w planach do 2022 r. poz. A5, od 2023 r. poz. A4).
 *
 * Nie mieszać: planu pierwotnego z ostatecznym, przychodów z kosztami, projektu z planem. Zmiany r/r
 * liczyć tylko w obrębie jednej kolumny.
 *
 * Wartości w mld zł, odczytane z plików xlsx/xls w BIP NFZ (kwoty w tys. zł). Weryfikacja: 15.10.2026.
 *
 * AKTUALIZACJA:
 * - po każdym zarządzeniu Prezesa NFZ zmieniającym plan roku w toku: podmień wiersz roku w toku
 *   i CURRENT_PLAN (data, numer zarządzenia, adres);
 * - gdy w BIP pojawi się ostateczny plan roku w toku (zwykle wiosną następnego roku): status 'final',
 *   adres pliku, a nowy rok w toku dopisz z planem aktualnym;
 * - wykonanie: łączne sprawozdanie finansowe NFZ (BIP, zwykle połowa następnego roku).
 */

import { formatPL } from '@/lib/format';

const BIP = 'https://www.nfz.gov.pl/gfx/nfz/userfiles/_public/bip/finanse_nfz';

export const LINKS = {
  /** spis planów finansowych i sprawozdań */
  bip: 'https://www.nfz.gov.pl/bip/finanse-nfz/',
  plan2015: `${BIP}/2015/plan_ostateczny_2015_r..xls`,
  plan2016: `${BIP}/2016/plan_ostateczny_nfz_na_2016_r..xlsx`,
  plan2017: `${BIP}/2018/plan_ostateczny_2017.xlsx`,
  plan2018: `${BIP}/2018/plan_ostateczny_2018.xlsx`,
  plan2019: `${BIP}/2019/plan_ostateczny_2019_r.xlsx`,
  plan2020: `${BIP}/2021/ostateczny_plan_finansowy_za_2020_rok_-_po_stanowisku_mf.xlsx`,
  plan2021: `${BIP}/2021/ostateczny_plan_finansowy_nfz_na_rok_2021..xlsx`,
  plan2022: `${BIP}/2022/ostateczny_plan_finansowy_nfz_na_rok_2022..xlsx`,
  plan2023: `${BIP}/2023/ostateczny_plan_finansowy_nfz_na_rok_2023.xlsx`,
  plan2024: `${BIP}/2024/ostateczny_plan_finansowy_nfz_na_rok_2024.xlsx`,
  plan2025: `${BIP}/2025/ostateczny_plan_finansowy_nfz_na_rok_2025.xlsx`,
  /** plan 2026 po zmianach: zarządzenie 107/2026/DEF (Baza Aktów Własnych NFZ) */
  z107: 'https://baw.nfz.gov.pl/NFZ/document/44057/Zarzadzenie-107_2026_DEF',
  /** zarządzenie 73/2026/DEF — m.in. dotacja na 2026 r. podniesiona do 33,6 mld zł */
  z73: 'https://baw.nfz.gov.pl/NFZ/document/43941/Zarzadzenie-73_2026_DEF',
  spr2020: `${BIP}/2021/laczne_sprawozdanie_finansowe_nfz_2020.pdf`,
  spr2021: `${BIP}/2022/laczne_sprawozdanie_finansowe_nfz_2021.pdf`,
  spr2022: 'https://www.nfz.gov.pl/gfx/nfz/userfiles/_public/bip/majatek_nfz/2022/laczne_sprawozdanie_finansowe_nfz_2022.pdf',
  spr2023: `${BIP}/2024/laczne_sprawozdanie_finansowe_nfz_2023.pdf`,
  spr2024: `${BIP}/2025/laczne_sprawozdanie_finansowe_nfz_2024.pdf`,
  spr2025: `${BIP}/2026/laczne_sprawozdanie_finansowe_nfz_2025.pdf`,
  /** projekt planu na 2026 r. (lipiec 2025): przychody = koszty 217,39 mld zł, dotacja 26 mld zł */
  kz88: 'https://api.sejm.gov.pl/sejm/term10/committees/ZDR/sittings/88/pdf',
  /** Komisja Zdrowia, posiedzenie nr 152 (2.07.2026): projekt planu na 2027 r. przedstawia wiceprezes NFZ */
  kz152: 'https://api.sejm.gov.pl/sejm/term10/committees/ZDR/sittings/152/pdf',
  /** Rada Fiskalna, opinia o wstępnym projekcie ustawy budżetowej na 2027 r. (11.09.2026), s. 28–29 */
  rf2027: 'https://www.radafiskalna.gov.pl/wp-content/uploads/2026/09/2026-09-11_opinia-RF-o-wPUB27.pdf',
  /** NIK, „Realizacja zadań finansowanych z Funduszu Przeciwdziałania COVID-19” (2023), s. 23 */
  nikCovid: 'https://www.nik.gov.pl/plik/id,28245,vp,31071.pdf',
  /** podwyżki od lipca 2026 r.: ok. 4,5 mld zł do końca roku, ok. 9 mld zł w 2027 r.; „dziura” ok. 16 mld zł */
  rz285313: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/9-mld-zl-na-podwyzki-dla-medykow-Zaplaci-Narodowy-Fundusz-Zdrowia,285313,1.html',
  /** rekomendacja AOTMiT 84/2026: wydatki NFZ wzrosną o 9,25 mld zł */
  termediaAotmit: 'https://www.termedia.pl/mz/Na-podwyzki-NFZ-ma-wydac-ponad-9-mld-zl-AOTMiT-publikuje-rekomendacje,68001.html',
  /** wiceprezes NFZ na EKG, 23.04.2026: „plan 220 mld zł, z czego 72 mld” */
  forsal: 'https://forsal.pl/gospodarka/aktualnosci/artykuly/11237489,miliardy-zlotych-na-podwyzki-w-ochronie-zdrowia-wiceprezes-nfz-jakub.html',
  /** TVN24, 23.04.2026: co najmniej 71 mld zł w 2026 r.; 58 mld zł skumulowanego kosztu w 2025 r. (analizy FPP) */
  tvn: 'https://tvn24.pl/zdrowie/podwyzki-plac-minimalnych-w-ochronie-zdrowia-ile-beda-kosztowaly-st9013918',
  /** FPP, „Monitor finansowania ochrony zdrowia”: 69,4 z 100,3 mld zł wzrostu nakładów 2018–2024 na płace */
  prawoFpp: 'https://www.prawo.pl/zdrowie/monitor-finansowy-ochrony-zdrowia-podwyzki-plac,524511.html',
} as const;

export interface BudgetYear {
  year: number;
  /** 'final' — plan ostateczny; 'current' — rok w toku, plan aktualny (nadal się zmienia) */
  status: 'final' | 'current';
  /** koszty ogółem (poz. K), mld zł — GŁÓWNA SERIA */
  costs: number;
  /** przychody ogółem (poz. J) tego samego planu, mld zł */
  revenue: number;
  /** koszty świadczeń opieki zdrowotnej (poz. B2), mld zł */
  benefits: number;
  /** wykonanie: koszty działalności operacyjnej ze sprawozdania finansowego, mld zł; null = nie zestawiamy */
  executed: number | null;
  /** dotacja podmiotowa z budżetu państwa, mld zł; null = pozycji nie było w planie (przed 2020 r.) */
  subsidy: number | null;
  /** adres pliku planu */
  href: string;
}

export const BUDGET: BudgetYear[] = [
  { year: 2015, status: 'final', costs: 71.479, revenue: 69.932, benefits: 68.481, executed: null, subsidy: null, href: LINKS.plan2015 },
  { year: 2016, status: 'final', costs: 75.069, revenue: 72.713, benefits: 71.714, executed: null, subsidy: null, href: LINKS.plan2016 },
  { year: 2017, status: 'final', costs: 81.357, revenue: 79.784, benefits: 77.659, executed: null, subsidy: null, href: LINKS.plan2017 },
  { year: 2018, status: 'final', costs: 85.841, revenue: 84.141, benefits: 81.864, executed: null, subsidy: null, href: LINKS.plan2018 },
  { year: 2019, status: 'final', costs: 95.391, revenue: 93.155, benefits: 91.136, executed: null, subsidy: null, href: LINKS.plan2019 },
  { year: 2020, status: 'final', costs: 109.109, revenue: 105.298, benefits: 102.132, executed: 104.21, subsidy: 0, href: LINKS.plan2020 },
  { year: 2021, status: 'final', costs: 135.124, revenue: 135.124, benefits: 120.151, executed: 125.52, subsidy: 2.557, href: LINKS.plan2021 },
  { year: 2022, status: 'final', costs: 138.657, revenue: 138.657, benefits: 131.234, executed: 133.49, subsidy: 0.688, href: LINKS.plan2022 },
  { year: 2023, status: 'final', costs: 167.557, revenue: 145.871, benefits: 158.923, executed: 162.79, subsidy: 0.2, href: LINKS.plan2023 },
  { year: 2024, status: 'final', costs: 193.459, revenue: 184.044, benefits: 182.335, executed: 187.34, subsidy: 14.789, href: LINKS.plan2024 },
  { year: 2025, status: 'final', costs: 220.159, revenue: 216.633, benefits: 206.765, executed: 210.15, subsidy: 32.942, href: LINKS.plan2025 },
  { year: 2026, status: 'current', costs: 227.35, revenue: 225.17, benefits: 212.72, executed: null, subsidy: 33.6, href: LINKS.z107 },
];

/** Wiersz roku. */
export const budget = (year: number): BudgetYear => {
  const row = BUDGET.find((r) => r.year === year);
  if (!row) throw new Error(`Brak roku ${year} w serii budżetu NFZ`);
  return row;
};

/** Ostatni rok z planem ostatecznym. */
export const LAST_FINAL = BUDGET.filter((r) => r.status === 'final').at(-1)!;
/** Rok w toku (plan aktualny). */
export const CURRENT = BUDGET.find((r) => r.status === 'current')!;

/** Stan planu na rok w toku: skąd wiersz CURRENT. */
export const CURRENT_PLAN = {
  ordinance: '107/2026/DEF',
  date: '5 października 2026 r.',
  dateShort: '5.10.2026',
  href: LINKS.z107,
  /** plan finansowy NFZ na 2026 r. w dziale „podstawowa opieka zdrowotna” (B2.1), mld zł */
  primaryCare: 24.41,
} as const;

/**
 * Projekt planu na 2026 r. przedstawiony sejmowej Komisji Zdrowia 9.07.2025 — liczba „217 mld zł”,
 * która krąży w mediach. Przychody = koszty (plan zrównoważony).
 */
export const DRAFT_2026 = { total: 217.39, subsidy: 26, benefits: 201.2 } as const;

/**
 * Projekt planu na 2027 r. przedstawiony sejmowej Komisji Zdrowia 2.07.2026 (stenogram, LINKS.kz152):
 * przychody = koszty = 237 342 389 tys. zł, dotacja 35 mld zł, świadczenia 219 969 929 tys. zł.
 * Plan jest zrównoważony — deficytu w nim nie ma. Do 16.10.2026 nie został zatwierdzony; według MZ
 * zostanie skorygowany po uchwaleniu ustawy budżetowej (w projekcie budżetu dotacja to 41,5 mld zł).
 */
export const DRAFT_2027 = { year: 2027, total: 237.342389, subsidy: 35, benefits: 219.969929, href: LINKS.kz152 } as const;

/**
 * Niedobór finansowania NFZ w 2027 r. według szacunku Biura Rady Fiskalnej: ok. 16 mld zł „już po
 * uwzględnieniu dotacji podmiotowej w wysokości 41,5 mld zł” (opinia z 11.09.2026, LINKS.rf2027).
 * SZACUNEK, nie pozycja planu.
 */
export const GAP_2027 = { value: 16, subsidy: 41.5, href: LINKS.rf2027 } as const;

/**
 * Ta sama opinia Rady Fiskalnej (s. 29): w latach 2021–2025 wykonanie kosztów NFZ przewyższało plan
 * PIERWOTNY o ok. 19–22 mld zł rocznie. Rachunek Rady; nie porównywać z serią BUDGET (plany ostateczne).
 */
export const OVERRUN_2021_2025 = { min: 19, max: 22, href: LINKS.rf2027 } as const;

/**
 * Pieniądze z Funduszu Przeciwdziałania COVID-19 w NFZ. Plan nie ma na nie osobnej pozycji: przychody
 * nazwane (składka, poz. A1–A7) ich nie obejmują, więc mieszczą się w „pozostałych przychodach” (poz. E),
 * stąd ich skok w 2021 r. Sprawozdanie finansowe za 2021 r. wymienia je osobno (nota 10.2, „środki
 * z funduszu przeciwdziałania COVID-19”). NIK (LINKS.nikCovid, s. 23): od 2020 r. do połowy 2022 r.
 * Minister Zdrowia wydał z Funduszu 40 776,9 mln zł na zadania NFZ i refundację składek zdrowotnych.
 * Pozostałe przychody w mld zł, z ostatecznych planów (poz. E, kwoty w tys. zł).
 */
export const COVID_IN_NFZ = {
  nik: 40.7769,
  otherRevenue: { 2020: 12.384827, 2021: 28.20097, 2022: 7.816285 },
  href: LINKS.nikCovid,
} as const;

/** Dotacja w planie pierwotnym na 2025 r. (zarządzenie 16/2025) — punkt odniesienia dawnego „+42%”. */
export const SUBSIDY_2025_INITIAL = 18.3;

/** Zmiana w procentach między dwiema wartościami tej samej kolumny. */
export const change = (from: number, to: number) => (to / from - 1) * 100;

/**
 * Kwota w mld zł z jednym miejscem po przecinku, zaokrąglona połówką w górę
 * (227,35 → 227,4; samo toFixed dałoby 227,3 przez zapis binarny liczby).
 */
export const formatMld = (n: number, decimals = 1) => {
  const k = 10 ** decimals;
  return formatPL(Math.round(n * k + 1e-6) / k, decimals);
};
const mld = (n: number | null) => (n === null ? '—' : formatMld(n));

/**
 * Wykres liniowy (components/budzet/IndexChart bez roku bazowego): koszty w planie, mld zł.
 * Plany ostateczne to linia ciągła z kropką na każdy rok. Dalej linia przerywana: rok w toku (plan jeszcze
 * się zmienia) i projekt planu na następny rok — projekt, nie prognoza wykonania; szacunku luki (GAP_2027)
 * do niego nie doliczamy, bo ma inną podstawę.
 * Seria przerywana idzie pierwsza, żeby kropka 2025 r. z serii ciągłej leżała na wierzchu.
 */
const mid = (year: number) => year + 0.5;
const FINALS = BUDGET.filter((r) => r.status === 'final');

export const COST_CHART = {
  xMin: BUDGET[0].year,
  xMax: DRAFT_2027.year + 1,
  yMin: 0,
  yMax: 300,
  ticks: [0, 50, 100, 150, 200, 250, 300],
  unit: 'mld zł',
  years: [...BUDGET.map((r) => r.year), DRAFT_2027.year],
  series: [
    {
      id: 'draft',
      label: `${DRAFT_2027.year}, projekt planu`,
      tone: 'ref' as const,
      end: mld(DRAFT_2027.total),
      labelShift: -1,
      markers: true,
      points: [
        { x: mid(LAST_FINAL.year), v: LAST_FINAL.costs, note: 'plan ostateczny' },
        { x: mid(CURRENT.year), v: CURRENT.costs, note: `plan w toku, po zmianie z ${CURRENT_PLAN.dateShort}` },
        { x: mid(DRAFT_2027.year), v: DRAFT_2027.total, note: 'projekt planu z lipca 2026 r.' },
      ],
    },
    {
      id: 'final',
      label: `Plan ostateczny, ${LAST_FINAL.year}`,
      tone: 'accent' as const,
      end: mld(LAST_FINAL.costs),
      labelShift: 1,
      markers: true,
      points: FINALS.map((r) => ({ x: mid(r.year), v: r.costs, note: 'plan ostateczny' })),
    },
  ],
  caption:
    `Wykres liniowy. Koszty ogółem w ostatecznym planie finansowym NFZ, mld zł: ${FINALS.map((r) => `${r.year} — ${mld(r.costs)}`).join('; ')}. ` +
    `Linia przerywana: ${CURRENT.year} — plan w toku po zmianie z ${CURRENT_PLAN.dateShort}, ${mld(CURRENT.costs)} mld zł; ` +
    `${DRAFT_2027.year} — projekt planu z lipca 2026 r., ${mld(DRAFT_2027.total)} mld zł.`,
};

/**
 * Dotacja z budżetu państwa w przychodach Funduszu Ubezpieczeń Społecznych (ZUS), mld zł — TYLKO
 * do porównania skali w animacji SubsidyChart (na końcu animacji znika). Pozycja „Dotacja z budżetu
 * państwa” (dotacja uzupełniająca, budżet: rozdz. 75303); bez jednorazowych 12 mld zł w 2020 r.,
 * Funduszu Przeciwdziałania COVID-19, wpłat z OFE i świadczeń zleconych. 2020–2025 — wykonanie
 * (kwoty co do tysiąca zgodne ze sprawozdaniami z wykonania budżetu państwa), 2026 — plan finansowy
 * FUS z ustawy budżetowej. Inna miara niż seria NFZ (plan ostateczny) — nie zestawiać w tekście.
 */
export const FUS_SUBSIDY = [
  { year: 2020, value: 33.522023, status: 'wykonanie' },
  { year: 2021, value: 34.990124, status: 'wykonanie' },
  { year: 2022, value: 38.663292, status: 'wykonanie' },
  { year: 2023, value: 51.652297, status: 'wykonanie' },
  { year: 2024, value: 64.701864, status: 'wykonanie' },
  { year: 2025, value: 64.371392, status: 'wykonanie' },
  { year: 2026, value: 90.752553, status: 'plan' },
] as const;

/** Dokumenty ZUS z kwotami FUS_SUBSIDY (rok albo lata, które podaje dokument). */
export const FUS_LINKS = [
  { label: '2020', href: 'https://www.zus.pl/documents/10182/24154/Informacja+o+sytuacji+finansowej+FUS+w+2020.pdf/8afb3f68-15f7-7e67-4447-8d704884a39d' },
  { label: '2021–2022', href: 'https://www.zus.pl/documents/10182/2422424/Podsumowanie+sytuacji+finansowej+FUS+w+2022+r.pdf/6946e97b-4539-1950-1446-63c8e3a99cc3?t=1682518877597' },
  { label: '2023–2024', href: 'https://www.zus.pl/documents/10182/2422424/Podsumowanie+sytuacji+finansowej+FUS+w+2024+r.pdf/3bb6c4e1-739f-85b4-b535-6bf39ab4a4ad?t=1744359675854' },
  { label: '2025', href: 'https://www.zus.pl/documents/10182/2422424/Informacja+o+sytuacji+finansowej_FUS_2025.pdf/bab2b080-7ca9-d069-d0ac-7f6f6ecf52db?t=1777013693126' },
  { label: 'plan na 2026', href: 'https://www.zus.pl/documents/10182/2422424/Plan+finansowy+FUS+na+2026__WCAG.pdf/8208edf3-fe3d-6993-2cd0-402386035bd3?t=1761749350296' },
];

/** Animowany wykres dotacji (SubsidyChart): dotacja podmiotowa w planach od 2020 r., rok w toku = plan aktualny. */
const SUBSIDY_YEARS = BUDGET.filter((r): r is BudgetYear & { subsidy: number } => r.subsidy !== null);
export const SUBSIDY_CHART = {
  name: { full: 'Narodowy Fundusz Zdrowia', short: 'NFZ' },
  compare: { name: { full: 'Fundusz Ubezpieczeń Społecznych', short: 'FUS (ZUS)' }, values: FUS_SUBSIDY.map((r) => r.value) },
  unit: 'mld zł',
  bars: SUBSIDY_YEARS.map((r) => ({ year: r.year, value: r.subsidy, note: r.status === 'current' ? 'plan w toku' : undefined })),
  caption:
    `Wykres słupkowy. Dotacja podmiotowa z budżetu państwa w planie finansowym NFZ, mld zł: ` +
    `${SUBSIDY_YEARS.map((r) => `${r.year} — ${mld(r.subsidy)}${r.status === 'current' ? ' (plan aktualny, rok w toku)' : ''}`).join('; ')}.`,
};

/** Tabela (Comparison): wszystkie kolumny serii; zmiana r/r tylko w obrębie kolumny kosztów. */
export const BUDGET_TABLE = {
  caption: 'Mld zł. Plan — ostateczny plan finansowy NFZ; 2026 — plan aktualny, rok w toku. Wykonanie — koszty działalności operacyjnej ze sprawozdania finansowego.',
  columns: ['Rok', 'Koszty w planie', 'Zmiana kosztów r/r', 'Przychody w planie', 'Wykonanie: koszty', 'Dotacja z budżetu państwa'],
  rows: BUDGET.map((r, i) => {
    const prev = BUDGET[i - 1];
    const rr = prev ? change(prev.costs, r.costs) : null;
    return {
      cells: [
        r.status === 'current' ? `${r.year} (plan w toku)` : String(r.year),
        mld(r.costs),
        rr === null ? '—' : `${rr < 0 ? '−' : '+'}${formatPL(Math.abs(rr), 1)}%`,
        mld(r.revenue),
        mld(r.executed),
        mld(r.subsidy),
      ],
      marked: r.status === 'current',
    };
  }),
};
