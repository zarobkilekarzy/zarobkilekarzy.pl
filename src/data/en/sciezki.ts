/**
 * Wiersze tekstów na angielskich stronach-ścieżkach: id polskiego artykułu → pozycja spisu z tłumaczenia (tytuł, lead, liczba).
 * Materiał bez tłumaczenia dostaje „(in Polish)” i własny opis (`polish`, `label`, `text`).
 * Dział artykułu z własnym opisem traci liczbę z karty, bo ta dotyczy całego tekstu.
 */
import { articleHref, getArticle } from '@/lib/content';
import type { Entry } from '@/i18n/entries';
import { ui } from '@/i18n/ui';
import { englishEntries } from '@/data/en/spis';

export interface PathLinkEn {
  /** id polskiego artykułu; bez niego potrzebne `href`, `label` i `text` */
  ref?: string;
  href?: string;
  label?: string;
  text?: string;
  anchor?: string;
  /** strona tylko po polsku */
  polish?: boolean;
}

export async function pathEntryResolver() {
  const toEntry = await englishEntries();
  return async (link: PathLinkEn): Promise<Entry> => {
    const title = (label: string) => `${label}${link.polish ? ui.en.inPolish : ''}`;
    const hreflang = link.polish ? 'pl' : undefined;
    if (!link.ref) return { id: link.href!, href: link.href!, hreflang, title: title(link.label!), summary: link.text!, category: 'Analiza', label: 'Analysis' };

    const article = await getArticle(link.ref);
    if (link.polish) return { id: article.id, href: articleHref(article), hreflang, title: title(link.label!), summary: link.text!, category: article.data.category, label: 'Tool' };

    const entry = toEntry(article);
    if (!entry) throw new Error(`[en] ścieżka: materiał „${link.ref}” nie ma pozycji po angielsku`);
    const section = link.text ? { summary: link.text, stat: undefined } : {};
    return { ...entry, ...section, href: `${entry.href}${link.anchor ?? ''}`, title: link.label ?? entry.title };
  };
}
