/**
 * Zapowiedzi tekstów do dymka przy linku w treści (article/ProseLink): adres strony → dział, tytuł, liczba, opis.
 * Wszystko z frontmattera, nic do pisania ręcznie. Po polsku — z `articles`, także z wpisów bez treści, które
 * wskazują stronę narzędzia przez `href`. Po angielsku — z tłumaczeń, bez liczby, bo `stat` jest zapisany po polsku.
 * Strona spoza kolekcji (np. /postulat/) zapowiedzi nie ma — link jest tylko zakreślony.
 */
import { articleHref, getAllArticles } from '@/lib/content';
import { typo } from '@/lib/format';
import { SECTIONS_EN, enHref, getTranslations } from '@/i18n/translations';
import type { Locale } from '@/i18n/locales';

export interface Preview {
  /** dział: „Analiza”, „Dane”… */
  label: string;
  title: string;
  stat?: { value: string; unit: string };
  summary: string;
}

/** Adres bez kotwicy i parametrów, zawsze z końcowym „/” — jak `articleHref()` */
const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/\/?$/, '/');

async function load(locale: Locale): Promise<Map<string, Preview>> {
  if (locale === 'en') {
    const translations = await getTranslations();
    return new Map(translations
      .filter(({ article }) => !article.data.noindex)
      .map((t) => [enHref(t), { label: SECTIONS_EN[t.source.data.category].label, title: t.article.data.title, summary: t.article.data.summary }]));
  }
  const articles = await getAllArticles();
  return new Map(articles.flatMap((article): [string, Preview][] => {
    const href = articleHref(article);
    if (!href.startsWith('/')) return [];
    const { category, title, stat, summary } = article.data;
    return [[pathOf(href), {
      label: category,
      title: typo(title),
      stat: stat && { value: typo(stat.value), unit: typo(stat.unit) },
      summary: typo(summary),
    }]];
  }));
}

const cache = new Map<Locale, Promise<Map<string, Preview>>>();

/** Zapowiedź strony pod adresem `href` w języku strony z linkiem. Build liczy mapę raz na język, `astro dev` — za każdym razem. */
export async function previewOf(href: string, locale: Locale): Promise<Preview | undefined> {
  if (import.meta.env.DEV) return (await load(locale)).get(pathOf(href));
  if (!cache.has(locale)) cache.set(locale, load(locale));
  return (await cache.get(locale)!).get(pathOf(href));
}
