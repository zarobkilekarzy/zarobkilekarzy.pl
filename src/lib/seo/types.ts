/**
 * Model SEO: co strona mówi o sobie (SeoInput) i co z tego wylicza lib/seo (ResolvedSeo).
 * Strony i layouty podają fakty; znaczniki, szablon tytułu i graf schema.org buduje lib/seo.
 */

/** Okruszek nawigacji; ostatni (bieżąca strona) nie ma adresu. */
export interface Crumb {
  label: string;
  href?: string;
}

/** Węzeł schema.org w grafie JSON-LD. */
export type SchemaNode = { '@type': string | string[]; '@id'?: string } & Record<string, unknown>;

/**
 * Rodzaj strony (węzeł WebPage w grafie). Strona-indeks wymienia swoje materiały,
 * strona z pytaniami i odpowiedziami podaje je jako FAQ.
 */
export type PageSchema =
  | { type: 'WebPage' }
  | { type: 'CollectionPage'; items: { name: string; url: string }[] }
  | { type: 'FAQPage'; questions: { question: string; answer: string }[] };

/** Główny byt strony obok WebPage — artykuł, zbiór danych albo słownik pojęć. */
export type Entity =
  | {
      kind: 'article';
      /** adresy źródeł, na które powołuje się tekst (schema.org/citation) */
      citations?: string[];
    }
  | {
      kind: 'dataset';
      /** domyślnie tytuł strony */
      name?: string;
      /** domyślnie opis strony; Google oczekuje 50–5000 znaków */
      description?: string;
      /** domyślnie licencja treści serwisu */
      license?: string;
      /** np. '2025' albo '2020/2025' */
      temporalCoverage?: string;
      /** domyślnie „Polska” */
      spatialCoverage?: string;
      /** źródła danych */
      isBasedOn?: string[];
      /** pliki do pobrania */
      distribution?: { contentUrl: string; encodingFormat: string }[];
    }
  | {
      /** słownik pojęć: DefinedTermSet z hasłami (DefinedTerm) — każde hasło ma kotwicę na stronie */
      kind: 'termSet';
      /** domyślnie tytuł strony */
      name?: string;
      terms: { id: string; name: string; alternateName?: string; description: string }[];
    };

export interface SeoInput {
  /** tytuł bez nazwy serwisu — szablon dopisuje „ | zarobkilekarzy.pl” */
  title: string;
  /** tytuł użyty dosłownie, bez szablonu (strona główna) */
  titleAbsolute?: boolean;
  /** meta description; wyszukiwarki ucinają ok. 160 znaków */
  description: string;
  /** tytuł i opis w podglądach linków (og/twitter), gdy mają być inne niż w wynikach wyszukiwania */
  social?: { title?: string; description?: string };
  /** og:type; 'article' dodaje article:published_time / modified_time / section */
  type?: 'website' | 'article';
  /** false = noindex (strona nie trafia do indeksu, sitemapy ani grafu) */
  index?: boolean;
  /** tylko dla duplikatów — adres oryginału; domyślnie adres strony */
  canonical?: string;
  dates?: { published?: Date; modified?: Date };
  /** dział (article:section) */
  section?: string;
  /** te same okruszki, które widzi czytelnik */
  breadcrumbs?: Crumb[];
  /** rodzaj strony; domyślnie WebPage */
  page?: PageSchema;
  /** główne byty strony */
  entities?: Entity[];
}

/** Obrazek podglądu (OG) — ten sam trafia do og:image i do grafu jako primaryImageOfPage. */
export interface SeoImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ResolvedSeo {
  /** pełny tytuł do <title> */
  title: string;
  description: string;
  /** absolutny adres tej strony */
  url: string;
  /** absolutny adres kanoniczny */
  canonical: string;
  /** treść meta robots */
  robots: string;
  indexable: boolean;
  social: {
    type: 'website' | 'article';
    title: string;
    description: string;
    image?: SeoImage;
  };
  /** daty w ISO — do article:* i do grafu */
  published?: string;
  modified?: string;
  section?: string;
}
