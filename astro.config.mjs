import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { lastmodFor } from './src/lib/pageDates.mjs';
import stripHtmlComments from './integrations/strip-html-comments.mjs';
import pagefindSearch from './integrations/pagefind.mjs';

// Adres produkcyjny — używany do generowania kanonicznych URL i mapy strony.
export default defineConfig({
  site: 'https://zarobkilekarzy.pl',
  integrations: [
    sitemap({
      // /admin/* to strony wewnętrzne (noindex) — poza mapą strony.
      // /druk/ to wyciągi do wydruku — powielają treść strony źródłowej, więc do
      // indeksu nie idą (mają też noindex; zgłaszanie ich w mapie byłoby sprzeczne).
      filter: (page) => !page.includes('/admin/') && !page.includes('/druk/'),
      // <lastmod> z centralnej mapy dat (te same daty co widoczna „Ostatnia
      // aktualizacja") — sygnał świeżości przyspieszający rekrawl po zmianie.
      serialize(item) {
        const iso = lastmodFor(new URL(item.url).pathname);
        if (iso) item.lastmod = `${iso}T12:00:00+00:00`;
        return item;
      },
    }),
    // Komentarze z szablonów są robocze — nie trafiają do publikowanego HTML.
    stripHtmlComments(),
    // Indeks wyszukiwarki (Pagefind) budowany z gotowego, oczyszczonego HTML —
    // po `stripHtmlComments`, więc indeksuje dokładnie to, co ląduje na produkcji.
    pagefindSearch(),
  ],
  // Prefetch wbudowany w Astro 5. Bez ClientRoutera trzeba włączyć jawnie —
  // nawigacja artykuły ↔ kategorie ↔ paginacja staje się natychmiastowa.
  prefetch: { prefetchAll: true },
  image: {
    // Miniatury wideo z YouTube optymalizowane przez <Image> (astro:assets).
    remotePatterns: [{ protocol: 'https', hostname: 'img.youtube.com' }],
  },
});
