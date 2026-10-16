/**
 * Źródło pytań — jedyne miejsce, które wie, skąd przychodzą pytania.
 * DEMO: plik /egzamin/<egzamin>.json ma kilkadziesiąt przykładowych pytań, a `expandDemo`
 * rozkłada je powtarzalnie na 200 numerów każdej sesji, żeby UI pracował w pełnej skali.
 * Produkcja: ten sam kontrakt (`loadPool`), ale pliki sesji z jawnej bazy CEM, bez rozkładania.
 */
import { hash, seeded, shuffle } from './engine';
import type { ExamId, ExamQuestion, QuestionBody, SessionInfo } from './types';

/** Od tej sesji da się ustalić, czy pytanie było w jawnej bazie przed egzaminem. */
const ORIGIN_KNOWN_FROM = 2022;

export function expandDemo(bodies: QuestionBody[], sessions: SessionInfo[], exam: ExamId): ExamQuestion[] {
  const own = bodies.filter((b) => b.exam === exam);
  if (own.length === 0) return [];
  return sessions.flatMap((s) => {
    const order = shuffle(own, seeded(hash(`${exam}:${s.id}`)));
    return Array.from({ length: s.count }, (_, i) => {
      const body = order[i % order.length];
      return {
        ...body,
        id: `${exam}-${s.id}-${i + 1}`,
        session: s.id,
        nr: i + 1,
        inBase: s.year >= ORIGIN_KNOWN_FROM ? body.inBase : null,
      };
    });
  });
}

const cache = new Map<ExamId, Promise<ExamQuestion[]>>();

/** Wszystkie pytania egzaminu — pobierane raz, przy pierwszej potrzebie. */
export function loadPool(exam: ExamId, url: string, sessions: SessionInfo[]): Promise<ExamQuestion[]> {
  let pending = cache.get(exam);
  if (!pending) {
    pending = fetch(url.replace('{exam}', exam))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ questions: QuestionBody[] }>;
      })
      .then(({ questions }) => expandDemo(questions, sessions, exam));
    // Nieudane pobranie nie zostaje w pamięci — kolejna próba pyta sieć jeszcze raz
    pending.catch(() => cache.delete(exam));
    cache.set(exam, pending);
  }
  return pending;
}
