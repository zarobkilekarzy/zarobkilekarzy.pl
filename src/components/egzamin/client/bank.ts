/**
 * Przeglądarka bazy pytań: filtry (egzamin, sesja, dziedzina, pochodzenie, tekst, notatki)
 * nad tym samym bankiem co test. Wiersz i rozwinięcie — wspólne znaczniki z przeglądem wyniku.
 */
import { difficultyLevel, difficultyOf } from '@/lib/egzamin/engine';
import { loadSessions } from '@/lib/egzamin/source';
import { notes } from '@/lib/egzamin/storage';
import type { ExamId, ExamQuestion } from '@/lib/egzamin/types';
import { fold, formatPL, plural } from '@/lib/format';
import type { ClientConfig } from './app';
import * as R from './render';

const PAGE = 20;

export function initBank(root: HTMLElement, cfg: ClientConfig, fieldLabel: (id: string, exam: ExamId) => string, sessionLabel: (id: string) => string) {
  const form = root.querySelector<HTMLFormElement>('[data-bank-form]')!;
  const list = root.querySelector<HTMLElement>('[data-bank-list]')!;
  const count = root.querySelector<HTMLElement>('[data-bank-count]')!;
  const more = root.querySelector<HTMLButtonElement>('[data-bank-more]')!;
  const fieldSelect = form.elements.namedItem('field') as HTMLSelectElement;
  let shown = PAGE;
  let rows: ExamQuestion[] = [];
  let searchTimer = 0;
  /** numer ostatniego wywołania apply — wolniejsze, wcześniejsze pobranie nie nadpisze nowszej listy */
  let request = 0;

  const val = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;

  const fillFields = (exam: ExamId) => {
    fieldSelect.innerHTML = '<option value="all">Wszystkie dziedziny</option>'
      + cfg.fields[exam].map((f) => `<option value="${f.id}">${R.esc(f.label)}</option>`).join('');
  };

  const row = (q: ExamQuestion) => {
    const d = difficultyOf(q);
    const level = d === null ? null : difficultyLevel(d);
    const mark = notes.has(q.id) ? `<span class="lq-row__marks"><span class="is-note">${R.icon('pencil', 14)}</span></span>` : '';
    return `<details class="lq-row" data-bank-row="${q.id}">
      <summary><span class="lq-row__sum">
        <span class="lq-row__nr">${q.nr}</span>
        <span class="lq-row__st lq-row__st--${q.flags?.includes('invalidated') ? 'void' : 'none'}" aria-hidden="true"></span>
        <span class="lq-row__main">
          <span class="lq-row__field">${q.field ? `${R.esc(fieldLabel(q.field, q.exam))} · ` : ''}${R.esc(sessionLabel(q.session))}</span>
          <span class="lq-row__text">${R.txt(q.text)}</span>
        </span>
        <span class="lq-row__side">${mark}${level ? `<span title="Wskaźnik trudności ${formatPL(d!, 2)}"><span class="lq-diff__dots" data-level="${level.level}"><i></i><i></i><i></i><i></i></span></span><span><b>${formatPL(q.stats![q.correct], 0)}%</b> poprawnych</span>` : '<span>bez statystyki</span>'}</span>
      </span></summary>
      <div class="lq-row__body lq" data-bank-body></div>
    </details>`;
  };

  const render = () => {
    list.innerHTML = rows.slice(0, shown).map(row).join('') || '<p class="bank__empty">Brak pytań dla tych filtrów.</p>';
    more.hidden = rows.length <= shown;
    more.textContent = `Pokaż kolejne ${Math.min(PAGE, rows.length - shown)}`;
  };

  const apply = async () => {
    const mine = ++request;
    const exam = val('exam') as ExamId;
    count.textContent = 'Wczytywanie…';
    const session = val('session'), field = val('field'), origin = val('origin');
    let pool: ExamQuestion[];
    try {
      pool = await loadSessions(exam, session === 'all' ? 'all' : [session], cfg.sessions);
    } catch {
      if (mine === request) count.textContent = 'Nie udało się wczytać pytań — spróbuj ponownie';
      return;
    }
    if (mine !== request) return;
    const onlyNotes = (form.elements.namedItem('notes') as HTMLInputElement).checked;
    const terms = fold(val('q')).split(/\s+/).filter(Boolean);
    const saved = notes.all();
    rows = pool.filter((q) =>
      (session === 'all' || q.session === session)
      && (field === 'all' || q.field === field)
      && (origin === 'all' || (origin === 'base' ? q.inBase === true : q.inBase === false))
      && (!onlyNotes || Boolean(saved[q.id]))
      && (terms.length === 0 || terms.every((t) => fold([q.text, ...(q.items ?? []), ...q.answers].join(' ')).includes(t))));
    shown = PAGE;
    count.textContent = `${formatPL(rows.length)} ${plural(rows.length, ['pytanie', 'pytania', 'pytań'])}`;
    render();
  };

  fillFields('lek');
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLElement).matches('[name="exam"]')) fillFields(val('exam') as ExamId);
    void apply();
  });
  form.addEventListener('input', (e) => {
    if (!(e.target as HTMLElement).matches('[name="q"]')) return;
    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => void apply(), 200);
  });
  more.addEventListener('click', () => { shown += PAGE; render(); });
  list.addEventListener('toggle', (e) => {
    const el = e.target as HTMLDetailsElement;
    const body = el.querySelector<HTMLElement>('[data-bank-body]');
    if (!el.open || !body || body.childElementCount) return;
    const q = rows.find((x) => x.id === el.dataset.bankRow)!;
    body.innerHTML = R.question({
      q, sessionLabel: `${q.exam.toUpperCase()} ${sessionLabel(q.session)}`, fieldLabel: q.field ? fieldLabel(q.field, q.exam) : '', reveal: true, interactive: false,
    }) + R.feedback(q, undefined, true) + R.note(notes.get(q.id), false);
  }, true);

  void apply();
}
