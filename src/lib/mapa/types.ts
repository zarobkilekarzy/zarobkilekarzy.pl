/**
 * Kontrakt warstwy mapy. Warstwa to gotowe do wyświetlenia dane jednego trybu mapy — wartości,
 * skala, teksty legendy i dymków — bez wiedzy o tym, gdzie mapa stoi i czy jest interaktywna.
 * Silnik (./layout, ./svg) i komponent (components/mapa/PolandMap.astro) czytają tylko ten kontrakt,
 * więc nowy temat (np. czas oczekiwania na SOR) to nowa funkcja budująca warstwy plus wpis w ./sets.
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
}

/** Dymek przy punkcie albo województwie. */
export interface Tip {
  title: string;
  /** linia pod tytułem, np. „Ząbki · Mazowieckie” */
  meta?: string;
  /** wiersze „etykieta — wartość” */
  rows?: [string, string][];
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
    teryt: string;
    /** null = punkt bez danych, szary */
    value: number | null;
    /** wielkość koła (np. liczba pozycji na liście); bez niej koło ma stały rozmiar */
    size?: number;
    tip: Tip;
  }[];
  /** legenda wielkości kół */
  size?: { title: string; samples: number[] };
  /** podpis szarego punktu w legendzie */
  missing?: { label: string; count: number };
}

export type MapLayer = RegionLayer | PointLayer;

/** Zestaw warstw jednego tematu, przełączanych na jednej mapie. */
export interface MapSet {
  id: string;
  layers: MapLayer[];
}
