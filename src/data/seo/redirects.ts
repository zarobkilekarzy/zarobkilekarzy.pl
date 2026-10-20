/**
 * Rejestr przekierowań — jedno źródło dla dev (astro.config → redirects) i produkcji
 * (build zapisuje dist/_redirects dla Cloudflare: 301 na krawędzi, przed plikami).
 * Adres strony zawsze z ukośnikiem na końcu; wariant bez ukośnika dopisuje generator.
 * Cel ma być stroną albo plikiem, a nie kolejnym przekierowaniem — audyt w buildzie wyłapie łańcuch,
 * cel, którego nie ma, i źródło przykryte istniejącą stroną.
 */

import { legacyUrls } from './legacy-urls';

export interface Redirect {
  from: string;
  to: string;
  /** domyślnie 301 (stała zmiana adresu) */
  status?: 301 | 302;
  /** dlaczego — żeby za rok było wiadomo, czy przekierowanie jest jeszcze potrzebne */
  note: string;
  /**
   * Data (RRRR-MM-DD), od której build pomija przekierowanie — dla reguł potrzebnych tylko przez
   * okres przejściowy. Wygasłe wpisy build wypisuje w logu, żeby usunąć je też z rejestru.
   */
  expires?: string;
}

const PETYCJA = 'petycja to dziś archiwum pod /postulat/ (redesign v2)';
const LIVE = 'historia z public/_redirects dotychczasowej strony';
const MERGE = 'scalone po audycie treści';
const OG = 'stare obrazki podglądu linków (do ponownego pobrania przez X, Facebooka, Wykop) — po 3 miesiącach serwisy mają już nowe';
const OG_EXPIRES = '2027-01-16';
const ARTYKULY = 'baza linków prasowych nie przeszła do v2 (decyzja redakcji z 16.10.2026); źródła są przypisami w analizach';

const allRedirects: Redirect[] = [
  // Misja: /postulat/ z podstronami (redesign v2)
  { from: '/projekt-nowelizacji/', to: '/postulat/projekt-ustawy/', note: 'projekt ustawy ma adres bez wersji pod /postulat/' },
  { from: '/petycja/', to: '/postulat/petycja/', note: PETYCJA },
  { from: '/petycja/tresc/', to: '/postulat/petycja/', note: PETYCJA },
  { from: '/petycja/jak-to-dziala/', to: '/postulat/petycja/', note: PETYCJA },
  { from: '/petycja/petycja-ministerstwo-zdrowia.pdf', to: '/postulat/petycja/petycja-ministerstwo-zdrowia.pdf', note: PETYCJA },
  { from: '/petycja/petycja-senat.pdf', to: '/postulat/petycja/petycja-senat.pdf', note: PETYCJA },

  // Działaj: narzędzie „Napisz do polityka” jest sekcją strony /dzialaj/ (przepisane od zera 16.10.2026)
  { from: '/dzialaj/napisz/', to: '/dzialaj/#napisz', note: 'narzędzie „Napisz do polityka” to dziś sekcja #napisz strony /dzialaj/ (redesign v2, 16.10.2026)' },

  // Przeniesione z dotychczasowej strony (łańcuchy spłaszczone do obecnych adresów)
  { from: '/dane/polska-na-tle-ue/', to: '/analizy/zarobki-lekarzy-polska-sasiedzi/', note: `${LIVE}: scalone z analizą regionalną` },
  { from: '/analizy/zarobki-lekarzy-niemcy-polska/', to: '/analizy/zarobki-lekarzy-polska-sasiedzi/', note: `${LIVE}: zmiana adresu analizy` },

  // Scalenia po audycie treści (15.10.2026) — zdublowane strony live.
  // Cele bez strony w v2 (rozkład, według specjalizacji, dlaczego brakuje) audyt pokaże, dopóki nie zostaną przeniesione.
  { from: '/analizy/monitor-reformy-zdrowia/', to: '/mechanizmy/wieloetatowosc/', note: 'monitor reformy usunięty decyzją redakcji z 16.10.2026; najbliższy temat: limit etatów i kontraktów' },
  { from: '/analizy/jedno-pwz/', to: '/dane/rozklad-wynagrodzen/', note: `${MERGE}: „luka pomiaru” to sedno rozkładu wynagrodzeń` },
  { from: '/dane/stawki/', to: '/dane/rozklad-wynagrodzen/', note: `${MERGE}: stawki etatowe idą do rozkładu, prywatne ogłoszenia poza misją` },
  { from: '/dane/pensje-rezydentow/', to: '/dane/wedlug-specjalizacji/', note: `${MERGE}: ta sama tabela i lista priorytetów` },
  { from: '/analizy/lejek-ksztalcenia/', to: '/analizy/dlaczego-brakuje-lekarzy/', note: `${MERGE}: tabela specjalizacji 1:1 z /dane/wedlug-specjalizacji/` },
  { from: '/dane/patologia-w-liczbach/', to: '/dane/', note: `${MERGE}: kompilacja liczb z innych zestawień, rolę przejął hub` },
  { from: '/mechanizmy/dyzury-i-gotowosc/', to: '/mechanizmy/wieloetatowosc/', note: `${MERGE}: gotowość (art. 98) to sekcja wieloetatowości` },
  { from: '/mechanizmy/samorzad-nil/', to: '/analizy/odpowiedzialnosc-zawodowa-lekarzy/', note: `${MERGE}: ustrój samorządu to sekcja „Kto sądzi lekarzy”` },

  // Baza linków prasowych (/artykuly/ z paginacją i kategoriami): każdy adres ze starej sitemapy → hub analiz
  ...legacyUrls
    .filter((url) => url.startsWith('/artykuly/'))
    .map((url): Redirect => ({ from: url, to: '/analizy/', note: ARTYKULY })),

  // Obrazki OG dotychczasowej strony (redesign v2 zmienił ich adresy) → karta strony, która dziś stoi pod tym adresem
  ...(
    [
      ['/og/home.png', '/og/index.png'],
      ['/og/artykuly.png', '/og/analizy.png'],
      ['/og/analizy/jedno-pwz.png', '/og/dane/rozklad-wynagrodzen.png'],
      ['/og/analizy/lejek-ksztalcenia.png', '/og/analizy/dlaczego-brakuje-lekarzy.png'],
      ['/og/analizy/monitor-reformy-zdrowia.png', '/og/mechanizmy/wieloetatowosc.png'],
      ['/og/dane/patologia-w-liczbach.png', '/og/dane.png'],
      ['/og/dane/pensje-rezydentow.png', '/og/dane/wedlug-specjalizacji.png'],
      ['/og/dane/stawki.png', '/og/dane/rozklad-wynagrodzen.png'],
      ['/og/mechanizmy/dyzury-i-gotowosc.png', '/og/mechanizmy/wieloetatowosc.png'],
      ['/og/mechanizmy/samorzad-nil.png', '/og/analizy/odpowiedzialnosc-zawodowa-lekarzy.png'],
      ['/og/petycja.png', '/og/postulat/petycja.png'],
      ['/og/petycja/jak-to-dziala.png', '/og/postulat/petycja.png'],
      ['/og/petycja/tresc.png', '/og/postulat/petycja.png'],
      ['/og/projekt-nowelizacji.png', '/og/postulat/projekt-ustawy.png'],
    ] as const
  ).map(([from, to]): Redirect => ({ from, to, note: OG, expires: OG_EXPIRES })),
];

/** Data buildu (UTC) w formacie RRRR-MM-DD — porównanie leksykalne z `expires` wystarcza. */
const today = new Date().toISOString().slice(0, 10);
const isExpired = (r: Redirect) => r.expires !== undefined && r.expires <= today;

export const redirects: Redirect[] = allRedirects.filter((r) => !isExpired(r));
/** Wygasłe w dniu buildu — do usunięcia z rejestru (build je pomija i wypisuje w logu). */
export const expiredRedirects: Redirect[] = allRedirects.filter(isExpired);
