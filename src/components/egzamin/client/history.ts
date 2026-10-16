/**
 * Historia wyników z tej przeglądarki (lib/egzamin/storage.ts → results) jako czyste funkcje
 * (dane → HTML). Szkielet sekcji i style — ExamSetup.astro (`.hist`), sterowanie — app.ts.
 */
import type { ResultV1 } from '@/lib/egzamin/storage';
import type { ExamId } from '@/lib/egzamin/types';
import { formatPL, plural } from '@/lib/format';
import { clock, esc, pct } from './render';

export interface HistoryContext {
  exam: ExamId;
  examLabel: string;
  /** nazwa trybu z zapisu („egzamin”, „szybki”…) */
  modeLabel: (tryb: ResultV1['tryb']) => string;
  fieldLabel: (id: string) => string;
  /** próg zdania jako ułamek maksimum (0,56) */
  threshold: number;
}

/** Dziedziny potrzebują co najmniej tylu pytań łącznie, żeby trafić do zestawienia (jak w pierwszej wersji). */
const MIN_FIELD_QUESTIONS = 3;

const share = (r: ResultV1) => r.pkt / r.max;
const passed = (r: ResultV1, threshold: number) => r.pkt >= Math.ceil(r.max * threshold);

/** Najsłabsze dziedziny: suma poprawnych / suma pytań ze wszystkich podejść. */
export function weakestFields(list: ResultV1[], limit = 3) {
  const sums = new Map<string, [number, number]>();
  for (const r of list) {
    for (const [id, ok, n] of r.dz) {
      const [a, b] = sums.get(id) ?? [0, 0];
      sums.set(id, [a + ok, b + n]);
    }
  }
  return [...sums.entries()]
    .filter(([, [, n]]) => n >= MIN_FIELD_QUESTIONS)
    .map(([id, [ok, n]]) => ({ id, ok, n, share: ok / n }))
    .sort((a, b) => a.share - b.share)
    .slice(0, limit);
}

export function historyBody(list: ResultV1[], ctx: HistoryContext) {
  const exams = list.filter((r) => r.tryb === 'egzamin');
  const summary = `${formatPL(list.length)} ${plural(list.length, ['test', 'testy', 'testów'])} ${ctx.examLabel}`
    + (exams.length ? ` · pełnych egzaminów: ${exams.length}, zdanych: ${exams.filter((r) => passed(r, ctx.threshold)).length}` : '');

  const rows = [...list].reverse().map((r) => {
    const date = new Date(r.t).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });
    const verdict = r.tryb === 'egzamin'
      ? ` <span class="hist__pass${passed(r, ctx.threshold) ? ' is-ok' : ' is-bad'}">${passed(r, ctx.threshold) ? 'zdany' : 'niezdany'}</span>`
      : '';
    return `<tr>
      <th scope="row">${esc(date)}</th>
      <td>${esc(ctx.modeLabel(r.tryb))} · ${esc(r.sesja)}</td>
      <td class="hist__num">${r.pkt}/${r.max} · ${pct(share(r) * 100)}${verdict}</td>
      <td class="hist__num">${r.czas ? clock(r.czas) : '—'}</td>
    </tr>`;
  }).join('');

  const weakest = weakestFields(list);
  const fields = weakest.length
    ? `<div class="hist__fields">
        <p class="mono-label" id="hist-fields">Najsłabsze dziedziny <span>· średnio ze wszystkich podejść</span></p>
        <ol class="hist__bars" aria-labelledby="hist-fields">
          ${weakest.map((f) => `<li class="hist__bar">
            <span class="hist__bar-label">${esc(ctx.fieldLabel(f.id))}</span>
            <span class="hist__bar-track" aria-hidden="true"><span style="--v:${f.share.toFixed(3)}"></span></span>
            <span class="hist__bar-val">${pct(f.share * 100, 0)}<small>${f.ok}/${f.n}</small></span>
          </li>`).join('')}
        </ol>
      </div>`
    : '';

  return `<p class="hist__sum">${esc(summary)}</p>
    <div class="hist__grid${fields ? '' : ' hist__grid--single'}">
      <div class="hist__table" role="region" aria-label="Wszystkie wyniki ${esc(ctx.examLabel)}, od najnowszego" tabindex="0">
        <table>
          <thead><tr><th scope="col">Data</th><th scope="col">Test</th><th scope="col">Wynik</th><th scope="col">Czas</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${fields}
    </div>`;
}
