/**
 * Serie: teksty o jednej sprawie z różnych stron (np. ustawy o płacach medyków), pokazane w każdym
 * z nich ramką article/Series. Kolejność pozycji = kolejność w ramce: najpierw prawo obowiązujące,
 * potem projekty w Sejmie, na końcu projekty spoza Sejmu. Artykuł należy do serii, gdy jego id
 * jest w `items` — pole we frontmatterze nie jest potrzebne (lib/content.ts → getSeries).
 */
import { currentStage } from '@/data/projekt-ustawy';

export interface SeriesItem {
  /** id artykułu w kolekcji `articles` (adres z articleHref) */
  ref: string;
  /** krótki tytuł do ramki — tytuły artykułów bywają za długie */
  title: string;
  note: string;
  /** stan aktu: kształt znacznika w ramce (law — pełny, bill — z obwódką, proposal — pusty) */
  state: 'law' | 'bill' | 'proposal';
  /** etykieta stanu, np. „Obowiązuje od 5.08.2026” */
  status: string;
}

export interface Series {
  title: string;
  /** jedno–dwa zdania: jak teksty serii mają się do siebie */
  intro: string;
  items: SeriesItem[];
  /** strona z całą serią pogrupowaną według stanu (link „Wszystkie” w ramce) */
  href?: string;
  /** słowa dla wyszukiwarki: trafiają do każdego tekstu serii i do jej strony (lib/search/build.ts) */
  keywords?: string[];
}

/** Działy strony serii (np. /ustawy/) — jeden na stan, w kolejności ramki. */
export const seriesStates: Record<SeriesItem['state'], { label: string; lead: string }> = {
  law: {
    label: 'Obowiązujące ustawy',
    lead: 'Przepisy, które już działają: co z nich wynika dla płac i jawności i czego nie obejmują.',
  },
  bill: {
    label: 'Projekty w Sejmie',
    lead: 'Projekty w trakcie prac parlamentarnych. Tekst aktualizujemy po każdym etapie, zmiany są w historii pod tekstem.',
  },
  proposal: {
    label: 'Projekt obywatelski',
    lead: 'Propozycja tej strony: tekst przepisu, uzasadnienie i pytania do weryfikacji prawnej.',
  },
};

export const series: Series[] = [
  {
    title: 'Ustawy na stronie',
    intro: 'Teksty o przepisach, które opisujemy: od obowiązujących ustaw, przez projekty w Sejmie, po projekt obywatelski tej strony.',
    href: '/ustawy/',
    keywords: ['ustawa', 'ustawy', 'projekt ustawy', 'przepisy', 'prawo'],
    items: [
      {
        ref: 'zarobki-dyrektorow-szpitali',
        title: 'Ustawa kominowa',
        note: 'Sufit pensji kierownika szpitala, który nie obejmuje kontraktów lekarzy',
        state: 'law',
        status: 'Obowiązuje · ustawa z 3.03.2000',
      },
      {
        ref: 'ustawa-o-danych-a-jawny-rejestr',
        title: 'Ustawa o danych płacowych',
        note: 'Co minister może zebrać i czego nie pokaże',
        state: 'law',
        status: 'Obowiązuje od 5.08.2026',
      },
      {
        ref: 'limity-wynagrodzen-medykow',
        title: 'Limity płac medyków',
        note: 'Ile wolno zapłacić i kto to sprawdza',
        state: 'bill',
        status: 'Rządowy projekt w Sejmie · druk nr\u00a03157',
      },
      {
        ref: 'projekt-nowelizacji-art-27a',
        title: 'Projekt nowelizacji art. 27a',
        note: 'Propozycja tej strony: kwartalne dane o płacach pod pseudonimem',
        state: 'proposal',
        status: `Projekt obywatelski · ${currentStage.label.toLowerCase()}`,
      },
    ],
  },
];
