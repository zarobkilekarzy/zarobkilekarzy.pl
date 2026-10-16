/**
 * Model modułu egzaminacyjnego LEK/LDEK — wspólny dla danych (build), silnika i UI (przeglądarka).
 * Pola odpowiadają temu, co publikuje CEM: treść, odpowiedzi A–E, klucz i statystyka sali.
 */

export type ExamId = 'lek' | 'ldek';
export type ModeId = 'nauka' | 'szybki' | 'egzamin';

/** Uwagi do pytania z bazy CEM — każda zmienia sposób prezentacji albo liczenia. */
export type QuestionFlag =
  /** zgłoszone w bazie CEM jako niezgodne z aktualną wiedzą (na egzaminie liczone) */
  | 'outdated'
  /** unieważnione przez CEM — nie liczy się do wyniku, obniża maksimum */
  | 'invalidated'
  /** przy pobieraniu z CEM mógł wypaść fragment od znaku „<” */
  | 'truncated';

/** Treść pytania bez osadzenia w sesji. */
export interface QuestionBody {
  exam: ExamId;
  /** id dziedziny (zob. FIELDS w data/egzamin.ts); '' = sesja sprzed 2021 r., bez podziału na dziedziny */
  field: string;
  /** treść pytania; przy pytaniach wielokrotnego wyboru — wstęp przed listą twierdzeń */
  text: string;
  /** numerowane twierdzenia 1) 2) 3)… (pytania typu „Prawidłowa odpowiedź to:”) */
  items?: string[];
  /** zdanie po liście twierdzeń, np. „Prawidłowa odpowiedź to:” */
  tail?: string;
  /** dokładnie 5 odpowiedzi A–E */
  answers: [string, string, string, string, string];
  /** indeks prawidłowej odpowiedzi 0–4; -1 = pytanie unieważnione (bez klucza) */
  correct: number;
  /** odsetek zdających, którzy wybrali A–E (reszta to brak odpowiedzi); null = brak statystyki */
  stats: [number, number, number, number, number] | null;
  /** wskaźnik trudności CEM (odsetek poprawnych w całej sali); brak = liczony ze `stats` */
  difficulty?: number | null;
  /** czy pytanie było w jawnej bazie CEM przed egzaminem; null = nie da się ustalić (starsze sesje) */
  inBase: boolean | null;
  flags?: QuestionFlag[];
}

/** Pytanie osadzone w sesji — jednostka, na której pracuje silnik. */
export interface ExamQuestion extends QuestionBody {
  /** stabilny identyfikator (notatki, postęp): kod sesji CEM i numer, np. `20262:15`, `ldek-20262:15` (lib/egzamin/ids.ts) */
  id: string;
  session: string;
  /** numer pytania w sesji (1–200) */
  nr: number;
}

export interface SessionInfo {
  /** np. „2026-jesien” */
  id: string;
  /** np. „jesień 2026” */
  label: string;
  year: number;
  season: 'wiosna' | 'jesien';
  count: number;
  /** plik pytań sesji per egzamin: /egzamin/dane/<kod>.json?v=<hash> */
  files: Partial<Record<ExamId, string>>;
  /** liczba pytań w każdej dziedzinie (puste dla sesji bez podziału na dziedziny) */
  fieldCounts: Partial<Record<ExamId, Record<string, number>>>;
}

export interface FieldInfo {
  id: string;
  label: string;
  /** skrót do wąskich miejsc (mapa, tabela wyników) */
  short: string;
}

export interface ModeInfo {
  id: ModeId;
  label: string;
  desc: string;
  /** krótkie parametry trybu: „200 pytań”, „4 h”… */
  facts: string[];
  /** natychmiastowa odpowiedź po każdym pytaniu */
  instant: boolean;
  /** limit pytań (szybki test) */
  size?: number;
  /** minuty na pytanie (egzamin: 240 min / 200 pytań) */
  minutesPerQuestion?: number;
  /** tryb dopuszcza zawężenie dziedziny i „wszystkie sesje” */
  scoped: boolean;
}

export interface TestConfig {
  exam: ExamId;
  mode: ModeId;
  /** id sesji albo „all” */
  session: string;
  /** id dziedziny albo „all” */
  field: string;
  shuffle: boolean;
  /** jawna lista pytań (np. „powtórz błędne”) — omija dobór z sesji */
  ids?: string[];
}

/** Stan rozwiązywanego testu — zapisywany w przeglądarce po każdej zmianie. */
export interface TestState {
  v: 1;
  config: TestConfig;
  /** id pytań w kolejności testu */
  ids: string[];
  /** indeks pytania → indeks odpowiedzi 0–4 */
  answers: Record<number, number>;
  flags: number[];
  current: number;
  startedAt: number;
  /** czas netto (bez pauz) do chwili `tickAt` */
  elapsed: number;
  /** ostatnie „zaksięgowanie” czasu; po wczytaniu z pamięci = teraz (czas poza stroną się nie liczy) */
  tickAt: number;
  /** limit w ms; null = bez limitu */
  limit: number | null;
  paused: boolean;
  finishedAt: number | null;
  /** test rozwiązywał asystent AI przez window.lek — nie trafia do statystyk */
  agent?: boolean;
  /** wynik przekazany (albo celowo pominięty) do anonimowych statystyk — lib/egzamin/stats.ts */
  sent?: boolean;
  /** test nieporównywalny z innymi mimo `field: 'all'` (np. zakres kilku dziedzin z pierwszej wersji modułu) */
  incomparable?: boolean;
}

export interface FieldScore {
  field: string;
  points: number;
  max: number;
  /** oczekiwane punkty przeciętnego zdającego */
  average: number;
}

export interface TestResult {
  points: number;
  /** pytania liczone do wyniku (bez unieważnionych) */
  max: number;
  threshold: number;
  passed: boolean;
  /** oczekiwane punkty przeciętnego zdającego (suma wskaźników trudności) */
  average: number;
  correct: number;
  wrong: number;
  blank: number;
  invalidated: number;
  elapsed: number;
  byField: FieldScore[];
  /** pytania z jawnej bazy vs nowe (tylko gdy da się ustalić) */
  byOrigin: { base: FieldScore; fresh: FieldScore } | null;
}
