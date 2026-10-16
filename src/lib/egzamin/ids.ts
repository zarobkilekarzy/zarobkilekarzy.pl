/**
 * Identyfikatory sesji i pytań — wspólne dla buildu i przeglądarki.
 * Format pytania jest ten sam co w pierwszej wersji modułu (`20262:15`, `ldek-20262:15`):
 * notatki i zapisany test z pamięci przeglądarki działają po zmianie strony bez konwersji.
 */
import type { ExamId } from './types';

/** Kod sesji CEM: „2026-jesien” + LDEK → „ldek-20262” (1 = wiosna, 2 = jesień). */
export function sessionCode(exam: ExamId, session: string) {
  const [year, season] = session.split('-');
  return `${exam === 'ldek' ? 'ldek-' : ''}${year}${season === 'wiosna' ? 1 : 2}`;
}

/** „ldek-20262” → { exam: 'ldek', session: '2026-jesien' }; null, gdy kod jest obcy. */
export function parseSessionCode(code: string): { exam: ExamId; session: string } | null {
  const m = code.match(/^(ldek-)?(\d{4})([12])$/);
  if (!m) return null;
  return { exam: m[1] ? 'ldek' : 'lek', session: `${m[2]}-${m[3] === '1' ? 'wiosna' : 'jesien'}` };
}

export const questionId = (code: string, nr: number) => `${code}:${nr}`;

/** Kod sesji z id pytania: „ldek-20262:15” → „ldek-20262”. */
export const codeOfQuestion = (id: string) => id.slice(0, id.lastIndexOf(':'));
