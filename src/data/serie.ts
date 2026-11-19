/**
 * Serie: teksty o jednej sprawie z różnych stron (np. ustawy o płacach medyków), zebrane na stronie serii
 * (/ustawy/). Kolejność pozycji: najpierw prawo obowiązujące, potem projekty w Sejmie, na końcu projekty
 * spoza Sejmu. Artykuł należy do serii, gdy jego id jest w `items` — pole we frontmatterze nie jest
 * potrzebne (lib/content.ts → getSeries). Ramki serii nad treścią artykułu nie ma od 18.11.2026.
 */
import { currentStage, projekt, stages as projektStages } from '@/data/projekt-ustawy';
import type { Stage } from '@/types';

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
  /** tablica /ustawy/: jedno zdanie — co akt ujawnia, a czego nie */
  openness?: string;
  /** tablica /ustawy/: tekst aktu albo projektu (źródło pierwotne) */
  act?: { label: string; href: string };
  /** tablica /ustawy/: etapy prac nad projektem; ustawa obowiązująca ich nie ma */
  stages?: Stage[];
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
        openness: 'Pensja dyrektora jest w jawnym oświadczeniu majątkowym. Kontraktu lekarza nie obejmuje ani limit, ani obowiązek ujawnienia.',
        act: { label: 'Dz.U. 2019 poz. 2136', href: 'https://api.sejm.gov.pl/eli/acts/DU/2019/2136/text.pdf' },
      },
      {
        ref: 'ustawa-o-danych-a-jawny-rejestr',
        title: 'Ustawa o danych płacowych',
        note: 'Co minister może zebrać i czego nie pokaże',
        state: 'law',
        status: 'Obowiązuje od 5.08.2026',
        openness: 'Minister może zebrać dane o płacy każdej osoby, z numerem PESEL i PWZ. Ustawa nie przewiduje ich publikacji.',
        act: { label: 'Dz.U. 2026 poz. 972', href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/972/text.pdf' },
      },
      {
        ref: 'limity-wynagrodzen-medykow',
        title: 'Limity płac medyków',
        note: 'Ile wolno zapłacić i kto to sprawdza',
        state: 'bill',
        status: 'Po poprawkach Senatu, u prezydenta · druk nr\u00a03389',
        openness: 'Nie ujawnia kwot. Jawny miał być tylko rejestr zakazów pracy na NFZ, ale nie wszedł do ustawy.',
        act: { label: 'Druk senacki nr 893', href: 'https://www.senat.gov.pl/download/gfx/senat/pl/senatdruki/14799/druk/893.pdf' },
        stages: [
          { label: 'Projekt rządu', state: 'done' },
          { label: 'Sejm', state: 'done' },
          { label: 'Senat', state: 'done' },
          { label: 'Sejm: poprawki Senatu', state: 'done' },
          { label: 'Prezydent', state: 'current' },
          { label: 'Wejście w życie', state: 'next' },
        ],
      },
      {
        ref: 'projekt-nowelizacji-art-27a',
        title: 'Projekt nowelizacji art. 27a',
        note: 'Propozycja tej strony: kwartalne dane o płacach pod pseudonimem',
        state: 'proposal',
        status: `Projekt obywatelski · ${currentStage.label.toLowerCase()}`,
        openness: 'Kwartalne dane o łącznym wynagrodzeniu każdej osoby ze wszystkich placówek z umową z NFZ, pod stałym pseudonimem zamiast nazwiska.',
        act: { label: 'Projekt, wersja robocza (PDF)', href: projekt.pdf.href },
        stages: projektStages,
      },
    ],
  },
];
