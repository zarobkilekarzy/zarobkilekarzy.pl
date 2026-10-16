// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { headingIds } from './src/lib/markdown/heading-ids';
import { footnotes } from './src/lib/markdown/footnotes';
import { typography } from './src/lib/markdown/typography';
import seo, { astroRedirects } from './integrations/seo';

// SEO: _redirects, sitemap z faktów HTML i audyt po buildzie
const seoIntegration = seo();

// Wspólne ustawienia fontów: polskie znaki są w podzbiorze latin-ext
const subsets = /** @type {[string, ...string[]]} */ (['latin', 'latin-ext']);

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Adres produkcyjny — z niego powstają canonical, sitemap i robots.txt
  site: 'https://zarobkilekarzy.pl',
  // Strony zawsze z ukośnikiem na końcu (jak na produkcji: /dane → 308 → /dane/); endpointy z rozszerzeniem bez zmian
  trailingSlash: 'always',

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
  ],

  env: {
    schema: {
      // Token Cloudflare Web Analytics (ręczna instalacja skryptu).
      // Pusty = brak skryptu, np. gdy Cloudflare wstrzykuje go automatycznie.
      CF_WEB_ANALYTICS_TOKEN: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },

  // Fonty pobierane w czasie budowania i serwowane lokalnie (Fonts API, stabilne od Astro 6)
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter Tight',
      cssVariable: '--font-inter-tight',
      weights: ['300 500'],
      styles: ['normal'],
      subsets,
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-plex-sans',
      weights: ['400 600'],
      styles: ['normal'],
      subsets,
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500],
      styles: ['normal'],
      subsets,
      fallbacks: ['Menlo', 'monospace'],
    },
  ],
});
