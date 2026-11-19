/**
 * Huby: strony, które zbierają artykuły o jednym temacie (kraje, ustawy). Artykuł należący do hubu ma w okruszkach
 * hub zamiast działu, żeby dało się do niego wrócić jednym kliknięciem.
 * Hub nieopublikowany (szkic, noindex) pojawia się tylko w okruszkach artykułów, które same są szkicami —
 * opublikowany tekst nie może prowadzić do strony spoza indeksu.
 * Tłumaczenie (`en`) wraca do angielskiego hubu, jeśli taki jest (kraje: /en/countries/); hub „Ustawy” jest tylko po polsku.
 */
import { COUNTRIES, KRAJE_PUBLISHED, TOPIC_TEXTS } from '@/data/kraje';
import { COUNTRIES_HUB_EN } from '@/data/en/kraje';
import { series } from '@/data/serie';

export interface Hub {
  label: string;
  href: string;
  published: boolean;
}

const idOf = (href: string) => href.split('/').filter(Boolean).at(-1)!;

const KRAJE: Hub = { label: 'Kraje', href: '/kraje/', published: KRAJE_PUBLISHED };
const countryIds = new Set([
  ...COUNTRIES.filter((c) => c.text?.kind === 'profil').map((c) => idOf(c.text!.href)),
  ...TOPIC_TEXTS.map((t) => idOf(t.href)),
]);

const seriesHubs = series
  .filter((s) => s.href)
  .map((s) => ({ hub: { label: s.href === '/ustawy/' ? 'Ustawy' : s.title, href: s.href!, published: true }, ids: new Set(s.items.map((i) => i.ref)) }));

/** Hub artykułu o danym id (id polskiego oryginału); `draft` = artykuł jest szkicem (noindex), `en` = strona tłumaczenia. */
export function hubOf(id: string, draft: boolean, en = false): Hub | undefined {
  if (en) return countryIds.has(id) && (KRAJE_PUBLISHED || draft) ? { ...COUNTRIES_HUB_EN, published: KRAJE_PUBLISHED } : undefined;
  const hub = countryIds.has(id) ? KRAJE : seriesHubs.find((s) => s.ids.has(id))?.hub;
  return hub && (hub.published || draft) ? hub : undefined;
}
