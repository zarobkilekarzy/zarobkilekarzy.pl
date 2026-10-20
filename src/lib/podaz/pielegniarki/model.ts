/**
 * Model podaży pielęgniarek dla /analizy/symulator-podazy-pielegniarek/.
 *
 * Jedno źródło rachunku: importuje go strona (pierwszy render, liczby w tekście)
 * i skrypt w przeglądarce (przeliczenie po każdym ruchu suwaka). Zasady jak
 * w symulatorze lekarzy (lib/podaz/model): zgony według tablic GUS, po wybranym
 * wieku rocznik wygasa przez pięć lat, grupa 71+ ze startu ubywa tylko przez zgony.
 *
 * Różnice wobec lekarzy:
 * - liczymy pielęgniarki ZATRUDNIONE (CRPiP), nie zarejestrowane — w rejestrze jest
 *   ok. 90 tys. osób, które w zawodzie nie pracują;
 * - na pielęgniarstwo nie ma krajowego limitu miejsc, więc dźwignią jest liczba osób,
 *   które co roku uzyskują prawo wykonywania zawodu (seria NIPiP), a nie nabór;
 * - ostatni rozkład wieku zatrudnionych jest z kwietnia 2022 r., więc drabinę na start
 *   (koniec 2025 r.) model sam przesuwa o cztery lata z rzeczywistym dopływem —
 *   i ten sam rachunek sprawdza się wstecz na liczbie zatrudnionych 2022–2025.
 *
 * ZASADA NACZELNA: przy ustawieniach domyślnych rok 2025 równa się co do osoby
 * liczbie zatrudnionych pielęgniarek z CRPiP. Wiarygodne są RÓŻNICE między
 * scenariuszami, a nie poziomy bezwzględne.
 */
import { formatPL, plural } from '@/lib/format';

/** Stan startowy = zatrudnione pielęgniarki na koniec roku (punkt `rok` = stan na 31 grudnia). */
export const YEAR0 = 2025;
/** Koniec horyzontu — tak daleko sięga prognoza ludności GUS. */
export const YEAR_END = 2060;
/** Pierwszy rok serii NIPiP o nowych prawach wykonywania zawodu (na wykresie jako historia). */
export const YEAR_MIN = 2013;
/** Ostatni rok, dla którego ustawia się dopływ. */
export const YEAR_MAX = YEAR_END;
export const YEARS = YEAR_MAX - YEAR_MIN + 1;
/** Studia I stopnia trwają 3 lata: kto zacznie w 2026/27, dostanie prawo wykonywania zawodu w 2029 r. */
export const STUDY_YEARS = 3;
/** Pierwszy rok, który zmieniają suwak i gotowe scenariusze; lata 2026–2028 to dzisiejsi studenci. */
export const FIRST_POLICY = YEAR0 + 1 + STUDY_YEARS;
/** Wiek, w którym nowa pielęgniarka pojawia się w modelu (prawo wykonywania zawodu po licencjacie). */
const ENTRY_AGE = 23;

/** NIPiP, „Liczba pielęgniarek i położnych zarejestrowanych i zatrudnionych” (aktualizacja 14.01.2026). */
export const CRPIP_URL = 'https://nipip.pl/liczba-pielegniarek-poloznych-zarejestrowanych-zatrudnionych/';
/** NIPiP, „Liczba osób, które uzyskały prawo wykonywania zawodu”. */
export const RIGHTS_URL = 'https://nipip.pl/liczba-osob-ktore-uzyskaly-prawo-wykonywania-zawodu/';
/** NIPiP, raport „Pielęgniarka, położna — zawody deficytowe…”, kwiecień 2022 (struktura wieku zatrudnionych). */
export const PYRAMID_URL = 'https://nipip.pl/wp-content/uploads/2022/06/2022_Raport-NIPiP-struktura-wiekowa-kadr.pdf';

export const START_DATE = '31.12.2025';
/** Zatrudnione pielęgniarki w CRPiP na 31 grudnia. */
export const EMPLOYED: Readonly<Record<number, number>> = {
  2012: 209272, 2013: 216851, 2014: 218783, 2015: 221172, 2016: 221911, 2017: 225468, 2018: 228250,
  2019: 229974, 2020: 231612, 2021: 234117, 2022: 236414, 2023: 239257, 2024: 242509, 2025: 243596,
};
export const EMPLOYED_TOTAL = EMPLOYED[YEAR0];
/** Pielęgniarki w rejestrze (kobiety + mężczyźni), 31.12.2025 — do porównania z zatrudnionymi. */
export const REGISTERED_TOTAL = 321832 + 11504;

/** Nowe prawa wykonywania zawodu pielęgniarki w roku (NIPiP; z cudzoziemcami). */
export const RIGHTS: Readonly<Record<number, number>> = {
  2013: 2919, 2014: 3443, 2015: 3745, 2016: 3976, 2017: 4197, 2018: 4618, 2019: 5142,
  2020: 4777, 2021: 6004, 2022: 6782, 2023: 7374, 2024: 8734, 2025: 9153,
};
/** Dopływ dziś — „bez zmian” trzyma go co roku do końca horyzontu. */
export const RIGHTS_TODAY = RIGHTS[YEAR0];
/** Średnia z lat 2019–2021 — zamrożony dopływ, na którym NIPiP oparł prognozę z 2022 r. */
export const NIPIP_FROZEN = 6205;
/** Górna granica osi dopływu i suwaka. */
export const RIGHTS_MAX = 24000;
/** Skok wartości przy przeciąganiu i suwaku. */
export const RIGHTS_STEP = 100;

/** Zatrudnione pielęgniarki według wieku — CRPiP, stan na 30.04.2022 (ostatni opublikowany rozkład).
 *  Grupa „pow. 70” — model rozkłada ją do 85. roku życia. */
export const PYRAMID_DATE = '30.04.2022';
const PYRAMID: ReadonlyArray<{ from: number; to: number; n: number }> = [
  { from: 21, to: 30, n: 13020 },
  { from: 31, to: 40, n: 18988 },
  { from: 41, to: 50, n: 49308 },
  { from: 51, to: 60, n: 84444 },
  { from: 61, to: 70, n: 57037 },
  { from: 71, to: 85, n: 11868 },
];
/** Rok, na którego koniec model przypina drabinę z kwietnia 2022 r. (skalując ją do zatrudnionych na 31.12.2021). */
const PYRAMID_YEAR = 2021;

/** Grupy wieku drabiny w wyniku — te same co w raportach NIPiP, od najmłodszej. */
export const LADDER: ReadonlyArray<{ label: string; from: number; to: number }> = [
  { label: '21–30', from: 0, to: 30 },
  { label: '31–40', from: 31, to: 40 },
  { label: '41–50', from: 41, to: 50 },
  { label: '51–60', from: 51, to: 60 },
  { label: '61–70', from: 61, to: 70 },
  { label: '71+', from: 71, to: 200 },
];

// Zgony na 1000 osób rocznie (do wieku `to` włącznie) — GUS, „Trwanie życia w 2025 r.”, tablica A:
// prawdopodobieństwo zgonu qx, średnia z roczników grupy, ważona płcią pielęgniarek w rejestrze
// (3,5% mężczyzn). Po 100. roku życia nikogo w modelu nie ma.
const DEATHS: ReadonlyArray<{ to: number; perMille: number }> = [
  { to: 25, perMille: 0.27 }, { to: 30, perMille: 0.35 }, { to: 35, perMille: 0.54 }, { to: 40, perMille: 0.78 },
  { to: 45, perMille: 1.1 }, { to: 50, perMille: 1.74 }, { to: 55, perMille: 2.84 }, { to: 60, perMille: 4.7 },
  { to: 65, perMille: 7.87 }, { to: 70, perMille: 12.84 }, { to: 75, perMille: 20.73 }, { to: 80, perMille: 34.87 },
  { to: 85, perMille: 62.15 }, { to: 90, perMille: 113.18 }, { to: 95, perMille: 186.38 }, { to: 100, perMille: 276.75 },
];
const MAX_AGE = 100;
/** Udział dożywających: ALIVE[wiek] / ALIVE[wiek startu] (jak lx w tablicy trwania życia). */
const ALIVE: readonly number[] = (() => {
  const out = [1];
  for (let age = 1; age <= MAX_AGE + 1; age++) {
    const rate = (DEATHS.find((d) => age - 1 <= d.to)?.perMille ?? 0) / 1000;
    out.push(age - 1 < 21 ? 1 : out[age - 1] * (1 - rate));
  }
  return out;
})();
/** Jaka część osób w wieku `from` dożywa wieku `to`. */
const survival = (from: number, to: number) => (to > MAX_AGE ? 0 : ALIVE[to] / ALIVE[from]);

// Ludność rezydująca Polski (mln) — GUS, „Prognoza ludności rezydującej dla Polski na lata 2023–2060”,
// tablica 1. Co pięć lat; lata pośrednie interpolowane liniowo.
export const POPULATION_URL = 'https://stat.gov.pl/files/gfx/portalinformacyjny/pl/defaultaktualnosci/5469/12/1/1/prognoza_ludnosci_rezydujacej_dla_polski_na_lata_2023-2060.pdf';
const POPULATION: Readonly<Record<number, number>> = {
  2025: 37.4, 2030: 36.6, 2035: 35.9, 2040: 35.3, 2045: 34.7, 2050: 34.2, 2055: 33.6, 2060: 32.9,
};
/** Ludność w mln w roku `year` (2025–2060). */
export function population(year: number): number {
  const y0 = Math.floor((year - YEAR0) / 5) * 5 + YEAR0;
  if (y0 >= YEAR_END) return POPULATION[YEAR_END];
  return POPULATION[y0] + ((POPULATION[y0 + 5] - POPULATION[y0]) * (year - y0)) / 5;
}
/** Zatrudnione pielęgniarki na 1000 mieszkańców. */
export const perThousand = (nurses: number, year: number) => nurses / (population(year) * 1000);
/** Gęstość dziś — według tej samej definicji (zatrudnione z CRPiP na prognozowaną ludność). */
export const DENSITY_TODAY = perThousand(EMPLOYED_TOTAL, YEAR0);

/** Losy nowej pielęgniarki — dźwignie scenariusza; „bez zmian” trzyma je na wartościach z danych. */
export interface Settings {
  /** Udział osób z nowym prawem wykonywania zawodu, które pracują w zawodzie w Polsce (0–1). */
  entry: number;
  /** Wiek, do którego pielęgniarka pracuje; potem rocznik wygasa przez pięć lat. */
  retireAge: number;
  /** Pielęgniarki z zagranicy zatrudniane co roku ponad to, co już jest w serii NIPiP. */
  inflow: number;
}

export const DEFAULTS: Settings = {
  // Dopasowane: przy wieku odejścia 70 lat ten udział najlepiej odtwarza zatrudnienie 2022–2025
  // (zob. BACKTEST). Bezpośredniego pomiaru nie ma; NIPiP w prognozach zakładał 100%.
  // (55% z analizy /analizy/pielegniarstwo-w-polsce/ to co innego: absolwenci, którzy wystąpili
  // o prawo wykonywania zawodu — etap wcześniej.)
  entry: 0.68,
  retireAge: 70,
  inflow: 0,
};

/** Udział rocznika czynny w danym roku: między wiekiem odejścia R a R+5 wygasa po 1/5 rocznie.
 *  Kto już na starcie był starszy niż R, wygasa licząc od startu, a nie wstecz. */
function active(ageInYear: number, R: number, sinceStart: number): number {
  if (ageInYear <= R) return 1;
  const years = Math.min(ageInYear - R, sinceStart);
  return years >= 5 ? 0 : (5 - years) / 5;
}

/** Drabina z kwietnia 2022 r. rozbita na roczniki: skumulowane liczebności na granicach grup,
 *  monotoniczny splajn (PCHIP), różnice między kolejnymi latami. Sumy grup zostają co do osoby,
 *  a wewnątrz grupy liczebność zmienia się płynnie zamiast skokami co dziesięć lat. */
function smoothPyramid(): Map<number, number> {
  const xs = [PYRAMID[0].from - 1, ...PYRAMID.map((g) => g.to)];
  const ys = [0];
  for (const g of PYRAMID) ys.push(ys[ys.length - 1] + g.n);
  const h = xs.slice(1).map((x, i) => x - xs[i]);
  const d = h.map((w, i) => (ys[i + 1] - ys[i]) / w);
  const m = xs.map((_, i) => {
    if (i === 0 || i === xs.length - 1 || d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  const F = (x: number) => {
    const i = Math.min(xs.length - 2, xs.findIndex((_, k) => x <= xs[k + 1]));
    const t = (x - xs[i]) / h[i];
    return (2 * t ** 3 - 3 * t ** 2 + 1) * ys[i] + (t ** 3 - 2 * t ** 2 + t) * h[i] * m[i]
      + (-2 * t ** 3 + 3 * t ** 2) * ys[i + 1] + (t ** 3 - t ** 2) * h[i] * m[i + 1];
  };
  const out = new Map<number, number>();
  for (let age = xs[0] + 1; age <= xs[xs.length - 1]; age++) out.set(age, F(age) - F(age - 1));
  return out;
}

/** Ludność pielęgniarska w roku `year` liczona od stanu `start` (wiek → liczba) z roku `startYear`.
 *  `rightsAt(rok)` — nowe prawa wykonywania zawodu w tym roku. */
function populationAt(
  start: ReadonlyMap<number, number>, startYear: number, year: number,
  rightsAt: (y: number) => number, s: Settings,
): Map<number, number> {
  const since = year - startYear;
  const out = new Map<number, number>();
  const add = (age: number, n: number) => { if (n > 0) out.set(age, (out.get(age) ?? 0) + n); };

  // 1. Stan startowy. Grupa 71+ już pokazała, że nie kończy pracy w wieku odejścia — ubywa jej
  //    tylko przez zgony (tak samo jak lekarzy po siedemdziesiątce w symulatorze lekarzy).
  for (const [age, n] of start) {
    const now = age + since;
    const a = age > 70 ? 1 : active(now, s.retireAge, since);
    add(now, n * a * survival(age, now));
  }
  // 2. Nowe pielęgniarki z kolejnych lat: prawa wykonywania zawodu × udział pracujących + napływ.
  for (let y = startYear + 1; y <= year; y++) {
    const now = ENTRY_AGE + (year - y);
    const a = active(now, s.retireAge, since);
    add(now, (rightsAt(y) * s.entry + s.inflow) * a * survival(ENTRY_AGE, now));
  }
  return out;
}

const sum = (m: ReadonlyMap<number, number>) => [...m.values()].reduce((a, b) => a + b, 0);

// Drabina startowa: kwiecień 2022 r. przypięty do końca 2021 r., przesunięty o cztery lata
// z rzeczywistym dopływem i ustawieniami domyślnymi, na koniec przeskalowany do zatrudnionych
// na 31.12.2025 — tak, żeby rok startu zgadzał się z CRPiP co do osoby.
const PYRAMID_2021: ReadonlyMap<number, number> = (() => {
  const raw = smoothPyramid();
  const k = EMPLOYED[PYRAMID_YEAR] / sum(raw);
  return new Map([...raw].map(([age, n]) => [age, n * k]));
})();
const rightsHistory = (y: number) => RIGHTS[y] ?? RIGHTS_TODAY;

/** Test wsteczny: zatrudnione w latach 2022–2025 według modelu (od drabiny z 2022 r., przed
 *  przeskalowaniem) i według CRPiP — dla dowolnych losów pielęgniarki. */
export function backtest(s: Settings): Array<{ year: number; model: number; actual: number }> {
  return Array.from({ length: YEAR0 - PYRAMID_YEAR }, (_, i) => {
    const year = PYRAMID_YEAR + 1 + i;
    return { year, model: Math.round(sum(populationAt(PYRAMID_2021, PYRAMID_YEAR, year, rightsHistory, s))), actual: EMPLOYED[year] };
  });
}
/** Największy błąd testu wstecznego (w osobach). */
export const backtestError = (s: Settings) => Math.max(...backtest(s).map((b) => Math.abs(b.model - b.actual)));
export const BACKTEST = backtest(DEFAULTS);

const START: ReadonlyMap<number, number> = (() => {
  const aged = populationAt(PYRAMID_2021, PYRAMID_YEAR, YEAR0, rightsHistory, DEFAULTS);
  const k = EMPLOYED_TOTAL / sum(aged);
  return new Map([...aged].map(([age, n]) => [age, n * k]));
})();

/** Dopływ „bez zmian” rok po roku (indeks `rok - YEAR_MIN`): seria NIPiP, potem co roku dzisiejszy poziom. */
export const BASE_RIGHTS: readonly number[] = Array.from({ length: YEARS }, (_, i) => RIGHTS[YEAR_MIN + i] ?? RIGHTS_TODAY);

export interface Point {
  year: number;
  nurses: number;
  /** Liczba w grupach wieku LADDER (od najmłodszej). */
  ladder: number[];
}

const toLadder = (m: ReadonlyMap<number, number>) => {
  const out = LADDER.map(() => 0);
  for (const [age, n] of m) out[LADDER.findIndex((g) => age <= g.to)] += n;
  return out.map(Math.round);
};

/** Prognoza zatrudnionych pielęgniarek 2025–2060 dla dopływu `rights` (indeks `rok - YEAR_MIN`). */
export function simulate(rights: readonly number[], s: Settings = DEFAULTS): Point[] {
  const at = (y: number) => rights[y - YEAR_MIN] ?? RIGHTS_TODAY;
  const out: Point[] = [];
  for (let year = YEAR0; year <= YEAR_END; year++) {
    const m = populationAt(START, YEAR0, year, at, s);
    out.push({ year, nurses: Math.round(sum(m)), ladder: toLadder(m) });
  }
  return out;
}

/** Ile pielęgniarek w roku `year` daje jedno dodatkowe prawo wykonywania zawodu co roku od FIRST_POLICY.
 *  Model jest liniowy w dopływie; liczone na 1000, żeby zaokrąglenia nie zjadły wyniku. */
export function nursesPerRight(s: Settings, year: number): number {
  const plus = BASE_RIGHTS.map((v, i) => (YEAR_MIN + i >= FIRST_POLICY ? v + 1000 : v));
  const i = year - YEAR0;
  return (simulate(plus, s)[i].nurses - simulate(BASE_RIGHTS, s)[i].nurses) / 1000;
}

export interface Preset {
  id: string;
  label: string;
  desc: string;
  /** Dopływ scenariusza, liczony od dopływu „bez zmian”. */
  rights: () => number[];
  /** Losy pielęgniarki, które scenariusz zmienia (reszta zostaje na wartościach z danych). */
  settings?: Partial<Settings>;
}

/** „9 153 osoby”, „6 205 osób” */
export const people = (n: number) => `${formatPL(n)} ${plural(Math.abs(n), ['osoba', 'osoby', 'osób'])}`;
const fromBase = (from: number, value: (y: number) => number) => () =>
  BASE_RIGHTS.map((v, i) => (YEAR_MIN + i >= from ? value(YEAR_MIN + i) : v));

export const PRESETS: Preset[] = [
  {
    id: 'baza',
    label: 'Bez zmian',
    desc: `Prawdziwy dopływ do ${YEAR0} r., potem co roku dzisiejszy poziom: ${people(RIGHTS_TODAY)} z nowym prawem wykonywania zawodu.`,
    rights: () => [...BASE_RIGHTS],
  },
  {
    id: 'nipip',
    label: 'Dopływ z lat 2019–2021',
    desc: `Od ${YEAR0 + 1} r. co roku ${people(NIPIP_FROZEN)} — średnia z lat 2019–2021. Na takim zamrożonym dopływie NIPiP oparł prognozę niedoboru z 2022 r.`,
    rights: fromBase(YEAR0 + 1, () => NIPIP_FROZEN),
  },
  {
    id: 'podwojenie',
    label: 'Podwojenie dopływu',
    desc: `Od ${FIRST_POLICY} r. — pierwszego roku, w którym dyplomy dostanie nabór przyjęty w ${YEAR0 + 1}/${String(YEAR0 + 2).slice(2)} — co roku ${people(RIGHTS_TODAY * 2)}.`,
    rights: fromBase(FIRST_POLICY, () => RIGHTS_TODAY * 2),
  },
  {
    id: 'do-75',
    label: 'Praca do 75 lat',
    desc: 'Dzisiejszy dopływ, ale pielęgniarki pracują pięć lat dłużej. To cel zachęt dla osób z uprawnieniami emerytalnymi, które rekomenduje NIPiP.',
    rights: () => [...BASE_RIGHTS],
    settings: { retireAge: 75 },
  },
];
