/**
 * Mechanizm /mechanizmy/reglamentacja-dostepu/: kto i jakimi narzędziami reguluje wejście do zawodu
 * lekarza i do specjalizacji. Tekst i przypisy są w content/articles/reglamentacja-dostepu.mdx —
 * tu adresy dla bloków (StatRow, Figure) i tabele.
 *
 * Aktualizacja:
 * - limit przyjęć: co roku (sierpień–wrzesień) nowe rozporządzenie MZ; suma po uczelniach jak w
 *   data/english-division.ts (LIMITS) — tam jest jedno źródło tej liczby;
 * - progi rankingowe: listy zakwalifikowanych SMK po każdej sesji (marzec–kwiecień, październik–listopad);
 *   wiersze THRESHOLDS liczone z list wiosny 2025 (jeden PDF z 16 województwami);
 * - stan prawny: tekst jednolity ustawy o zawodach lekarza (Dz.U. 2026 poz. 37) i jego późniejsze zmiany.
 */
import type { CompareTable } from '@/types';

const eli = (year: number, pos: number) => `https://api.sejm.gov.pl/eli/acts/DU/${year}/${pos}/text.pdf`;

export const LINKS = {
  /** ustawa o zawodach lekarza i lekarza dentysty, tekst jednolity: art. 5, 7, 16c, 16j, 16m, 19f */
  act: eli(2026, 37),
  /** ustawa z 23.01.2026 o wygaszeniu rozwiązań z ustawy o pomocy obywatelom Ukrainy (wejście w życie 5.03.2026) */
  ukraineExit: eli(2026, 203),
  /** rozporządzenie MZ z 28.08.2026, limit przyjęć 2026/27 */
  limit2026: eli(2026, 1167),
  /** rozporządzenie MZ z 7.08.2025, limit przyjęć 2025/26 */
  limit2025: eli(2025, 1086),
  /** SMK, lista zakwalifikowanych po postępowaniu wiosna 2025 (16 województw w jednym pliku), publ. 16.04.2025 */
  ranking2025: 'https://wczp.kielce.uw.gov.pl/download/6/56699/ostateczna-lista-lekarzy-zakwalifikowanych-post-wiosna-2025.pdf',
  cmkp2026: 'https://www.cmkp.edu.pl/aktualnosci/opublikowano-ostateczne-wyniki-rekrutacji-na-specjalizacje-w-sesji-wiosna-2026',
} as const;

/** Wyliczenie z listy LINKS.ranking2025 (bez osobnych list „miejsca doktoranckie”), obliczenia własne. */
export const SPRING_2025 = {
  /** pary województwo × dziedzina z co najmniej jedną osobą zakwalifikowaną na rezydenturę, z dziedzinami stomatologicznymi */
  pairs: 533,
  /** w tylu parach najniższy wynik zakwalifikowanego na rezydenturę wynosił co najmniej 90% */
  over90: 34,
} as const;

/**
 * Kto decyduje na kolejnych etapach drogi do zawodu i specjalizacji.
 * Liczby tylko z ustawy (art. 16m, 19f) — źródło w podpisie Figure.
 */
export const GATES_TABLE: CompareTable = {
  columns: ['', 'Kto decyduje', 'Narzędzie'],
  rows: [
    { cells: ['Nowy kierunek lekarski', 'Minister nauki; Polska Komisja Akredytacyjna (PKA) wydaje opinię', 'Pozwolenie na prowadzenie studiów'] },
    { cells: ['Miejsca na studiach', 'Minister zdrowia; samorząd lekarski opiniuje projekt', 'Coroczne rozporządzenie z limitem dla każdej uczelni'] },
    { cells: ['Prawo wykonywania zawodu', 'Okręgowa rada lekarska', 'Przyznanie prawa po dyplomie, stażu podyplomowym i Lekarskim Egzaminie Końcowym (LEK)'] },
    { cells: ['Miejsca rezydenckie', 'Minister zdrowia', 'Przyznaje miejsca w dziedzinach i płaci pensję rezydenta z budżetu państwa'] },
    { cells: ['Placówka szkoląca', 'Dyrektor CMKP na podstawie opinii zespołu ekspertów', 'Akredytacja i maksymalna liczba miejsc szkoleniowych na 5 lat'] },
    { cells: ['Kierownik specjalizacji', 'Kierownik placówki wyznacza; konsultant krajowy zgadza się na wyjątek', 'Najwyżej 3 szkolących się naraz, wyjątkowo 4'] },
    { cells: ['Kolejność kandydatów', 'Dyrektor CMKP, za pośrednictwem wojewodów', 'Ranking według wyniku w procentach maksymalnej liczby punktów'] },
    { cells: ['Dyplom spoza Unii Europejskiej', 'Okręgowa rada lekarska; w trybie uproszczonym minister zdrowia', 'Uznanie dyplomu albo egzamin LEW; zgoda ministra na określony zakres, czas i miejsce'] },
  ],
};

/**
 * Najniższy wynik osoby zakwalifikowanej na rezydenturę w danym województwie, wiosna 2025.
 * Zakres między województwami, w których ktoś dostał rezydenturę w tej dziedzinie.
 * Choroby wewnętrzne: pominięty jeden wpis z wynikiem 0,00% (śląskie).
 */
export const THRESHOLDS_TABLE: CompareTable = {
  columns: ['', 'Najniższy wynik przyjętego na rezydenturę', 'Województwa z przyjęciami'],
  rows: [
    { cells: ['Endokrynologia', '91,3–93,4%', '8'], marked: true },
    { cells: ['Dermatologia i wenerologia', '91,2–92,8%', '9'], marked: true },
    { cells: ['Chirurgia plastyczna', '90,2–91,9%', '4'], marked: true },
    { cells: ['Okulistyka', '86,0–88,4%', '12'] },
    { cells: ['Kardiologia', '63,8–88,5%', '16'] },
    { cells: ['Choroby wewnętrzne', '54,4–80,2%', '16'] },
  ],
};
