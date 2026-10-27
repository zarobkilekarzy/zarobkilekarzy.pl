/**
 * Analiza tekstu wyszukiwarki, wspólna dla budowania indeksu (build.ts) i przeglądarki (engine.ts).
 * Dzięki temu treść i zapytanie są zawsze dzielone na słowa w ten sam sposób.
 */
import { fold } from '@/lib/format';
import type { Locale } from '@/i18n/locales';

/** Słowo: ciąg liter (także ze znakami diakrytycznymi) i cyfr. */
const WORD = /[\p{L}\p{M}\p{N}]+/gu;

/** Słowa zbyt częste, by coś znaczyły w wyszukiwaniu (bez polskich znaków: „się” → „sie”). */
const STOPWORDS: Record<Locale, Set<string>> = {
  pl: new Set(
    'aby albo ale ani bo by byc co czy dla do gdy ich jak jako jego jej jest juz ma na nad nie od oraz po pod przez przy sa sie ta tak te tego tej ten to tu tym we za ze'.split(' '),
  ),
  // indeks wersji angielskiej (lib/search/build-en.ts)
  en: new Set(
    'an and are as at be but by can for from has have in is it its not of on or than that the their there these this to was were which who will with'.split(' '),
  ),
};

/** Końcówki fleksyjne rzeczowników i przymiotników (bez polskich znaków), od najdłuższej. */
const SUFFIXES = [
  'owego', 'owych', 'owymi', 'iami', 'iach', 'iego', 'iemu',
  'ami', 'ach', 'ego', 'emu', 'ych', 'ymi', 'imi', 'ich', 'iej', 'iem', 'owi', 'owa', 'owe', 'owy',
  'ow', 'om', 'em', 'ej', 'ym', 'im', 'ie', 'ia', 'iu', 'ii',
  'a', 'e', 'i', 'o', 'u', 'y',
].sort((a, b) => b.length - a.length);

/**
 * Końcówki angielskie: liczba mnoga i najczęstsze formy czasownika. Bez „-s” po „s”, „u”, „i”
 * („access”, „status”, „analysis”), żeby nie ucinać słów, które nie są liczbą mnogą.
 */
const SUFFIXES_EN = ['ies', 'ing', 'ed', 's'];
const KEEP_S_EN = /(ss|us|is)$/;

/** Najkrótszy rdzeń — krótkich słów („lek”, „nfz”) nie skracamy. */
const MIN_ROOT = 3;

/** Słowa tekstu do indeksu i zapytań: małe litery bez polskich znaków, bez jednoliterowych i pomijalnych. */
export const words = (text: string, locale: Locale = 'pl'): string[] =>
  (fold(text).match(WORD) ?? []).filter((word) => word.length > 1 && !STOPWORDS[locale].has(word));

/**
 * Rdzeń słowa (lekki stemmer): odcina najdłuższą pasującą końcówkę.
 * „lekarzami” → „lekarz”, „szpitali” → „szpital”, „zadluzenie” → „zadluzen”;
 * po angielsku „hospitals” → „hospital”, „policies” → „polic”, „limited” → „limit”.
 */
export function stem(word: string, locale: Locale = 'pl'): string {
  const fits = (s: string) => word.endsWith(s) && word.length - s.length >= MIN_ROOT;
  const suffix = locale === 'en' ? SUFFIXES_EN.find((s) => fits(s) && !(s === 's' && KEEP_S_EN.test(word))) : SUFFIXES.find(fits);
  return suffix ? word.slice(0, -suffix.length) : word;
}

/** Słowo pasuje, gdy zaczyna się od rdzenia słowa zapytania — tak samo jak w indeksie. */
const matchesAny = (word: string, roots: string[]) => {
  const folded = fold(word);
  return roots.some((root) => folded.startsWith(root));
};

export interface TextPart {
  text: string;
  match: boolean;
}

/** Tekst pocięty na fragmenty z zaznaczeniem słów pasujących do zapytania (do podświetlenia). */
export function markMatches(text: string, roots: string[]): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const { 0: word, index } of text.matchAll(WORD)) {
    if (!matchesAny(word, roots)) continue;
    if (index > last) parts.push({ text: text.slice(last, index), match: false });
    parts.push({ text: word, match: true });
    last = index + word.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts;
}

export const hasMatch = (text: string, roots: string[]) =>
  [...text.matchAll(WORD)].some(([word]) => matchesAny(word, roots));
