/**
 * Typy domenowe współdzielone przez dane (src/data, kolekcje) i komponenty.
 * Komponenty zależą od tych kształtów, a nie od konkretnych plików z danymi.
 */
import type { ImageMetadata } from 'astro';
import type { IconName } from './icons';

/** Czy liczba jest dokładna, czy szacunkowa — każda dana w serwisie ma taką etykietę. */
export type Accuracy = 'exact' | 'est';

export const CATEGORIES = ['Analiza', 'Dane', 'Projekt ustawy', 'Przewodnik', 'Narzędzie', 'Mechanizm'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Działy stron-indeksów, w kolejności wyświetlania. Dział wskazuje stronę, na której
 * materiał jest wymieniony (niezależnie od kategorii), więc id są unikalne w całym serwisie.
 */
export const DATA_TOPICS = ['wynagrodzenia', 'finanse', 'zawod', 'kadry'] as const;
export const MECHANISM_TOPICS = ['jawnosc', 'platnik', 'zatrudnienie', 'dostep'] as const;
export const ANALYSIS_TOPICS = ['rejestr', 'pieniadz', 'ksztalcenie', 'porownania'] as const;
export const TOPICS = [...DATA_TOPICS, ...MECHANISM_TOPICS, ...ANALYSIS_TOPICS] as const;
export type TopicId = (typeof TOPICS)[number];

/** Co czytelnik dostaje w zestawieniu — etykieta na liście. */
export const DATA_FORMATS = ['Wykresy', 'Tabela', 'Ranking', 'Wyszukiwarka', 'Infografika', 'Test', 'Porównanie'] as const;
export type DataFormat = (typeof DATA_FORMATS)[number];

/** Opis działu strony-indeksu. */
export interface TopicInfo {
  label: string;
  lead: string;
}

/** Dział pokazany jako pytanie czytelnika: krótka odpowiedź i zdjęcie (np. /mechanizmy/). */
export interface QuestionTopic extends TopicInfo {
  question: string;
  /** odpowiedź w dwóch–trzech zdaniach, z liczbami z materiałów działu */
  answer: string;
  image: ImageMetadata;
  position?: string;
}

/** Kluczowa liczba prowadząca do zestawienia (wartość jako tekst: „~73%”, „4,2”). */
export interface KeyNumber {
  value: string;
  unit: string;
  desc: string;
  href: string;
  /** nazwa celu linku, np. tytuł zestawienia */
  target: string;
}

export interface Link {
  label: string;
  href: string;
  /** prefiks ścieżki, przy którym pozycja menu jest aktywna (np. '/mechanizmy/') */
  match?: string;
}

export interface NavGroup {
  title: string;
  links: Link[];
}

/** Duża liczba z opisem i źródłem (pasek „Cztery liczby na start”). */
export interface Stat {
  value: number;
  decimals?: number;
  /** znak przed liczbą: '~' (około), '>' (ponad) */
  prefix?: '~' | '>' | '<';
  unit: string;
  desc: string;
  accuracy: Accuracy;
  source: string;
  /** adres publikacji — etykieta źródła staje się linkiem */
  href?: string;
}

/** Pozycja listy źródeł strony (article/SourceList, np. /prawa-pacjenta/). Artykuły mają przypisy. */
export interface Source {
  publisher: string;
  title: string;
  url: string;
  date?: string;
}

/** Karta z numerem i tagami (ścieżki „Od czego zacząć”). */
export interface PathCard {
  kicker: string;
  title: string;
  desc: string;
  tags: string[];
  href: string;
  featured?: boolean;
}

/** Kafel ze zdjęciem w pasku tematów. */
export interface Topic {
  title: string;
  desc: string;
  href: string;
  image: ImageMetadata;
  /** object-position — punkt kadrowania */
  position: string;
}

/** Wiersz wykresu słupkowego. */
export interface BarRow {
  label: string;
  note?: string;
  value: number;
  display: string;
  highlight?: boolean;
  /** cieńszy słupek do porównań (np. „prywatnie”) */
  secondary?: boolean;
}

/** Element listy: tytuł + tekst (kroki, zasady, prawa). */
export interface TextItem {
  title: string;
  text: string;
}

export interface IndexLink extends Link {
  badge?: string;
}

/** Pozycja spisu wskazująca artykuł po id — adres i tytuł pochodzą z kolekcji. */
export interface IndexRef {
  ref: string;
  /** krótsza etykieta niż tytuł artykułu */
  label?: string;
  badge?: string;
}

/** Pojęcie słownika (kształt wyświetlany przez blocks/Glossary i /slownik/). */
export interface Term {
  id: string;
  /** etykieta zakładki w module na stronie głównej */
  tab: string;
  term: string;
  full: string;
  def: string;
  /** „Więcej”: strony serwisu rozwijające temat */
  more: Link[];
  /** podstawa prawna albo źródło definicji */
  sources: Link[];
  /** pozycja w module na stronie głównej; brak = tylko /slownik/ */
  home?: number;
}

export interface Tool {
  icon: 'pin' | 'chart';
  label: string;
  title: string;
  desc: string;
  href: string;
}

/** Sekcja strony (nagłówek ## z kotwicą) — wynik wyszukiwania może prowadzić prosto do niej. */
export interface SearchSection {
  title: string;
  anchor: string;
}

/** Cel wyszukiwania ze wszystkimi przeszukiwanymi polami (składany w czasie budowania). */
export interface SearchDoc {
  /** stały identyfikator, np. dla listy „Popularne” */
  id: string;
  title: string;
  category: string;
  href: string;
  /** krótkie nazwy tematu spoza tytułu, np. słowa z adresu artykułu („fikcyjne-wizyty”) */
  keywords?: string[];
  /** lead, „W skrócie”, definicja — przeszukiwane, niewyświetlane */
  summary?: string;
  sections?: SearchSection[];
  /** pełny tekst strony bez znaczników — najniższa waga */
  body?: string;
}

/** Wiersz wyników: ten sam kształt dla „Popularnych” (serwer) i wyników zapytania (przeglądarka). */
export interface SearchHit {
  title: string;
  category: string;
  href: string;
  /** tytuł sekcji, do której prowadzi `href` */
  section?: string;
}

/**
 * Indeks odwrócony w /szukaj.json: dla każdego słowa — dokumenty, w których występuje, z wagą.
 * `words` jest posortowane (kolejność kodów znaków), `postings[i]` należy do `words[i]`
 * i ma postać płaskiej listy par: [nr dokumentu, waga, nr dokumentu, waga, …].
 */
export interface SearchIndex {
  docs: Pick<SearchDoc, 'title' | 'category' | 'href' | 'sections'>[];
  words: string[];
  postings: number[][];
}

/* ---------- Obrazki Open Graph ---------- */

/** Karta liczby na obrazku OG (wariant `stat`). Wartość jako tekst: „~633”, „34”, „4,2”. */
export interface OgStat {
  value: string;
  unit?: string;
  label?: string;
  desc?: string;
  accuracy?: Accuracy;
  source?: string;
}

/** Nadpisanie obrazka OG strony — każde pole opcjonalne, scalane na presecie typu strony. */
export interface OgOverride {
  /** tekst na obrazku (nie zmienia og:title); „\n” = ręczny podział wiersza */
  title?: string;
  eyebrow?: string;
  /** lead pod tytułem; false = bez leadu */
  lead?: string | false;
  /** auto: stat → zdjęcie → sam tytuł */
  media?: 'auto' | 'photo' | 'stat' | 'none';
  stat?: OgStat;
  /** zdjęcie inne niż okładka */
  photo?: ImageMetadata;
  /** punkt kadrowania zdjęcia (jak object-position) */
  position?: string;
  /** etykieta na zdjęciu; false = bez */
  badge?: string | false;
  /** gotowa grafika 1200×630 — omija generator */
  image?: ImageMetadata;
}

/** Strona spoza kolekcji z własnym obrazkiem OG (src/data/og.ts). */
export interface OgPage extends OgOverride {
  title: string;
  footer?: { text: string; flags?: boolean };
  badgeIcon?: IconName;
}

/** Etap drogi (np. projektu ustawy): zakończony, bieżący albo przed nami. */
export interface Stage {
  label: string;
  /** dopowiedzenie pod etykietą, np. numer wersji albo podstawa prawna */
  note?: string;
  date?: Date;
  state: 'done' | 'current' | 'next';
  href?: string;
}

/** Pytanie i odpowiedź (akapity) — zarzuty, wątpliwości. */
export interface FaqItem {
  question: string;
  answer: string[];
}

/** Tabela porównania: nagłówki kolumn i wiersze; `marked` wyróżnia wiersz (np. nowy przepis). */
export interface CompareTable {
  caption?: string;
  columns: string[];
  rows: { cells: string[]; marked?: boolean }[];
}

/**
 * Kierunek programu (/program/): co proponujemy, fakt, na którym to opieramy (liczba ze źródłem),
 * uczciwie nazwany spór i materiał serwisu, który rozwija temat.
 */
export interface Proposal {
  /** kotwica wpisu (atrybut id) */
  id?: string;
  title: string;
  text: string;
  /** fakt, na którym opieramy kierunek; liczba zawsze ze źródłem */
  fact?: { text: string; source?: Link };
  /** najmocniejszy kontrargument albo otwarte pytanie */
  dispute?: string;
  more?: Link[];
  /** konto w serwisie X związane z kierunkiem (np. strona sporu) — karta blocks/XProfile */
  profile?: XProfileCard;
}

/** Dane karty blocks/XProfile podane jako dane, a nie w szablonie; `note` trafia do slotu karty. */
export interface XProfileCard {
  name: string;
  /** nazwa konta bez „@” */
  handle: string;
  avatar?: ImageMetadata;
  eyebrow?: string;
  bio?: string;
  link?: { label: string; href: string };
  note?: string;
}
