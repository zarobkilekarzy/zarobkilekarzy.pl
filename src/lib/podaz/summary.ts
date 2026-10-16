/**
 * Słowny komentarz do wyniku symulatora — co znaczy różnica między scenariuszem
 * użytkownika a scenariuszem „bez zmian”. Czysta funkcja: serwer liczy nią tekst
 * startowy, przeglądarka — każdy kolejny.
 */
import { formatPL } from '@/lib/format';
import {
  BASE_INTAKE, MEASURED, STUDY_YEARS, YEAR0, YEAR_END, YEAR_MIN, doctorsPerSeat,
  type Point, type Settings,
} from './model';

/** Próg „widocznej” różnicy między scenariuszami. */
export const VISIBLE_GAP = 1000;

/** Pierwszy rok, w którym scenariusz różni się od odniesienia o co najmniej 1000 lekarzy. */
export const firstVisible = (scenario: Point[], reference: Point[]) =>
  scenario.find((p, i) => Math.abs(p.doctors - reference[i].doctors) >= VISIBLE_GAP)?.year;

export interface CommentaryInput {
  intake: readonly number[];
  settings: Settings;
  scenario: Point[];
  reference: Point[];
  ratesChanged: boolean;
}

export function commentary({ intake, settings, scenario, reference, ratesChanged }: CommentaryInput): string {
  const changed = (past: boolean) =>
    intake.some((v, i) => v !== BASE_INTAKE[i] && YEAR_MIN + i < YEAR0 === past);
  const pastChanged = changed(true);
  const futureChanged = changed(false);
  if (!pastChanged && !futureChanged && !ratesChanged) {
    return 'Na razie to rzeczywistość: prawdziwe limity i dzisiejszy nabór. Wybierz scenariusz albo przesuń limit — wykres pokaże różnicę.';
  }

  const d = scenario[scenario.length - 1].doctors - reference[reference.length - 1].doctors;
  const first = firstVisible(scenario, reference) ?? '—';
  const zeros = intake.filter((v, i) => v === 0 && YEAR_MIN + i >= YEAR0).length;

  if (zeros > 10) {
    const last = intake.reduce((acc, v, i) => (v > 0 ? Math.max(acc, YEAR_MIN + i) : acc), YEAR0 - 1);
    const rest = settings.inflow > 0
      ? `potem nowych lekarzy dają już tylko przyjazdy z zagranicy (${formatPL(settings.inflow)} rocznie), a reszta rynku się starzeje.`
      : 'a potem rynek już tylko się starzeje — bez jednego nowego lekarza.';
    return `Nabór wygaszony. Ostatni rocznik kończy studia w ${last + STUDY_YEARS} r., ${rest} Model nie protestuje; system by protestował.`;
  }

  // Same losy rocznika przy nietkniętym naborze: przeliczamy skutek na „tyle samo
  // dałoby N dodatkowych miejsc” — to porównanie mówi więcej niż sama liczba lekarzy.
  if (ratesChanged && !pastChanged && !futureChanged) {
    const i = 2050 - YEAR0;
    const d50 = scenario[i].doctors - reference[i].doctors;
    if (Math.abs(d50) < VISIBLE_GAP) {
      return 'Zmiana jest zbyt mała, żeby ruszyć rynek — w 2050 r. różnica nie przekracza tysiąca lekarzy.';
    }
    const seats = Math.round(Math.abs(d50) / doctorsPerSeat({ ...settings, ...MEASURED }, 2050) / 10) * 10;
    return d50 > 0
      ? `Bez jednego dodatkowego miejsca na studiach: w 2050 r. o ${formatPL(d50)} lekarzy więcej. Tyle samo dałoby ok. ${formatPL(seats)} nowych miejsc co roku od ${YEAR0} r.`
      : `W 2050 r. o ${formatPL(-d50)} lekarzy mniej — tyle, ile odjęłoby cięcie limitu o ok. ${formatPL(seats)} miejsc rocznie od ${YEAR0} r.`;
  }
  if (ratesChanged) {
    return `Nabór i losy rocznika razem: w ${YEAR_END} r. o ${formatPL(Math.abs(d))} lekarzy ${d >= 0 ? 'więcej' : 'mniej'} niż bez zmian, a różnica przekracza tysiąc od ${first} r.`;
  }
  if (pastChanged && !futureChanged) {
    const now = scenario[0].doctors - reference[0].doctors;
    return now > 0
      ? `Po zmianie przeszłości dziś byłoby o ${formatPL(now)} lekarzy więcej. Pierwszy punkt wykresu to już nie rejestr izby, tylko historia alternatywna — tak wygląda koszt decyzji sprzed trzydziestu lat.`
      : `Po zmianie przeszłości dziś byłoby o ${formatPL(-now)} lekarzy mniej. Decyzja z lat 90. działa do dziś i nic, co zrobimy w tym roku, jej nie cofnie.`;
  }
  if (d < -40000) {
    return `Cięcie tej skali odejmuje do ${YEAR_END} r. ${formatPL(-d)} lekarzy, ale pierwszy tysiąc różnicy widać dopiero w ${first} r. Decyzję podejmuje jedna kadencja, rachunek płacą trzy następne.`;
  }
  if (d < -VISIBLE_GAP) {
    return `W ${YEAR_END} r. o ${formatPL(-d)} lekarzy mniej. Pierwszy tysiąc różnicy widać w ${first} r. — tyle trwa droga od decyzji do dyplomu.`;
  }
  if (d > 60000) {
    return 'Tylu lekarzy na mieszkańca nie ma dziś żaden kraj Unii. Model nie pyta, kto ich wykształci, kto im zapłaci i czy starczy miejsc specjalizacyjnych — a to jest wąskie gardło lejka kształcenia.';
  }
  if (d > VISIBLE_GAP) {
    return `W ${YEAR_END} r. o ${formatPL(d)} lekarzy więcej, ale pierwszy tysiąc różnicy widać dopiero w ${first} r. Krzywa przez pierwszą dekadę stoi — nabór nie skraca dzisiejszej kolejki.`;
  }
  return 'Zmiana jest zbyt mała, żeby ruszyć rynek — różnica nie przekracza tysiąca lekarzy w całym horyzoncie.';
}
