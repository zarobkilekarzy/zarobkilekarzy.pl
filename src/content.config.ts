/**
 * Kolekcje treści. Artykuły i pojęcia słowniczka to jedno źródło prawdy
 * dla strony głównej, wyszukiwarki i podstron artykułów.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES, DATA_FORMATS, TOPICS } from './types';
import { ogSchema } from './lib/og/schema';

const articles = defineCollection({
  // .md dla prostych tekstów, .mdx gdy artykuł osadza komponenty (wykresy, ramki)
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(CATEGORIES),
      /** data publikacji; brak = materiał stały */
      date: z.coerce.date().optional(),
      /** data ostatniej aktualizacji — pokazywana w artykule, liczy się do „Nowe i zaktualizowane” */
      updated: z.coerce.date().optional(),
      /** lead: jedno–dwa zdania pod tytułem, też opis w wynikach wyszukiwania i meta description */
      summary: z.string(),
      /** „W skrócie” — najważniejsze tezy artykułu */
      keyPoints: z.array(z.string()).optional(),
      /** wycofane: źródła to przypisy `[^id]` w treści — pole zostaje, żeby stary wzorzec nie przechodził po cichu */
      sources: z.never({ error: 'Pole `sources` jest wycofane: źródła zapisuj jako przypisy [^id] (README → „Nowa treść”).' }).optional(),
      /**
       * „Dlaczego to nasz temat” — stanowisko redakcji pod treścią (akapity).
       * Opcjonalne: tylko przy tematach, w których redakcja zajmuje stanowisko.
       */
      editorial: z.array(z.string()).min(1).optional(),
      /** powiązane materiały; bez tego pola — inne z tej samej kategorii */
      related: z.array(reference('articles')).optional(),
      /** tymczasowy adres dla materiałów bez treści — zob. lib/content.ts → articleHref */
      href: z.string().optional(),
      featured: z.boolean().default(false),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      coverPosition: z.string().optional(),
      /** krótka etykieta na zdjęciu, np. „1 358 placówek” */
      badge: z.string().optional(),
      kicker: z.string().optional(),
      /**
       * dział na stronie-indeksie (/dane/, /mechanizmy/, /analizy/) — materiał pojawia się w jej spisie;
       * lista, gdy materiał należy do kilku stron (np. porównanie jest i w danych, i w analizach)
       */
      topic: z.union([z.enum(TOPICS), z.array(z.enum(TOPICS))]).optional(),
      /** forma zestawienia (etykieta w spisie): wykresy, tabela, wyszukiwarka… */
      format: z.enum(DATA_FORMATS).optional(),
      /** liczba na karcie w spisie, np. { value: '1 358', unit: 'placówek' } */
      stat: z.object({ value: z.string(), unit: z.string() }).optional(),
      /** kolejność w dziale (mniejsza = wyżej); bez niej — alfabetycznie, na końcu */
      order: z.number().optional(),
      /** obrazek OG: nadpisania presetu artykułu — zob. docs/og-system.md */
      og: ogSchema({ image }),
      /**
       * SEO — zob. docs/seo-system.md. `seoTitle`: tytuł w wynikach wyszukiwania, gdy tytuł H1 jest
       * za długi (audyt ostrzega > 60 znaków z nazwą serwisu) albo nie zawiera frazy, której ludzie szukają.
       */
      seoTitle: z.string().optional(),
      /** meta description, gdy `summary` ma ponad 160 znaków; domyślnie `summary` */
      description: z.string().optional(),
      /** materiał z treścią, który nie ma trafić do wyszukiwarek (noindex, poza sitemapą) */
      noindex: z.boolean().default(false),
      /** schema.org/Dataset dla działu Dane — uzupełnienia domyślnych wartości (licencja, zasięg) */
      dataset: z
        .object({
          temporalCoverage: z.string().optional(),
          spatialCoverage: z.string().optional(),
          license: z.url().optional(),
        })
        .optional(),
    }),
});

/** Odnośnik z pola URL: adres bezwzględny (źródło) albo ścieżka serwisu zakończona „/” (strona). */
const glossaryLink = z.object({ label: z.string(), href: z.string() });

/** Słownik pojęć (/slownik/, moduł na stronie głównej, wyszukiwarka). Opis pól: nagłówek glossary.yaml. */
const glossary = defineCollection({
  loader: file('src/content/glossary.yaml'),
  schema: z.object({
    term: z.string(),
    full: z.string(),
    def: z.string(),
    /** „Więcej”: artykuł z kolekcji (adres i tytuł z lib/content) albo strona spoza kolekcji */
    more: z
      .array(
        z.union([
          z.object({ ref: reference('articles'), anchor: z.string().optional(), label: z.string().optional() }).strict(),
          glossaryLink.extend({ href: z.string().regex(/^\/.*\/$/, 'adres strony serwisu: /sciezka/') }).strict(),
        ]),
      )
      .min(1),
    /** podstawa prawna albo źródło definicji */
    sources: z.array(glossaryLink.extend({ href: z.url() }).strict()).min(1),
    /** pozycja w module „Słowniczek” na stronie głównej; brak = hasło tylko na /slownik/ */
    home: z.number().int().positive().optional(),
    /** krótsza etykieta zakładki na stronie głównej (domyślnie `term`) */
    tab: z.string().optional(),
  }),
});

export const collections = { articles, glossary };
