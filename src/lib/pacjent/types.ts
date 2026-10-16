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
}

/** „Co się stało?” → dokąd, jak, w jakim terminie, za ile. */
export interface Route {
  id: string;
  situation: string;
  examples: string;
  to: string;
  facts: { label: string; text: string; urgent?: boolean }[];
  actions?: { label: string; href: string; icon?: IconName }[];
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
