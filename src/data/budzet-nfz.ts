/**
 * Budżet NFZ — jedyne źródło liczb budżetu Funduszu w serwisie (/dane/budzet-nfz/, /dane/kolejki/;
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
  /** projekt planu na 2027 r.: dotacja ok. 35 mld zł, koszty wyższe od przychodów o ok. 21 mld zł */
  rpLuka: 'https://www.rp.pl/rynek-zdrowia/art44627201-budzet-nfz-sie-nie-spina-w-przyszlym-roku-bedzie-jeszcze-gorzej',
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

/** Wiersze do wykresu słupkowego (BarChart): koszty w planie, rok w toku z dopiskiem. */
export const costRows = (highlightYear = LAST_FINAL.year) =>
  BUDGET.map((r) => ({
    label: String(r.year),
    note: r.status === 'current' ? `plan w toku, stan na ${CURRENT_PLAN.dateShort}` : undefined,
    value: r.costs,
    display: `${mld(r.costs)} mld zł`,
    highlight: r.year === highlightYear,
  }));

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
