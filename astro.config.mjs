import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adres produkcyjny — używany do generowania kanonicznych URL i mapy strony.
export default defineConfig({
  site: 'https://zarobkilekarzy.pl',
  // /admin/* to strony wewnętrzne (noindex) — poza mapą strony.
  integrations: [sitemap({ filter: (page) => !page.includes('/admin/') })],
  // Prefetch wbudowany w Astro 5. Bez ClientRoutera trzeba włączyć jawnie —
  // nawigacja artykuły ↔ kategorie ↔ paginacja staje się natychmiastowa.
  prefetch: { prefetchAll: true },
  image: {
    // Miniatury wideo z YouTube optymalizowane przez <Image> (astro:assets).
    remotePatterns: [{ protocol: 'https', hostname: 'img.youtube.com' }],
  },
});
