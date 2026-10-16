/**
 * Źródło pytań — jedyne miejsce, które wie, skąd przychodzą pytania.
 * Każda sesja to osobny plik z jawnej bazy CEM (/egzamin/dane/<kod>.json?v=<hash>, ok. 30 kB
 * po kompresji), pobierany przy pierwszej potrzebie: test z jednej sesji nie ciągnie całej bazy.
 */
import { codeOfQuestion, parseSessionCode } from './ids';
import type { ExamId, ExamQuestion, SessionInfo } from './types';

const cache = new Map<string, Promise<ExamQuestion[]>>();

function loadFile(url: string): Promise<ExamQuestion[]> {
  let pending = cache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ questions: ExamQuestion[] }>;
      })
      .then(({ questions }) => questions);
    // Nieudane pobranie nie zostaje w pamięci — kolejna próba pyta sieć jeszcze raz
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
}

/** Pytania wskazanych sesji jednego egzaminu (`'all'` = wszystkie sesje), w kolejności listy sesji. */
export async function loadSessions(exam: ExamId, ids: string[] | 'all', sessions: SessionInfo[]): Promise<ExamQuestion[]> {
  const urls = sessions
    .filter((s) => ids === 'all' || ids.includes(s.id))
    .map((s) => s.files[exam])
    .filter((u): u is string => Boolean(u));
  return (await Promise.all(urls.map(loadFile))).flat();
}

/** Pytania o podanych id (np. wznowiony test, powtórka błędnych) — pobiera tylko ich sesje. */
export function loadByIds(exam: ExamId, ids: string[], sessions: SessionInfo[]) {
  const wanted = new Set(ids.map((id) => parseSessionCode(codeOfQuestion(id))?.session).filter(Boolean) as string[]);
  return loadSessions(exam, [...wanted], sessions);
}
