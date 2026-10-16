/**
 * Wykresy symulatora podaży jako czyste funkcje → treść <svg> (string).
 * Ten sam kod rysuje pierwszy render (serwer) i każdą klatkę w przeglądarce.
 * Wymiary to piksele kontenera (viewBox = rozmiar na ekranie), więc podpisy osi
 * mają zawsze 11 px — także w wąskiej kolumnie na telefonie.
 * Klasy `c-*` stylują komponenty przez :global() (treść wstawiana jako HTML).
 */
import { BASE_INTAKE, INTAKE_MAX, INTAKE_STEP, YEAR0, YEAR_END, YEAR_MAX, YEAR_MIN, YEARS, type Point } from './model';

const f1 = (n: number) => n.toFixed(1);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 141 193 → „141,2 tys.”, 300 000 → „300 tys.” (twarda spacja przed jednostką). */
export function thousands(n: number): string {
  const v = Math.round(n / 100) / 10;
  return `${Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')}\u00A0tys.`;
}

// ---------- Nabór: słupki rok po roku ----------

export function intakeGeometry(width: number, height: number) {
  // x0: wąski margines — podpisy osi stoją nad liniami siatki, nie obok nich
  const x0 = 22, x1 = width - 2, yTop = 20, y0 = height - 20;
  const bar = (x1 - x0) / YEARS;
  return {
    width, height, x0, x1, yTop, y0, bar,
    x: (year: number) => x0 + (year - YEAR_MIN) * bar,
    y: (v: number) => y0 - (clamp(v, 0, INTAKE_MAX) / INTAKE_MAX) * (y0 - yTop),
    /** piksel → rocznik */
    yearAt: (px: number) => clamp(YEAR_MIN + Math.floor((px - x0) / bar), YEAR_MIN, YEAR_MAX),
    /** piksel → liczba miejsc, zaokrąglona do kroku */
    valueAt: (py: number) =>
      clamp(Math.round((((y0 - py) / (y0 - yTop)) * INTAKE_MAX) / INTAKE_STEP) * INTAKE_STEP, 0, INTAKE_MAX),
  };
}

const INTAKE_TICKS = [4000, 8000, 12000];
const INTAKE_YEARS = [1990, 2000, 2010, YEAR0, 2040, YEAR_MAX];

export function intakeChart(width: number, height: number, intake: readonly number[], selected?: number): string {
  const g = intakeGeometry(width, height);
  const now = g.x(YEAR0);
  let s = `<rect class="c-future" x="${f1(now)}" y="${g.yTop}" width="${f1(g.x1 - now)}" height="${g.y0 - g.yTop}"/>`;
  // Siatka przez całą szerokość, podpis nad linią przy lewej krawędzi; jednostka tylko przy najwyższej
  for (const v of INTAKE_TICKS) {
    const top = v === INTAKE_TICKS.at(-1);
    s += `<line class="c-grid" x1="0" x2="${g.x1}" y1="${f1(g.y(v))}" y2="${f1(g.y(v))}"/>`;
    s += `<text class="c-label" x="0" y="${f1(g.y(v) - 4)}">${v / 1000}${top ? '\u00A0tys.' : ''}</text>`;
  }
  s += `<line class="c-now" x1="${f1(now)}" x2="${f1(now)}" y1="${g.yTop - 14}" y2="${g.y0}"/>`;
  s += `<text class="c-label" x="${f1(now - 5)}" y="${g.yTop - 6}" text-anchor="end">← historia</text>`;
  s += `<text class="c-label" x="${f1(now + 5)}" y="${g.yTop - 6}">przyszłość →</text>`;

  const w = Math.max(1, g.bar - (g.bar > 4 ? 1.2 : 0.6));
  intake.forEach((v, i) => {
    const year = YEAR_MIN + i;
    const era = year < YEAR0 ? 'past' : 'future';
    const changed = v !== BASE_INTAKE[i] ? ' c-bar--changed' : '';
    const y = g.y(v);
    s += `<rect class="c-bar c-bar--${era}${changed}" x="${f1(g.x(year) + (g.bar - w) / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(g.y0 - y)}"/>`;
  });

  // Rzeczywistość (nabór „bez zmian”) — cienka linia, widoczna tam, gdzie słupek ją opuścił
  const ref = BASE_INTAKE.map((v, i) => `${f1(g.x(YEAR_MIN + i) + g.bar / 2)},${f1(g.y(v))}`).join(' ');
  s += `<polyline class="c-ref" points="${ref}"/>`;
  s += `<line class="c-axis" x1="${g.x0}" x2="${g.x1}" y1="${g.y0}" y2="${g.y0}"/>`;

  for (const year of INTAKE_YEARS) {
    const last = year === YEAR_MAX;
    const x = last ? g.x1 : g.x(year) + g.bar / 2;
    s += `<text class="c-label${year === YEAR0 ? ' c-label--strong' : ''}" x="${f1(x)}" y="${g.y0 + 15}" text-anchor="${last ? 'end' : 'middle'}">${year}</text>`;
  }

  if (selected !== undefined) {
    const v = intake[selected - YEAR_MIN];
    const top = Math.min(g.y(v), g.y0 - 3) - 3;
    s += `<rect class="c-selected" x="${f1(g.x(selected) - 1)}" y="${f1(top)}" width="${f1(g.bar + 2)}" height="${f1(g.y0 - top)}"/>`;
  }
  return s;
}

// ---------- Wynik: lekarze na rynku ----------

/** Skala osi: okrągłe setki tysięcy, nigdy mniej niż 400 tys. — przy zwykłych scenariuszach oś stoi w miejscu. */
export const resultScale = (max: number) => Math.max(400000, Math.ceil((max * 1.08) / 100000) * 100000);
/** Górna granica osi dla pary krzywych — wspólna dla wykresu i dymka w przeglądarce. */
export const resultMax = (a: Point[], b: Point[]) =>
  resultScale(Math.max(...a.map((p) => p.doctors), ...b.map((p) => p.doctors)));

export function resultGeometry(width: number, height: number, vMax: number) {
  const x0 = 50, x1 = width - 10, yTop = 10, y0 = height - 20;
  return {
    width, height, x0, x1, yTop, y0, vMax,
    x: (year: number) => x0 + ((year - YEAR0) / (YEAR_END - YEAR0)) * (x1 - x0),
    y: (v: number) => y0 - (clamp(v, 0, vMax) / vMax) * (y0 - yTop),
    /** piksel → rok */
    yearAt: (px: number) => clamp(YEAR0 + Math.round(((px - x0) / (x1 - x0)) * (YEAR_END - YEAR0)), YEAR0, YEAR_END),
  };
}

const RESULT_YEARS = [YEAR0, 2040, 2050, 2060];

export interface ResultChartInput {
  width: number;
  height: number;
  scenario: Point[];
  reference: Point[];
  /** linia odniesienia GUS — lekarze pracujący z pacjentem */
  gus: number;
  hover?: number;
}

/** Pole między scenariuszem a odniesieniem, osobno tam, gdzie lekarzy jest więcej i mniej. */
function gapAreas(a: number[], b: number[], X: (i: number) => number, Y: (v: number) => number) {
  type P = { x: number; ya: number; yb: number };
  const runs: { sign: number; pts: P[] }[] = [];
  let run = { sign: 0, pts: [] as P[] };
  a.forEach((va, i) => {
    const d = va - b[i];
    const sign = Math.sign(d);
    if (i > 0 && sign !== 0 && run.sign !== 0 && sign !== run.sign) {
      // przecięcie krzywych między i-1 a i — tu kończy się jedno pole i zaczyna drugie
      const dPrev = a[i - 1] - b[i - 1];
      const t = dPrev === 0 ? 0 : dPrev / (dPrev - d);
      const x = X(i - 1) + t * (X(i) - X(i - 1));
      const y = Y(a[i - 1] + t * (va - a[i - 1]));
      run.pts.push({ x, ya: y, yb: y });
      runs.push(run);
      run = { sign, pts: [{ x, ya: y, yb: y }] };
    }
    if (run.sign === 0) run.sign = sign;
    run.pts.push({ x: X(i), ya: Y(va), yb: Y(b[i]) });
  });
  runs.push(run);

  const path = (r: (typeof runs)[number]) =>
    `M${r.pts.map((p) => `${f1(p.x)},${f1(p.ya)}`).join('L')}L${[...r.pts].reverse().map((p) => `${f1(p.x)},${f1(p.yb)}`).join('L')}Z`;
  return {
    more: runs.filter((r) => r.sign > 0).map(path).join(''),
    less: runs.filter((r) => r.sign < 0).map(path).join(''),
  };
}

export function resultChart({ width, height, scenario, reference, gus, hover }: ResultChartInput): string {
  const vMax = resultMax(scenario, reference);
  const g = resultGeometry(width, height, vMax);
  const step = 100000 * Math.ceil(vMax / 500000);
  const line = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f1(g.x(p.year))},${f1(g.y(p.doctors))}`).join('');

  let s = '';
  for (let v = 0; v <= vMax; v += step) {
    s += `<line class="c-grid" x1="${g.x0}" x2="${g.x1}" y1="${f1(g.y(v))}" y2="${f1(g.y(v))}"/>`;
    s += `<text class="c-label" x="${g.x0 - 6}" y="${f1(g.y(v) + 4)}" text-anchor="end">${v ? thousands(v) : '0'}</text>`;
  }

  const gap = gapAreas(
    scenario.map((p) => p.doctors), reference.map((p) => p.doctors),
    (i) => g.x(scenario[i].year), g.y,
  );
  if (gap.more) s += `<path class="c-gap c-gap--more" d="${gap.more}"/>`;
  if (gap.less) s += `<path class="c-gap c-gap--less" d="${gap.less}"/>`;

  const yGus = f1(g.y(gus));
  s += `<line class="c-gus" x1="${g.x0}" x2="${g.x1}" y1="${yGus}" y2="${yGus}"/>`;
  if (width >= 420) {
    s += `<text class="c-label c-label--gus" x="${g.x1}" y="${f1(g.y(gus) + 14)}" text-anchor="end">${thousands(gus)} pracuje dziś z pacjentem (GUS)</text>`;
  }

  s += `<path class="c-line c-line--ref" d="${line(reference)}"/>`;
  s += `<path class="c-line c-line--you" d="${line(scenario)}"/>`;
  s += `<line class="c-axis" x1="${g.x0}" x2="${g.x1}" y1="${g.y0}" y2="${g.y0}"/>`;
  RESULT_YEARS.forEach((year, i) => {
    const anchor = i === 0 ? 'start' : 'middle';
    s += `<text class="c-label" x="${f1(g.x(year))}" y="${g.y0 + 15}" text-anchor="${anchor}">${year}</text>`;
  });

  if (hover !== undefined) {
    const i = hover - YEAR0;
    const x = f1(g.x(hover));
    s += `<line class="c-guide" x1="${x}" x2="${x}" y1="${g.yTop}" y2="${g.y0}"/>`;
    s += `<circle class="c-dot c-dot--ref" cx="${x}" cy="${f1(g.y(reference[i].doctors))}" r="3.5"/>`;
    s += `<circle class="c-dot c-dot--you" cx="${x}" cy="${f1(g.y(scenario[i].doctors))}" r="4.5"/>`;
  }
  return s;
}
