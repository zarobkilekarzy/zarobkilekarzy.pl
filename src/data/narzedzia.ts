/**
 * Kafle narzędzi w hubach działów (/dane/, /analizy/) — blocks/ToolTiles.
 * Słupki podaży to dane modelu (nabór na medycynę rok po roku), nie ozdoba.
 */
import type { ToolTile } from '@/types';
import { monitoringTool as monitoring } from '@/data/home';
import * as doctors from '@/lib/podaz/model';

export const toolTiles: ToolTile[] = [
  {
    tone: 'blue',
    label: 'Symulatory',
    title: 'Sprawdź podaż',
    desc: 'Ilu lekarzy i pielęgniarek będzie pracować za 10, 20 i 30 lat — przy dzisiejszym naborze, wyjazdach i odejściach. Zmień założenia i policz sam.',
    links: [
      { label: 'Lekarzy', href: '/analizy/symulator-podazy-lekarzy/' },
      { label: 'Pielęgniarek', href: '/analizy/symulator-podazy-pielegniarek/' },
    ],
    bars: { values: doctors.BASE_INTAKE, max: doctors.INTAKE_MAX, past: doctors.FIRST_EDITABLE - doctors.YEAR_MIN },
  },
  {
    label: 'Egzamin LEK',
    title: 'Prawdziwe pytania z bazy CEM',
    desc: 'Rozwiąż test z jawnej bazy pytań — w trybie nauki zobaczysz klucz i to, jak odpowiadała sala.',
    links: [{ label: 'Rozwiąż test', href: '/egzamin/' }],
    pictogram: 'znacznik',
  },
  {
    tone: 'blue',
    label: 'Monitoring',
    title: monitoring.title,
    desc: monitoring.desc,
    links: [{ label: 'Otwórz przeglądarkę', href: monitoring.href }],
    pictogram: 'szpital',
  },
];
