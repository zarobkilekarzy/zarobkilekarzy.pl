/**
 * Znaczniki pytania jako czyste funkcje (stan → HTML) — wspólne dla testu,
 * przeglądu odpowiedzi w wyniku i przeglądarki bazy. Style: ../question.css (`.lq-`).
 */
import { LETTERS, difficultyLevel, difficultyOf, isCounted } from '@/lib/egzamin/engine';
import type { ExamQuestion } from '@/lib/egzamin/types';
import { formatPL, typo } from '@/lib/format';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);
/** Tekst z danych: najpierw ucieczka HTML, potem polska typografia (twarde spacje). */
export const txt = (s: string) => typo(esc(s));

export const icon = (name: string, size = 18) =>
  `<svg class="icon" width="${size}" height="${size}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

export const pct = (n: number, decimals = 1) => `${formatPL(n, decimals)}%`;

/** 3 725 000 ms → „1:02:05” */
export function clock(ms: number) {
  const t = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const CEM_BROWSER = 'https://cem.edu.pl/pytcem/eula_lek_p.php';

const ALERTS = {
  outdated: { cls: '', icon: 'alert', text: 'W bazie CEM to pytanie zgłoszono jako niezgodne z aktualną wiedzą medyczną. Na egzaminie było liczone.' },
  invalidated: { cls: ' lq-alert--void', icon: 'info', text: 'Pytanie unieważnione przez CEM — nie liczy się do wyniku, a maksimum punktów jest o nie niższe.' },
  truncated: {
    cls: '', icon: 'alert',
    text: `Treść może być niepełna: przy pobieraniu z bazy CEM mógł wypaść fragment zaczynający się od znaku „&lt;” (np. wartość normy). Pełne brzmienie sprawdzisz w <a href="${CEM_BROWSER}" target="_blank" rel="noopener">przeglądarce pytań CEM</a>.`,
  },
} as const;

const ORIGIN = {
  base: ['lq-badge--base', 'z jawnej bazy', 'Pytanie było w bazie CEM opublikowanej przed egzaminem'],
  fresh: ['lq-badge--new', 'nowe pytanie', 'Pytania nie było w bazie CEM opublikowanej przed egzaminem'],
} as const;

export interface QuestionView {
  q: ExamQuestion;
  /** „LEK · jesień 2026” */
  sessionLabel: string;
  /** podpis zamiast „sesja · nr” (np. pytanie przykładowe poza sesją) */
  source?: string;
  fieldLabel: string;
  answer?: number;
  /** pokaż klucz i statystykę sali */
  reveal: boolean;
  /** odpowiedzi jako przyciski (test) czy jako lista (przegląd) */
  interactive: boolean;
  locked?: boolean;
  flagged?: boolean;
  hasNote?: boolean;
  /** id nagłówka — aria-labelledby listy odpowiedzi */
  headingId?: string;
}

function meta(v: QuestionView) {
  const { q } = v;
  const origin = q.inBase === null ? '' : ORIGIN[q.inBase ? 'base' : 'fresh'];
  const marks = [
    v.flagged ? `<span class="lq-mini">${icon('flag', 14)}oznaczone</span>` : '',
    v.hasNote ? `<span class="lq-mini lq-mini--note">${icon('pencil', 14)}notatka</span>` : '',
  ].join('');
  return `<div class="lq-meta">
    <span class="lq-field">${esc(v.fieldLabel)}</span>
    <span class="lq-src">${esc(v.source ?? `${v.sessionLabel} · nr ${q.nr}`)}</span>
    ${origin ? `<span class="lq-badge ${origin[0]}" title="${origin[2]}">${origin[1]}</span>` : ''}
    ${marks ? `<span class="lq-meta__end">${marks}</span>` : ''}
  </div>`;
}

function body(v: QuestionView) {
  const { q } = v;
  const alerts = (q.flags ?? []).map((f) => `<p class="lq-alert${ALERTS[f].cls}">${icon(ALERTS[f].icon)}<span>${ALERTS[f].text}</span></p>`).join('');
  const items = q.items?.length
    ? `<ol class="lq-items">${q.items.map((t, k) => `<li><b>${k + 1})</b><span>${txt(t)}</span></li>`).join('')}</ol>`
    : '';
  return `${alerts}
    <p class="lq-text"${v.headingId ? ` id="${v.headingId}"` : ''}>${txt(q.text)}</p>
    ${items}
    ${q.tail ? `<p class="lq-tail">${txt(q.tail)}</p>` : ''}`;
}

function option(v: QuestionView, k: number) {
  const { q, answer, reveal } = v;
  const chosen = answer === k;
  const share = reveal && q.stats ? q.stats[k] : null;
  const state = !reveal
    ? (chosen ? ' is-chosen' : '')
    : k === q.correct ? ' is-correct' : chosen ? ' is-wrong' : ' is-rest';
  const you = reveal && chosen ? `<span class="lq-you"><span>Ty</span></span>` : '';
  const mark = reveal && k === q.correct ? icon('check') : reveal && chosen ? icon('close') : '';
  const sr = [
    reveal && k === q.correct ? 'prawidłowa' : '',
    chosen ? 'Twoja odpowiedź' : '',
    share !== null ? `wybrało ${pct(share)} zdających` : '',
  ].filter(Boolean).join(', ');
  const inner = `
    ${share !== null ? `<span class="lq-opt__bar" style="--w:${share}%"></span>` : ''}
    <span class="lq-key">${LETTERS[k]}</span>
    <span class="lq-opt__text">${txt(q.answers[k])}${sr ? `<span class="sr-only"> — ${sr}</span>` : ''}</span>
    <span class="lq-opt__end" aria-hidden="true">${you}${share !== null ? pct(share) : ''}${mark}</span>`;

  return v.interactive
    ? `<li><button type="button" class="lq-opt${state}" data-choice="${k}" aria-pressed="${chosen}" aria-keyshortcuts="${LETTERS[k]} ${k + 1}"${v.locked ? ' disabled' : ''}>${inner}</button></li>`
    : `<li class="lq-opt${state}">${inner}</li>`;
}

/** Werdykt + statystyka sali — po odpowiedzi w nauce, w przeglądzie i w bazie (`browse`: bez „Twojej” odpowiedzi). */
export function feedback(q: ExamQuestion, answer: number | undefined, browse = false) {
  if (!isCounted(q)) return '';
  const L = LETTERS[q.correct];
  const d = difficultyOf(q);
  const ok = answer === q.correct;
  const kind = answer === undefined ? 'info' : ok ? 'ok' : 'bad';
  const verdict = answer === undefined ? (browse ? `Prawidłowa odpowiedź: ${L}.` : `Bez odpowiedzi. Prawidłowa: ${L}.`)
    : ok ? 'Dobrze.' : `Niestety. Prawidłowa odpowiedź: ${L}.`;

  let text = 'CEM nie opublikował statystyki odpowiedzi dla tego pytania.';
  let scale = '';
  if (q.stats && d !== null) {
    text = `Na egzaminie poprawnie odpowiedziało ${pct(q.stats[q.correct])} zdających.`;
    if (answer !== undefined && !ok) text += ` Twoją odpowiedź (${LETTERS[answer]}) wybrało ${pct(q.stats[answer])}.`;
    const top = q.stats.indexOf(Math.max(...q.stats));
    if (top !== q.correct) text += ` Najczęściej wybierano ${LETTERS[top]} (${pct(q.stats[top])}) — to pytanie myliło salę.`;
    const { level, label } = difficultyLevel(d);
    scale = `<p class="lq-diff">
      <span class="lq-diff__dots" data-level="${level}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span>Pytanie ${label} · <abbr title="Odsetek poprawnych odpowiedzi na egzaminie: 0,9 = łatwe, 0,3 = bardzo trudne">wskaźnik trudności</abbr> ${formatPL(d, 2)}</span>
    </p>`;
  }
  return `<div class="lq-fb lq-fb--${kind}" data-feedback>
    <p class="lq-fb__verdict">${verdict}</p>
    <p class="lq-fb__text">${text}</p>
    ${scale}
  </div>`;
}

export function question(v: QuestionView) {
  const listLabel = v.headingId ? ` aria-labelledby="${v.headingId}"` : ' aria-label="Odpowiedzi"';
  return `${meta(v)}${body(v)}
    <ol class="lq-ans" role="list"${listLabel}>${v.q.answers.map((_, k) => option(v, k)).join('')}</ol>`;
}

/** Notatka: pole edycji (test) albo podgląd (przegląd). */
export function note(text: string, editable: boolean) {
  if (!editable) return text ? `<div class="lq-note"><p class="lq-note__head">Twoja notatka</p><p class="lq-note__view">${esc(text)}</p></div>` : '';
  return `<div class="lq-note" data-note>
    <p class="lq-note__head"><label for="lq-note-input">Twoja notatka</label><span class="lq-note__status" data-note-status>zapisuje się w tej przeglądarce</span></p>
    <textarea id="lq-note-input" data-note-input placeholder="Np. skojarzenie, źródło, skąd była pomyłka…">${esc(text)}</textarea>
  </div>`;
}
