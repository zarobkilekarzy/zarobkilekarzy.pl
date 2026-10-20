/**
 * Słowniki kodów z kontraktu monitoringu — osobno, bez zod, żeby importował je też kod przeglądarki.
 */

export const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie', 'małopolskie',
  'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie',
] as const;

/** Jak placówka zareagowała na wniosek (kategoria z platformy fedrowanie). */
export const RESPONSES = ['disclosed', 'refused', 'other', 'receipt', 'silence', 'forwarded', 'unknown'] as const;

/**
 * Nazwa wyniku placówki BEZ listy płac — jedna dla tabeli, mapy i artykułów (małą literą; na początku
 * zdania przez upperFirst). Placówka z polem `aggregate` ma zamiast `disclosed` etykietę AGGREGATE_LABEL.
 */
export const NO_LIST_LABEL: Record<(typeof RESPONSES)[number], string> = {
  disclosed: 'dane nieprzetworzone',
  refused: 'odmowa',
  silence: 'cisza',
  other: 'inna odpowiedź',
  receipt: 'tylko potwierdzenie',
  forwarded: 'przekazana dalej',
  unknown: 'odpowiedź nieustalona',
};
export const AGGREGATE_LABEL = 'dane zbiorcze';

export const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);

/** Poziom zabezpieczenia w sieci szpitali (PSZ); null = placówka bez znacznika sieci. */
export const NETWORK_LEVELS = [
  'I', 'II', 'III', 'national', 'oncology', 'pulmonology', 'oncology-pulmonology', 'pediatric', 'unspecified',
] as const;
