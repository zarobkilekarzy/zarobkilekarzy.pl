import type { APIRoute } from 'astro';
import { mainNav } from '@/data/navigation';
import { identity } from '@/data/seo/identity';
import { getFeedItems } from '@/lib/seo/feeds';

/**
 * llms.txt (llmstxt.org): spis serwisu dla modeli językowych — H1, streszczenie, sekcje z linkami.
 * Generowany z kolekcji, więc nie rozjedzie się z treścią. Pełną treść stron w Markdown dla agentów
 * daje Cloudflare (Markdown for Agents), więc llms-full.txt nie robimy.
 */
const SECTION_ORDER = ['Dane', 'Mechanizmy', 'Analizy'];

export const GET: APIRoute = async ({ site }) => {
  const url = (href: string) => new URL(href, site).href;
  const items = await getFeedItems();

  const sections = Map.groupBy(items, (i) => i.section);
  const order = [...SECTION_ORDER, ...[...sections.keys()].filter((s) => !SECTION_ORDER.includes(s)).sort()];
  const blocks = order
    .filter((name) => sections.has(name))
    .map((name) => {
      const list = sections.get(name)!.sort((a, b) => a.article.data.title.localeCompare(b.article.data.title, 'pl'));
      return [`## ${name}`, '', ...list.map((i) => `- [${i.article.data.title}](${url(i.href)}): ${i.article.data.summary}`)].join('\n');
    });

  const hubs = mainNav.filter((link) => link.href !== '/').map((link) => `- [${link.label}](${url(link.href)})`);

  const body = [
    `# ${identity.name}`,
    '',
    `> ${identity.description}`,
    '',
    'Zasady: każda liczba ma ogólnodostępne źródło podane przy tekście; opisujemy mechanizmy systemu, nie konkretne osoby. Treść na licencji CC BY 4.0.',
    '',
    ...blocks.flatMap((b) => [b, '']),
    '## Działy serwisu',
    '',
    ...hubs,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
