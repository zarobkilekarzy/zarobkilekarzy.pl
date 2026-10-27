/**
 * Napisy kolejek na SOR liczonych w przeglądarce: dymki, panel i lista adaptera (lib/sor/live), linia
 * stanu (lib/sor/summary). Polskie stoją tu (domyślne); angielskie przygotowuje serwer
 * (src/data/en/kolejki-sor.ts) i podaje w danych mapy (PointLayer.live.text) — słownik nie trafia do
 * skryptu strony.
 *
 * Wzorce: `{nazwa}` = wartość. Odmiana po liczbie: po polsku trzy formy (lib/format plural),
 * po angielsku dwie (jedna osoba, wiele).
 */
import type { Locale } from '@/i18n/locales';
import { formatNumber, plural } from '@/lib/format';

export interface SorText {
  locale: Locale;
  /** etapy w kolejności STAGES (lib/sor/measure): nazwa i kolor kategorii pilności */
  stages: { label: string; color?: string }[];
  /** norma 0 minut */
  normNow: string;
  /** norma w minutach: {n} */
  normUpTo: string;
  /** „osoba / osoby / osób” */
  people: string[];
  /** podpis etapu spoza standardowej listy */
  otherStage: string;
  /** {people} = forma z `people` */
  inSor: string;
  beforeDoctor: string;
  /** nagłówki tabeli w dymku */
  cols: string[];
  /** {time} */
  asOf: string;
  noData: string;
  /** {error} = komunikat portalu */
  noDataError: string;
  /** dopisek do stanu: {min} */
  staleNote: string;
  previousNote: string;
  /** {foot} = stan z godziną */
  onlyUrgent: string;
  /** lista najdłuższych kolejek: {count} {people} {stage} {norm} */
  topDetail: string;
  /** „osoba czekała / osoby czekały / osób czekało” */
  waited: string[];
  /** {waited} {measured} {total} */
  summary: string;
  noFresh: string;
  stampNone: string;
  /** {when} */
  stampOutdated: string;
  /** {when} {cycle} */
  stampFresh: string;
  /**
   * Czasy z portalu („powyżej 2 godzin”, „poniżej 10 minut”, „natychmiast”) w języku napisów: {n};
   * bez tego pola zostają dosłownie jak w portalu. „60 min” nie wymaga tłumaczenia.
   */
  waits?: { overHours: string; underMinutes: string; now: string };
}

export const SOR_TEXT_PL: SorText = {
  locale: 'pl',
  stages: [
    { label: 'Rejestracja' },
    { label: 'Triaż' },
    { label: 'Najwyższy', color: 'czerwony' },
    { label: 'Wysoki', color: 'pomarańczowy' },
    { label: 'Średni', color: 'żółty' },
    { label: 'Niski', color: 'zielony' },
    { label: 'Najniższy', color: 'niebieski' },
  ],
  normNow: 'natychmiast',
  normUpTo: 'do {n} min',
  people: ['osoba', 'osoby', 'osób'],
  otherStage: 'etap spoza standardowej listy',
  inSor: '{people} w SOR',
  beforeDoctor: 'przed kontaktem z lekarzem',
  cols: ['Etap', 'Osób', 'Czas'],
  asOf: 'Stan z {time}',
  noData: 'Brak danych z TOPSOR.',
  noDataError: 'Brak danych z TOPSOR ({error}).',
  staleNote: ' — o ponad {min} minut starszy od reszty, nie barwi punktu',
  previousNote: ' (ostatni udany pomiar)',
  onlyUrgent: '{foot}. Czekają tylko pacjenci czerwoni i pomarańczowi — dla nich portal nie podaje czasu.',
  topDetail: '{count} {people} · {stage}, norma {norm}',
  waited: ['osoba czekała', 'osoby czekały', 'osób czekało'],
  summary: '{waited} na lekarza w {measured} SOR-ach; wszystkich pacjentów w SOR-ach: {total}',
  noFresh: 'Brak świeżych danych z systemu TOPSOR',
  stampNone: 'Brak pomiarów w pliku z danymi.',
  stampOutdated: 'Ostatni pomiar: {when} — dane się teraz nie odświeżają.',
  stampFresh: 'Stan z {when} · każdy SOR sprawdzany co {cycle} minut',
};

/** Czas oczekiwania z portalu w języku napisów (pole `waits`); bez niego — bez zmian. */
export function waitText(wait: string, t: SorText): string {
  if (!t.waits) return wait;
  const over = /^powyżej\s+(\d+)\s+godzin/.exec(wait);
  if (over) return fill(t.waits.overHours, { n: over[1] });
  const under = /^poniżej\s+(\d+)\s+minut/.exec(wait);
  if (under) return fill(t.waits.underMinutes, { n: under[1] });
  return wait === 'natychmiast' ? t.waits.now : wait;
}

/** Wzorzec z wartościami: fill('do {n} min', { n: 60 }) → „do 60 min” */
export const fill = (pattern: string, vars: Record<string, string | number>) =>
  pattern.replace(/\{(\w+)\}/g, (all, key: string) => (key in vars ? String(vars[key]) : all));

/** Forma po liczbie w języku napisów. */
export const formOf = (n: number, forms: string[], locale: Locale) =>
  locale === 'en' ? (n === 1 ? forms[0] : forms[1]) : plural(n, forms as [string, string, string]);

/** Liczba całkowita w zapisie języka napisów. */
export const numOf = (n: number, locale: Locale) => formatNumber(n, 0, locale);
