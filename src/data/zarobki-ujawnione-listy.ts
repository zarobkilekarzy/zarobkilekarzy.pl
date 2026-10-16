/**
 * Zestawienie /dane/zarobki-ujawnione-listy/: statystyki zbiorcze pełnych rocznych list płac
 * z monitoringu „Ile zarabiają lekarze?” (Sieć Obywatelska Watchdog Polska).
 *
 * Jedno źródło prawdy: wszystko liczy się z tego samego pliku co przeglądarka /dane/monitoring-watchdog/
 * (src/data/monitoring-watchdog.json, kontrakt w lib/monitoring i docs/monitoring-json.md). Po podmianie
 * pliku liczby w treści artykułu, wykresy i tabela przeliczą się same. Ręcznie trzeba poprawić tylko
 * frontmatter artykułu: `updated`, `stat`, `summary`, `description` i `keyPoints`.
 *
 * Plik monitoringu ma tylko agregaty per placówka, bez pojedynczych kwot. Dlatego:
 * - liczby i udziały rozliczeń powyżej progów są DOKŁADNE (progi = granice przedziałów `buckets`),
 *   tak samo mediana median placówek i suma list;
 * - mediana wszystkich rozliczeń jest SZACUNKIEM: interpolacja liniowa wewnątrz przedziału, w którym
 *   wypada połowa rozliczeń, zaokrąglona do 10 tys. zł. Kontrola 15.10.2026 na pojedynczych kwotach
 *   z bazy skryptu eksportu (stan 12.10.2026): szacunek 184 tys. zł, mediana dokładna 183 tys. zł.
 */
import { monitoring } from '@/lib/monitoring';
import type { Facility, Payroll, Response } from '@/lib/monitoring';
import { formatPL, plural } from '@/lib/format';

const { facilities, buckets } = monitoring;

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Stan danych, rok wynagrodzeń i źródło — do zdań „według stanu na …”. */
export const DATA = {
  asOf: new Date(monitoring.updated),
  year: monitoring.year,
  source: monitoring.source,
  /** do ilu placówek poszedł wniosek */
  requests: facilities.length,
} as const;

/**
 * Kryterium pełnej listy w eksporcie (docs/monitoring-json.md → „Lista płac”). Artykuł je cytuje,
 * więc gdy skrypt zmieni kryterium, build zatrzyma się tutaj, zamiast pokazać nieaktualny opis metody.
 */
export const LIST_CRITERION = { minPositions: 10, minMedian: 60_000 } as const;

type WithList = Facility & { payroll: Payroll };
const withList = facilities.filter((f): f is WithList => f.payroll !== null);
const lists = withList.map((f) => f.payroll);

const offCriterion = withList.find(
  (f) => f.payroll.doctors < LIST_CRITERION.minPositions || f.payroll.median < LIST_CRITERION.minMedian,
);
if (offCriterion) {
  throw new Error(
    `zarobki-ujawnione-listy: lista placówki ${offCriterion.id} nie spełnia LIST_CRITERION — skrypt zmienił kryterium? ` +
      'Popraw stałą w src/data/zarobki-ujawnione-listy.ts i opis metody w artykule.',
  );
}

/** Placówki z pełną roczną listą płac — jedyna liczba „placówek z listą” na stronie. */
export const LISTS = lists.length;
/** Pozycje (wiersze) wszystkich list, czyli rozliczenia — nie zawsze osoby. */
export const POSITIONS = sum(lists.map((p) => p.doctors));
/** Suma kwot ze wszystkich list (fundusz płac), zł. */
export const PAYROLL_TOTAL = sum(lists.map((p) => p.total));

/* ---------- odpowiedzi na wniosek ---------- */

/** Wynik wniosku: placówka z listą liczy się jako „lista”, reszta według kategorii odpowiedzi. */
type Outcome = 'list' | Response;
const outcomeOf = (f: Facility): Outcome => (f.payroll ? 'list' : f.response);

const OUTCOME_LABEL: Record<Outcome, string> = {
  list: 'Pełna roczna lista płac',
  disclosed: 'Dane nieporównywalne',
  refused: 'Odmowa',
  silence: 'Cisza',
  receipt: 'Tylko potwierdzenie odbioru',
  other: 'Inna odpowiedź, bez danych',
  forwarded: 'Przekazana innej instytucji',
  unknown: 'Odpowiedź nieustalona',
};

/** Wszystkie placówki według wyniku wniosku, od najliczniejszej grupy; suma = DATA.requests. */
export const OUTCOMES = (Object.keys(OUTCOME_LABEL) as Outcome[])
  .map((key) => ({ key, label: OUTCOME_LABEL[key], n: facilities.filter((f) => outcomeOf(f) === key).length }))
  .sort((a, b) => b.n - a.n);

export const outcome = (key: Outcome) => OUTCOMES.find((o) => o.key === key)?.n ?? 0;

/** Odmowa, cisza albo samo potwierdzenie odbioru wniosku. */
export const REFUSED_OR_SILENT = outcome('refused') + outcome('silence') + outcome('receipt');

/* ---------- rozkład ---------- */

/** Kwota w zapisie skróconym: 100 000 → „100 tys.”, 1 000 000 → „1 mln”. */
function short(n: number, withUnit = true): string {
  const [div, unit]: [number, string] = n >= 1e6 ? [1e6, 'mln'] : [1e3, 'tys.'];
  const v = n / div;
  return `${formatPL(v, Number.isInteger(v) ? 0 : 1)}${withUnit ? ` ${unit}` : ''}`;
}

/** Podpis przedziału i z `buckets`: „do 100 tys.”, „100–200 tys.”, „750 tys.–1 mln”, „ponad 1 mln”. */
function bucketLabel(i: number): string {
  const from: number | undefined = buckets[i - 1];
  const to: number | undefined = buckets[i];
  if (to === undefined) return `ponad ${short(from ?? 0)}`;
  if (from === undefined) return `do ${short(to)}`;
  const sameUnit = from >= 1e6 === to >= 1e6;
  return `${short(from, !sameUnit)}–${short(to)}`;
}

/** Przedział rozkładu, od którego kwoty są wyróżnione (jak „Niebieskie słupki” w przeglądarce). */
export const HIGH = 500_000;

const counts = Array.from({ length: buckets.length + 1 }, (_, i) => sum(lists.map((p) => p.histogram[i])));

/** Rozkład wszystkich rozliczeń w przedziałach rocznej kwoty brutto. */
export const DISTRIBUTION = counts.map((n, i) => ({
  label: bucketLabel(i),
  /** dolna granica przedziału, zł */
  from: i === 0 ? 0 : buckets[i - 1],
  n,
  share: n / POSITIONS,
}));

/** Ile rozliczeń wynosi co najmniej `threshold` zł — dokładnie, bo próg musi być granicą przedziału. */
export function above(threshold: number) {
  const i = buckets.indexOf(threshold);
  if (i === -1) {
    throw new Error(`zarobki-ujawnione-listy: ${threshold} zł nie jest granicą przedziału (buckets) — wynik byłby szacunkiem`);
  }
  const n = sum(counts.slice(i + 1));
  return { n, share: n / POSITIONS };
}

export const below = (threshold: number) => {
  const a = above(threshold);
  return { n: POSITIONS - a.n, share: 1 - a.share };
};

/** Drabina progów od 200 tys. zł: ile rozliczeń je przekracza i „mniej więcej 1 na N”. */
export const THRESHOLDS = buckets
  .filter((b) => b >= 200_000)
  .map((t) => {
    const { n, share } = above(t);
    return { label: `ponad ${short(t)} zł`, n, share, oneIn: n ? Math.round(POSITIONS / n) : null };
  });

/** Rozliczenia powyżej 500 tys. i 1 mln zł — pola over500k / over1m z list (te same co w przeglądarce). */
export const OVER_500K = sum(lists.map((p) => p.over500k));
export const OVER_1M = sum(lists.map((p) => p.over1m));
/** W ilu placówkach jest choć jedno rozliczenie powyżej 1 mln zł. */
export const OVER_1M_FACILITIES = lists.filter((p) => p.over1m > 0).length;
/** W ilu placówkach najwyższa pozycja przekracza 2 mln zł. */
export const MAX_OVER_2M_FACILITIES = lists.filter((p) => p.max > 2_000_000).length;

/* ---------- mediany ---------- */

function medianFromHistogram() {
  const target = POSITIONS / 2;
  let before = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > 0 && before + counts[i] >= target) {
      const from = i === 0 ? 0 : buckets[i - 1];
      const to: number | undefined = buckets[i];
      // w otwartym przedziale („ponad 1 mln”) znamy tylko dolną granicę
      const value = to === undefined ? from : from + ((target - before) / counts[i]) * (to - from);
      return { value, bucket: DISTRIBUTION[i] };
    }
    before += counts[i];
  }
  throw new Error('zarobki-ujawnione-listy: pusty rozkład');
}

const m = medianFromHistogram();

/** Mediana wszystkich rozliczeń — szacunek z rozkładu (zob. komentarz na górze pliku). */
export const MEDIAN = {
  /** interpolacja liniowa w przedziale, zł */
  estimate: m.value,
  /** do tekstu: zaokrąglona do 10 tys. zł */
  rounded: Math.round(m.value / 10_000) * 10_000,
  /** przedział, w którym mediana leży na pewno */
  bucket: m.bucket,
};

/** Mediana median placówek: każda lista waży tyle samo, bez względu na długość. Dokładna. */
export const FACILITY_MEDIAN = median(lists.map((p) => p.median));

const sizes = lists.map((p) => p.doctors).sort((a, b) => b - a);
/** Udział najdłuższych list we wszystkich rozliczeniach. */
export const LARGEST = { count: 5, share: sum(sizes.slice(0, 5)) / POSITIONS };

/* ---------- przykład listy numerowanej ---------- */

/**
 * Przykład listy z numerami zamiast nazwisk: szpital wojewódzki, sprawa 195 w fedrowaniu. Każdy wiersz
 * wykazu to liczba porządkowa, słowo „lekarz” i kwota roczna. Nazwy szpitala artykuł nie podaje —
 * przysłanie pełnej listy to dobra praktyka, a nie zarzut. Gdy sprawa straci listę, wybierz inną
 * listę numerowaną i popraw opis w artykule (sekcja o rekordach).
 */
const EXAMPLE_ID = 195;
const example = withList.find((f) => f.id === EXAMPLE_ID);
if (!example) {
  throw new Error(`zarobki-ujawnione-listy: sprawa ${EXAMPLE_ID} (przykład listy numerowanej) nie ma już listy płac — wybierz inny przykład`);
}
export const EXAMPLE = example.payroll;

/* ---------- skrót do kart poza artykułem ---------- */

/**
 * Te same liczby dla strony głównej, hubu /dane/ i obrazków OG — po podmianie JSON-a monitoringu
 * zmieniają się wszędzie naraz (wcześniej były tam wpisane ręcznie i rozjechały się z danymi).
 */
export const HEADLINE = {
  lists: LISTS,
  /** „93 placówki” */
  listsLabel: `${LISTS} ${plural(LISTS, ['placówka', 'placówki', 'placówek'])}`,
  positions: POSITIONS,
  /** „11 030 rozliczeń” */
  positionsLabel: `${formatPL(POSITIONS)} ${plural(POSITIONS, ['rozliczenie', 'rozliczenia', 'rozliczeń'])}`,
  /** mediana w tys. zł, zaokrąglona do 10 tys. */
  medianK: MEDIAN.rounded / 1000,
  over1m: OVER_1M,
  /** odsetek rozliczeń powyżej 500 tys. zł, w procentach (całkowity) */
  over500kPct: Math.round((OVER_500K / POSITIONS) * 100),
  /** „co N-te rozliczenie” — do rzędu kwadratów */
  over500kOneIn: Math.round(POSITIONS / OVER_500K),
};
