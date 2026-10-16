/**
 * Pomocnicze funkcje przykładu pseudonimizacji — wspólne dla serwera (pierwszy widok, node:crypto)
 * i przeglądarki (Web Crypto), więc oba liczą i formatują identyfikator tak samo.
 */

/** Siedem cyfr — format numeru PWZ (bez sprawdzania cyfry kontrolnej: przykład przyjmuje dowolny numer). */
export const isPwz = (value: string) => /^\d{7}$/.test(value);

/** Ten sam numer z inną ostatnią cyfrą — do pokazania, że drobna zmiana daje zupełnie inny wynik. */
export const neighbour = (pwz: string) => pwz.slice(0, -1) + String((Number(pwz.at(-1)) + 1) % 10);

/** Skrót szesnastkowy w grupach po 8 znaków (czytelniej niż 64 znaki ciągiem). */
export const groups = (hex: string, size = 8) => hex.match(new RegExp(`.{1,${size}}`, 'g')) ?? [];

/** Na ilu pozycjach dwa skróty się różnią. */
export const diffCount = (a: string, b: string) => [...a].filter((ch, i) => ch !== b[i]).length;

export const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
