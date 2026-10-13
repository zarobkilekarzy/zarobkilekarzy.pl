/** Ręcznie utrzymywana allowlista. Nowe źródło artykułu nie dodaje uprawnień importera.
 * Pierwsza wersja obsługuje jednoznaczny articleBody JSON-LD lub oznaczone ciało artykułu.
 * Pozostałe układy wymagają osobnego profilu i testu; nie pobieramy całego <main>.
 */
export const IMPORT_PROFILES = Object.freeze({
  'www.rynekzdrowia.pl': { selector: '[itemprop="articleBody"]' },
  'www.medonet.pl': { selector: '[itemprop="articleBody"]' },
  'pulsmedycyny.pl': { selector: '[itemprop="articleBody"]' },
  'cowzdrowiu.pl': { selector: '[itemprop="articleBody"]' },
  'www.cowzdrowiu.pl': { selector: '[itemprop="articleBody"]' },
  'x.com': { adapter: 'x' },
  'twitter.com': { adapter: 'x' },
});
export const OMIT_SELECTOR = 'script,style,noscript,nav,aside,footer,form,[role="navigation"],[role="complementary"],.comments,.comment,#comments,[data-comments],[itemprop="comment"]';
