/**
 * Wykresy symulatora podaży pielęgniarek jako czyste funkcje → treść <svg> (string).
 * Ten sam kod rysuje pierwszy render (serwer) i każdą klatkę w przeglądarce;
 * wygląd (klasy `c-*`) i zasady rysowania jak w symulatorze lekarzy (lib/podaz/charts).
 */
import { gapAreas, thousands } from '../charts';
import {
  BASE_RIGHTS, DENSITY_TODAY, LADDER, RIGHTS_MAX, RIGHTS_STEP, YEAR0, YEAR_END, YEAR_MAX, YEAR_MIN, YEARS,
  population, type Point,
} from './model';

const f1 = (n: number) => n.toFixed(1);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------- Dopływ: słupki rok po roku ----------

export function rightsGeometry(width: number, height: number) {
  const x0 = 22, x1 = width - 2, yTop = 20, y0 = height - 20;
  const bar = (x1 - x0) / YEARS;
  return {
    width, height, x0, x1, yTop, y0, bar,
    x: (year: number) => x0 + (year - YEAR_MIN) * bar,
    y: (v: number) => y0 - (clamp(v, 0, RIGHTS_MAX) / RIGHTS_MAX) * (y0 - yTop),
    /** piksel → rok; historia (do YEAR0) jest z danych i się nie zmienia */
    yearAt: (px: number) => clamp(YEAR_MIN + Math.floor((px - x0) / bar), YEAR0 + 1, YEAR_MAX),
    /** piksel → liczba osób, zaokrąglona do kroku */
    valueAt: (py: number) =>
      clamp(Math.round((((y0 - py) / (y0 - yTop)) * RIGHTS_MAX) / RIGHTS_STEP) * RIGHTS_STEP, 0, RIGHTS_MAX),
  };
}

// Bez linii przy samej górze osi — tam stoją podpisy „dane NIPiP | przyszłość”
const RIGHTS_TICKS = [10000, 20000];
const RIGHTS_YEARS = [YEAR_MIN, YEAR0, 2040, YEAR_MAX];

export function rightsChart(width: number, height: number, rights: readonly number[], selected?: number): string {
  const g = rightsGeometry(width, height);
  const now = g.x(YEAR0 + 1);
  let s = `<rect class="c-future" x="${f1(now)}" y="${g.yTop}" width="${f1(g.x1 - now)}" height="${g.y0 - g.yTop}"/>`;
  for (const v of RIGHTS_TICKS) {
    const top = v === RIGHTS_TICKS.at(-1);
    s += `<line class="c-grid" x1="0" x2="${g.x1}" y1="${f1(g.y(v))}" y2="${f1(g.y(v))}"/>`;
    s += `<text class="c-label" x="0" y="${f1(g.y(v) - 4)}">${v / 1000}${top ? ' tys.' : ''}</text>`;
  }
  s += `<line class="c-now" x1="${f1(now)}" x2="${f1(now)}" y1="${g.yTop - 14}" y2="${g.y0}"/>`;
  s += `<text class="c-label" x="${f1(now - 5)}" y="${g.yTop - 6}" text-anchor="end">← dane NIPiP</text>`;
  s += `<text class="c-label" x="${f1(now + 5)}" y="${g.yTop - 6}">przyszłość →</text>`;

  const w = Math.max(1, g.bar - (g.bar > 4 ? 1.2 : 0.6));
  rights.forEach((v, i) => {
    const year = YEAR_MIN + i;
    const era = year <= YEAR0 ? 'past' : 'future';
    const changed = v !== BASE_RIGHTS[i] ? ' c-bar--changed' : '';
    const y = g.y(v);
    s += `<rect class="c-bar c-bar--${era}${changed}" x="${f1(g.x(year) + (g.bar - w) / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(g.y0 - y)}"/>`;
  });

  // Dopływ „bez zmian” w przyszłości — cienka linia, widoczna tam, gdzie słupek ją opuścił
  const ref = BASE_RIGHTS.map((v, i) => [YEAR_MIN + i, v] as const).filter(([year]) => year > YEAR0)
    .map(([year, v]) => `${f1(g.x(year) + g.bar / 2)},${f1(g.y(v))}`).join(' ');
  s += `<polyline class="c-ref" points="${ref}"/>`;
  s += `<line class="c-axis" x1="${g.x0}" x2="${g.x1}" y1="${g.y0}" y2="${g.y0}"/>`;

  for (const year of RIGHTS_YEARS) {
    const anchor = year === YEAR_MAX ? 'end' : year === YEAR_MIN ? 'start' : 'middle';
    const x = year === YEAR_MAX ? g.x1 : year === YEAR_MIN ? g.x0 : g.x(year) + g.bar / 2;
    s += `<text class="c-label${year === YEAR0 ? ' c-label--strong' : ''}" x="${f1(x)}" y="${g.y0 + 15}" text-anchor="${anchor}">${year}</text>`;
  }

  if (selected !== undefined) {
    const v = rights[selected - YEAR_MIN];
    const top = Math.min(g.y(v), g.y0 - 3) - 3;
    s += `<rect class="c-selected" x="${f1(g.x(selected) - 1)}" y="${f1(top)}" width="${f1(g.bar + 2)}" height="${f1(g.y0 - top)}"/>`;
  }
  return s;
}

// ---------- Wynik: zatrudnione pielęgniarki ----------

/** Skala osi: okrągłe setki tysięcy, nigdy mniej niż 300 tys. */
export const resultScale = (max: number) => Math.max(300000, Math.ceil((max * 1.08) / 100000) * 100000);
export const resultMax = (a: Point[], b: Point[]) =>
  resultScale(Math.max(...a.map((p) => p.nurses), ...b.map((p) => p.nurses)));

export function resultGeometry(width: number, height: number, vMax: number) {
  const x0 = 50, x1 = width - 10, yTop = 10, y0 = height - 20;
  return {
    width, height, x0, x1, yTop, y0, vMax,
    x: (year: number) => x0 + ((year - YEAR0) / (YEAR_END - YEAR0)) * (x1 - x0),
    y: (v: number) => y0 - (clamp(v, 0, vMax) / vMax) * (y0 - yTop),
    yearAt: (px: number) => clamp(YEAR0 + Math.round(((px - x0) / (x1 - x0)) * (YEAR_END - YEAR0)), YEAR0, YEAR_END),
  };
}

const RESULT_YEARS = [YEAR0, 2040, 2050, YEAR_END];

export interface ResultChartInput {
  width: number;
  height: number;
  scenario: Point[];
  reference: Point[];
  hover?: number;
}

export function resultChart({ width, height, scenario, reference, hover }: ResultChartInput): string {
  const vMax = resultMax(scenario, reference);
  const g = resultGeometry(width, height, vMax);
  const step = 100000 * Math.ceil(vMax / 500000);
  const line = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f1(g.x(p.year))},${f1(g.y(p.nurses))}`).join('');

  let s = '';
  for (let v = 0; v <= vMax; v += step) {
    s += `<line class="c-grid" x1="${g.x0}" x2="${g.x1}" y1="${f1(g.y(v))}" y2="${f1(g.y(v))}"/>`;
    s += `<text class="c-label" x="${g.x0 - 6}" y="${f1(g.y(v) + 4)}" text-anchor="end">${v ? thousands(v) : '0'}</text>`;
  }

  const gap = gapAreas(
    scenario.map((p) => p.nurses), reference.map((p) => p.nurses),
    (i) => g.x(scenario[i].year), g.y,
  );
  if (gap.more) s += `<path class="c-gap c-gap--more" d="${gap.more}"/>`;
  if (gap.less) s += `<path class="c-gap c-gap--less" d="${gap.less}"/>`;

  // Dzisiejsza gęstość: ile pielęgniarek trzeba, żeby na 1000 mieszkańców było tyle samo co dziś.
  // Ludność maleje, więc ta linia opada.
  const density = scenario.map((p, i) => `${i ? 'L' : 'M'}${f1(g.x(p.year))},${f1(g.y(DENSITY_TODAY * population(p.year) * 1000))}`).join('');
  s += `<path class="c-gus c-line" d="${density}"/>`;
  if (width >= 420) {
    const yEnd = g.y(DENSITY_TODAY * population(YEAR_END) * 1000);
    s += `<text class="c-label c-label--gus" x="${g.x1}" y="${f1(yEnd + 14)}" text-anchor="end">tyle samo na 1000 mieszkańców co dziś</text>`;
  }

  s += `<path class="c-line c-line--ref" d="${line(reference)}"/>`;
  s += `<path class="c-line c-line--you" d="${line(scenario)}"/>`;
  s += `<line class="c-axis" x1="${g.x0}" x2="${g.x1}" y1="${g.y0}" y2="${g.y0}"/>`;
  RESULT_YEARS.forEach((year, i) => {
    const anchor = i === 0 ? 'start' : i === RESULT_YEARS.length - 1 ? 'end' : 'middle';
    s += `<text class="c-label" x="${f1(g.x(year))}" y="${g.y0 + 15}" text-anchor="${anchor}">${year}</text>`;
  });

  if (hover !== undefined) {
    const i = hover - YEAR0;
    const x = f1(g.x(hover));
    s += `<line class="c-guide" x1="${x}" x2="${x}" y1="${g.yTop}" y2="${g.y0}"/>`;
    s += `<circle class="c-dot c-dot--ref" cx="${x}" cy="${f1(g.y(reference[i].nurses))}" r="3.5"/>`;
    s += `<circle class="c-dot c-dot--you" cx="${x}" cy="${f1(g.y(scenario[i].nurses))}" r="4.5"/>`;
  }
  return s;
}

// ---------- Drabina wieku w wybranym roku ----------

/** Wysokość szczebla drabiny i całego wykresu (sześć grup wieku). */
const LADDER_ROW = 24;
export const LADDER_HEIGHT = LADDER.length * LADDER_ROW;

/** Skala drabiny — wspólna dla wszystkich lat scenariusza, żeby zmiana roku nie przeskalowała pasków. */
export const ladderMax = (points: Point[]) =>
  Math.max(90000, Math.ceil(Math.max(...points.flatMap((p) => p.ladder)) / 10000) * 10000);

export interface LadderChartInput {
  width: number;
  /** Liczba w grupach wieku (od najmłodszej) w wybranym roku. */
  ladder: number[];
  /** Ta sama drabina dziś — cienka kreska przy każdym szczeblu. */
  today: number[];
  vMax: number;
}

export function ladderChart({ width, ladder, today, vMax }: LadderChartInput): string {
  const row = LADDER_ROW, labelW = 44, valueW = 92;
  const x0 = labelW, x1 = Math.max(x0 + 40, width - valueW);
  const X = (v: number) => x0 + (clamp(v, 0, vMax) / vMax) * (x1 - x0);
  const total = ladder.reduce((a, b) => a + b, 0);
  // Szczeble od najstarszych u góry, jak na drabinie w analizie
  const rows = LADDER.map((g, i) => ({ ...g, n: ladder[i], now: today[i] })).reverse();
  const zone = rows.filter((r) => r.from > 60).length;

  let s = `<rect class="c-zone" x="0" y="0" width="${width}" height="${zone * row}"/>`;
  rows.forEach((r, i) => {
    const y = i * row;
    const mid = y + row / 2;
    s += `<text class="c-label c-label--strong" x="0" y="${f1(mid + 4)}">${r.label}</text>`;
    s += `<rect class="c-bar c-bar--ladder" x="${x0}" y="${f1(y + 5)}" width="${f1(X(r.n) - x0)}" height="${row - 10}"/>`;
    s += `<line class="c-tick" x1="${f1(X(r.now))}" x2="${f1(X(r.now))}" y1="${f1(y + 2)}" y2="${f1(y + row - 2)}"/>`;
    const share = total ? Math.round((r.n / total) * 100) : 0;
    // Podpis za paskiem albo za kreską dzisiejszego stanu — co dalej, żeby kreska nie przecinała liczby
    s += `<text class="c-label" x="${f1(Math.max(X(r.n), X(r.now)) + 6)}" y="${f1(mid + 4)}">${thousands(r.n)} · ${share}%</text>`;
  });
  s += `<line class="c-axis" x1="${x0}" x2="${x0}" y1="0" y2="${rows.length * row}"/>`;
  return s;
}
