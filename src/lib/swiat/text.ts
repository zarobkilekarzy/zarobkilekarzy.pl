/**
 * Napisy globu płac lekarzy w języku strony: etykiety przełączników i miar, zapis liczb i kwot, teksty tabeli,
 * szczegółów kraju, dymków, sekcji „Jak czytać” i zwiastunu. Polski tutaj, angielski w src/data/en/swiat/tekst.ts
 * (ten sam typ — brak napisu po angielsku to błąd typecheck). Model (./index.ts) wkłada słownik do `model.t`,
 * więc komponenty biorą napisy z modelu i nie potrzebują osobnego propsa z językiem.
 */
import { formatPL, plural, typo } from '@/lib/format';
import type { Locale } from '@/i18n/locales';
import type { Currency, Form, Measure, OecdGroup } from './types';

/** dane do zdań w sekcji „Jak czytać” (liczby z modelu, zapisane w języku strony) */
export interface MethodFacts {
  /** numer i data tabeli A kursów NBP */
  aTable: string;
  date: string;
  pplPpp: string;
  pppYear: number;
  usdPps: string;
  ppsYear: number;
  bTable: string;
  bDate: string;
  transparent: number;
}

const UNIT: Record<Currency, string> = { PLN: 'zł', EUR: 'euro', USD: 'USD' };
const PPP_WHERE: Record<Currency, string> = {
  PLN: 'o sile nabywczej w Polsce',
  EUR: 'o przeciętnej sile nabywczej w UE',
  USD: 'międzynarodowych (siła nabywcza jak w USA)',
};
const countries = (n: number) => `${n} ${plural(n, ['kraj', 'kraje', 'krajów'])}`;

/** kwota w skali: „241 tys.”, „1,10 mln” (do 3 cyfr znaczących poniżej 100 tys.) */
function scaled(v: number): [string, string] {
  if (v >= 1e6) return [formatPL(v / 1e6, 2), 'mln'];
  if (v >= 1e5) return [formatPL(Math.round(v / 1e3)), 'tys.'];
  if (v >= 1e3) return [formatPL(v / 1e3, v >= 1e4 ? 0 : 1), 'tys.'];
  return [formatPL(Math.round(v)), ''];
}

export const plText = {
  locale: 'pl' as Locale,
  /** waluta na starcie (przełącznik, kwoty w tabeli i przeliczenia w szczegółach) */
  currency: 'PLN' as Currency,
  num: formatPL,
  /** typografia tekstu (polska: sierotki, twarde spacje przed jednostkami) */
  typo,
  /** data z zapisu ISO („2026-10-27” → „27.10.2026”) */
  date: (iso: string) => iso.split('-').reverse().join('.'),
  /** kolejność alfabetyczna nazw krajów */
  collator: 'pl',
  countries,

  form: { e: 'Na etacie', f: 'Na własny rachunek' } satisfies Record<Form, string>,
  measure: { r: '× przeciętna płaca', n: '× pielęgniarka', x: 'Kwota', p: 'Siła nabywcza', j: 'Jawność' } satisfies Record<Measure, string>,
  /** poziomy jawności płacy konkretnego lekarza (0–3) */
  level: ['brak', 'tylko zasady i średnie', 'na wniosek lub częściowo', 'imiennie z urzędu'],
  /** krótkie etykiety poziomów do kolumny tabeli */
  levelShort: ['brak', 'zasady', 'na wniosek', 'imiennie'],
  scope: { total: 'łączny dochód osoby', one: 'płaca z jednego miejsca' },
  currencyButton: { PLN: 'zł', EUR: '€', USD: '$' } satisfies Record<Currency, string>,
  flags: {
    E: 'szacunek OECD',
    D: 'definicja odbiega od standardu OECD',
    B: 'zmiana metody w szeregu',
    P: 'dane wstępne',
    O: 'relacja orientacyjna',
  } as Record<string, string>,
  /** grupa OECD przy wartości głównej (na etacie: specjaliści; na własny rachunek: specjaliści albo lekarze rodzinni) */
  oecdGroup: { se: 'Specjaliści na etacie', sf: 'Specjaliści na własny rachunek', gf: 'Lekarze rodzinni na własny rachunek' },

  scaled,
  money: (v: number, currency: Currency) => {
    const [n, s] = scaled(v);
    return [n, s, UNIT[currency]].filter(Boolean).join(' ');
  },
  /** kwoty w walucie kraju w tekście („2 564 501 NGN”, „4 440,3 tys. UZS”): liczba, opcjonalny zakres, skala, kod */
  amount: /(\d[\d  ]*(?:,\d+)?)(?:–(\d[\d  ]*(?:,\d+)?))?\s(tys\.\s)?([A-Z]{3})\b/g,
  parseNumber: (s: string) => Number(s.replace(/[  ]/g, '').replace(',', '.')),

  view: {
    context: { r: 'przeciętnej płacy', n: 'płacy pielęgniarki', x: 'rocznie', p: 'rocznie, siła nabywcza', j: 'czy da się poznać płacę konkretnego lekarza z pieniędzy publicznych' } satisfies Record<Measure, string>,
    sentence: (measure: Measure, currency: Currency) =>
      measure === 'r'
        ? 'Płaca lekarza podzielona przez przeciętną płacę w tym samym kraju.'
        : measure === 'n'
          ? 'Płaca lekarza podzielona przez płacę pielęgniarki szpitalnej na etacie w tym samym kraju i roku (tylko dane OECD).'
          : measure === 'x'
            ? `Płaca brutto rocznie w ${currency === 'PLN' ? 'złotych' : UNIT[currency]}, po kursie z roku danych i kursie NBP.`
            : measure === 'p'
              ? `Płaca brutto rocznie w ${currency === 'PLN' ? 'złotych' : currency === 'EUR' ? 'euro' : 'dolarach'} ${PPP_WHERE[currency]}.`
              : 'Czy da się poznać płacę konkretnego lekarza opłacanego z pieniędzy publicznych. Przepis jest w szczegółach kraju.',
    legend: { r: ['< 2×', '2–2,5×', '2,5–3×', '3–4×', '≥ 4×'], n: ['< 1,5×', '1,5–2×', '2–2,5×', '2,5–3×', '≥ 3×'] },
    /** granica legendy kwot w tysiącach */
    thousands: (v: number) => formatPL(Math.round(v / 1000)),
    legendUnit: (currency: Currency) => `tys. ${UNIT[currency]}`,
  },

  globe: {
    label: (sentence: string) => `Glob. ${sentence} Te same dane są w tabeli krajów.`,
    ctl: { measure: 'Miara', form: 'Forma pracy', currency: 'Waluta' },
    zoomIn: 'Przybliż',
    zoomOut: 'Oddal',
    kinds: { nat: 'dane krajowe, nie OECD', partial: 'dane cząstkowe', none: 'brak danych', notStudied: 'nie badaliśmy' },
    hint: 'Przeciągnij, aby obrócić · kliknij kraj',
    /** podskakujący dymek nad globem, znika przy pierwszym dotknięciu */
    nudge: 'Złap i zakręć globusem',
    /** komunikat dla czytnika ekranu po wyborze kraju na globie */
    announce: 'Szczegóły kraju: ',
  },

  tips: {
    level: (label: string) => `Jawność: ${label}`,
    notStudied: 'Jawności jeszcze nie badaliśmy',
    noValue: 'Brak wartości w tym widoku',
    noOfficial: 'Brak oficjalnych danych',
    click: 'Kliknij, aby zobaczyć, co wiadomo',
    nat: 'dane krajowe',
    noData: 'Brak danych',
  },

  ranking: {
    title: 'Wszystkie kraje z danymi',
    note: {
      e: 'OECD: specjaliści na etacie; dane krajowe: zwykle wszyscy lekarze na etacie, grupa jest w szczegółach kraju.',
      f: 'OECD: specjaliści na własny rachunek, a gdy ich brak — lekarze rodzinni. Dochód po odjęciu kosztów praktyki.',
    } satisfies Record<Form, string>,
    click: 'Kliknij kraj, aby rozwinąć szczegóły.',
    rest: 'Inne dane, bez wartości w tym widoku',
    key: {
      pl: 'Polska',
      oecd: 'OECD',
      nat: 'dane krajowe',
      est: 'szacunek OECD albo relacja orientacyjna',
      def: '* definicja odbiega od standardu OECD',
      old: 'rok podkreślony = starszy niż 2022',
      rates: (date: string, usd: string, eur: string) => `kursy NBP z ${date}: 1 USD = ${usd} zł, 1 EUR = ${eur} zł`,
    },
  },

  details: {
    kind: {
      avg: 'Dane krajowe',
      partial: 'Dane krajowe, cząstkowe',
      scale: 'Tabela płac (stawka, nie średnia)',
      broad: 'Tylko szersza grupa zawodów',
      none: 'Co wiadomo',
    },
    tag: { oecd: 'OECD', nat: 'Dane krajowe' },
    empty: {
      nurseNational: 'Relację do płacy pielęgniarki liczymy tylko z danych OECD o obu zawodach, a dla tego kraju mamy dane krajowe o lekarzach.',
      nurse: 'OECD nie ma płacy pielęgniarek szpitalnych z tego samego roku.',
      measure: 'Brak przeliczenia w tej mierze.',
      selfPoland: 'Brak danych. OECD nie ma danych o lekarzach na własny rachunek w Polsce, a według dokumentu roboczego AOTMiT na umowach cywilnoprawnych pracuje 73% specjalistów.',
      self: 'OECD nie ma danych o lekarzach na własny rachunek w tym kraju.',
      employedHasSelf: 'Brak przeciętnej płacy lekarzy na etacie. Dane o lekarzach na własny rachunek są w drugim widoku.',
      employed: 'Brak przeciętnej płacy lekarzy na etacie. Co wiadomo, opisujemy niżej.',
      notStudied: 'Jawności płac w tym kraju jeszcze nie badaliśmy.',
    },
    trend: {
      title: 'Zmiana w czasie · × przeciętna płaca',
      doctor: { se: 'specjalista na etacie', sf: 'specjalista na własny rachunek', ge: 'lekarz rodzinny na etacie', gf: 'lekarz rodzinny na własny rachunek' } as Partial<Record<OecdGroup, string>>,
      nurse: 'pielęgniarka szpitalna',
      /** opis wykresu dla czytnika ekranu */
      aria: (lines: string) => `Zmiana w czasie, wielokrotność przeciętnej płacy. ${lines}`,
      line: (label: string, first: string, y0: number, last: string, y1: number) => `${label}: ${first}× w ${y0} r., ${last}× w ${y1} r.`,
    },
    more: 'Więcej',
    moreParts: { j: 'jawność płac', oecd: 'dane OECD', nat: 'dane krajowe', natSources: 'dane krajowe i źródła', notes: 'uwagi' },
    jTitle: 'Jawność płac',
    oecdTitle: 'Wszystkie dane OECD',
    oecdHead: ['Na etacie', 'Na własny rachunek'],
    oecdRows: { se: 'Specjaliści', ge: 'Lekarze rodzinni', n: 'Pielęgniarki szpitalne' },
    tax: {
      title: (year: number) => `Podatek dochodowy od płac · ${year}`,
      top: (rate: string, th: string) => `Najwyższa stawka ${rate}% — od ${th}× przeciętnej płacy brutto.`,
      flat: (rate: string) => `Stawka liniowa ${rate}%.`,
      source: 'OECD Tax Database, tabela I.7',
    },
  },

  /** zwiastun globu na stronie głównej (components/home/WorldPay) */
  teaser: {
    href: '/dane/zarobki-lekarzy-na-swiecie/',
    eyebrow: 'Świat · OECD i urzędy krajowe',
    title: 'Ile zarabia lekarz w innych krajach',
    action: 'Glob z danymi',
    aria: 'Przejdź do globu płac lekarzy',
    globe: 'Glob: płace lekarzy na tle przeciętnej płacy w kraju',
    lead: (lo: string, hi: string, n: number) =>
      `Lekarz na etacie zarabia od ${lo} do ${hi} razy tyle co przeciętny pracownik w swoim kraju. Porównujemy ${countries(n)}, w złotych i według siły nabywczej.`,
    note: 'Wielokrotność przeciętnej płacy w kraju; porównanie mocno przybliżone, bo kraje liczą płace różnie. OECD: specjaliści na etacie; USA, Tajwan, Japonia, Rosja: dane krajowe, zwykle wszyscy lekarze. Polska: tylko umowy o pracę, bez kontraktów i bez sumowania płac z kilku miejsc pracy.',
  },

  method: {
    /** kotwica sekcji (nota pod globem prowadzi tutaj) */
    anchor: 'jak-czytac',
    title: 'Jak czytać te dane',
    sources: 'Źródła',
    summary: {
      main: (n: number) => `OECD, kursy i przeliczniki (${n})`,
      j: (n: number) => `Jawność płac: przepisy (${countries(n)})`,
      nat: (n: number) => `Dane krajowe (${countries(n)})`,
    },
    how: (f: MethodFacts) => [
      'Dla krajów OECD na etacie pokazujemy specjalistów: średni roczny dochód brutto z podatkiem i składkami płaconymi przez lekarza. Na własny rachunek — dochód po odjęciu kosztów praktyki. Lekarze rodzinni są w szczegółach kraju.',
      'Dane krajowe pochodzą z urzędów statystycznych i ministerstw. Zwykle dotyczą wszystkich lekarzy zatrudnionych na etacie, nie tylko specjalistów, a czasem tylko jednego sektora. Kogo obejmują, opisują szczegóły kraju; na mapie mają kółko.',
      '„× przeciętna płaca” dzieli płacę lekarza przez przeciętną płacę wszystkich pracowników w tym samym kraju. Dla danych krajowych obie liczby pochodzą z tego samego urzędu i roku.',
      `„Kwota”: OECD przelicza płace na dolary po kursie z roku danych, dane krajowe przeliczamy tak samo, średnim kursem rocznym. Na złote i euro przeliczamy kursem NBP z ${f.date}, aktualizowanym przy każdej aktualizacji strony.`,
      `„Siła nabywcza”: płaca w dolarach po parytecie siły nabywczej konsumpcji gospodarstw domowych (PPP). W złotych to tyle, ile trzeba by zarabiać w Polsce, żeby kupić to samo (${f.pplPpp} zł za dolar międzynarodowy, ${f.pppYear} r.). W euro — przy przeciętnych cenach w UE (standard siły nabywczej Eurostatu, ${f.usdPps} USD za PPS, ${f.ppsYear} r.). W dolarach — przy cenach w USA.`,
      `Kwoty w walucie kraju w szczegółach krajów mają w nawiasie przeliczenie na wybraną walutę kursem NBP: tabela A z ${f.date}, a waluty spoza niej (np. naira, szyling ugandyjski) z tabeli B ${f.bTable} z ${f.bDate}. To kurs z dnia aktualizacji, nie z roku danych.`,
      'Każdy kraj pokazuje najnowszy rok, jaki jest dostępny: od 2015 do 2026. Porównanie łączy różne lata i definicje, więc różnice o kilka dziesiątych nic nie znaczą.',
      'OECD zastrzega, że w części krajów płace etatowców są zaniżone: bez nadgodzin i premii, bez prywatnej praktyki, tylko sektor publiczny albo z lekarzami w trakcie specjalizacji.',
      'Tabela płac z aktu prawnego mówi, ile wynosi stawka, a nie ile lekarze faktycznie zarabiają, a płace szerszej grupy zawodów to nie płace lekarzy. Dlatego takie kraje są na mapie szare, a liczby są tylko w szczegółach kraju.',
      '„× pielęgniarka” dzieli płacę lekarza przez płacę pielęgniarki szpitalnej na etacie z tego samego roku; obie liczby pochodzą z OECD. Wykres zmian w szczegółach kraju pokazuje obie płace jako wielokrotność przeciętnej, przerwa w linii oznacza zmianę metody.',
      `„Jawność płac” mówi, czy da się poznać płacę konkretnego lekarza z pieniędzy publicznych: imiennie z urzędu, na wniosek albo częściowo, tylko tabele płac i średnie, czy wcale. Zbadaliśmy ${countries(f.transparent)}, przy każdym podajemy przepis. Żaden z nich nie publikuje łącznych wypłat z pieniędzy publicznych dla każdego lekarza; najbliżej są Włochy (tylko kadra kierownicza) i Kolumbia Brytyjska w Kanadzie (płatności z jednego planu).`,
      'Podatek dochodowy w szczegółach kraju to najwyższa stawka podatku od płac i próg, od którego obowiązuje, jako wielokrotność przeciętnej płacy brutto — tej samej, do której porównujemy płace lekarzy. Dla krajów OECD stawka obejmuje też podatki regionalne i lokalne (dla regionu wybranego przez OECD); dla pozostałych krajów pochodzi z przepisu krajowego. Bez składek na ubezpieczenia i bez ulg. Stawka dotyczy płac pracowników: dochód z własnej działalności bywa opodatkowany inaczej — dla Polski opisujemy ryczałt, w innych krajach tego nie sprawdzaliśmy.',
    ],
    /** etykiety głównych źródeł w kolejności WorldMethod (adresy są w komponencie) */
    main: (f: MethodFacts) => [
      'OECD, Remuneration of health professionals (OECD Health Statistics 2025), pobrane przez API 27.10.2026; płeć: ogółem',
      'OECD, Health at a Glance 2025 — Remuneration of general practitioners, część „Definition and comparability”',
      'OECD Health Statistics 2025 — Definitions, Sources and Methods: Remuneration of specialists',
      'GUS, Struktura wynagrodzeń według zawodów za październik 2024 r. — wyjaśnienia metodologiczne',
      'Bank Światowy, PPP conversion factor, private consumption (PA.NUS.PRVT.PP) i Official exchange rate (PA.NUS.FCRF)',
      'Eurostat, Purchasing power parities (prc_ppp_ind), spożycie gospodarstw domowych (A01)',
      `NBP, kursy średnie, tabela ${f.aTable} z ${f.date} i tabela ${f.bTable} z ${f.bDate}`,
      'OECD Tax Database, Personal income tax — top statutory and marginal tax rate (tabela I.7), pobrane przez API 28.10.2026',
    ],
  },
};

export type WorldText = typeof plText;
