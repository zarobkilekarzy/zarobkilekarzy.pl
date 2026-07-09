// Jedno źródło prawdy dla dat „ostatnia aktualizacja" (ISO 'RRRR-MM-DD').
// Zasila naraz trzy warstwy, żeby daty nigdy się nie rozjechały:
//   1. <Aktualizacja> — widoczna dla czytelnika data i <time datetime>,
//   2. Article JSON-LD (datePublished/dateModified) w BaseLayout,
//   3. <lastmod> w mapie strony (astro.config → sitemap serialize).
// Bumpujemy TU przy MERYTORYCZNEJ zmianie treści (nie przy literówce).
// Daty ręczne, bo build leci w CI z płytkim checkoutem (git log per-plik dałby
// wszędzie datę ostatniego commita).
export const pageDates = {
  // Analizy (długie teksty redakcyjne).
  '/analizy/jedno-pwz': '2026-07-07',
  '/analizy/lejek-ksztalcenia': '2026-07-08',
  '/analizy/lekarze-ze-wschodu': '2026-07-08',
  '/analizy/poz-pieniadz-za-pacjenta': '2026-07-07',
  '/analizy/dlaczego-brakuje-lekarzy': '2026-07-07',
  '/analizy/zarobki-lekarzy-polska-sasiedzi': '2026-07-07',
  '/analizy/apteka-pieniadz-publiczny': '2026-07-07',
  '/analizy/covid-pieniadz-publiczny': '2026-07-07',
  '/analizy/ucieczka-lekarzy': '2026-07-07',
  '/analizy/nil-a-kontrakty-lekarskie': '2026-07-09',
  '/analizy/zarobki-dyrektorow-szpitali': '2026-07-08',
  '/analizy/komin-placowy': '2026-07-08',
  // Mechanizmy (strony wyjaśniające).
  '/mechanizmy/reglamentacja-dostepu': '2026-07-07',
  '/mechanizmy/kontrakt-vs-etat': '2026-07-07',
  '/mechanizmy/brak-jawnosci': '2026-07-06',
  '/mechanizmy/wieloetatowosc': '2026-07-07',
  '/mechanizmy/rozliczenia-nfz': '2026-07-06',
  '/mechanizmy/samorzad-nil': '2026-07-07',
  '/mechanizmy/dyzury-i-gotowosc': '2026-07-06',
  // Dane (tabele/zestawienia — bump przy zmianie liczb/zakresu).
  '/dane': '2026-07-08',
  '/dane/budzet-nfz': '2026-07-07',
  '/dane/kolejki': '2026-07-06',
  '/dane/pensje-rezydentow': '2026-07-06',
  '/dane/personel-medyczny': '2026-07-07',
  '/dane/rekordy': '2026-07-09',
  '/dane/rozklad-wynagrodzen': '2026-07-07',
  '/dane/stawki': '2026-07-06',
  '/dane/wedlug-specjalizacji': '2026-07-07',
  '/dane/zadluzenie-szpitali': '2026-07-08',
};

// Normalizacja ścieżki: bez końcowego „/", z wiodącym „/". '/dane/x/' → '/dane/x'.
export function normalizePath(pathname) {
  const stripped = String(pathname || '').replace(/^\/+|\/+$/g, '');
  return stripped ? `/${stripped}` : '/';
}

// Data ostatniej modyfikacji dla ścieżki (ISO 'RRRR-MM-DD') albo undefined.
export function lastmodFor(pathname) {
  return pageDates[normalizePath(pathname)];
}
