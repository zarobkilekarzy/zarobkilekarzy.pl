/**
 * Analiza /analizy/specjalizacja-lekarska/: droga od stażu do tytułu specjalisty.
 * Tekst i przypisy są w content/articles/specjalizacja-lekarska.mdx; pensje rezydentów
 * i zobowiązanie do pracy w Polsce bierzemy z data/wedlug-specjalizacji.ts.
 *
 * Aktualizacja:
 * - po każdej sesji PES: PES_SESSIONS (listy wyników CEM, wszystkie dziedziny),
 * - po każdym naborze: miejsca rezydenckie i pozarezydenckie w tekście (wykaz CMKP),
 * - nowa wersja programu CMKP: PROGRAMS (kursy, zabiegi, dyżury) i adresy w LINKS.
 */
import type { CompareTable } from '@/types';
import { formatPL } from '@/lib/format';
import { PES_2025, pesYear } from '@/data/odsiew-na-medycynie';

/** Adresy przy liczbach w blokach; te same publikacje są w przypisach artykułu. */
export const LINKS = {
  physiciansAct: 'https://api.sejm.gov.pl/eli/acts/DU/2026/37/text.pdf',
  specAct: 'https://api.sejm.gov.pl/eli/acts/DU/2023/975/text.pdf',
  cmkpPlaces: 'https://www.cmkp.edu.pl/wp-content/uploads/2026/08/LICZBA-miejsc-na-postepowanie-jesien-2026.pdf',
  pes: 'https://www.cem.edu.pl/spece_results_h.php',
  programs: 'https://www.cmkp.edu.pl/ksztalcenie/podyplomowe/lekarze-i-lekarze-dentysci/modulowe-programy-specjalizacji-lekarskich-2023',
  surgery: 'https://www.cmkp.edu.pl/wp-content/uploads/2023/04/0703-program-1-2.pdf',
  internal: 'https://www.cmkp.edu.pl/wp-content/uploads/2024/04/0705-program-1.pdf',
  cardiology: 'https://www.cmkp.edu.pl/wp-content/uploads/2024/08/0748-program-1.pdf',
  family: 'https://www.cmkp.edu.pl/wp-content/uploads/2023/02/0713-program-1.pdf',
} as const;

const share = (part: number, whole: number) => (part / whole) * 100;

/* ── Czas trwania ───────────────────────────────────────────────────────────── */

/*
 * Rozporządzenie MZ w sprawie specjalizacji lekarzy i lekarzy dentystów (Dz.U. 2023 poz. 975),
 * załącznik nr 1 (77 specjalizacji lekarskich) i nr 5 (łączny minimalny czas szkolenia).
 * 69 = specjalizacje, które można zacząć bez wcześniejszej specjalizacji; pozostałe 8 dopiero
 * po innej (zał. nr 5, kolumna „wymagana specjalizacja II stopnia lub tytuł specjalisty”).
 * Moduły: 29 jednolitych (zał. nr 4), 40 z modułem podstawowym (zał. nr 3). Liczenie własne;
 * te same czasy podają programy CMKP dla lekarzy bez specjalizacji (odczyt 27.10.2026).
 */
export const FIELDS = { all: 77, direct: 69, single: 29, modular: 40, afterOther: 8, basicModules: 5 } as const;

export const DURATIONS = [
  { label: '4 lata', value: 17 },
  { label: '4,5 roku (radiologia i diagnostyka obrazowa)', value: 1 },
  { label: '5 lat', value: 33 },
  { label: '6 lat', value: 18 },
];

/** Wiersze DotRows: 1 kropka = 1 specjalizacja; ostatni wiersz — 8 specjalizacji dopiero po innej (6–10 lat łącznie). */
export const durationRows = [
  ...DURATIONS.map((d) => ({ label: d.label, value: d.value, display: formatPL(d.value) })),
  { label: 'dopiero po innej specjalizacji', value: FIELDS.afterOther, display: formatPL(FIELDS.afterOther), kind: 'mid' as const, note: 'od 6 do 10 lat razem z wcześniejszą specjalizacją' },
];

/** Pięć albo sześć lat — udział w 77 specjalizacjach (teza ilustracji). */
export const fiveOrSix = { count: 33 + 18, share: formatPL(share(33 + 18, FIELDS.all), 1) };

/*
 * Osoby w szkoleniu specjalizacyjnym: 31 509 lekarzy i lekarzy dentystów na 30.09.2025 (MZ, odpowiedź na interpelację
 * nr 13211, 1.12.2025; pod koniec 2015 r. 23 582) — bez podziału na tryby. Podział na tryby jest w NIK
 * („Zasoby kadry medycznej w systemie ochrony zdrowia”, P/22/047, s. 43) na 30.06.2022.
 */
export const IN_TRAINING = { date: '30 września 2025 r.', all: 31509, in2015: 23582 } as const;
export const IN_TRAINING_2022 = { all: 27944, resident: 21933, nonResident: 6011 } as const;

/*
 * Budżet państwa, część 46 – Zdrowie, rozdział 85157 „Staże i specjalizacje medyczne” (tys. zł). 2025: NIK, „Wykonanie
 * budżetu państwa w 2025 r. w części 46 – Zdrowie…”, P/26/001, s. 44 (ustawa budżetowa, wykonanie); 2026: ustawa
 * budżetowa na 2026 r., Dz.U. 2026 poz. 62, zał. nr 2. Według MZ (Komisja Zdrowia nr 149, 18.06.2026, s. 6) to środki na
 * szkolenia w trybie rezydentury (lekarze, lekarze dentyści, pielęgniarki i położne), z czego 3 973 000 tys. zł na
 * specjalizacje lekarskie. Rozbicia na pensje, dyżury i składki w dokumentach nie ma.
 */
export const BUDGET = { year: 2025, planned: 5_786_000, spent: 3_973_963.7, plan2026: 5_312_142 } as const;
export const budget = {
  spentBn: formatPL(BUDGET.spent / 1e6, 2),
  plannedBn: formatPL(BUDGET.planned / 1e6, 2),
  plan2026Bn: formatPL(BUDGET.plan2026 / 1e6, 2),
  share: formatPL(share(BUDGET.spent, BUDGET.planned), 1),
};

/* ── Inne kraje ──────────────────────────────────────────────────────────────── */

/*
 * Liczba specjalizacji według list urzędowych (liczenie własne, odczyt 28.10.2026; notatka
 * research/specjalizacja-lekarska/kraje.md). `start` — specjalizacje, które można zacząć bez innej;
 * `all` — razem z dziedzinami szczegółowymi albo dodatkowymi, robionymi po specjalizacji lub w jej ramach:
 * - Polska: 69 + 8 dopiero po innej specjalizacji (rozporządzenie MZ, Dz.U. 2023 poz. 975, zał. nr 1 i 5);
 * - Czechy: 43 specjalizacje (ustawa 95/2004 Sb., zał. nr 1) + 46 „nástavbových” (rozporządzenie 152/2018 Sb., zał. nr 1);
 * - Niemcy: 51 „Facharzt” + 19 „Schwerpunkt” (wzorcowa ordynacja BÄK 2018, wersja z 3.07.2026; bez Zusatz-Weiterbildung);
 * - Szwecja: 44 „basspecialiteter” + 9 „grenspecialiteter” + 10 „tilläggsspecialiteter” (HSLF-FS 2021:8, 6 kap. 1 §).
 * Hiszpanii nie ma na wykresie: 43 specjalności (RD 183/2008), drugiego poziomu nie ustaliliśmy.
 */
export const COUNTRIES = [
  { label: 'Polska', start: 69, all: 77 },
  { label: 'Czechy', start: 43, all: 89 },
  { label: 'Niemcy', start: 51, all: 70 },
  { label: 'Szwecja', start: 44, all: 63 },
];

export const countryColumns = COUNTRIES.map((c) => ({
  label: c.label,
  value: c.start,
  display: formatPL(c.start),
  pair: { value: c.all, display: formatPL(c.all) },
}));

/* ── Miejsca szkoleniowe ─────────────────────────────────────────────────────── */

/*
 * Wykaz CMKP na sesję jesień 2026 (publikacja 27.08.2026): suma 16 województw, liczenie własne; w każdym województwie
 * suma dziedzin zgadza się z wierszem „Suma”. 83 dziedziny, razem z lekarsko-dentystycznymi; rezydenckie z 69 doktoranckimi.
 * Na wykresie pięć dziedzin z największą liczbą miejsc rezydenckich.
 */
export const PLACES_2026 = {
  fields: 83,
  rez: 6530,
  nonRez: 7752,
  top: [
    { name: 'Choroby wewnętrzne', rez: 774, nonRez: 2373 },
    { name: 'Medycyna rodzinna', rez: 749, nonRez: 1429 },
    { name: 'Pediatria', rez: 443, nonRez: 248 },
    { name: 'Medycyna ratunkowa', rez: 331, nonRez: 283 },
    { name: 'Chirurgia ogólna', rez: 297, nonRez: 139 },
  ],
};

/** Choroby wewnętrzne i medycyna rodzinna: udział w miejscach pozarezydenckich (teza wykresu). */
export const twoFieldsNonRezShare = share(PLACES_2026.top[0].nonRez + PLACES_2026.top[1].nonRez, PLACES_2026.nonRez);

export const placesColumns = PLACES_2026.top.map((f) => ({
  label: f.name,
  value: f.rez,
  display: formatPL(f.rez),
  pair: { value: f.nonRez, display: formatPL(f.nonRez) },
}));

/* ── Programy ───────────────────────────────────────────────────────────────── */

/*
 * Programy CMKP dla lekarzy bez specjalizacji: chirurgia ogólna (wersja 2023), choroby wewnętrzne
 * i kardiologia (aktualizacja 2024), medycyna rodzinna (2023). Kursy — liczba pozycji i suma dni
 * z tabel „Kursy specjalizacyjne” obu modułów (liczenie własne). Zabiegi — minimalne liczby
 * z kodem A („wykonywanie samodzielne z asystą lub pod nadzorem kierownika specjalizacji albo
 * lekarza specjalisty przez niego wyznaczonego”). Kardiologia zaczyna się od modułu podstawowego
 * chorób wewnętrznych (ten sam co w internie). Dyżury: rozdział „Pełnienie dyżurów medycznych”;
 * w programie medycyny rodzinnej takiego rozdziału nie ma.
 */
export const PROGRAMS_TABLE: CompareTable = {
  columns: ['', 'Chirurgia ogólna', 'Choroby wewnętrzne', 'Kardiologia', 'Medycyna rodzinna'],
  rows: [
    { cells: ['Czas szkolenia', '6 lat (2 + 4)', '5 lat (2 + 3)', '5 lat (2 lata chorób wewnętrznych + 3)', '4 lata, jeden moduł'] },
    { cells: ['Kursy', '12 kursów, 31 dni', '12 kursów, 41 dni', '28 kursów, 63 dni', '16 kursów, 60 dni'] },
    {
      cells: [
        'Zabiegi wykonane samodzielnie, przykłady',
        '500 operacji, w tym 65 przepuklin pachwinowych i 60 na drogach żółciowych',
        '30 badań EKG z oceną, 20 cewnikowań pęcherza i 10 nakłuć jamy opłucnej w module podstawowym',
        '200 badań EKG i 200 badań echokardiograficznych przezklatkowych w module kardiologii',
        '10 wizyt patronażowych u noworodka, 10 badań bilansowych w pierwszym roku życia, 2 stwierdzenia zgonu',
      ],
      marked: true,
    },
    { cells: ['Dyżury w programie', 'średnio 10 godz. 5 min tygodniowo', 'średnio 10 godz. 5 min tygodniowo', 'średnio 10 godz. 5 min tygodniowo', 'program ich nie określa'] },
  ],
};

export const programSources = [
  { label: 'CMKP, program specjalizacji w dziedzinie chirurgii ogólnej (2023)', href: LINKS.surgery },
  { label: 'CMKP, program specjalizacji w dziedzinie chorób wewnętrznych (aktualizacja 2024)', href: LINKS.internal },
  { label: 'CMKP, program specjalizacji w dziedzinie kardiologii (aktualizacja 2024)', href: LINKS.cardiology },
  { label: 'CMKP, program specjalizacji w dziedzinie medycyny rodzinnej (2023)', href: LINKS.family },
];

/*
 * Przebieg czterech programów moduł po module (blok ProgramPlan). Tabele „Przebieg szkolenia specjalizacyjnego” z programów CMKP:
 * tygodnie staży, dni kursów, samokształcenia, urlopów i dni wolnych. W każdym module suma dni zgadza się z programem
 * (np. chirurgia ogólna 522 + 1044). Programy podają staże na moduł; rok modułu podaje tylko program chirurgii ogólnej.
 */
export type PlanKind = 'base' | 'dir' | 'course' | 'self' | 'leave';
export interface PlanPart { kind: PlanKind; name: string; days: number; year?: string }
export interface PlanModule { name: string; years: number; parts: PlanPart[]; courses: number }
export interface ProgramPlan { id: string; name: string; modules: PlanModule[] }

const planModule = (
  name: string,
  years: number,
  baseWeeks: number,
  dirs: [string, number, string?][],
  courses: { count: number; days: number },
  selfDays: number,
  leaveDays: number,
): PlanModule => ({
  name,
  years,
  courses: courses.count,
  parts: [
    { kind: 'base', name: 'Staż podstawowy', days: baseWeeks * 5 },
    ...dirs.map(([dirName, weeks, year]): PlanPart => ({ kind: 'dir', name: dirName, days: weeks * 5, year })),
    { kind: 'course', name: 'Kursy', days: courses.days },
    { kind: 'self', name: 'Samokształcenie', days: selfDays },
    { kind: 'leave', name: 'Urlopy i dni wolne', days: leaveDays },
  ],
});

const INTERNAL_BASIC = planModule('Moduł podstawowy: choroby wewnętrzne', 2, 67, [['Intensywna opieka medyczna', 4], ['Szpitalny oddział ratunkowy', 12]], { count: 10, days: 26 }, 3, 78);

export const PROGRAM_PLANS: ProgramPlan[] = [
  {
    id: 'chirurgia',
    name: 'Chirurgia ogólna',
    modules: [
      planModule('Moduł podstawowy', 2, 63, [
        ['Ortopedia i traumatologia', 6],
        ['Anestezjologia i intensywna terapia', 2],
        ['Chirurgia laparoskopowa', 4],
        ['Poradnia chirurgii ogólnej', 4],
        ['Szpitalny oddział ratunkowy', 6, 'rok 2'],
      ], { count: 6, days: 15 }, 4, 78),
      planModule('Moduł specjalistyczny', 4, 128, [
        ['Ultrasonografia', 2, 'rok 1'],
        ['Chirurgia naczyniowa', 4, 'rok 1 lub 2'],
        ['Endoskopia', 4, 'rok 1 lub 2'],
        ['Ortopedia i traumatologia', 4, 'rok 2'],
        ['Chirurgia nowotworów', 4, 'rok 3'],
        ['Chirurgia laparoskopowa', 8, 'rok 3 lub 4'],
        ['Neurotraumatologia', 2, 'rok 3 lub 4'],
        ['Chirurgia klatki piersiowej', 4, 'rok 4'],
        ['Urologia', 4, 'rok 4'],
        ['Chirurgia ogólna w innym ośrodku', 8, 'rok 4'],
      ], { count: 6, days: 16 }, 6, 162),
    ],
  },
  {
    id: 'interna',
    name: 'Choroby wewnętrzne',
    modules: [
      { ...INTERNAL_BASIC, name: 'Moduł podstawowy' },
      planModule('Moduł specjalistyczny', 3, 89, [
        ['Kardiologia', 4], ['Choroby płuc', 3], ['Gastroenterologia', 3], ['Endokrynologia', 3], ['Nefrologia', 3], ['Hematologia', 3],
        ['Reumatologia', 3], ['Choroby zakaźne', 3], ['Medycyna paliatywna', 2], ['Psychiatria', 4], ['Szpitalny oddział ratunkowy', 8],
      ], { count: 2, days: 15 }, 5, 123),
    ],
  },
  {
    id: 'kardiologia',
    name: 'Kardiologia',
    modules: [
      INTERNAL_BASIC,
      planModule('Moduł specjalistyczny', 3, 64, [
        ['Intensywna terapia kardiologiczna', 16], ['Elektrofizjologia i elektroterapia', 8], ['Kardiologia interwencyjna', 8], ['Echokardiografia', 4],
        ['Kardiologia dziecięca', 4], ['Wady serca u dorosłych', 4], ['Kardiochirurgia', 4], ['Nieinwazyjna diagnostyka elektrokardiograficzna', 6],
        ['Radiologia i diagnostyka obrazowa', 4], ['Angiologia', 2],
      ], { count: 18, days: 37 }, 3, 123),
    ],
  },
  {
    id: 'rodzinna',
    name: 'Medycyna rodzinna',
    modules: [
      planModule('Moduł jednolity', 4, 99, [
        ['Choroby wewnętrzne', 13], ['Diabetologia', 4], ['Kardiologia', 4], ['Pediatria', 21], ['Chirurgia ogólna', 3], ['Szpitalny oddział ratunkowy', 4],
        ['Neonatologia', 2], ['Psychiatria', 3], ['Geriatria', 2], ['Dermatologia', 2], ['Otorynolaryngologia', 2], ['Medycyna paliatywna', 4],
      ], { count: 16, days: 60 }, 7, 162),
    ],
  },
];

export const moduleDays = (m: PlanModule) => m.parts.reduce((n, p) => n + p.days, 0);
const planDays = (p: ProgramPlan) => p.modules.reduce((n, m) => n + moduleDays(m), 0);
const baseDays = (p: ProgramPlan) => p.modules.reduce((n, m) => n + m.parts[0].days, 0);

/** Staż podstawowy jako odsetek dni szkolenia w danym programie (teza bloku). */
export const planBaseShare = (p: ProgramPlan) => share(baseDays(p), planDays(p));

/* ── PES ────────────────────────────────────────────────────────────────────── */

/*
 * Część testowa Państwowego Egzaminu Specjalizacyjnego, wszystkie dziedziny, lekarze i lekarze
 * dentyści, wszystkie podejścia (jeden numer kodowy = jedno podejście; zdane = co najmniej 60%).
 * `first*` — statystyki „przystępujący po raz pierwszy” dołączone do list CEM. Odczyt 21.10.2026
 * (research/db/sources/pes-cem-2026-10/pes.json). Jesień 2025 i wiosna 2026 zgadzają się co do
 * osoby z tabelą MZ w odpowiedzi na interpelację nr 18220. Jesień 2026 w toku — poza wykresem.
 */
interface PesSession {
  label: string;
  sub: string;
  n: number;
  passed: number;
  firstN: number;
  firstPassed: number;
}

export const PES_SESSIONS: PesSession[] = [
  { label: 'wiosna', sub: '2023', n: 2784, passed: 2128, firstN: 2181, firstPassed: 1897 },
  { label: 'jesień', sub: '2023', n: 2689, passed: 2069, firstN: 2086, firstPassed: 1829 },
  { label: 'wiosna', sub: '2024', n: 2853, passed: 2281, firstN: 2197, firstPassed: 2006 },
  { label: 'jesień', sub: '2024', n: 2533, passed: 1910, firstN: 2000, firstPassed: 1737 },
  { label: 'wiosna', sub: '2025', n: 2813, passed: 2189, firstN: 2142, firstPassed: 1931 },
  { label: 'jesień', sub: '2025', n: 2686, passed: 2224, firstN: 2259, firstPassed: 2010 },
  { label: 'wiosna', sub: '2026', n: 2531, passed: 2085, firstN: 2069, firstPassed: 1871 },
];

const pct = (v: number) => formatPL(v, 1);

export const pesRows = PES_SESSIONS.map((s) => ({
  ...s,
  rate: share(s.passed, s.n),
  firstRate: share(s.firstPassed, s.firstN),
}));


const last = pesRows[pesRows.length - 1];
const when = { wiosna: 'Wiosną', jesień: 'Jesienią' } as Record<string, string>;
export const pesLatest = { when: `${when[last.label]} ${last.sub} r.`, rate: pct(last.rate), firstRate: pct(last.firstRate) };

/*
 * Pierwsze i kolejne podejścia do testu PES, rok po roku (2026 = sama sesja wiosenna). Tylko listy,
 * do których CEM dołączył statystykę „przystępujący po raz pierwszy” (bez 1–2 list rocznie):
 * `n`/`passed` — wszystkie podejścia na tych listach, `firstN`/`firstPassed` — pierwsze podejścia;
 * kolejne = różnica (każde podejście poza pierwszym; CEM nie podaje, dlaczego ktoś podchodzi znowu).
 * Liczenie własne z research/db/sources/pes-cem-2026-10/pes.json.
 */
const PES_BY_YEAR = [
  { label: '2023', n: 5448, passed: 4172, firstN: 4267, firstPassed: 3726 },
  { label: '2024', n: 5366, passed: 4173, firstN: 4197, firstPassed: 3743 },
  { label: '2025', n: 5486, passed: 4404, firstN: 4401, firstPassed: 3941 },
  { label: 'wiosna 2026', n: 2518, passed: 2072, firstN: 2069, firstPassed: 1871 },
];

export const pesAttempts = PES_BY_YEAR.map((y) => {
  const repeatN = y.n - y.firstN;
  const repeatPassed = y.passed - y.firstPassed;
  return { ...y, repeatN, repeatPassed, first: share(y.firstPassed, y.firstN), repeat: share(repeatPassed, repeatN) };
});

export const pesAttemptColumns = pesAttempts.map((y) => ({
  label: y.label,
  value: y.first,
  display: `${pct(y.first)}%`,
  pair: { value: y.repeat, display: `${pct(y.repeat)}%` },
}));

export const pesAttemptRange = {
  first: [pct(Math.min(...pesAttempts.map((y) => y.first))), pct(Math.max(...pesAttempts.map((y) => y.first)))],
  repeat: [pct(Math.min(...pesAttempts.map((y) => y.repeat))), pct(Math.max(...pesAttempts.map((y) => y.repeat)))],
};

export const pes2025 = pesAttempts.find((y) => y.label === '2025')!;

/*
 * Test PES w 2025 r. w siedmiu dziedzinach z największą liczbą podejść (te same liczby co infografika
 * „zdawalność PES” z analizy o odsiewie, data/odsiew-na-medycynie.ts): najniższy i najwyższy odsetek.
 */
const LOCATIVE: Record<string, string> = {
  'Medycyna rodzinna': 'medycynie rodzinnej',
  'Choroby wewnętrzne': 'chorobach wewnętrznych',
  Pediatria: 'pediatrii',
  Psychiatria: 'psychiatrii',
  Anestezjologia: 'anestezjologii',
  'Położnictwo i ginekologia': 'położnictwie i ginekologii',
  Kardiologia: 'kardiologii',
};
const fieldRates = PES_2025.map((d) => ({ in: LOCATIVE[d.field], rate: pesYear(d).rate })).sort((a, b) => a.rate - b.rate);
export const pesFields = {
  count: PES_2025.length,
  low: { in: fieldRates[0].in, rate: pct(fieldRates[0].rate) },
  high: { in: fieldRates[fieldRates.length - 1].in, rate: pct(fieldRates[fieldRates.length - 1].rate) },
};

/*
 * Część ustna: tylko tabela MZ w odpowiedzi na interpelację nr 18220 (20.07.2026), suma dziedzin —
 * przystąpili do egzaminu ustnego / zdali. CEM wyników ustnej nie publikuje.
 */
export const PES_ORAL = [
  { session: 'jesienią 2025 r.', n: 1135, passed: 1057 },
  { session: 'wiosną 2026 r.', n: 984, passed: 875 },
].map((o) => ({ ...o, rate: pct(share(o.passed, o.n)) }));
