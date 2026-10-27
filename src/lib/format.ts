import type { Locale } from '../i18n/locales';

const NBSP = '\u00A0';

/** Liczba w polskim zapisie: twarda spacja jako separator tysięcy, przecinek dziesiętny. */
export function formatPL(n: number, decimals = 0): string {
  const [int, frac] = n.toFixed(decimals).split('.');
  const grouped = int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : int;
  return frac ? `${grouped},${frac}` : grouped;
}

/** Liczba w zapisie angielskim: przecinek jako separator tysięcy, kropka dziesiętna („12,910.16”). */
export function formatEN(n: number, decimals = 0): string {
  const [int, frac] = n.toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
}

/** Liczba w zapisie języka strony (src/i18n/locales.ts). */
export const formatNumber = (n: number, decimals: number, locale: Locale) =>
  locale === 'en' ? formatEN(n, decimals) : formatPL(n, decimals);

/** 1 → „01” */
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Data → „12.10.2026” */
export const formatDate = (d: Date) =>
  `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Data w zapisie języka strony: „12.10.2026” albo „12 October 2026” */
export const formatDateIn = (d: Date, locale: Locale) =>
  locale === 'en' ? `${d.getUTCDate()} ${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}` : formatDate(d);

/** Data → „2026-10-12” (atrybut datetime) */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const UNITS =
  /(\d)\s+(?=(?:tys\.|mln|mld|zł|r\.|dni|mies\.|%|lat\b|pytań|godzin|placówek|rozliczeń|szpitali|szpitale))/g;

/**
 * Polska typografia dla tekstów z danych:
 * - jednoliterowe spójniki i przyimki („sierotki”) łączone twardą spacją z następnym słowem,
 * - liczby sklejone z jednostką i grupami tysięcy,
 * - myślnik nie zaczyna wiersza.
 */
export function typo(text: string): string {
  return text
    .replace(/ —/g, `${NBSP}—`)
    .replace(/(?<=^|[\s(„])([aiouwzAIOUWZ])\s+/g, `$1${NBSP}`)
    .replace(/(\d)\s(?=\d{3}\b)/g, `$1${NBSP}`)
    .replace(UNITS, `$1${NBSP}`)
    .replace(/(tys\.|mln|mld)\s+(?=zł)/g, `$1${NBSP}`);
}

/** Tekst bez polskich znaków i wielkich liter — do porównań w wyszukiwarce i do slugów. */
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');

/** „Według specjalizacji” → „wedlug-specjalizacji” */
export const slug = (s: string) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Polska odmiana po liczbie: plural(6, ['źródło', 'źródła', 'źródeł']) → „źródeł” */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  if (n === 1) return one;
  const d = n % 10, dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
}
