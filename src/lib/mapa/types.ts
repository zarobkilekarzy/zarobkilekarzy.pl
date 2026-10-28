/**
 * Kontrakt warstwy mapy. Warstwa to gotowe do wyświetlenia dane jednego trybu mapy — wartości,
 * skala, teksty legendy i dymków — bez wiedzy o tym, gdzie mapa stoi i czy jest interaktywna.
 * Silnik (./layout, ./svg) i komponent (components/mapa/PolandMap.astro) czytają tylko ten kontrakt,
 * więc nowy temat to nowa funkcja budująca warstwy plus wpis w ./sets. Warstwa punktowa może brać
 * wartości „na żywo” — z pliku JSON wczytywanego w przeglądarce przez adapter (./live).
 *
 * Wszystkie teksty są gotowe do wyświetlenia (sformatowane liczby, polskie znaki typograficzne).
 */

/** Skala klasowa: n granic → n + 1 klas, najwyżej 5 (tyle stopni ma rampa --seq-* w tokens.css). */
export interface ClassScale {
  /** tytuł legendy, np. „Mediana rocznych wypłat w placówce” */
  title: string;
  /** granice klas rosnąco: wartość < edges[0] → klasa 0 */
  edges: number[];
  /** podpis każdej klasy (edges.length + 1) */
  labels: string[];
  /** liczebność klas, pokazywana w legendzie */
  counts?: number[];
  /** stopień rampy --seq-* dla każdej klasy, gdy klas jest mniej niż stopni (np. [0, 1, 3, 4]) */
  tones?: number[];
}

/** Wiersz tabeli w dymku: komórki (pierwsza = etykieta), podpis pod etykietą, wyróżnienie wartości. */
export interface TipRow {
  cells: string[];
  /** drobny podpis pod etykietą, np. „żółty · do 60 min” */
  sub?: string;
  /** wyróżnione komórki (indeksy), np. czas ponad normę */
  alert?: number[];
  /** odstęp nad wierszem — początek nowej grupy */
  gap?: boolean;
}

/** Dymek przy punkcie albo województwie. */
export interface Tip {
  title: string;
  /** linia pod tytułem, np. „Ząbki · Mazowieckie” */
  meta?: string;
  /** duże liczby pod tytułem: [wartość, podpis] */
  stats?: [string, string][];
  /**
   * Profil pod liczbami, np. zwykła kolejka w każdej godzinie doby: słupki ze wspólną skalą od zera, bez osi.
   * `mark` wyróżnia słupek (bieżąca godzina), `now` rysuje nad nim kreskę na wysokości wartości teraz;
   * `ticks` — podpisy pod równymi odstępami; `note` i `caption` — zdania pod słupkami.
   */
  profile?: { title: string; values: (number | null)[]; ticks?: string[]; mark?: number; now?: number; note?: string; caption?: string };
  /** nagłówki kolumn, gdy wiersze mają więcej niż dwie komórki */
  cols?: string[];
  /** wiersze „etykieta — wartość” albo wiersze tabeli */
  rows?: ([string, string] | TipRow)[];
  /** drobny tekst pod wierszami, np. godzina pomiaru */
  foot?: string;
  /** zastrzeżenie oddzielone kreską, np. o niejednoznacznych danych */
  warn?: string;
  href?: string;
  hrefLabel?: string;
}

/** Linia źródła pod mapą: „Źródło: <nazwa z linkiem>, <uwagi>”. */
export interface MapSource {
  label: string;
  name: string;
  href?: string;
  detail?: string;
}

interface LayerBase {
  /** identyfikator w atrybutach i adresach plików: małe litery, cyfry, myślnik */
  id: string;
  /** napis na przełączniku trybów */
  label: string;
  /** opis dla czytników ekranu: co widać i gdzie są te same dane tekstem */
  alt: string;
  scale: ClassScale;
  /** duża liczba nad legendą */
  summary?: { value: string; text: string };
  /** zastrzeżenie pod legendą; HTML, dozwolone tylko <b> */
  note?: string;
  /** podpis pod mapą, np. jak czytać położenie punktów */
  caption?: string;
  sources: MapSource[];
}

/** Kartogram: kolor województwa = klasa wartości. */
export interface RegionLayer extends LayerBase {
  kind: 'regions';
  /** po jednej pozycji na województwo */
  regions: {
    /** kod TERYT województwa, 2 cyfry */
    teryt: string;
    value: number;
    /** krótka wartość na mapie, np. „21%” */
    display: string;
    /** dokładna wartość w rankingu, np. „21,4%”; bez niej — display */
    exact?: string;
    /** dopisek w rankingu, np. „12 z 56” */
    detail?: string;
    tip: Tip;
  }[];
  /** ranking obok mapy, od największej wartości; `max` = koniec skali pasków */
  ranking?: { title: string; max: number };
}

/** Punkty w gminach: kolor = klasa wartości, pole koła ∝ size. */
export interface PointLayer extends LayerBase {
  kind: 'points';
  points: {
    /** kod TERYT siedziby, 7 cyfr (gmina, dzielnica albo obszar wiejski — zob. geo.communePoint) */
    teryt?: string;
    /** położenie ze współrzędnych geograficznych (WGS84) — dokładniejsze niż środek gminy */
    at?: { lat: number; lng: number };
    /** identyfikator punktu w danych na żywo (np. numer księgi rejestrowej SOR) */
    key?: string;
    /** null = punkt bez danych, szary */
    value: number | null;
    /** wielkość koła (np. liczba pozycji na liście); bez niej koło ma stały rozmiar */
    size?: number;
    tip: Tip;
  }[];
  /** legenda wielkości kół; `radius` — promień = max(min, base + k·√wielkość), domyślnie jak w ./layout */
  size?: { title: string; samples: number[]; radius?: Radius };
  /** podpis szarego punktu w legendzie */
  missing?: { label: string; count: number };
  /**
   * Wartości na żywo: przeglądarka wczytuje `url` i przepuszcza przez adapter z ./live, który zwraca
   * wartości, wielkości i dymki punktów, liczebność klas, podsumowanie i listę `top`. Do czasu
   * wczytania (i bez JavaScriptu) punkty są szare, a panel pokazuje `pending`.
   */
  live?: {
    url: string;
    adapter: LiveAdapterId;
    pending: string;
    /** napisy dla adaptera w przeglądarce (np. wersja angielska) — trafiają do danych mapy w stronie */
    text?: object;
  };
  /** lista wyróżnionych punktów pod legendą (np. najdłuższe kolejki); przy warstwie na żywo wypełnia ją adapter */
  top?: { title: string };
  /** wyszukiwarka nad mapą: szuka po tytule i podpisie dymków, wybór przypina dymek i podświetla punkt */
  search?: { label: string; placeholder: string; empty: string };
}

/** Promień koła z wielkości: max(min, base + k·√wielkość). */
export interface Radius {
  base: number;
  k: number;
  min: number;
}

/** Adaptery danych na żywo (./live). */
export type LiveAdapterId = 'sor';

export type MapLayer = RegionLayer | PointLayer;

/** Zestaw warstw jednego tematu, przełączanych na jednej mapie. */
export interface MapSet {
  id: string;
  layers: MapLayer[];
}
