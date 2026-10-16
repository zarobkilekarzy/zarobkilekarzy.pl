/**
 * Bank pytań egzaminu jako plik statyczny: /egzamin/lek.json, /egzamin/ldek.json.
 * Moduł pobiera go przed startem testu (lib/egzamin/source.ts → loadPool), więc HTML strony
 * nie niesie pytań. DEMO: pytania przykładowe redakcji (data/egzamin-demo.ts).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { EXAMS } from '@/data/egzamin';
import { demoQuestions } from '@/data/egzamin-demo';

export const getStaticPaths = (() => EXAMS.map(({ id }) => ({ params: { exam: id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  Response.json({ questions: demoQuestions.filter((q) => q.exam === params.exam) });
