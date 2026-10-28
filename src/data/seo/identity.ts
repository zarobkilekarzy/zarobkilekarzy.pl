/**
 * Tożsamość serwisu dla wyszukiwarek i platform: wydawca w grafie JSON-LD (Organization, WebSite),
 * opis serwisu (strona główna, RSS, llms.txt, manifest) i licencja treści.
 */
import { site } from '@/data/navigation';
import { contact } from '@/data/o-serwisie';

export const identity = {
  name: site.name,
  /** opis serwisu — meta description strony głównej, WebSite, RSS, llms.txt */
  description:
    'Przewodnik po zarobkach i pracy lekarzy w Polsce: dane z jawnych źródeł, mechanizmy systemu, prawa pacjenta i egzamin LEK. Przy każdej liczbie źródło.',
  language: 'pl-PL',
  locale: 'pl_PL',
  twitter: site.twitter,
  /** logo wydawcy — rastrowa ikona z src/pages/[icon].png.ts (Google wymaga min. 112 px) */
  logo: { path: '/icon-512.png', width: 512, height: 512 },
  /** profile serwisu (schema.org/sameAs) — tylko prawdziwe adresy, bez placeholderów; te same co w stopce */
  sameAs: [
    'https://x.com/ZarobkiLekarzy',
    'https://www.youtube.com/@ZarobkiLekarzy',
    'https://www.tiktok.com/@zarobkilekarzy.pl',
    'https://wykop.pl/ludzie/zarobkilekarzy',
    'https://github.com/zarobkilekarzy/zarobkilekarzy.pl',
  ],
  /** adres redakcji: kontakt i zgłoszenia błędów (Organization.email i contactPoint) */
  email: contact.email,
  /**
   * Strony o zaufaniu (YMYL): zasady pracy, sprostowania i finansowanie — sekcje /o-projekcie/.
   * Serwis jest anonimowy, więc o wiarygodności mówi to, jak pracuje, nie kto go prowadzi.
   */
  publishingPrinciples: '/o-projekcie/#zasady',
  correctionsPolicy: '/o-projekcie/#sprostowania',
  ownershipFundingInfo: '/o-projekcie/#finansowanie',
  /** licencja treści i zestawień (jak na dotychczasowej stronie) */
  license: 'https://creativecommons.org/licenses/by/4.0/',
  /** kolor paska przeglądarki i manifestu */
  themeColor: '#040B1B',
  /** tło ikon i ekranu startowego (kolor tła favicon.svg) */
  iconBackground: '#2664EC',
};
