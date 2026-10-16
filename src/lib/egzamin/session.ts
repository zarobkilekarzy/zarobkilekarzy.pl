/**
 * Rozwiązywany test: stan + reguły zmian + zapis w przeglądarce.
 * UI i window.lek sterują testem wyłącznie przez te metody i słuchają zdarzenia `change`
 * (detail = rodzaj zmiany), więc obie drogi zawsze widzą to samo.
 */
import { elapsedAt, isCounted, remainingAt, scoreTest } from './engine';
import { testStore, weak } from './storage';
import type { ExamQuestion, ModeInfo, TestResult, TestState } from './types';

export type Change = 'answer' | 'move' | 'flag' | 'time' | 'finish';

export class ExamSession extends EventTarget {
  constructor(
    public state: TestState,
    public readonly questions: ExamQuestion[],
    public readonly mode: ModeInfo,
    private readonly threshold: number,
  ) {
    super();
  }

  get question() { return this.questions[this.state.current]; }
  get total() { return this.questions.length; }
  get finished() { return this.state.finishedAt !== null; }
  get timed() { return this.state.limit !== null; }
  /** prawidłową odpowiedź widać od razu (nauka) albo po zakończeniu */
  get reveals() { return this.mode.instant || this.finished; }
  get answeredCount() { return Object.keys(this.state.answers).length; }

  answerOf(i = this.state.current) { return this.state.answers[i]; }
  isFlagged(i = this.state.current) { return this.state.flags.includes(i); }
  remaining(now = Date.now()) { return remainingAt(this.state, now); }
  elapsed(now = Date.now()) { return elapsedAt(this.state, now); }

  /** Dlaczego odpowiedź nie zostanie przyjęta — albo null, gdy można odpowiadać. */
  lockReason(i = this.state.current): string | null {
    if (this.finished) return 'Test jest zakończony.';
    if (this.state.paused) return 'Test jest wstrzymany.';
    if (!isCounted(this.questions[i])) return 'Pytanie unieważnione przez CEM — odpowiedź nie jest przyjmowana.';
    if (this.mode.instant && this.answerOf(i) !== undefined) return 'W trybie nauki odpowiedzi nie można zmienić.';
    return null;
  }

  answer(choice: number, i = this.state.current) {
    if (this.lockReason(i) !== null || choice < 0 || choice > 4) return false;
    this.state.answers[i] = choice;
    // Nauka i powtórka zasilają listę słabych pytań od razu (test z wynikiem na końcu — client/app.ts)
    if (this.mode.instant && !this.state.agent) weak.record(this.questions[i].id, choice === this.questions[i].correct);
    this.commit('answer');
    return true;
  }

  go(i: number) {
    const next = Math.max(0, Math.min(this.total - 1, i));
    if (next === this.state.current) return;
    this.state.current = next;
    this.commit('move');
  }
  next() { this.go(this.state.current + 1); }
  prev() { this.go(this.state.current - 1); }

  toggleFlag(i = this.state.current) {
    const { flags } = this.state;
    this.state.flags = flags.includes(i) ? flags.filter((f) => f !== i) : [...flags, i].sort((a, b) => a - b);
    this.commit('flag');
  }

  /** Pierwsze pytanie bez odpowiedzi (z pominięciem unieważnionych) albo -1. */
  firstBlank() {
    return this.questions.findIndex((q, i) => isCounted(q) && this.answerOf(i) === undefined);
  }

  blanks() {
    return this.questions.flatMap((q, i) => (isCounted(q) && this.answerOf(i) === undefined ? [i] : []));
  }

  pause() {
    if (!this.timed || this.state.paused || this.finished) return;
    this.state.elapsed = this.elapsed();
    this.state.paused = true;
    this.commit('time');
  }

  resume() {
    if (!this.state.paused || this.finished) return;
    this.state.paused = false;
    this.state.tickAt = Date.now();
    this.commit('time');
  }

  finish() {
    if (this.finished) return;
    this.state.elapsed = Math.min(this.elapsed(), this.state.limit ?? Infinity);
    this.state.paused = false;
    this.state.finishedAt = Date.now();
    this.commit('finish');
  }

  result(): TestResult {
    return scoreTest(this.state, this.questions, this.threshold, this.mode.instant);
  }

  /** Zaksięgowanie czasu i zapis — także przy zamknięciu karty. */
  save() {
    if (!this.state.paused && !this.finished) {
      const now = Date.now();
      this.state.elapsed = elapsedAt(this.state, now);
      this.state.tickAt = now;
    }
    testStore.save(this.state);
  }

  private commit(change: Change) {
    this.save();
    this.dispatchEvent(new CustomEvent<Change>('change', { detail: change }));
  }
}
