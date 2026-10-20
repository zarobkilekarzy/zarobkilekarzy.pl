/**
 * Obrazek OG symulatora pielęgniarek: te same wykresy co na stronie (lib/podaz/pielegniarki/charts),
 * w dziennych barwach — jak lib/podaz/og dla lekarzy. Wynik: zamrożony dopływ z prognozy NIPiP
 * wobec dopływu bez zmian; pod nim drabina wieku w 2050 r. z kreską przy stanie dzisiejszym.
 */
import type { OgPage } from '@/types';
import { tokenColor } from '@/lib/tokens';
import { LADDER_HEIGHT, ladderChart, ladderMax, resultChart } from './charts';
import { DEFAULTS, PRESETS, YEAR0, simulate } from './model';
import { HEADLINE_YEAR } from './summary';

const W = 470;
const RESULT_H = 170;
// rok odczytu na wyniku i rok drabiny — ten sam co w nagłówku narzędzia
const HOVER = HEADLINE_YEAR;

const c = (name: string) => tokenColor(name, false);
// klasy c-* jak w NurseSupplySimulator.astro i styles/symulator-podazy.css; SVG w <img> nie widzi CSS strony
const style = `
.c-grid{stroke:${c('line')}}.c-axis{stroke:${c('line-2')}}
.c-gap--more{fill:${c('ok')};opacity:.16}.c-gap--less{fill:${c('bad')};opacity:.16}.c-gus{fill:none;stroke:${c('muted')};stroke-dasharray:2 4}
.c-line{fill:none;stroke-linejoin:round;stroke-linecap:round}.c-line--you{stroke:${c('blue')};stroke-width:2.5}
.c-line--ref{stroke:${c('ink')};stroke-width:1.5;stroke-dasharray:5 4;opacity:.55}.c-guide{stroke:${c('muted')};stroke-dasharray:2 3}
.c-dot{stroke:#fff;stroke-width:2}.c-dot--you{fill:${c('blue')}}.c-dot--ref{fill:${c('muted')}}
.c-zone{fill:${c('bg-soft')}}.c-bar--ladder{fill:${c('blue')}}.c-tick{stroke:${c('ink')};stroke-width:2}`;

const svg = (height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}"><style>${style}</style>${body}</svg>`;

// Podpis linii gęstości na małym wykresie wchodzi na krzywe — na karcie zostaje sama linia
const noDensityLabel = (s: string) => s.replace(/<text class="c-label c-label--gus"[^>]*>[^<]*<\/text>/, '');

export function nurseSimulatorOgPanels(): NonNullable<OgPage['panels']> {
  const rights = (id: string) => PRESETS.find((p) => p.id === id)!.rights();
  const scenario = simulate(rights('nipip'), DEFAULTS);
  const reference = simulate(rights('baza'), DEFAULTS);
  const year = reference[HOVER - YEAR0];
  return [
    {
      head: 'Ile pielęgniarek będzie pracować',
      height: RESULT_H,
      svg: svg(RESULT_H, noDensityLabel(resultChart({ width: W, height: RESULT_H, scenario, reference, hover: HOVER }))),
    },
    {
      head: `Drabina wieku w ${HOVER} r. (kreska: dziś)`,
      height: LADDER_HEIGHT,
      svg: svg(LADDER_HEIGHT, ladderChart({ width: W, ladder: year.ladder, today: reference[0].ladder, vMax: ladderMax(reference) })),
    },
  ];
}
