/**
 * Kształty treści strony /prawa-pacjenta/ (src/data/prawa-pacjenta.ts).
 * Z tych samych danych powstają strona, karta do druku i PDF — zmiana w jednym miejscu.
 * Teksty mogą zawierać **pogrubienie** i [link](adres) — zob. lib/inline.ts.
 */
import type { IconName } from '@/icons';

/** Numer telefonu: zapis do wyświetlenia i do linku tel:. */
export interface Phone {
  display: string;
  tel: string;
}

/** Wejście „W jakiej jesteś sytuacji?” — kotwica do sekcji strony. */
export interface Entry {
  href: string;
  title: string;
  text: string;
  icon: IconName;
}

/** Prawo jako pytanie pacjenta: krótka odpowiedź widoczna od razu, reszta po rozwinięciu. */
export interface RightQA {
  /** kotwica — adres odpowiedzi, którą można komuś wysłać; nie zmieniać po publikacji */
  id: string;
  q: string;
  /** odpowiedź jednym słowem lub liczbą: „Tak”, „Nie”, „0 zł” */
  verdict: string;
  short: string;
  more: string[];
  /** spokojne zdanie, które można powiedzieć personelowi */
  say?: string;
  /** podstawa prawna, np. „art. 9” (ustawy o prawach pacjenta, chyba że podano inną) */
  basis: string;
  /** dodatkowa tabela pod odpowiedzią (np. stawki za kopie) */
  table?: { caption: string; rows: { label: string; value: string }[]; note: string };
  /** wersja na kartę kieszonkową; brak = prawo nie trafia na kartę */
  card?: string;
}

export interface RightsGroup {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  items: RightQA[];
  /** pozostałe prawa jednym zdaniem — pod pytaniami, bez rozwijania */
  also?: { title: string; items: { text: string; basis: string }[] };
}

/** „Co się stało?” → dokąd, jak, w jakim terminie, za ile. */
export interface Route {
  id: string;
  situation: string;
  examples: string;
  to: string;
  facts: { label: string; text: string; urgent?: boolean }[];
  /** `extra` — przycisk tylko w tłumaczeniu (np. numer dla dzwoniących z zagranicy); kontrola zgodności z PL go pomija */
  actions?: { label: string; href: string; icon?: IconName; extra?: true }[];
  /** wersja na kartę kieszonkową */
  card?: { situation: string; contact: string };
}

/** Termin pacjenta — na osi od najkrótszego. */
export interface Deadline {
  value: string;
  unit: string;
  what: string;
  from: string;
  basis: string;
  /** krótki termin, który łatwo przegapić */
  urgent?: boolean;
  /** to nie termin pacjenta, tylko informacja (np. jak długo leży dokumentacja) */
  info?: boolean;
  card?: string;
}

/** Treść karty do druku (PDF): wyciąg z praw, terminów i sytuacji. */
export interface CardContent {
  title: string;
  stamp: string;
  url: string;
  rights: { text: string; basis: string }[];
  free: { text: string; basis: string }[];
  deadlines: { value: string; text: string; basis: string }[];
  warning: string;
  routes: { situation: string; contact: string }[];
  legal: string;
  howTo: string[];
}

/**
 * Napisy PDF spoza treści karty (nagłówki, telefon, linia cięcia, metadane). Polskie — domyślne
 * w lib/pacjent/pdf.ts (PL_PDF_TEXT); angielskie — src/data/en/prawa-pacjenta.ts (pdfText).
 */
export interface PdfText {
  /** język dokumentu (Tagged PDF), np. „pl-PL” */
  lang: string;
  cardMeta: { title: (title: string) => string; subject: string; keywords: string };
  largeMeta: { title: (title: string) => string; subject: string; keywords: string };
  /** „Karta kieszonkowa” przed datą stanu */
  cardKind: string;
  /** „Duży druk” przed datą stanu */
  largeKind: string;
  /** „Nie wiesz, od czego zacząć? Zadzwoń” (duży druk dokleja dwukropek) */
  call: string;
  cardHelpline: (name: string, hours: string) => string;
  largeHelpline: (name: string, hours: string) => string;
  cardEmergency: string;
  largeEmergency: string;
  rights: string;
  free: string;
  deadlines: string;
  warning: string;
  routes: string;
  /** „Pełna wersja i źródła:” przed adresem */
  full: string;
  cutMarks: string;
  page: (n: number, of: number) => string;
}

/** Telefony na karcie: infolinia i numer alarmowy. */
export interface CardPhones {
  helpline: { phone: Phone; name: string; hours: string };
  emergency: { phone: Phone };
}

/** Wiersz porównania dwóch dróg (Fundusz czy sąd). */
export interface CompareRow {
  label: string;
  a: string;
  b: string;
}
