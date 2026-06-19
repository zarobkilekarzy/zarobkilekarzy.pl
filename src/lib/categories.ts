// Wspólne etykiety i formatowanie dla bazy artykułów.

export const CATEGORY_LABELS = {
  wieloetatowosc: 'Wieloetatowość',
  kontrakty: 'Kontrakty i rozliczenia',
  kolejki: 'Kolejki pacjentów',
  wynagrodzenia: 'Wynagrodzenia',
  system: 'System',
} as const;

export const SOURCE_TYPE_LABELS = {
  prasa: 'Źródło prasowe',
  raport: 'Raport',
  analiza: 'Analiza',
  dane: 'Dane publiczne',
  wideo: 'Materiał wideo',
  social: 'Wpis na X',
} as const;

export const CATEGORY_ORDER = [
  'wieloetatowosc',
  'kontrakty',
  'kolejki',
  'wynagrodzenia',
  'system',
] as const;

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
