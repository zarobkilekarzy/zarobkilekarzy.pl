/**
 * Napisy skryptów działających w przeglądarce (kotwice, zaznaczenie, kopiowanie). Język strony
 * czytamy z <html lang> — ustawia go BaseLayout z adresu (src/i18n/locales.ts).
 */
import type { Locale } from './locales';

export const pageLocale = (): Locale => (document.documentElement.lang.startsWith('en') ? 'en' : 'pl');

const strings = {
  pl: {
    sectionLink: 'Kopiuj link do tej sekcji',
    sectionCopied: 'Skopiowano link',
    sectionInBar: 'Link jest w pasku adresu',
    sectionCopiedAnnounce: 'Link do sekcji skopiowany',
    sectionInBarAnnounce: 'Link do sekcji jest w pasku adresu',
    copyLink: 'Kopiuj link',
    copied: 'Skopiowano ✓',
    failed: 'Nie udało się',
    quoteCopiedAnnounce: 'Link do zaznaczonego fragmentu skopiowany',
    quoteFailedAnnounce: 'Nie udało się skopiować linku',
  },
  en: {
    sectionLink: 'Copy a link to this section',
    sectionCopied: 'Link copied',
    sectionInBar: 'The link is in the address bar',
    sectionCopiedAnnounce: 'Link to the section copied',
    sectionInBarAnnounce: 'The link to the section is in the address bar',
    copyLink: 'Copy link',
    copied: 'Copied ✓',
    failed: 'Could not copy',
    quoteCopiedAnnounce: 'Link to the selected passage copied',
    quoteFailedAnnounce: 'Could not copy the link',
  },
} satisfies Record<Locale, Record<string, string>>;

export const clientUi = () => strings[pageLocale()];
