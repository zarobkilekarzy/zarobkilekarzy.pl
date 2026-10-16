/**
 * Zestawy infografik do pobrania (szablon: ./render.ts, endpoint: pages/infografiki/,
 * sekcja na stronie: blocks/Infographics). Klucz = ostatni człon trasy strony.
 *
 * Liczby wyłącznie z modułów danych stron — te same funkcje, z których liczy tekst artykułu,
 * więc aktualizacja danych zmienia grafiki w następnym buildzie.
 */
import { COUNTRIES, WINDOW, ratePer100k, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { LATEST } from '@/data/english-division';
import { dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { BUDGET, CURRENT, DRAFT_2027, GAP_2027, budget, formatMld } from '@/data/budzet-nfz';
import { MEDIAN_WAGES, OUT_OF_POCKET, TO, WHC_EDITIONS, WHC_LATEST, contribution } from '@/data/kolejki';
import { LIMIT_TODAY, PRESETS, REGISTER_TOTAL, YEAR0, YEAR_MIN, seats, simulate } from '@/lib/podaz/model';
import { formatPL } from '@/lib/format';
import type { ComparisonRow, InfographicSet } from './render';

const span = `${WINDOW.from}–${WINDOW.to}`;
// na grafice liczby całkowite: to porównanie rzędu wielkości, nie co do przecinka
const country = (key: CountryKey): ComparisonRow => {
  const c = COUNTRIES.find((x) => x.key === key)!;
  const value = ratePer100k(key);
  return { label: c.name, sub: c.body, value, display: formatPL(value), highlight: key === 'pl' };
};
const rows = [country('no'), country('se'), country('uk'), country('pl')];

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
const seatRows: ComparisonRow[] = [
  { label: 'Stacjonarne', sub: 'po polsku', value: stationary, display: formatPL(stationary) },
  { label: 'Niestacjonarne', sub: 'po polsku, płatne', value: extramural, display: formatPL(extramural) },
  { label: 'W języku obcym', sub: 'English Division, płatne', value: LATEST.foreign, display: formatPL(LATEST.foreign), highlight: true },
];

const foreignShare = (100 * LATEST.foreign) / LATEST.total;
const edRows: ComparisonRow[] = [
  { label: 'Miejsca w języku obcym', sub: `udział w limicie, ${LATEST.year}`, value: foreignShare, display: formatPL(foreignShare, 1) },
  // ELA: < 1% absolwentów-cudzoziemców nauk medycznych pracuje w Polsce rok po dyplomie (dyplomy z 2021 r.)
  { label: 'Pracuje w Polsce', sub: 'absolwentów-cudzoziemców', value: 1, display: '<1', highlight: true },
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
      rows: seatRows,
      sources: `Źródło: rozporządzenie MZ, Dz.U. ${LATEST.act.label} · miejsca w limicie, nie liczba przyjętych`,
      alt: `Infografika: limit przyjęć na kierunek lekarski w roku ${LATEST.year} — razem ${formatPL(LATEST.total)} miejsc: studia stacjonarne po polsku ${formatPL(stationary)}, niestacjonarne po polsku (płatne) ${formatPL(extramural)}, w języku obcym (English Division, płatne) ${formatPL(LATEST.foreign)}. Źródło: rozporządzenie Ministra Zdrowia, Dz.U. ${LATEST.act.label}.`,
    },
    {
      id: 'english-division',
      title: 'Co szóste miejsce na medycynie jest po angielsku',
      measure: 'udział w limicie przyjęć · praca w Polsce rok po dyplomie',
      unit: '%',
      rows: edRows,
      sources: `Źródła: Dz.U. ${LATEST.act.label}, ELA (dyplomy z 2021 r.) · osobna rekrutacja, pełne czesne`,
      alt: `Infografika: studia w języku obcym (English Division) to ${formatPL(foreignShare, 1)}% miejsc w limicie przyjęć na kierunek lekarski w roku ${LATEST.year} (${formatPL(LATEST.foreign)} z ${formatPL(LATEST.total)}). Rok po dyplomie w Polsce pracuje mniej niż 1% absolwentów-cudzoziemców nauk medycznych (ELA, dyplomy z 2021 r.). To osobna rekrutacja i płatne studia. Źródła: rozporządzenie Ministra Zdrowia, Dz.U. ${LATEST.act.label}; Ekonomiczne Losy Absolwentów.`,
    },
  ],
};

/* ---------- Symulator podaży: nabór jak dziś i dwa warianty zespołu NIL ---------- */

const HORIZON = 2050;
const scenario = (id: string) => {
  const intake = PRESETS.find((p) => p.id === id)!.intake();
  return { intake, doctors: simulate(intake)[HORIZON - YEAR0].doctors };
};
const [base, nilB, nilA] = [scenario('baza'), scenario('nil-b'), scenario('nil-a')];
const from2027 = (s: { intake: number[] }) => s.intake.slice(2027 - YEAR_MIN);
// na grafice w tysiącach: to projekcja modelu, nie liczenie co do osoby
const thousands = (n: number) => formatPL(Math.round(n / 1000));
const supplyRows: ComparisonRow[] = [
  { label: 'Nabór jak dziś', sub: `${seats(LIMIT_TODAY)} rocznie`, value: base.doctors, display: thousands(base.doctors), highlight: true },
  { label: 'Wariant B zespołu NIL', sub: `−9% rocznie, do ${seats(Math.min(...from2027(nilB)))}`, value: nilB.doctors, display: thousands(nilB.doctors) },
  { label: 'Wariant A zespołu NIL', sub: `od 2027 r. ${seats(from2027(nilA)[0])} rocznie`, value: nilA.doctors, display: thousands(nilA.doctors) },
];

const symulator: InfographicSet = {
  route: '/analizy/symulator-podazy-lekarzy/',
  page: 'Symulator podaży lekarzy 1987–2050',
  filePrefix: 'zarobkilekarzy',
  items: [
    {
      id: `lekarze-${HORIZON}`,
      title: `Ilu lekarzy będzie w ${HORIZON} roku`,
      measure: `lekarze wykonujący zawód · w ${YEAR0} r.: ${formatPL(REGISTER_TOTAL)}`,
      unit: 'tys.',
      rows: supplyRows,
      sources: 'Model zarobkilekarzy.pl: rejestr NIL, limity MZ, warianty zespołu NIL z 2024 r.',
      alt: `Infografika: projekcja liczby lekarzy wykonujących zawód w ${HORIZON} r. (w ${YEAR0} r. ${formatPL(REGISTER_TOTAL)} według rejestru NIL): przy naborze jak dziś (${seats(LIMIT_TODAY)} po polsku rocznie) ok. ${thousands(base.doctors)} tys., w wariancie B zespołu NIL ok. ${thousands(nilB.doctors)} tys., w wariancie A ok. ${thousands(nilA.doctors)} tys. Model: symulator podaży lekarzy zarobkilekarzy.pl.`,
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
