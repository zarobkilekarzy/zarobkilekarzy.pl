/**
 * Analiza /analizy/sladem-zlotowki/: cztery przystanki diagramu i bilans przychodów z projektu planu NFZ
 * na 2026 r. Tekst i przypisy są w content/articles/sladem-zlotowki.mdx.
 *
 * Plan NFZ na 2026 r. ma kilka wersji. Tabela pokazuje projekt z lipca 2025 r. (stenogram Komisji Zdrowia
 * nr 88, kwoty w tys. zł). Wersję po zmianach (MZ, 18.09.2026: dotacja 33,6 mld zł, koszty 223,43 mld zł
 * według stanu na 11.09.2026) podaje tekst artykułu. Gdy w BIP NFZ pojawi się nowsza wersja, podmień
 * kwoty tutaj i daty w tekście.
 *
 * Liczby (STOPS, PLAN_2026_*) czyta też wersja angielska — src/data/en/sladem-zlotowki.ts.
 */
import { formatPL } from '@/lib/format';
import type { CompareTable } from '@/types';

/** Adresy przy liczbach w blokach (Figure, StatRow); te same publikacje są w przypisach artykułu. */
export const LINKS = {
  /** Sejm, pełny zapis posiedzenia Komisji Zdrowia nr 88 (9.07.2025) — projekt planu NFZ na 2026 r. */
  kz88: 'https://api.sejm.gov.pl/sejm/term10/committees/ZDR/sittings/88/pdf',
  /** MZ, odpowiedź na interpelację nr 19444 (18.09.2026) — dotacja 33,6 mld zł, koszty 223,43 mld zł */
  mz19444: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDY7JAZ/i19444-o1.pdf',
  /** NIK, Realizacja zadań przez NFZ w latach 2021–2024 (KZD.430.5.2024) — pokrycie kosztów, niezapłacone świadczenia */
  nikNfz: 'https://www.nik.gov.pl/plik/id,30820,vp,33892.pdf',
} as const;

/* ---------- Diagram: cztery przystanki ---------- */

export interface Stop {
  name: string;
  /** co dzieje się z pieniędzmi */
  what: string;
  /** co da się sprawdzić w publicznych źródłach */
  visible: string;
  /** czego nie widać */
  hidden: string;
  /** ocena redakcji: 3 = widać, 0 = nie widać */
  level: 0 | 1 | 2 | 3;
  levelLabel: string;
}

/** Bez liczb: liczby i ich źródła są w tekście przystanków. */
export const STOPS: Stop[] = [
  {
    name: 'Składka',
    what: 'Pracownik i przedsiębiorca płacą procent od dochodu, rolnik — kwotę od hektara, a za część osób płaci budżet.',
    visible: 'Stawki zapisane w ustawie i kwoty zbiorcze w planie NFZ.',
    hidden: 'Dokąd pójdzie Twoja złotówka — to rozstrzyga się dopiero na kolejnych przystankach.',
    level: 3,
    levelLabel: 'widać',
  },
  {
    name: 'Plan NFZ',
    what: 'Składka, dotacja z budżetu i mniejsze przychody trafiają do jednego planu finansowego Funduszu.',
    visible: 'Plan i jego zmiany: sumy przychodów i kosztów.',
    hidden: 'Plan zmienia się w ciągu roku, więc „budżet NFZ” bez daty wersji nic nie mówi.',
    level: 3,
    levelLabel: 'widać sumy',
  },
  {
    name: 'Wycena i rozliczenie ze szpitalem',
    what: 'NFZ ustala cenę świadczeń i płaci placówce — szpitalom z sieci głównie ryczałtem na cały okres.',
    visible: 'Ceny w zarządzeniach Prezesa NFZ i taryfach AOTMiT.',
    hidden: 'Na jakich kosztach oparto większość cen i ile realnie kosztował pojedynczy zabieg.',
    level: 1,
    levelLabel: 'widać cenę, nie koszt',
  },
  {
    name: 'Wypłata lekarzowi',
    what: 'Szpital płaci lekarzowi pensję na etacie albo — częściej u specjalistów — kwotę z umowy cywilnoprawnej.',
    visible: 'Ustawowe minimum na etacie i zbiorcze dane AOTMiT z pojedynczych placówek.',
    hidden: 'Łącznej kwoty dla jednej osoby z kilku placówek. Państwo może ją zebrać, obywatel jej nie zobaczy.',
    level: 0,
    levelLabel: 'suma dla osoby niejawna',
  },
];

/* ---------- Plan NFZ na 2026 r.: przychody (projekt z lipca 2025 r.) ---------- */

/** Przychody ogółem w projekcie planu, tys. zł (Komisja Zdrowia nr 88, 9.07.2025). */
export const PLAN_2026_TOTAL = 217_388_948;

/** Pozycje wymienione z kwotą w wystąpieniu NFZ, tys. zł. */
export const PLAN_2026_ITEMS = [
  { label: 'Składka zdrowotna (należna brutto)', value: 184_347_480 },
  { label: 'Dotacja podmiotowa z budżetu państwa', value: 26_000_000 },
  { label: 'Fundusz Medyczny i Fundusz Solidarnościowy', value: 2_628_225 },
  { label: 'Opłaty cukrowa i alkoholowa', value: 1_799_890 },
  { label: 'Przychody finansowe', value: 292_724 },
];

/**
 * „Pozostałe przychody” (m.in. programy unijne, umowy związane z ustawą refundacyjną) liczymy jako różnicę
 * do sumy: ok. 2,32 mld zł. W wystąpieniu NFZ to „0,86% przychodów”, czyli ok. 1,87 mld zł — zapis nie
 * domyka się o ok. 0,45 mld zł (pomyłka w stenogramie albo pozycja bez nazwy).
 */
export const PLAN_2026_REST = PLAN_2026_TOTAL - PLAN_2026_ITEMS.reduce((sum, item) => sum + item.value, 0);

export const PLAN_2026 = {
  contribution: PLAN_2026_ITEMS[0].value,
  subsidy: PLAN_2026_ITEMS[1].value,
  /** wszystko poza składką i dotacją, tys. zł (ok. 7,04 mld zł) */
  other: PLAN_2026_TOTAL - PLAN_2026_ITEMS[0].value - PLAN_2026_ITEMS[1].value,
  /** koszty świadczeń opieki zdrowotnej w projekcie planu, tys. zł */
  benefitCosts: 201_202_778,
} as const;

/** mld zł z tys. zł */
export const bn = (thousands: number, decimals = 2) => formatPL(thousands / 1_000_000, decimals);
const share = (thousands: number) => formatPL((thousands / PLAN_2026_TOTAL) * 100, 1);

export const PLAN_2026_TABLE: CompareTable = {
  columns: ['Przychód', 'mld zł', 'Udział'],
  rows: [
    ...[...PLAN_2026_ITEMS, { label: 'Pozostałe przychody (różnica do sumy)', value: PLAN_2026_REST }].map((item) => ({
      cells: [item.label, bn(item.value), `${share(item.value)}%`],
    })),
    { cells: ['Razem', bn(PLAN_2026_TOTAL), '100%'], marked: true },
  ],
};
