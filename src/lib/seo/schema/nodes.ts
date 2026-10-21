/**
 * Węzły schema.org. Każdy ma stałe @id, a węzły łączą się referencjami: wydawca jest opisany raz
 * (/#organization), a artykuł, strona i serwis wskazują go przez { '@id' }.
 */
import type { Crumb, Entity, PageSchema, ResolvedSeo, SchemaNode } from '../types';

export interface Identity {
  name: string;
  description: string;
  language: string;
  logo: { path: string; width: number; height: number };
  sameAs: string[];
  publishingPrinciples: string;
  license: string;
}

/** Stałe identyfikatory węzłów: serwisowe od adresu serwisu, stronowe od adresu strony. */
export const ids = (site: string, url: string) => ({
  organization: `${site}#organization`,
  website: `${site}#website`,
  logo: `${site}#logo`,
  webpage: `${url}#webpage`,
  breadcrumb: `${url}#breadcrumb`,
  image: `${url}#primaryimage`,
  article: `${url}#article`,
  dataset: `${url}#dataset`,
  terms: `${url}#terms`,
  app: `${url}#app`,
});

export type Ids = ReturnType<typeof ids>;

export const ref = (id: string) => ({ '@id': id });

const abs = (path: string, site: string) => new URL(path, site).href;

export const organization = (identity: Identity, site: string, id: Ids): SchemaNode => ({
  '@type': 'Organization',
  '@id': id.organization,
  name: identity.name,
  url: site,
  logo: {
    '@type': 'ImageObject',
    '@id': id.logo,
    url: abs(identity.logo.path, site),
    contentUrl: abs(identity.logo.path, site),
    width: identity.logo.width,
    height: identity.logo.height,
    caption: identity.name,
  },
  image: ref(id.logo),
  sameAs: identity.sameAs,
  publishingPrinciples: abs(identity.publishingPrinciples, site),
});

export const website = (identity: Identity, site: string, id: Ids): SchemaNode => ({
  '@type': 'WebSite',
  '@id': id.website,
  url: site,
  name: identity.name,
  description: identity.description,
  inLanguage: identity.language,
  publisher: ref(id.organization),
});

export const primaryImage = (seo: ResolvedSeo, id: Ids): SchemaNode | undefined =>
  seo.social.image && {
    '@type': 'ImageObject',
    '@id': id.image,
    url: seo.social.image.url,
    contentUrl: seo.social.image.url,
    width: seo.social.image.width,
    height: seo.social.image.height,
    caption: seo.social.image.alt,
  };

/** Okruszki → BreadcrumbList; ostatni element (bieżąca strona) dostaje adres strony. */
export const breadcrumbList = (crumbs: Crumb[], seo: ResolvedSeo, site: string, id: Ids): SchemaNode => ({
  '@type': 'BreadcrumbList',
  '@id': id.breadcrumb,
  itemListElement: crumbs.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.label,
    item: i === crumbs.length - 1 ? seo.url : abs(crumb.href ?? '/', site),
  })),
});

/** Węzeł strony; rodzaj (CollectionPage, FAQPage) dokłada swoje pola. */
export function webPage(
  seo: ResolvedSeo,
  page: PageSchema,
  opts: { hasBreadcrumb: boolean; hasImage: boolean; mainEntity?: string; language: string },
  site: string,
  id: Ids,
): SchemaNode {
  const node: SchemaNode = {
    '@type': page.type,
    '@id': id.webpage,
    url: seo.url,
    name: seo.social.title,
    description: seo.description,
    inLanguage: opts.language,
    isPartOf: ref(id.website),
    ...(opts.hasImage && { primaryImageOfPage: ref(id.image) }),
    ...(opts.hasBreadcrumb && { breadcrumb: ref(id.breadcrumb) }),
    ...(seo.published && { datePublished: seo.published }),
    ...(seo.modified && { dateModified: seo.modified }),
    ...(opts.mainEntity && { mainEntity: ref(opts.mainEntity) }),
  };

  if (page.type === 'CollectionPage') {
    node.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: page.items.length,
      itemListElement: page.items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        url: abs(item.url, site),
      })),
    };
  }
  if (page.type === 'FAQPage') {
    node.mainEntity = page.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    }));
  }
  return node;
}

type EntityOf<K extends Entity['kind']> = Extract<Entity, { kind: K }>;

export const article = (entity: EntityOf<'article'>, seo: ResolvedSeo, identity: Identity, id: Ids): SchemaNode => ({
  '@type': 'Article',
  '@id': id.article,
  headline: seo.social.title,
  description: seo.description,
  inLanguage: identity.language,
  mainEntityOfPage: ref(id.webpage),
  isPartOf: ref(id.website),
  ...(seo.social.image && { image: ref(id.image) }),
  ...(seo.published && { datePublished: seo.published }),
  ...(seo.modified && { dateModified: seo.modified }),
  ...(seo.section && { articleSection: seo.section }),
  author: ref(id.organization),
  publisher: ref(id.organization),
  isAccessibleForFree: true,
  license: identity.license,
  ...(entity.citations?.length && { citation: entity.citations }),
});

export const dataset = (entity: EntityOf<'dataset'>, seo: ResolvedSeo, identity: Identity, id: Ids): SchemaNode => ({
  '@type': 'Dataset',
  '@id': id.dataset,
  name: entity.name ?? seo.social.title,
  description: entity.description ?? seo.description,
  url: seo.url,
  inLanguage: identity.language,
  mainEntityOfPage: ref(id.webpage),
  isAccessibleForFree: true,
  license: entity.license ?? identity.license,
  creator: ref(id.organization),
  publisher: ref(id.organization),
  spatialCoverage: { '@type': 'Place', name: entity.spatialCoverage ?? 'Polska' },
  ...(entity.temporalCoverage && { temporalCoverage: entity.temporalCoverage }),
  ...(seo.modified && { dateModified: seo.modified }),
  ...(entity.isBasedOn?.length && { isBasedOn: entity.isBasedOn }),
  ...(entity.distribution?.length && {
    distribution: entity.distribution.map((d) => ({ '@type': 'DataDownload', ...d })),
  }),
});

/** Słownik pojęć: hasła jako DefinedTerm z adresem kotwicy (`/slownik/#kontrakt`). */
export const definedTermSet = (entity: EntityOf<'termSet'>, seo: ResolvedSeo, identity: Identity, id: Ids): SchemaNode => ({
  '@type': 'DefinedTermSet',
  '@id': id.terms,
  name: entity.name ?? seo.social.title,
  description: seo.description,
  url: seo.url,
  inLanguage: identity.language,
  mainEntityOfPage: ref(id.webpage),
  publisher: ref(id.organization),
  hasDefinedTerm: entity.terms.map((term) => ({
    '@type': 'DefinedTerm',
    '@id': `${seo.url}#${term.id}`,
    url: `${seo.url}#${term.id}`,
    name: term.name,
    ...(term.alternateName && { alternateName: term.alternateName }),
    description: term.description,
    inDefinedTermSet: ref(id.terms),
  })),
});

/** Narzędzie w przeglądarce: bezpłatne (oferta 0 zł), bez instalacji. */
export const webApplication = (entity: EntityOf<'webApp'>, seo: ResolvedSeo, identity: Identity, id: Ids): SchemaNode => ({
  '@type': 'WebApplication',
  '@id': id.app,
  name: entity.name ?? seo.social.title,
  ...(entity.alternateName?.length && { alternateName: entity.alternateName }),
  description: seo.description,
  url: seo.url,
  inLanguage: identity.language,
  applicationCategory: entity.category,
  operatingSystem: 'Dowolny (przeglądarka internetowa)',
  browserRequirements: 'Wymaga JavaScript',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'PLN' },
  isAccessibleForFree: true,
  mainEntityOfPage: ref(id.webpage),
  publisher: ref(id.organization),
});
