/**
 * Analiza /analizy/odpowiedzialnosc-zawodowa-lekarzy/: kary sądów lekarskich i odebrania prawa
 * wykonywania zawodu w Polsce, Norwegii, Szwecji i Wielkiej Brytanii. Tekst i przypisy są w
 * content/articles/odpowiedzialnosc-zawodowa-lekarzy.mdx, tabela lat w
 * components/odpowiedzialnosc-zawodowa-lekarzy/RevocationTable.
 *
 * Dane polskie to zestawienie własne z plików NIL „Dane liczbowe dotyczące sądów lekarskich”
 * (sprawozdania roczne OSL i NSL 2010–2025, zestawienie orzeczeń OSL i NSL 2000–2014),
 * suma 24 izb: 23 okręgowych i Wojskowej Izby Lekarskiej. Sumujemy kolumny izb, a nie komórkę
 * SUMA z pliku: w OSL 2021 i 2022 SUMA wierszy 8.8 i 8.9 jest wpisana na sztywno jako 0,
 * choć w kolumnach izb są przypadki (8.9: po jednym w każdym z tych lat).
 *
 * Rok 2025 (sprawozdania OSL i NSL opublikowane 8.09.2026): kolumna izby w Koszalinie jest
 * w sprawozdaniu OSL pusta, więc sumy OSL za 2025 r. są niepełne.
 *
 * Aktualizacja o kolejny rok: dopisz rok do PENALTY_YEARS, FIRST_INSTANCE_YEARS (przez
 * PENALTY_YEARS), REVOCATIONS, NO_DOCTORS i OROZ_CASES, przesuń WINDOW i PENALTY_WINDOW,
 * a mianowniki Szwecji (SE_*) i Wielkiej Brytanii (UK_*) weź z nowych raportów Socialstyrelsen i GMC
 * dla nowego okna.
 */

export const LINKS = {
  /** pliki sprawozdań sądów lekarskich (OSL i NSL) rok po roku */
  nilCourts: 'https://nil.org.pl/izba/naczelny-sad-lekarski/sprawozdania/dane-liczbowe-dotyczace-sadow-lekarskich',
  /** sprawozdanie okręgowych sądów lekarskich za 2025 r. (xlsx) */
  osl2025: 'https://nil.org.pl/uploaded_files/1788883847_sprawozdanie-osl-2025.xlsx',
  /** sprawozdanie Naczelnego Sądu Lekarskiego za 2025 r. (doc) */
  nsl2025: 'https://nil.org.pl/uploaded_files/1788883794_nsl-sprawozdanie-2025specjalizacje.doc',
  /** roczne zestawienia okręgowych rzeczników odpowiedzialności zawodowej */
  nilOroz: 'https://nil.org.pl/izba/naczelny-rzecznik-odpowiedzialnosci-zawodowej/sprawozdania/roczne-oroz',
  /** Centralny Rejestr Lekarzy — liczba lekarzy wykonujących zawód, stan na 31.12.2025 (zestawienie nr 3) */
  nilRegister: 'https://nil.org.pl/uploaded_files/1768208069_31122025-zestawienie-nr-3.pdf',
  /** ustawa o izbach lekarskich, tekst jednolity Dz.U. 2021 poz. 1342 */
  act: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342',
  helsetilsynet: 'https://www.helsetilsynet.no/tilsyn/om-tilsynssaker/statistikk-reaksjoner-mot-helsepersonell/',
  ssb: 'https://www.ssb.no/statbank/table/07938/',
  hsan: 'https://www.socialstyrelsen.se/globalassets/sharepoint-dokument/dokument-webb/ovrigt/hsan-verksamhetsredogorelse-2025.pdf',
  socialstyrelsen: 'https://www.socialstyrelsen.se/contentassets/8f0d27a18c394508bb609d03d5153dc2/2026-2-10048.pdf',
  /** GMC, roczne statystyki postępowań (2025: tab. 3b wyników trybunałów, lata 2020–2025) */
  gmc2025: 'https://www.gmc-uk.org/cdn/documents/concerns-about-fitness-to-practise-annual-statistical-report-2025-english_pdf-115384449.pdf',
  /** GMC, statystyki za 2024 r. (tab. 6, lata 2020–2024) */
  gmc2024: 'https://www.gmc-uk.org/cdn/documents/fitness-to-practise-statistics-report-2024_pdf-112202260.pdf',
  /** GMC, raport o kadrach 2025 — lekarze z licencją */
  gmcWorkforce: 'https://www.gmc-uk.org/cdn/documents/wfr25-report-251117_pdf-112967442.pdf',
} as const;

/* ---------- Kary orzeczone przez okręgowe sądy lekarskie, I instancja ---------- */

export interface Penalty {
  /** nazwa kary jak w art. 83 ust. 1 ustawy o izbach lekarskich */
  name: string;
  /** zakres czasowy z ustawy */
  range?: string;
  n: number;
  /** jedna z trzech najłagodniejszych kar */
  mild?: boolean;
}

/** Kolejność z art. 83 ust. 1 (od najłagodniejszej) = wiersze 7.5–7.11 sprawozdania OSL. */
const PENALTY_KINDS: Omit<Penalty, 'n'>[] = [
  { name: 'Upomnienie', mild: true },
  { name: 'Nagana', mild: true },
  { name: 'Kara pieniężna', mild: true },
  { name: 'Zakaz pełnienia funkcji kierowniczych', range: '1–5 lat' },
  { name: 'Ograniczenie zakresu czynności', range: '6 mies. – 2 lata' },
  { name: 'Zawieszenie prawa wykonywania zawodu', range: '1–5 lat' },
  { name: 'Pozbawienie prawa wykonywania zawodu' },
];

/**
 * Kary I instancji rok po roku, w kolejności PENALTY_KINDS (OSL 7.5–7.11, suma kolumn 24 izb).
 * 2025: bez Koszalina (pusta kolumna w sprawozdaniu).
 */
export const PENALTY_YEARS: Record<number, readonly number[]> = {
  2020: [140, 38, 73, 2, 8, 6, 3],
  2021: [214, 92, 81, 3, 10, 16, 3],
  2022: [145, 84, 85, 1, 13, 23, 5],
  2023: [155, 97, 102, 3, 11, 56, 1],
  2024: [163, 89, 102, 6, 20, 64, 8],
  2025: [229, 142, 126, 4, 18, 68, 7],
};

/** Okno struktury kar — te same lata co okno porównania z Norwegią i Szwecją. */
export const PENALTY_WINDOW = { from: 2020, to: 2025 } as const;

const penaltyYears = Object.keys(PENALTY_YEARS)
  .map(Number)
  .filter((y) => y >= PENALTY_WINDOW.from && y <= PENALTY_WINDOW.to);

/**
 * To liczba KAR, nie spraw ani ukaranych lekarzy: zakaz pełnienia funkcji kierowniczych może
 * dołączyć do ograniczenia lub zawieszenia (art. 83 ust. 2).
 */
export const PENALTIES: { period: string; rows: Penalty[] } = {
  period: `${PENALTY_WINDOW.from}–${PENALTY_WINDOW.to}`,
  rows: PENALTY_KINDS.map((kind, i) => ({
    ...kind,
    n: penaltyYears.reduce((sum, y) => sum + PENALTY_YEARS[y][i], 0),
  })),
};

/** 2516 w latach 2020–2025 */
export const PENALTIES_TOTAL = PENALTIES.rows.reduce((sum, p) => sum + p.n, 0);
/** 2157 — upomnienie, nagana, kara pieniężna */
export const PENALTIES_MILD = PENALTIES.rows.filter((p) => p.mild).reduce((sum, p) => sum + p.n, 0);
/** udział kary w procentach (PENALTIES_TOTAL = 100) */
export const share = (n: number) => (n / PENALTIES_TOTAL) * 100;
/** liczba kar danego rodzaju w oknie, po nazwie z PENALTY_KINDS */
export const penalty = (name: string) => PENALTIES.rows.find((p) => p.name === name)!.n;

/* ---------- Pozbawienie prawa wykonywania zawodu w Polsce ---------- */

/** Orzeczenia pozbawienia w I instancji (OSL), lata 2000–2009 łącznie — zestawienie orzeczeń OSL i NSL 2000–2014. */
export const FIRST_INSTANCE_2000_2009 = 10;

/** Orzeczenia pozbawienia w I instancji (OSL 7.11) rok po roku od 2010; od 2020 z PENALTY_YEARS. */
const FIRST_INSTANCE_YEARS: Record<number, number> = {
  2010: 0, 2011: 1, 2012: 0, 2013: 1, 2014: 1,
  2015: 0, 2016: 4, 2017: 2, 2018: 0, 2019: 2,
  ...Object.fromEntries(Object.entries(PENALTY_YEARS).map(([y, row]) => [y, row[6]])),
};

/** Suma orzeczeń pozbawienia w I instancji w latach od–do (od 2010). */
export const firstInstance = (from: number, to: number) =>
  Object.entries(FIRST_INSTANCE_YEARS)
    .filter(([y]) => Number(y) >= from && Number(y) <= to)
    .reduce((sum, [, n]) => sum + n, 0);

/** 13 + 8 + 27 = 48 */
export const FIRST_INSTANCE = [
  { period: '2000–2014', n: FIRST_INSTANCE_2000_2009 + firstInstance(2010, 2014) },
  { period: '2015–2019', n: firstInstance(2015, 2019) },
  { period: `2020–${PENALTY_WINDOW.to}`, n: firstInstance(2020, PENALTY_WINDOW.to) },
] as const;
export const FIRST_INSTANCE_TOTAL = FIRST_INSTANCE.reduce((sum, p) => sum + p.n, 0);

/* ---------- Odebrania prawa wykonywania zawodu lekarzom: Polska, Norwegia, Szwecja, Wielka Brytania ---------- */

export type CountryKey = 'pl' | 'no' | 'se' | 'uk';

export type RevocationYear = { year: number } & Record<CountryKey, number>;

/**
 * Prawomocne odebrania prawa wykonywania zawodu lekarzom, w roku uprawomocnienia.
 * PL: pozbawienia PWZ — orzeczenia OSL niezaskarżone (sekcja 8.9, suma kolumn izb) + utrzymane lub
 *     orzeczone przez NSL w apelacji (sekcja 8.11); zakładamy, że zbiory są rozłączne (sprawozdania bez sygnatur; oba niezerowe w tym
 *     samym roku tylko w 2016 i 2024, więc w najgorszym razie suma o 2 mniejsza). Suma 2010–2025 = 20.
 *     2019: 1 z NSL 8.11. 2021 i 2022: po 1 w kolumnach izb OSL 8.9, mimo SUMA = 0 w pliku.
 *     2025: 0, bez Koszalina; orzeczenia I instancji z 2025 r. (7) mogą się uprawomocnić później.
 * NO: tilbakekall av autorisasjon eller lisens, leger (Helsetilsynet; 2012 pierwotnie 29, później 30 — bierzemy 29;
 *     2025 wg komunikatu z 9.02.2026).
 * SE: återkallelse av legitimation, läkare (HSAN, tab. 6; 2013 = 25 wg sprawozdania, Läkartidningen podaje 17;
 *     2025 = 64, w tym 4 tymczasowo).
 * UK: erasure orzeczone przez trybunał MPT (Medical Practitioners Tribunal Service), lekarze, rok kalendarzowy
 *     decyzji — GMC, roczne statystyki fitness to practise, tabele wyników trybunałów (kolejne raporty nie
 *     korygowały wcześniejszych lat). To orzeczenia trybunału, od których przysługuje odwołanie do sądu, w roku
 *     decyzji. Bez skreśleń po review tribunals (podawane tylko w części lat, 9–19 rocznie) i bez dobrowolnych
 *     (voluntary erasure). 2020–2021 zaburzone pandemią (mniej rozpraw).
 */
export const REVOCATIONS: RevocationYear[] = [
  { year: 2010, pl: 0, no: 27, se: 10, uk: 73 },
  { year: 2011, pl: 0, no: 24, se: 7, uk: 65 },
  { year: 2012, pl: 0, no: 29, se: 20, uk: 55 },
  { year: 2013, pl: 0, no: 25, se: 25, uk: 55 },
  { year: 2014, pl: 1, no: 32, se: 16, uk: 71 },
  { year: 2015, pl: 1, no: 37, se: 14, uk: 72 },
  { year: 2016, pl: 4, no: 28, se: 15, uk: 70 },
  { year: 2017, pl: 1, no: 47, se: 10, uk: 62 },
  { year: 2018, pl: 0, no: 45, se: 24, uk: 65 },
  { year: 2019, pl: 1, no: 40, se: 31, uk: 55 },
  { year: 2020, pl: 2, no: 30, se: 36, uk: 43 },
  { year: 2021, pl: 1, no: 44, se: 41, uk: 58 },
  { year: 2022, pl: 1, no: 37, se: 43, uk: 68 },
  { year: 2023, pl: 1, no: 29, se: 55, uk: 60 },
  { year: 2024, pl: 7, no: 27, se: 48, uk: 67 },
  { year: 2025, pl: 0, no: 58, se: 64, uk: 48 },
];

/** Okno porównania: ostatnie lata, za które mamy dane wszystkich czterech krajów. */
export const WINDOW = { from: 2020, to: 2025 } as const;
const WINDOW_YEARS = WINDOW.to - WINDOW.from + 1;

export const FIRST_YEAR = REVOCATIONS[0].year;
export const LAST_YEAR = REVOCATIONS[REVOCATIONS.length - 1].year;

/** Suma odebrań w kraju w latach od–do (włącznie). */
export const total = (key: CountryKey, from = FIRST_YEAR, to = LAST_YEAR) =>
  REVOCATIONS.filter((r) => r.year >= from && r.year <= to).reduce((sum, r) => sum + r[key], 0);

/** Polska: liczba lat bez prawomocnego pozbawienia i lat z dokładnie jednym, FIRST_YEAR–LAST_YEAR. */
export const PL_ZERO_YEARS = REVOCATIONS.filter((r) => r.pl === 0).length;
export const PL_ONE_YEARS = REVOCATIONS.filter((r) => r.pl === 1).length;
export const YEARS_COUNT = REVOCATIONS.length;
/** wartość dla Polski w danym roku */
export const plIn = (year: number) => REVOCATIONS.find((r) => r.year === year)!.pl;

/* ---------- Mianowniki: liczba lekarzy ---------- */

/** Polska: lekarze wykonujący zawód wg rejestru NIL, stan na 31.12.2025, bez lekarzy dentystów (= REGISTER_TOTAL w lib/podaz/model.ts). */
export const PL_DOCTORS = 164892;

/**
 * Norwegia: SSB, tabela 07938, „Sysselsatte” (zatrudnieni), lege uten + med spesialitet, wszystkie
 * grupy wieku, 4. kwartał danego roku.
 */
export const NO_DOCTORS: Record<number, number> = {
  2019: 30828,
  2020: 31753,
  2021: 32600,
  2022: 33570,
  2023: 34612,
  2024: 35361,
  2025: 35997,
};

/**
 * Szwecja: Socialstyrelsen (2026), tab. 1 — lekarze łącznie ze specjalistami zatrudnieni w ochronie
 * zdrowia w maju 2025 r. i zmiana liczby w latach 2020–2025 (+13%). Rocznej serii w tym raporcie nie ma,
 * więc średnią z okna szacujemy przy liniowym wzroście jako średnią stanów z maja 2020 i maja 2025.
 * Działa tylko dla WINDOW 2020–2025 — przy innym oknie trzeba wziąć inne dane.
 */
export const SE_DOCTORS_2025 = 46020;
export const SE_GROWTH_2020_2025 = 0.13;
const SE_DOCTORS_2020 = SE_DOCTORS_2025 / (1 + SE_GROWTH_2020_2025);

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const windowYears = Array.from({ length: WINDOW_YEARS }, (_, i) => WINDOW.from + i);

/** ≈ 33 982 */
const NO_DOCTORS_AVG = avg(windowYears.map((y) => NO_DOCTORS[y]));
/** ≈ 43 373 (szacunek) */
const SE_DOCTORS_AVG = (SE_DOCTORS_2020 + SE_DOCTORS_2025) / 2;

/**
 * Wielka Brytania: lekarze z licencją do wykonywania zawodu (licensed doctors; NIE „on register”,
 * który obejmuje też osoby bez licencji) — GMC, raport o kadrach 2025: 272 255 w 2020 r. i 328 149
 * w 2024 r. Za 2025 r. liczby jeszcze nie ma, więc średnią z okna szacujemy jak dla Szwecji: jako
 * średnią stanów z 2020 i 2024 r. Działa tylko dla WINDOW 2020–2025.
 */
export const UK_DOCTORS_2020 = 272255;
export const UK_DOCTORS_2024 = 328149;
/** ≈ 300 202 (szacunek) */
const UK_DOCTORS_AVG = (UK_DOCTORS_2020 + UK_DOCTORS_2024) / 2;

const thousands = (n: number) => `ok. ${Math.round(n / 1000)} tys.`;

export interface Country {
  key: CountryKey;
  name: string;
  /** kto decyduje */
  body: string;
  /** lekarze w mianowniku wskaźnika */
  doctors: number;
  doctorsLabel: string;
  /** czym jest mianownik — do podpisu tabeli */
  doctorsNote: string;
}

export const COUNTRIES: Country[] = [
  {
    key: 'pl', name: 'Polska', body: 'sądy lekarskie',
    doctors: PL_DOCTORS, doctorsLabel: '164 892',
    doctorsNote: 'wykonujących zawód na koniec 2025 r., bez lekarzy dentystów',
  },
  {
    key: 'no', name: 'Norwegia', body: 'urząd państwowy',
    doctors: NO_DOCTORS_AVG, doctorsLabel: thousands(NO_DOCTORS_AVG),
    doctorsNote: `zatrudnionych, średnia z lat ${WINDOW.from}–${WINDOW.to}`,
  },
  {
    key: 'se', name: 'Szwecja', body: 'urząd państwowy',
    doctors: SE_DOCTORS_AVG, doctorsLabel: thousands(SE_DOCTORS_AVG),
    doctorsNote: `zatrudnionych w ochronie zdrowia, szacunek średniej z lat ${WINDOW.from}–${WINDOW.to}`,
  },
  {
    key: 'uk', name: 'Wielka Brytania', body: 'trybunał',
    doctors: UK_DOCTORS_AVG, doctorsLabel: thousands(UK_DOCTORS_AVG),
    doctorsNote: `z licencją, szacunek średniej z lat ${WINDOW.from}–${WINDOW.to}`,
  },
];

/** Średnio rocznie na 100 tys. lekarzy przy danej sumie z okna i mianowniku. */
export const rate = (sum: number, doctors: number) => (sum / WINDOW_YEARS / doctors) * 100000;

/**
 * Średnio rocznie na 100 tys. lekarzy w oknie porównania:
 * (suma z okna ÷ liczba lat) ÷ liczba lekarzy × 100 000. 2020–2025: NO ≈ 110,4, SE ≈ 110,3, UK ≈ 19,1, PL ≈ 1,2.
 * Mianowniki z różnych rejestrów krajowych — wynik przybliżony.
 */
export const ratePer100k = (key: CountryKey) => {
  const country = COUNTRIES.find((c) => c.key === key)!;
  return rate(total(key, WINDOW.from, WINDOW.to), country.doctors);
};

/** Ile razy częściej urzędy w Norwegii i Szwecji (niższy z dwóch wskaźników) niż polskie sądy lekarskie: ≈ 91. */
export const RATIO = Math.min(ratePer100k('no'), ratePer100k('se')) / ratePer100k('pl');
/** RATIO zaokrąglone do dziesiątek — do tekstu („ok. 90 razy”). */
export const RATIO_ROUNDED = Math.round(RATIO / 10) * 10;

/** Ile razy częściej trybunał w Wielkiej Brytanii niż polskie sądy lekarskie: ≈ 16. */
export const RATIO_UK = ratePer100k('uk') / ratePer100k('pl');

/* ---------- Sprawy u rzeczników i w sądach ---------- */

/**
 * Okręgowi rzecznicy odpowiedzialności zawodowej, suma 24 izb, kolumna „Liczba spraw, które wpłynęły”
 * (wszystkie sprawy, nie tylko skargi pacjentów). 2025: zestawienie roczne (I półrocze 2188 + II 2336).
 */
export const OROZ_CASES: Record<number, number> = { 2022: 3304, 2023: 3952, 2024: 4034, 2025: 4524 };

/** Okręgowe sądy lekarskie 2025, wiersz 1 „Sprawy, które wpłynęły do sądu” (bez Koszalina). */
export const OSL_CASES_2025 = 1269;
