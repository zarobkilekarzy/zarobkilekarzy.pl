/**
 * Podsumowanie testu → HTML. Czysty render z wyniku i sesji; zachowanie (filtry przeglądu,
 * rozwijanie, akcje) podpina app.ts przez atrybuty data-*.
 */
import { percentile, statusOf } from '@/lib/egzamin/engine';
import type { ExamSession } from '@/lib/egzamin/session';
import { notes } from '@/lib/egzamin/storage';
import type { FieldScore, TestResult } from '@/lib/egzamin/types';
import { formatPL, plural } from '@/lib/format';
import { clock, esc, icon, pct, txt } from './render';

export type ReviewFilter = 'all' | 'wrong' | 'blank' | 'flag' | 'note';

export interface ResultContext {
  session: ExamSession;
  result: TestResult;
  fieldLabel: (id: string) => string;
  distribution: number[];
  /** próg zdania jako ułamek (0,56) */
  threshold: number;
}

const share = (points: number, max: number) => (max ? points / max : 0);

function hero({ session, result: r, threshold }: ResultContext) {
  const learning = session.mode.instant;
  const quick = session.mode.size !== undefined;
  const you = share(r.points, r.max);
  const avg = share(r.average, r.max);
  // Skala pokazuje próg z rozporządzenia (56%); punkty progu liczy engine (zaokrąglenie w górę)
  const thr = threshold;
  const verdict = r.max === 0
    ? ['neutral', 'Brak odpowiedzi do oceny']
    : r.passed ? ['pass', learning ? 'Powyżej progu 56%' : 'Zdany · próg 56%'] : ['fail', 'Poniżej progu 56%'];
  const diff = r.points - r.threshold;
  const line = [
    r.max === 0 ? 'Odpowiedz na co najmniej jedno pytanie, żeby zobaczyć wynik.'
      : diff >= 0 ? `Próg przekroczony o ${diff} ${plural(diff, ['punkt', 'punkty', 'punktów'])}.`
      : `Do progu zabrakło ${-diff} ${plural(-diff, ['punktu', 'punktów', 'punktów'])}.`,
    r.max ? `Przeciętny zdający uzyskałby tu ${pct(avg * 100, 0)}.` : '',
    learning ? `Liczymy ${r.max} ${plural(r.max, ['pytanie', 'pytania', 'pytań'])}, na które padła odpowiedź.` : '',
    quick ? 'Szybki test to próbka 20 pytań — wynik orientacyjny.' : '',
  ].filter(Boolean).join(' ');

  // Ty — nad osią; próg i przeciętny pod nią, a gdy są za blisko siebie, przeciętny idzie nad oś.
  // Bliska para w tym samym rzędzie rozsuwa się: lewa etykieta na lewo od kreski, prawa na prawo.
  const near = (a: number, b: number) => Math.abs(a - b) < 0.2;
  const marks = [
    { cls: 'you', v: you, label: `Ty ${pct(you * 100, 0)}`, pos: 'top', align: '' },
    { cls: 'threshold', v: thr, label: `próg ${pct(thr * 100, 0)}`, pos: 'bottom', align: '' },
    { cls: 'avg', v: avg, label: `przeciętny ${pct(avg * 100, 0)}`, pos: near(avg, thr) && !near(avg, you) ? 'top' : 'bottom', align: '' },
  ];
  for (const row of ['top', 'bottom']) {
    const inRow = marks.filter((m) => m.pos === row).sort((a, b) => a.v - b.v);
    inRow.slice(1).forEach((m, k) => {
      if (!near(inRow[k].v, m.v)) return;
      inRow[k].align = ' r-mark--end';
      m.align = ' r-mark--start';
    });
  }

  const tiles = [
    ['Dobrze', String(r.correct), 'is-ok'],
    ['Źle', String(r.wrong), 'is-bad'],
    ...(learning ? [] : [['Bez odpowiedzi', String(r.blank), '']]),
    ['Czas', clock(r.elapsed), ''],
    ...(r.invalidated ? [['Unieważnione', String(r.invalidated), '']] : []),
  ];

  return `<section class="r-card" aria-label="Wynik">
    <div class="r-hero">
      <div>
        <p class="r-verdict r-verdict--${verdict[0]}">${icon(verdict[0] === 'fail' ? 'close' : 'check', 14)}${verdict[1]}</p>
        <p class="r-score"><b>${r.points}</b><span>/ ${r.max} pkt · ${pct(you * 100)}</span></p>
        <p class="r-line">${line}</p>
      </div>
      <div class="r-scale" role="img" aria-label="Twój wynik ${pct(you * 100, 0)}, próg ${pct(thr * 100, 0)}, przeciętny zdający ${pct(avg * 100, 0)}">
        <div class="r-scale__track"><span class="r-scale__fill${r.passed ? '' : ' r-scale__fill--fail'}" style="--v:${you}"></span></div>
        ${marks.map((m) => `<span class="r-mark r-mark--${m.cls} r-mark--${m.pos}${m.align}" style="--v:${m.v}"><span>${m.label}</span></span>`).join('')}
        <div class="r-scale__ends"><span>0%</span><span>100%</span></div>
      </div>
    </div>
    <dl class="r-tiles">${tiles.map(([k, v, c]) => `<div><dt>${k}</dt><dd class="${c}">${v}</dd></div>`).join('')}</dl>
    ${session.state.agent ? `<p class="r-note">${icon('info', 14)} W tym teście odpowiadał asystent AI (przez window.lek), więc wynik nie trafia do statystyk użytkowników.</p>` : ''}
  </section>`;
}

function bar(label: string, f: FieldScore, threshold: number) {
  const v = share(f.points, f.max);
  return `<div class="r-bar">
    <span class="r-bar__label">${esc(label)}</span>
    <span class="r-bar__track" aria-hidden="true">
      <span class="r-bar__fill${v < threshold ? ' is-low' : ''}" style="--v:${v}"></span>
      <span class="r-bar__avg" style="--a:${share(f.average, f.max)}"></span>
    </span>
    <span class="r-bar__val">${pct(v * 100, 0)}<small>${f.points}/${f.max}</small></span>
  </div>`;
}

const legend = `<p class="r-legend"><span><i></i>Twój wynik</span><span><i class="is-low"></i>poniżej progu</span><span><i class="is-avg"></i>przeciętny zdający</span></p>`;

function fields(ctx: ResultContext, threshold: number) {
  const { result: r } = ctx;
  if (r.byField.length === 0) return '';
  return `<section class="r-card" aria-labelledby="r-fields">
    <h3 class="r-h" id="r-fields">Według dziedzin <small>${r.byField.length} ${plural(r.byField.length, ['dziedzina', 'dziedziny', 'dziedzin'])}</small></h3>
    <div class="r-bars">${r.byField.map((f) => bar(ctx.fieldLabel(f.field), f, threshold)).join('')}</div>
    ${legend}
  </section>`;
}

function origin({ result: r }: ResultContext, threshold: number) {
  if (!r.byOrigin) {
    return `<section class="r-card" aria-labelledby="r-origin">
      <h3 class="r-h" id="r-origin">Pytania z bazy i nowe</h3>
      <p class="r-note">Podział jest dostępny tylko dla sesji od 2022 r. — dla starszych nie da się ustalić, które pytania były w bazie opublikowanej przed egzaminem.</p>
    </section>`;
  }
  return `<section class="r-card" aria-labelledby="r-origin">
    <h3 class="r-h" id="r-origin">Pytania z bazy i nowe</h3>
    <div class="r-bars">
      ${bar('Z jawnej bazy CEM', r.byOrigin.base, threshold)}
      ${bar('Nowe', r.byOrigin.fresh, threshold)}
    </div>
    <p class="r-note">Pochodzenie ustalone przez porównanie z bazą opublikowaną przed egzaminem.</p>
  </section>`;
}

function compare({ session, result: r, distribution }: ResultContext) {
  if (session.mode.instant || r.max === 0) return '';
  const you = share(r.points, r.max);
  const p = percentile(you, distribution);
  const top = Math.max(...distribution);
  return `<section class="r-card" aria-labelledby="r-compare">
    <h3 class="r-h" id="r-compare">Na tle innych <small>dane przykładowe</small></h3>
    <p class="r-big">Twój wynik jest wyższy niż <b>≈ ${pct(p.share * 100, 0)}</b> wyników.</p>
    <div class="r-hist" role="img" aria-label="Rozkład ${formatPL(p.total)} wyników; Twój w przedziale ${p.bin * 10}–${p.bin === 9 ? 100 : p.bin * 10 + 9}%">
      ${distribution.map((n, i) => `<span class="${i === p.bin ? 'is-you' : ''}" style="--h:${n / top}" title="${i * 10}–${i === 9 ? 100 : i * 10 + 9}%: ${n}"></span>`).join('')}
    </div>
    <div class="r-hist__axis"><span>0%</span><span>50%</span><span>100%</span></div>
    <p class="r-note">${formatPL(p.total)} ukończonych testów w tym trybie i sesji. Zbieramy anonimowo tylko wynik: sesję, tryb, punkty i czas.</p>
  </section>`;
}

/** W nauce przegląd obejmuje tylko pytania z odpowiedzią — reszta nie była rozwiązywana. */
const inReview = (session: ExamSession, i: number) => !session.mode.instant || session.answerOf(i) !== undefined;

/** Liczniki filtrów przeglądu. */
export function reviewCounts(session: ExamSession) {
  const c = { all: 0, wrong: 0, blank: 0, flag: 0, note: 0 };
  session.questions.forEach((q, i) => {
    if (!inReview(session, i)) return;
    c.all++;
    if (session.isFlagged(i)) c.flag++;
    const s = statusOf(session.state, q, i, true);
    if (s === 'wrong') c.wrong++;
    if (s === 'blank') c.blank++;
    if (notes.has(q.id)) c.note++;
  });
  return c;
}

export function matchesFilter(session: ExamSession, i: number, filter: ReviewFilter) {
  if (!inReview(session, i)) return false;
  const q = session.questions[i];
  const s = statusOf(session.state, q, i, true);
  switch (filter) {
    case 'wrong': return s === 'wrong';
    case 'blank': return s === 'blank';
    case 'flag': return session.isFlagged(i);
    case 'note': return notes.has(q.id);
    default: return true;
  }
}

const FILTERS: [ReviewFilter, string][] = [
  ['all', 'Wszystkie'], ['wrong', 'Błędne'], ['blank', 'Bez odpowiedzi'], ['flag', 'Oznaczone'], ['note', 'Z notatką'],
];

export function reviewFilters(session: ExamSession, active: ReviewFilter) {
  const c = reviewCounts(session);
  return FILTERS
    .filter(([id]) => !(id === 'blank' && session.mode.instant))
    .map(([id, label]) => `<button type="button" class="r-filter" data-review-filter="${id}" aria-pressed="${id === active}"${c[id] === 0 && id !== 'all' ? ' disabled' : ''}>${label}<b>${c[id]}</b></button>`)
    .join('');
}

/** Wiersz przeglądu — treść pytania dorenderowuje się dopiero po rozwinięciu. */
export function reviewRow(ctx: ResultContext, i: number) {
  const { session } = ctx;
  const q = session.questions[i];
  const a = session.answerOf(i);
  const s = statusOf(session.state, q, i, true);
  const st = { correct: icon('check', 14), wrong: icon('close', 14), blank: '', void: '', answered: '' }[s];
  const L = 'ABCDE';
  const room = q.stats ? `${formatPL(q.stats[q.correct], 0)}% sali` : '';
  const marks = [session.isFlagged(i) ? icon('flag', 14) : '', notes.has(q.id) ? `<span class="is-note">${icon('pencil', 14)}</span>` : ''].join('');
  return `<details class="lq-row" data-review="${i}">
    <summary><span class="lq-row__sum">
      <span class="lq-row__nr">${i + 1}</span>
      <span class="lq-row__st lq-row__st--${s}" aria-label="${{ correct: 'dobrze', wrong: 'źle', blank: 'bez odpowiedzi', void: 'unieważnione', answered: '' }[s]}">${st}</span>
      <span class="lq-row__main">
        <span class="lq-row__field">${esc(ctx.fieldLabel(q.field))}</span>
        <span class="lq-row__text">${txt(q.text)}</span>
      </span>
      <span class="lq-row__side">
        ${marks ? `<span class="lq-row__marks">${marks}</span>` : ''}
        <span>Ty: <b>${a === undefined ? '—' : L[a]}</b> · klucz: <b>${L[q.correct]}</b></span>
        ${room ? `<span>${room}</span>` : ''}
      </span>
    </span></summary>
    <div class="lq-row__body lq" data-review-body></div>
  </details>`;
}

export function result(ctx: ResultContext, filter: ReviewFilter) {
  const { threshold } = ctx;
  const wrong = reviewCounts(ctx.session).wrong;
  return `${hero(ctx)}
    <div class="r-grid">${fields(ctx, threshold)}<div>${origin(ctx, threshold)}${compare(ctx)}</div></div>
    <section class="r-card" aria-labelledby="r-review">
      <h3 class="r-h" id="r-review">Przegląd odpowiedzi <small>kliknij pytanie, żeby zobaczyć klucz i statystykę sali</small></h3>
      <div class="r-filters" data-review-filters role="group" aria-label="Pokaż">${reviewFilters(ctx.session, filter)}</div>
      <div data-review-list></div>
      <button type="button" class="r-btn r-more" data-review-more hidden>Pokaż kolejne</button>
    </section>
    <div class="r-actions">
      ${wrong ? `<button type="button" class="r-btn r-btn--primary" data-act="retry">${icon('refresh')}Powtórz ${wrong} ${plural(wrong, ['błędne', 'błędne', 'błędnych'])} w trybie nauki</button>` : ''}
      <button type="button" class="r-btn" data-act="new">Nowy test</button>
      <button type="button" class="r-btn" data-act="share">${icon('arrow-ne')}Udostępnij wynik</button>
    </div>`;
}
