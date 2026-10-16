/**
 * Kontrakt starych adresów: wszystko, co dotychczasowa strona wystawiała wyszukiwarkom i linkom z zewnątrz
 * (sitemap-0.xml, pliki z public/, źródła z public/_redirects). Migawka z dnia `LEGACY_SNAPSHOT`.
 *
 * Każdy adres musi się w nowej wersji rozwiązać na jedno z trzech:
 *  - stronę albo plik pod tym samym adresem (wykrywane z buildu),
 *  - przekierowanie z src/data/seo/redirects.ts,
 *  - świadome usunięcie (`removedUrls`, z powodem) — Cloudflare odda wtedy 404.
 * Audyt w buildzie wypisuje adresy bez żadnego z tych stanów; `npm run build:release` przerywa na nich build.
 * Przed przełączeniem domeny warto dopisać adresy z ruchem lub linkami z Search Console spoza sitemapy.
 */

export const LEGACY_SNAPSHOT = '2026-10-15';

export const legacyUrls: readonly string[] = [
  // Strona główna
  '/',
  // Dane
  '/dane/',
  '/dane/budzet-nfz/',
  '/dane/kolejki/',
  '/dane/monitoring-watchdog/',
  '/dane/patologia-w-liczbach/',
  '/dane/pensje-rezydentow/',
  '/dane/personel-medyczny/',
  '/dane/rekordy/',
  '/dane/rozklad-wynagrodzen/',
  '/dane/stawki/',
  '/dane/wedlug-specjalizacji/',
  '/dane/zadluzenie-szpitali/',
  '/dane/zarobki-ujawnione-listy/',
  // Mechanizmy
  '/mechanizmy/',
  '/mechanizmy/brak-jawnosci/',
  '/mechanizmy/dyzury-i-gotowosc/',
  '/mechanizmy/fikcyjne-wizyty/',
  '/mechanizmy/kontrakt-vs-etat/',
  '/mechanizmy/reglamentacja-dostepu/',
  '/mechanizmy/rozliczenia-nfz/',
  '/mechanizmy/samorzad-nil/',
  '/mechanizmy/wieloetatowosc/',
  '/mechanizmy/wycena-swiadczen/',
  // Analizy
  '/analizy/',
  '/analizy/apteka-pieniadz-publiczny/',
  '/analizy/ciecie-limitow-na-medycyne/',
  '/analizy/covid-pieniadz-publiczny/',
  '/analizy/dlaczego-brakuje-lekarzy/',
  '/analizy/english-division/',
  '/analizy/jedno-pwz/',
  '/analizy/kanada-lekarze-ustawa-specjalna/',
  '/analizy/komin-placowy/',
  '/analizy/lejek-ksztalcenia/',
  '/analizy/lekarze-radni/',
  '/analizy/lekarze-ze-wschodu/',
  '/analizy/monitor-reformy-zdrowia/',
  '/analizy/nil-a-kontrakty-lekarskie/',
  '/analizy/odpowiedzialnosc-zawodowa-lekarzy/',
  '/analizy/odsiew-na-medycynie/',
  '/analizy/pielegniarstwo-w-polsce/',
  '/analizy/poz-pieniadz-za-pacjenta/',
  '/analizy/sladem-zlotowki/',
  '/analizy/symulator-podazy-lekarzy/',
  '/analizy/tajwan-ochrona-zdrowia/',
  '/analizy/ucieczka-lekarzy/',
  '/analizy/ustawa-o-danych-a-jawny-rejestr/',
  '/analizy/zarobki-dyrektorow-szpitali/',
  '/analizy/zarobki-lekarzy-polska-sasiedzi/',
  // Baza źródeł (/artykuly/) — lista, strony i kategorie
  '/artykuly/',
  '/artykuly/2/',
  '/artykuly/3/',
  '/artykuly/4/',
  '/artykuly/5/',
  '/artykuly/6/',
  '/artykuly/7/',
  '/artykuly/8/',
  '/artykuly/9/',
  '/artykuly/10/',
  '/artykuly/11/',
  '/artykuly/12/',
  '/artykuly/13/',
  '/artykuly/14/',
  '/artykuly/15/',
  '/artykuly/kategoria/kolejki/',
  '/artykuly/kategoria/kontrakty/',
  '/artykuly/kategoria/kontrakty/2/',
  '/artykuly/kategoria/system/',
  '/artykuly/kategoria/system/2/',
  '/artykuly/kategoria/system/3/',
  '/artykuly/kategoria/system/4/',
  '/artykuly/kategoria/system/5/',
  '/artykuly/kategoria/system/6/',
  '/artykuly/kategoria/wieloetatowosc/',
  '/artykuly/kategoria/wieloetatowosc/2/',
  '/artykuly/kategoria/wieloetatowosc/3/',
  '/artykuly/kategoria/wynagrodzenia/',
  '/artykuly/kategoria/wynagrodzenia/2/',
  '/artykuly/kategoria/wynagrodzenia/3/',
  '/artykuly/kategoria/wynagrodzenia/4/',
  // Pozostałe strony
  '/dzialaj/',
  '/egzamin/',
  '/faq/',
  '/gra/',
  '/o-projekcie/',
  '/petycja/',
  '/petycja/jak-to-dziala/',
  '/petycja/tresc/',
  '/postulat/',
  '/prawa-pacjenta/',
  '/projekt-nowelizacji/',
  '/prywatnosc/',
  '/slownik/',
  '/szukaj/',
  // Pliki (public/ dotychczasowej strony)
  '/petycja/petycja-ministerstwo-zdrowia.pdf',
  '/petycja/petycja-senat.pdf',
  '/projekt-nowelizacji/projekt-nowelizacji-art27a-v0.3.pdf',
  // Źródła przekierowań z public/_redirects dotychczasowej strony
  '/dane/polska-na-tle-ue/',
  '/analizy/zarobki-lekarzy-niemcy-polska/',
  '/preview/tajwan-ochrona-zdrowia/',
  '/preview/kanada-lekarze-ustawa-specjalna/',
  '/preview/projekt-nowelizacji/',
  '/preview/projekt-nowelizacji-art27a-v0.3.pdf',
];

/** Adresy świadomie usunięte: adres → powód (np. „treść scalona z …, bez odpowiednika”). */
export const removedUrls: Readonly<Record<string, string>> = {
  '/gra/': 'gra „Drugi licznik” — decyzja redakcji z 15.10.2026: nie przenosimy do v2',
  // adresy podglądu sprzed publikacji (noindex, poza sitemapą) — decyzja redakcji z 16.10.2026
  '/preview/tajwan-ochrona-zdrowia/': 'podgląd sprzed publikacji, strona jest pod /analizy/',
  '/preview/kanada-lekarze-ustawa-specjalna/': 'podgląd sprzed publikacji, strona jest pod /analizy/',
  '/preview/projekt-nowelizacji/': 'podgląd sprzed publikacji, projekt jest pod /postulat/projekt-ustawy/',
  '/preview/projekt-nowelizacji-art27a-v0.3.pdf': 'podgląd sprzed publikacji, PDF jest przy projekcie',
  // /artykuly/* nie jest usunięte: przekierowania 301 na /analizy/ w redirects.ts
};
