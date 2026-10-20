/**
 * Słowny komentarz do wyniku symulatora pielęgniarek — co znaczy różnica między
 * scenariuszem użytkownika a scenariuszem „bez zmian”. Czysta funkcja: serwer liczy
 * nią tekst startowy, przeglądarka — każdy kolejny.
 */
import { formatPL } from '@/lib/format';
import {
  BASE_RIGHTS, DEFAULTS, FIRST_POLICY, YEAR0, YEAR_END, YEAR_MIN, nursesPerRight, perThousand,
  type Point, type Settings,
} from './model';

/** Próg „widocznej” różnicy między scenariuszami. */
export const VISIBLE_GAP = 1000;
/** Rok, o który pytają liczba w nagłówku i komentarz. */
export const HEADLINE_YEAR = 2050;

/** Pierwszy rok, w którym scenariusz różni się od odniesienia o co najmniej 1000 pielęgniarek. */
export const firstVisible = (scenario: Point[], reference: Point[]) =>
  scenario.find((p, i) => Math.abs(p.nurses - reference[i].nurses) >= VISIBLE_GAP)?.year;

/** Najmniej pielęgniarek w horyzoncie — rok i liczba. */
export const lowest = (points: Point[]) => points.reduce((a, b) => (b.nurses < a.nurses ? b : a));

const density = (p: Point) => formatPL(perThousand(p.nurses, p.year), 1);

export interface CommentaryInput {
  rights: readonly number[];
  settings: Settings;
  scenario: Point[];
  reference: Point[];
  ratesChanged: boolean;
}

export function commentary({ rights, settings, scenario, reference, ratesChanged }: CommentaryInput): string {
  const rightsChanged = rights.some((v, i) => v !== BASE_RIGHTS[i]);
  if (!rightsChanged && !ratesChanged) {
    const low = lowest(reference);
    return `Na razie to dane i dzisiejszy dopływ. Nawet przy nim zatrudnionych pielęgniarek ubywa: najmniej, ${formatPL(low.nurses)}, będzie w ${low.year} r., gdy z pracy odejdą dzisiejsze 51–60-latki. Wybierz scenariusz albo przesuń dopływ.`;
  }

  const i = HEADLINE_YEAR - YEAR0;
  const d = scenario[i].nurses - reference[i].nurses;
  const first = firstVisible(scenario, reference) ?? '—';
  const zeros = rights.filter((v, k) => v === 0 && YEAR_MIN + k > YEAR0).length;

  if (zeros > 10) {
    return settings.inflow > 0
      ? `Dopływ wygaszony: nowe pielęgniarki dają już tylko przyjazdy z zagranicy (${formatPL(settings.inflow)} rocznie), a reszta kadry się starzeje. Model nie protestuje; szpitale by protestowały.`
      : 'Dopływ wygaszony: kadra już tylko się starzeje — bez jednej nowej pielęgniarki. Model nie protestuje; szpitale by protestowały.';
  }

  // Same losy pielęgniarki przy nietkniętym dopływie: przeliczamy skutek na „tyle samo dałoby
  // N dodatkowych osób rocznie” — to porównanie mówi więcej niż sama liczba.
  if (ratesChanged && !rightsChanged) {
    if (Math.abs(d) < VISIBLE_GAP) {
      return `Zmiana jest zbyt mała, żeby ruszyć kadrę — w ${HEADLINE_YEAR} r. różnica nie przekracza tysiąca pielęgniarek.`;
    }
    const extra = Math.round(Math.abs(d) / nursesPerRight(DEFAULTS, HEADLINE_YEAR) / 100) * 100;
    return d > 0
      ? `Przy tym samym dopływie: w ${HEADLINE_YEAR} r. o ${formatPL(d)} pielęgniarek więcej. Tyle samo dałoby ok. ${formatPL(extra)} nowych praw wykonywania zawodu rocznie od ${FIRST_POLICY} r.`
      : `W ${HEADLINE_YEAR} r. o ${formatPL(-d)} pielęgniarek mniej — tyle, ile odjęłoby ok. ${formatPL(extra)} nowych praw wykonywania zawodu mniej co roku od ${FIRST_POLICY} r.`;
  }
  if (ratesChanged) {
    return `Dopływ i losy pielęgniarki razem: w ${HEADLINE_YEAR} r. o ${formatPL(Math.abs(d))} pielęgniarek ${d >= 0 ? 'więcej' : 'mniej'} niż bez zmian, a różnica przekracza tysiąc od ${first} r.`;
  }
  // Zmiana od FIRST_POLICY to decyzja o naborze — wtedy warto powiedzieć, ile trwa droga do dyplomu
  const lag = typeof first === 'number' && first >= FIRST_POLICY ? ' — studia I stopnia trwają trzy lata, więc decyzja o naborze działa szybko' : '';
  if (d < -VISIBLE_GAP) {
    return `W ${HEADLINE_YEAR} r. o ${formatPL(-d)} pielęgniarek mniej, ${density(scenario[i])} na 1000 mieszkańców (dziś ${density(scenario[0])}). Pierwszy tysiąc różnicy widać w ${first} r.${lag ? `${lag}.` : ''}`;
  }
  if (d > VISIBLE_GAP) {
    const end = scenario[YEAR_END - YEAR0];
    return `W ${HEADLINE_YEAR} r. o ${formatPL(d)} pielęgniarek więcej, ${density(scenario[i])} na 1000 mieszkańców (dziś ${density(scenario[0])}). Pierwszy tysiąc różnicy widać w ${first} r.${lag}, a w ${YEAR_END} r. będzie ich ${formatPL(end.nurses)}.`;
  }
  return 'Zmiana jest zbyt mała, żeby ruszyć kadrę — różnica nie przekracza tysiąca pielęgniarek w całym horyzoncie.';
}
