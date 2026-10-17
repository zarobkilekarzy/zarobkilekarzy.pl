/**
 * Jawna baza CEM w buildzie: pliki sesji z normalizatora (src/data/egzamin-lek/<kod>.json
 * + index.json) → model modułu (types.ts). Tylko build — przeglądarka dostaje gotowe pliki
 * sesji z /egzamin/dane/<kod>.json (pages/egzamin/dane).
 *
 * Format normalizatora: t — treść (twierdzenia „1) …; 2) …” wpisane w tekst), w — odpowiedzi A–E,
 * o — klucz 0–4 albo null (pytanie unieważnione), p — odsetek zdających za A–E, tr — wskaźnik
 * trudności CEM, d — dziedzina (od 2021 r.), b — 1/0: w jawnej bazie przed egzaminem / nowe
 * (tylko sesje, które da się porównać z bazą), nz — zgłoszone jako niezgodne z aktualną wiedzą,
 * uc — treść mogła zostać ucięta przy pobieraniu.
 */
import { questionId, parseSessionCode } from './ids';
import type { ExamId, ExamQuestion, FieldInfo, QuestionFlag, SessionInfo } from './types';

interface RawQuestion {
  nr: number; t: string; w: string[]; o: number | null; p: number[] | null; tr: number | null;
  d?: string; b?: 0 | 1; nz?: boolean; uc?: boolean;
}
interface RawSession { sesja: string; nazwa: string; typ: 'LEK' | 'LDEK'; pytania: RawQuestion[] }
interface RawIndexSession { sesja: string; n: number; pelna: boolean; v: string }
interface RawIndex {
  typy: Record<'LEK' | 'LDEK', { nazwa: string; dziedziny: { id: string; nazwa: string }[]; sesje: RawIndexSession[] }>;
}

const files = import.meta.glob<RawSession | RawIndex>('../../data/egzamin-lek/*.json', { eager: true, import: 'default' });
const index = files['../../data/egzamin-lek/index.json'] as RawIndex;
const raw = (code: string) => {
  const s = files[`../../data/egzamin-lek/${code}.json`] as RawSession | undefined;
  if (!s) throw new Error(`[egzamin] brak pliku sesji ${code}.json w src/data/egzamin-lek`);
  return s;
};

const TYPE: Record<ExamId, 'LEK' | 'LDEK'> = { lek: 'LEK', ldek: 'LDEK' };

/** Skróty dziedzin do wąskich miejsc (mapa, tabela wyników); nazwy pełne — z index.json. */
const SHORT: Record<string, string> = {
  wewn: 'Interna', ped: 'Pediatria', chir: 'Chirurgia', gin: 'Ginekologia', psych: 'Psychiatria',
  rodz: 'Rodzinna', rat: 'Ratunkowa', etyka: 'Bioetyka', orz: 'Orzecznictwo', zp: 'Zdr. publiczne',
  zach: 'Zachowawcza', dziec: 'Dziecięca', chst: 'Chirurgia', prot: 'Protetyka', perio: 'Periodontologia', orto: 'Ortodoncja',
};

export const cemFields = (exam: ExamId): FieldInfo[] =>
  index.typy[TYPE[exam]].dziedziny.map((d) => ({ id: d.id, label: d.nazwa, short: SHORT[d.id] ?? d.nazwa }));

/** Sesje kompletne (200 pytań) — tylko z nich da się złożyć egzamin jak w sali. */
export const cemSessionCodes = (exam: ExamId) =>
  index.typy[TYPE[exam]].sesje.filter((s) => s.pelna).map((s) => s.sesja);

/** Wersja pliku sesji (hash treści z normalizatora) — do `?v=` przy niezmiennym cache. */
export const cemVersion = (code: string) =>
  Object.values(index.typy).flatMap((t) => t.sesje).find((s) => s.sesja === code)?.v ?? '';

/**
 * Pytania typu „Prawidłowa odpowiedź to:” mają twierdzenia wpisane w treść:
 * „wstęp: 1) …; 2) …; 3) …. Prawidłowa odpowiedź to:” → text + items + tail.
 * Tylko przy numeracji 1)…n) i co najmniej dwóch twierdzeniach — inaczej treść zostaje w całości.
 * Twierdzenia z dwóch kolumn arkusza normalizator czyta wierszami („1) …; 4) …; 2) …; 5) …”) —
 * gdy numery są permutacją 1…n, układamy je po numerze. Inaczej „n)” nie na swoim miejscu
 * należy do tekstu twierdzenia („zmiany LSIL (CIN 1) ustępują”).
 */
export function splitItems(t: string): { text: string; items?: string[]; tail?: string } {
  const parts = t.split(/\s(?=\d{1,2}\)\s)/);
  if (parts.length < 3) return { text: t };
  let tail: string | undefined;
  const found: { n: number; text: string }[] = [];
  for (const [i, part] of parts.slice(1).entries()) {
    const m = part.match(/^(\d{1,2})\)\s([\s\S]*)$/);
    if (!m) return { text: t };
    let item = m[2];
    if (i === parts.length - 2) {
      const mm = item.match(/^(.*?[.;])\s+(Prawidłowa odpowiedź to:.*)$/);
      if (mm) { item = mm[1]; tail = mm[2]; }
    }
    found.push({ n: Number(m[1]), text: item });
  }
  const sorted = [...found].sort((a, b) => a.n - b.n);
  let items: string[];
  if (sorted.every((x, k) => x.n === k + 1)) {
    const moved = sorted.some((x, k) => x !== found[k]);
    // Po przestawieniu wyrównujemy interpunkcję: „;” między twierdzeniami, „.” na końcu
    items = sorted.map((x, k) => (moved ? x.text.replace(/[.;]$/, k === sorted.length - 1 ? '.' : ';') : x.text));
  } else {
    items = [];
    for (const x of found) {
      if (x.n === items.length + 1) items.push(x.text);
      else if (items.length) items[items.length - 1] += ` ${x.n}) ${x.text}`;
      else return { text: t };
    }
    if (items.length < 2) return { text: t };
  }
  return { text: parts[0], items, ...(tail && { tail }) };
}

/** Pytania jednej sesji w modelu modułu — liczone raz na build (czytają je sesje, BANK i endpoint). */
const converted = new Map<string, ExamQuestion[]>();
export function cemQuestions(code: string): ExamQuestion[] {
  const done = converted.get(code);
  if (done) return done;
  const where = parseSessionCode(code);
  if (!where) throw new Error(`[egzamin] nieznany kod sesji: ${code}`);
  const questions = raw(code).pytania.map((q): ExamQuestion => {
    if (q.w.length !== 5) throw new Error(`[egzamin] ${code}:${q.nr} — ${q.w.length} odpowiedzi zamiast 5`);
    const flags: QuestionFlag[] = [
      ...(q.o === null ? ['invalidated' as const] : []),
      ...(q.nz ? ['outdated' as const] : []),
      ...(q.uc ? ['truncated' as const] : []),
    ];
    return {
      id: questionId(code, q.nr),
      exam: where.exam,
      session: where.session,
      nr: q.nr,
      field: q.d ?? '',
      ...splitItems(q.t),
      answers: q.w as ExamQuestion['answers'],
      correct: q.o ?? -1,
      stats: (q.p as ExamQuestion['stats']) ?? null,
      difficulty: q.tr,
      inBase: q.b === undefined ? null : q.b === 1,
      ...(flags.length && { flags }),
    };
  });
  converted.set(code, questions);
  return questions;
}

/** Sesje do kreatora: wspólna lista lat i pór dla LEK i LDEK, z plikami i liczbą pytań per dziedzina. */
export function cemSessions(): SessionInfo[] {
  const exams: ExamId[] = ['lek', 'ldek'];
  const byId = new Map<string, SessionInfo>();
  for (const exam of exams) {
    for (const code of cemSessionCodes(exam)) {
      const { session } = parseSessionCode(code)!;
      const [year, season] = session.split('-');
      const questions = cemQuestions(code);
      const fieldCounts: Record<string, number> = {};
      for (const q of questions) if (q.field) fieldCounts[q.field] = (fieldCounts[q.field] ?? 0) + 1;
      const s = byId.get(session) ?? {
        id: session,
        label: `${season === 'wiosna' ? 'wiosna' : 'jesień'} ${year}`,
        year: Number(year),
        season: season as SessionInfo['season'],
        count: questions.length,
        files: {},
        fieldCounts: {},
      };
      s.files[exam] = `/egzamin/dane/${code}.json?v=${cemVersion(code)}`;
      s.fieldCounts[exam] = fieldCounts;
      byId.set(session, s);
    }
  }
  return [...byId.values()].sort((a, b) => b.year - a.year || (a.season === 'jesien' ? -1 : 1));
}
