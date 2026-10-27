/**
 * Jeden graf JSON-LD na stronę: Organization, WebSite, WebPage (+ obrazek i okruszki)
 * i główne byty strony (Article, Dataset, DefinedTermSet, WebApplication). Strony poza indeksem grafu nie dostają.
 */
import { LOCALE_META } from '@/i18n/locales';
import type { SeoInput, ResolvedSeo, SchemaNode } from '../types';
import { article, breadcrumbList, dataset, definedTermSet, ids, organization, primaryImage, webApplication, webPage, website, type Identity } from './nodes';

export function buildGraph(input: SeoInput, seo: ResolvedSeo, identity: Identity, site: URL) {
  if (!seo.indexable) return undefined;

  // serwis (Organization, WebSite) jest polski; strona i jej byty — w języku strony
  const page = { ...identity, language: LOCALE_META[seo.locale].schema };

  const home = site.href;
  const id = ids(home, seo.url);
  const crumbs = input.breadcrumbs ?? [];
  const image = primaryImage(seo, id);

  const entities: SchemaNode[] = (input.entities ?? []).map((entity) => {
    switch (entity.kind) {
      case 'article':
        return article(entity, seo, page, id);
      case 'dataset':
        return dataset(entity, seo, page, id);
      case 'termSet':
        return definedTermSet(entity, seo, page, id);
      case 'webApp':
        return webApplication(entity, seo, page, id);
    }
  });

  const nodes: (SchemaNode | undefined)[] = [
    organization(identity, home, id),
    website(identity, home, id),
    webPage(
      seo,
      input.page ?? { type: 'WebPage' },
      {
        hasBreadcrumb: crumbs.length > 1,
        hasImage: Boolean(image),
        mainEntity: entities[0]?.['@id'],
        language: page.language,
      },
      home,
      id,
    ),
    image,
    crumbs.length > 1 ? breadcrumbList(crumbs, seo, home, id) : undefined,
    ...entities,
  ];

  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}
