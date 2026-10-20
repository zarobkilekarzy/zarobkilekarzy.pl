/**
 * Kafle narzędzi w hubach działów — blocks/ToolTiles. Każdy hub ma własny zestaw trzech kafli
 * (`hubTiles`), żeby /dane/, /analizy/ i /mechanizmy/ nie powtarzały tego samego bloku.
 * Słupki podaży to dane modelu (nabór na medycynę rok po roku), nie ozdoba.
 */
import type { ToolTile } from '@/types';
import { monitoringTool as monitoring } from '@/data/home';
import { actions } from '@/data/dzialaj';
import { barometrPage } from '@/data/barometr-polityczny';
import { page as sorPage } from '@/data/kolejki-sor';
import * as doctors from '@/lib/podaz/model';

const supply: ToolTile = {
  label: 'Symulatory',
  title: 'Sprawdź podaż',
  desc: 'Ilu lekarzy i pielęgniarek będzie pracować za 10, 20 i 30 lat — przy dzisiejszym naborze, wyjazdach i odejściach. Zmień założenia i policz sam.',
  links: [
    { label: 'Lekarzy', href: '/analizy/symulator-podazy-lekarzy/' },
    { label: 'Pielęgniarek', href: '/analizy/symulator-podazy-pielegniarek/' },
  ],
  bars: { values: doctors.BASE_INTAKE, max: doctors.INTAKE_MAX, past: doctors.FIRST_EDITABLE - doctors.YEAR_MIN },
};

const exam: ToolTile = {
  label: 'Egzamin LEK',
  title: 'Prawdziwe pytania z bazy CEM',
  desc: 'Rozwiąż test z jawnej bazy pytań — w trybie nauki zobaczysz klucz i to, jak odpowiadała sala.',
  links: [{ label: 'Rozwiąż test', href: '/egzamin/' }],
  pictogram: 'znacznik',
};

const monitoringTile: ToolTile = {
  label: 'Monitoring',
  title: monitoring.title,
  desc: monitoring.desc,
  links: [{ label: 'Otwórz przeglądarkę', href: monitoring.href }],
  pictogram: 'szpital',
};

const sor: ToolTile = {
  label: 'Na żywo',
  title: sorPage.title,
  desc: sorPage.description,
  links: [{ label: 'Zobacz mapę', href: '/prawa-pacjenta/sor/' }],
  pictogram: 'kolejka',
};

const barometer: ToolTile = {
  label: 'Barometr polityczny',
  title: 'Co partie proponują w ochronie zdrowia',
  desc: 'Te same pytania dla każdej partii i źródło przy każdej tezie.',
  links: [{ label: 'Otwórz barometr', href: barometrPage.href }],
  pictogram: 'barometr',
};

const share: ToolTile = {
  label: 'Działaj',
  title: actions.infographics.title,
  desc: actions.infographics.text,
  links: [{ label: actions.infographics.link.label, href: `/dzialaj/${actions.infographics.link.href}` }],
  pictogram: 'infografika',
};

/** Zestawy kafli hubów; kolor kafla wynika z pozycji (blocks/ToolTiles). */
export const hubTiles = {
  dane: [monitoringTile, supply, sor],
  analizy: [supply, exam, barometer],
  mechanizmy: [share, sor, barometer],
} satisfies Record<string, ToolTile[]>;
