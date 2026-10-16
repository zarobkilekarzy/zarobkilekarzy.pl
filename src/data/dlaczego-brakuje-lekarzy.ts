/**
 * Analiza /analizy/dlaczego-brakuje-lekarzy/: sesje jesienne postępowania kwalifikacyjnego na
 * specjalizacje (miejsca rezydenckie i pozarezydenckie, obsadzone, puste) i adresy źródeł do liczb
 * w StatRow. Tekst i przypisy są w content/articles/dlaczego-brakuje-lekarzy.mdx, wykres sesji
 * rysuje components/dlaczego-brakuje-lekarzy/EmptyPlaces.astro.
 *
 * Aktualizacja po ostatecznych listach CMKP z sesji jesiennej (listopad–grudzień): dopisz sesję
 * na końcu AUTUMN. Odsetki liczy `sessionStats`, ale zakresy w tekście artykułu (56–74%,
 * 82–91%, 27–38%) i w keyPoints trzeba wtedy poprawić ręcznie.
 */

export const LINKS = {
  /** Dz.U. 2025 poz. 1086 — limit przyjęć 2025/26 w pierwotnym brzmieniu (10 504, w tym 1 888 w języku obcym) */
  limit2025: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1086/text.pdf',
  /** CMKP — ostateczne wyniki sesji jesiennej 2025 */
  cmkp2025: 'https://www.cmkp.edu.pl/aktualnosci/opublikowano-ostateczne-wyniki-rekrutacji-na-specjalizacje-w-sesji-jesiennej-2025',
  /** Barometr Fundacji Watch Health Care (IX–X 2025) za: Rynek Zdrowia / PAP */
  whc: 'https://www.rynekzdrowia.pl/Polityka-zdrowotna/Barometr-Watch-Health-Care-sredni-czas-oczekiwania-na-leczenie-w-2025-r-to-ponad-4-miesiace,279890,14.html',
  /** NIL, Centralny Rejestr Lekarzy — informacje statystyczne (stan 16.01.2026, start symulatora podaży) */
  nilRegister: 'https://nil.org.pl/rejestry/centralny-rejestr-lekarzy/informacje-statystyczne',
  /** GUS, „Zasoby kadrowe w wybranych zawodach medycznych… w 2024 r.” — tablice */
  gus2024: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/zasoby-kadrowe-w-wybranych-zawodach-medycznych-na-podstawie-zrodel-administracyjnych-w-2024-r-,28,4.html',
};

export interface Session {
  /** „Jesień 2025” */
  label: string;
  /** miejsca rezydenckie (finansuje minister zdrowia) */
  residency: { offered: number; filled: number };
  /** miejsca pozarezydenckie (pozostałe wolne miejsca w akredytowanych jednostkach) */
  nonResidency: { offered: number; filled: number };
  /** poprawne formalnie wnioski */
  applications: number;
  source: { label: string; href: string };
}

/**
 * Sesje jesienne. „Obsadzone” = lekarze i lekarze dentyści, którzy potwierdzili przyjęcie miejsca
 * (ostateczne listy). Liczby sprawdzone w źródłach 15.10.2026; sumy 2022–2024 — obliczenia własne.
 */
export const AUTUMN: Session[] = [
  {
    label: 'Jesień 2022',
    residency: { offered: 4218, filled: 3071 },
    nonResidency: { offered: 11955, filled: 1109 },
    applications: 5639,
    source: {
      label: 'Rynek Zdrowia',
      href: 'https://www.rynekzdrowia.pl/Nauka/Sa-wyniki-kwalifikacji-na-specjalizacje-W-TOP10-az-piec-specjalizacji-priorytetowych,239780,9.html',
    },
  },
  {
    label: 'Jesień 2023',
    residency: { offered: 6262, filled: 3939 },
    nonResidency: { offered: 10118, filled: 995 },
    applications: 7027,
    source: {
      label: 'Puls Medycyny',
      href: 'https://pulsmedycyny.pl/kadry/lekarze/jesienne-rezydentury-przyznane-ktore-specjalizacje-byly-najbardziej-popularne/',
    },
  },
  {
    label: 'Jesień 2024',
    residency: { offered: 6651, filled: 4348 },
    nonResidency: { offered: 5427, filled: 962 },
    applications: 7442,
    source: {
      label: 'Puls Medycyny',
      href: 'https://pulsmedycyny.pl/system-ochrony-zdrowia/ksztalcenie/rezydentury-jesien-2024-opublikowano-ostateczne-wyniki-rekrutacji/',
    },
  },
  {
    label: 'Jesień 2025',
    residency: { offered: 6653, filled: 4096 },
    nonResidency: { offered: 7945, filled: 1387 },
    applications: 7995,
    source: { label: 'CMKP', href: LINKS.cmkp2025 },
  },
];

/** Sumy i odsetki jednej sesji (odsetki zaokrąglone do pełnych procentów). */
export function sessionStats(s: Session) {
  const offered = s.residency.offered + s.nonResidency.offered;
  const filled = s.residency.filled + s.nonResidency.filled;
  const emptyRez = s.residency.offered - s.residency.filled;
  const emptyNon = s.nonResidency.offered - s.nonResidency.filled;
  const pct = (part: number, whole: number) => Math.round((100 * part) / whole);
  return {
    offered,
    filled,
    empty: emptyRez + emptyNon,
    emptyRez,
    emptyNon,
    /** puste jako odsetek wszystkich miejsc sesji: 74, 70, 56, 62 */
    emptyPct: pct(emptyRez + emptyNon, offered),
    /** puste rezydenckie jako odsetek miejsc rezydenckich: 27, 37, 35, 38 */
    emptyRezPct: pct(emptyRez, s.residency.offered),
    /** puste pozarezydenckie jako odsetek miejsc pozarezydenckich: 91, 90, 82, 83 */
    emptyNonPct: pct(emptyNon, s.nonResidency.offered),
  };
}
