/**
 * Logika datagridu bez DOM: wyszukiwanie, filtry z licznikami, sortowanie, stan w adresie.
 * Ten sam kod liczy pierwszy widok na serwerze i każdą zmianę w przeglądarce.
 */
import { fold } from '@/lib/format';
import type { Column, GridConfig, GridState, SortDir } from './types';

export interface Index<T> {
  rows: T[];
  /** tekst do wyszukiwania (bez polskich znaków i wielkich liter), równoległy do rows */
  hay: string[];
}

export interface Result<T> {
  rows: T[];
  /** liczniki opcji filtrów: id filtra → wartość → ile wierszy pokaże zaznaczenie tej opcji */
  counts: Record<string, Record<string, number>>;
  /** ile wierszy zostanie po włączeniu przełącznika */
  toggles: Record<string, number>;
  /** przełączniki z `fallback`, pominięte, bo z nimi nie było żadnego wyniku */
  relaxed: string[];
}

export const buildIndex = <T>(config: GridConfig<T, any>, rows: T[]): Index<T> => ({
  rows,
  hay: rows.map((row) => fold(config.search.text(row))),
});

export const terms = (q: string) => fold(q).split(/\s+/).filter(Boolean);

export const defaultToggles = (config: GridConfig<any, any>) => (config.toggles ?? []).filter((t) => t.default).map((t) => t.id);

export function defaultState(config: GridConfig<any, any>): GridState {
  return { q: '', facets: {}, toggles: defaultToggles(config), sort: { ...config.sort }, page: 1, perPage: config.pageSize };
}

/* ---------- Strony ---------- */

export const pageCount = (found: number, perPage: number) => (perPage > 0 ? Math.max(1, Math.ceil(found / perPage)) : 1);

/** Wiersze bieżącej strony; numer strony spoza zakresu sprowadza do najbliższego istniejącego. */
export function pageOf<T>(rows: T[], state: GridState): { rows: T[]; page: number; pages: number; from: number } {
  const pages = pageCount(rows.length, state.perPage);
  const page = Math.min(Math.max(1, state.page), pages);
  if (state.perPage <= 0) return { rows, page, pages, from: 0 };
  const from = (page - 1) * state.perPage;
  return { rows: rows.slice(from, from + state.perPage), page, pages, from };
}

const sortable = <T>(config: GridConfig<T, any>, id: string) =>
  config.columns.find((c): c is Column<T> & Required<Pick<Column<T>, 'sort'>> => c.id === id && !!c.sort);

const collator = new Intl.Collator('pl', { sensitivity: 'base', numeric: true });

function compare(a: number | string | null, b: number | string | null, dir: SortDir): number {
  // brak wartości zawsze na końcu, niezależnie od kierunku
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  const d = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(String(a), String(b));
  return dir === 'asc' ? d : -d;
}

type Counts = Record<string, Record<string, number>>;
const bump = (counts: Counts, facet: string, value: string) => {
  counts[facet][value] = (counts[facet][value] ?? 0) + 1;
};

export function query<T>(config: GridConfig<T, any>, index: Index<T>, state: GridState): Result<T> {
  const words = terms(state.q);
  const on = (config.toggles ?? []).filter((t) => state.toggles.includes(t.id));
  // przełącznik z `fallback` jest „miękki”: gdy z nim nic nie zostaje, pokazujemy wyniki bez niego
  const hard = on.filter((t) => !t.fallback);
  const soft = on.filter((t) => t.fallback);
  const active = config.facets
    .map((f) => ({ facet: f, values: new Set(state.facets[f.id] ?? []) }))
    .filter((a) => a.values.size > 0);

  const empty = (): Counts => Object.fromEntries(config.facets.map((f) => [f.id, {}]));
  const strict = empty(); // z miękkimi przełącznikami
  const loose = empty(); // bez nich
  const toggleCounts: Record<string, number> = Object.fromEntries((config.toggles ?? []).map((t) => [t.id, 0]));
  const rows: T[] = [];
  const all: T[] = [];

  index.rows.forEach((row, i) => {
    if (!words.every((w) => index.hay[i].includes(w))) return;
    if (!hard.every((t) => t.test(row))) return;
    const pass = soft.every((t) => t.test(row));

    // Które aktywne filtry odrzucają wiersz? Licznik opcji filtra liczy się bez niego samego,
    // więc pokazuje, ile wierszy dałoby zaznaczenie tej opcji.
    const failed = active.filter((a) => !a.values.has(a.facet.value(row) ?? ''));
    for (const facet of config.facets) {
      if (failed.length === 0 || (failed.length === 1 && failed[0].facet === facet)) {
        const v = facet.value(row);
        if (v === null) continue;
        bump(loose, facet.id, v);
        if (pass) bump(strict, facet.id, v);
      }
    }
    if (failed.length) return;
    all.push(row);
    if (!pass) return;
    rows.push(row);
    for (const t of config.toggles ?? []) if (!state.toggles.includes(t.id) && t.test(row)) toggleCounts[t.id]++;
  });
  for (const t of on) toggleCounts[t.id] = rows.length;

  const relaxed = rows.length === 0 && all.length > 0 ? soft.map((t) => t.id) : [];
  const shown = relaxed.length ? all : rows;

  // Licznik opcji = ile wierszy pokaże jej zaznaczenie: z miękkim przełącznikiem, a gdy tam zero —
  // bez niego (zadziała fallback). Pasek rozkładu to przegląd całości, więc miękkie przełączniki pomija.
  const counts: Counts = Object.fromEntries(
    config.facets.map((f) => [
      f.id,
      f.display === 'bar'
        ? loose[f.id]
        : Object.fromEntries(Object.entries(loose[f.id]).map(([v, n]) => [v, strict[f.id][v] || n])),
    ]),
  );

  const col = sortable(config, state.sort.by) ?? sortable(config, config.sort.by);
  const sorted = col
    ? shown
        .map((row) => ({ row, v: col.sort(row) }))
        .sort((a, b) => compare(a.v, b.v, state.sort.dir) || (config.tiebreak?.(a.row, b.row) ?? 0))
        .map((k) => k.row)
    : shown;
  return { rows: sorted, counts, toggles: toggleCounts, relaxed };
}

/** Największa wartość liczbowa w kolumnie — skala pasków wielkości. */
export function extent<T>(column: Column<T, any>, rows: T[]): number {
  if (!column.sort) return 0;
  return rows.reduce((max, row) => {
    const v = column.sort!(row);
    return typeof v === 'number' && v > max ? v : max;
  }, 0);
}

/* ---------- Stan w adresie strony: ?q=…&woj=slaskie,opolskie&tylko=listy&sort=-mediana ----------
   Zapisujemy tylko to, co różni się od widoku domyślnego. */

const TOGGLES_PARAM = 'tylko';
const PAGE_PARAM = 'strona';
const PER_PAGE_PARAM = 'na-stronie';
const ALL = 'wszystkie';

export function readState(config: GridConfig<any, any>, search: string): GridState {
  const params = new URLSearchParams(search);
  const state = defaultState(config);
  state.q = params.get('q') ?? '';
  for (const f of config.facets) {
    const allowed = new Set(f.options.map((o) => o.value));
    const values = (params.get(f.id) ?? '').split(',').filter((v) => allowed.has(v));
    if (values.length) state.facets[f.id] = values;
  }
  // brak parametru = przełączniki domyślne; pusty (?tylko=) = świadomie wyłączone
  const toggleIds = new Set((config.toggles ?? []).map((t) => t.id));
  const toggles = params.get(TOGGLES_PARAM);
  if (toggles !== null) state.toggles = toggles.split(',').filter((t) => toggleIds.has(t));
  const page = Number(params.get(PAGE_PARAM));
  if (Number.isInteger(page) && page > 1) state.page = page;
  const per = params.get(PER_PAGE_PARAM);
  const perPage = per === ALL ? 0 : Number(per);
  if (per !== null && (config.pageSizes ?? [config.pageSize]).includes(perPage)) state.perPage = perPage;
  const sort = params.get('sort');
  if (sort) {
    const by = sort.replace(/^-/, '');
    if (sortable(config, by)) state.sort = { by, dir: sort.startsWith('-') ? 'desc' : 'asc' };
  }
  return state;
}

export function writeState(config: GridConfig<any, any>, state: GridState): string {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set('q', state.q.trim());
  for (const f of config.facets) {
    const values = state.facets[f.id];
    if (values?.length) params.set(f.id, values.join(','));
  }
  const ordered = (config.toggles ?? []).map((t) => t.id).filter((id) => state.toggles.includes(id));
  if (ordered.join(',') !== defaultToggles(config).join(',')) params.set(TOGGLES_PARAM, ordered.join(','));
  const { by, dir } = state.sort;
  if (by !== config.sort.by || dir !== config.sort.dir) params.set('sort', `${dir === 'desc' ? '-' : ''}${by}`);
  if (state.perPage !== config.pageSize) params.set(PER_PAGE_PARAM, state.perPage > 0 ? String(state.perPage) : ALL);
  if (state.page > 1) params.set(PAGE_PARAM, String(state.page));
  // przecinki zostawiamy czytelne — to adres do wklejenia w artykuł
  return params.toString().replace(/%2C/g, ',');
}

/* ---------- CSV (separator ; i BOM — tak otwiera go polski Excel) ---------- */

export function toCsv<T, D>(config: GridConfig<T, D>, data: D, rows: T[]): string {
  if (!config.csv) return '';
  const columns = config.csv.columns(data);
  const cell = (v: string | number | null) => {
    if (v === null) return '';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => cell(c.label)).join(';')];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(';'));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
