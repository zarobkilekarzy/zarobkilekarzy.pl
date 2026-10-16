/**
 * Pamięć przeglądarki modułu: bieżący test, notatki i ustawienia widoku.
 * Każdy odczyt i zapis jest odporny na brak localStorage (tryb prywatny, blokada) —
 * wtedy moduł działa normalnie, tylko bez pamięci między wizytami.
 *
 * Klucze z pierwszej wersji modułu (`egzamin-lek:*`) — czytelnicy zachowują notatki i zapisany
 * test. Notatki mają ten sam format (id pytania → tekst); test w starym formacie przechodzi
 * przez `fromV1` przy pierwszym odczycie. Słabe pytania (`egzamin-lek:pytania:v1`) i historia
 * wyników (`egzamin-lek:wyniki:v1`) mają DOKŁADNIE format pierwszej wersji — czytelnicy mają tam
 * dane z produkcji, więc kształtu rekordów nie zmieniamy (zob. `WeakEntry`, `ResultV1`).
 */
import { codeOfQuestion, parseSessionCode } from './ids';
import type { ExamId } from './types';
import type { ModeId, TestState } from './types';

const KEYS = {
  test: 'egzamin-lek:v1',
  notes: 'egzamin-lek:notatki:v1',
  prefs: 'egzamin-lek:widok',
  weak: 'egzamin-lek:pytania:v1',
  results: 'egzamin-lek:wyniki:v1',
} as const;

/** Zapisany test z pierwszej wersji modułu (pages/egzamin.astro do października 2026). */
interface TestV1 {
  v: 1; tryb: ModeId | 'powtorka'; sesje: string[]; klucze: string[];
  odp: Record<string, number>; flagi: string[]; idx: number;
  czas: number; limit: number; koniec: boolean; start: number;
  pauza?: boolean; agent?: boolean; wyslano?: boolean; zakres?: { d?: string[]; b?: 0 | 1 };
}

const isV1 = (s: unknown): s is TestV1 => typeof s === 'object' && s !== null && Array.isArray((s as TestV1).klucze);

/** Stary zapis → TestState; null, gdy nie da się go odczytać (wtedy karta „Wznów” się nie pokaże). */
export function fromV1(old: TestV1, now = Date.now()): TestState | null {
  const first = parseSessionCode(old.sesje[0] ?? '');
  if (!first || old.klucze.length === 0) return null;
  const index = new Map(old.klucze.map((k, i) => [k, i]));
  const answers: Record<number, number> = {};
  for (const [k, a] of Object.entries(old.odp ?? {})) if (index.has(k)) answers[index.get(k)!] = a;
  const field = old.zakres?.d?.length === 1 ? old.zakres.d[0] : 'all';
  return {
    v: 1,
    config: {
      exam: first.exam,
      // Powtórka słabych pytań to nauka na jawnej liście pytań
      mode: old.tryb === 'powtorka' ? 'nauka' : old.tryb,
      session: old.sesje.length > 1 ? 'all' : first.session,
      field,
      shuffle: false,
      ...(old.tryb === 'powtorka' && { ids: old.klucze, weak: true }),
    },
    ids: old.klucze,
    answers,
    flags: (old.flagi ?? []).map((k) => index.get(k)).filter((i): i is number => i !== undefined),
    current: Math.min(Math.max(0, old.idx || 0), old.klucze.length - 1),
    startedAt: old.start || now,
    elapsed: old.czas || 0,
    tickAt: now,
    limit: old.limit || null,
    paused: Boolean(old.pauza),
    finishedAt: old.koniec ? now : null,
    ...(old.agent && { agent: true }),
    // Pierwsza wersja nie wysyłała testów z zawężonym zakresem — i tu nie trafią do porównania
    ...((old.wyslano || old.zakres) && { sent: true }),
    ...(old.zakres && field === 'all' && { incomparable: true }),
  };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* brak pamięci — test trwa dalej w tej karcie */
  }
}

export const testStore = {
  load: (): TestState | null => {
    const s = read<TestState | TestV1 | null>(KEYS.test, null);
    if (isV1(s)) {
      const migrated = fromV1(s);
      write(KEYS.test, migrated);
      return migrated;
    }
    return s?.v === 1 ? s : null;
  },
  save: (s: TestState) => write(KEYS.test, s),
  clear: () => write(KEYS.test, null),
};

/** Notatki do pytań — wspólne dla wszystkich testów (klucz: id pytania). */
export const notes = {
  all: () => read<Record<string, string>>(KEYS.notes, {}),
  get: (id: string) => notes.all()[id] ?? '',
  has: (id: string) => Boolean(notes.all()[id]),
  set(id: string, text: string) {
    const all = notes.all();
    if (text.trim()) all[id] = text;
    else delete all[id];
    write(KEYS.notes, all);
  },
};

export interface Prefs {
  /** wielkość tekstu pytania: 0 = normalna, 1 = większa, 2 = największa */
  size: 0 | 1 | 2;
  /** panel mapy na szerokim ekranie */
  map: boolean;
}

export const prefs = {
  get: (): Prefs => ({ size: 0, map: true, ...read<Partial<Prefs>>(KEYS.prefs, {}) }),
  set: (patch: Partial<Prefs>) => write(KEYS.prefs, { ...prefs.get(), ...patch }),
};

/* ==========================================================================
   Słabe pytania — `egzamin-lek:pytania:v1`
   Format pierwszej wersji: { [id pytania]: { z, s, t } }
     z — liczba błędnych odpowiedzi, s — poprawne z rzędu od ostatniego błędu, t — ms ostatniej odpowiedzi.
   Pytanie z błędną odpowiedzią trafia na listę i schodzi z niej po dwóch poprawnych z rzędu
   (wpis zostaje w pamięci, ale `ids` go pomija — jak w pierwszej wersji).
   ========================================================================== */

export interface WeakEntry { z: number; s: number; t: number }

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isWeakEntry = (e: unknown): e is WeakEntry =>
  typeof e === 'object' && e !== null && isNum((e as WeakEntry).z) && isNum((e as WeakEntry).s) && isNum((e as WeakEntry).t);

/** Egzamin z id pytania: „ldek-20262:15” → 'ldek'; null, gdy id jest obce. */
const examOfQuestion = (id: string): ExamId | null => parseSessionCode(codeOfQuestion(id))?.exam ?? null;

export const weak = {
  /** Wszystkie poprawne wpisy; uszkodzone (np. ręcznie zmienione) są pomijane. */
  all(): Record<string, WeakEntry> {
    const raw = read<unknown>(KEYS.weak, {});
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, e]) => isWeakEntry(e))) as Record<string, WeakEntry>;
  },
  /** Odpowiedź na pytanie: błąd zeruje serię poprawnych; poprawna od początku nie zaśmieca pamięci. */
  record(id: string, ok: boolean, now = Date.now()) {
    const all = weak.all();
    const e = all[id] ?? { z: 0, s: 0, t: 0 };
    if (ok) e.s += 1;
    else { e.z += 1; e.s = 0; }
    e.t = now;
    if (ok && !e.z) delete all[id];
    else all[id] = e;
    write(KEYS.weak, all);
  },
  /** Id słabych pytań jednego egzaminu, w kolejności dodania. */
  ids: (exam: ExamId) =>
    Object.entries(weak.all()).filter(([id, e]) => e.z > 0 && e.s < 2 && examOfQuestion(id) === exam).map(([id]) => id),
};

/* ==========================================================================
   Historia wyników — `egzamin-lek:wyniki:v1`
   Format pierwszej wersji: tablica (najwyżej 100 ostatnich) rekordów `ResultV1`.
   Zapisujemy tylko ukończony egzamin i szybki test (bez testów agenta AI).
   ========================================================================== */

export interface ResultV1 {
  /** chwila zakończenia (ms) */
  t: number;
  typ: 'LEK' | 'LDEK';
  /** pierwsza wersja zapisywała tylko 'egzamin' i 'szybki'; pozostałe wartości dopuszczał jej typ */
  tryb: 'egzamin' | 'szybki' | 'nauka' | 'powtorka';
  /** nazwa sesji, np. „jesień 2026”, albo „wszystkie sesje” */
  sesja: string;
  pkt: number;
  max: number;
  /** czas netto w ms (nie dłuższy niż limit) */
  czas: number;
  /** dziedziny: [id, poprawne, pytania] — tylko dziedziny obecne w teście */
  dz: [string, number, number][];
}

const RESULTS_LIMIT = 100;
const TRYBY = ['egzamin', 'szybki', 'nauka', 'powtorka'];

const isResult = (r: unknown): r is ResultV1 => {
  if (typeof r !== 'object' || r === null) return false;
  const x = r as ResultV1;
  return isNum(x.t) && (x.typ === 'LEK' || x.typ === 'LDEK') && TRYBY.includes(x.tryb) && typeof x.sesja === 'string'
    && isNum(x.pkt) && isNum(x.max) && x.max > 0 && isNum(x.czas) && Array.isArray(x.dz);
};
const isFieldRow = (d: unknown): d is [string, number, number] =>
  Array.isArray(d) && typeof d[0] === 'string' && isNum(d[1]) && isNum(d[2]) && d[2] > 0;

export const results = {
  /** Wyniki od najstarszego; uszkodzone rekordy pomijamy, uszkodzone wiersze dziedzin — też. */
  all(): ResultV1[] {
    const raw = read<unknown>(KEYS.results, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(isResult).map((r) => ({ ...r, dz: r.dz.filter(isFieldRow) }));
  },
  add(r: ResultV1) {
    write(KEYS.results, [...results.all(), r].slice(-RESULTS_LIMIT));
  },
  /** Czyści historię wyników i listę słabych pytań (jak przycisk w pierwszej wersji). */
  clear() {
    write(KEYS.results, null);
    write(KEYS.weak, null);
  },
};
