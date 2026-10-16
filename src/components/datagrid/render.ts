/**
 * Wiersze datagridu jako HTML (string). Używane przez serwer (pierwsze wiersze w statycznym HTML)
 * i przez przeglądarkę po każdej zmianie filtrów — stąd jeden renderer bez DOM.
 */
import { fold, formatPL } from '@/lib/format';
import type { Column, GridConfig, Html, RenderContext, SortState } from './types';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (s: string): Html => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Funkcja zaznaczająca trafienia (<mark>) — porównuje bez polskich znaków i wielkości liter. */
export function marker(words: string[]): (text: string) => Html {
  if (!words.length) return esc;
  return (text) => {
    // tekst złożony znak po znaku, żeby pozycje w wersji „złożonej” dało się przełożyć na oryginał
    const chars = [...text];
    let folded = '';
    const at: number[] = [];
    chars.forEach((ch, i) => {
      const f = fold(ch);
      folded += f;
      for (let k = 0; k < f.length; k++) at.push(i);
    });

    const hit = new Array<boolean>(chars.length).fill(false);
    for (const w of words) {
      for (let from = folded.indexOf(w); from !== -1; from = folded.indexOf(w, from + 1)) {
        for (let k = at[from]; k <= at[from + w.length - 1]; k++) hit[k] = true;
      }
    }

    let out = '';
    chars.forEach((ch, i) => {
      if (hit[i] && !hit[i - 1]) out += '<mark>';
      out += esc(ch);
      if (hit[i] && !hit[i + 1]) out += '</mark>';
    });
    return out;
  };
}

/** Liczba widocznych kolumn — do colspan komórek zastępczych i szczegółów. */
export interface Spans {
  /** wszystkie kolumny z przyciskiem rozwijania */
  all: number;
  /** id grupy → liczba jej widocznych kolumn */
  groups: Record<string, number>;
}

export function fullSpans(config: GridConfig<any, any>): Spans {
  const groups: Record<string, number> = {};
  for (const c of config.columns) if (c.group) groups[c.group] = (groups[c.group] ?? 0) + 1;
  return { all: config.columns.length + 1, groups };
}

export const columnClass = (c: Column<any, any>, sort?: SortState) =>
  [
    'dg-c',
    `dg-c--${c.id}`,
    c.align === 'end' && 'dg-num',
    c.priority && c.priority > 1 && `dg-p${c.priority}`,
    !c.width && 'dg-flex',
    sort?.by === c.id && 'is-sorted',
  ]
    .filter(Boolean)
    .join(' ');

export const detailId = (prefix: string, key: string) => `${prefix}-d-${key}`;

interface RowsOptions<D> {
  ctx: RenderContext<D>;
  spans: Spans;
  /** klucze rozwiniętych wierszy */
  open: Set<string>;
  /** maksimum kolumn z paskiem (id kolumny → największa wartość) */
  extents: Record<string, number>;
  /** prefiks identyfikatorów (unikalny dla instancji) */
  prefix: string;
}

export function renderDetail<T, D>(config: GridConfig<T, D>, row: T, o: RowsOptions<D>): Html {
  const key = config.key(row);
  return `<tr class="dg-detail" id="${detailId(o.prefix, esc(key))}" data-for="${esc(key)}"><td colspan="${o.spans.all}">${config.detail!.render(row, o.ctx)}</td></tr>`;
}

export function renderRows<T, D>(config: GridConfig<T, D>, rows: T[], o: RowsOptions<D>): Html {
  const { ctx } = o;
  const sorted = config.columns.find((c) => c.id === ctx.sort.by);
  const max = sorted?.bar ? o.extents[sorted.id] : 0;
  let html = '';

  for (const row of rows) {
    const key = esc(config.key(row));
    const expandable = config.detail?.has(row) ?? false;
    const open = expandable && o.open.has(config.key(row));
    const tone = config.tone?.(row);

    html += `<tr class="dg-row${expandable ? ' is-expandable' : ''}${open ? ' is-open' : ''}" data-key="${key}"${tone ? ` data-tone="${esc(tone)}"` : ''}>`;
    html += '<td class="dg-c dg-x">';
    if (expandable) {
      html += `<button type="button" class="dg-toggle" aria-expanded="${open}" aria-controls="${detailId(o.prefix, key)}"><span class="sr-only">${esc(config.detail!.label(row))}</span></button>`;
    }
    html += '</td>';

    const skipped = new Set<string>();
    for (const col of config.columns) {
      const group = col.group ? config.groups?.find((g) => g.id === col.group) : undefined;
      if (group && !group.has(row)) {
        // cała grupa bez danych → jedna komórka z wyjaśnieniem zamiast rzędu kresek
        if (!skipped.has(group.id)) {
          skipped.add(group.id);
          html += `<td class="dg-c dg-void" data-group="${group.id}" colspan="${o.spans.groups[group.id]}">${group.empty(row, ctx)}</td>`;
        }
        continue;
      }
      const v = col === sorted && max > 0 ? col.sort?.(row) : null;
      const bar = typeof v === 'number' ? ` style="--dg-bar:${(v / max).toFixed(3)}"` : '';
      html += `<td class="${columnClass(col, ctx.sort)}" data-label="${esc(col.short ?? col.label)}"${bar}>${col.cell(row, ctx)}</td>`;
    }
    html += '</tr>';
    if (open) html += renderDetail(config, row, o);
  }
  return html;
}

/* ---------- Paginacja ---------- */

/** Numery stron do pokazania: 1 … 4 5 [6] 7 8 … 55 (null = wielokropek). */
export function pageItems(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  // przy brzegach pokazujemy więcej sąsiadów, żeby liczba przycisków się nie zmieniała
  if (page <= 4) for (let p = 2; p <= 5; p++) keep.add(p);
  if (page >= pages - 3) for (let p = pages - 4; p < pages; p++) keep.add(p);
  const list = [...keep].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  list.forEach((p, i) => {
    const gap = i ? p - list[i - 1] : 1;
    if (gap === 2) out.push(p - 1); // jedna brakująca strona — lepiej numer niż „…”
    else if (gap > 2) out.push(null);
    out.push(p);
  });
  return out;
}

export function renderPages(page: number, pages: number): Html {
  if (pages <= 1) return '';
  const step = (to: number, label: string, word: string, cls: string) =>
    `<button type="button" class="dg-page dg-page--${cls}" data-dg-page="${to}" aria-label="${label}"${to < 1 || to > pages ? ' disabled' : ''}>` +
    `${cls === 'prev' ? '<span aria-hidden="true">‹</span>' : ''}<span class="dg-page__word" aria-hidden="true">${word}</span>${cls === 'next' ? '<span aria-hidden="true">›</span>' : ''}</button>`;
  let html = step(page - 1, 'Poprzednia strona', 'Poprzednia', 'prev');
  for (const p of pageItems(page, pages)) {
    html +=
      p === null
        ? '<span class="dg-page__gap" aria-hidden="true">…</span>'
        : `<button type="button" class="dg-page" data-dg-page="${p}" aria-label="Strona ${p}"${p === page ? ' aria-current="page"' : ''}>${formatPL(p)}</button>`;
  }
  return html + step(page + 1, 'Następna strona', 'Następna', 'next');
}

/** „26–50 z 93” */
export const pageRange = (from: number, count: number, found: number) =>
  count >= found ? `Wszystkie: ${formatPL(found)}` : `${formatPL(from + 1)}–${formatPL(from + count)} z ${formatPL(found)}`;
