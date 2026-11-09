/**
 * Pliki CSV do pobrania na /media/ (endpoint: pages/media/dane/[plik].csv.ts). Każdy plik powstaje
 * w buildzie z tego samego modułu danych co strona, z której pochodzi, więc aktualizacja danych
 * zmienia też plik.
 *
 * Format jak w plikach GUS: separator średnik, przecinek dziesiętny, UTF-8 z BOM i wiersze CRLF —
 * polski Excel otwiera plik bez kreatora importu, a pandas czy R czytają go z `sep=';'`, `decimal=','`.
 * Liczby bez zaokrągleń i bez spacji tysięcy; pusta komórka = brak danej.
 */
import { LIMITS } from '@/data/english-division';
import { BUDGET, CURRENT, CURRENT_PLAN, DRAFT_2027 } from '@/data/budzet-nfz';
import { LINKS as WHC, WHC_EDITIONS } from '@/data/kolejki';
import { LINKS as DEBT, SPZOZ_QUARTERS } from '@/data/zadluzenie';

type Cell = string | number | null;

export interface Dataset {
  /** nazwa pliku bez rozszerzenia */
  slug: string;
  title: string;
  /** co jest w pliku: zakres i miary */
  desc: string;
  /** strona serwisu, z której pochodzą dane, i jej nazwa w linku */
  route: string;
  page: string;
  /** źródło pierwotne, jednym zdaniem */
  source: string;
  columns: string[];
  rows: Cell[][];
}

const first = LIMITS[0];
const last = LIMITS.at(-1)!;
const whcFirst = WHC_EDITIONS[0];
const whcLast = WHC_EDITIONS.at(-1)!;
const quarter = (label: string) => label.replace(' ', ' kw. ');

// Archiwum list oczekujących do programów lekowych (tools/programy-lekowe): każdy zapisany miesiąc, nowe dochodzą same.
interface ListyNfz {
  okres: string;
  programy: { kod: string; nazwa: string }[];
  podmioty: { kod: string; nazwa: string; woj: string; ukryty?: boolean }[];
  komorki: { nazwa: string; miasto: string }[];
  /** [program, podmiot, komórka | null, pilny 0/1, czeka, przyjęci, dni | null] */
  wiersze: [number, number, number | null, number, number, number, number | null][];
  flagi: { podmiot: string }[];
}
const LISTY = Object.values(import.meta.glob<ListyNfz>('../../data/programy-lekowe/20??-??.json', { eager: true, import: 'default' })).sort((a, b) =>
  a.okres.localeCompare(b.okres),
);
// kody oddziałów NFZ 01–16 idą alfabetycznie (to nie TERYT)
const WOJ_NFZ = ['dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie', 'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'];
const MIESIACE = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
const miesiac = (okres: string) => `${MIESIACE[Number(okres.slice(5)) - 1]} ${okres.slice(0, 4)}`;
const listyWiersze = (m: ListyNfz): Cell[][] => {
  const doWyjasnienia = new Set(m.flagi.map((f) => f.podmiot));
  return m.wiersze
    .filter(([, , , , czeka, przyjeci]) => czeka > 0 || przyjeci > 0)
    .map(([program, podmiot, komorka, pilny, czeka, przyjeci, dni]) => {
      const p = m.podmioty[podmiot];
      const k = komorka === null ? null : m.komorki[komorka];
      return [
        m.okres,
        WOJ_NFZ[Number(p.woj) - 1],
        m.programy[program].kod,
        m.programy[program].nazwa,
        p.ukryty ? null : p.kod,
        p.nazwa,
        k?.nazwa ?? null,
        k?.miasto ?? null,
        pilny ? 'pilny' : 'stabilny',
        czeka,
        przyjeci,
        dni,
        doWyjasnienia.has(p.kod) ? 'dane szpitala do wyjaśnienia' : null,
      ];
    });
};

export const DATASETS: Dataset[] = [
  {
    slug: 'limity-przyjec-kierunek-lekarski',
    title: 'Limity przyjęć na kierunek lekarski',
    desc: `Miejsca w limicie przyjęć w latach ${first.year}–${last.year}: ogółem, w języku obcym i po polsku. Wersja końcowa, z nowelizacjami wydanymi w tym samym naborze.`,
    route: '/analizy/english-division/',
    page: 'Analiza: English Division',
    source: 'Rozporządzenia Ministra Zdrowia w sprawie limitu przyjęć, załącznik nr 1; sumy po uczelniach — obliczenia własne',
    columns: ['rok akademicki', 'limit ogółem', 'w języku obcym', 'po polsku', 'rozporządzenie', 'rozporządzenia zmieniające', 'tekst rozporządzenia'],
    rows: LIMITS.map((r) => [
      r.year,
      r.total,
      r.foreign,
      r.total - r.foreign,
      `Dz.U. ${r.act.label}`,
      r.amendments?.map((a) => `Dz.U. ${a.label}`).join(', ') ?? null,
      r.act.href,
    ]),
  },
  {
    slug: 'budzet-nfz-plany-finansowe',
    title: 'Budżet NFZ: plany finansowe',
    desc: `Koszty i przychody w planach finansowych NFZ ${BUDGET[0].year}–2027, mld zł: plan ostateczny, wykonanie i dotacja z budżetu państwa. ${CURRENT.year} r. — plan w toku, 2027 r. — projekt planu.`,
    route: '/dane/budzet-nfz/',
    page: 'Dane: Budżet NFZ rok po roku',
    source: 'Plany finansowe i łączne sprawozdania finansowe NFZ (BIP NFZ); projekt planu na 2027 r. — stenogram sejmowej Komisji Zdrowia z 2.07.2026',
    columns: ['rok', 'etap planu', 'koszty ogółem, mld zł', 'przychody ogółem, mld zł', 'koszty świadczeń, mld zł', 'wykonanie: koszty, mld zł', 'dotacja z budżetu państwa, mld zł', 'źródło'],
    rows: [
      ...BUDGET.map((r) => [
        r.year,
        r.status === 'final' ? 'plan ostateczny' : `plan w toku, stan na ${CURRENT_PLAN.dateShort}`,
        r.costs,
        r.revenue,
        r.benefits,
        r.executed,
        r.subsidy,
        r.href,
      ]),
      // projekt planu jest zrównoważony: przychody = koszty
      [2027, 'projekt planu', DRAFT_2027.total, DRAFT_2027.total, DRAFT_2027.benefits, null, DRAFT_2027.subsidy, DRAFT_2027.href],
    ],
  },
  {
    slug: 'barometr-whc-czas-oczekiwania',
    title: 'Czas oczekiwania na świadczenie',
    desc: `Średni czas oczekiwania w kolejnych edycjach Barometru WHC, ${whcFirst.label} – ${whcLast.label}, w miesiącach: na pojedyncze świadczenie i na poradę specjalisty. W 2020 r. badania nie było.`,
    route: '/dane/budzet-nfz/',
    page: 'Dane: Budżet NFZ i kolejki',
    source: 'Fundacja Watch Health Care, Barometr WHC — raporty z kolejnych edycji',
    columns: ['edycja badania', 'rok', 'pojedyncze świadczenie, mies.', 'porada specjalisty, mies.', 'źródło'],
    rows: WHC_EDITIONS.map((e) => [e.label, e.year, e.single, e.specialist, WHC.whcRaporty]),
  },
  {
    slug: 'zobowiazania-spzoz-kwartalnie',
    title: 'Zobowiązania SPZOZ kwartał po kwartale',
    desc: `Zobowiązania wszystkich samodzielnych publicznych zakładów opieki zdrowotnej na koniec kwartału, ${quarter(SPZOZ_QUARTERS[0][0])} – ${quarter(SPZOZ_QUARTERS.at(-1)![0])}, mln zł: ogółem i wymagalne (po terminie płatności).`,
    route: '/dane/zadluzenie-szpitali/',
    page: 'Dane: Zadłużenie szpitali',
    source: 'Ministerstwo Zdrowia, zobowiązania ogółem i wymagalne SPZOZ (dane ankietowe, kwartalne)',
    columns: ['kwartał', 'zobowiązania ogółem, mln zł', 'w tym wymagalne, mln zł', 'źródło'],
    rows: SPZOZ_QUARTERS.map(([label, total, overdue]) => [quarter(label), total, overdue, DEBT.mz]),
  },
  {
    slug: 'programy-lekowe-listy-oczekujacych',
    title: 'Programy lekowe: listy oczekujących',
    desc: `Osoby na listach oczekujących do programów lekowych na koniec miesiąca (${LISTY.map((m) => miesiac(m.okres)).join(', ')}) według programu, szpitala i komórki: kategoria (pilny, stabilny), czekający, przyjęci w miesiącu i średni czas oczekiwania w dniach. Tylko komórki, w których ktoś czekał albo został przyjęty. Miesięcy, których NFZ już nie udostępnia, w pliku nie ma.`,
    route: '/analizy/programy-lekowe-kolejki/',
    page: 'Analiza: Kolejki do programów lekowych',
    source: 'NFZ, Gdzie się leczyć — pliki z danymi o listach oczekujących, zapisywane co miesiąc przez redakcję; praktyki, których nazwa może zawierać imię i nazwisko, połączone w jedną pozycję na województwo',
    columns: ['miesiąc', 'województwo', 'kod programu', 'program', 'kod świadczeniodawcy', 'świadczeniodawca', 'komórka', 'miejscowość', 'kategoria', 'czekający', 'przyjęci w miesiącu', 'średni czas oczekiwania, dni', 'uwagi'],
    rows: LISTY.flatMap(listyWiersze),
  },
];

const cell = (c: Cell) => {
  if (c === null) return '';
  const text = typeof c === 'number' ? String(c).replace('.', ',') : c;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Treść pliku: BOM, nagłówek, wiersze rozdzielone CRLF. */
export const toCsv = (d: Dataset) => `﻿${[d.columns, ...d.rows].map((row) => row.map(cell).join(';')).join('\r\n')}\r\n`;

/** Adres pliku: /media/dane/<slug>.csv */
export const datasetUrl = (d: Dataset) => `/media/dane/${d.slug}.csv`;

/** Rozmiar pliku do opisu linku, np. „2 KB” */
export const datasetSize = (d: Dataset) => `${Math.max(1, Math.round(Buffer.byteLength(toCsv(d)) / 1024))} KB`;

/**
 * Pliki CSV zestawione z danej strony — `distribution` w jej schema.org/Dataset (ArticleLayout), żeby zbiór
 * z plikiem do pobrania znalazły też wyszukiwarki zbiorów danych. Adres pliku: pages/media/dane/[plik].csv.ts.
 */
export const datasetFiles = (route: string, site: URL) =>
  DATASETS.filter((d) => d.route === route).map((d) => ({
    name: d.title,
    description: d.desc,
    contentUrl: new URL(`/media/dane/${d.slug}.csv`, site).href,
    encodingFormat: 'text/csv',
  }));
