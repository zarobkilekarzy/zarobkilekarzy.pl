/**
 * SeoInput strony → wartości znaczników <head>: pełny tytuł z szablonu, canonical, robots, OG.
 * Jedyne miejsce, w którym powstaje szablon tytułu — strony podają tytuł bez nazwy serwisu.
 */
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from './robots';
import { absoluteUrl, withSlash } from './urls';
import type { ResolvedSeo, SeoImage, SeoInput } from './types';

export const TITLE_SEPARATOR = ' | ';

export const fullTitle = (input: Pick<SeoInput, 'title' | 'titleAbsolute'>, siteName: string) =>
  input.titleAbsolute ? input.title : `${input.title}${TITLE_SEPARATOR}${siteName}`;

interface Context {
  site: URL;
  /** Astro.url.pathname */
  pathname: string;
  siteName: string;
  /** obrazek OG strony (lib/og/registry → ogImageFor); strony poza indeksem go nie potrzebują */
  image?: SeoImage;
}

export function resolveSeo(input: SeoInput, { site, pathname, siteName, image }: Context): ResolvedSeo {
  const url = absoluteUrl(withSlash(pathname), site);
  const indexable = input.index !== false;
  const modified = input.dates?.modified ?? input.dates?.published;

  return {
    title: fullTitle(input, siteName),
    description: input.description,
    url,
    canonical: input.canonical ? absoluteUrl(withSlash(input.canonical), site) : url,
    robots: indexable ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    indexable,
    social: {
      type: input.type ?? 'website',
      title: input.social?.title ?? input.title,
      description: input.social?.description ?? input.description,
      image: image && { ...image, url: absoluteUrl(image.url, site) },
    },
    published: input.dates?.published?.toISOString(),
    modified: modified?.toISOString(),
    section: input.section,
  };
}
