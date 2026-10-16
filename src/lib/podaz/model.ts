/**
 * Model podaży lekarzy dla /analizy/symulator-podazy-lekarzy/.
 *
 * Jedno źródło rachunku: importuje go strona (pierwszy render, liczby w tekście)
 * i skrypt w przeglądarce (przeliczenie po każdym ruchu suwaka), więc liczba
 * w akapicie i na wykresie nie mogą się rozjechać. Port 1:1 z poprzedniej wersji
 * serwisu (src/lib/symulatorPodazy.ts) — zmieniły się tylko nazwy.
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

export const REGISTER_DATE = '16 stycznia 2026';
/** Lekarze wykonujący zawód wg rejestru NIL (bez dentystów), 16.01.2026. */
export const REGISTER_TOTAL = 164892;
/** Lekarze pracujący bezpośrednio z pacjentem — GUS 2024. */
export const GUS_WITH_PATIENTS = 141193;

/** Piramida wieku lekarzy wykonujących zawód — rejestr NIL, 16.01.2026. Suma = REGISTER_TOTAL. */
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
/** Grupa „71+” — rejestr nie rozbija jej na roczniki, model traktuje ją osobno. */
export const OVER_70 = 24595;

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

/** Rok rozpoczęcia studiów przez lekarza, który w 2026 r. ma `age` lat. */
const intakeYearForAge = (age: number) => YEAR0 - age + START_AGE;
/** Ostatni rocznik naboru obecny już w rejestrze (wiek 26 w 2026 r.). */
const LAST_IN_REGISTER = intakeYearForAge(26);

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
      people *= a;
      doctors += people;
      if (e + STUDY_YEARS + SPEC_YEARS < year) specialists += people * p;
    }

    // 2. Grupa 71+ — postarzana razem z resztą, jakby miała dokładnie 71 lat.
    const a71 = active(71 + sinceStart, R, sinceStart);
    if (a71 > 0) {
      doctors += OVER_70 * a71;
      specialists += OVER_70 * a71 * p;
    }

    // 3. Roczniki, które dopiero wejdą (nabór od 2020 r.): przyjęci po odsiewie i wyjazdach
    //    plus napływ z zagranicy. Odsiew to sprawa pierwszego roku, więc zmiana udziału
    //    kończących działa od naboru 2026 — roczniki 2020–2025 mają pierwszy rok za sobą.
    for (let e = LAST_IN_REGISTER + 1; e <= YEAR_MAX; e++) {
      if (e + STUDY_YEARS >= year) break;
      const g = e >= YEAR0 ? graduate : MEASURED.graduate;
      const cohort = intake[e - YEAR_MIN] * g * (1 - abroad) + inflow;
      const a = active(START_AGE + STUDY_YEARS + (year - (e + STUDY_YEARS)), R, sinceStart);
      if (a === 0) continue;
      doctors += cohort * a;
      if (e + STUDY_YEARS + SPEC_YEARS < year) specialists += cohort * a * p;
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

// Warianty zespołu NIL są wyrażone wobec 7797 miejsc z projektu na 2024/25 —
// przenosimy je na dzisiejszy limit proporcjonalnie.
const scaled = (nilSeats: number) => Math.round(LIMIT_TODAY * (nilSeats / NIL_BASE));
const idx = (year: number) => year - YEAR_MIN;
/** „8 892 miejsca”, „4 676 miejsc” */
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
    desc: `Wariant A zespołu NIL: od 2027 r. nabór spada niemal o połowę — do ${seats(scaled(4100))} rocznie.`,
    intake: fromBase((n) => { for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) n[idx(y)] = scaled(4100); }),
  },
  {
    id: 'nil-b',
    label: 'Cięcie NIL · B',
    desc: `Wariant B zespołu NIL: nabór maleje o ok. 9% rocznie, aż zejdzie do ${seats(scaled(4200))}.`,
    intake: fromBase((n) => {
      const floor = scaled(4200);
      let v = n[idx(YEAR0)];
      for (let y = FIRST_EDITABLE; y <= YEAR_MAX; y++) n[idx(y)] = v = Math.max(floor, Math.round(v * 0.91));
    }),
  },
  {
    id: 'nil-c',
    label: 'Cięcie NIL · C',
    desc: `Wariant C zespołu NIL: od razu ${seats(scaled(1500))} mniej, potem −4% rocznie do 2034 r.`,
    intake: fromBase((n) => {
      let v = Math.round(n[idx(YEAR0)] - scaled(1500));
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
