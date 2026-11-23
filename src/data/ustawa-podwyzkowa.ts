/**
 * Dane do /mechanizmy/ustawa-podwyzkowa/: oś zdarzeń i głosowania nad ustawą z 8 czerwca 2017 r.
 * o najniższym wynagrodzeniu zasadniczym w podmiotach leczniczych i jej nowelizacją z 2022 r.
 * Źródła: API Sejmu (procesy, głosowania z podziałem na kluby), strony głosowań Senatu, druki 1583, 1648, 2268, 2343, 33.
 * Te same fakty są w konstelacji (research/powiazania, widok „podwyzki”).
 */
import type { ChronoEvent } from '@/data/kanada-lekarze-ustawa-specjalna';
import type { CompareMore, CompareTable } from '@/types';

const sejmVote = (term: 8 | 9, sitting: number, nr: number) =>
  `https://www.sejm.gov.pl/Sejm${term}.nsf/agent.xsp?symbol=glosowania&NrKadencji=${term}&NrPosiedzenia=${sitting}&NrGlosowania=${nr}`;
const senatVote = (przebieg: number, nr: number, kadencja: 9 | 10) =>
  `https://www.senat.gov.pl/sklad/senatorowie/szczegoly-glosowania,${przebieg},${nr},${kadencja}.html`;

export const LINKS = {
  druk1648: 'https://api.sejm.gov.pl/sejm/term8/prints/1648/1648.pdf',
  druk1583: 'https://api.sejm.gov.pl/sejm/term8/prints/1583/1583.pdf',
  proces1583: 'https://www.sejm.gov.pl/Sejm8.nsf/PrzebiegProc.xsp?nr=1583',
  proces1648: 'https://www.sejm.gov.pl/Sejm8.nsf/PrzebiegProc.xsp?nr=1648',
  druk2268: 'https://api.sejm.gov.pl/sejm/term9/prints/2268/2268.pdf',
  proces2268: 'https://www.sejm.gov.pl/Sejm9.nsf/PrzebiegProc.xsp?nr=2268',
  druk2343: 'https://api.sejm.gov.pl/sejm/term9/prints/2343/2343.pdf',
  druk33: 'https://api.sejm.gov.pl/sejm/term10/prints/33/33.pdf',
  druk763: 'https://api.sejm.gov.pl/sejm/term9/prints/763/763.pdf',
  proces763: 'https://www.sejm.gov.pl/Sejm9.nsf/PrzebiegProc.xsp?nr=763',
  druk1202: 'https://api.sejm.gov.pl/sejm/term9/prints/1202/1202.pdf',
  du2020: 'https://api.sejm.gov.pl/eli/acts/DU/2020/2401/text.pdf',
  stanowiskoTzOz: 'https://termedia.pl/pobierz/27820b56a6018d384a90ea22f0250a3c',
  senat2017: 'https://www.senat.gov.pl/prace/posiedzenia/tematy,489,1.html',
  senat2021: 'https://www.senat.gov.pl/prace/posiedzenia/tematy,558,1.html',
  senat2022: 'https://www.senat.gov.pl/prace/posiedzenia/tematy,578,1.html',
  glos2017: sejmVote(8, 43, 66),
  glos2017komisja: sejmVote(8, 43, 10),
  glos1648: sejmVote(8, 46, 100),
  glos2021: sejmVote(9, 30, 158),
  glos763: sejmVote(9, 21, 181),
  glos763senat: sejmVote(9, 24, 72),
  glos2022: sejmVote(9, 55, 54),
  glos2022senat: sejmVote(9, 57, 64),
  glos2022aotmit: sejmVote(9, 57, 60),
  senatGlos2017: senatVote(267, 2, 9),
  senatGlos2022wsp: senatVote(482, 42, 10),
  senatGlos2022calosc: senatVote(482, 45, 10),
} as const;

const SEJM = 'Sejm, przebieg procesu';

export const CHRONO: ChronoEvent[] = [
  { date: '2016-12-05', kind: 'obywatele', text: 'Powstaje komitet inicjatywy ustawodawczej projektu „w sprawie warunków zatrudnienia w ochronie zdrowia”.', source: { label: 'Druk 1648', href: LINKS.druk1648 } },
  { date: '2017-05-15', kind: 'obywatele', text: 'Projekt obywatelski wpływa do Sejmu (druk 1648).', source: { label: SEJM, href: LINKS.proces1648 } },
  { date: '2017-05-24', kind: 'rzad', text: 'Rząd wnosi własny projekt (druk 1583).', source: { label: SEJM, href: LINKS.proces1583 } },
  { date: '2017-06-08', kind: 'sejm', text: 'Sejm uchwala ustawę z projektu rządowego: 282 za, 142 przeciw.', source: { label: 'Sejm, głosowanie nr 66', href: LINKS.glos2017 } },
  { date: '2017-06-29', kind: 'senat', text: 'Senat przyjmuje ustawę bez poprawek: 55 za, 26 przeciw.', source: { label: 'Senat, głosowanie nr 2', href: LINKS.senatGlos2017 } },
  { date: '2017-07-20', kind: 'sejm', text: 'Pierwsze czytanie projektu obywatelskiego. Sejm nie zgadza się na niezwłoczne drugie czytanie i kieruje projekt do komisji.', source: { label: 'Sejm, głosowanie nr 100', href: LINKS.glos1648 } },
  { date: '2020-11-27', kind: 'sejm', text: 'Poselska ustawa „covidowa” o kadrach medycznych wprowadza coroczną waloryzację minimów od 2022 r.: 232 za, 216 przeciw. Senat odrzuca ustawę, Sejm 18 grudnia odrzuca uchwałę Senatu.', source: { label: 'Sejm, głosowanie nr 181', href: LINKS.glos763 } },
  { date: '2021-05-28', kind: 'sejm', text: 'Nowelizacja przyspiesza dojście do docelowych płac na 1 lipca 2021 r.: 433 za, 3 przeciw.', source: { label: 'Sejm, głosowanie nr 158', href: LINKS.glos2021 } },
  { date: '2021-06-10', kind: 'senat', text: 'Senat wprowadza 3 poprawki do nowelizacji z 2021 r.; Sejm odrzuca je 15 czerwca.', source: { label: 'Senat, 25. posiedzenie', href: LINKS.senat2021 } },
  { date: '2021-11-05', kind: 'porozumienie', text: 'Trójstronny Zespół ds. Ochrony Zdrowia przyjmuje stanowisko z nowymi współczynnikami od 1 lipca 2022 r.', source: { label: 'Uzasadnienie druku 2268', href: LINKS.druk2268 } },
  { date: '2022-05-17', kind: 'rzad', text: 'Rząd wnosi projekt nowelizacji (druk 2268).', source: { label: SEJM, href: LINKS.proces2268 } },
  { date: '2022-05-26', kind: 'sejm', text: 'Sejm uchwala nowelizację: 445 za, 1 przeciw, 7 wstrzymało się.', source: { label: 'Sejm, głosowanie nr 54', href: LINKS.glos2022 } },
  { date: '2022-06-09', kind: 'senat', text: 'Senat wprowadza 22 poprawki, m.in. podnosi wszystkie współczynniki o 0,25.', source: { label: 'Senat, 44. posiedzenie', href: LINKS.senat2022 } },
  { date: '2022-06-23', kind: 'sejm', text: 'Sejm odrzuca wszystkie poprawki Senatu. Nowe współczynniki obowiązują od 1 lipca 2022 r.', source: { label: 'Sejm, głosowanie nr 64', href: LINKS.glos2022senat } },
  { date: '2023-05-23', kind: 'obywatele', text: 'Wpływa kolejny projekt obywatelski (druk 33): podwyżka po zdobyciu wyższych kwalifikacji w ciągu roku.', source: { label: 'Druk 33', href: LINKS.druk33 } },
];

/** Porównanie dwóch projektów z 2017 r. (druki 1648 i 1583, wersje wniesione do Sejmu). */
export const PROJECTS: CompareTable = {
  columns: ['', 'Projekt obywatelski (druk 1648)', 'Projekt rządowy (druk 1583)'],
  rows: [
    { cells: ['Kogo obejmuje', 'pracowników na etacie oraz na umowach cywilnoprawnych (zlecenie, umowa o dzieło, umowa agencyjna)', 'tylko pracowników na umowę o pracę'] },
    { cells: ['Podstawa wyliczenia', 'przeciętne wynagrodzenie z poprzedniego roku', 'do końca 2019 r. stała kwota 3900 zł (przeciętne wynagrodzenie z 2015 r.), potem przeciętne wynagrodzenie z poprzedniego roku'] },
    { cells: ['Lekarz ze specjalizacją', 'współczynnik 3', 'współczynnik 1,27 (specjalizacja II stopnia lub tytuł specjalisty)'] },
    { cells: ['Lekarz bez specjalizacji', 'współczynnik 2 (także rezydent)', 'współczynnik 1,05'] },
    { cells: ['Pielęgniarka, położna bez specjalizacji', 'współczynnik 1,5', 'współczynnik 0,64'] },
    { cells: ['Kiedy pełna kwota', 'od 1 lipca 2019 r., w trzech rocznych krokach po co najmniej 33,33% różnicy', 'do 31 grudnia 2021 r., w krokach co roku 1 lipca (10%, potem po 20% różnicy)'] },
  ],
};

const more = (rows: string[][], href: string): CompareMore => ({
  label: 'Głosy klubów',
  columns: ['Klub', 'Za', 'Przeciw', 'Wstrz.', 'Nie głos.'],
  rows,
  link: { label: 'Wyniki głosowania', href },
});

/** Głosowania nad ustawą i nowelizacją; kluby z API Sejmu i stron Senatu (stan w dniu głosowania). */
export const VOTES: CompareTable = {
  columns: ['', 'Za / przeciw / wstrz.', 'Wynik'],
  rows: [
    {
      cells: ['Sejm, 8.06.2017 — ponowne skierowanie projektu rządowego do Komisji Zdrowia', '195 / 234 / 3', 'odrzucone'],
      more: more([
        ['PiS', '3', '223', '0', '8'], ['PO', '118', '3', '1', '14'], ['Kukiz’15', '32', '0', '1', '0'], ['Nowoczesna', '24', '0', '0', '3'],
        ['PSL', '12', '1', '0', '3'], ['UED', '4', '0', '0', '0'], ['Republikanie', '0', '3', '0', '0'], ['Wolni i Solidarni', '0', '3', '0', '0'], ['niezrzeszeni', '2', '1', '1', '0'],
      ], LINKS.glos2017komisja),
    },
    {
      cells: ['Sejm, 8.06.2017 — ustawa z projektu rządowego', '282 / 142 / 2', 'uchwalona'], marked: true,
      more: more([
        ['PiS', '227', '1', '0', '6'], ['PO', '18', '99', '0', '19'], ['Kukiz’15', '31', '1', '0', '1'], ['Nowoczesna', '0', '23', '0', '4'],
        ['PSL', '1', '12', '0', '3'], ['UED', '0', '3', '0', '1'], ['Republikanie', '0', '3', '0', '0'], ['Wolni i Solidarni', '3', '0', '0', '0'], ['niezrzeszeni', '2', '0', '2', '0'],
      ], LINKS.glos2017),
    },
    {
      cells: ['Senat, 29.06.2017 — przyjęcie ustawy bez poprawek', '55 / 26 / 0', 'przyjęta'],
      more: more([['PiS', '55', '0', '0', '9'], ['PO', '0', '25', '0', '8'], ['niezrzeszeni', '0', '1', '0', '2']], LINKS.senatGlos2017),
    },
    {
      cells: ['Sejm, 20.07.2017 — niezwłoczne drugie czytanie projektu obywatelskiego', '211 / 234 / 3', 'odrzucone'],
      more: more([
        ['PiS', '0', '231', '0', '3'], ['PO', '135', '0', '0', '1'], ['Kukiz’15', '30', '0', '0', '2'], ['Nowoczesna', '22', '2', '0', '3'],
        ['PSL', '15', '0', '0', '0'], ['UED', '2', '0', '0', '2'], ['Republikanie', '2', '0', '0', '1'], ['Wolni i Solidarni', '0', '0', '3', '0'], ['niezrzeszeni', '5', '1', '0', '0'],
      ], LINKS.glos1648),
    },
    {
      cells: ['Sejm, 26.05.2022 — nowelizacja z projektu rządowego', '445 / 1 / 7', 'uchwalona'], marked: true,
      more: more([
        ['PiS', '225', '0', '0', '3'], ['KO', '124', '1', '0', '1'], ['Lewica', '44', '0', '0', '0'], ['Koalicja Polska', '23', '0', '0', '1'],
        ['Konfederacja', '4', '0', '7', '0'], ['Polska 2050', '8', '0', '0', '0'], ['Porozumienie', '5', '0', '0', '0'], ['Polskie Sprawy', '3', '0', '0', '1'],
        ['Kukiz’15', '3', '0', '0', '1'], ['PPS', '3', '0', '0', '0'], ['niezrzeszeni', '3', '0', '0', '0'],
      ], LINKS.glos2022),
    },
    {
      cells: ['Senat, 9.06.2022 — poprawki podnoszące wszystkie współczynniki o 0,25', '53 / 44 / 0', 'przyjęte'],
      more: more([
        ['PiS', '0', '44', '0', '2'], ['KO', '40', '0', '0', '1'], ['Koalicja Polska – PSL', '4', '0', '0', '0'], ['Koło Senatorów Niezależnych', '3', '0', '0', '0'],
        ['Lewica Demokratyczna', '2', '0', '0', '0'], ['Polska 2050', '1', '0', '0', '0'], ['Porozumienie', '1', '0', '0', '0'], ['niezrzeszeni', '2', '0', '0', '0'],
      ], LINKS.senatGlos2022wsp),
    },
    {
      cells: ['Sejm, 23.06.2022 — odrzucenie tych poprawek (potrzebne 225 głosów)', '234 / 207 / 8', 'poprawki odrzucone'],
      more: more([
        ['PiS', '226', '0', '0', '2'], ['KO', '0', '123', '0', '3'], ['Lewica', '1', '43', '0', '0'], ['Koalicja Polska', '0', '22', '0', '2'],
        ['Konfederacja', '1', '1', '8', '1'], ['Polska 2050', '0', '8', '0', '0'], ['Porozumienie', '0', '5', '0', '0'], ['Kukiz’15', '3', '0', '0', '1'],
        ['PPS', '0', '3', '0', '0'], ['Polskie Sprawy', '1', '0', '0', '2'], ['niezrzeszeni', '2', '2', '0', '0'],
      ], LINKS.glos2022senat),
    },
  ],
};

/**
 * Koszt kolejnych waloryzacji (wzrost wydatków NFZ w ciągu 12 miesięcy od 1 lipca), w mld zł — warianty rekomendacji AOTMiT
 * zatwierdzone przez ministra; obejmują skutki ustawy, a od 2023 r. także inflację i zmiany wybranych wycen.
 * 2026: wariant z inflacją; bez inflacji 7,69 mld zł.
 */
export const RAISES: { year: number; cost: number; note: string; source: { label: string; href: string } }[] = [
  { year: 2022, cost: 18.5, note: 'wariant 2 rekomendacji AOTMiT (ponad 18,5 mld zł w skali roku)', source: { label: 'NFZ, 9.08.2022', href: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/ponad-18-miliardow-zlotych-m-in-na-podwyzki-wynagrodzen-minimalnych-dodatkowo-wzrost-ryczaltu-i-wyzsza-wycena-interny,8247.html' } },
  { year: 2023, cost: 15.5, note: 'wzrost o 12,07%, „ponad 15,5 mld zł”', source: { label: 'Wiceminister zdrowia w podkomisji sejmowej, 11.04.2024', href: 'https://api.sejm.gov.pl/sejm/term10/committees/ZDR01N/sittings/3/html' } },
  { year: 2024, cost: 15.2, note: 'rekomendacja 48/2024: ok. 15,2 mld zł w skali 12 miesięcy (II półrocze: 7 856 969 981,23 zł)', source: { label: 'MZ, odpowiedź na interpelację 6853', href: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDCFJXK/i06853-o1.pdf' } },
  { year: 2025, cost: 16.9, note: 'rekomendacja 72/2025, wariant 3 (+11,17% wartości umów)', source: { label: 'MZ, odpowiedź na interpelację 10388', href: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDJMH6K/i10388-o1.pdf' } },
  { year: 2026, cost: 9.25, note: 'rekomendacja 84/2026 (+5,50% wartości umów; bez inflacji 7,69 mld zł)', source: { label: 'AOTMiT, obwieszczenie z 2.07.2026', href: 'https://bip.aotm.gov.pl/assets/files/zlecenia_mz/2026/116/REK/2025%2007%2002%20Obwieszczenie%20Rekomendacja%2084%202026-sig.pdf' } },
];

/**
 * Skumulowany koszt w roku kalendarzowym: pełne roczne koszty wcześniejszych waloryzacji + połowa tegorocznej
 * (wchodzi 1 lipca). Szacunek redakcji; nie uwzględnia lat 2017–2021 ani wzrostu wcześniejszych podwyżek w kolejnych latach.
 */
export const cumulative = (year: number) =>
  RAISES.filter((r) => r.year < year).reduce((s, r) => s + r.cost, 0) + 0.5 * (RAISES.find((r) => r.year === year)?.cost ?? 0);

/** Liczby oficjalne do porównania z szacunkiem. */
export const OFFICIAL = {
  mz2025: { value: 57.3, total: 133.8, label: 'MZ, prezentacja „Zwiększamy finansowanie podmiotów leczniczych”, czerwiec 2025, s. 13', href: 'https://www.gov.pl/attachment/8cf5ac6c-463c-47fd-b90f-a96433411322' },
  nfz2026: { value: 71, label: 'Wiceprezes NFZ na EKG, 23.04.2026, za: TVN24', href: 'https://tvn24.pl/zdrowie/podwyzki-plac-minimalnych-w-ochronie-zdrowia-ile-beda-kosztowaly-st9013918' },
  nfz2025: { value: 58, label: 'Prezes NFZ, briefing 6.11.2025', href: 'https://www.nfz.gov.pl/aktualnosci/aktualnosci-centrali/prezes-nfz-czy-tempo-wzrostu-wynagrodzen-w-ochronie-zdrowia-jest-adekwatne-do-tempa-wzrostu-dostepnosci-do-leczenia,8849.html' },
} as const;

/** Przeciętne wynagrodzenie w gospodarce narodowej (komunikaty Prezesa GUS w M.P., luty następnego roku), zł. */
export const AVERAGE_WAGE: { year: number; amount: number; mp: string }[] = [
  { year: 2015, amount: 3899.78, mp: '2016/145' }, { year: 2016, amount: 4047.21, mp: '2017/183' },
  { year: 2017, amount: 4271.51, mp: '2018/187' }, { year: 2018, amount: 4585.03, mp: '2019/154' },
  { year: 2019, amount: 4918.17, mp: '2020/174' }, { year: 2020, amount: 5167.47, mp: '2021/137' },
  { year: 2021, amount: 5662.53, mp: '2022/175' }, { year: 2022, amount: 6346.15, mp: '2023/171' },
  { year: 2023, amount: 7155.48, mp: '2024/110' }, { year: 2024, amount: 8181.72, mp: '2025/125' },
  { year: 2025, amount: 8903.56, mp: '2026/192' },
];

/** Średnia i mediana z dwóch badań GUS za październik 2024 r. (zł brutto, pełny etat). */
export const WAGE_OCT_2024 = {
  structure: { mean: 8944.79, median: 7404.69, doctorsMedian: 15451.2, doctorsMean: 17440.1, nursesMedian: 10650.9, label: 'GUS, Struktura wynagrodzeń według zawodów w październiku 2024 r. (podmioty od 10 osób)', href: 'https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/struktura-wynagrodzen-wedlug-zawodow-za-pazdziernik-2024-r-,4,12.html' },
  zus: { mean: 8363.69, median: 6856.75, label: 'GUS, Rozkład wynagrodzeń w gospodarce narodowej w październiku 2024 r. (dane ZUS, wszystkie podmioty)', href: 'https://stat.gov.pl/obszary-tematyczne/rynek-pracy/pracujacy-zatrudnieni-wynagrodzenia-koszty-pracy/rozklad-wynagrodzen-w-gospodarce-narodowej-w-pazdzierniku-2024-r-,32,10.html' },
  annual2024: 8181.72,
} as const;

/**
 * Prognoza redakcji na lata po 2026 r. Pula płac objętych waloryzacją wynika z rekomendacji 84/2026 w wariancie bez inflacji:
 * 7,69 mld zł przy wzroście przeciętnego wynagrodzenia o 8,82% (8903,56 / 8181,72) → ok. 87 mld zł rocznie przed podwyżką,
 * ok. 95 mld zł po niej. Każda kolejna waloryzacja = pula × tempo wzrostu przeciętnego wynagrodzenia; pula rośnie o to samo tempo.
 * Liczymy tylko skutek samej ustawy (bez inflacji i zmian wycen, które dotąd wchodziły do zatwierdzanych wariantów) — dolna granica.
 */
export const LAST_GROWTH = AVERAGE_WAGE[AVERAGE_WAGE.length - 1].amount / AVERAGE_WAGE[AVERAGE_WAGE.length - 2].amount - 1;
export const PAY_POOL_2026 = (7.69 / LAST_GROWTH) * (1 + LAST_GROWTH);

/** Koszty waloryzacji od 2027 r. przy stałym tempie wzrostu przeciętnego wynagrodzenia `g`. */
export const futureRaises = (g: number, until = 2030) => {
  const out: { year: number; cost: number }[] = [];
  let pool = PAY_POOL_2026;
  for (let y = 2027; y <= until; y++) {
    out.push({ year: y, cost: pool * g });
    pool *= 1 + g;
  }
  return out;
};

/** Skumulowany koszt w roku `year` z prognozą: znane waloryzacje 2022–2026 i prognozowane od 2027 r. */
export const projected = (year: number, g: number) => {
  const all = [...RAISES.map((r) => ({ year: r.year, cost: r.cost })), ...futureRaises(g, year)];
  return all.filter((r) => r.year < year).reduce((s, r) => s + r.cost, 0) + 0.5 * (all.find((r) => r.year === year)?.cost ?? 0);
};

/**
 * Wykres tempa płac: najniższa płaca zasadnicza od 1 lipca danego roku (współczynnik × przeciętne wynagrodzenie z roku
 * poprzedniego) dla dwóch grup — od 2021 r., gdy minimum stało się w pełni obowiązkowe. Współczynniki do 30.06.2022 z tabeli
 * w uzasadnieniu druku 2268 (1,31 i 0,73), od 1.07.2022 z załącznika (1,45 i 0,94).
 */
export const MINIMUM_SERIES = {
  specialist: [2021, 2022, 2023, 2024, 2025, 2026].map((y) => ({ year: y, coef: y === 2021 ? 1.31 : 1.45 })),
  nurse: [2021, 2022, 2023, 2024, 2025, 2026].map((y) => ({ year: y, coef: y === 2021 ? 0.73 : 0.94 })),
};
export const baseFor = (year: number) => AVERAGE_WAGE.find((w) => w.year === year - 1)!.amount;
export const minimumIn = (year: number, coef: number) => Math.round(coef * baseFor(year) * 100) / 100;

/** Mediana płac (październik, podmioty od 10 osób) z badań GUS „Struktura wynagrodzeń według zawodów”, co dwa lata. */
export const MEDIAN_OCT: { year: number; median: number; href: string }[] = [
  { year: 2016, median: 3510.67, href: 'https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5474/4/8/1/struktura_wynagrodzen_wedlug_zawodow_w_pazdzierniku_2016.pdf' },
  { year: 2018, median: 4094.98, href: 'https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5474/4/9/1/struktura_wynagrodzen_wedlug_zawodow_w_pazdzierniku_2018.pdf' },
  { year: 2020, median: 4702.66, href: 'https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5474/4/10/1/analiza_statystyczna_struktura_wynagrodzen_wedlug_zawodow_w_pazdzierniku_2020_r.pdf' },
  { year: 2022, median: 5701.62, href: 'https://stat.gov.pl/download/gfx/portalinformacyjny/pl/defaultaktualnosci/5474/4/11/1/analiza_statystyczna_struktura_wynagrodzen_wedlug_zawodow_za_pazdziernik_2022_2.pdf' },
  { year: 2024, median: 7404.69, href: 'https://stat.gov.pl/files/gfx/portalinformacyjny/pl/defaultaktualnosci/5474/4/12/1/analizy_i_raporty_statystycznne_struktura_wynagrodzen_wedlug_zawodow.pdf' },
];

/**
 * Co przewidywały oceny skutków i uzasadnienia — a ile wyszło. Liczby rządowe narastająco, z dokumentów;
 * „ile wyszło” — skumulowany koszt waloryzacji od lipca 2022 r. (szacunek redakcji; MZ: 57,3 mld zł w 2025 r.).
 */
export const FORECASTS: CompareTable = {
  columns: ['', 'Co zapisano w dokumencie', 'Ile wyszło'],
  rows: [
    { cells: ['Ustawa z 2017 r., ocena skutków (druk 1583)', 'skutki narastająco 3,4 mld zł w 2021 r. i 8,8 mld zł w 2022 r.; od 2022 r. płace miały zostać na poziomie z końca 2021 r.', 'od 2022 r. minima rosną co roku — waloryzację dopisano w 2020 r.'] },
    { cells: ['Poselski projekt z 2020 r., który wprowadził coroczną waloryzację (druk 763)', '„nie spowoduje dodatkowych skutków finansowych dla budżetu państwa”; bez słowa o kosztach dla NFZ', 'ok. 9–19 mld zł więcej co roku od lipca 2022 r.'], marked: true },
    { cells: ['Nowelizacja z 2021 r., ocena skutków (druk 1202)', 'koszt dla NFZ narastająco: 7,8 mld zł w 2022 r., 10,0 mld zł w 2023 r., 15,0 mld zł w 2024 r.', '26,3 mld zł w 2023 r., 41,6 mld zł w 2024 r. — licząc tylko waloryzacje od lipca 2022 r.'] },
    { cells: ['Nowelizacja z 2022 r., ocena skutków (druk 2268)', 'ok. 7,2 mld zł w II półroczu 2022 r., w 2023 r. „zbliżony do dwukrotności”; w tabeli skutków na 10 lat — wydatki tylko w pierwszym roku (610 mln zł z budżetu państwa), w latach 1–10 zera', '57,3 mld zł w 2025 r. (MZ), co najmniej 71 mld zł w 2026 r. (NFZ)'], marked: true },
  ],
};

/** Warianty prognozy: tempo wzrostu przeciętnego wynagrodzenia w gospodarce. */
export const SCENARIOS = [0.03, 0.05] as const;
