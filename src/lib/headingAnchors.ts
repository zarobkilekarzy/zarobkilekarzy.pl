// Anchory nagłówków — każdy h2/h3 w treści dostaje trwałe `id` i odnośnik „#",
// żeby dało się podlinkować konkretną sekcję (cytat w dyskusji, zgłoszenie
// sprostowania, odesłanie do jednej tezy zamiast do całej strony).
//
// Transformacja pracuje na gotowym HTML, a wpięta jest w `src/middleware.ts`.
// Przy `output: static` (bez adaptera) middleware Astro wykonuje się w dev na
// żądanie i w buildzie przy prerenderze — te same anchory lokalnie i na
// produkcji, bez kodu w przeglądarce i bez wywołań Functions (limit Workers).
//
// Zakres: tylko `<main>` — nagłówki nawigacji i stopki nie są sekcjami treści.
// Nagłówek z własnym `id` w źródle zachowuje je (to są adresy, które już
// obiecaliśmy na zewnątrz — np. /petycja#wyslij). `data-anchor="off"` wypisuje
// nagłówek z mechanizmu (powtarzalne karty, nagłówki tylko dla czytnika ekranu).

// Polskie znaki są poza [a-z0-9], więc bez mapy „wyceń świadczenia" dałoby
// „wyce-wiadczenia". NFD niżej zdejmie resztę diakrytyków (np. é), ale „ł" nie
// jest literą z akcentem — nie rozłoży się i musi być tutaj.
const PL: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

// Slug ucięty do sensownej długości — pełne zdanie w URL jest nie do przeklejenia.
const MAX_SLUG = 60;

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? whole;
    const n = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) return whole;
    return String.fromCodePoint(n);
  });
}

// Tekst nagłówka bez znaczników (nagłówki bywają z <span>/<a> w środku).
function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => PL[c])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length <= MAX_SLUG) return slug;
  // Tniemy na granicy słowa, ale nie do ogryzka — krótki człon wolimy urwać w środku.
  const cut = slug.slice(0, MAX_SLUG);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash >= 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

// `id` musi być unikalne w całym dokumencie — kolizje sprawdzamy też z idkami
// spoza nagłówków (formularze, kotwice w skryptach), nie tylko między sekcjami.
function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

// Elementy o treści surowej (RAWTEXT/RCDATA): „<h2" w środku to kod albo tekst,
// nie nagłówek. Przeskakujemy je w całości — tak samo jak strip-html-comments.
const TOKEN = /<(script|style|textarea|title)\b|<(h[23])\b([^>]*)>/gi;

export function addHeadingAnchors(html: string): { html: string; count: number } {
  const mainStart = html.indexOf('<main');
  const mainEnd = html.lastIndexOf('</main>');
  if (mainStart === -1 || mainEnd === -1 || mainEnd <= mainStart) return { html, count: 0 };

  const used = new Set<string>();
  for (const m of html.matchAll(/\sid=["']([^"']+)["']/g)) used.add(m[1]);

  const main = html.slice(mainStart, mainEnd);
  let out = '';
  let last = 0;
  let count = 0;
  let m: RegExpExecArray | null;

  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(main))) {
    const tag = (m[1] ?? m[2]).toLowerCase();
    const close = new RegExp(`</${tag}\\s*>`, 'gi');
    close.lastIndex = TOKEN.lastIndex;
    const closeTag = close.exec(main);
    if (!closeTag) break; // niedomknięty element — reszta zostaje nietknięta

    if (m[1]) {
      TOKEN.lastIndex = closeTag.index + closeTag[0].length;
      continue;
    }

    const attrs = m[3];
    const inner = main.slice(TOKEN.lastIndex, closeTag.index);
    const text = plainText(inner);
    // Dalej skanujemy od tagu zamykającego — `</h2>` nie pasuje do TOKEN.
    TOKEN.lastIndex = closeTag.index;

    // Pusty nagłówek, jawne wypisanie, albo anchor już jest (drugi przebieg).
    if (!text || /\bdata-anchor\s*=\s*["']off["']/i.test(attrs) || inner.includes('class="hanchor"')) {
      continue;
    }

    const own = attrs.match(/\sid=["']([^"']+)["']/);
    const id = own ? own[1] : uniqueId(slugify(text), used);
    if (!id) continue; // nagłówek bez liter/cyfr (np. sam myślnik) — bez anchora

    const open = own ? m[0] : `<${tag} id="${id}"${attrs}>`;
    const anchor =
      `<a class="hanchor" href="#${id}" aria-label="Odnośnik do sekcji: ${escapeAttr(text)}">#</a>`;
    out += main.slice(last, m.index) + open + inner + anchor;
    last = closeTag.index;
    count++;
  }

  if (!count) return { html, count: 0 };
  return { html: html.slice(0, mainStart) + out + main.slice(last) + html.slice(mainEnd), count };
}
