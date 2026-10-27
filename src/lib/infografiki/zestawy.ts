/**
 * Zestawy infografik do pobrania (szablon: ./render.ts, endpoint: pages/infografiki/,
 * sekcja na dole strony: blocks/InfographicsSection — artykuły z ArticleLayout). Klucz = ostatni człon trasy strony.
 *
 * Liczby wyłącznie z modułów danych stron — te same funkcje, z których liczy tekst artykułu,
 * więc aktualizacja danych zmienia grafiki w następnym buildzie.
 */
import { COUNTRIES, FIRST_YEAR, LAST_YEAR, REVOCATIONS, WINDOW, ratePer100k, total, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { LATEST } from '@/data/english-division';
import { dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { BUDGET, CURRENT, DRAFT_2027, GAP_2027, budget, formatMld } from '@/data/budzet-nfz';
import { MEDIAN_WAGES, OUT_OF_POCKET, SPECIALISTS_2025, TO, WHC_EDITIONS, WHC_LATEST, contribution } from '@/data/kolejki';
import { SPZOZ_QUARTERS } from '@/data/zadluzenie';
import { AGE_BASE, AGE_LADDER } from '@/data/pielegniarstwo-w-polsce';
import { FIRST_YEAR as STUDENTS_FIRST_YEAR, LINKS as ODSIEW_LINKS, PES_2025, PES_2025_ALL, PES_LINK, funnelRows, pesYear } from '@/data/odsiew-na-medycynie';
import { DEFAULTS, LIMIT_TODAY, PRESETS, REGISTER_TOTAL, YEAR0, YEAR_MIN, seats, simulate } from '@/lib/podaz/model';
import { AOS_FIRST, AOS_LAST, LINKS as WIZYTA_LINKS, NIL_N, NO_CLINICAL, WHC_2022, WHC_2024, WORK_MODEL, combined, pct as change } from '@/data/wizyty-prywatne-kolejka-cena';
import { BEAN, NORI } from '@/data/ai-w-medycynie-2026';
import { SELF_GOVERNMENT_STANCES, SURPLUS_YEAR } from '@/data/reglamentacja-dostepu';
import { formatPL } from '@/lib/format';
import { monitoring } from '@/lib/monitoring';
import { monitoringMap, opennessP } from '@/lib/monitoring/map';
import type { ComparisonRow, DataTable, InfographicSet, SplitBar, SplitSegment } from './render';

const span = `${WINDOW.from}–${WINDOW.to}`;
// na grafice liczby całkowite: to porównanie rzędu wielkości, nie co do przecinka
const country = (key: CountryKey): ComparisonRow => {
  const c = COUNTRIES.find((x) => x.key === key)!;
  const value = ratePer100k(key);
  return { label: c.name, sub: c.body, value, display: formatPL(value), highlight: key === 'pl' };
};
const rows = [country('no'), country('se'), country('uk'), country('pl')];

// tabela rok po roku: Polska na końcu (w pionie skrajna prawa kolumna), jak na grafice z porównaniem
// krajów; pod latami suma i wskaźnik na 100 tys. z okna porównania — liczby całkowite
const years = `${FIRST_YEAR}–${LAST_YEAR}`;
const tableCountries = [...COUNTRIES.filter((c) => c.key !== 'pl'), ...COUNTRIES.filter((c) => c.key === 'pl')];
const revocationTable: DataTable = {
  periods: REVOCATIONS.map((r) => String(r.year)),
  series: tableCountries.map((c) => ({ label: c.name, sub: c.body, values: REVOCATIONS.map((r) => r[c.key]), highlight: c.key === 'pl' })),
  summary: [
    { label: 'Razem', sub: years, values: tableCountries.map((c) => formatPL(total(c.key))) },
    { label: 'Na 100 tys. lekarzy', sub: `rocznie ${span}`, values: tableCountries.map((c) => formatPL(ratePer100k(c.key))) },
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
      alt: `Infografika: liczba odebrań prawa do zawodu lekarzom rok po roku w latach ${years}. Razem: ${tableCountries.map((c) => `${c.name} ${total(c.key)}`).join(', ')}. Średnio rocznie na 100 tys. lekarzy w latach ${span}: ${tableCountries.map((c) => `${c.name} ${formatPL(ratePer100k(c.key))}`).join(', ')}. ${REVOCATIONS.map((r) => `${r.year}: ${tableCountries.map((c) => `${c.name} ${r[c.key]}`).join(', ')}`).join('; ')}. Definicje różnią się między krajami. Źródła: Helsetilsynet, HSAN, GMC, NIL.`,
    },
  ],
};

// odsetki z jednym miejscem po przecinku — tak podają je źródła (CEM liczymy z dwóch liczb); szacunek MF z dopiskiem pod liczbą
const examRows: ComparisonRow[] = EXAMS_2025.map((e) => ({
  label: e.name,
  sub: e.note,
  value: passRate(e),
  display: formatPL(passRate(e), 1),
  valueNote: e.approx ? 'szacunek' : undefined,
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
      sources: 'Źródła: CEM, Min. Sprawiedliwości, PIIB, IARP, Min. Infrastruktury, Min. Finansów · wszystkie podejścia',
      alt: `Infografika: odsetek zdających, którzy zdali egzamin w 2025 r. (wszystkie podejścia): ${EXAMS_2025.map((e) => `${e.name} ${formatPL(passRate(e), 1)}%${e.approx ? ' (szacunek)' : ''} (${e.note})`).join(', ')}. Doradca podatkowy: szacunek Ministerstwa Finansów podany w Sejmie, bez liczb za 2025 r. Źródła: CEM, Ministerstwo Sprawiedliwości, PIIB, Izba Architektów RP, Ministerstwo Infrastruktury, Ministerstwo Finansów.`,
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
    {
      // to samo co wyżej na planszach po 100 pól: 17,1% → 17 kropek w kobalcie; ELA podaje „mniej niż 1%”,
      // więc po prawej jedno pole pośrednie (mniejsza kropka), nie pełne
      id: 'na-eksport',
      title: 'Kształcimy lekarzy',
      titleAccent: 'na eksport',
      measure: `limit przyjęć ${LATEST.year} · praca w Polsce rok po dyplomie`,
      unit: '%',
      dots: {
        panels: [
          { display: formatPL(foreignShare, 1), label: 'miejsc na kierunku lekarskim to studia po angielsku', sub: `English Division · ${LATEST.year}`, blue: Math.round(foreignShare), blueCell: 'on', rest: 'on', from: 'end' },
          { display: '<1', label: 'z absolwentów-cudzoziemców pracuje w Polsce rok po dyplomie', sub: 'ELA · dyplomy z 2021 r.', blue: 1, blueCell: 'mid', rest: 'off', from: 'start' },
        ],
      },
      sources: `Źródła: Dz.U. ${LATEST.act.label}; ELA, dyplomy z 2021 r. · osobna rekrutacja, pełne czesne`,
      alt: `Infografika „Kształcimy lekarzy na eksport”: dwie plansze po 100 pól. Na pierwszej ${Math.round(foreignShare)} pól w kobalcie — studia w języku obcym (English Division) to ${formatPL(foreignShare, 1)}% miejsc w limicie przyjęć na kierunek lekarski w roku ${LATEST.year} (${formatPL(LATEST.foreign)} z ${formatPL(LATEST.total)}). Na drugiej jedno mniejsze pole: rok po dyplomie w Polsce pracuje mniej niż 1% absolwentów-cudzoziemców nauk medycznych (ELA, dyplomy z 2021 r.). To osobna rekrutacja i płatne studia. Źródła: rozporządzenie Ministra Zdrowia, Dz.U. ${LATEST.act.label}; Ekonomiczne Losy Absolwentów.`,
    },
  ],
};

/* ---------- Symulator podaży: nabór jak dziś i dwa warianty zespołu NIL ---------- */

const HORIZON = 2050;
// losy rocznika jak w symulatorze (DEFAULTS = wartości zmierzone): odsiew na studiach, wyjazdy, napływ z zagranicy, emerytury, zgony
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
        xMax: HORIZON + 9,
        yMin: 150,
        yMax: 290,
        yTicks: [160, 200, 240, 280],
        xTicks: [YEAR0, 2030, 2035, 2040, 2045, HORIZON].map((y) => ({ x: y, label: String(y) })),
        markers: 'last',
        baseline: { v: REGISTER_TOTAL / 1000, label: `${formatPL(REGISTER_TOTAL)} — tylu jest dzisiaj.`, accent: 'Za mało.' },
        series: [
          { label: 'Limity bez zmian', tone: 'blue', points: line(base), value: thousands(base.doctors), unit: 'tys.', detail: `${seats(LIMIT_TODAY)} rocznie, jak dziś` },
          { label: 'Cięcie: wariant B NIL', tone: 'amber', points: line(nilB), value: thousands(nilB.doctors), unit: 'tys.', detail: `−9% rocznie, do ${seats(Math.min(...from2027(nilB)))}` },
          { label: 'Cięcie: wariant A NIL', tone: 'red', points: line(nilA), value: thousands(nilA.doctors), unit: 'tys.', detail: `od 2027 r. ${seats(from2027(nilA)[0])} rocznie` },
        ],
        // klamra między końcem linii bez cięcia a wariantem A — podpis po prawej, w zapasie osi za rokiem HORIZON
        gap: { x: HORIZON, from: base.doctors / 1000, to: nilA.doctors / 1000, lines: [`${thousands(base.doctors - nilA.doctors)} tys. lekarzy mniej`, 'po cięciu limitów (wariant A)'] },
      },
      sources: `Model: rejestr NIL, limity MZ, warianty NIL, zgony GUS · napływ ${formatPL(DEFAULTS.inflow)}/rok, praca do ${DEFAULTS.retireAge} lat`,
      alt: `Infografika, wykres: projekcja liczby lekarzy wykonujących zawód do ${HORIZON} r. Dziś ${formatPL(REGISTER_TOTAL)} według rejestru NIL — tylu jest dzisiaj, za mało. W ${HORIZON} r.: przy limitach przyjęć bez zmian (${seats(LIMIT_TODAY)} po polsku rocznie, jak dziś) ok. ${thousands(base.doctors)} tys., po cięciu limitów w wariancie B zespołu NIL ok. ${thousands(nilB.doctors)} tys., w wariancie A ok. ${thousands(nilA.doctors)} tys., czyli o ${thousands(base.doctors - nilA.doctors)} tys. mniej niż bez cięcia. Model zarobkilekarzy.pl uwzględnia odsiew na studiach (kończy ${formatPL(DEFAULTS.graduate * 100)}%), wyjazdy (${formatPL(DEFAULTS.abroad * 100)}%), napływ lekarzy z dyplomem zagranicznym (${formatPL(DEFAULTS.inflow)} rocznie), pracę do ${DEFAULTS.retireAge} lat i zgony według tablic trwania życia GUS.`,
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

// najdłuższe kolejki i dwie częste poradnie, na końcu średnia ze wszystkich 41 (Barometr WHC)
const specialistRows: ComparisonRow[] = [
  ...SPECIALISTS_2025.rows.map((r) => ({ label: r.label, value: r.value, display: formatPL(r.value, 1) })),
  { label: 'Średnio', sub: '41 rodzajów poradni', value: SPECIALISTS_2025.average, display: formatPL(SPECIALISTS_2025.average, 1), highlight: true },
];

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
    {
      id: 'kolejki-do-specjalistow',
      title: 'Ile miesięcy czeka się na specjalistę',
      measure: `średni czas oczekiwania na poradę · Barometr WHC ${WHC_LATEST.label}`,
      unit: 'mies.',
      rows: specialistRows,
      sources: `Źródło: Fundacja Watch Health Care, Barometr WHC ${WHC_LATEST.label}`,
      alt: `Infografika: średni czas oczekiwania na poradę specjalisty według Barometru WHC (${WHC_LATEST.label}): ${SPECIALISTS_2025.rows.map((r) => `${r.label.toLowerCase()} ${formatPL(r.value, 1)} mies.`).join(', ')}; średnio w 41 rodzajach poradni ${formatPL(SPECIALISTS_2025.average, 1)} mies. Źródło: Fundacja Watch Health Care.`,
    },
  ],
};

/* ---------- Zadłużenie: zobowiązania SPZOZ kwartał po kwartale ---------- */

const DEBT_FROM = 2020;
const debtQuarters = SPZOZ_QUARTERS.filter(([label]) => Number(label.split(' ')[1]) >= DEBT_FROM);
const ROMAN = ['I', 'II', 'III', 'IV'];
/** „III 2024” → 2024,625 (środek kwartału na osi lat) */
const quarterX = (label: string) => {
  const [q, y] = label.split(' ');
  return Number(y) + (ROMAN.indexOf(q) + 0.5) / 4;
};
const quarterName = (label: string) => label.replace(' ', ' kw. ');
const [debtFirst, debtLast] = [debtQuarters[0], debtQuarters.at(-1)!];
const yearAgo = SPZOZ_QUARTERS[SPZOZ_QUARTERS.length - 5];
const debtGrowth = (debtLast[1] / yearAgo[1] - 1) * 100;
const bn = (mln: number) => formatPL(mln / 1000, 1);

const zadluzenie: InfographicSet = {
  route: '/dane/zadluzenie-szpitali/',
  page: 'Dane: Zadłużenie szpitali — pensje wypłacane na kredyt',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'dlug-spzoz',
      title: `Długi publicznych placówek: ${formatPL(debtLast[1] / debtFirst[1], 1)} raza więcej niż w ${DEBT_FROM} r.`,
      measure: `zobowiązania wszystkich SPZOZ, mld zł · ${quarterName(debtFirst[0])} – ${quarterName(debtLast[0])}`,
      chart: {
        xMin: DEBT_FROM,
        xMax: Number(debtLast[0].split(' ')[1]) + 0.5,
        yMin: 0,
        yMax: 40,
        yTicks: [0, 10, 20, 30],
        xTicks: Array.from({ length: Number(debtLast[0].split(' ')[1]) - DEBT_FROM + 1 }, (_, k) => ({ x: DEBT_FROM + k + 0.5, label: String(DEBT_FROM + k) })),
        series: [
          {
            label: 'Zobowiązania ogółem',
            tone: 'blue',
            points: debtQuarters.map(([label, total]) => ({ x: quarterX(label), v: total / 1000 })),
            value: bn(debtLast[1]),
            unit: 'mld zł',
            detail: `z ${bn(debtFirst[1])} mld zł w ${quarterName(debtFirst[0])}`,
          },
          {
            label: 'W tym wymagalne',
            tone: 'red',
            points: debtQuarters.map(([label, , overdue]) => ({ x: quarterX(label), v: overdue / 1000 })),
            value: bn(debtLast[2]),
            unit: 'mld zł',
            detail: `po terminie płatności; z ${bn(debtFirst[2])} mld zł`,
          },
        ],
        note: { x: quarterX(debtLast[0]), v: debtLast[1] / 1000, lines: ['w ciągu ostatniego roku', `+${formatPL(debtGrowth, 1)}%`] },
      },
      sources: 'Źródło: Ministerstwo Zdrowia, zobowiązania ogółem i wymagalne SPZOZ (dane kwartalne)',
      alt: `Infografika, wykres: zobowiązania wszystkich samodzielnych publicznych zakładów opieki zdrowotnej (SPZOZ) wzrosły z ${bn(debtFirst[1])} mld zł w ${quarterName(debtFirst[0])} do ${bn(debtLast[1])} mld zł w ${quarterName(debtLast[0])}, w ciągu ostatniego roku o ${formatPL(debtGrowth, 1)}%. Zobowiązania wymagalne, czyli po terminie płatności, wzrosły z ${bn(debtFirst[2])} do ${bn(debtLast[2])} mld zł. Źródło: Ministerstwo Zdrowia.`,
    },
  ],
};

/* ---------- Pielęgniarstwo: wiek zarejestrowanych pielęgniarek ---------- */

const agePct = (groups: string[]) => Math.round(AGE_LADDER.filter((g) => groups.includes(g.group)).reduce((n, g) => n + g.pct, 0) * 10) / 10;
const nursesOld = agePct(['71 lat i więcej', '61–70 lat']);
const nursesMid = agePct(['51–60 lat', '41–50 lat']);
const nursesYoung = agePct(['31–40 lat', '20–30 lat']);
const nurses71 = AGE_LADDER.find((g) => g.group === '71 lat i więcej')!.pct;

const pielegniarstwo: InfographicSet = {
  route: '/analizy/pielegniarstwo-w-polsce/',
  page: 'Analiza: Pielęgniarstwo w Polsce — drabina wieku',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'wiek-pielegniarek',
      title: 'Co trzecia pielęgniarka ma ponad 60 lat',
      measure: `zarejestrowane pielęgniarki według wieku · ${AGE_BASE.date} · razem ${formatPL(AGE_BASE.nurses)}`,
      split: {
        unit: '%',
        bars: [
          {
            segments: [
              { label: '61 lat i więcej', sub: `w tym ${formatPL(nurses71, 1)}% powyżej 70 lat`, value: nursesOld, display: formatPL(nursesOld, 1), tone: 'blue' },
              { label: '41–60 lat', value: nursesMid, display: formatPL(nursesMid, 1), tone: 'slate' },
              { label: 'do 40 lat', value: nursesYoung, display: formatPL(nursesYoung, 1), tone: 'soft' },
            ],
          },
        ],
      },
      sources: 'Źródło: Naczelna Izba Pielęgniarek i Położnych, raport o stanie pielęgniarstwa (2023)',
      alt: `Infografika: wiek pielęgniarek zarejestrowanych w Centralnym Rejestrze Pielęgniarek i Położnych (${AGE_BASE.date}, razem ${formatPL(AGE_BASE.nurses)}): ${formatPL(nursesOld, 1)}% ma 61 lat i więcej (w tym ${formatPL(nurses71, 1)}% powyżej 70 lat), ${formatPL(nursesMid, 1)}% — 41–60 lat, ${formatPL(nursesYoung, 1)}% — do 40 lat. Źródło: Naczelna Izba Pielęgniarek i Położnych.`,
    },
  ],
};

/* ---------- Od studiów do NFZ: na 100 rozpoczynających (analiza o odsiewie) ---------- */

/*
 * Kroki z wykresu w artykule (funnelRows, na 100 Polaków), poprzedzone krokiem „w tym Polacy”: udział
 * Polaków wśród studentów I semestru tego samego rocznika 2018/19 (POL-on, narodowość). Kolejne kroki
 * to te same proporcje przyłożone do tego udziału. Na grafice liczby całkowite — to zestawienie
 * proporcji z kilku roczników, a nie śledzenie jednej grupy osób.
 */
const fy2018 = STUDENTS_FIRST_YEAR.find((r) => r.year === '2018/19')!;
const firstAll = fy2018.pl.first + fy2018.foreign.first;
const plShare = fy2018.pl.first / firstAll;
// w artykule kroki 4–5 mają w dopisku sam odsetek (kontekst daje krok 3); na grafice dopisujemy, czego dotyczy
const funnelSub = (note?: string) => {
  const text = note?.replace(/^·\s*/, '');
  return text && /^[\d,]+%$/.test(text) ? `${text} absolwentów po 6 latach` : text;
};
const funnel: ComparisonRow[] = [
  { label: 'Zaczyna studia', sub: `${formatPL(firstAll)} osób na I semestrze 2018/19`, value: 100, display: '100' },
  {
    label: 'W tym Polacy',
    sub: `${formatPL(Math.round((1 - plShare) * 100))} na 100 to cudzoziemcy, wielu studiuje po angielsku`,
    value: plShare * 100,
    display: formatPL(Math.round(plShare * 100)),
  },
  ...funnelRows.slice(1).map((r) => ({ label: r.label, sub: funnelSub(r.note), value: r.value * plShare, display: formatPL(Math.round(r.value * plShare)) })),
].map((r, i, all) => ({ ...r, highlight: i === all.length - 1 }));
const funnelEnd = funnel.at(-1)!.display;

// PES: siedem największych dziedzin i wszystkie dziedziny, od najwyższego odsetka; wyróżnione „wszystkie”
const pesRows: ComparisonRow[] = [
  ...PES_2025.map((d) => ({ label: d.field, y: pesYear(d), highlight: false })),
  { label: 'Wszystkie dziedziny', y: pesYear(PES_2025_ALL), highlight: true },
]
  .map(({ label, y, highlight }) => ({ label, sub: `${formatPL(y.passed)} z ${formatPL(y.n)} podejść`, value: y.rate, display: formatPL(y.rate, 1), highlight }))
  .sort((a, b) => b.value - a.value);

const odsiew: InfographicSet = {
  route: '/analizy/odsiew-na-medycynie/',
  page: 'Analiza: Kto odpada z medycyny, a kto wyjeżdża',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'od-studiow-do-nfz',
      title: `Od studiów do NFZ: ze 100 osób ok. ${funnelEnd}`,
      measure: 'na 100 osób, które zaczynają kierunek lekarski',
      rows: funnel,
      sources: 'Źródło: MZ BASiW (POL-on, ZUS, NFZ), obliczenia własne · proporcje z kilku roczników',
      alt: `Infografika: na 100 osób, które zaczynają kierunek lekarski (I semestr 2018/19, ${formatPL(firstAll)} osób), ${funnel.slice(1).map((r) => `${r.display} — ${r.label.toLowerCase()}`).join(', ')}. Pozostali na starcie to cudzoziemcy, z których wielu studiuje po angielsku. Kroki 1–3: studenci I semestru 2018/19 i absolwenci-Polacy 2023/24; dalsze kroki — losy rocznika 2016/17 w 2023 r. To zestawienie proporcji z kilku roczników, a nie śledzenie jednej grupy osób. Źródło: Ministerstwo Zdrowia, Baza Analiz Systemowych i Wdrożeniowych (${ODSIEW_LINKS.mz}).`,
    },
    {
      id: 'zdawalnosc-pes',
      title: 'Jaka część zdających zdaje test egzaminu specjalizacyjnego',
      measure: 'PES, część testowa · odsetek podejść z wynikiem co najmniej 60% · 2025',
      unit: '%',
      rows: pesRows,
      sources: 'Źródło: CEM, wyniki części testowej PES, sesje wiosna i jesień 2025, obliczenia własne · wszystkie podejścia',
      alt: `Infografika: odsetek podejść do części testowej Państwowego Egzaminu Specjalizacyjnego z wynikiem co najmniej 60% w 2025 r. (sesje wiosenna i jesienna, wszystkie podejścia): ${pesRows.map((r) => `${r.label} ${r.display}% (${r.sub})`).join(', ')}. Siedem dziedzin z największą liczbą podejść. Grafika nie obejmuje części ustnej egzaminu — jej wyników Centrum Egzaminów Medycznych nie publikuje. Źródło: CEM, listy wyników części testowej PES (${PES_LINK}), obliczenia własne.`,
    },
  ],
};

/* ---------- Monitoring Watchdog: mapy (warstwy z lib/monitoring/map, ten sam renderer co mapa na stronie) ---------- */
const mapLayer = (id: string) => monitoringMap.layers.find((l) => l.id === id)!;
const openness = mapLayer('jawnosc');
const pay = mapLayer('zarobki');
const monitoringMaps: InfographicSet = {
  route: '/dane/monitoring-watchdog/',
  page: 'Przeglądarka monitoringu płac lekarzy',
  filePrefix: 'zarobkilekarzy-mapa-monitoringu',
  items: [
    {
      id: 'mapa-jawnosc',
      title: 'Kto ujawnił dane o płacach lekarzy',
      measure: `monitoring Watchdog Polska · płace lekarzy za ${monitoring.year} r.`,
      map: { set: 'monitoring', layer: 'jawnosc' },
      sources: `Źródło: Watchdog Polska (fedrowanie), granice: PRG, GUGiK, wybrzeże: GISCO © EuroGeographics${opennessP >= 0.05 ? ' · różnice między województwami w granicach przypadku' : ''}`,
      alt: `Mapa województw: ${openness.summary!.text.replace(/\u00A0/g, ' ')} — ${openness.summary!.value}. ${openness.kind === 'regions' ? [...openness.regions].sort((a, b) => b.value - a.value).map((r) => `${r.tip.title} ${r.exact ?? r.display} (${r.detail})`).join(', ') : ''}. Źródło: Watchdog Polska, monitoring „${monitoring.source.monitoring}”.`,
    },
    {
      id: 'mapa-zarobki',
      title: 'Ile płacą szpitale, które ujawniły listy płac',
      measure: `monitoring Watchdog Polska · płace lekarzy za ${monitoring.year} r.`,
      map: { set: 'monitoring', layer: 'zarobki' },
      sources: 'Źródło: Watchdog Polska (fedrowanie), granice: PRG, GUGiK, wybrzeże: GISCO © EuroGeographics · każda kwota to wypłata jednej placówki',
      alt: `Mapa Polski: ${pay.summary!.value} ${pay.summary!.text.replace(/\u00A0/g, ' ')}. Koło = placówka w gminie siedziby, kolor = mediana rocznych wypłat (${pay.scale.labels.map((l, i) => `${l}: ${pay.scale.counts![i]}`).join(', ')}), wielkość = liczba pozycji na liście. Szare punkty: placówki bez pełnej listy. Źródło: Watchdog Polska, monitoring „${monitoring.source.monitoring}”.`,
    },
  ],
};

/* ---------- Wizyty prywatne: pieniądze, świadczenia i czekanie; lekarze w dwóch sektorach ---------- */

// zmiany jak w tekście analizy: AOS z jednym miejscem po przecinku (dokładne kwoty NFZ), kolejka w całych
// procentach — Barometr WHC podaje miesiące z jednym miejscem, więc dziesiąte części procentu byłyby pozorne
const aosCost = change(AOS_FIRST.cost, AOS_LAST.cost);
const aosServices = change(AOS_FIRST.services, AOS_LAST.services);
const queueGrowth = change(WHC_2022.single, WHC_2024.single);
const aosRows: ComparisonRow[] = [
  { label: 'Pieniądze NFZ', sub: `z ${formatPL(AOS_FIRST.cost / 1e6, 1)} do ${formatPL(AOS_LAST.cost / 1e6, 1)} mld zł`, value: aosCost, display: `+${formatPL(aosCost, 1)}`, highlight: true },
  { label: 'Świadczenia', sub: `z ${formatPL(AOS_FIRST.services / 1e6, 1)} do ${formatPL(AOS_LAST.services / 1e6, 1)} mln`, value: aosServices, display: `+${formatPL(aosServices, 1)}` },
  { label: 'Czas oczekiwania', sub: `z ${formatPL(WHC_2022.single, 1)} do ${formatPL(WHC_2024.single, 1)} mies.`, value: queueGrowth, display: `+${formatPL(queueGrowth)}` },
];

const shareIn = (n: number) => `${formatPL(n, 1)}%`;
const wizytyPrywatne: InfographicSet = {
  route: '/analizy/wizyty-prywatne-kolejka-cena/',
  page: 'Analiza: Wizyty prywatne — im dłuższa kolejka, tym drożej',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'pieniadze-a-swiadczenia',
      title: 'Dokładanie pieniędzy nie skraca kolejek',
      measure: `poradnie specjalistyczne z umową z NFZ · zmiana ${AOS_FIRST.year}–${AOS_LAST.year}`,
      unit: '%',
      rows: aosRows,
      sources: `Źródła: NFZ, sprawozdanie za ${AOS_LAST.year} r. (tab. II.19–20), Barometr WHC · świadczenia: porady i badania`,
      alt: `Infografika: w latach ${AOS_FIRST.year}–${AOS_LAST.year} koszty NFZ na ambulatoryjną opiekę specjalistyczną wzrosły o ${formatPL(aosCost, 1)}% (z ${formatPL(AOS_FIRST.cost / 1e6, 1)} do ${formatPL(AOS_LAST.cost / 1e6, 1)} mld zł), liczba świadczeń o ${formatPL(aosServices, 1)}% (z ${formatPL(AOS_FIRST.services / 1e6, 1)} do ${formatPL(AOS_LAST.services / 1e6, 1)} mln), a średni czas oczekiwania na świadczenie według Barometru WHC o ${formatPL(queueGrowth)}% (z ${formatPL(WHC_2022.single, 1)} do ${formatPL(WHC_2024.single, 1)} mies.). Źródła: NFZ, sprawozdanie z działalności za ${AOS_LAST.year} r. (${WIZYTA_LINKS.nfz2024}); Fundacja Watch Health Care, Barometr WHC.`,
    },
    {
      id: 'lekarze-w-obu-sektorach',
      title: 'Ponad połowa ankietowanych lekarzy pracuje w obu sektorach',
      measure: `ankieta NIL „Perspektywa 27” · 2026 · ${formatPL(NIL_N)} lekarzy i dentystów`,
      split: {
        unit: '%',
        bars: [
          {
            segments: [
              { label: 'Tylko publicznie', sub: 'świadczenia z NFZ', value: WORK_MODEL.publicOnly, display: formatPL(WORK_MODEL.publicOnly, 1), share: shareIn(WORK_MODEL.publicOnly), tone: 'slate' },
              { label: 'Publicznie i prywatnie', sub: `w tym ${formatPL(WORK_MODEL.both, 1)}% po równo`, value: combined, display: formatPL(combined, 1), share: shareIn(combined), tone: 'blue' },
              { label: 'Tylko prywatnie', value: WORK_MODEL.privateOnly, display: formatPL(WORK_MODEL.privateOnly, 1), share: shareIn(WORK_MODEL.privateOnly), tone: 'slate' },
              { label: 'Bez pracy klinicznej', value: NO_CLINICAL, display: formatPL(NO_CLINICAL, 1), tone: 'soft' },
            ],
          },
        ],
      },
      sources: 'Źródło: Naczelna Izba Lekarska, „Perspektywa 27” (V 2026) · ankieta internetowa, próba nielosowa',
      alt: `Infografika: model pracy klinicznej w ankiecie Naczelnej Izby Lekarskiej „Perspektywa 27” (29.04–4.05.2026, ${formatPL(NIL_N)} lekarzy i lekarzy dentystów, próba nielosowa): ${formatPL(WORK_MODEL.publicOnly, 1)}% pracowało wyłącznie przy świadczeniach finansowanych publicznie, ${formatPL(combined, 1)}% łączyło pracę publiczną i prywatną (${formatPL(WORK_MODEL.mostlyPublic, 1)}% głównie publicznie, ${formatPL(WORK_MODEL.both, 1)}% w podobnym zakresie, ${formatPL(WORK_MODEL.mostlyPrivate, 1)}% głównie prywatnie), ${formatPL(WORK_MODEL.privateOnly, 1)}% wyłącznie prywatnie, a ${formatPL(NO_CLINICAL, 1)}% nie wykonywało pracy klinicznej. Źródło: ${WIZYTA_LINKS.nil}.`,
    },
  ],
};

/* ---------- AI w medycynie: model sam a ludzie, którzy z niego korzystają ---------- */

const ai: InfographicSet = {
  route: '/analizy/ai-w-medycynie-2026/',
  page: 'Analiza: Sztuczna inteligencja w medycynie — stan na 2026',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'ai-a-lekarze',
      // mnożnik w tytule tylko dla trudnych przypadków; w SOR przewaga mniejsza — widać to w wierszach
      title: `W trudnych przypadkach AI trafiała w rozpoznanie ${formatPL(NORI.nejm.ai / NORI.nejm.doctors, 1)} raza częściej niż lekarze`,
      measure: 'trafne rozpoznania w symulacji · odsetek przypadków',
      unit: '%',
      rows: [
        { label: 'AI (MAI-DxO)', sub: 'trudne przypadki z NEJM', value: NORI.nejm.ai, display: formatPL(NORI.nejm.ai, 1), highlight: true },
        { label: 'Lekarze', sub: 'trudne przypadki z NEJM', value: NORI.nejm.doctors, display: formatPL(NORI.nejm.doctors, 1) },
        { label: 'AI (MAI-DxO)', sub: 'pacjenci przyjęci z SOR', value: NORI.sor.ai, display: formatPL(NORI.sor.ai, 1), highlight: true },
        { label: 'Lekarze', sub: 'pacjenci przyjęci z SOR', value: NORI.sor.doctors, display: formatPL(NORI.sor.doctors, 1) },
      ],
      sources: `Źródło: Nori i in., Science (2026), Microsoft AI · symulacja na ${formatPL(NORI.cases)} przypadkach, bez pacjentów`,
      alt: `Infografika: w symulacji opisanej w Science (2026) system AI Microsoftu MAI-DxO trafiał w rozpoznanie w ${formatPL(NORI.nejm.ai, 1)}% trudnych przypadków z New England Journal of Medicine, a lekarze w ${formatPL(NORI.nejm.doctors, 1)}% — ${formatPL(NORI.nejm.ai / NORI.nejm.doctors, 1)} raza rzadziej. U pacjentów przyjętych z SOR: AI ${formatPL(NORI.sor.ai, 1)}%, lekarze ${formatPL(NORI.sor.doctors, 1)}%. ${formatPL(NORI.cases)} przypadków, bez udziału pacjentów. Źródło: H. Nori i in., ${NORI.href}.`,
    },
    {
      id: 'model-a-pacjent',
      title: 'Sam model trafia częściej niż człowiek, który go używa',
      measure: 'trafne wskazanie choroby z opisu objawów · odsetek przypadków',
      unit: '%',
      rows: [
        { label: 'Sam model językowy', sub: 'GPT-4o, Llama 3, Command R+', value: BEAN.modelAlone, display: formatPL(BEAN.modelAlone, 1) },
        { label: 'Osoby korzystające z modelu', sub: `${formatPL(BEAN.participants)} uczestników badania`, value: BEAN.withModelBelow, display: `<${formatPL(BEAN.withModelBelow, 1)}`, highlight: true },
      ],
      sources: 'Źródło: Bean i in., Nature Medicine 32 (2026), Uniwersytet Oksfordzki · scenariusze, nie prawdziwi pacjenci',
      alt: `Infografika: w badaniu Uniwersytetu Oksfordzkiego (Nature Medicine, 2026) same modele językowe (GPT-4o, Llama 3, Command R+) wskazywały właściwą chorobę na podstawie opisu objawów w ${formatPL(BEAN.modelAlone, 1)}% przypadków, a ${formatPL(BEAN.participants)} uczestników badania, którzy z nich korzystali — w mniej niż ${formatPL(BEAN.withModelBelow, 1)}%. Źródło: A. M. Bean i in., ${BEAN.href}.`,
    },
  ],
};

/* ---------- Samorząd lekarski o ustawie z 19.06.2026 (cytat) ---------- */

// cytat dosłownie za relacją Gazety Prawnej, tak jak w artykule; bez nazwiska — podpis funkcją.
// „Użyjemy wszelkich środków” to parafraza dziennikarza, nie cytat — na grafikę nie trafia.
const nil: InfographicSet = {
  route: '/analizy/nil-a-kontrakty-lekarskie/',
  page: 'Analiza: Naczelna Izba Lekarska a kontrakty lekarskie',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'cytat-trybunaly',
      title: 'Samorząd lekarski o ustawie z 19 czerwca 2026',
      measure: 'Samorząd lekarski o ustawie z 19.06.2026',
      quote: {
        lines: {
          poziom: ['Jeżeli prezydent podpisze ustawę,', 'pójdziemy do **Trybunałów Europejskich**', 'i będziemy domagać się jej uchylenia”.'],
          pion: ['Jeżeli prezydent', 'podpisze ustawę,', 'pójdziemy do', '**Trybunałów Europejskich**', 'i będziemy domagać', 'się jej uchylenia”.'],
        },
        who: 'prezes Naczelnej Izby Lekarskiej',
        where: 'w RMF FM, czerwiec 2026',
        facts: [
          { label: 'Co robi ustawa', text: 'Placówki przekazują ministrowi zdrowia, na jego wniosek, dane o wynagrodzeniach z PESEL i numerem PWZ. **Ustawa nie przewiduje ich publikacji.**' },
          { label: 'Prezydent', text: '**Podpisał ustawę 17.07.2026.**\nDz.U. 2026 poz. 972' },
        ],
      },
      sources: 'Źródło: Gazeta Prawna, 27.06.2026 (relacja z RMF FM) · Dz.U. 2026 poz. 972',
      alt: 'Infografika z cytatem. Prezes Naczelnej Izby Lekarskiej w RMF FM w czerwcu 2026 r.: „Jeżeli prezydent podpisze ustawę, pójdziemy do Trybunałów Europejskich i będziemy domagać się jej uchylenia”. Co robi ustawa z 19 czerwca 2026 r.: placówki przekazują ministrowi zdrowia, na jego wniosek, dane o wynagrodzeniach z PESEL i numerem PWZ; ustawa nie przewiduje ich publikacji. Prezydent podpisał ustawę 17 lipca 2026 r. (Dz.U. 2026 poz. 972). Źródło: Gazeta Prawna, 27.06.2026.',
    },
  ],
};

/* ---------- Reglamentacja dostępu: sprzeciwy samorządu na osi czasu ---------- */

// porada specjalisty: najnowsza edycja Barometru WHC wobec średniej z edycji 2015 r. (2,4; 2,3; 2,4)
const specialist2015 = WHC_EDITIONS.filter((e) => e.year === 2015 && e.specialist !== null);
const specialistFrom = specialist2015.reduce((sum, e) => sum + e.specialist!, 0) / specialist2015.length;
const specialistNow = WHC_LATEST.specialist!;
const stanceYears = `${SELF_GOVERNMENT_STANCES[0].year}–${SELF_GOVERNMENT_STANCES.at(-1)!.year}`;

const reglamentacja: InfographicSet = {
  route: '/mechanizmy/reglamentacja-dostepu/',
  page: 'Mechanizm: Reglamentacja dostępu do zawodu',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: 'dekada-jednego-nie',
      title: 'Dekada jednego',
      titleAccent: '„nie”',
      measure: `samorząd lekarski wobec zwiększania liczby lekarzy · ${stanceYears}`,
      timeline: {
        events: SELF_GOVERNMENT_STANCES.map((e) => ({ year: String(e.year), text: e.text, who: e.who })),
        note: 'Uzasadnienie samorządu: jakość kształcenia i bezpieczeństwo pacjentów.',
        figures: [
          { value: formatPL(specialistNow, 1), unit: 'mies.', text: `średnio czeka się na poradę specjalisty (${WHC_LATEST.year}); w 2015 r. — ${formatPL(specialistFrom, 1)} mies.`, highlight: true },
          { value: String(SURPLUS_YEAR), text: 'od tego roku liczba lekarzy ma przekroczyć popyt — według ekspertyzy izby lekarskiej' },
        ],
      },
      sources: `Źródła: NIL — stanowiska NRL i Prezydium NRL ${stanceYears} (nil.org.pl, MedExpress, Puls Medycyny, Prawo.pl) · Barometr WHC ${WHC_LATEST.label}`,
      alt: `Infografika „Dekada jednego «nie»”: oś czasu sprzeciwów samorządu lekarskiego wobec zwiększania liczby lekarzy, ${stanceYears}. ${SELF_GOVERNMENT_STANCES.map((e) => `${e.year} (${e.who}): ${e.text.charAt(0).toLowerCase()}${e.text.slice(1)}`).join('; ')}. Samorząd uzasadnia stanowiska jakością kształcenia i bezpieczeństwem pacjentów. Na poradę specjalisty czeka się średnio ${formatPL(specialistNow, 1)} mies. (Barometr WHC ${WHC_LATEST.label}), w 2015 r. ${formatPL(specialistFrom, 1)} mies. Według ekspertyzy izby lekarskiej od ${SURPLUS_YEAR} r. liczba lekarzy ma przekroczyć popyt.`,
    },
  ],
};

export const infographicSets: Record<string, InfographicSet> = {
  'nil-a-kontrakty-lekarskie': nil,
  egzamin,
  'odpowiedzialnosc-zawodowa-lekarzy': odpowiedzialnosc,
  'english-division': englishDivision,
  'symulator-podazy-lekarzy': symulator,
  kolejki,
  'zadluzenie-szpitali': zadluzenie,
  'pielegniarstwo-w-polsce': pielegniarstwo,
  'odsiew-na-medycynie': odsiew,
  'monitoring-watchdog': monitoringMaps,
  'wizyty-prywatne-kolejka-cena': wizytyPrywatne,
  'ai-w-medycynie-2026': ai,
  'reglamentacja-dostepu': reglamentacja,
};
