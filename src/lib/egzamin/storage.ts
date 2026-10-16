/**
 * Pamięć przeglądarki modułu: bieżący test, notatki i ustawienia widoku.
 * Każdy odczyt i zapis jest odporny na brak localStorage (tryb prywatny, blokada) —
 * wtedy moduł działa normalnie, tylko bez pamięci między wizytami.
 *
 * Klucze z pierwszej wersji modułu (`egzamin-lek:*`) — czytelnicy zachowują notatki i zapisany
 * test. Notatki mają ten sam format (id pytania → tekst); test w starym formacie przechodzi
 * przez `fromV1` przy pierwszym odczycie. Historii wyników i listy słabych pytań
 * (`egzamin-lek:wyniki:v1`, `egzamin-lek:pytania:v1`) ten moduł nie rusza — zostają w pamięci.
 */
import { parseSessionCode } from './ids';
import type { ModeId, TestState } from './types';

const KEYS = { test: 'egzamin-lek:v1', notes: 'egzamin-lek:notatki:v1', prefs: 'egzamin-lek:widok' } as const;

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
      ...(old.tryb === 'powtorka' && { ids: old.klucze }),
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
