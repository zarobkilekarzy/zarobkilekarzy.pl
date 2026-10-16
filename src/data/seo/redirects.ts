/**
 * Rejestr przekierowań — jedno źródło dla dev (astro.config → redirects) i produkcji
 * (build zapisuje dist/_redirects dla Cloudflare: 301 na krawędzi, przed plikami).
 * Adres strony zawsze z ukośnikiem na końcu; wariant bez ukośnika dopisuje generator.
 * Cel ma być stroną albo plikiem, a nie kolejnym przekierowaniem — audyt w buildzie wyłapie łańcuch,
 * cel, którego nie ma, i źródło przykryte istniejącą stroną. Zob. docs/seo-system.md § 7.
 */

export interface Redirect {
  from: string;
  to: string;
  /** domyślnie 301 (stała zmiana adresu) */
  status?: 301 | 302;
  /** dlaczego — żeby za rok było wiadomo, czy przekierowanie jest jeszcze potrzebne */
  note: string;
}

const PETYCJA = 'petycja to dziś archiwum pod /postulat/ (redesign v2)';
const LIVE = 'historia z public/_redirects dotychczasowej strony';
const MERGE = 'scalone po audycie treści';

export const redirects: Redirect[] = [
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
  { from: '/preview/tajwan-ochrona-zdrowia/', to: '/analizy/tajwan-ochrona-zdrowia/', note: `${LIVE}: podgląd przed publikacją` },
  { from: '/preview/kanada-lekarze-ustawa-specjalna/', to: '/analizy/kanada-lekarze-ustawa-specjalna/', note: `${LIVE}: podgląd przed publikacją` },
  { from: '/preview/projekt-nowelizacji/', to: '/postulat/projekt-ustawy/', note: `${LIVE}: podgląd projektu` },
  {
    from: '/preview/projekt-nowelizacji-art27a-v0.3.pdf',
    to: '/projekt-nowelizacji/projekt-nowelizacji-art27a-v0.3.pdf',
    note: `${LIVE}: PDF projektu z okresu podglądu`,
  },

  // Scalenia po audycie treści (docs/audyt-tresci-starej-strony.md, 15.10.2026) — zdublowane strony live.
  // Cele bez strony w v2 (rozkład, według specjalizacji, dlaczego brakuje) audyt pokaże, dopóki nie zostaną przeniesione.
  { from: '/analizy/monitor-reformy-zdrowia/', to: '/mechanizmy/wieloetatowosc/', note: 'monitor reformy usunięty decyzją redakcji z 16.10.2026; najbliższy temat: limit etatów i kontraktów' },
  { from: '/analizy/jedno-pwz/', to: '/dane/rozklad-wynagrodzen/', note: `${MERGE}: „luka pomiaru” to sedno rozkładu wynagrodzeń` },
  { from: '/dane/stawki/', to: '/dane/rozklad-wynagrodzen/', note: `${MERGE}: stawki etatowe idą do rozkładu, prywatne ogłoszenia poza misją` },
  { from: '/dane/pensje-rezydentow/', to: '/dane/wedlug-specjalizacji/', note: `${MERGE}: ta sama tabela i lista priorytetów` },
  { from: '/analizy/lejek-ksztalcenia/', to: '/analizy/dlaczego-brakuje-lekarzy/', note: `${MERGE}: tabela specjalizacji 1:1 z /dane/wedlug-specjalizacji/` },
  { from: '/dane/patologia-w-liczbach/', to: '/dane/', note: `${MERGE}: kompilacja liczb z innych zestawień, rolę przejął hub` },
  { from: '/mechanizmy/dyzury-i-gotowosc/', to: '/mechanizmy/wieloetatowosc/', note: `${MERGE}: gotowość (art. 98) to sekcja wieloetatowości` },
  { from: '/mechanizmy/samorzad-nil/', to: '/analizy/odpowiedzialnosc-zawodowa-lekarzy/', note: `${MERGE}: ustrój samorządu to sekcja „Kto sądzi lekarzy”` },
];
