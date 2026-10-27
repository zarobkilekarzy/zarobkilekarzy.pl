/**
 * Analiza /analizy/odsiew-na-medycynie/: liczby do wykresów i do rachunku „od miejsca na studiach
 * do prawa wykonywania zawodu”. Tekst i przypisy są w content/articles/odsiew-na-medycynie.mdx.
 *
 * Odsetki liczymy tu z liczb bezwzględnych, żeby wykres i rachunek nie rozjechały się z danymi.
 * Źródła: aplikacja MZ BASiW „Studenci i absolwenci kierunków medycznych” (POL-on, ZUS, NFZ;
 * odczyt 4.10.2026), NIL „Barometr 25”, CEM (LEK 2024–2026), rozporządzenia MZ o limitach przyjęć,
 * zestawienie NIL wg wieku (30.06.2026). Liczby w treści artykułu są wpisane ręcznie — przy nowym
 * odczycie trzeba je poprawić razem z tym plikiem.
 *
 * Trzy przepływy z tej analizy (80% kończy studia, 5% absolwentów bez składki ZUS w Polsce,
 * ok. 1000 lekarzy z dyplomem zagranicznym rocznie) są domyślnymi ustawieniami symulatora podaży:
 * `MEASURED` w lib/podaz/model.ts. Zmiana tutaj nie przenosi się tam sama.
 *
 * Liczby (FIRST_YEAR, GRADUATES_PL, NIL_FIRST_YEAR, LEK, NO_ZUS, FATES_2016, sumy rachunku PWZ) czyta też
 * wersja angielska — src/data/en/odsiew-na-medycynie.ts.
 */
import type { BarRow } from '@/types';
import { formatPL } from '@/lib/format';
import { limitOf } from '@/data/english-division';

/** Publikacje, na które powołują się podpisy ilustracji (w treści — przypisy). */
export const LINKS = {
  mz: 'https://basiw.mz.gov.pl/mapy-informacje/mapa-2022-2026/analizy/kadry-medyczne/studenci-i-absolwenci-kierunkow-medycznych/',
  nil: 'https://nil.org.pl/uploaded_files/art_1770477600_raport-nil-komisja-ksztalcenia-barometr-2025.pdf#page=95',
  cem: 'https://www.cem.edu.pl/lep_s.php',
} as const;

const MINUS = '−';
const share = (part: number, whole: number) => (part / whole) * 100;
/** 16,73 → „16,7%” */
const pct = (v: number, decimals = 1) => `${formatPL(v, decimals)}%`;
/** Liczba ze znakiem: −9314 → „−9 314”, 974 → „+974”, 0,0 → „0,0” */
const signed = (v: number, decimals = 0) => {
  const abs = formatPL(Math.abs(v), decimals);
  if (Number(abs.replace(',', '.').replace(/\s/g, '')) === 0) return abs;
  return `${v < 0 ? MINUS : '+'}${abs}`;
};
/** Polska odmiana: 2–4 „lata”, 5+ „lat” (tu tylko 0–6). */
const yearsWord = (k: number) => (k === 1 ? 'rok' : k >= 2 && k <= 4 ? 'lata' : 'lat');

/* ---------- 1. Skreśleni na I roku (POL-on): skreśleni w semestrach 1–2 / studenci semestru 1 ---------- */

interface Removed {
  /** skreśleni w semestrach 1–2 */
  removed: number;
  /** studenci semestru 1 */
  first: number;
}

/** Kierunek lekarski, cała Polska; `pl` — narodowość polska, `foreign` — inna. */
export const FIRST_YEAR: { year: string; pl: Removed; foreign: Removed }[] = [
  { year: '2015/16', pl: { removed: 1009, first: 4931 }, foreign: { removed: 318, first: 1553 } },
  { year: '2016/17', pl: { removed: 1221, first: 5480 }, foreign: { removed: 671, first: 1587 } },
  { year: '2017/18', pl: { removed: 1227, first: 5935 }, foreign: { removed: 311, first: 1601 } },
  { year: '2018/19', pl: { removed: 1307, first: 5954 }, foreign: { removed: 484, first: 1663 } },
  { year: '2019/20', pl: { removed: 916, first: 6251 }, foreign: { removed: 258, first: 1742 } },
  { year: '2020/21', pl: { removed: 982, first: 6370 }, foreign: { removed: 339, first: 1535 } },
  { year: '2021/22', pl: { removed: 1190, first: 7007 }, foreign: { removed: 400, first: 1490 } },
  { year: '2022/23', pl: { removed: 1199, first: 7485 }, foreign: { removed: 373, first: 1473 } },
  { year: '2023/24', pl: { removed: 1457, first: 8710 }, foreign: { removed: 294, first: 1317 } },
];

export const rate = (r: Removed) => share(r.removed, r.first);

/** Wykres: Polacy, wyróżniony ostatni rok; cudzoziemcy w dopisku przy roku. */
export const firstYearRows: BarRow[] = FIRST_YEAR.map(({ year, pl, foreign }, i) => ({
  label: year,
  note: `· cudzoziemcy ${pct(rate(foreign))}`,
  value: rate(pl),
  display: pct(rate(pl)),
  highlight: i === FIRST_YEAR.length - 1,
}));

/* ---------- 2. Absolwenci-Polacy (POL-on) — do „kończy w terminie” i do rachunku PWZ ---------- */

/** Absolwenci narodowości polskiej w roku akademickim. 2024/25 może być niezamknięty. */
export const GRADUATES_PL: Record<string, number> = {
  '2020/21': 4064,
  '2021/22': 4501,
  '2022/23': 4812,
  '2023/24': 4776,
  '2024/25': 4874,
};

/* ---------- 3. NIL „Barometr 25”: brak promocji na I roku wg uczelni, 2023/24 ---------- */

type SchoolType = 'stara' | 'nowa';

/** Deklaracje uczelni; 18 z 19 ankietowanych (bez GUMed), od najwyższego odsetka. */
export const NIL_FIRST_YEAR: { school: string; type: SchoolType; value: number; note?: string }[] = [
  { school: 'WUM', type: 'stara', value: 24, note: 'razem z English Division' },
  { school: 'UWM w Olsztynie', type: 'stara', value: 22 },
  { school: 'Uniwersytet w Siedlcach', type: 'nowa', value: 20 },
  { school: 'AMiSNS w Elblągu', type: 'nowa', value: 19 },
  { school: 'UKSW w Warszawie', type: 'nowa', value: 18 },
  { school: 'Uniwersytet Warszawski', type: 'nowa', value: 16 },
  { school: 'UM we Wrocławiu', type: 'stara', value: 13 },
  { school: 'UJK w Kielcach', type: 'nowa', value: 12 },
  { school: 'UM w Białymstoku', type: 'stara', value: 11 },
  { school: 'UM w Łodzi', type: 'stara', value: 9 },
  { school: 'Uniwersytet Rzeszowski', type: 'nowa', value: 9 },
  { school: 'Uniwersytet Radomski', type: 'nowa', value: 8 },
  { school: 'ŚUM w Katowicach', type: 'stara', value: 7 },
  { school: 'UM w Poznaniu', type: 'stara', value: 5 },
  { school: 'PUM w Szczecinie', type: 'stara', value: 3 },
  { school: 'Uniwersytet Opolski', type: 'nowa', value: 3 },
  { school: 'Politechnika Wrocławska', type: 'nowa', value: 0 },
  { school: 'UJD w Częstochowie', type: 'nowa', value: 0 },
];

export const nilRows: BarRow[] = NIL_FIRST_YEAR.map((u) => ({
  label: u.school,
  note: [u.type === 'nowa' ? 'nowa' : '', u.note ?? ''].filter(Boolean).map((t) => `· ${t}`).join(' ') || undefined,
  value: u.value,
  display: `${u.value}%`,
  highlight: u.type === 'nowa',
}));

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const nilValues = (type: SchoolType) => NIL_FIRST_YEAR.filter((u) => u.type === type).map((u) => u.value);

/** Mediany z tekstu: stare 10, nowe 10,5, nowe bez zer 14. */
export const NIL_MEDIANS = {
  old: median(nilValues('stara')),
  new: median(nilValues('nowa')),
  newNonZero: median(nilValues('nowa').filter((v) => v > 0)),
};

/* ---------- 4. LEK, pierwsze podejście, egzamin po polsku: wynik uczelni względem średniej sesji ---------- */

export interface LekRow {
  school: string;
  type: SchoolType;
  /** zdających po raz pierwszy w sześciu sesjach (wiosna 2024 – jesień 2026) */
  takers: number;
  /** średni wynik uczelni minus średnia sesji, punkty na 200, ważone liczbą zdających */
  diff: number;
  /** odsetek zdających, którzy zdali */
  passed: number;
}

/** Od najlepszego wyniku względem średniej sesji. */
export const LEK: LekRow[] = [
  { school: 'Uniwersytet Opolski', type: 'nowa', takers: 384, diff: 6.1, passed: 99.0 },
  { school: 'CM UMK (Bydgoszcz)', type: 'stara', takers: 769, diff: 5.1, passed: 98.6 },
  { school: 'UM w Poznaniu', type: 'stara', takers: 1348, diff: 4.5, passed: 98.6 },
  { school: 'Uczelnia Łazarskiego', type: 'nowa', takers: 256, diff: 3.9, passed: 98.4 },
  { school: 'UM we Wrocławiu', type: 'stara', takers: 1144, diff: 3.5, passed: 98.1 },
  { school: 'Uniwersytet Radomski', type: 'nowa', takers: 191, diff: 3.0, passed: 96.9 },
  { school: 'UWM w Olsztynie', type: 'stara', takers: 287, diff: 1.7, passed: 95.8 },
  { school: 'CM UJ (Kraków)', type: 'stara', takers: 796, diff: 1.3, passed: 98.1 },
  { school: 'ŚUM w Katowicach', type: 'stara', takers: 1849, diff: 1.1, passed: 97.2 },
  { school: 'Uniwersytet Rzeszowski', type: 'nowa', takers: 455, diff: 0.9, passed: 97.8 },
  { school: 'UM w Lublinie', type: 'stara', takers: 876, diff: 0.0, passed: 96.0 },
  { school: 'PUM w Szczecinie', type: 'stara', takers: 776, diff: 0.0, passed: 97.2 },
  { school: 'UM w Łodzi', type: 'stara', takers: 1667, diff: -1.0, passed: 97.1 },
  { school: 'WUM', type: 'stara', takers: 1885, diff: -1.1, passed: 96.7 },
  { school: 'UKSW', type: 'nowa', takers: 230, diff: -2.2, passed: 96.1 },
  { school: 'UJK w Kielcach', type: 'nowa', takers: 310, diff: -2.6, passed: 95.8 },
  { school: 'Krakowska Akademia AFM', type: 'nowa', takers: 179, diff: -3.1, passed: 95.5 },
  { school: 'UM w Białymstoku', type: 'stara', takers: 867, diff: -4.5, passed: 94.7 },
  { school: 'Uniwersytet Zielonogórski', type: 'nowa', takers: 335, diff: -5.2, passed: 93.1 },
  { school: 'GUMed (Gdańsk)', type: 'stara', takers: 1117, diff: -5.6, passed: 97.0 },
  { school: 'Uczelnia Medyczna im. M. Skłodowskiej-Curie', type: 'nowa', takers: 56, diff: -14.7, passed: 75.0 },
  { school: 'Akademia Śląska', type: 'nowa', takers: 216, diff: -16.5, passed: 85.2 },
];

/** Skala wykresu LEK (punkty względem średniej sesji). */
export const LEK_SCALE = { min: -18, max: 8 } as const;

/** Etykieta wartości: „+6,1”, „−16,5”, „0,0”. */
export const lekDisplay = (diff: number) => signed(diff, 1);

/* ---------- 5. Losy absolwentów (POL-on × ZUS × NFZ), Polacy ---------- */

/** Absolwenci bez składki ZUS w Polsce wg roku kalendarzowego; `end` — rok kalendarzowy dyplomu. */
export const NO_ZUS: Record<string, { end: number; graduates: number; byYear: Record<number, number> }> = {
  '2016/17': { end: 2017, graduates: 3305, byYear: { 2019: 79, 2020: 147, 2021: 153, 2022: 165, 2023: 166 } },
  '2018/19': { end: 2019, graduates: 3653, byYear: { 2019: 89, 2020: 54, 2021: 107, 2022: 139, 2023: 159 } },
  '2020/21': { end: 2021, graduates: 4064, byYear: { 2021: 92, 2022: 53, 2023: 89 } },
};

export const noZusShare = (cohort: string, yearsAfter: number) => {
  const c = NO_ZUS[cohort];
  return share(c.byYear[c.end + yearsAfter], c.graduates);
};

/** Wykres: rocznik 2016/17 (najdłuższy szereg), od 2 do 6 lat po dyplomie. */
export const noZusRows: BarRow[] = [2, 3, 4, 5, 6].map((k) => ({
  label: `${k} ${yearsWord(k)} po dyplomie`,
  note: `· ${NO_ZUS['2016/17'].end + k} r.`,
  value: noZusShare('2016/17', k),
  display: pct(noZusShare('2016/17', k)),
  highlight: k === 6,
}));

/** Dopisek pod wykresem: rok dyplomu i rok stażu znamy z młodszych roczników. */
export const noZusNote =
  `Rocznik 2016/17, absolwenci narodowości polskiej: odsetek osób, za które w danym roku żaden płatnik nie odprowadzał składki. ` +
  `Rok dyplomu i rok stażu widać w młodszych rocznikach: 2018/19 — ${pct(noZusShare('2018/19', 0))} i ${pct(noZusShare('2018/19', 1))}, ` +
  `2020/21 — ${pct(noZusShare('2020/21', 0))} i ${pct(noZusShare('2020/21', 1))}. ` +
  `To górna granica wyjazdów: obejmuje też przerwy w pracy, urlopy i braki w danych.`;

/** Rocznik 2016/17 w 2023 r., sześć lat po dyplomie. */
export const FATES_2016 = { graduates: 3305, zus: 3135, clinics: 3044, nfz: 2866 } as const;

/* ---------- 6. Na każde 100 rozpoczynających ---------- */

export const START_2018 = FIRST_YEAR.find((r) => r.year === '2018/19')!.pl.first;
const finished = share(GRADUATES_PL['2023/24'], START_2018);

/** Kroki 1–2: studenci I semestru 2018/19 i absolwenci 2023/24; kroki 3–5: losy rocznika 2016/17 w 2023 r. */
export const funnelRows: BarRow[] = [
  { label: 'Zaczyna studia', note: `· ${formatPL(START_2018)} Polaków na I semestrze 2018/19`, value: 100 },
  { label: 'Kończy studia w terminie', note: `· ${formatPL(GRADUATES_PL['2023/24'])} absolwentów 2023/24`, value: finished },
  { label: 'Ma składkę ZUS w Polsce', note: `· ${pct(share(FATES_2016.zus, FATES_2016.graduates))} absolwentów po 6 latach`, value: (finished * FATES_2016.zus) / FATES_2016.graduates, highlight: true },
  { label: 'Pracuje w podmiocie leczniczym', note: `· ${pct(share(FATES_2016.clinics, FATES_2016.graduates))}`, value: (finished * FATES_2016.clinics) / FATES_2016.graduates },
  { label: 'Leczy w ramach umów z NFZ', note: `· ${pct(share(FATES_2016.nfz, FATES_2016.graduates))}`, value: (finished * FATES_2016.nfz) / FATES_2016.graduates },
].map((r) => ({ ...r, display: formatPL(r.value) }));

/* ---------- 7. Od miejsca na studiach do PWZ (rocznik przyjęć 2015–2019) ---------- */

/** Pula dla cudzoziemców na studiach stacjonarnych po polsku (sumy własne z rozporządzeń MZ).
 *  Nowelizacje z lat 2018/19 i 2019/20 tej kolumny nie zmieniały. */
const FOREIGNERS: Record<string, number> = { '2015/16': 60, '2016/17': 69, '2017/18': 81, '2018/19': 87, '2019/20': 77 };

/** Limity przyjęć na kierunek lekarski: łącznie i w języku obcym z jednego źródła — LIMITS
 *  w data/english-division.ts (wersja końcowa, z nowelizacjami; 2018/19 = 8 014, 2019/20 = 8 170). */
const LIMITS = Object.entries(FOREIGNERS).map(([year, foreigners]) => {
  const row = limitOf(year);
  return { year, total: row.total, foreignLanguage: row.foreign, foreigners };
});

/** Lekarze (bez dentystów) — wszyscy aktualni członkowie izby w wieku 26–30 lat, rocznikowo,
 *  zestawienie NIL nr 3, stan na 30.06.2026 (7 392 mężczyzn + 13 065 kobiet). */
export const PWZ_26_30 = 20457;

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export const limitTotal = sum(LIMITS.map((l) => l.total));
export const foreignLanguage = sum(LIMITS.map((l) => l.foreignLanguage));
export const foreigners = sum(LIMITS.map((l) => l.foreigners));
export const seatsForPoles = limitTotal - foreignLanguage - foreigners;
export const firstSemesterPoles = sum(FIRST_YEAR.filter((r) => LIMITS.some((l) => l.year === r.year)).map((r) => r.pl.first));
export const graduatesPoles = sum(Object.values(GRADUATES_PL));

export type LedgerKind = 'start' | 'step' | 'subtotal' | 'result';

/** Rachunek krok po kroku: każdy „subtotal” to poprzednia suma plus kroki nad nim. */
export const LEDGER: { label: string; note?: string; value: string; kind: LedgerKind }[] = [
  { kind: 'start', label: 'Limity przyjęć 2015/16–2019/20', note: 'pięć rozporządzeń MZ', value: formatPL(limitTotal) },
  {
    kind: 'step',
    label: 'Miejsca na studiach w języku obcym i pula dla cudzoziemców',
    note: `${formatPL(foreignLanguage)} i ${formatPL(foreigners)}; absolwenci zwykle wyjeżdżają`,
    value: signed(-(foreignLanguage + foreigners)),
  },
  { kind: 'subtotal', label: 'Miejsca po polsku dla Polaków', value: formatPL(seatsForPoles) },
  {
    kind: 'step',
    label: 'Polaków na I semestrze było więcej niż tych miejsc',
    note: 'm.in. powtarzający pierwszy rok i Polacy na studiach anglojęzycznych',
    value: signed(firstSemesterPoles - seatsForPoles),
  },
  { kind: 'subtotal', label: 'Polacy na I semestrze w tych latach', note: 'POL-on', value: formatPL(firstSemesterPoles) },
  { kind: 'step', label: 'Nie skończyli studiów w terminie', value: signed(graduatesPoles - firstSemesterPoles) },
  { kind: 'subtotal', label: 'Absolwenci-Polacy 2020/21–2024/25', note: 'POL-on; rok 2024/25 może być niezamknięty', value: formatPL(graduatesPoles) },
  {
    kind: 'step',
    label: 'Absolwenci spoza grupy 26–30 lat albo bez PWZ',
    note: 'pomniejszeni o lekarzy z dyplomem zagranicznym — tych grup nie da się rozdzielić',
    value: signed(PWZ_26_30 - graduatesPoles),
  },
  { kind: 'result', label: 'Lekarze z PWZ w wieku 26–30 lat', note: 'NIL, 30.06.2026', value: formatPL(PWZ_26_30) },
];

/** Do tekstu i kontroli: 37 059 miejsc, 20 457 z PWZ (55%), różnica 16 602 (do 15.10.2026, z 2018/19 w wersji pierwotnej: 36 891). */
export const LEDGER_TOTALS = {
  limit: limitTotal,
  pwz: PWZ_26_30,
  reached: share(PWZ_26_30, limitTotal),
  gap: limitTotal - PWZ_26_30,
} as const;

/* ---------- PES: część testowa, 2025 (infografika) ---------- */

/*
 * Wyniki części testowej Państwowego Egzaminu Specjalizacyjnego, policzone z list wyników CEM
 * (każdy nr kodowy = jedno podejście; „ndst” = poniżej progu 60%, art. 16s ust. 4 ustawy o zawodach
 * lekarza). Wszystkie podejścia, lekarze i lekarze dentyści. Odczyt 21.10.2026. Jesień 2025 zgadza
 * się co do osoby z tabelą MZ w odpowiedzi na interpelację nr 18220 (2686 przystąpiło, 2224 zdało).
 * Części ustnej CEM nie publikuje, więc to nie jest zdawalność całego PES.
 */
interface PesCount {
  /** podejścia do testu */
  n: number;
  /** wynik co najmniej 60% */
  passed: number;
}

export const PES_LINK = 'https://www.cem.edu.pl/spece_results_h.php';

/** Wszystkie dziedziny, sesje wiosna i jesień 2025. */
export const PES_2025_ALL: { spring: PesCount; autumn: PesCount } = {
  spring: { n: 2813, passed: 2189 },
  autumn: { n: 2686, passed: 2224 },
};

/** Siedem dziedzin z największą liczbą podejść w 2025 r. */
export const PES_2025: { field: string; spring: PesCount; autumn: PesCount }[] = [
  { field: 'Medycyna rodzinna', spring: { n: 348, passed: 259 }, autumn: { n: 335, passed: 275 } },
  { field: 'Choroby wewnętrzne', spring: { n: 307, passed: 234 }, autumn: { n: 226, passed: 179 } },
  { field: 'Pediatria', spring: { n: 193, passed: 161 }, autumn: { n: 234, passed: 209 } },
  { field: 'Psychiatria', spring: { n: 144, passed: 120 }, autumn: { n: 153, passed: 131 } },
  { field: 'Anestezjologia', spring: { n: 135, passed: 111 }, autumn: { n: 117, passed: 93 } },
  { field: 'Położnictwo i ginekologia', spring: { n: 121, passed: 104 }, autumn: { n: 114, passed: 101 } },
  { field: 'Kardiologia', spring: { n: 136, passed: 108 }, autumn: { n: 92, passed: 66 } },
];

/** Suma obu sesji i odsetek zdanych (%). */
export const pesYear = ({ spring, autumn }: { spring: PesCount; autumn: PesCount }) => {
  const n = spring.n + autumn.n;
  const passed = spring.passed + autumn.passed;
  return { n, passed, rate: share(passed, n) };
};
