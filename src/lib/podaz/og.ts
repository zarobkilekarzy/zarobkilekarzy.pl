/**
 * Obrazek OG symulatora: te same wykresy co na stronie (lib/podaz/charts), w dziennych barwach.
 * Scenariusz z presetów: cięcie naboru w wariancie A zespołu NIL wobec limitów bez zmian.
 */
import type { OgPage } from '@/types';
import { tokenColor } from '@/lib/tokens';
import { intakeChart, resultChart } from './charts';
import { DEFAULTS, GUS_WITH_PATIENTS, PRESETS, simulate } from './model';

const W = 470;
const INTAKE_H = 170;
const RESULT_H = 200;
// rocznik zaznaczony na naborze i rok odczytu na wyniku — jak po kliknięciu w narzędziu
const SELECTED = 2030;
const HOVER = 2050;

const c = (name: string) => tokenColor(name, false);
// klasy c-* jak w components/podaz/SupplySimulator.astro; SVG w <img> nie widzi CSS strony
const style = `
.c-grid{stroke:${c('line')}}.c-axis{stroke:${c('line-2')}}
.c-future{fill:${c('bg-soft')}}.c-now{stroke:${c('muted')};stroke-dasharray:3 3}
.c-bar--past{fill:${c('chart-soft')}}.c-bar--future{fill:${c('chart')}}.c-bar--changed{fill:${c('blue')}}
.c-ref{fill:none;stroke:${c('ink')};stroke-width:1;opacity:.5}.c-selected{fill:none;stroke:${c('ink')};stroke-width:1.5}
.c-gap--more{fill:${c('ok')};opacity:.16}.c-gap--less{fill:${c('bad')};opacity:.16}.c-gus{stroke:${c('muted')};stroke-dasharray:2 4}
.c-line{fill:none;stroke-linejoin:round;stroke-linecap:round}.c-line--you{stroke:${c('blue')};stroke-width:2.5}
.c-line--ref{stroke:${c('ink')};stroke-width:1.5;stroke-dasharray:5 4;opacity:.55}.c-guide{stroke:${c('muted')};stroke-dasharray:2 3}
.c-dot{stroke:#fff;stroke-width:2}.c-dot--you{fill:${c('blue')}}.c-dot--ref{fill:${c('muted')}}`;

const svg = (height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}"><style>${style}</style>${body}</svg>`;

// Strzałki „← historia / przyszłość →”: Plex Mono w OG nie ma „→” (tofu)
const noArrows = (s: string) => s.replace(/← |\s→/g, '');

export function simulatorOgPanels(): NonNullable<OgPage['panels']> {
  const intake = (id: string) => PRESETS.find((p) => p.id === id)!.intake();
  const cut = intake('nil-a');
  const scenario = simulate(cut, DEFAULTS);
  const reference = simulate(intake('baza'), DEFAULTS);
  return [
    { head: 'Ustawiasz nabór na medycynę', height: INTAKE_H, svg: svg(INTAKE_H, noArrows(intakeChart(W, INTAKE_H, cut, SELECTED))) },
    {
      head: 'Model liczy, ilu będzie lekarzy',
      height: RESULT_H,
      svg: svg(RESULT_H, resultChart({ width: W, height: RESULT_H, scenario, reference, gus: GUS_WITH_PATIENTS, hover: HOVER })),
    },
  ];
}
