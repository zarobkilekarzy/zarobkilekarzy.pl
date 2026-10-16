/**
 * Model podaży lekarzy dla /analizy/symulator-podazy-lekarzy/.
 *
 * Jedno źródło rachunku: importuje go strona (pierwszy render, liczby w tekście)
 * i skrypt w przeglądarce (przeliczenie po każdym ruchu suwaka), więc liczba
 * w akapicie i na wykresie nie mogą się rozjechać. Port z poprzedniej wersji serwisu
 * (src/lib/symulatorPodazy.ts); od 16.10.2026 skalibrowany do rejestru: zgony według
 * tablic GUS, grupa 71+ ubywa tylko przez zgony, warianty NIL brane dosłownie.
 *
 * ZASADA NACZELNA: przy ustawieniach domyślnych model ODTWARZA rzeczywistość —
 * rok 2026 równa się co do osoby wydrukowi z rejestru NIL. Wszystko, co zmieni
 * użytkownik, jest odchyleniem od tego stanu, więc wartość informacyjną mają
 * RÓŻNICE między scenariuszami, a nie poziomy bezwzględne.
 */
import { formatPL, plural } from '@/lib/format';
import { LIMITS } from '@/data/english-division';

/** Najstarszy rocznik naboru, który da się edytować. */
export const YEAR_MIN = 1987;
/** Ostatni rocznik, dla którego ustawia się nabór. */
export const YEAR_MAX = 2050;
/** Stan startowy = wydruk z rejestru NIL. */
export const YEAR0 = 2026;
/** Koniec horyzontu (rocznik 2050 kończy specjalizację w 2062 r.). */
export const YEAR_END = 2062;
/** Pierwszy nabór, który zmieniają suwak „limit” i gotowe scenariusze (2027/28). */
export const FIRST_EDITABLE = YEAR0 + 1;

export const STUDY_YEARS = 6;
export const SPEC_YEARS = 6;
/** Wiek rozpoczęcia studiów — tylko do przypisania rocznika rejestru do roku naboru. */
const START_AGE = 19;

/** Stan rejestru NIL na starcie modelu — wydruk „zestawienie nr 3” (lekarze wg wieku i płci):
 *  https://nil.org.pl/uploaded_files/1768208069_31122025-zestawienie-nr-3.pdf */
export const REGISTER_DATE = '31.12.2025';
/** Lekarze wykonujący zawód wg rejestru NIL (bez dentystów), stan na 31.12.2025. */
export const REGISTER_TOTAL = 164892;
/** Lekarze pracujący bezpośrednio z pacjentem — GUS 2024. */
export const GUS_WITH_PATIENTS = 141193;

/** Piramida wieku lekarzy wykonujących zawód — rejestr NIL, stan na 31.12.2025 (wiek rocznikowo na 2026 r.). Suma = REGISTER_TOTAL. */
const AGE_GROUPS: ReadonlyArray<{ from: number; to: number; n: number }> = [
  { from: 25, to: 25, n: 176 },
  { from: 26, to: 30, n: 20346 },
  { from: 31, to: 35, n: 19834 },
  { from: 36, to: 40, n: 17008 },
  { from: 41, to: 45, n: 12787 },
  { from: 46, to: 50, n: 11607 },
  { from: 51, to: 55, n: 12563 },
  { from: 56, to: 60, n: 15963 },
  { from: 61, to: 65, n: 15183 },
  { from: 66, to: 70, n: 14830 },
];
/** Grupa „71+” — rejestr nie rozbija jej na roczniki, model rozkłada ją równo na wiek 71–OVER_70_TO. */
export const OVER_70 = 24595;
export const OVER_70_TO = 85;

/** Rejestr NIL rok wcześniej (wydruk z 31.12.2024, ta sama definicja) — do sprawdzenia kalibracji. */
export const REGISTER_PREV_TOTAL = 160840;

// Zgony na 1000 osób rocznie (do wieku `to` włącznie) — GUS, „Trwanie życia w 2025 r.”, tablica A:
// prawdopodobieństwo zgonu qx, średnia z roczników grupy, ważona płcią lekarzy wykonujących zawód
// (40,3% mężczyzn). Po 100. roku życia nikogo w modelu nie ma.
const DEATHS: ReadonlyArray<{ to: number; perMille: number }> = [
  { to: 30, perMille: 0.6 }, { to: 35, perMille: 0.9 }, { to: 40, perMille: 1.3 }, { to: 45, perMille: 1.8 },
  { to: 50, perMille: 2.8 }, { to: 55, perMille: 4.5 }, { to: 60, perMille: 7.1 }, { to: 65, perMille: 11.6 },
  { to: 70, perMille: 18.2 }, { to: 75, perMille: 27.4 }, { to: 80, perMille: 43 }, { to: 85, perMille: 72.5 },
  { to: 90, perMille: 124.8 }, { to: 95, perMille: 195.9 }, { to: 100, perMille: 281.5 },
];
const MAX_AGE = 100;
/** Udział dożywających: ALIVE[wiek] / ALIVE[wiek startu] (jak lx w tablicy trwania życia). */
const ALIVE: readonly number[] = (() => {
  const out = [1];
  for (let age = 1; age <= MAX_AGE + 1; age++) {
    const rate = (DEATHS.find((d) => age - 1 <= d.to)?.perMille ?? 0) / 1000;
    out.push(age - 1 < 25 ? 1 : out[age - 1] * (1 - rate));
  }
  return out;
})();
/** Jaka część osób w wieku `from` dożywa wieku `to`. */
const survival = (from: number, to: number) => (to > MAX_AGE ? 0 : ALIVE[to] / ALIVE[from]);

/** Od tego rocznika limity są dokładne (rozporządzenia MZ); wcześniej — punkty kontrolne. */
export const EXACT_FROM = 2012;

// Miejsca na studiach lekarskich PO POLSKU (stacjonarne + niestacjonarne + pula dla
// cudzoziemców). Studia obcojęzyczne są poza modelem — zostaje po nich w Polsce <1%
// absolwentów. Od 2012/13 to dokładne limity z rozporządzeń MZ w wersji końcowej (po
// nowelizacjach) — to samo źródło co tabela w /analizy/english-division/ (`LIMITS`:
// ogółem minus kolumna w języku obcym). 1987–2011: punkty kontrolne, lata pośrednie
// interpolowane liniowo. Do 16.10.2026 model brał wersje pierwotne aktów (port 1:1
// z poprzedniej wersji serwisu); różnice: 2018 +168, 2019 +12, 2022 +75, 2023 +485, 2024 +183.
const CONTROL_POINTS: Record<number, number> = { 1987: 6000, 1990: 3300, 2003: 2090, 2005: 2360, 2010: 3800 };
const ANCHORS: Record<number, number> = {
  ...CONTROL_POINTS,
  ...Object.fromEntries(LIMITS.map((r) => [Number(r.year.slice(0, 4)), r.total - r.foreign])),
};

/** Ostatni rok akademicki z rozporządzeniem (dziś 2026/27). */
const LAST_LIMIT_YEAR = Math.max(...Object.keys(ANCHORS).map(Number));
/** Limit polskojęzyczny obowiązujący dziś (ostatnie rozporządzenie). */
export const LIMIT_TODAY = ANCHORS[LAST_LIMIT_YEAR];
/** Rok akademicki, którego dotyczy LIMIT_TODAY, np. „2026/27”. */
export const LIMIT_TODAY_LABEL = `${LAST_LIMIT_YEAR}/${String(LAST_LIMIT_YEAR + 1).slice(2)}`;
/** Miejsca z projektu rozporządzenia na 2024/25 — do nich odnosi się analiza zespołu NIL. */
export const NIL_BASE = 7797;
/** Górna granica osi naboru i suwaków. */
export const INTAKE_MAX = 12000;
/** Skok wartości przy przeciąganiu i suwaku — okrągłe liczby zamiast „4 137”. */
export const INTAKE_STEP = 50;

export const YEARS = YEAR_MAX - YEAR_MIN + 1;

/** Nabór „bez zmian” rok po roku (indeks `rok - YEAR_MIN`): historia, a od ostatniego rozporządzenia dzisiejszy limit. */
export const BASE_INTAKE: readonly number[] = (() => {
  const years = Object.keys(ANCHORS).map(Number).sort((a, b) => a - b);
  const out: number[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
    if (y >= LAST_LIMIT_YEAR) { out.push(LIMIT_TODAY); continue; }
    const i = years.findIndex((a) => a > y);
    const [y0, y1] = [years[i - 1], years[i]];
    out.push(Math.round(ANCHORS[y0] + ((ANCHORS[y1] - ANCHORS[y0]) * (y - y0)) / (y1 - y0)));
  }
  return out;
})();

/** Losy rocznika między przyjęciem a pracą w zawodzie (analiza /analizy/odsiew-na-medycynie/). */
export interface Rates {
  /** Udział przyjętych, którzy kończą studia (0–1). */
  graduate: number;
  /** Udział absolwentów, którzy nie pracują w Polsce (0–1). */
  abroad: number;
  /** Lekarze z dyplomem zagranicznym wchodzący co roku na rynek. */
  inflow: number;
}

export const MEASURED: Rates = {
  // MZ (POL-on): absolwenci-Polacy wobec I semestru sprzed pięciu lat — 80–82%.
  graduate: 0.8,
  // MZ (POL-on × ZUS): 5% absolwentów bez składki ZUS w Polsce sześć lat po dyplomie.
  abroad: 0.05,
  // CEM: do LEK co roku podchodzi 860–1210 osób z dyplomem zagranicznym — okrągłe 1000.
  inflow: 1000,
};

export interface Settings extends Rates {
  /** Wiek, do którego lekarz pracuje. */
  retireAge: number;
  /** Udział rocznika, który kończy specjalizację (0–1); GUS 2024: 64,5%. */
  specShare: number;
}

export const DEFAULTS: Settings = { retireAge: 70, specShare: 0.65, ...MEASURED };

export interface Point {
  year: number;
  doctors: number;
  specialists: number;
}

// Roczniki jednoroczne z pięcioletnich grup rejestru (podział równy wewnątrz grupy).
const REGISTER_COHORTS = AGE_GROUPS.flatMap(({ from, to, n }) =>
  Array.from({ length: to - from + 1 }, (_, k) => ({ age: from + k, n: n / (to - from + 1) })),
);

// Grupa 71+ po rocznikach: podział równy, bo rejestr nie podaje nic dokładniejszego.
const OVER_70_COHORTS = Array.from({ length: OVER_70_TO - 70 }, (_, k) => ({ age: 71 + k, n: OVER_70 / (OVER_70_TO - 70) }));

/** Rok rozpoczęcia studiów przez lekarza, który w 2026 r. ma `age` lat. */
const intakeYearForAge = (age: number) => YEAR0 - age + START_AGE;
/** Ostatni rocznik naboru obecny już w rejestrze (wiek 26 w 2026 r.). */
const LAST_IN_REGISTER = intakeYearForAge(26);
/** Wiek, w którym nowy rocznik pojawia się w modelu (rok po dyplomie). */
const ENTRY_AGE = START_AGE + STUDY_YEARS + 1;

/** Udział rocznika czynny w danym roku: między wiekiem odejścia R a R+5 wygasa po 1/5 rocznie.
 *  Kto już na starcie był starszy niż R, wygasa licząc od dziś, a nie wstecz. */
function active(ageInYear: number, R: number, sinceStart: number): number {
  if (ageInYear <= R) return 1;
  const years = Math.min(ageInYear - R, sinceStart);
  return years >= 5 ? 0 : (5 - years) / 5;
}

/** Prognoza liczby lekarzy 2026–2062 dla naboru `intake` (indeks `rok - YEAR_MIN`). */
export function simulate(intake: readonly number[], s: Settings = DEFAULTS): Point[] {
  const { retireAge: R, specShare: p, graduate, abroad, inflow } = s;
  const out: Point[] = [];

  for (let year = YEAR0; year <= YEAR_END; year++) {
    const sinceStart = year - YEAR0;
    let doctors = 0;
    let specialists = 0;

    // 1. Roczniki obecne w rejestrze. Zmiana naboru w przeszłości skaluje rocznik
    //    proporcjonalnie — przy nietkniętym naborze model odtwarza rejestr co do osoby.
    for (const { age, n } of REGISTER_COHORTS) {
      const e = intakeYearForAge(age);
      let people = n;
      if (e >= YEAR_MIN && e <= LAST_IN_REGISTER) {
        const i = e - YEAR_MIN;
        people *= BASE_INTAKE[i] ? intake[i] / BASE_INTAKE[i] : 1;
      }
      const a = active(age + sinceStart, R, sinceStart);
      if (a === 0) continue;
      people *= a * survival(age, age + sinceStart);
      doctors += people;
      if (e + STUDY_YEARS + SPEC_YEARS < year) specialists += people * p;
    }

    // 2. Grupa 71+ — ci lekarze już pokazali, że nie kończą pracy w wieku R, więc wiek
    //    odejścia ich nie dotyczy: ubywają tylko zgony. Tak zachowywał się rejestr w 2025 r.
    //    (REGISTER_PREV_TOTAL → REGISTER_TOTAL), a model z tą regułą daje w 2027 r. podobny przyrost.
    for (const { age, n } of OVER_70_COHORTS) {
      const people = n * survival(age, age + sinceStart);
      doctors += people;
      specialists += people * p;
    }

    // 3. Roczniki, które dopiero wejdą (nabór od 2020 r.): przyjęci po odsiewie i wyjazdach
    //    plus napływ z zagranicy. Odsiew to sprawa pierwszego roku, więc zmiana udziału
    //    kończących działa od naboru 2026 — roczniki 2020–2025 mają pierwszy rok za sobą.
    for (let e = LAST_IN_REGISTER + 1; e <= YEAR_MAX; e++) {
      if (e + STUDY_YEARS >= year) break;
      const g = e >= YEAR0 ? graduate : MEASURED.graduate;
      const age = START_AGE + STUDY_YEARS + (year - (e + STUDY_YEARS));
      const a = active(age, R, sinceStart);
      if (a === 0) continue;
      const people = (intake[e - YEAR_MIN] * g * (1 - abroad) + inflow) * a * survival(ENTRY_AGE, age);
      doctors += people;
      if (e + STUDY_YEARS + SPEC_YEARS < year) specialists += people * p;
    }

    out.push({ year, doctors: Math.round(doctors), specialists: Math.round(specialists) });
  }
  return out;
}

/** Ilu lekarzy w roku `year` daje jedno dodatkowe miejsce na studiach co roku od 2026 r.
 *  Model jest liniowy w naborze; liczone na 1000 miejsc, żeby zaokrąglenia nie zjadły wyniku. */
export function doctorsPerSeat(s: Settings, year: number): number {
  const plus = BASE_INTAKE.map((v, i) => (YEAR_MIN + i >= YEAR0 ? v + 1000 : v));
  const i = year - YEAR0;
  return (simulate(plus, s)[i].doctors - simulate(BASE_INTAKE, s)[i].doctors) / 1000;
}

export interface Preset {
  id: string;
  label: string;
  desc: string;
  /** Rusza przeszłość — kontrfakt, nie polityka (inny wygląd przycisku). */
  history?: boolean;
  /** Nabór scenariusza, liczony od naboru „bez zmian”. */
  intake: () => number[];
}

// Warianty zespołu NIL bierzemy dosłownie (4 100, 4 200, 1 500 miejsc), choć zespół liczył je
// wobec 7 797 miejsc z projektu na 2024/25 (NIL_BASE). Do 16.10.2026 model przeliczał je
// proporcjonalnie na dzisiejszy limit (A: 4 676, B: dno 4 790, C: −1 711).
export const NIL_VARIANTS = { a: 4100, bFloor: 4200, cCut: 1500 } as const;
const idx = (year: number) => year - YEAR_MIN;
/** „8 892 miejsca”, „4 100 miejsc” */
export const seats = (n: number) => `${formatPL(n)} ${plural(Math.abs(n), ['miejsce', 'miejsca', 'miejsc'])}`;
const fromBase = (edit: (n: number[]) => void) => () => {
  const n = [...BASE_INTAKE];
  edit(n);
  return n;
};

export const PRESETS: Preset[] = [
  {
    id: 'baza',
    label: 'Bez zmian',
    desc: `Rzeczywiste limity z rozporządzeń do ${LIMIT_TODAY_LABEL}, potem co roku dzisiejszy poziom: ${seats(LIMIT_TODAY)}.`,
    intake: fromBase(() => {}),
  },
  {
    id: 'nil-a',
    label: 'Cięcie NIL · A',
    desc: `Wariant A zespołu NIL: od 2027 r. nabór spada o ponad połowę — do ${seats(NIL_VARIANTS.a)} rocznie.`,
    intake: fromBase((n) => { for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) n[idx(y)] = NIL_VARIANTS.a; }),
  },
  {
    id: 'nil-b',
    label: 'Cięcie NIL · B',
    desc: `Wariant B zespołu NIL: nabór maleje o ok. 9% rocznie, aż zejdzie do ${seats(NIL_VARIANTS.bFloor)}.`,
    intake: fromBase((n) => {
      const floor = NIL_VARIANTS.bFloor;
      let v = n[idx(YEAR0)];
      for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) n[idx(y)] = v = Math.max(floor, Math.round(v * 0.91));
    }),
  },
  {
    id: 'nil-c',
    label: 'Cięcie NIL · C',
    desc: `Wariant C zespołu NIL: od razu ${seats(NIL_VARIANTS.cCut)} mniej, potem −4% rocznie do 2034 r.`,
    intake: fromBase((n) => {
      let v = n[idx(YEAR0)] - NIL_VARIANTS.cCut;
      for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) {
        if (y >= 2028 && y <= 2034) v = Math.round(v * 0.96);
        n[idx(y)] = v;
      }
    }),
  },
  {
    id: 'bez-ciecia',
    label: 'Gdyby nie ścięto w latach 90.',
    desc: 'Kontrfakt: nabór zostaje na poziomie z 1987 r. (6\u00A0000 miejsc) aż do 2005 r. Tyle lekarzy byłoby dziś, gdyby nie tamto cięcie.',
    history: true,
    intake: fromBase((n) => { for (let y = YEAR_MIN; y <= 2005; y++) n[idx(y)] = 6000; }),
  },
];
