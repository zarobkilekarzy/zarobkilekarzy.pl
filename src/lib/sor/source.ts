/**
 * Bieżący stan kolejek na SOR: Worker z cronem (workers/sor) zapisuje go do D1 i sam podaje pod
 * własną domeną (dane.zarobkilekarzy.pl). Stąd czyta go mapa i kafelek, i stąd bierze się wpis w CSP
 * (integrations/seo/headers.ts) — moduł bez zależności, bo importuje go też integracja buildu.
 */
export const SOR_DATA_ORIGIN = 'https://dane.zarobkilekarzy.pl';
export const SOR_DATA_URL = `${SOR_DATA_ORIGIN}/sor/teraz.json`;
/** Co tyle minut Worker odpytuje każdy SOR (cron co 2 minuty, za każdym razem piąta część listy). */
export const SOR_CYCLE_MIN = 10;
