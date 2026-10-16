/**
 * Zestawienie /dane/rozklad-wynagrodzen/: liczby do wykresu median, tabeli minimów na etacie
 * i bloków liczb. Tekst i przypisy są w content/articles/rozklad-wynagrodzen.mdx.
 *
 * Dwa rodzaje danych:
 * 1. Zestawienie AOTMiT z lutego 2026 r. — materiał roboczy dla Trójstronnego Zespołu do spraw Ochrony
 *    Zdrowia, znany z prasy (Rzeczpospolita 20.05 i 27.05.2026, PAP, wywiad z prezesem agencji w Rynku
 *    Zdrowia 17.06.2026). Liczby są stałe. Gdy agencja poda nowsze, podmień je tutaj, a w artykule popraw
 *    frontmatter (`stat`, `summary`, `keyPoints`) i daty w tekście.
 *    Jednostka AOTMiT to wypłata w obrębie jednej placówki: lekarz z trzech szpitali to trzy wpisy.
 *    Rezydent ma w źródle ŚREDNIĄ, nie medianę — dlatego nie stoi na wykresie median.
 * 2. Ustawowe minimum na etacie: liczy je personel-medyczny.ts z kwoty bazowej (zmiana co roku 1 lipca).
 *    Stawki godzinowe i dyżurowe przeliczą się same; ręcznie trzeba poprawić tylko `keyPoints`.
 */
import { PAY_SCALE, minimum } from '@/data/personel-medyczny';
import { formatPL } from '@/lib/format';
import type { BarRow, CompareTable } from '@/types';

/** Adresy przy liczbach w blokach (Figure, StatRow); pełna lista publikacji jest w przypisach artykułu. */
export const LINKS = {
  /** Rzeczpospolita 27.05.2026: mediany według formy, przedziały, ponad 100 tys. zł, udział umów, 5–10% */
  aotmit: 'https://www.rp.pl/ochrona-zdrowia/art44466691-625-lekarzy-w-polsce-zarabia-powyzej-100-tys-zl-dotarlismy-do-wyliczen',
  /** Wywiad z prezesem AOTMiT (Rynek Zdrowia, 17.06.2026) — pierwotne źródło „ok. 560 osób” i „5–10%” */
  wywiad: 'https://www.rynekzdrowia.pl/Polityka-zdrowotna/Szef-rzadowej-agencji-po-aferze-Kacprzyka-wynaturzenia-musimy-sie-zabezpieczyc,285516,14.html',
  /** Rynek Zdrowia 31.08.2026: szacunek prezesa AOTMiT przeliczony na liczbę osób (7–14 tys.) */
  milion: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Kontrakty-roczne-na-milion-zlotych-dla-lekarza-Sprawdzilismy-centralny-rejestr,288374,1.html',
  /** Wsparcie dla Szpitala: stawka godzinowa i dyżurowa z minimum, widełki kontraktów, przykład faktury */
  dyzury: 'https://wsparciedlaszpitala.pl/personel-medyczny/dyzur-lekarski-szpital-stawki-opt-out-czas-pracy/',
} as const;

/* ---------- AOTMiT, luty 2026 ---------- */

/** Mediany miesięcznego wynagrodzenia brutto z jednej umowy w jednym szpitalu (Rzeczpospolita, 27.05.2026). */
export const MEDIANS = {
  specKontrakt: 25_595,
  specEtat: 23_666,
  specZlecenie: 16_940,
  bezEtat: 20_733,
  bezKontrakt: 18_070,
  bezZlecenie: 17_939,
} as const;

/** O ile procent mediana kontraktu specjalisty przewyższa medianę etatu (≈ 8%). */
export const KONTRAKT_PREMIUM = Math.round((MEDIANS.specKontrakt / MEDIANS.specEtat - 1) * 100);

const MEDIAN_ROWS: { label: string; value: number; highlight?: boolean }[] = [
  { label: 'Specjalista na kontrakcie', value: MEDIANS.specKontrakt, highlight: true },
  { label: 'Specjalista na etacie', value: MEDIANS.specEtat },
  { label: 'Bez specjalizacji, na etacie', value: MEDIANS.bezEtat },
  { label: 'Bez specjalizacji, na kontrakcie', value: MEDIANS.bezKontrakt },
  { label: 'Bez specjalizacji, na zleceniu lub umowie o dzieło', value: MEDIANS.bezZlecenie },
  { label: 'Specjalista na zleceniu lub umowie o dzieło', value: MEDIANS.specZlecenie },
];

/** Wiersze wykresu median — od najwyższej. */
export const medianRows: BarRow[] = MEDIAN_ROWS.map((r) => ({
  label: r.label,
  value: r.value,
  display: `${formatPL(r.value)} zł`,
  highlight: r.highlight,
}));

/** Pełna szerokość słupka wykresu median. */
export const MEDIAN_MAX = 30_000;

export const medianCaption = `Mediany miesięcznego wynagrodzenia brutto lekarzy z jednej umowy w szpitalu, luty 2026 r.: ${MEDIAN_ROWS.map(
  (r) => `${r.label.toLowerCase()} — ${formatPL(r.value)} zł`,
).join(', ')}.`;

/** Specjaliści na etacie: średnia (z dyżurami i dodatkami stażowymi) i kwartyle (Rzeczpospolita, 20.05.2026). */
export const ETAT_SPEC = {
  average: 24_044.76,
  /** średnia najsłabiej opłacanej ćwiartki */
  bottomQuartileAvg: 15_759.32,
  /** próg najlepiej opłacanej ćwiartki („powyżej”) */
  topQuartileFrom: 29_030.77,
} as const;

/** Najliczniejsze przedziały płac specjalistów (Rzeczpospolita, 27.05.2026). */
export const BRACKETS = {
  kontrakt: { label: '10–15 tys. zł', n: 10_327, share: 20.6 },
  etat: { label: '15–20 tys. zł', n: 4_842, share: 23.1 },
} as const;

/** Udział form zatrudnienia wśród specjalistów, % (Rzeczpospolita, 27.05.2026). */
export const SHARES = {
  /** kontrakt, zlecenie i dzieło razem */
  civil: 73.16,
  etat: 25,
} as const;

/** Średnia pensja rezydenta, luty 2026 r. — ŚREDNIA, nie mediana (Rzeczpospolita, 20.05.2026). */
export const RESIDENT_AVERAGE = 9_797.14;

/** Wypłaty powyżej 100 tys. zł miesięcznie w jednym szpitalu — liczba umów, nie lekarzy (AOTMiT nie łączy umów jednej osoby). */
export const OVER_100K = {
  threshold: 100_000,
  /** kontrakty specjalistów — liczba umów, nie osób */
  contracts: 625,
  contractsShare: 1.2,
  /** specjaliści na etacie */
  etat: 49,
  etatShare: 0.2,
  /** osoby według prezesa AOTMiT („niewiele ponad 1%”, Rynek Zdrowia 17.06.2026) */
  persons: 560,
} as const;

/**
 * Ponad 100 tys. zł po zsumowaniu wszystkich miejsc pracy: szacunek prezesa AOTMiT (5–10% lekarzy,
 * Rynek Zdrowia 17.06.2026), który Rynek Zdrowia (31.08.2026) przeliczył na osoby przy założeniu
 * 140 tys. aktywnych zawodowo lekarzy. Szacunek, nie pomiar — metody nie przedstawiono.
 */
const SUMMED_SHARE = { from: 5, to: 10 } as const;
const ACTIVE_DOCTORS = 140_000;
export const SUMMED = {
  share: SUMMED_SHARE,
  activeDoctors: ACTIVE_DOCTORS,
  persons: { from: (ACTIVE_DOCTORS * SUMMED_SHARE.from) / 100, to: (ACTIVE_DOCTORS * SUMMED_SHARE.to) / 100 },
} as const;

/**
 * Centralny Rejestr Umów JSFP (umowy od 1.07.2026) według Rynku Zdrowia, stan na 31.08.2026: umowy na udzielanie
 * świadczeń zdrowotnych powyżej 1 mln zł. To wartości umów (kwoty maksymalne), nie wypłaty; część umów jest ze spółkami.
 */
export const CRU = {
  over1m: 54,
  /** z tego trzyletnie powyżej 3 mln zł, czyli ponad 1 mln zł rocznie */
  threeYearOver3m: 10,
} as const;

/** Ta sama granica 100 tys. zł, różne jednostki liczenia: umowa, osoba w jednej placówce, osoba po zsumowaniu. */
export const over100kTable: CompareTable = {
  columns: ['Co jest liczone', 'Ile', 'Rodzaj liczby'],
  rows: [
    {
      cells: [
        'Kontrakty specjalistów na ponad 100 tys. zł miesięcznie w jednym szpitalu',
        `${formatPL(OVER_100K.contracts)}, czyli ${formatPL(OVER_100K.contractsShare, 1)}% kontraktów`,
        'pomiar AOTMiT, luty 2026 r.; jednostką jest umowa',
      ],
    },
    {
      cells: [
        'Specjaliści na etacie z płacą ponad 100 tys. zł w jednym szpitalu',
        `${formatPL(OVER_100K.etat)}, czyli ${formatPL(OVER_100K.etatShare, 1)}% etatów`,
        'pomiar AOTMiT, luty 2026 r.; jednostką jest umowa',
      ],
    },
    {
      cells: [
        'Lekarze z ponad 100 tys. zł w jednej placówce',
        `ok. ${formatPL(OVER_100K.persons)}, niewiele ponad 1% lekarzy`,
        'dane AOTMiT według prezesa agencji',
      ],
    },
    {
      cells: [
        'Lekarze z ponad 100 tys. zł po zsumowaniu wszystkich miejsc pracy',
        `${SUMMED.share.from}–${SUMMED.share.to}% lekarzy, czyli ${formatPL(SUMMED.persons.from / 1000)}–${formatPL(SUMMED.persons.to / 1000)} tys. osób`,
        'szacunek prezesa AOTMiT; liczbę osób wyliczył Rynek Zdrowia',
      ],
      marked: true,
    },
  ],
};

/* ---------- Ustawowe minimum na etacie ---------- */

/** Norma czasu pracy w podmiocie leczniczym: 7 h 35 min na dobę (art. 93 ustawy o działalności leczniczej). */
const DAY_HOURS = 7 + 35 / 60;
/** Miesiąc z 22 dniami roboczymi, jak w wyliczeniu Wsparcia dla Szpitala: 166,8 h. */
export const MONTH_HOURS = 22 * DAY_HOURS;

/**
 * Minimum miesięczne (współczynnik grupy z ustawy × kwota bazowa), godzina i godzina dyżuru.
 * Dyżur medyczny opłaca się jak nadgodziny (art. 95 ust. 5 ustawy o działalności leczniczej
 * w zw. z art. 151¹ Kodeksu pracy): dodatek 50% w dzień powszedni, 100% w nocy, w niedziele i święta.
 * Bez dodatku stażowego i innych dodatków.
 */
function floorFor(title: string, group: number) {
  const scale = PAY_SCALE.find((g) => g.group === group);
  if (!scale) throw new Error(`rozklad-wynagrodzen: brak grupy ${group} w PAY_SCALE (personel-medyczny.ts)`);
  const monthly = minimum(scale.coef);
  const hourly = monthly / MONTH_HOURS;
  return { title, coef: scale.coef, monthly, hourly, dutyDay: hourly * 1.5, dutyNight: hourly * 2 };
}

/** Grupy 1, 3 i 4 siatki z ustawy z 8 czerwca 2017 r. */
export const SPECIALIST_FLOOR = floorFor('Lekarz specjalista', 1);
export const NON_SPECIALIST_FLOOR = floorFor('Lekarz bez specjalizacji', 3);
export const INTERN_FLOOR = floorFor('Lekarz stażysta', 4);
export const FLOOR = [SPECIALIST_FLOOR, NON_SPECIALIST_FLOOR, INTERN_FLOOR];

export const floorTable: CompareTable = {
  columns: ['', 'Minimum miesięcznie', 'Za godzinę', 'Godzina dyżuru w dzień powszedni', 'Godzina dyżuru w nocy, niedzielę lub święto'],
  rows: FLOOR.map((f) => ({
    cells: [f.title, `${formatPL(f.monthly, 2)} zł`, `ok. ${formatPL(f.hourly)} zł`, `ok. ${formatPL(f.dutyDay)} zł`, `ok. ${formatPL(f.dutyNight)} zł`],
  })),
};

/* ---------- Kontrakty: widełki z rynku ---------- */

/** Stawki kontraktów specjalistów w szpitalach, zł/h (Wsparcie dla Szpitala, stan na wrzesień 2026). */
export const B2B = {
  mid: { from: 180, to: 220 },
  big: { from: 210, to: 280 },
  /** SOR i intensywna terapia */
  max: 300,
} as const;

/** Widełki kontraktu jako wielokrotność minimalnej godziny specjalisty na etacie (≈ 2,3–3,9). */
export const B2B_RATIO = {
  from: B2B.mid.from / SPECIALIST_FLOOR.hourly,
  to: B2B.max / SPECIALIST_FLOOR.hourly,
};

/** Model „jedna osoba, kilka rozliczeń”: ile daje 100 godzin kontraktu przy dolnej i górnej stawce. */
export const PER_100H = { from: B2B.mid.from * 100, to: B2B.max * 100 } as const;

/** Anonimowy przykład ze źródła: anestezjolog na kontrakcie w szpitalu wojewódzkim. */
export const INVOICE_EXAMPLE = { hours: 220, dutyHours: 100, amount: 48_400 } as const;
