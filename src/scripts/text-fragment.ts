/**
 * Link do zaznaczonego fragmentu w standardzie Text Fragments: #sekcja:~:text=początek,koniec
 * Chrome, Edge, Safari (16.1+) i Firefox (131+) same przewijają do tekstu i go zaznaczają — po stronie
 * odbiorcy nie działa żaden nasz skrypt; wygląd zaznaczenia nadaje ::target-text w styles/base.css.
 * Gdy tekst strony się zmieni, przeglądarka pomija dyrektywę i przewija do #sekcji (scripts/anchors.ts).
 *
 * Generator naśladuje dopasowanie przeglądarki: tekst dzielony na bloki (akapit, punkt listy, komórka),
 * bez rozróżniania wielkości liter i polskich znaków. Krótkie zaznaczenie trafia do linku w całości,
 * dłuższe jako kilka słów z początku i końca. Kontekst (prefiks-, -sufiks) dokładamy tylko wtedy, gdy
 * te same słowa padły na stronie wcześniej — inaczej przeglądarka podkreśliłaby pierwsze wystąpienie.
 * Typowy przypadek: zaznaczenie od nagłówka, który powtarza się w spisie treści — wtedy prefiks pochodzi
 * z bloku przed nagłówkiem (standard pozwala, by prefiks i sufiks stały w sąsiednim bloku).
 */
import { fold } from '@/lib/format';

const WORD = /[\p{L}\p{N}]/u;
const SPACE = /\s/;
/** do tylu słów zaznaczenie w jednym bloku idzie do linku w całości */
const EXACT_MAX_WORDS = 8;
/** dłuższe: tyle słów z początku i z końca (kolejne próby, gdy krótsze są niejednoznaczne) */
const EDGE_WORDS = [3, 5, 8];
const CONTEXT_MAX_WORDS = 5;
/** węzły, których przeglądarka nie przeszukuje */
const SKIP = 'script, style, noscript, template, svg, [hidden]:not([hidden="until-found"])';

/** pozycja w surowym tekście: numer bloku i indeks w nim */
interface Pos { b: number; i: number }
interface Query { prefix?: string; start: string; end?: string; suffix?: string }

const squash = (s: string) => s.replace(/\s+/g, ' ');
const words = (s: string) => squash(s).trim().split(' ').filter(Boolean);

/** Tekst korzenia podzielony na bloki + położenie każdego węzła tekstowego w swoim bloku. */
function collect(root: Element) {
  const blocks: string[] = [];
  const texts: { node: Text; b: number; at: number }[] = [];
  const blockOf = new Map<Element, Element>();
  const findBlock = (el: Element) => {
    let block = blockOf.get(el);
    if (!block) {
      block = el;
      while (block !== root && /^(inline|contents)/.test(getComputedStyle(block).display)) block = block.parentElement!;
      blockOf.set(el, block);
    }
    return block;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n instanceof Element && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let current: Element | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n instanceof Element) {
      if (n.localName === 'br' && blocks.length) blocks[blocks.length - 1] += '\n';
      continue;
    }
    const node = n as Text;
    const block = findBlock(node.parentElement!);
    if (block !== current) {
      blocks.push('');
      current = block;
    }
    const b = blocks.length - 1;
    texts.push({ node, b, at: blocks[b].length });
    blocks[b] += node.data;
  }
  return { blocks, texts };
}

/** Granica zaznaczenia → pozycja w bloku. Granica w elemencie (np. potrójne kliknięcie) → najbliższy tekst do środka. */
function toPos(texts: ReturnType<typeof collect>['texts'], node: Node, offset: number, edge: 'start' | 'end'): Pos | null {
  const own = texts.find((t) => t.node === node);
  if (own) return { b: own.b, i: own.at + offset };
  const point = document.createRange();
  point.setStart(node, offset);
  const t = edge === 'start'
    ? texts.find((x) => point.comparePoint(x.node, 0) >= 0)
    : texts.findLast((x) => point.comparePoint(x.node, x.node.length) <= 0);
  if (!t) return null;
  return { b: t.b, i: edge === 'start' ? t.at : t.at + t.node.length };
}

/** Początek: bez spacji na brzegu i od początku słowa (przeglądarka dopasowuje tylko całe słowa). */
function snapStart(blocks: string[], { b, i }: Pos): Pos | null {
  for (; b < blocks.length; b++, i = 0) {
    while (i < blocks[b].length && SPACE.test(blocks[b][i])) i++;
    if (i < blocks[b].length) break;
  }
  if (b >= blocks.length) return null;
  const s = blocks[b];
  while (i > 0 && WORD.test(s[i - 1]) && WORD.test(s[i])) i--;
  return { b, i };
}

function snapEnd(blocks: string[], { b, i }: Pos): Pos | null {
  for (; b >= 0; b--, i = b >= 0 ? blocks[b].length : 0) {
    while (i > 0 && SPACE.test(blocks[b][i - 1])) i--;
    if (i > 0) break;
  }
  if (b < 0) return null;
  const s = blocks[b];
  while (i < s.length && WORD.test(s[i - 1]) && WORD.test(s[i])) i++;
  return { b, i };
}

function occurrences(s: string, t: string, from = 0): number[] {
  const out: number[] = [];
  for (let k = s.indexOf(t, from); k >= 0; k = s.indexOf(t, k + 1)) out.push(k);
  return out;
}

/** Indeks pierwszego znaku po białych znakach od k — także przez granicę bloku, jak w standardzie. */
const skipSpace = (s: string, k: number) => {
  while (k < s.length && SPACE.test(s[k])) k++;
  return k;
};

/**
 * Gdzie przeglądarka znajdzie dyrektywę: pierwsze dopasowanie w kolejności dokumentu.
 * `hay` to bloki złączone znakiem nowej linii — słowa terminów są rozdzielone spacjami, więc żaden
 * termin nie przejdzie przez granicę bloku, a prefiks i sufiks mogą stać w bloku obok (np. przed nagłówkiem).
 */
function locate(hay: string, q: Query): [number, number] | null {
  const starts = q.prefix
    ? occurrences(hay, q.prefix).map((k) => skipSpace(hay, k + q.prefix!.length)).filter((k) => hay.startsWith(q.start, k))
    : occurrences(hay, q.start);
  const suffixAt = (k: number) => !q.suffix || hay.startsWith(q.suffix, skipSpace(hay, k));
  for (const k of starts) {
    const startEnd = k + q.start.length;
    if (!q.end) {
      if (suffixAt(startEnd)) return [k, startEnd];
      continue;
    }
    const hit = occurrences(hay, q.end, startEnd).map((x) => x + q.end!.length).find(suffixAt);
    if (hit !== undefined) return [k, hit];
  }
  return null;
}

const enc = (t: string) => encodeURIComponent(t).replace(/-/g, '%2D');

/** Dyrektywa „:~:text=…” dla bieżącego zaznaczenia w obrębie `root` albo null (puste, sama interpunkcja). */
export function textDirective(selection: Selection, root: Element): string | null {
  if (!selection.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const { blocks, texts } = collect(root);
  const rawStart = toPos(texts, range.startContainer, range.startOffset, 'start');
  const rawEnd = toPos(texts, range.endContainer, range.endOffset, 'end');
  const s = rawStart && snapStart(blocks, rawStart);
  const e = rawEnd && snapEnd(blocks, rawEnd);
  if (!s || !e || s.b > e.b || (s.b === e.b && s.i >= e.i)) return null;

  const oneBlock = s.b === e.b;
  const first = words(oneBlock ? blocks[s.b].slice(s.i, e.i) : blocks[s.b].slice(s.i));
  const last = oneBlock ? first : words(blocks[e.b].slice(0, e.i));
  if (!first.some((w) => WORD.test(w))) return null;
  // Kontekst z tego samego bloku, a gdy zaznaczenie zaczyna (kończy) blok — z najbliższego bloku z tekstem
  const nearest = (from: number, step: 1 | -1) => {
    for (let b = from + step; b >= 0 && b < blocks.length; b += step) {
      const w = words(blocks[b]);
      if (w.length) return w;
    }
    return [];
  };
  const ownBefore = words(blocks[s.b].slice(0, s.i));
  const ownAfter = words(blocks[e.b].slice(e.i));
  const before = (ownBefore.length ? ownBefore : nearest(s.b, -1)).slice(-CONTEXT_MAX_WORDS);
  const after = (ownAfter.length ? ownAfter : nearest(e.b, 1)).slice(0, CONTEXT_MAX_WORDS);

  // Kandydaci od najkrótszego: same słowa → z prefiksem → z prefiksem i sufiksem
  const bases: Query[] = oneBlock && first.length <= EXACT_MAX_WORDS
    ? [{ start: first.join(' ') }]
    : EDGE_WORDS
        .map((n) => (oneBlock ? Math.min(n, Math.floor(first.length / 2)) : n))
        .filter((n, k, all) => all.indexOf(n) === k)
        .map((n) => ({ start: first.slice(0, n).join(' '), end: last.slice(-n).join(' ') }));
  const prefixes = Array.from({ length: before.length + 1 }, (_, p) => before.slice(before.length - p).join(' '));
  const suffixes = Array.from({ length: after.length }, (_, k) => after.slice(0, k + 1).join(' '));
  const candidates: Query[] = bases.flatMap((base) => [
    ...prefixes.map((prefix) => ({ ...base, prefix: prefix || undefined })),
    ...suffixes.map((suffix) => ({ ...base, prefix: prefixes.at(-1) || undefined, suffix })),
  ]);

  // Pozycje zaznaczenia w tekście znormalizowanym (spacje zwinięte, bloki złączone \n) — w nim szukamy jak przeglądarka
  const folded = blocks.map((raw) => fold(squash(raw)));
  const offset: number[] = [];
  folded.reduce((at, block, b) => (offset[b] = at) + block.length + 1, 0);
  const hay = folded.join('\n');
  const from = offset[s.b] + squash(blocks[s.b].slice(0, s.i)).length;
  const to = offset[e.b] + squash(blocks[e.b].slice(0, e.i)).length;
  const foldQuery = (q: Query): Query => ({
    start: fold(q.start),
    ...(q.prefix && { prefix: fold(q.prefix) }),
    ...(q.end && { end: fold(q.end) }),
    ...(q.suffix && { suffix: fold(q.suffix) }),
  });
  const fits = (q: Query) => {
    const hit = locate(hay, foldQuery(q));
    return hit !== null && hit[0] === from && hit[1] === to;
  };
  // Nic nie pasuje jednoznacznie (tekst powtórzony razem z kontekstem): najdłuższy kandydat. Gdyby przeglądarka
  // go nie dopasowała, przewinie do #sekcji — to lepsze niż podkreślenie od wcześniejszego wystąpienia.
  const q = candidates.find(fits) ?? candidates[candidates.length - 1];

  const parts = [q.prefix && `${enc(q.prefix)}-`, enc(q.start), q.end && enc(q.end), q.suffix && `-${enc(q.suffix)}`];
  return `:~:text=${parts.filter(Boolean).join(',')}`;
}
