/**
 * Dane strukturalne: poprawny JSON, rozwiązywalne referencje @id i pola, bez których Google
 * nie pokaże wyniku rozszerzonego (formalnie „zalecane”, u nas obowiązkowe).
 */
import { contentPages, type Finding, type Rule } from '../context';
import { graphNodes, isIndexable } from '../../facts';

type Node = Record<string, unknown>;

const REQUIRED: Record<string, { error: string[]; warn?: string[] }> = {
  Article: { error: ['headline', 'image', 'author', 'publisher'], warn: ['datePublished', 'dateModified'] },
  Dataset: { error: ['name', 'description'], warn: ['license'] },
  BreadcrumbList: { error: ['itemListElement'] },
  FAQPage: { error: ['mainEntity'] },
  DefinedTermSet: { error: ['name', 'hasDefinedTerm'] },
  Organization: { error: ['name', 'url', 'logo'] },
  WebSite: { error: ['name', 'url'] },
};

const types = (n: Node) => [n['@type']].flat().filter((t): t is string => typeof t === 'string');

/**
 * Identyfikatory w grafie w dowolnym zagnieżdżeniu: referencje (obiekt z samym '@id')
 * i definicje (obiekt z '@id' i innymi polami, np. logo zdefiniowane wewnątrz Organization).
 */
function ids(value: unknown, out = { refs: new Set<string>(), defs: new Set<string>() }) {
  if (Array.isArray(value)) value.forEach((v) => ids(v, out));
  else if (value && typeof value === 'object') {
    const node = value as Node;
    if (typeof node['@id'] === 'string') (Object.keys(node).length === 1 ? out.refs : out.defs).add(node['@id']);
    Object.values(node).forEach((v) => ids(v, out));
  }
  return out;
}

export const structuredData: Rule = (ctx) => {
  const out: Finding[] = [];
  const add = (level: 'error' | 'warn', page: string, message: string) => out.push({ rule: 'structured-data', level, message, pages: [page] });

  for (const p of contentPages(ctx)) {
    p.jsonLd.filter((b) => b.error).forEach((b) => add('error', p.path, `JSON-LD nie parsuje się: ${b.error}`));
    const nodes = graphNodes(p);
    if (!nodes.length) {
      if (isIndexable(p)) add('warn', p.path, 'strona w indeksie bez danych strukturalnych');
      continue;
    }

    const { refs, defs } = ids(nodes);
    for (const id of refs) if (!defs.has(id)) add('error', p.path, `referencja do węzła, którego nie ma w grafie: ${id}`);

    for (const node of nodes) {
      for (const type of types(node)) {
        const req = REQUIRED[type];
        if (!req) continue;
        const missing = (keys: string[]) => keys.filter((k) => node[k] === undefined || (Array.isArray(node[k]) && !(node[k] as unknown[]).length));
        const e = missing(req.error);
        const w = missing(req.warn ?? []);
        if (e.length) add('error', p.path, `${type} bez pól: ${e.join(', ')}`);
        if (w.length) add('warn', p.path, `${type} bez pól: ${w.join(', ')}`);
        if (type === 'Dataset') {
          const d = String(node.description ?? '').length;
          if (d && (d < 50 || d > 5000)) add('warn', p.path, `Dataset: opis ma ${d} znaków (Google: 50–5000)`);
        }
        if (type === 'BreadcrumbList') {
          const items = (node.itemListElement as Node[] | undefined) ?? [];
          if (items.some((i) => !i.name || !i.item || typeof i.position !== 'number')) add('error', p.path, 'BreadcrumbList: element bez name, item albo position');
        }
      }
    }
  }
  return out;
};
