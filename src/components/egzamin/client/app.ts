/**
 * <zl-exam> — kontroler modułu: kreator → test (okno pełnoekranowe) → wynik.
 * Stan testu żyje w ExamSession (lib/egzamin), tu jest tylko UI: render w odpowiedzi
 * na zdarzenie `change`, klawiatura, mapa, pauza, historia przeglądarki i window.lek.
 */
import { createLekApi } from '@/lib/egzamin/api';
import { createTest, isCounted, selectQuestions, statusOf, type Status } from '@/lib/egzamin/engine';
import { ExamSession, type Change } from '@/lib/egzamin/session';
import { loadPool } from '@/lib/egzamin/source';
import { notes, prefs, testStore } from '@/lib/egzamin/storage';
import type { ExamId, ExamQuestion, FieldInfo, ModeInfo, SessionInfo, TestConfig, TestState } from '@/lib/egzamin/types';
import { formatPL, plural } from '@/lib/format';
import * as R from './render';
import { initBank } from './bank';
import * as Res from './result';

export interface ClientConfig {
  rules: { questions: number; minutes: number; threshold: number };
  modes: ModeInfo[];
  exams: { id: ExamId; label: string; name: string }[];
  sessions: SessionInfo[];
  fields: Record<ExamId, FieldInfo[]>;
  distribution: number[];
  /** adres banku pytań z miejscem na egzamin: /egzamin/{exam}.json */
  bankUrl: string;
}

declare global {
  interface Window { lek?: Record<string, unknown> }
}

const MAP_PAGE = 200;
const REVIEW_PAGE = 25;
const WIDE = '(min-width: 1181px)';
type MapFilter = 'all' | 'blank' | 'flag' | 'note' | 'wrong';

const STATUS_LABEL: Record<Status, string> = {
  blank: 'bez odpowiedzi', answered: 'z odpowiedzią', correct: 'dobrze', wrong: 'źle', void: 'unieważnione',
};

class ZlExam extends HTMLElement {
  cfg!: ClientConfig;
  session: ExamSession | null = null;

  private form!: HTMLFormElement;
  private dialog!: HTMLDialogElement;
  private confirmDlg!: HTMLDialogElement;
  private keysDlg!: HTMLDialogElement;
  private ui!: Record<string, HTMLElement>;

  private mapFilter: MapFilter = 'all';
  private mapPage = 0;
  private noteOpen = false;
  private reviewFilter: Res.ReviewFilter = 'all';
  private reviewShown = REVIEW_PAGE;
  private ticker = 0;
  private noteTimer = 0;
  private wide = window.matchMedia(WIDE);

  connectedCallback() {
    this.cfg = JSON.parse(this.q('[data-config]').textContent ?? '{}');
    this.form = this.q('[data-setup]');
    this.dialog = this.q('[data-runner]');
    this.confirmDlg = this.q('[data-confirm]');
    this.keysDlg = this.q('[data-keys]');
    this.ui = Object.fromEntries(
      [
        'shell', 'mode', 'session', 'count', 'score', 'ok', 'bad', 'timer-wrap', 'timer', 'bar', 'main', 'question',
        'feedback-slot', 'note-slot', 'pause', 'pause-time', 'map-filters', 'map-pages', 'map-grid', 'next-label',
        'result', 'res-title', 'res-body', 'res-scroll', 'resume', 'announce',
      ].map((k) => [k, this.q(`[data-${k}]`)]),
    );

    this.bindSetup();
    this.bindRunner();
    this.renderResume();
    this.syncSetup();

    window.lek = createLekApi({
      modes: this.cfg.modes,
      sessions: this.cfg.sessions,
      fields: this.cfg.fields,
      start: (config, agent) => this.start(config, agent),
      current: () => this.session,
    });

    // Odświeżenie strony w trakcie testu wraca prosto do pytania
    if (location.hash === '#test' && testStore.load()?.finishedAt === null) {
      history.replaceState(null, '', location.pathname + location.search);
      void this.resumeStored();
    }
  }

  private q<T extends HTMLElement>(sel: string) {
    return this.querySelector(sel) as T;
  }

  /* ======================================================================
     Kreator
     ====================================================================== */

  private get exam() { return this.value('exam') as ExamId; }
  private value(name: string) {
    return (this.form.elements.namedItem(name) as RadioNodeList | null)?.value ?? '';
  }
  private modeOf(id: string) { return this.cfg.modes.find((m) => m.id === id) ?? this.cfg.modes[0]; }
  private sessionLabel(id: string) {
    return id === 'all' ? 'wszystkie sesje' : (this.cfg.sessions.find((s) => s.id === id)?.label ?? id);
  }
  private examLabel(id: ExamId) { return this.cfg.exams.find((e) => e.id === id)?.label ?? id.toUpperCase(); }
  private fieldLabel = (id: string) =>
    Object.values(this.cfg.fields).flat().find((f) => f.id === id)?.label ?? id;

  private readConfig(): TestConfig {
    return {
      exam: this.exam,
      mode: this.value('mode') as TestConfig['mode'],
      session: this.value('session'),
      field: this.value('field') || 'all',
      shuffle: (this.form.elements.namedItem('shuffle') as HTMLInputElement).checked,
    };
  }

  private bindSetup() {
    let lastExam = this.exam;
    this.form.addEventListener('change', () => {
      if (this.exam !== lastExam) {
        lastExam = this.exam;
        this.form.querySelectorAll<HTMLElement>('[data-fields]').forEach((group) => {
          group.hidden = group.dataset.fields !== this.exam;
          if (!group.hidden) group.querySelector<HTMLInputElement>('input[value="all"]')!.checked = true;
        });
      }
      this.syncSetup();
    });
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.start(this.readConfig());
    });
    // Pytania pobieramy, zanim padnie „Rozpocznij” (plik jest mały, a start ma być natychmiastowy)
    const warm = () => {
      const exam = this.exam;
      void loadPool(exam, this.cfg.bankUrl, this.cfg.sessions).then((p) => { this.pools.set(exam, p); this.syncSetup(); }, () => {});
      initBank(this.q('[data-bank]'), this.cfg, this.fieldLabel, (id) => this.sessionLabel(id));
    };
    // Safari nie ma requestIdleCallback
    if ('requestIdleCallback' in window) requestIdleCallback(warm);
    else setTimeout(warm, 300);

    this.ui.resume.addEventListener('click', (e) => {
      const act = (e.target as Element).closest<HTMLElement>('[data-resume-act]')?.dataset.resumeAct;
      if (act === 'resume') void this.resumeStored();
      if (act === 'drop') { testStore.clear(); this.renderResume(); }
    });
  }

  /** Blokady zależne od trybu + podsumowanie testu obok kreatora. */
  private syncSetup() {
    const mode = this.modeOf(this.value('mode'));
    // Zakres: wyłączony w pełnym egzaminie; dziedziny drugiego egzaminu zawsze wyłączone (ukryte)
    const scope = this.q('[data-scope]');
    scope.toggleAttribute('data-disabled', !mode.scoped);
    scope.querySelectorAll('input').forEach((input) => {
      input.disabled = !mode.scoped || Boolean(input.closest<HTMLElement>('[data-fields]')?.hidden);
    });
    this.q('[data-hint="scope"]').hidden = mode.scoped;

    const all = this.form.querySelector<HTMLInputElement>('input[name="session"][value="all"]')!;
    all.disabled = !mode.scoped;
    if (!mode.scoped && all.checked) {
      this.form.querySelector<HTMLInputElement>('input[name="session"]:not([value="all"])')!.checked = true;
    }
    this.q('[data-hint="session"]').hidden = mode.scoped;

    const config = this.readConfig();
    const count = this.countFor(config, mode);
    const time = mode.minutesPerQuestion && count ? this.formatMinutes(count * mode.minutesPerQuestion) : 'bez limitu';
    const scopeText = !mode.scoped ? 'cała sesja'
      : `${config.field === 'all' ? 'wszystkie dziedziny' : this.fieldLabel(config.field)}${config.shuffle ? ', losowo' : ''}`;

    this.setSum('mode', mode.label);
    this.setSum('session', `${this.examLabel(config.exam)} · ${this.sessionLabel(config.session)}`);
    this.setSum('count', count === null ? '…' : `${formatPL(count)} ${plural(count, ['pytanie', 'pytania', 'pytań'])}`);
    this.setSum('time', time);
    this.setSum('scope', scopeText);
  }

  private setSum(key: string, text: string) {
    const el = this.form.querySelector(`[data-sum="${key}"]`);
    if (el) el.textContent = text;
  }

  /** Liczba pytań testu — dokładna, gdy bank jest już w pamięci; inaczej z liczb sesji. */
  private countFor(config: TestConfig, mode: ModeInfo): number | null {
    const sessions = config.session === 'all' && mode.scoped ? this.cfg.sessions : this.cfg.sessions.filter((s) => s.id === config.session);
    const total = sessions.reduce((n, s) => n + s.count, 0);
    if (config.field !== 'all' && mode.scoped) return this.cachedCount(config, mode);
    return mode.size ? Math.min(mode.size, total) : total;
  }

  private pools = new Map<ExamId, ExamQuestion[]>();
  private cachedCount(config: TestConfig, mode: ModeInfo) {
    const pool = this.pools.get(config.exam);
    if (!pool) {
      void loadPool(config.exam, this.cfg.bankUrl, this.cfg.sessions).then((p) => { this.pools.set(config.exam, p); this.syncSetup(); }, () => {});
      return null;
    }
    return selectQuestions(pool, config, mode).length;
  }

  private formatMinutes(min: number) {
    const m = Math.round(min);
    return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
  }

  /** Karta „Wznów test” / „Ostatni wynik” nad kreatorem. */
  private renderResume() {
    const s = testStore.load();
    const box = this.ui.resume;
    if (!s || s.ids.length === 0) { box.hidden = true; box.innerHTML = ''; return; }
    const mode = this.modeOf(s.config.mode);
    const title = `${mode.label} · ${this.examLabel(s.config.exam)} ${this.sessionLabel(s.config.session)}`;
    const answered = Object.keys(s.answers).length;

    if (s.finishedAt === null) {
      const left = s.limit === null ? '' : `<span>${R.icon('clock', 14)} ${R.clock(s.limit - s.elapsed)} do końca</span>`;
      box.innerHTML = `<div class="resume__card">
        <div>
          <p class="mono-label">Niedokończony test · zapisany w tej przeglądarce</p>
          <p class="resume__title">${R.esc(title)}</p>
          <p class="resume__meta">
            <span class="resume__bar"><span style="width:${(answered / s.ids.length) * 100}%"></span></span>
            <span>${answered} / ${s.ids.length} odpowiedzi</span>${left}
          </p>
        </div>
        <div class="resume__actions">
          <button type="button" class="resume__drop" data-resume-act="drop">Porzuć</button>
          <button type="button" class="act-resume" data-resume-act="resume">Wznów test ${R.icon('arrow')}</button>
        </div>
      </div>`;
    } else {
      box.innerHTML = `<div class="resume__card resume__card--done">
        <div>
          <p class="mono-label">Ostatni test · ukończony</p>
          <p class="resume__title">${R.esc(title)}</p>
          <p class="resume__meta"><span>${answered} / ${s.ids.length} odpowiedzi</span><span>czas ${R.clock(s.elapsed)}</span></p>
        </div>
        <div class="resume__actions">
          <button type="button" class="resume__drop" data-resume-act="drop">Usuń</button>
          <button type="button" class="act-resume act-resume--ghost" data-resume-act="resume">Zobacz podsumowanie ${R.icon('arrow')}</button>
        </div>
      </div>`;
    }
    box.hidden = false;
  }

  /* ======================================================================
     Start, wznowienie, otwieranie i zamykanie
     ====================================================================== */

  async start(config: TestConfig, agent = false) {
    const button = this.form.querySelector<HTMLElement>('[data-start]');
    button?.setAttribute('aria-busy', 'true');
    try {
      const pool = await loadPool(config.exam, this.cfg.bankUrl, this.cfg.sessions);
      this.pools.set(config.exam, pool);
      const mode = this.modeOf(config.mode);
      const questions = selectQuestions(pool, config, mode);
      if (questions.length === 0) throw new Error('Brak pytań w tym zakresie.');
      const state = createTest(questions, config, mode);
      if (agent) state.agent = true;
      this.attach(new ExamSession(state, questions, mode, this.cfg.rules.threshold));
      this.session!.save();
      this.open();
      return this.session!;
    } catch (err) {
      this.setSum('count', 'Nie udało się wczytać pytań — spróbuj ponownie');
      throw err;
    } finally {
      button?.removeAttribute('aria-busy');
    }
  }

  private async resumeStored() {
    const state = testStore.load();
    if (!state) return;
    const pool = await loadPool(state.config.exam, this.cfg.bankUrl, this.cfg.sessions);
    const byId = new Map(pool.map((q) => [q.id, q]));
    const questions = state.ids.map((id) => byId.get(id)).filter((q): q is ExamQuestion => Boolean(q));
    if (questions.length !== state.ids.length) { testStore.clear(); this.renderResume(); return; }
    // Czas poza stroną się nie liczy
    const restored: TestState = { ...state, tickAt: Date.now() };
    this.attach(new ExamSession(restored, questions, this.modeOf(state.config.mode), this.cfg.rules.threshold));
    this.open();
  }

  private onChange = (e: Event) => this.update((e as CustomEvent<Change>).detail);

  private attach(session: ExamSession) {
    this.session?.removeEventListener('change', this.onChange);
    this.session = session;
    session.addEventListener('change', this.onChange);
    this.mapFilter = 'all';
    this.mapPage = Math.floor(session.state.current / MAP_PAGE);
    this.noteOpen = notes.has(session.question.id);
    this.reviewFilter = 'all';
    this.reviewShown = REVIEW_PAGE;

    const { config } = session.state;
    this.ui.mode.textContent = session.mode.label;
    this.ui.session.textContent = `${this.examLabel(config.exam)} · ${config.ids ? 'powtórka błędnych' : this.sessionLabel(config.session)}`;
    this.dialog.toggleAttribute('data-reveal', session.mode.instant);
    this.ui.score.hidden = !session.mode.instant;
    this.ui['timer-wrap'].hidden = !session.timed;
    this.dialog.dataset.size = String(prefs.get().size);
    this.setMap(this.wide.matches && prefs.get().map, false);
  }

  private open() {
    if (!this.dialog.open) {
      this.dialog.showModal();
      if (history.state?.lek !== true) history.pushState({ lek: true }, '', '#test');
    }
    if (this.session!.finished) this.showResult();
    else {
      this.ui.shell.hidden = false;
      this.ui.result.hidden = true;
      this.renderRunner();
      this.ui.main.scrollTop = 0;
      this.focusQuestion();
    }
    this.startTicker();
  }

  /** Wyjście z okna: test na czas staje, postęp zostaje zapisany. */
  private exit() {
    const pushed = history.state?.lek === true;
    this.close();
    // Zdejmujemy wpis #test, żeby „Wstecz” nie otwierało testu ponownie
    if (pushed) history.back();
  }

  private close() {
    if (!this.dialog.open) return;
    this.session?.pause();
    this.session?.save();
    this.stopTicker();
    if (document.fullscreenElement) void document.exitFullscreen();
    this.dialog.close();
    this.renderResume();
  }

  /* ======================================================================
     Okno testu: zdarzenia
     ====================================================================== */

  private bindRunner() {
    this.dialog.addEventListener('click', (e) => this.onClick(e));
    // Na dokumencie, nie na oknie: po przerenderowaniu fokus może na chwilę wypaść na <body>
    document.addEventListener('keydown', (e) => this.dialog.open && this.onKey(e));
    this.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (this.dialog.hasAttribute('data-map-open') && !this.wide.matches) this.setMap(false);
      else this.exit();
    });
    this.dialog.addEventListener('input', (e) => {
      if ((e.target as Element).matches('[data-note-input]')) this.onNoteInput(e.target as HTMLTextAreaElement);
    });
    this.dialog.addEventListener('toggle', (e) => this.onReviewToggle(e), true);

    this.confirmDlg.addEventListener('close', () => {
      if (this.confirmDlg.returnValue === 'finish') this.session?.finish();
    });
    window.addEventListener('popstate', () => {
      if (this.dialog.open && history.state?.lek !== true) this.close();
    });
    window.addEventListener('pagehide', () => this.session?.save());
    document.addEventListener('visibilitychange', () => document.hidden && this.session?.save());
    this.wide.addEventListener('change', () => this.session && this.setMap(this.wide.matches && prefs.get().map, false));

    const fs = this.dialog.querySelector<HTMLElement>('[data-act="fullscreen"]');
    if (fs && document.fullscreenEnabled) fs.hidden = false;
  }

  private onClick(e: MouseEvent) {
    const t = e.target as Element;
    const s = this.session;
    if (!s) return;

    const choice = t.closest<HTMLElement>('[data-choice]');
    if (choice) return void s.answer(Number(choice.dataset.choice));

    const cell = t.closest<HTMLElement>('[data-go]');
    if (cell) {
      s.go(Number(cell.dataset.go));
      if (!this.wide.matches) this.setMap(false);
      return;
    }

    const mf = t.closest<HTMLElement>('[data-map-filter]');
    if (mf) { this.mapFilter = mf.dataset.mapFilter as MapFilter; return this.renderMap(); }
    const mp = t.closest<HTMLElement>('[data-map-page]');
    if (mp) { this.mapPage = Number(mp.dataset.mapPage); return this.renderMap(); }

    const rf = t.closest<HTMLElement>('[data-review-filter]');
    if (rf) {
      this.reviewFilter = rf.dataset.reviewFilter as Res.ReviewFilter;
      this.reviewShown = REVIEW_PAGE;
      this.q('[data-review-filters]').innerHTML = Res.reviewFilters(s, this.reviewFilter);
      return this.renderReview();
    }
    if (t.closest('[data-review-more]')) { this.reviewShown += REVIEW_PAGE; return this.renderReview(); }

    if (t.closest('[data-goto-blank]')) {
      this.confirmDlg.close('cancel');
      return s.go(s.firstBlank());
    }

    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    switch (act) {
      case 'exit': return this.exit();
      case 'prev': return s.prev();
      case 'next': return s.state.current === s.total - 1 ? this.askFinish() : s.next();
      case 'flag': return s.toggleFlag();
      case 'note': return this.toggleNote(true);
      case 'map': return this.setMap(!this.dialog.hasAttribute('data-map-open'));
      case 'finish': return this.askFinish();
      case 'pause': return s.pause();
      case 'resume': return s.resume();
      case 'keys': return this.keysDlg.showModal();
      case 'size': {
        const size = ((prefs.get().size + 1) % 3) as 0 | 1 | 2;
        prefs.set({ size });
        this.dialog.dataset.size = String(size);
        return this.announce(['Tekst normalny', 'Tekst większy', 'Tekst największy'][size]);
      }
      case 'fullscreen':
        return void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
      case 'new': return this.newTest();
      case 'retry': return void this.retryWrong();
      case 'share': return this.share();
    }
  }

  private onKey(e: KeyboardEvent) {
    const s = this.session;
    const t = e.target as Element;
    if (!s || e.metaKey || e.ctrlKey || e.altKey) return;
    if (this.confirmDlg.open || this.keysDlg.open || !this.ui.result.hidden) return;
    if (t.matches('input, textarea, select, [contenteditable]')) return;

    const key = e.key.toLowerCase();
    const k = 'abcde'.indexOf(key) >= 0 ? 'abcde'.indexOf(key) : '12345'.indexOf(key);
    const act =
      k >= 0 && key.length === 1 ? () => s.answer(k)
      : e.key === 'ArrowRight' || (e.key === 'Enter' && !t.matches('button, a, summary')) ? () => (s.state.current === s.total - 1 ? this.askFinish() : s.next())
      : e.key === 'ArrowLeft' ? () => s.prev()
      : key === 'f' ? () => s.toggleFlag()
      : key === 'n' ? () => this.toggleNote(true)
      : key === 'm' ? () => this.setMap(!this.dialog.hasAttribute('data-map-open'))
      : key === 'p' ? () => (s.state.paused ? s.resume() : s.pause())
      : e.key === '?' ? () => this.keysDlg.showModal()
      : null;
    if (!act) return;
    e.preventDefault();
    act();
  }

  /* ======================================================================
     Render testu
     ====================================================================== */

  private update(change: Change) {
    const s = this.session!;
    if (change === 'finish') return this.showResult();
    if (change === 'time') return this.renderTime();
    if (change === 'move') {
      this.noteOpen = notes.has(s.question.id);
      this.mapPage = Math.floor(s.state.current / MAP_PAGE);
    }
    const active = document.activeElement as HTMLElement | null;
    const hadFocusInQuestion = this.ui.question.contains(active);
    const focusedChoice = active?.dataset.choice;
    this.renderRunner();
    if (change === 'move') {
      this.ui.main.scrollTop = 0;
      this.focusQuestion();
      this.announce(`Pytanie ${s.state.current + 1} z ${s.total}`);
    }
    if (change === 'answer') {
      if (s.mode.instant) {
        const fb = this.ui['feedback-slot'].querySelector<HTMLElement>('[data-feedback]');
        fb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        this.announce(fb?.querySelector('.lq-fb__verdict')?.textContent ?? '');
        if (hadFocusInQuestion) this.q<HTMLElement>('[data-act="next"]').focus();
      } else if (hadFocusInQuestion) {
        this.ui.question.querySelector<HTMLElement>(`[data-choice="${s.answerOf()}"]`)?.focus();
      }
    } else if (change === 'flag' && hadFocusInQuestion) {
      // Render podmienił węzły — fokus wraca w to samo miejsce
      const same = focusedChoice === undefined ? '#lq-text' : `[data-choice="${focusedChoice}"]`;
      this.ui.question.querySelector<HTMLElement>(same)?.focus({ preventScroll: true });
    }
  }

  private renderRunner() {
    this.renderTop();
    this.renderQuestion();
    this.renderMap();
    this.renderBottom();
    this.renderTime();
  }

  private renderTop() {
    const s = this.session!;
    this.ui.count.innerHTML = `<span class="sr-only">Pytanie </span><b>${s.state.current + 1}</b> / ${s.total}`;
    this.ui.bar.style.setProperty('--p', String(s.answeredCount / s.total));
    if (s.mode.instant) {
      const r = s.result();
      this.ui.ok.textContent = String(r.correct);
      this.ui.bad.textContent = String(r.wrong);
    }
  }

  private renderQuestion() {
    const s = this.session!;
    const i = s.state.current;
    const q = s.question;
    const answer = s.answerOf(i);
    // W nauce unieważnione pytanie od razu pokazuje klucz i salę — odpowiedź i tak nie jest przyjmowana
    const reveal = s.finished || (s.mode.instant && (answer !== undefined || !isCounted(q)));
    this.ui.question.innerHTML = R.question({
      q,
      sessionLabel: `${this.examLabel(q.exam)} ${this.sessionLabel(q.session)}`,
      fieldLabel: this.fieldLabel(q.field),
      answer,
      reveal,
      interactive: true,
      locked: s.lockReason(i) !== null,
      flagged: s.isFlagged(i),
      hasNote: notes.has(q.id),
      headingId: 'lq-text',
    });
    this.ui['feedback-slot'].innerHTML = reveal ? R.feedback(q, answer) : '';
    this.ui['note-slot'].innerHTML = this.noteOpen ? R.note(notes.get(q.id), true) : '';
  }

  private renderBottom() {
    const s = this.session!;
    const i = s.state.current;
    const last = i === s.total - 1;
    const answered = s.answerOf(i) !== undefined;
    this.q<HTMLButtonElement>('[data-act="prev"]').disabled = i === 0;
    this.q('[data-act="flag"]').setAttribute('aria-pressed', String(s.isFlagged(i)));
    const noteBtn = this.q('[data-act="note"]');
    noteBtn.setAttribute('aria-expanded', String(this.noteOpen));
    noteBtn.classList.toggle('has-note', notes.has(s.question.id));

    const next = this.q('[data-act="next"]');
    const skip = s.mode.instant && !answered && !last && isCounted(s.question);
    next.classList.toggle('is-skip', skip);
    next.classList.toggle('is-ready', s.mode.instant && answered);
    this.ui['next-label'].textContent = last ? 'Zakończ test' : skip ? 'Pomiń' : 'Następne';
  }

  private renderMap() {
    const s = this.session!;
    const reveal = s.reveals;
    const all = notes.all();
    const statuses = s.questions.map((q, i) => statusOf(s.state, q, i, reveal && (s.finished || s.answerOf(i) !== undefined)));
    const counts: Record<MapFilter, number> = {
      all: s.total,
      blank: statuses.filter((x) => x === 'blank').length,
      flag: s.state.flags.length,
      note: s.questions.filter((q) => all[q.id]).length,
      wrong: statuses.filter((x) => x === 'wrong').length,
    };
    const filters: [MapFilter, string][] = [['all', 'Wszystkie'], ['blank', 'Bez odpowiedzi'], ['flag', 'Oznaczone'], ['note', 'Z notatką']];
    if (s.mode.instant) filters.push(['wrong', 'Błędne']);
    if (counts[this.mapFilter] === 0) this.mapFilter = 'all';
    this.ui['map-filters'].innerHTML = filters
      .map(([id, label]) => `<button type="button" class="mf" data-map-filter="${id}" aria-pressed="${id === this.mapFilter}"${counts[id] === 0 && id !== 'all' ? ' disabled' : ''}>${label}<b>${counts[id]}</b></button>`)
      .join('');

    const pages = Math.ceil(s.total / MAP_PAGE);
    this.ui['map-pages'].innerHTML = pages > 1
      ? Array.from({ length: pages }, (_, p) => `<button type="button" class="mf" data-map-page="${p}" aria-pressed="${p === this.mapPage}">${p * MAP_PAGE + 1}–${Math.min(s.total, (p + 1) * MAP_PAGE)}</button>`).join('')
      : '';

    const from = this.mapPage * MAP_PAGE;
    const to = Math.min(s.total, from + MAP_PAGE);
    let html = '';
    for (let i = from; i < to; i++) {
      const q = s.questions[i];
      const st = statuses[i];
      const flag = s.isFlagged(i);
      const note = Boolean(all[q.id]);
      const match = this.mapFilter === 'all'
        || (this.mapFilter === 'blank' && st === 'blank')
        || (this.mapFilter === 'flag' && flag)
        || (this.mapFilter === 'note' && note)
        || (this.mapFilter === 'wrong' && st === 'wrong');
      const label = [`Pytanie ${i + 1}`, STATUS_LABEL[st], flag ? 'oznaczone' : '', note ? 'z notatką' : ''].filter(Boolean).join(', ');
      html += `<button type="button" class="cell${flag ? ' is-flag' : ''}${note ? ' is-note' : ''}${match ? '' : ' is-dim'}" data-go="${i}" data-s="${st}" aria-label="${label}"${i === s.state.current ? ' aria-current="true"' : ''}>${i + 1}</button>`;
    }
    this.ui['map-grid'].innerHTML = html;
  }

  /** Zegar, pauza i ostrzeżenia czasu — co sekundę i po każdej zmianie. */
  private renderTime() {
    const s = this.session;
    if (!s || !s.timed) return;
    const left = s.remaining() ?? 0;
    this.ui.timer.textContent = R.clock(left);
    const wrap = this.ui['timer-wrap'];
    wrap.classList.toggle('is-low', left < 10 * 60_000 && left >= 60_000);
    wrap.classList.toggle('is-critical', left < 60_000);
    const pauseBtn = wrap.querySelector<HTMLElement>('[data-act="pause"]')!;
    pauseBtn.innerHTML = R.icon(s.state.paused ? 'play' : 'pause');
    pauseBtn.setAttribute('aria-label', s.state.paused ? 'Wznów (P)' : 'Wstrzymaj (P)');

    const paused = s.state.paused && !s.finished;
    if (this.ui.pause.hidden === paused) {
      this.ui.pause.hidden = !paused;
      this.q<HTMLElement>('.main__inner').inert = paused;
      if (paused) this.ui.pause.querySelector<HTMLElement>('[data-act="resume"]')?.focus();
    }
    this.ui['pause-time'].textContent = R.clock(left);
    if (left === 0 && !s.finished) s.finish();
  }

  private startTicker() {
    this.stopTicker();
    if (this.session?.timed && !this.session.finished) this.ticker = window.setInterval(() => this.renderTime(), 1000);
  }
  private stopTicker() { clearInterval(this.ticker); }

  private setMap(open: boolean, remember = true) {
    this.dialog.toggleAttribute('data-map-open', open);
    this.dialog.querySelector('.tb--map')?.setAttribute('aria-expanded', String(open));
    if (remember && this.wide.matches) prefs.set({ map: open });
    if (open && !this.wide.matches) this.ui['map-grid'].querySelector<HTMLElement>('[aria-current="true"]')?.focus();
  }

  private toggleNote(focus: boolean) {
    this.noteOpen = !this.noteOpen;
    this.renderQuestion();
    this.renderBottom();
    if (this.noteOpen && focus) {
      const input = this.ui['note-slot'].querySelector<HTMLTextAreaElement>('[data-note-input]');
      input?.focus();
      input?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  private onNoteInput(input: HTMLTextAreaElement) {
    const s = this.session!;
    const id = s.question.id;
    const status = this.ui['note-slot'].querySelector('[data-note-status]');
    if (status) status.textContent = 'zapisywanie…';
    clearTimeout(this.noteTimer);
    this.noteTimer = window.setTimeout(() => {
      notes.set(id, input.value);
      if (status) status.textContent = 'zapisano w tej przeglądarce';
      this.renderMap();
      this.renderBottom();
    }, 350);
  }

  private focusQuestion() {
    this.ui.question.querySelector<HTMLElement>('#lq-text')?.setAttribute('tabindex', '-1');
    // Fokus na treści (bez przewijania) — czytnik ekranu zaczyna od pytania, Tab prowadzi do odpowiedzi
    this.ui.question.querySelector<HTMLElement>('#lq-text')?.focus({ preventScroll: true });
  }

  private announce(text: string) {
    this.ui.announce.textContent = '';
    requestAnimationFrame(() => { this.ui.announce.textContent = text; });
  }

  /* ======================================================================
     Zakończenie i wynik
     ====================================================================== */

  private askFinish() {
    const s = this.session!;
    const body = this.q('[data-confirm-body]');
    const answered = s.answeredCount;
    if (s.mode.instant) {
      body.innerHTML = answered
        ? `<p>Podsumowanie obejmie ${answered} ${plural(answered, ['pytanie', 'pytania', 'pytań'])} z odpowiedzią. Pozostałe ${s.total - answered} pominiemy.</p>`
        : '<p>Nie ma jeszcze żadnej odpowiedzi — podsumowanie będzie puste.</p>';
    } else {
      const blanks = s.blanks();
      body.innerHTML = `<ul>
          <li>Odpowiedzi <b>${answered} / ${s.total}</b></li>
          <li>Bez odpowiedzi <b>${blanks.length}</b></li>
          <li>Oznaczone do powrotu <b>${s.state.flags.length}</b></li>
        </ul>
        ${blanks.length ? `<p><button type="button" class="linkish" data-goto-blank>Przejdź do pierwszego bez odpowiedzi (nr ${blanks[0] + 1})</button></p>` : ''}
        <p class="modal__note">Po zakończeniu odpowiedzi nie da się już zmienić.</p>`;
    }
    this.confirmDlg.returnValue = '';
    this.confirmDlg.showModal();
  }

  private resultContext(): Res.ResultContext {
    const s = this.session!;
    return { session: s, result: s.result(), fieldLabel: this.fieldLabel, distribution: this.cfg.distribution, threshold: this.cfg.rules.threshold };
  }

  private showResult() {
    const s = this.session!;
    this.stopTicker();
    if (document.fullscreenElement) void document.exitFullscreen();
    this.ui.shell.hidden = true;
    this.ui.result.hidden = false;
    this.ui['res-title'].textContent = `${s.mode.label} · ${this.ui.session.textContent}`;
    this.ui['res-body'].innerHTML = Res.result(this.resultContext(), this.reviewFilter);
    this.renderReview();
    this.ui['res-scroll'].scrollTop = 0;
    this.ui['res-body'].querySelector<HTMLElement>('.r-score')?.setAttribute('tabindex', '-1');
    this.ui['res-body'].querySelector<HTMLElement>('.r-score')?.focus({ preventScroll: true });
    this.renderResume();
  }

  private renderReview() {
    const s = this.session!;
    const ctx = this.resultContext();
    const ids = s.questions.map((_, i) => i).filter((i) => Res.matchesFilter(s, i, this.reviewFilter));
    this.q('[data-review-list]').innerHTML = ids.slice(0, this.reviewShown).map((i) => Res.reviewRow(ctx, i)).join('')
      || '<p class="r-note">Brak pytań w tym widoku.</p>';
    const more = this.q<HTMLButtonElement>('[data-review-more]');
    more.hidden = ids.length <= this.reviewShown;
    more.textContent = `Pokaż kolejne (${ids.length - this.reviewShown})`;
  }

  /** Treść pytania w przeglądzie powstaje dopiero po rozwinięciu wiersza. */
  private onReviewToggle(e: Event) {
    const row = e.target as HTMLDetailsElement;
    if (!row.matches?.('[data-review]') || !row.open) return;
    const body = row.querySelector<HTMLElement>('[data-review-body]')!;
    if (body.childElementCount) return;
    const s = this.session!;
    const i = Number(row.dataset.review);
    const q = s.questions[i];
    body.innerHTML = R.question({
      q, sessionLabel: `${this.examLabel(q.exam)} ${this.sessionLabel(q.session)}`, fieldLabel: this.fieldLabel(q.field),
      answer: s.answerOf(i), reveal: true, interactive: false,
    }) + R.feedback(q, s.answerOf(i)) + R.note(notes.get(q.id), false);
  }

  private newTest() {
    this.exit();
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.form.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.focus({ preventScroll: true });
  }

  private async retryWrong() {
    const s = this.session!;
    const ids = s.questions.filter((q, i) => statusOf(s.state, q, i, true) === 'wrong').map((q) => q.id);
    if (!ids.length) return;
    await this.start({ ...s.state.config, mode: 'nauka', shuffle: false, ids });
  }

  private share() {
    const s = this.session!;
    const r = s.result();
    const url = `${location.origin}/egzamin/`;
    const text = `Mój wynik w teście LEK (${s.mode.label.toLowerCase()}, ${this.sessionLabel(s.state.config.session)}): ${r.points}/${r.max} pkt. Sprawdź się na pytaniach z jawnej bazy CEM:`;
    if (navigator.share) void navigator.share({ text, url }).catch(() => {});
    else window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener');
  }
}

if (!customElements.get('zl-exam')) customElements.define('zl-exam', ZlExam);
