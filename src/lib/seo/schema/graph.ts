/**
 * Jeden graf JSON-LD na stronę: Organization, WebSite, WebPage (+ obrazek i okruszki)
 * i główne byty strony (Article, Dataset, DefinedTermSet, WebApplication). Strony poza indeksem grafu nie dostają.
 */
import type { SeoInput, ResolvedSeo, SchemaNode } from '../types';
import { article, breadcrumbList, dataset, definedTermSet, ids, organization, primaryImage, webApplication, webPage, website, type Identity } from './nodes';

export function buildGraph(input: SeoInput, seo: ResolvedSeo, identity: Identity, site: URL) {
  if (!seo.indexable) return undefined;

  const home = site.href;
  const id = ids(home, seo.url);
  const crumbs = input.breadcrumbs ?? [];
  const image = primaryImage(seo, id);

  const entities: SchemaNode[] = (input.entities ?? []).map((entity) => {
    switch (entity.kind) {
      case 'article':
        return article(entity, seo, identity, id);
      case 'dataset':
        return dataset(entity, seo, identity, id);
      case 'termSet':
        return definedTermSet(entity, seo, identity, id);
      case 'webApp':
        return webApplication(entity, seo, identity, id);
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
        language: identity.language,
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
