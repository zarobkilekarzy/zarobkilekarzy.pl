/** Moduł SEO serwisu — zob. docs/seo-system.md. */
export { fullTitle, resolveSeo, TITLE_SEPARATOR } from './meta';
export { ROBOTS_INDEX, ROBOTS_NOINDEX, robotsTxt } from './robots';
export { absoluteUrl, isFilePath, withSlash } from './urls';
export { buildGraph } from './schema/graph';
export { serializeJsonLd } from './schema/serialize';
export type { Crumb, Entity, PageSchema, ResolvedSeo, SchemaNode, SeoImage, SeoInput } from './types';
