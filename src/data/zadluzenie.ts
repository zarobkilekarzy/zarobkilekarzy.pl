/**
 * /dane/zadluzenie-szpitali/: liczby do licznika, wykresu, tabeli województw i rankingu strat.
 * Tekst i lista źródeł — content/articles/zadluzenie-szpitali.mdx; model licznika — lib/zadluzenie/model.ts.
 *
 * Aktualizacja co kwartał (MZ publikuje dane ok. 2–3 miesiące po końcu kwartału, plik
 * „Zobowiązania ogółem i wymagalne spzoz … – dane statystyczne” na gov.pl):
 *   1. dopisz kwartał na końcu SPZOZ_QUARTERS (arkusze „Dynamika zob. ogółem / wymagalnych spzoz”),
 *   2. podmień REGIONS (arkusze „Zob. ogółem / wymagalne woj. spzoz”) i REGIONS_DATE,
 *   3. zaktualizuj POPULATION, gdy GUS poda nowszy stan.
 * Licznik, tempo wzrostu, projekcja i wykres przeliczą się same. Liczby w treści MDX, które
 * pochodzą z tych danych, też są liczone (wyrażenia {…}). Ręcznie: `summary`, `stat` i `og`
 * we frontmatterze oraz tezy opisowe w treści (najszybszy wzrost od 2004 r., Mazowsze, MON, Łódzkie).
 */

import { buildDebt } from '@/lib/zadluzenie/model';

/** Publikacje, na które powołują się komponenty strony i liczby w StatRow (w treści — przypisy artykułu). */
export const LINKS = {
  mz: 'https://www.gov.pl/web/zdrowie/zadluzenie-spzoz',
  rynekZdrowia: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Szpitale-tona-w-dlugach-Zadluzenie-siega-blisko-40-mld-zl,286396,1.html',
  gus: 'https://biznes.interia.pl/gospodarka/news-w-rok-ubylo-159-tys-osob-w-polsce-zmiany-demograficzne-juz-p,nId,23518504',
  listaWstydu: 'https://www.termedia.pl/mz/Lista-wstydu-,63573.html',
  czestochowa: 'https://zycieczestochowy.pl/85-mln-zl-dlugu-zajecia-komornicze-i-plan-ratunkowy-dyrekcja-szpitala-na-parkitce-rozmawiala-z-mediami/',
  rzeczpospolita: 'https://www.rp.pl/ochrona-zdrowia/art44638431-rosnie-zadluzenie-publicznych-szpitali-to-juz-34-mld-zlotych',
  powiatowe: 'https://www.termedia.pl/mz/Finanse-szpitali-powiatowych-systematyczne-narastanie-strat-,66853.html',
  majatek: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Az-trudno-uwierzyc-W-polowie-zbadanych-szpitali-dlug-przekracza-wartosc-majatku,283326,1.html',
  kaliszZalegle: 'https://portal.abczdrowie.pl/szpital-w-kaliszu-z-37-mln-zl-dlugu-nowy-dyrektor-ujawnia-skale-zaniedban/7183447202130688a',
  kaliszKontrakty: 'https://calisia.pl/zadluzenie-szpitala-wysokie-wynagrodzenia-lekarzy-i-milionowe-zaleglosci-nfz-mamy-oficjalne-wyjasnienia-dyrektora-placowki,74768',
} as const;

/**
 * Zobowiązania wszystkich SPZOZ na koniec kwartału, mln zł: [kwartał, ogółem, w tym wymagalne].
 * Źródło: MZ, dane ankietowe (plik za II kw. 2026, stan strony z 02.10.2026). Pełny szereg od III kw. 2003.
 */
export const SPZOZ_QUARTERS: [label: string, total: number, overdue: number][] = [
  ['I 2020', 15307.9, 2260.1], ['II 2020', 14775.3, 2039.4], ['III 2020', 15197.6, 1875.2], ['IV 2020', 16613.8, 1702.3],
  ['I 2021', 16807.1, 1871.9], ['II 2021', 16859.5, 2068.9], ['III 2021', 17216.5, 2164.4], ['IV 2021', 17734.6, 1623.9],
  ['I 2022', 17955.8, 1899.7], ['II 2022', 17900.7, 2159.9], ['III 2022', 19001.1, 2188.3], ['IV 2022', 19478.8, 2003.7],
  ['I 2023', 20072.7, 2253.8], ['II 2023', 20804.8, 2568.6], ['III 2023', 21278.1, 2442.0], ['IV 2023', 21661.2, 2477.4],
  ['I 2024', 22267.0, 2513.5], ['II 2024', 22826.0, 2892.1], ['III 2024', 23832.5, 3065.1], ['IV 2024', 24272.4, 3124.4],
  ['I 2025', 25461.0, 3527.3], ['II 2025', 26079.9, 3794.8], ['III 2025', 27697.2, 4249.8], ['IV 2025', 28511.2, 4248.8],
  ['I 2026', 30398.9, 4994.7], ['II 2026', 32771.5, 5782.8],
];

/**
 * Szpitale spoza SPZOZ — spółki prawa handlowego i instytuty badawcze. MZ podało ich dług raz,
 * za koniec 2025 r. (razem z SPZOZ-ami: 562 szpitale, 34 mld zł). Model zakłada, że rośnie
 * w tym samym tempie co dług SPZOZ.
 */
export const OTHER_HOSPITALS = {
  quarter: 'IV 2025',
  /** mln zł */
  companies: 4100,
  institutes: 2900,
  /** całe zestawienie MZ: liczba szpitali i ich dług (mln zł), w tym szpitale-SPZOZ */
  hospitals: 562,
  hospitalsTotal: 34000,
  hospitalsSpzoz: 27000,
} as const;

/** Liczba ludności (GUS, dane wstępne) — do przeliczenia „na mieszkańca”. */
export const POPULATION = { value: 37_243_000, date: '30.06.2026' } as const;

/** Szereg z udziałem spółek i instytutów, tempa wzrostu i parametry licznika. */
export const DEBT = buildDebt({ quarters: SPZOZ_QUARTERS, others: OTHER_HOSPITALS, population: POPULATION.value });

/* ---------- Województwa ---------- */

export const REGIONS_DATE = '30.06.2026';

/**
 * Zobowiązania SPZOZ według województw (podmiot tworzący w danym województwie) i resortów, mln zł:
 * koniec 2024 r., koniec 2025 r., 30.06.2026 — ogółem; 30.06.2026 — wymagalne.
 */
export const REGIONS: { name: string; y2024: number; y2025: number; now: number; overdue: number }[] = [
  { name: 'Dolnośląskie', y2024: 1540.5, y2025: 1842.6, now: 2126.8, overdue: 235.9 },
  { name: 'Kujawsko-pomorskie', y2024: 1737.3, y2025: 2032.3, now: 2332.4, overdue: 614.9 },
  { name: 'Lubelskie', y2024: 2560.9, y2025: 2951.4, now: 3249.9, overdue: 587.8 },
  { name: 'Lubuskie', y2024: 128.1, y2025: 139.0, now: 136.6, overdue: 0 },
  { name: 'Łódzkie', y2024: 1649.9, y2025: 2267.4, now: 2666.5, overdue: 624.4 },
  { name: 'Małopolskie', y2024: 1753.7, y2025: 2016.7, now: 2152.1, overdue: 190.3 },
  { name: 'Mazowieckie', y2024: 3640.9, y2025: 4197.4, now: 4870.9, overdue: 1278.8 },
  { name: 'Opolskie', y2024: 348.0, y2025: 428.1, now: 501.4, overdue: 29.2 },
  { name: 'Podkarpackie', y2024: 1907.3, y2025: 2203.9, now: 2512.3, overdue: 414.3 },
  { name: 'Podlaskie', y2024: 902.0, y2025: 1058.6, now: 1250.6, overdue: 177.3 },
  { name: 'Pomorskie', y2024: 507.6, y2025: 569.4, now: 610.3, overdue: 15.3 },
  { name: 'Śląskie', y2024: 2908.1, y2025: 3280.7, now: 3703.1, overdue: 781.6 },
  { name: 'Świętokrzyskie', y2024: 868.2, y2025: 942.6, now: 1078.0, overdue: 168.5 },
  { name: 'Warmińsko-mazurskie', y2024: 629.1, y2025: 778.1, now: 849.6, overdue: 91.0 },
  { name: 'Wielkopolskie', y2024: 1566.1, y2025: 1761.1, now: 2035.3, overdue: 115.7 },
  { name: 'Zachodniopomorskie', y2024: 732.1, y2025: 846.1, now: 1083.6, overdue: 150.3 },
  { name: 'Szpitale MON', y2024: 482.6, y2025: 688.6, now: 930.7, overdue: 180.3 },
  { name: 'Szpitale MSWiA', y2024: 410.1, y2025: 507.4, now: 681.5, overdue: 127.1 },
];

/* ---------- Ranking strat netto ---------- */

export interface LossRow {
  name: string;
  city: string;
  /** strata netto za 2024 r., zł (wstępne dane MZ) */
  loss: number;
  /** dopowiedzenie pod wierszem i jego źródła (albo zestawienie w serwisie) */
  note?: string;
  links?: { label: string; href: string }[];
}

/** Dziesięć szpitali z największą stratą netto za 2024 r. — „Lista wstydu”, Menedżer Zdrowia (dane MZ). */
export const LOSSES: LossRow[] = [
  { name: 'Wojewódzki Szpital Specjalistyczny im. M. Pirogowa', city: 'Łódź', loss: 88_013_861 },
  { name: 'Wojewódzki Szpital Specjalistyczny im. kard. S. Wyszyńskiego', city: 'Lublin', loss: 79_949_350 },
  {
    name: 'Wojewódzki Szpital Specjalistyczny im. NMP',
    city: 'Częstochowa',
    loss: 54_576_624,
    note: 'Jeden z nielicznych szpitali, których dług jest jawny — ujawnił go organ prowadzący, marszałek województwa śląskiego: 172 mln zł zobowiązań przeterminowanych na koniec 2025 r. (175 mln zł w marcu 2026 r.) i ok. 289 mln zł ogółem. Strata za 2025 r. urosła do ok. 85 mln zł, a sama obsługa długu kosztowała 43 mln zł.',
    links: [
      { label: 'Dziennik.pl', href: 'https://zdrowie.dziennik.pl/aktualnosci/artykuly/599197,parkitka-szpital-czestochowa-lekarze-dyzury.html' },
      { label: 'Życie Częstochowy', href: LINKS.czestochowa },
      { label: 'interpelacja poselska (X)', href: 'https://x.com/JerzyPolaczek/status/2074742367060394337' },
    ],
  },
  {
    name: 'Szpital Wojewódzki im. Jana Pawła II',
    city: 'Bełchatów',
    loss: 51_320_479,
    note: 'W tym szpitalu urolog na kontrakcie dostaje ponad 151 tys. zł miesięcznie.',
    links: [{ label: 'Rekordowe stawki', href: '/dane/rekordy/' }],
  },
  { name: 'Wojewódzki Szpital Zespolony im. J. Śniadeckiego', city: 'Białystok', loss: 47_555_530 },
  { name: 'Wojewódzki Szpital Zespolony', city: 'Płock', loss: 45_119_750 },
  { name: 'Wojewódzki Szpital Specjalistyczny im. M. Skłodowskiej-Curie', city: 'Zgierz', loss: 43_297_412 },
  { name: 'Samodzielny Publiczny Zespół Opieki Zdrowotnej', city: 'Sanok', loss: 39_857_634 },
  { name: 'Szpital Wojewódzki im. Prymasa kard. S. Wyszyńskiego', city: 'Sieradz', loss: 38_206_531 },
  { name: 'Radomski Szpital Specjalistyczny im. dr. T. Chałubińskiego', city: 'Radom', loss: 37_659_046 },
];

/** Przypadek odwrotny pod rankingiem: zysk na papierze, zaległości wobec personelu. */
export const KALISZ = {
  name: 'Wojewódzki Szpital Zespolony im. L. Perzyny',
  city: 'Kalisz',
  /** zysk netto za 2024 r., zł (sprawozdanie w KRS) */
  profit: 2_200_000,
  /** zaległe wynagrodzenia personelu, zł */
  arrears: 37_000_000,
} as const;
