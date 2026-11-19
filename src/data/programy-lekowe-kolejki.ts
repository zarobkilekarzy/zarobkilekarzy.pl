/**
 * Liczby artykułu „Kolejki do programów lekowych” (src/content/articles/programy-lekowe-kolejki.mdx)
 * i jego tłumaczenia (src/content/en/articles/drug-programme-waiting-lists.mdx). Tu tylko liczby i adresy
 * źródeł; napisy są w obu plikach MDX.
 */

export const LINKS = {
  nfzPliki: 'https://gsl.nfz.gov.pl/GSL/GSL/PlikiZDanymi',
  mz19419: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDYSHTJ/i19419-o1.pdf',
  mz19050: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDXWJCG/i19050-o1.pdf',
  api: 'https://api.nfz.gov.pl/app-stat-api-pl/',
  ptr: 'https://ptr.info.pl/wp-content/uploads/2026/10/PTR_Sejm_22.10.2026_Marcin-Stajszczyk_Zespol-Parlamentarny_Reumatologia.pdf',
};

export interface ProgramQueue {
  id: string;
  /** nazwa programu po polsku */
  label: string;
  waiting: number;
  admitted: number;
  /** średni czas oczekiwania w dniach, ważony liczbą przyjętych */
  days: number;
  highlight?: boolean;
}

/**
 * Pliki NFZ „Gdzie się leczyć”, stan na koniec 09.2026 (wygenerowane 15.10.2026), wiersze z kodem świadczenia 90*,
 * bez Wielospecjalistycznego Szpitala Wojewódzkiego w Gorzowie Wlkp. Średni czas ważony liczbą przyjętych.
 */
export const PROGRAMS: ProgramQueue[] = [
  { id: 'siatkowka', label: 'Choroby siatkówki', waiting: 1009, admitted: 1428, days: 16 },
  { id: 'rzs-mizs', label: 'Reumatoidalne i młodzieńcze idiopatyczne zapalenie stawów', waiting: 749, admitted: 152, days: 64, highlight: true },
  { id: 'lipidy', label: 'Zaburzenia lipidowe', waiting: 559, admitted: 211, days: 31 },
  { id: 'wzw-c', label: 'Przewlekłe wirusowe zapalenie wątroby typu C', waiting: 545, admitted: 218, days: 42 },
  { id: 'sm', label: 'Stwardnienie rozsiane', waiting: 466, admitted: 216, days: 50 },
  { id: 'prostata', label: 'Rak gruczołu krokowego', waiting: 439, admitted: 142, days: 57 },
  { id: 'spastycznosc', label: 'Spastyczność kończyn', waiting: 359, admitted: 98, days: 68 },
  { id: 'dystonie', label: 'Dystonie', waiting: 277, admitted: 47, days: 60 },
  { id: 'polipy-nosa', label: 'Polipy nosa', waiting: 267, admitted: 67, days: 54 },
  { id: 'wzw-b', label: 'Przewlekłe wirusowe zapalenie wątroby typu B', waiting: 264, admitted: 82, days: 61 },
];

/** API NFZ, statystyka programów lekowych: rok, refundacja leków w programach (zł), liczba leczonych; pobrane 30.10.2026 */
export const SPENDING: { year: number; refund: number; patients: number }[] = (
  [
    [2017, 3_225_731_401, 114_647], [2018, 3_478_321_951, 127_571], [2019, 3_934_971_176, 146_438],
    [2020, 4_436_372_198, 154_900], [2021, 5_140_241_880, 170_268], [2022, 6_484_738_288, 203_294],
    [2023, 9_034_109_079, 243_930], [2024, 11_561_851_558, 285_795], [2025, 13_954_245_588, 329_248],
  ] as const
).map(([year, refund, patients]) => ({ year, refund, patients }));

/** PTR na podstawie SMPT, stan na 19.10.2026: zakwalifikowani w I–IX 2026, którzy nie dostali pierwszej dawki (%) */
export const RHEUMA: { region: string; share: number }[] = (
  [
    ['dolnośląskie', 57], ['kujawsko-pomorskie', 51], ['wielkopolskie', 44], ['świętokrzyskie', 38],
    ['małopolskie', 32], ['pomorskie', 31], ['lubuskie', 23], ['łódzkie', 16], ['opolskie', 16],
    ['podkarpackie', 12], ['mazowieckie', 11], ['śląskie', 10], ['zachodniopomorskie', 9], ['podlaskie', 7],
    ['warmińsko-mazurskie', 3], ['lubelskie', 1],
  ] as const
).map(([region, share]) => ({ region, share }));

/** średnia krajowa z tego samego materiału PTR (1 166 z 5 027) */
export const RHEUMA_AVERAGE = 23;
