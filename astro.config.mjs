// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { headingIds } from './src/lib/markdown/heading-ids';
import { footnotes } from './src/lib/markdown/footnotes';
import { typography } from './src/lib/markdown/typography';
import seo, { astroRedirects } from './integrations/seo';
import markdown from './integrations/markdown';
import mobywatel from './src/mobywatel/integracja';
import { fontFamilies, localVariants } from './src/lib/fonts';

// SEO: _redirects, sitemap z faktów HTML i audyt po buildzie
const seoIntegration = seo();

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Adres produkcyjny — z niego powstają canonical, sitemap i robots.txt
  site: 'https://zarobkilekarzy.pl',
  // Strony zawsze z ukośnikiem na końcu (jak na produkcji: /dane → 308 → /dane/); endpointy z rozszerzeniem bez zmian
  trailingSlash: 'always',

  // CSS w <style> zamiast <link>: ~10 KB (≈3 KB po kompresji) na stronę, bez trzech żądań
  // blokujących pierwsze malowanie — na telefonie FCP 1,5 → 1,4 s (Lighthouse). CSP ma style-src 'unsafe-inline'.
  build: { inlineStylesheets: 'always' },

  // Stare adresy → nowe: rejestr w src/data/seo/redirects.ts (w buildzie także dist/_redirects z 301)
  redirects: astroRedirects(),

  // Podstrona pobierana w tle po najechaniu na link (lub fokusie) — przejście (base.css) startuje
  // od razu, bez czekania na sieć. Przy oszczędzaniu danych / wolnym łączu Astro samo przechodzi na „tap”.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

  // Domyślny procesor Astro 7 (Sätteri) + id nagłówków bez polskich znaków — czyste kotwice do udostępniania;
  // przypisy GFM (`[^id]`) po polsku, zwinięte w listę „Przypisy” na końcu treści
  markdown: {
    processor: satteri({
      hastPlugins: [headingIds, footnotes, typography],
      features: { gfm: { footnotes: { label: 'Przypisy', backLabel: 'Wróć do miejsca w tekście (przypis {reference})' } } },
    }),
  },

  integrations: [
    // Pierwsza: warianty prototypów mObywatela (statyczne, /mobywatel/<wariant>/) — składane przed audytem SEO,
    // który sprawdza też je (noindex, tytuł, opis, canonical) i linki do nich ze strony konkursu
    mobywatel(),
    // Artykuły w .mdx mogą używać bloków z src/components (np. <BarChart />)
    mdx(),
    // sitemap-index.xml + sitemap-0.xml przy każdym buildzie
    // (bez nieużywanych przestrzeni nazw: wersji językowych, wideo i Google News);
    // o obecności strony i lastmod decyduje jej HTML (noindex wypada, data z grafu JSON-LD)
    sitemap({
      namespaces: { news: false, video: false, xhtml: false, image: false },
      serialize: seoIntegration.serializeSitemapItem,
    }),
    // Po sitemapie: audyt czyta gotowe pliki mapy
    seoIntegration,
    // strona.md dla każdej strony — treść w Markdownie dla agentów (llms.txt)
    markdown(),
  ],

  env: {
    schema: {
      // Token Cloudflare Web Analytics (ręczna instalacja skryptu).
      // Pusty = brak skryptu, np. gdy Cloudflare wstrzykuje go automatycznie.
      CF_WEB_ANALYTICS_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },

  // Fonty serwowane z naszej domeny: przycięte pliki w src/assets/fonts, definicje i powód w src/lib/fonts.ts
  fonts: fontFamilies.map((family) => ({
    provider: fontProviders.local(),
    name: family.name,
    cssVariable: family.cssVariable,
    fallbacks: family.fallbacks,
    options: { variants: localVariants(family) },
  })),
});
