/**
 * window.lek — interfejs dla asystentów AI. Te same operacje co w UI (przez ExamSession),
 * więc agent i człowiek widzą jeden stan, a ekran odświeża się sam.
 * Test, w którym odpowiadał agent, oznaczamy i nie wysyłamy do statystyk użytkowników.
 */
import { LETTERS, isCounted } from './engine';
import { notes } from './storage';
import type { ExamSession } from './session';
import type { ExamId, FieldInfo, ModeId, ModeInfo, SessionInfo, TestConfig } from './types';

export interface LekHost {
  modes: ModeInfo[];
  sessions: SessionInfo[];
  fields: Record<ExamId, FieldInfo[]>;
  start(config: TestConfig, agent: boolean): Promise<ExamSession>;
  current(): ExamSession | null;
}

const OPIS =
  'Moduł egzaminacyjny LEK/LDEK na jawnej bazie CEM (zarobkilekarzy.pl). Wszystkie funkcje zwracają Promise. ' +
  'Start: await rozpocznij(tryb, sesja, { egzamin, dziedzina, losowo }) — tryby: nauka, szybki, egzamin; sesje: sesje(). ' +
  'Pytania partiami: pytania(od, do); odpowiedzi partiami: odpowiedzi({ nr: litera }); pojedynczo: pytanie(nr), odpowiedz(litera, nr). ' +
  'Numery 1–N w kolejności testu. Na koniec zakoncz(), potem wynik(). Odpowiadaj z własnej wiedzy.';

export function createLekApi(host: LekHost) {
  const active = () => {
    const s = host.current();
    if (!s) throw new Error('Brak aktywnego testu. Zacznij od rozpocznij(tryb, sesja).');
    return s;
  };
  const indexOf = (s: ExamSession, nr?: number) => {
    const i = nr === undefined ? s.state.current : nr - 1;
    if (!Number.isInteger(i) || i < 0 || i >= s.total) throw new Error(`Numer pytania: 1–${s.total}.`);
    return i;
  };
  const choiceOf = (letter: string) => {
    const k = LETTERS.indexOf(String(letter).trim().toUpperCase() as (typeof LETTERS)[number]);
    if (k < 0) throw new Error('Litera odpowiedzi: A–E.');
    return k;
  };
  const markAgent = (s: ExamSession) => { s.state.agent = true; };

  const view = (s: ExamSession, i: number) => {
    const q = s.questions[i];
    const answer = s.answerOf(i);
    const reveal = s.finished || (s.mode.instant && answer !== undefined);
    return {
      nr: i + 1,
      dziedzina: host.fields[q.exam].find((f) => f.id === q.field)?.label ?? q.field,
      tresc: q.text,
      ...(q.items && { twierdzenia: q.items.map((t, k) => `${k + 1}) ${t}`) }),
      ...(q.tail && { dopisek: q.tail }),
      odpowiedzi: Object.fromEntries(LETTERS.map((l, k) => [l, q.answers[k]])),
      uniewaznione: !isCounted(q),
      twojaOdpowiedz: answer === undefined ? null : LETTERS[answer],
      oznaczone: s.isFlagged(i),
      ...(reveal && {
        prawidlowa: LETTERS[q.correct] ?? null,
        statystyka: q.stats && Object.fromEntries(LETTERS.map((l, k) => [l, q.stats![k]])),
      }),
    };
  };

  const stan = () => {
    const s = host.current();
    if (!s) return { aktywny: false };
    return {
      aktywny: !s.finished,
      tryb: s.mode.id,
      sesja: s.state.config.session,
      pytanie: s.state.current + 1,
      pytan: s.total,
      odpowiedzi: s.answeredCount,
      oznaczone: s.state.flags.length,
      pozostalyCzasSek: s.timed ? Math.round((s.remaining() ?? 0) / 1000) : null,
      zakonczony: s.finished,
    };
  };

  const answer = (s: ExamSession, letter: string, i: number) => {
    const reason = s.lockReason(i);
    if (reason) return { nr: i + 1, przyjeto: false, powod: reason };
    markAgent(s);
    s.answer(choiceOf(letter), i);
    const q = s.questions[i];
    return { nr: i + 1, przyjeto: true, ...(s.mode.instant && { poprawna: s.answerOf(i) === q.correct, prawidlowa: LETTERS[q.correct] }) };
  };

  const api = {
    opis: OPIS,
    sesje: () => host.sessions.map((s) => ({ id: s.id, nazwa: s.label, pytan: s.count })),
    dziedziny: (egzamin: ExamId = 'lek') => host.fields[egzamin].map((f) => ({ id: f.id, nazwa: f.label })),
    async rozpocznij(tryb: ModeId = 'szybki', sesja = host.sessions[0].id, opcje: { egzamin?: ExamId; dziedzina?: string; losowo?: boolean } = {}) {
      if (!host.modes.some((m) => m.id === tryb)) throw new Error(`Tryb: ${host.modes.map((m) => m.id).join(', ')}.`);
      if (sesja !== 'all' && !host.sessions.some((s) => s.id === sesja)) throw new Error(`Nieznana sesja. Dostępne: ${host.sessions.map((s) => s.id).join(', ')}.`);
      await host.start({ exam: opcje.egzamin ?? 'lek', mode: tryb, session: sesja, field: opcje.dziedzina ?? 'all', shuffle: Boolean(opcje.losowo) }, true);
      return stan();
    },
    stan,
    pytanie: (nr?: number) => { const s = active(); return view(s, indexOf(s, nr)); },
    pytania: (od = 1, do_ = od + 19) => {
      const s = active();
      const from = indexOf(s, od), to = indexOf(s, Math.min(do_, s.total));
      return Array.from({ length: to - from + 1 }, (_, k) => view(s, from + k));
    },
    odpowiedz: (litera: string, nr?: number) => { const s = active(); return answer(s, litera, indexOf(s, nr)); },
    odpowiedzi: (mapa: Record<number, string>) => {
      const s = active();
      const wyniki = Object.entries(mapa).map(([nr, l]) => answer(s, l, indexOf(s, Number(nr))));
      return { przyjeto: wyniki.filter((w) => w.przyjeto).length, odrzucono: wyniki.filter((w) => !w.przyjeto) };
    },
    dalej: () => { const s = active(); s.next(); return view(s, s.state.current); },
    wstecz: () => { const s = active(); s.prev(); return view(s, s.state.current); },
    oznacz: (nr?: number) => { const s = active(); const i = indexOf(s, nr); s.toggleFlag(i); return { nr: i + 1, oznaczone: s.isFlagged(i) }; },
    notatka: (tekst: string, nr?: number) => { const s = active(); const i = indexOf(s, nr); notes.set(s.questions[i].id, tekst); return { nr: i + 1, zapisano: true }; },
    bezOdpowiedzi: () => active().blanks().map((i) => i + 1),
    zakoncz: () => { const s = active(); markAgent(s); s.finish(); return api.wynik(); },
    wynik: () => {
      const s = active();
      if (!s.finished) throw new Error('Wynik i prawidłowe odpowiedzi będą dostępne po zakoncz().');
      const r = s.result();
      return {
        punkty: r.points, maksimum: r.max, prog: r.threshold, zdany: r.passed,
        procent: r.max ? Math.round((r.points / r.max) * 1000) / 10 : 0,
        przecietnyZdajacy: Math.round(r.average * 10) / 10,
        bledne: r.wrong, bezOdpowiedzi: r.blank, uniewaznione: r.invalidated,
        wedlugDziedzin: r.byField.map((f) => ({ dziedzina: f.field, punkty: f.points, maksimum: f.max })),
      };
    },
  };

  // Kontrakt: każda funkcja zwraca Promise (agent zawsze używa await)
  return Object.fromEntries(
    Object.entries(api).map(([k, v]) => [k, typeof v === 'function' ? (...a: unknown[]) => Promise.resolve().then(() => (v as (...x: unknown[]) => unknown)(...a)) : v]),
  );
}
