import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adres produkcyjny — używany do generowania kanonicznych URL i mapy strony.
export default defineConfig({
  site: 'https://zarobkilekarzy.pl',
  integrations: [sitemap()],
  // Prefetch wbudowany w Astro 5. Bez ClientRoutera trzeba włączyć jawnie —
  // nawigacja artykuły ↔ kategorie ↔ paginacja staje się natychmiastowa.
  prefetch: { prefetchAll: true },
  image: {
    // Miniatury wideo z YouTube optymalizowane przez <Image> (astro:assets).
    remotePatterns: [{ protocol: 'https', hostname: 'img.youtube.com' }],
  },
});
