/** Typy globu płac lekarzy (/dane/zarobki-lekarzy-na-swiecie/). */

/** forma pracy: e — na etacie, f — na własny rachunek (samozatrudnieni, kontrakty) */
export type Form = 'e' | 'f';
/** r — × przeciętna płaca w kraju, n — × płaca pielęgniarki szpitalnej, x — kwota po kursie, p — kwota według siły nabywczej, j — warstwa jawności */
export type Measure = 'r' | 'n' | 'x' | 'p' | 'j';
export type Currency = 'PLN' | 'EUR' | 'USD';
/** widok = forma + miara (+ waluta przy kwotach), np. „e-r”, „e-x-PLN”, „f-p-EUR” */
export type ViewKey = `${Form}-${'r' | 'n'}` | `${Form}-${'x' | 'p'}-${Currency}` | 'j';

/** [wartość, rok, flaga] — flagi OECD (E szacunek, D inna definicja, B przerwa, P wstępne) i O = relacja orientacyjna */
export type Obs = [number, number, string];

/** grupy OECD: specjaliści / lekarze rodzinni × na etacie / samozatrudnieni; n — pielęgniarki szpitalne na etacie */
export type OecdGroup = 'se' | 'sf' | 'ge' | 'gf' | 'n';
/** szeregi OECD × przeciętna płaca od 2000 r.: grupa → [rok, wartość, flaga][] */
export type OecdSeries = Partial<Record<OecdGroup, Obs[]>>;
/** r — × przeciętna płaca, p — USD PPP, x — USD po kursie z roku danych */
export type OecdValues = Partial<Record<OecdGroup, Partial<Record<'r' | 'p' | 'x', Obs>>>>;

export interface Link {
  label: string;
  href: string;
}

/** przelicznik: jednostek waluty krajowej za 1 USD (kurs) albo za 1 dolar międzynarodowy (PPP) */
export interface Rate {
  value: number;
  year: number;
  source: string;
}

/**
 * Co wiadomo o płacach lekarzy z danych krajowych:
 * avg — średnia (mediana) płaca lekarzy ze statystyki i przeciętna płaca z tego samego urzędu → na mapie;
 * partial — dane o lekarzach, ale cząstkowe (sektor prywatny, pensje razem z dochodem z praktyki);
 * broad — tylko szersza grupa zawodów albo cały sektor; scale — tylko tabela płac (stawka);
 * none — nie znaleźliśmy niczego oficjalnego.
 */
export type NationalKind = 'avg' | 'partial' | 'broad' | 'scale' | 'none';

export interface NationalPay {
  /** roczna płaca lekarza i przeciętna płaca w kraju, w walucie krajowej, to samo ujęcie */
  annual: number;
  average: number;
  currency: string;
  year: number;
  /** kurs do dolara z roku danych; brak = nie przeliczamy */
  fx?: Rate;
  ppp?: Rate;
  /** licznik i mianownik z różnych badań — relacja orientacyjna */
  approx?: boolean;
}

export interface NationalEntry {
  kind: NationalKind;
  /** kogo dotyczy liczba (pokazywane przy wartości) */
  group?: string;
  pay?: NationalPay;
  /** wiersze karty kraju: [etykieta, wartość] */
  rows?: [string, string][];
  note?: string;
  sources?: Link[];
}

/** jawność płacy konkretnego lekarza: 3 imiennie z urzędu, 2 na wniosek / częściowo, 1 tylko zasady i średnie, 0 brak */
export interface Transparency {
  level: 0 | 1 | 2 | 3;
  /** jedno–dwa zdania dla czytelnika: co jest jawne */
  text: string;
  /** czy jawność pokazuje łączny dochód osoby, czy płacę z jednego miejsca */
  scope: 'total' | 'one';
  /** najważniejszy przepis */
  law: string;
  href: string;
  /** dalsza lektura (np. artykuł serwisu) */
  more?: Link;
}

/** przepis albo źródło z opisem: zdanie dla czytelnika, nazwa przepisu i adres tekstu pierwotnego */
export interface TaxText {
  text: string;
  law: string;
  href: string;
}

/**
 * Podatek dochodowy od płac w kraju (wiersz w szczegółach kraju). Kraje OECD: najwyższa stawka łącznie z podatkami
 * regionalnymi i lokalnymi oraz jej próg jako wielokrotność przeciętnej płacy (OECD Tax Database, tabela I.7);
 * kraje spoza OECD: przepis krajowy, próg słowami w `nat`.
 */
export interface Tax {
  /** najwyższa stawka, % */
  rate: number;
  year: number;
  /** próg najwyższej stawki, × przeciętna płaca brutto (OECD) */
  th?: number;
  /** podatek liniowy: jedna stawka, bez progu */
  flat?: boolean;
  /** kraj spoza OECD: opis skali z kwotami w walucie kraju, przepis */
  nat?: TaxText;
  /** inna forma opodatkowania lekarzy w tym kraju (np. ryczałt na kontrakcie w Polsce): zdania, każde ze swoim źródłem */
  notes?: TaxText[];
}

/** tekst wpisu krajowego w innym języku: te same pola, ta sama liczba i kolejność wierszy i źródeł co w polskim wpisie */
export interface NationalText {
  group?: string;
  rows?: [string, string][];
  note?: string;
  /** etykiety źródeł w kolejności polskiego wpisu; obiekt tylko wtedy, gdy zmienia się też adres (strona serwisu) */
  sources?: (string | Link)[];
}

/** tekst wpisu o jawności w innym języku (poziom, zakres i adres przepisu zostają z polskiego modułu) */
export interface TransparencyText {
  text: string;
  law: string;
  more?: Link;
}
