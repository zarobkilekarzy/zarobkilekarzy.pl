/**
 * Kontrola tłumaczeń po buildzie (spec wersji EN, §9): każda strona /en/ jest porównywana z polskim oryginałem na
 * gotowym HTML — tym, co widzi czytelnik. Parę wskazuje nota o tłumaczeniu (`data-translation-of` w
 * article/TranslationNote, adres ze stempla tłumaczenia), więc kontrola obejmuje też strony poza indeksem;
 * strona EN bez noty to uwaga. Wynik to ostrzeżenia, nigdy błąd: wersja angielska nie może zatrzymać polskiej
 * publikacji.
 *
 * Porównywana jest treść: blok `.prose` artykułu i wpisu (bez list „Powiązane”, które po angielsku obejmują tylko
 * tłumaczenia), a na stronach spoza kolekcji cały <main>. Spisy działów i strona główna (HUBS) mają z założenia
 * inną zawartość, więc nie są porównywane. Fragment, który po angielsku celowo się różni (kalendarz zmian tylko po
 * polsku, demo pseudonimu z przetłumaczonym kluczem, przeliczenia obcych walut na złote), ma atrybut
 * `data-i18n-skip` i jest pomijany.
 *
 * Reguły:
 * - liczby: każda wartość z polskiego tekstu występuje w angielskim. Zapis jest normalizowany („1 358” = „1,358”,
 *   „4,2” = „4.2”), skale rozwijane, także pisane słowem („132,7 tys.” = „132,700”, „10 tysięcy” = „10,000”, „1,6 mln”
 *   = „1.6 million”, „217 mld” = „PLN 217 billion”), a ułamki i liczby od 10 000 — z dokładnością, z jaką liczba jest zapisana po angielsku („217.4 billion”
 *   pokrywa „217 388 948 000 zł”, „274,287” nie pokrywa „274 278”). Z daty „22.10.2026”
 *   liczy się tylko rok (po angielsku data bywa zapisana słownie albo opisowo). Pomijamy liczby całkowite poniżej 10 (po
 *   angielsku małe liczby pisze się słowami), dekady („lat 80.”), numery z kropką („2603.08448”), identyfikatory
 *   zlepione z literami albo łącznikiem („MZ-03”) i rozmiary plików,
 * - przypisy: ten sam zbiór identyfikatorów,
 * - źródła: ten sam zbiór linków zewnętrznych,
 * - struktura: tyle samo nagłówków h2, wykresów (figure) i tabel,
 * - wyciek polskiego: słowa z polskimi literami pisane małą literą w zwykłym zdaniu — poza lang="pl", przypisami
 *   i listami źródeł oraz poza objaśnieniami (kursywa, cudzysłów, nawias); nazwy własne są w porządku,
 * - terminy: zakazane warianty (TERMS).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ELEMENT_NODE, TEXT_NODE, parse, type Node } from 'ultrahtml';

export type QaRule = 'pair' | 'numbers' | 'footnotes' | 'links' | 'structure' | 'polish' | 'terms';

export interface QaIssue {
  rule: QaRule;
  detail: string;
}

export interface QaPage {
  en: string;
  /** adres polskiego oryginału; pusty, gdy strona EN nie ma noty o tłumaczeniu */
  pl: string;
  issues: QaIssue[];
}

/** Zakazane warianty terminów (glosariusz specu): wzorzec → co pisać zamiast. */
const TERMS: [RegExp, string][] = [[/\bNHF\b/, 'NFZ (National Health Fund)']];

/** Spisy i strony działów: inna zawartość z założenia (tylko przetłumaczone materiały). */
const HUBS = new Set(['/en/', '/en/analysis/', '/en/data/', '/en/mechanisms/', '/en/news/', '/en/search/']);

/**
 * Liczby z polskiego oryginału, których po angielsku świadomie nie ma, a których nie da się oznaczyć
 * `data-i18n-skip` (tekst w propsie komponentu, bez znaczników): strona → wartości. Pierwszy wybór to zawsze atrybut.
 */
const KNOWN_MISSING: Record<string, number[]> = {
  // przeliczenie na złote w opisie kafelka StatRow („(ok. 21,7 tys. zł)”) — wersja angielska podaje tylko TWD
  '/en/analysis/taiwan-healthcare-transparency/': [21_700],
};

/** Słowa z polskimi literami, które w angielskim tekście są w porządku. */
const ALLOWED = new Set(['złoty', 'złotys', 'e-Doręczenia']);

const POLISH_LETTERS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
/** Polska nazwa objaśniona po angielsku: kursywą, w cudzysłowie albo w nawiasie — to nie wyciek. */
const GLOSS_TAGS = new Set(['em', 'i', 'cite', 'q']);
const GLOSSES = /“[^”]*”|„[^”]*”|"[^"]*"|\([^()]*\)/g;
const SKIP_TAGS = new Set(['script', 'style', 'template', 'noscript']);
const SHARE_OR_OWN = /(?:x\.com\/intent|twitter\.com\/intent|facebook\.com\/sharer|zarobkilekarzy\.pl)/;

const classes = (n: Node): string[] => (n.attributes?.class ?? '').split(/\s+/);

/** Treść strony do porównania: tekst, tekst poza polskimi wstawkami i przypisami, linki, przypisy, struktura. */
function extract(html: string) {
  let main: Node | undefined;
  let prose: Node | undefined;
  const find = (n: Node) => {
    if (prose) return;
    if (n.type === ELEMENT_NODE && n.name === 'main') main ??= n;
    if (n.type === ELEMENT_NODE && classes(n).includes('prose')) prose = n;
    else n.children?.forEach(find);
  };
  find(parse(html));

  const text: string[] = [];
  const checked: string[] = [];
  const links = new Set<string>();
  const footnotes = new Set<string>();
  const counts = { h2: 0, figure: 0, table: 0 };
  const walk = (n: Node, skipLeak: boolean) => {
    if (n.type === TEXT_NODE) {
      text.push(n.value);
      if (!skipLeak) checked.push(n.value);
      return;
    }
    if (n.type !== ELEMENT_NODE) {
      n.children?.forEach((c: Node) => walk(c, skipLeak));
      return;
    }
    if (SKIP_TAGS.has(n.name) || 'data-i18n-skip' in (n.attributes ?? {})) return;
    const a = n.attributes ?? {};
    if (n.name in counts) counts[n.name as keyof typeof counts]++;
    const href = (a.href ?? '').replace(/&amp;/g, '&');
    if (n.name === 'a' && /^https?:\/\//.test(href) && !SHARE_OR_OWN.test(href)) links.add(href);
    const footnote = typeof a.id === 'string' && /^user-content-fn-/.test(a.id);
    if (footnote) footnotes.add(a.id);
    // polskie wstawki (lang="pl"), przypisy cytujące polskie tytuły i objaśnienia kursywą — poza kontrolą wycieku
    const leakFree = skipLeak || /^pl\b/.test(a.lang ?? '') || footnote || classes(n).some((c) => /^(?:footnotes|sources)/.test(c)) || GLOSS_TAGS.has(n.name);
    n.children?.forEach((c: Node) => walk(c, leakFree));
  };
  const content = prose ?? main;
  if (content) walk(content, false);
  // twarda spacja zostaje (dzieli grupy tysięcy); węzły łączy „ | ”, żeby sąsiednie komórki się nie zlewały
  const decode = (s: string) => s.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'");
  return { text: decode(text.join(' | ')), checked: decode(checked.join(' | ')), links, footnotes, counts };
}

const SPACE = '[ \\u00a0\\u202f]';
/** Skala po polsku: skrót albo słowo w dowolnej formie („tysięcy”, „miliony”, „miliardów”). */
const SCALE_WORD_PL = 'tys\\.?|tysi[ąę]c\\p{L}*|mln|milion\\p{L}*|mld|miliard\\p{L}*';
const scalePl = (word: string) => (/^(?:mld|miliard)/.test(word) ? 1e9 : /^(?:mln|milion)/.test(word) ? 1e6 : 1e3);
const SCALE_EN: Record<string, number> = { thousand: 1e3, k: 1e3, million: 1e6, m: 1e6, mn: 1e6, billion: 1e9, bn: 1e9 };

/** Polskie liczby z tekstu: wartość (skala rozwinięta) i sama liczba („75,1 mld” → 75,1 mld i 75,1 — na wykresie z jednostką w nagłówku). */
function numbersPl(text: string): { value: number; raw: number }[] {
  const t = text
    // daty: tylko samodzielne („10.6145/jme…” w DOI to nie miesiąc i rok)
    .replace(/(?<![\d.])\d{1,2}\.\d{1,2}\.(\d{4})(?![\d./])/g, '$1')
    .replace(/(?<![\d.])\d{1,2}\.(\d{4})(?![\d./])/g, '$1')
    .replace(/\d+(?:\.\d+)+/g, ' ')
    // dekady („lat 80. i 90.”) — po angielsku „the 1980s”
    .replace(/\blat(?:ach)?\s[1-9]0\.(?:\s(?:i|a|do)\s[1-9]0\.)?/g, ' ')
    // skala w osobnym elemencie („193 | tys. zł” na kartach) i zakres z jedną skalą („3,3 do 8,3 tys.”, „10–15 tys.”)
    .replace(new RegExp(`(\\d) \\| (${SCALE_WORD_PL})(?!\\p{L})`, 'gu'), '$1 $2')
    .replace(new RegExp(`(\\d+(?:,\\d+)?)(${SPACE}?(?:–|-|do|a)${SPACE}?\\d+(?:,\\d+)?\\+?${SPACE}?(${SCALE_WORD_PL})(?!\\p{L}))`, 'gu'), '$1 $3 | $2');
  const re = new RegExp(`(?<![\\p{L}\\d-])(\\d{1,3}(?:${SPACE}\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?)(?![\\p{L}\\d…])(?:${SPACE}?(${SCALE_WORD_PL})(?!\\p{L})|${SPACE}?([kKM]B)\\b)?`, 'gu');
  const out: { value: number; raw: number }[] = [];
  for (const m of t.matchAll(re)) {
    if (m[3]) continue; // rozmiar pliku
    const n = Number(m[1].replace(new RegExp(SPACE, 'g'), '').replace(',', '.'));
    out.push({ value: m[2] ? n * scalePl(m[2]) : n, raw: n });
  }
  return out;
}

/**
 * Angielskie liczby z tekstu jako wartości; każda także bez skali (zapis „PLN 1.6 million” i „1.6”). Grupy po spacji
 * (telefony „800 190 590”) tylko z pierwszą grupą do 3 cyfr — „in 2025 274,278” to dwie liczby.
 */
function numbersEn(text: string): EnNumber[] {
  text = text.replace(/\+48[\s\u00a0]/g, ' '); // numer kierunkowy przed telefonem
  const re = new RegExp(`(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|(?<![\\d.,])\\d{1,3}(?:${SPACE}\\d{3})+(?![\\d,.])|\\d+(?:\\.\\d+)?)(?:${SPACE}?(thousand|million|billion|bn|mn|m|k)\\b)?`, 'g');
  const out: EnNumber[] = [];
  for (const m of text.matchAll(re)) {
    const digits = m[1].replace(new RegExp(`[,${SPACE.slice(1, -1)}]`, 'g'), '');
    const n = Number(digits);
    // cyfry znaczące zapisu: „217.4” → 4, „274,287” → 6, „274,000” → 3 (zera na końcu liczby całkowitej nie liczą się)
    const sig = (digits.includes('.') ? digits.replace('.', '') : digits.replace(/0+$/, '')).replace(/^0+/, '').length || 1;
    out.push({ value: n, sig });
    if (m[2]) out.push({ value: n * SCALE_EN[m[2]], sig });
  }
  return out;
}

interface EnNumber {
  value: number;
  /** cyfry znaczące w zapisie — do porównania z zaokrągloną wartością polską */
  sig: number;
}

/** Wartość z polskiego tekstu, którą sprawdzamy: z ułamkiem albo co najmniej 10. */
const significant = (n: number) => !Number.isInteger(n) || n >= 10;

/** Czy angielski tekst ma tę wartość: dokładnie, a ułamki i duże liczby z dokładnością do zaokrąglenia. */
function present(v: number, en: Set<number>, all: EnNumber[]): boolean {
  if (en.has(v)) return true;
  if (Number.isInteger(v) && v < 10_000) return false;
  // zaokrąglenie tylko do tylu cyfr, ile ma zapis angielski: „217.4 billion” = 217 388 948 000, ale „274,287” ≠ 274 278
  // (co najmniej 3 cyfry — „270,000” na osi wykresu nie pokrywa wszystkiego od 265 do 275 tys.)
  return all.some((e) => e.sig >= 3 && Number(v.toPrecision(e.sig)) === Number(e.value.toPrecision(e.sig)));
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(6))));

function compare(pl: ReturnType<typeof extract>, en: ReturnType<typeof extract>, knownMissing: number[] = []): QaIssue[] {
  const issues: QaIssue[] = [];
  const enValues = numbersEn(en.text);
  const enSet = new Set([...enValues.map((e) => e.value), ...knownMissing]);
  const missing = [...new Set(numbersPl(pl.text).filter(({ value, raw }) => significant(value) && !present(value, enSet, enValues) && !(raw !== value && present(raw, enSet, enValues))).map((n) => n.value))];
  if (missing.length) issues.push({ rule: 'numbers', detail: missing.map(fmt).join(', ') });

  const fnMissing = [...pl.footnotes].filter((f) => !en.footnotes.has(f));
  const fnExtra = [...en.footnotes].filter((f) => !pl.footnotes.has(f));
  if (fnMissing.length || fnExtra.length) {
    issues.push({ rule: 'footnotes', detail: [fnMissing.length && `brak: ${fnMissing.join(', ')}`, fnExtra.length && `nadmiarowe: ${fnExtra.join(', ')}`].filter(Boolean).join('; ') });
  }

  // licencja CC ma po angielsku stronę z tłumaczeniem (deed.en zamiast deed.pl)
  const linkMissing = [...pl.links].filter((l) => !en.links.has(l) && !/creativecommons\.org/.test(l));
  if (linkMissing.length) issues.push({ rule: 'links', detail: linkMissing.join(' ') });

  const diff = (Object.keys(pl.counts) as (keyof typeof pl.counts)[]).filter((k) => pl.counts[k] !== en.counts[k]);
  if (diff.length) issues.push({ rule: 'structure', detail: diff.map((k) => `${k}: PL ${pl.counts[k]}, EN ${en.counts[k]}`).join('; ') });

  const words = [...new Set(en.checked.replace(GLOSSES, ' ').split(/[^\p{L}-]+/u).filter((w) => POLISH_LETTERS.test(w) && /^\p{Ll}/u.test(w) && !ALLOWED.has(w)))];
  if (words.length) issues.push({ rule: 'polish', detail: words.join(', ') });

  for (const [re, fix] of TERMS) if (re.test(en.checked)) issues.push({ rule: 'terms', detail: `${re.source} → ${fix}` });
  return issues;
}

async function* htmlFiles(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name === 'index.html') yield p;
  }
}

/** Wszystkie strony /en/ w katalogu builda (`outDir` — ścieżka katalogu) z parami PL. */
export async function checkTranslations(outDir: string): Promise<QaPage[]> {
  const pages: QaPage[] = [];
  for await (const file of htmlFiles(path.join(outDir, 'en'))) {
    const enPath = `/${path.relative(outDir, path.dirname(file))}/`;
    if (HUBS.has(enPath)) continue;
    const html = await readFile(file, 'utf8');
    // adres oryginału z noty o tłumaczeniu; atrybuty w dowolnej kolejności
    const plPath = html.match(/<aside\b[^>]*\sdata-translation-of="([^"]+)"/)?.[1];
    if (!plPath) {
      pages.push({ en: enPath, pl: '', issues: [{ rule: 'pair', detail: 'brak noty o tłumaczeniu (data-translation-of) — strona nie jest porównywana' }] });
      continue;
    }
    const plHtml = await readFile(path.join(outDir, plPath, 'index.html'), 'utf8').catch(() => undefined);
    pages.push({
      en: enPath,
      pl: plPath,
      issues: plHtml
        ? compare(extract(plHtml), extract(html), KNOWN_MISSING[enPath])
        : [{ rule: 'pair', detail: `brak polskiej strony ${plPath} w buildzie` }],
    });
  }
  return pages.sort((a, b) => a.en.localeCompare(b.en));
}
