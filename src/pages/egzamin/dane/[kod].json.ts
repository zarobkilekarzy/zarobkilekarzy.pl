/**
 * Pytania jednej sesji jako plik statyczny: /egzamin/dane/20262.json, /egzamin/dane/ldek-20262.json.
 * Moduł pobiera tylko sesje, których potrzebuje (lib/egzamin/source.ts), więc HTML strony nie niesie
 * pytań. Adres jak w pierwszej wersji modułu; wersja pliku w `?v=` (hash z normalizatora).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { cemQuestions, cemSessionCodes } from '@/lib/egzamin/cem';

export const getStaticPaths = (() =>
  (['lek', 'ldek'] as const).flatMap((exam) => cemSessionCodes(exam).map((kod) => ({ params: { kod } })))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => Response.json({ questions: cemQuestions(params.kod!) });
