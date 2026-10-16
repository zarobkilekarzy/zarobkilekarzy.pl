/**
 * Pamięć przeglądarki modułu: bieżący test, notatki i ustawienia widoku.
 * Każdy odczyt i zapis jest odporny na brak localStorage (tryb prywatny, blokada) —
 * wtedy moduł działa normalnie, tylko bez pamięci między wizytami.
 */
import type { TestState } from './types';

const KEYS = { test: 'zl-lek:test', notes: 'zl-lek:notes', prefs: 'zl-lek:prefs' } as const;

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
  load: () => {
    const s = read<TestState | null>(KEYS.test, null);
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
