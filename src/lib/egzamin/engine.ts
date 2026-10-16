/**
 * Silnik testu — czyste funkcje bez DOM i bez pamięci przeglądarki:
 * dobór pytań, czas netto, status pytania i punktacja jak na egzaminie.
 */
import type { ExamQuestion, FieldScore, ModeInfo, TestConfig, TestResult, TestState } from './types';

export const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

/** Pytanie unieważnione przez CEM nie liczy się do wyniku i obniża maksimum. */
export const isCounted = (q: ExamQuestion) => !q.flags?.includes('invalidated');

/** Wskaźnik trudności CEM: odsetek poprawnych odpowiedzi na egzaminie (0,9 = łatwe, 0,3 = bardzo trudne). */
export const difficultyOf = (q: ExamQuestion) =>
  !isCounted(q) ? null : (q.difficulty ?? (q.stats ? q.stats[q.correct] / 100 : null));

export function difficultyLevel(d: number): { level: 1 | 2 | 3 | 4; label: string } {
  if (d >= 0.85) return { level: 1, label: 'łatwe' };
  if (d >= 0.65) return { level: 2, label: 'umiarkowane' };
  if (d >= 0.45) return { level: 3, label: 'trudne' };
  return { level: 4, label: 'bardzo trudne' };
}

/** Deterministyczny generator liczb losowych (mulberry32) — powtarzalne tasowanie. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

export function shuffle<T>(list: readonly T[], random: () => number = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pytania testu według konfiguracji: sesja, dziedzina, kolejność, limit trybu. */
export function selectQuestions(pool: ExamQuestion[], config: TestConfig, mode: ModeInfo, random = Math.random) {
  if (config.ids) {
    const byId = new Map(pool.map((q) => [q.id, q]));
    return config.ids.map((id) => byId.get(id)).filter((q): q is ExamQuestion => q !== undefined);
  }
  const allSessions = mode.scoped && config.session === 'all';
  const list = pool.filter(
    (q) =>
      q.exam === config.exam &&
      (allSessions || q.session === config.session) &&
      (!mode.scoped || config.field === 'all' || q.field === config.field) &&
      (!mode.size || isCounted(q)),
  );
  // Szybki test to zawsze losowa próbka — z pytań liczonych do wyniku, bo unieważnione tylko
  // zmniejszałyby próbkę (i jej maksimum: statystyki przyjmują szybki test z 20 punktów)
  const ordered = config.shuffle || mode.size ? shuffle(list, random) : list;
  return mode.size ? ordered.slice(0, mode.size) : ordered;
}

export function createTest(questions: ExamQuestion[], config: TestConfig, mode: ModeInfo, now = Date.now()): TestState {
  return {
    v: 1,
    config,
    ids: questions.map((q) => q.id),
    answers: {},
    flags: [],
    current: 0,
    startedAt: now,
    tickAt: now,
    elapsed: 0,
    limit: mode.minutesPerQuestion ? Math.round(questions.length * mode.minutesPerQuestion * 60_000) : null,
    paused: false,
    finishedAt: null,
  };
}

/** Czas netto (bez pauz) w chwili `now`. */
export const elapsedAt = (s: TestState, now: number) =>
  s.paused || s.finishedAt !== null ? s.elapsed : s.elapsed + (now - s.tickAt);

export const remainingAt = (s: TestState, now: number) =>
  s.limit === null ? null : Math.max(0, s.limit - elapsedAt(s, now));

export type Status = 'blank' | 'answered' | 'correct' | 'wrong' | 'void';

/** Status pytania na mapie: wynik widać od razu w nauce i po zakończeniu testu. */
export function statusOf(s: TestState, q: ExamQuestion, i: number, reveal: boolean): Status {
  if (!isCounted(q)) return 'void';
  const a = s.answers[i];
  if (a === undefined) return 'blank';
  if (!reveal) return 'answered';
  return a === q.correct ? 'correct' : 'wrong';
}

const emptyScore = (field: string): FieldScore => ({ field, points: 0, max: 0, average: 0 });

/**
 * Wynik jak na egzaminie: unieważnione pytania nie liczą się i obniżają maksimum,
 * próg to 56% maksimum, „przeciętny zdający” to suma wskaźników trudności.
 * `answeredOnly` — w trybie nauki liczymy tylko pytania, na które padła odpowiedź.
 */
export function scoreTest(s: TestState, questions: ExamQuestion[], threshold: number, answeredOnly = false): TestResult {
  const byField = new Map<string, FieldScore>();
  const origin = { base: emptyScore('base'), fresh: emptyScore('fresh') };
  let points = 0, max = 0, average = 0, wrong = 0, blank = 0, invalidated = 0, known = 0;

  questions.forEach((q, i) => {
    const a = s.answers[i];
    // W nauce liczą się tylko pytania z odpowiedzią (unieważnionych nie da się odpowiedzieć)
    if (answeredOnly && a === undefined) return;
    if (!isCounted(q)) return void invalidated++;
    const ok = a === q.correct ? 1 : 0;
    const avg = difficultyOf(q) ?? 0;
    points += ok;
    max += 1;
    average += avg;
    if (a === undefined) blank++;
    else if (!ok) wrong++;

    // Sesje sprzed 2021 r. nie mają podziału na dziedziny
    if (q.field) {
      const f = byField.get(q.field) ?? emptyScore(q.field);
      byField.set(q.field, { ...f, points: f.points + ok, max: f.max + 1, average: f.average + avg });
    }

    if (q.inBase !== null) {
      known++;
      const o = q.inBase ? origin.base : origin.fresh;
      o.points += ok; o.max += 1; o.average += avg;
    }
  });

  const need = Math.ceil(max * threshold);
  return {
    points, max, threshold: need, passed: max > 0 && points >= need, average,
    correct: points, wrong, blank, invalidated,
    elapsed: s.elapsed,
    byField: [...byField.values()].sort((a, b) => b.max - a.max),
    byOrigin: known > 0 && origin.base.max > 0 && origin.fresh.max > 0 ? origin : null,
  };
}

/** Pozycja wyniku w rozkładzie innych (przedziały po 10 pp.): odsetek wyników niższych. */
export function percentile(share: number, bins: number[]) {
  const total = bins.reduce((a, b) => a + b, 0);
  const bin = Math.min(9, Math.floor(share * 10));
  const below = bins.slice(0, bin).reduce((a, b) => a + b, 0) + bins[bin] * (share * 10 - bin);
  return { bin, total, share: total ? below / total : 0 };
}
