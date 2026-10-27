/**
 * Analiza /analizy/ciecie-limitow-na-medycyne/: historia cięcia limitu przyjęć w Polsce (1987–2003),
 * wyrwa pokoleniowa w rejestrze lekarzy i liczby do porównania z Francją i Portugalią.
 * Tekst i przypisy są w content/articles/ciecie-limitow-na-medycyne.mdx.
 *
 * Limit ŁĄCZNY (wszystkie cztery kolumny rozporządzenia) bierzemy wyłącznie z LIMITS
 * w data/english-division.ts — tu go nie wpisujemy. Ten plik trzyma tylko to, czego tam nie ma:
 * miejsca na studiach stacjonarnych (dawniej: dziennych) po polsku, liczby sprzed 2012 r.
 * i strukturę wieku lekarzy.
 *
 * Uwaga na definicje (opisane w artykule): 1987 i 1990 to miejsca „na I roku medycyny”, 2003 —
 * „na studiach dziennych”, za Rynkiem Zdrowia (2019), który nie podaje źródła pierwotnego;
 * „niewiele ponad 2 000” w latach 1994–2000 — Polityka Zdrowotna, też bez źródła. Żadnej z tych
 * liczb nie potwierdza akt prawny ani rocznik GUS, do których dotarliśmy (załączniki do rozporządzenia
 * z 2003 r., Dz.U. 2003 nr 99 poz. 917, nie są dostępne w ELI). Od 2015/16 to suma dwóch kolumn
 * rozporządzenia: studia stacjonarne po polsku + odrębna pula dla cudzoziemców na tych studiach.
 *
 * Liczby (dayRows, AGE, BEFORE, BOTTOM, RECOVERY) czyta też wersja angielska — src/data/en/ciecie-limitow-na-medycyne.ts.
 */
import type { BarRow } from '@/types';
import { formatPL } from '@/lib/format';
import { limitOf } from '@/data/english-division';

/* ---------- Publikacje, na które powołują się podpisy ilustracji (w treści — przypisy) ---------- */

export const LINKS = {
  rz2019: 'https://www.rynekzdrowia.pl/Nauka/Limity-przyjec-na-medycyne-wyraznie-rosna-Czy-odbudujemy-lekarskie-kadry,198210,9.html',
  fa2022: 'https://miesiecznik.forumakademickie.pl/czasopisma/fa-9-2022/lekarskie-limity%E2%80%A9/',
  mnisw9177: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDG7JC7/i09177-o1.pdf',
  lim2026: 'https://api.sejm.gov.pl/eli/acts/DU/2026/1167/text.pdf',
  crl: 'https://nil.org.pl/uploaded_files/1768208069_31122025-zestawienie-nr-3.pdf',
  nil2024: 'https://nil.org.pl/aktualnosci/8502-polska-na-drodze-do-marnowania-miliarda-zlotych-rocznie-na-ksztalcenie-nadmiarowych-lekarzy',
  edulog: 'https://www.edulog.pt/storage/app/uploads/public/5ee/948/5ad/5ee9485ad5289214937284.pdf',
  oecd2016: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2016/03/health-workforce-policies-in-oecd-countries_g1g57f0f/9789264239517-en.pdf',
} as const;

/* ---------- Limit łączny z jednego źródła (LIMITS) ---------- */

/** Limit łączny w roku akademickim, sformatowany: „8 170” */
export const total = (year: string) => formatPL(limitOf(year).total);
/** Część po polsku (limit łączny bez puli w języku obcym): „8 226” */
export const polish = (year: string) => formatPL(limitOf(year).total - limitOf(year).foreign);

/* ---------- Polska: miejsca na studiach stacjonarnych (dziennych) po polsku ---------- */

/** Poziom sprzed cięcia: „ponad 6 000” miejsc na I roku w 1987 r. (prasa) */
export const BEFORE = 6000;
/** Dno: 2 090 miejsc na studiach dziennych w 2003 r. (prasa) */
export const BOTTOM = 2090;
/** „o co najmniej 65%”: 1 − 2 090 / 6 000 = 65,2%; przy „ponad 6 000” spadek był większy */
export const CUT_PCT = Math.floor((1 - BOTTOM / BEFORE) * 100);

/**
 * Od 2015/16: stacjonarne po polsku + pula dla cudzoziemców na tych studiach, wersja końcowa aktu.
 *   2015/16: 3 529 + 60 (Dz.U. 2015 poz. 1119; MNiSW, interp. 9177)
 *   2019/20: 4 965 + 77 (Dz.U. 2019 poz. 1344; nowelizacja poz. 1713 zmieniła tylko niestacjonarne)
 *   2022/23: 5 727 + 109 (Dz.U. 2022 poz. 1655 i 2023; Forum Akademickie podaje 5 830 — o 6 mniej)
 *   2023/24: 6 598 + 109 (Dz.U. 2023 poz. 1322 i 2027; MNiSW, interp. 9177) — pierwszy rok powyżej 6 000
 *   2026/27: 7 051 + 107 (Dz.U. 2026 poz. 1167, suma własna 16.10.2026; kontrola: + 1 734 niestac. + 1 838 w j. obcym = 10 730)
 * 2005 i 2010 — Forum Akademickie 9/2022 (bez cudzoziemców w osobnej kolumnie).
 */
export const dayRows: BarRow[] = [
  { label: '1987', note: '· miejsca na I roku, za prasą', value: BEFORE, display: 'ponad 6 000' },
  { label: '1990', note: '· miejsca na I roku, za prasą', value: 3300, display: 'ok. 3 300' },
  { label: '1994–2000', note: '· za prasą, bez danych rocznych', value: 2000, display: 'niewiele ponad 2 000' },
  { label: '2003', note: '· studia dzienne, za prasą', value: BOTTOM, display: '2 090', highlight: true },
  { label: '2005', note: '· studia stacjonarne', value: 2360, display: '2 360' },
  { label: '2010', note: '· studia stacjonarne', value: 3023, display: '3 023' },
  { label: '2015/16', note: '· rozporządzenie MZ', value: 3589, display: '3 589' },
  { label: '2019/20', note: '· rozporządzenie MZ', value: 5042, display: '5 042' },
  { label: '2022/23', note: '· rozporządzenie MZ', value: 5836, display: '5 836' },
  { label: '2023/24', note: '· rozporządzenie MZ, pierwszy rok powyżej 6 000', value: 6707, display: '6 707' },
  { label: '2026/27', note: '· rozporządzenie MZ', value: 7158, display: '7 158' },
];

/** Ile lat od 1987 r. do pierwszego naboru powyżej 6 000 — zależnie od definicji (opisane w tekście) */
export const RECOVERY = {
  /** stacjonarne po polsku z pulą dla cudzoziemców: 6 707 w 2023/24 */
  stationary: 2023 - 1987,
  /**
   * stacjonarne + niestacjonarne po polsku, wersja końcowa: 2018/19 = 4 691 + 87 + 1 345 = 6 123
   * (Dz.U. 2018 poz. 1381 i 1845; w wersji pierwotnej 5 955, wtedy dopiero 2019/20: 5 042 + 1 236 = 6 278).
   * 2017/18: 4 368 + 81 + 1 273 = 5 722 — jeszcze poniżej.
   */
  withExtramural: 2018 - 1987,
};

/* ---------- Wyrwa pokoleniowa: lekarze wykonujący zawód według wieku ---------- */

/**
 * NIL, Centralny Rejestr Lekarzy, zestawienie nr 3, stan na 31.12.2025 — lekarze (bez dentystów)
 * wykonujący zawód, mężczyźni + kobiety (research.db: lekarze_wykonujacy, nil-finn-2026-01).
 * „Start studiów” to przybliżenie: rok urodzenia (2026 − wiek, rocznikowo) + 19 lat.
 */
export const AGE = [
  { group: '26–30', value: 20346, start: '2015–19' },
  { group: '31–35', value: 19834, start: '2010–14' },
  { group: '36–40', value: 17008, start: '2005–09' },
  { group: '41–45', value: 12787, start: '2000–04' },
  { group: '46–50', value: 11607, start: '1995–99' },
  { group: '51–55', value: 12563, start: '1990–94' },
  { group: '56–60', value: 15963, start: '1985–89' },
  { group: '61–65', value: 15183, start: '1980–84' },
  { group: '66–70', value: 14830, start: '1975–79' },
];

const age = (group: string) => AGE.find((a) => a.group === group)!.value;

export const ageRows: BarRow[] = AGE.map((a) => ({
  label: `${a.group} lat`,
  note: `· studia od ok. ${a.start}`,
  value: a.value,
  display: formatPL(a.value),
  highlight: a.group === '46–50',
}));

/** „27%”: o tyle mniej lekarzy w wieku 46–50 niż 56–60 (11 607 / 15 963 = 0,727) */
export const gapOlder = Math.round((1 - age('46–50') / age('56–60')) * 100);
/** „43%”: o tyle mniej lekarzy w wieku 46–50 niż 26–30 (11 607 / 20 346 = 0,570) */
export const gapYounger = Math.round((1 - age('46–50') / age('26–30')) * 100);
