/** Konfiguracja serwisu: nawigacja i elementy wspólne dla wszystkich stron. */
import type { IndexRef, Link, NavGroup, SearchDoc } from '@/types';
import { rightsGroups } from '@/data/prawa-pacjenta';
import { programGroups, programPage } from '@/data/program';
import { dzialajPage, writeToolOn } from '@/data/dzialaj';
import { barometrOthers, barometrPage, barometrParties } from '@/data/barometr-polityczny';
import { monitoring } from '@/lib/monitoring';
import { formatPL, plural } from '@/lib/format';

export const site = {
  name: 'zarobkilekarzy.pl',
  /** konto w serwisie X — twitter:site w podglądach linków */
  twitter: '@ZarobkiLekarzy',
  updated: new Date('2026-10-12'),
  announcement: { text: `Nowe: przeglądarka monitoringu płac — ${formatPL(monitoring.facilities.length)} ${plural(monitoring.facilities.length, ['placówka', 'placówki', 'placówek'])}`, href: '/dane/monitoring-watchdog/' },
};

const x: Link = { label: 'X @ZarobkiLekarzy', href: 'https://x.com/ZarobkiLekarzy' };

export const mainNav: Link[] = [
  { label: 'Start', href: '/' },
  { label: 'Dane', href: '/dane/', match: '/dane/' },
  { label: 'Mechanizmy', href: '/mechanizmy/', match: '/mechanizmy/' },
  { label: 'Analizy', href: '/analizy/', match: '/analizy/' },
  { label: 'Dla pacjenta', href: '/prawa-pacjenta/', match: '/prawa-pacjenta/' },
  { label: 'Zdaj LEK', href: '/egzamin/', match: '/egzamin/' },
  { label: 'Postulat', href: '/postulat/', match: '/postulat/' },
];

/** Wybrane zestawienia danych (spis na stronie głównej) — adresy i tytuły z kolekcji artykułów. */
export const dataSections: IndexRef[] = [
  { ref: 'rozklad-wynagrodzen' },
  { ref: 'wedlug-specjalizacji', badge: '29', label: 'Według specjalizacji' },
  { ref: 'zarobki-ujawnione-listy' },
  { ref: 'kolejki' },
  { ref: 'budzet-nfz' },
  { ref: 'zadluzenie-szpitali' },
  { ref: 'personel-medyczny' },
  { ref: 'zarobki-lekarzy-polska-sasiedzi', label: 'Polska na tle sąsiadów' },
];

/** Dodatkowe pozycje tylko w menu mobilnym. */
export const mobileExtras: Link[] = [];

export const topbarLinks: Link[] = [
  { label: 'Aktualności', href: '/aktualnosci/' },
  { label: 'Metodologia', href: '/o-projekcie/#zasady' },
  { label: 'Sprostowania', href: '/o-projekcie/#sprostowania' },
  x,
];

export const footerNav: NavGroup[] = [
  {
    title: 'Serwis',
    links: [
      { label: 'Mechanizmy', href: '/mechanizmy/' },
      { label: 'Dane', href: '/dane/' },
      { label: 'Analizy', href: '/analizy/' },
      { label: 'Słownik pojęć', href: '/slownik/' },
    ],
  },
  {
    title: 'Inicjatywa',
    links: [
      { label: 'O projekcie', href: '/o-projekcie/' },
      { label: 'Aktualności', href: '/aktualnosci/' },
      { label: 'Postulat', href: '/postulat/' },
      { label: 'Barometr polityczny', href: '/barometr-polityczny/' },
      { label: 'Najczęstsze zarzuty', href: '/faq/' },
      { label: 'Materiały medialne', href: '/media/' },
      { label: 'Metodologia', href: '/o-projekcie/#zasady' },
      { label: 'Sprostowania', href: '/o-projekcie/#sprostowania' },
      { label: 'Jak możesz pomóc', href: '/dzialaj/' },
    ],
  },
  {
    title: 'Społeczność',
    links: [
      x,
      // te same adresy co w stopce dotychczasowej strony (konta serwisu)
      { label: 'Wykop', href: 'https://wykop.pl/ludzie/zarobkilekarzy' },
      { label: 'Kod źródłowy (GitHub)', href: 'https://github.com/zarobkilekarzy/zarobkilekarzy.pl' },
      { label: 'Wesprzyj projekt na Suppi', href: 'https://suppi.pl/zarobkilekarzy' },
    ],
  },
];

/** Cele wyszukiwania, których nie ma w kolekcjach ani danych (sekcje stron). */
export const searchExtras: SearchDoc[] = [
  { id: 'postulat', title: 'Postulat: jawne kwoty, chronione nazwiska', category: 'Postulat', href: '/postulat/', keywords: ['jawny rejestr', 'jawność wynagrodzeń', 'pseudonimizacja'] },
  {
    id: 'dzialaj',
    title: writeToolOn ? 'Jak możesz pomóc: udostępnij, napisz do polityka' : 'Jak możesz pomóc: udostępnij, poleć projekt, przyślij dane',
    category: 'Postulat',
    href: dzialajPage.href,
    summary: dzialajPage.lead,
    keywords: ['działaj', 'poparcie projektu', 'udostępnij', 'infografiki', ...(writeToolOn ? ['napisz do posła', 'napisz do polityka', 'list do posła', 'senator'] : [])],
    sections: writeToolOn ? [{ title: 'Napisz do polityka', anchor: 'napisz' }] : [],
  },
  { id: 'aktualnosci', title: 'Aktualności: co nowego w projekcie', category: 'O serwisie', href: '/aktualnosci/', keywords: ['aktualności', 'komunikaty', 'nowości', 'zmiany na stronie', 'nowa wersja strony'] },
  { id: 'petycja', title: 'Petycja o jawny rejestr wynagrodzeń (archiwum)', category: 'Postulat', href: '/postulat/petycja/', keywords: ['petycja', 'PWZ'] },
  // kierunki z /program/ jako sekcje: „ewidencja czasu pracy” prowadzi prosto do kierunku
  {
    id: 'program',
    title: programPage.docTitle,
    category: 'Program',
    href: programPage.href,
    summary: programPage.lead,
    keywords: ['szerszy program', 'postulaty', 'reforma'],
    sections: programGroups.flatMap((g) => g.items).map((i) => ({ title: i.title, anchor: i.id })),
  },
  // nazwy partii i klubów z tej samej listy co karty — „Prawo i Sprawiedliwość” albo „Trzecia Droga” trafia w barometr
  {
    id: 'barometr-polityczny',
    title: barometrPage.docTitle,
    category: 'Barometr',
    href: barometrPage.href,
    summary: barometrPage.lead,
    keywords: [
      'partie', 'programy partii', 'polityka zdrowotna', 'stanowiska partii', 'pytania do partii', 'wybory', 'kluby poselskie', 'Sejm',
      ...[...barometrParties, ...barometrOthers].flatMap((p) => [p.name, p.club]),
      // powszechne skróty, których nie ma w nazwach
      'KO', 'PiS', 'PSL', 'NIL',
    ],
    sections: [
      { title: 'Partie w Sejmie', anchor: 'partie' },
      { title: 'O co pytamy partie', anchor: 'obszary' },
      { title: 'Zasady barometru', anchor: 'zasady' },
      { title: 'Zaproszenie dla partii', anchor: 'zaproszenie' },
    ],
  },
  { id: 'o-projekcie', title: 'O projekcie: cel, zasady, sprostowania', category: 'O serwisie', href: '/o-projekcie/', keywords: ['kontakt', 'sprostowanie', 'metodologia', 'zasady', 'kto prowadzi'] },
  { id: 'media', title: 'Materiały medialne: infografiki do pobrania', category: 'O serwisie', href: '/media/', keywords: ['infografika', 'grafiki', 'do pobrania', 'dla mediów', 'press kit', 'dziennikarze', 'licencja'] },
  { id: 'prywatnosc', title: 'Polityka prywatności', category: 'O serwisie', href: '/prywatnosc/', keywords: ['RODO', 'dane osobowe', 'ciasteczka', 'cookies', 'prywatność'] },
  { id: 'slownik', title: 'Słownik pojęć: kontrakt, kapitacja, ryczałt, gotowość', category: 'Słownik', href: '/slownik/', keywords: ['słowniczek', 'pojęcia', 'definicje', 'skróty', 'co to jest'] },
  { id: 'faq', title: 'Najczęstsze zarzuty wobec jawności płac', category: 'O serwisie', href: '/faq/', keywords: ['FAQ', 'zarzuty', 'pytania', 'populizm', 'RODO', 'OECD'] },
  { id: 'karta-praw-pacjenta', title: 'Karta praw pacjenta do druku (PDF)', category: 'Przewodnik', href: '/prawa-pacjenta/druk/', keywords: ['karta kieszonkowa', 'duży druk', 'wydruk', 'pdf'] },
  { id: 'kolejki-sor', title: 'Kolejki na SOR na żywo: mapa i normy czasu', category: 'Przewodnik', href: '/prawa-pacjenta/sor/', keywords: ['SOR', 'szpitalny oddział ratunkowy', 'kolejka', 'czas oczekiwania', 'triaż', 'TOPSOR', 'norma czasu'] },
  // pytania z /prawa-pacjenta/ jako sekcje: „kopia dokumentacji” prowadzi prosto do odpowiedzi
  {
    id: 'prawa-pacjenta-pytania',
    title: 'Prawa pacjenta: pytania i odpowiedzi',
    category: 'Przewodnik',
    href: '/prawa-pacjenta/',
    keywords: ['skarga', 'Rzecznik Praw Pacjenta', 'NFZ', 'odszkodowanie', 'błąd medyczny'],
    sections: [
      ...rightsGroups.flatMap((g) => g.items).map((i) => ({ title: i.q, anchor: i.id })),
      { title: 'Gdzie zgłosić naruszenie praw pacjenta', anchor: 'co-sie-stalo' },
      { title: 'Terminy: sprzeciw, wniosek, pozew', anchor: 'terminy' },
      { title: 'Świadczenie kompensacyjne: Fundusz czy sąd', anchor: 'fundusz' },
    ],
  },
  { id: 'metodologia', title: 'Metodologia i sprostowania', category: 'O serwisie', href: '/o-projekcie/#zasady' },
];

/** Pozycje pokazywane, zanim użytkownik coś wpisze (id celów wyszukiwania, zob. lib/search/build.ts). */
export const popularSearchIds = [
  'egzamin-lek',
  'wedlug-specjalizacji',
  'zarobki-ujawnione-listy',
  'prawa-pacjenta',
  'kontrakt-vs-etat',
  'postulat',
];
