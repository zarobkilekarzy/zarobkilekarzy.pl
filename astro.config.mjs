import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Adres produkcyjny — używany do generowania kanonicznych URL i mapy strony.
export default defineConfig({
  site: 'https://zarobkilekarzy.pl',
  integrations: [sitemap()],
  image: {
    // Miniatury wideo z YouTube optymalizowane przez <Image> (astro:assets).
    remotePatterns: [{ protocol: 'https', hostname: 'img.youtube.com' }],
  },
});
