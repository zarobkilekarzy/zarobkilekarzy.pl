/**
 * Kontrakt datagridu: opis kolumn, filtrów i szczegółów wiersza dla dowolnych danych.
 * Konfiguracja to zwykły moduł TS współdzielony przez serwer (pierwszy widok w HTML)
 * i przeglądarkę (filtrowanie, sortowanie), więc oba renderują komórki tymi samymi funkcjami.
 */

/** Gotowy, już escapowany fragment HTML. */
export type Html = string;

export type SortDir = 'asc' | 'desc';

export interface SortState {
  by: string;
  dir: SortDir;
}

export interface GridState {
  q: string;
  /** wybrane wartości filtrów: id filtra → wartości */
  facets: Record<string, string[]>;
  /** włączone przełączniki (id) */
  toggles: string[];
  sort: SortState;
  /** numer strony, od 1 */
  page: number;
  /** wierszy na stronie; 0 = wszystkie */
  perPage: number;
}

export interface RenderContext<D> {
  /** dane pomocnicze policzone raz przy wczytaniu (GridConfig.load) */
  data: D;
  /** escapuje tekst i zaznacza w nim trafienia wyszukiwania */
  mark: (text: string) => Html;
  sort: SortState;
}

export interface Column<T, D = unknown> {
  /** identyfikator — trafia do adresu przy sortowaniu (?sort=…) */
  id: string;
  label: string;
  /** krótsza etykieta w widoku kart */
  short?: string;
  /** definicja pojęcia: dymek w nagłówku i legenda pod tabelą */
  hint?: string;
  align?: 'start' | 'end';
  /** szerokość kolumny (CSS); bez niej kolumna zajmuje resztę miejsca */
  width?: string;
  /** 1 — zawsze widoczna, 2 — znika w wąskiej tabeli, 3 — znika najwcześniej */
  priority?: 1 | 2 | 3;
  /** grupa kolumn: wspólny nagłówek i jedna komórka zastępcza, gdy wiersz nie ma danych grupy */
  group?: string;
  /** wartość do sortowania; brak = kolumna niesortowalna. null zawsze na końcu */
  sort?: (row: T) => number | string | null;
  /** kierunek po pierwszym kliknięciu */
  dir?: SortDir;
  /** pasek wielkości pod wartością, gdy tabela jest sortowana tą kolumną */
  bar?: boolean;
  cell: (row: T, ctx: RenderContext<D>) => Html;
}

export interface ColumnGroup<T, D = unknown> {
  id: string;
  label: string;
  /** czy wiersz ma dane tej grupy */
  has: (row: T) => boolean;
  /** treść jednej komórki zastępującej całą grupę */
  empty: (row: T, ctx: RenderContext<D>) => Html;
}

export interface FacetOption {
  value: string;
  label: string;
  /** odcień w legendzie i na pasku (data-tone) */
  tone?: string;
}

export interface Facet<T> {
  /** identyfikator — klucz w adresie (?woj=slaskie,opolskie) */
  id: string;
  label: string;
  hint?: string;
  options: FacetOption[];
  value: (row: T) => string | null;
  /** menu z polami wyboru albo pasek rozkładu, który jest jednocześnie filtrem */
  display?: 'menu' | 'bar';
}

export interface Toggle<T> {
  id: string;
  label: string;
  test: (row: T) => boolean;
  /** włączony w widoku domyślnym */
  default?: boolean;
  /**
   * Komunikat dla „miękkiego” przełącznika: gdy z nim nie ma żadnego wyniku, tabela pokazuje
   * wyniki bez niego i wyświetla ten tekst (przełącznik zostaje włączony).
   */
  fallback?: string;
}

export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string | number | null;
}

export interface GridConfig<T, D = unknown> {
  /** zamienia pobrany JSON na wiersze i dane pomocnicze */
  load: (json: unknown) => { rows: T[]; data: D };
  key: (row: T) => string;
  /** rzeczownik w trzech formach: placówka / placówki / placówek */
  noun: [string, string, string];
  caption: string;
  search: { label: string; placeholder: string; text: (row: T) => string };
  columns: Column<T, D>[];
  groups?: ColumnGroup<T, D>[];
  facets: Facet<T>[];
  toggles?: Toggle<T>[];
  /** domyślne sortowanie */
  sort: SortState;
  /** kolejność wierszy o równej wartości sortowania */
  tiebreak?: (a: T, b: T) => number;
  /** rozwijane szczegóły wiersza */
  detail?: {
    has: (row: T) => boolean;
    /** etykieta przycisku dla czytników ekranu */
    label: (row: T) => string;
    render: (row: T, ctx: RenderContext<D>) => Html;
  };
  /** odcień wiersza (pasek przy lewej krawędzi) */
  tone?: (row: T) => string;
  /** domyślna liczba wierszy na stronie */
  pageSize: number;
  /** opcje „na stronie” (0 = wszystkie); bez nich tylko pageSize */
  pageSizes?: number[];
  /** eksport widocznych (przefiltrowanych) wierszy; kolumny mogą zależeć od danych */
  csv?: { filename: string; columns: (data: D) => CsvColumn<T>[] };
}
