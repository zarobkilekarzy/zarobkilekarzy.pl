/**
 * HTML gotowej strony → Markdown dla agentów (modeli językowych). Bierze `<main>`, wycina interfejs
 * (nawigację, spis treści, udostępnianie, kontrolki, bloki „czytaj dalej”) i zamienia resztę na
 * Markdown z tabelami i przypisami GFM. Na górze frontmatter z tytułem, opisem i adresem kanonicznym.
 *
 * Reguły dotyczą komponentów, nie treści: nowy tekst nie wymaga zmian tutaj. Nowy element
 * interfejsu, który przecieka do Markdownu, łapie `suspicious()` — wtedy dopisz jego klasę do UI.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { select, selectAll } from 'hast-util-select';
import { toMdast } from 'hast-util-to-mdast';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';

/** Interfejs zamiast treści. Klasy z komponentów strony — przy zmianie komponentu sprawdź ostrzeżenia buildu. */
const UI = [
  'script', 'style', 'svg', 'noscript', 'template', 'button', 'form', 'fieldset', 'input', 'select',
  'dialog', 'canvas', 'video', 'iframe',
  // okruszki i menu, spis treści, „Pomóż nagłośnić”, „Widzisz błąd?”, numeracja „01.” w listach
  'nav', '.article__toc', 'zl-share', '.share', '.article__fix', '.num',
  // tekst tylko dla czytnika ekranu („otwiera się w nowej karcie”) i powrót z przypisu „↩”
  '.sr-only', 'a[data-footnote-backref]',
  // obrazki dekoracyjne (bez opisu)
  'img[alt=""]', 'img:not([alt])',
  '[aria-hidden="true"]', '[hidden]',
  // pod treścią: „Czytaj dalej” i stanowisko redakcji
  'main > section.section--space-both',
].join(', ');

/** Elementy inline, które CSS układa jak bloki — w tekście sklejają się z sąsiadem („240,30zł”). */
const INLINE = new Set(['span', 'a', 'small', 'strong', 'em', 'b', 'time', 'data', 'abbr']);

function prune<T extends Root | Element>(node: T, drop: Set<Element>): T {
  node.children = node.children
    .filter((c) => c.type !== 'comment' && !(c.type === 'element' && drop.has(c)))
    .map((c) => (c.type === 'element' ? prune(c, drop) : c)) as T['children'];
  return node;
}

const text = (n: RootContent | ElementContent): string =>
  n.type === 'text' ? n.value : n.type === 'element' ? n.children.map(text).join('') : '';

/** Pierwszy albo ostatni znak tekstu elementu (puste elementy, np. po wyciętej ikonie, się nie liczą) */
const edge = (n: ElementContent, end: boolean): string => {
  const t = text(n);
  return (end ? t.at(-1) : t[0]) ?? '';
};

/** Spacja między rodzeństwem bez białego znaku, gdy choć jedno to „stylowany” element inline albo oba to linki. */
function space(node: Element) {
  const styled = (n: ElementContent) =>
    n.type === 'element' && INLINE.has(n.tagName) && (n.tagName === 'small' || Object.keys(n.properties).length > 0);
  const kids = node.children;
  for (let i = kids.length - 1; i > 0; i--) {
    const [a, b] = [kids[i - 1], kids[i]];
    const links = a.type === 'element' && a.tagName === 'a' && b.type === 'element' && b.tagName === 'a';
    if (!(styled(a) || styled(b) || links)) continue;
    const [last, first] = [edge(a, true), edge(b, false)];
    if (!last || !first || /\s/.test(last) || /^[\s.,;:)]/.test(first)) continue;
    kids.splice(i, 0, { type: 'text', value: ' ' });
  }
  kids.forEach((c) => c.type === 'element' && space(c));
}

/** Markdown strony albo `null`, gdy strona nie ma treści (przekierowanie bez `<main>`, wyszukiwarka). */
export function htmlToMarkdown(html: string): string | null {
  const tree = fromHtml(html);
  const main = select('main', tree);
  if (!main) return null;

  const meta = (sel: string) => select(sel, tree)?.properties.content;
  const title = select('title', tree)?.children[0];
  const front = {
    title: title?.type === 'text' ? title.value : undefined,
    description: meta('meta[name="description"]'),
    url: select('link[rel="canonical"]', tree)?.properties.href,
  };

  prune(main, new Set(selectAll(UI, main)));
  space(main);

  const body = toMarkdown(toMdast({ type: 'root', children: [main] }), {
    extensions: [gfmToMarkdown()],
    bullet: '-',
    fences: true,
  })
    .replace(/\n{3,}/g, '\n\n')
    // przypisy w składni GFM: odnośnik [^n], definicja [^n]: … (lista pod nagłówkiem „Przypisy”)
    .replace(/\[(\d+)\]\(#user-content-fn-[^)]+\)/g, '[^$1]')
    .replace(/(\nPrzypisy[^\n]*\n)([\s\S]*?)(\n#|$)/, (_, head: string, list: string, tail: string) =>
      head + list.replace(/^(\d+)\. /gm, '[^$1]: ') + tail)
    .trim();
  if (!body) return null;

  const yaml = Object.entries(front)
    .filter(([, v]) => typeof v === 'string' && v)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${yaml.join('\n')}\n---\n\n${body}\n`;
}

/** Ślady interfejsu, który przeciekł do Markdownu: [opis, wzorzec]. Na dziś zero trafień w całym serwisie. */
const LEAKS: [string, RegExp][] = [
  ['sklejona liczba i „zł”', /\d(zł)\b/],
  ['sklejone linki', /\]\([^)\s]*\)\[(?!\^)/],
  ['powrót z przypisu', /↩/],
  ['pusty link', /\[\]\(/],
  ['obrazek bez opisu', /!\[\]\(/],
];

/** Pierwszy podejrzany fragment w pliku: [opis, wycinek] albo `null`. */
export function suspicious(markdown: string): [string, string] | null {
  for (const [label, re] of LEAKS) {
    const m = re.exec(markdown);
    if (m) return [label, markdown.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' ')];
  }
  return null;
}
