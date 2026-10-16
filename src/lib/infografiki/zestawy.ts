/**
 * Zestawy infografik do pobrania (szablon: ./render.ts, endpoint: pages/infografiki/,
 * sekcja na stronie: blocks/Infographics). Klucz = ostatni człon trasy strony.
 *
 * Liczby wyłącznie z modułów danych stron — te same funkcje, z których liczy tekst artykułu,
 * więc aktualizacja danych zmienia grafiki w następnym buildzie.
 */
import { COUNTRIES, FIRST_YEAR, LAST_YEAR, REVOCATIONS, WINDOW, ratePer100k, total, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { LATEST } from '@/data/english-division';
import { dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { BUDGET, CURRENT, DRAFT_2027, GAP_2027, budget, formatMld } from '@/data/budzet-nfz';
import { MEDIAN_WAGES, OUT_OF_POCKET, TO, WHC_EDITIONS, WHC_LATEST, contribution } from '@/data/kolejki';
import { DEFAULTS, LIMIT_TODAY, PRESETS, REGISTER_TOTAL, YEAR0, YEAR_MIN, seats, simulate } from '@/lib/podaz/model';
import { formatPL } from '@/lib/format';
import type { ComparisonRow, DataTable, InfographicSet, SplitBar, SplitSegment } from './render';

const span = `${WINDOW.from}–${WINDOW.to}`;
// na grafice liczby całkowite: to porównanie rzędu wielkości, nie co do przecinka
const country = (key: CountryKey): ComparisonRow => {
  const c = COUNTRIES.find((x) => x.key === key)!;
  const value = ratePer100k(key);
  return { label: c.name, sub: c.body, value, display: formatPL(value), highlight: key === 'pl' };
};
const rows = [country('no'), country('se'), country('uk'), country('pl')];

// tabela rok po roku: Polska pierwsza, jak w tabeli w artykule (RevocationTable); pod latami suma
// i wskaźnik na 100 tys. z okna porównania — liczby całkowite, jak na grafice z porównaniem krajów
const years = `${FIRST_YEAR}–${LAST_YEAR}`;
const revocationTable: DataTable = {
  periods: REVOCATIONS.map((r) => String(r.year)),
  series: COUNTRIES.map((c) => ({ label: c.name, sub: c.body, values: REVOCATIONS.map((r) => r[c.key]), highlight: c.key === 'pl' })),
  summary: [
    { label: 'Razem', sub: years, values: COUNTRIES.map((c) => formatPL(total(c.key))) },
    { label: 'Na 100 tys.', sub: `rocznie ${span}`, values: COUNTRIES.map((c) => formatPL(ratePer100k(c.key))) },
  ],
};

const odpowiedzialnosc: InfographicSet = {
  route: '/analizy/odpowiedzialnosc-zawodowa-lekarzy/',
  page: 'Analiza: Najwyższa kara, której prawie się nie orzeka',
  filePrefix: 'zarobkilekarzy-prawo-do-zawodu',
  items: [
    {
      id: 'porownanie-krajow',
      title: 'Ilu lekarzom odebrano prawo do zawodu',
      measure: `na 100 tys. lekarzy rocznie · ${span}`,
      rows,
      sources: 'Źródła: Helsetilsynet, HSAN, GMC, NIL · definicje różnią się między krajami',
      alt: `Infografika: odebrania prawa do zawodu lekarzom na 100 tys. lekarzy, średnio rocznie w latach ${span}: ${rows.map((r) => `${r.label} ${r.display}`).join(', ')}. Definicje różnią się między krajami. Źródła: Helsetilsynet, HSAN, GMC, NIL.`,
    },
    {
      id: 'rok-po-roku',
      title: 'Ilu lekarzom odebrano prawo do zawodu',
      measure: `liczba odebrań rok po roku · ${years}`,
      table: revocationTable,
      sources: 'Źródła: Helsetilsynet, HSAN, GMC, NIL · definicje różnią się między krajami',
      alt: `Infografika: liczba odebrań prawa do zawodu lekarzom rok po roku w latach ${years}. Razem: ${COUNTRIES.map((c) => `${c.name} ${total(c.key)}`).join(', ')}. Średnio rocznie na 100 tys. lekarzy w latach ${span}: ${COUNTRIES.map((c) => `${c.name} ${formatPL(ratePer100k(c.key))}`).join(', ')}. ${REVOCATIONS.map((r) => `${r.year}: ${COUNTRIES.map((c) => `${c.name} ${r[c.key]}`).join(', ')}`).join('; ')}. Definicje różnią się między krajami. Źródła: Helsetilsynet, HSAN, GMC, NIL.`,
    },
  ],
};

// odsetki z jednym miejscem po przecinku — tak podają je źródła (CEM liczymy z dwóch liczb)
const examRows: ComparisonRow[] = EXAMS_2025.map((e) => ({
  label: e.name,
  sub: e.note,
  value: passRate(e),
  display: formatPL(passRate(e), 1),
  highlight: e.key === 'lek',
}));

const egzamin: InfographicSet = {
  route: '/egzamin/',
  page: 'Egzamin LEK online: jawna baza pytań',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'zdawalnosc-egzaminow',
      title: 'Jaka część zdających zdaje egzamin',
      measure: 'odsetek przystępujących z wynikiem pozytywnym · 2025',
      unit: '%',
      rows: examRows,
      sources: 'Źródła: CEM, Min. Sprawiedliwości, PIIB, IARP, Min. Infrastruktury · wszystkie podejścia',
      alt: `Infografika: odsetek zdających, którzy zdali egzamin w 2025 r. (wszystkie podejścia): ${EXAMS_2025.map((e) => `${e.name} ${formatPL(passRate(e), 1)}% (${e.note})`).join(', ')}. Źródła: CEM, Ministerstwo Sprawiedliwości, PIIB, Izba Architektów RP, Ministerstwo Infrastruktury.`,
    },
  ],
};

/* ---------- Miejsca na medycynie i English Division ---------- */

// stacjonarne po polsku (z pulą dla cudzoziemców) z tego samego rozporządzenia co LATEST; brak roku wywraca build
const stationaryRow = dayRows.find((r) => r.label === LATEST.year);
if (!stationaryRow) throw new Error(`[infografiki] brak miejsc stacjonarnych ${LATEST.year} w ciecie-limitow-na-medycyne`);
const stationary = stationaryRow.value;
const extramural = LATEST.total - LATEST.foreign - stationary;
const shareOf = (n: number) => `${formatPL((100 * n) / LATEST.total, 1)}%`;
const seatSegments: SplitSegment[] = [
  { label: 'Stacjonarne', sub: 'po polsku', value: stationary, display: formatPL(stationary), share: shareOf(stationary), tone: 'slate' },
  { label: 'Niestacjonarne', sub: 'po polsku, płatne', value: extramural, display: formatPL(extramural), share: shareOf(extramural), tone: 'soft' },
  { label: 'W języku obcym', sub: 'English Division, płatne', value: LATEST.foreign, display: formatPL(LATEST.foreign), share: shareOf(LATEST.foreign), tone: 'blue' },
];

const foreignShare = (100 * LATEST.foreign) / LATEST.total;
const edBars: SplitBar[] = [
  {
    label: `Miejsca na I roku, ${LATEST.year}`,
    segments: [
      { label: 'po angielsku', sub: 'English Division', value: foreignShare, display: formatPL(foreignShare, 1), tone: 'blue' },
      { label: 'po polsku', value: 100 - foreignShare, display: formatPL(100 - foreignShare, 1), tone: 'slate' },
    ],
  },
  {
    // ELA: < 1% absolwentów-cudzoziemców nauk medycznych pracuje w Polsce rok po dyplomie (dyplomy z 2021 r.);
    // segment rysowany jako 1% — górna granica
    label: 'Absolwenci-cudzoziemcy rok po dyplomie',
    segments: [
      { label: 'pracuje w Polsce', value: 1, display: '<1', tone: 'blue' },
      { label: 'nie pracuje w Polsce', value: 99, display: '>99', tone: 'slate' },
    ],
  },
];

const englishDivision: InfographicSet = {
  route: '/analizy/english-division/',
  page: 'Analiza: English Division — kogo naprawdę kształcimy',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'miejsca-na-medycynie',
      title: 'Ile miejsc na medycynie i na jakich studiach',
      measure: `limit przyjęć na kierunek lekarski · ${LATEST.year} · razem ${formatPL(LATEST.total)}`,
      split: { bars: [{ segments: seatSegments }] },
      sources: `Źródło: rozporządzenie MZ, Dz.U. ${LATEST.act.label} · miejsca w limicie, nie liczba przyjętych`,
      alt: `Infografika: limit przyjęć na kierunek lekarski w roku ${LATEST.year} — razem ${formatPL(LATEST.total)} miejsc: studia stacjonarne po polsku ${formatPL(stationary)}, niestacjonarne po polsku (płatne) ${formatPL(extramural)}, w języku obcym (English Division, płatne) ${formatPL(LATEST.foreign)}. Źródło: rozporządzenie Ministra Zdrowia, Dz.U. ${LATEST.act.label}.`,
    },
    {
      id: 'english-division',
      title: 'Co szóste miejsce na medycynie jest po angielsku',
      measure: `udział w limicie przyjęć ${LATEST.year} · praca w Polsce rok po dyplomie`,
      split: { unit: '%', bars: edBars },
      sources: `Źródła: Dz.U. ${LATEST.act.label}, ELA (dyplomy z 2021 r.) · osobna rekrutacja, pełne czesne`,
      alt: `Infografika: studia w języku obcym (English Division) to ${formatPL(foreignShare, 1)}% miejsc w limicie przyjęć na kierunek lekarski w roku ${LATEST.year} (${formatPL(LATEST.foreign)} z ${formatPL(LATEST.total)}). Rok po dyplomie w Polsce pracuje mniej niż 1% absolwentów-cudzoziemców nauk medycznych (ELA, dyplomy z 2021 r.). To osobna rekrutacja i płatne studia. Źródła: rozporządzenie Ministra Zdrowia, Dz.U. ${LATEST.act.label}; Ekonomiczne Losy Absolwentów.`,
    },
  ],
};

/* ---------- Symulator podaży: nabór jak dziś i dwa warianty zespołu NIL ---------- */

const HORIZON = 2050;
// losy rocznika jak w symulatorze (DEFAULTS = wartości zmierzone): odsiew na studiach, wyjazdy, napływ z zagranicy, emerytury
const scenario = (id: string) => {
  const intake = PRESETS.find((p) => p.id === id)!.intake();
  const points = simulate(intake, DEFAULTS).filter((p) => p.year <= HORIZON);
  return { intake, points, doctors: points.at(-1)!.doctors };
};
const [base, nilB, nilA] = [scenario('baza'), scenario('nil-b'), scenario('nil-a')];
const from2027 = (s: { intake: number[] }) => s.intake.slice(2027 - YEAR_MIN);
// na grafice w tysiącach: to projekcja modelu, nie liczenie co do osoby
const thousands = (n: number) => formatPL(Math.round(n / 1000));
const line = (s: { points: { year: number; doctors: number }[] }) => s.points.map((p) => ({ x: p.year, v: p.doctors / 1000 }));

const symulator: InfographicSet = {
  route: '/analizy/symulator-podazy-lekarzy/',
  page: 'Symulator podaży lekarzy 1987–2050',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: `lekarze-${HORIZON}`,
      title: `Ilu lekarzy będzie w ${HORIZON} roku`,
      measure: `lekarze wykonujący zawód, w tys. · studia kończy ${formatPL(DEFAULTS.graduate * 100)}%, ${formatPL(DEFAULTS.abroad * 100)}% wyjeżdża`,
      chart: {
        xMin: YEAR0,
        xMax: HORIZON,
        yMin: 150,
        yMax: 290,
        yTicks: [160, 200, 240, 280],
        xTicks: [YEAR0, 2030, 2035, 2040, 2045, HORIZON].map((y) => ({ x: y, label: String(y) })),
        markers: 'last',
        baseline: { v: REGISTER_TOTAL / 1000, label: `${formatPL(REGISTER_TOTAL)} — tylu jest dzisiaj.`, accent: 'Za mało.' },
        series: [
          { label: 'Nabór jak dziś', tone: 'blue', points: line(base), value: thousands(base.doctors), unit: 'tys.', detail: `${seats(LIMIT_TODAY)} rocznie` },
          { label: 'Wariant B zespołu NIL', tone: 'amber', points: line(nilB), value: thousands(nilB.doctors), unit: 'tys.', detail: `−9% rocznie, do ${seats(Math.min(...from2027(nilB)))}` },
          { label: 'Wariant A zespołu NIL', tone: 'red', points: line(nilA), value: thousands(nilA.doctors), unit: 'tys.', detail: `od 2027 r. ${seats(from2027(nilA)[0])} rocznie` },
        ],
        note: { x: HORIZON, v: base.doctors / 1000, lines: [`w ${HORIZON} r. wariant A wobec naboru jak dziś:`, `o ${thousands(base.doctors - nilA.doctors)} tys. lekarzy mniej`] },
      },
      sources: `Model: rejestr NIL, limity MZ, warianty NIL · napływ ${formatPL(DEFAULTS.inflow)}/rok, odejścia od ${DEFAULTS.retireAge} lat`,
      alt: `Infografika, wykres: projekcja liczby lekarzy wykonujących zawód do ${HORIZON} r. Dziś ${formatPL(REGISTER_TOTAL)} według rejestru NIL — tylu jest dzisiaj, za mało. W ${HORIZON} r.: przy naborze jak dziś (${seats(LIMIT_TODAY)} po polsku rocznie) ok. ${thousands(base.doctors)} tys., w wariancie B zespołu NIL ok. ${thousands(nilB.doctors)} tys., w wariancie A ok. ${thousands(nilA.doctors)} tys., czyli o ${thousands(base.doctors - nilA.doctors)} tys. mniej niż przy naborze jak dziś. Model zarobkilekarzy.pl uwzględnia odsiew na studiach (kończy ${formatPL(DEFAULTS.graduate * 100)}%), wyjazdy (${formatPL(DEFAULTS.abroad * 100)}%), napływ lekarzy z dyplomem zagranicznym (${formatPL(DEFAULTS.inflow)} rocznie) i odejścia od ${DEFAULTS.retireAge} lat.`,
    },
  ],
};

/* ---------- Pieniądze a kolejka: wykres indeksowy ---------- */

/*
 * Koszty NFZ, składka i dopłaty z kieszeni (co płacimy) obok kolejki.
 * Rok bazowy 2022 — jedyny, dla którego są wszystkie cztery serie: składka (mediana płac GUS, co dwa lata
 * i od 2024 co rok) i dopłaty (NRZ) zaczynają się w 2020 r., a w 2020 r. nie było Barometru WHC.
 * Zmiana w liczbach nad wykresem: od 2022 r. do ostatniego pomiaru danej serii.
 */
const BASE_YEAR = 2022;
const DRAFT_YEAR = 2027;
const SINCE = 2020;
const pct = (to: number, from: number) => `+${formatPL((to / from - 1) * 100)}%`;
const budgetIndex = (costs: number) => (costs / budget(BASE_YEAR).costs) * 100;
const medianOf = (year: number) => MEDIAN_WAGES.find((m) => m.year === year)!.median;
const oopOf = (year: number) => OUT_OF_POCKET.find((o) => o.year === year)!.value;
const whcOf = (year: number) => WHC_EDITIONS.find((e) => e.year === year)!;
const lastMedian = MEDIAN_WAGES.at(-1)!;
const lastOop = OUT_OF_POCKET.at(-1)!;
const yearly = (n: number) => formatPL(Math.round(n));
const queueLatestYear = Number(WHC_LATEST.label.slice(-4));

const kolejki: InfographicSet = {
  route: '/dane/kolejki/',
  page: 'Dane: Pieniądze a kolejka',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'pieniadze-a-kolejka',
      title: 'Pieniądze rosną.',
      titleAccent: 'Kolejka nie maleje.',
      measure: `indeks, ${BASE_YEAR} = 100 · zmiana od ${BASE_YEAR} r.`,
      chart: {
        xMin: SINCE,
        xMax: DRAFT_YEAR + 1,
        yMin: 70,
        yMax: 200,
        yTicks: [80, 100, 120, 140, 160, 180],
        xTicks: Array.from({ length: DRAFT_YEAR - SINCE + 1 }, (_, k) => ({ x: SINCE + k + 0.5, label: String(SINCE + k) })),
        series: [
          {
            label: 'Koszty NFZ',
            tone: 'blue',
            points: [
              ...BUDGET.filter((r) => r.year >= SINCE).map((r) => ({ x: r.year + 0.5, v: budgetIndex(r.costs) })),
              { x: DRAFT_YEAR + 0.5, v: budgetIndex(DRAFT_2027.total) },
            ],
            dashedFrom: CURRENT.year + 0.5,
            value: pct(budget(TO).costs, budget(BASE_YEAR).costs),
            detail: `z ${formatMld(budget(BASE_YEAR).costs)} do ${formatMld(budget(TO).costs)} mld zł (${TO})`,
          },
          {
            label: 'Składka zdrowotna',
            tone: 'amber',
            // mediana z października
            points: MEDIAN_WAGES.map((m) => ({ x: m.year + 0.8, v: (m.median / medianOf(BASE_YEAR)) * 100 })),
            value: pct(lastMedian.median, medianOf(BASE_YEAR)),
            detail: `z ${yearly(contribution(medianOf(BASE_YEAR)))} do ${yearly(contribution(lastMedian.median))} zł/rok (${lastMedian.year})`,
          },
          {
            label: 'Dopłaty z kieszeni',
            tone: 'slate',
            points: OUT_OF_POCKET.map((o) => ({ x: o.year + 0.5, v: (o.value / oopOf(BASE_YEAR)) * 100 })),
            value: pct(lastOop.value, oopOf(BASE_YEAR)),
            detail: `z ${formatMld(oopOf(BASE_YEAR))} do ${formatMld(lastOop.value)} mld zł (${lastOop.year})`,
          },
          {
            label: 'Kolejka',
            tone: 'red',
            points: WHC_EDITIONS.filter((e) => e.x >= SINCE).map((e) => ({ x: e.x, v: (e.single / whcOf(BASE_YEAR).single) * 100 })),
            value: pct(WHC_LATEST.single, whcOf(BASE_YEAR).single),
            detail: `z ${formatPL(whcOf(BASE_YEAR).single, 1)} do ${formatPL(WHC_LATEST.single, 1)} mies. (${queueLatestYear})`,
          },
        ],
        note: {
          x: DRAFT_YEAR + 0.5,
          v: budgetIndex(DRAFT_2027.total),
          lines: [`${DRAFT_YEAR}: ${formatMld(DRAFT_2027.total)} mld zł w projekcie planu`, `brakuje ok. ${GAP_2027.value} mld zł według Rady Fiskalnej`],
        },
      },
      sources: 'Źródła: plany NFZ, GUS, Barometr WHC, Rada Fiskalna · składka przy medianie płac: rachunek własny',
      alt: `Infografika, wykres indeksowy (${BASE_YEAR} = 100), lata ${SINCE}–${DRAFT_YEAR}. Od ${BASE_YEAR} r.: koszty w planie NFZ ${pct(budget(TO).costs, budget(BASE_YEAR).costs)} (z ${formatMld(budget(BASE_YEAR).costs)} do ${formatMld(budget(TO).costs)} mld zł w ${TO} r.), składka zdrowotna przy medianie płac ${pct(lastMedian.median, medianOf(BASE_YEAR))} (do ${yearly(contribution(lastMedian.median))} zł rocznie w ${lastMedian.year} r.), wydatki gospodarstw domowych na leczenie z własnej kieszeni ${pct(lastOop.value, oopOf(BASE_YEAR))} (do ${formatMld(lastOop.value)} mld zł w ${lastOop.year} r.), a średni czas oczekiwania na świadczenie według Barometru WHC ${pct(WHC_LATEST.single, whcOf(BASE_YEAR).single)} (z ${formatPL(whcOf(BASE_YEAR).single, 1)} do ${formatPL(WHC_LATEST.single, 1)} mies.). Projekt planu NFZ na ${DRAFT_YEAR} r.: ${formatMld(DRAFT_2027.total)} mld zł; Rada Fiskalna szacuje, że zabraknie ok. ${GAP_2027.value} mld zł.`,
    },
  ],
};

export const infographicSets: Record<string, InfographicSet> = {
  egzamin,
  'odpowiedzialnosc-zawodowa-lekarzy': odpowiedzialnosc,
  'english-division': englishDivision,
  'symulator-podazy-lekarzy': symulator,
  kolejki,
};
