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

/** Poziom zabezpieczenia w sieci szpitali (PSZ); null = placówka bez znacznika sieci. */
export const NETWORK_LEVELS = [
  'I', 'II', 'III', 'national', 'oncology', 'pulmonology', 'oncology-pulmonology', 'pediatric', 'unspecified',
] as const;
