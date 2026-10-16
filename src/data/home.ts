/**
 * Treści strony głównej (copy). Kształty danych pochodzą z src/types.ts,
 * więc te same bloki można wypełnić innymi danymi na podstronach.
 * Treści współdzielone (artykuły, słowniczek) żyją w kolekcjach — src/content.
 */
import type { BarRow, Link, PathCard, Stat, TextItem, Tool, Topic } from '@/types';
import { LINKS } from '@/data/rekordy';
import { CURRENT, formatMld } from '@/data/budzet-nfz';
import { monitoring } from '@/lib/monitoring';
import { formatPL, plural } from '@/lib/format';

import imgKontrakty from '@/assets/img/temat-kontrakty.jpg';
import imgDyzury from '@/assets/img/temat-dyzury.jpg';
import imgKolejki from '@/assets/img/temat-kolejki.jpg';
import imgKsztalcenie from '@/assets/img/temat-ksztalcenie.jpg';

export const heroPopular: Link[] = [
  { label: 'Stawki godzinowe', href: '/dane/rozklad-wynagrodzen/' },
  { label: 'Pensje rezydentów', href: '/dane/wedlug-specjalizacji/' },
  { label: 'Kontrakt czy etat?', href: '/mechanizmy/kontrakt-vs-etat/' },
  { label: 'Prawa pacjenta', href: '#pacjent' },
];

export const keyNumbers: Stat[] = [
  {
    value: 316079,
    unit: 'zł / mies.',
    desc: 'najwyższy jawny kontrakt lekarza — szpitale wojewódzkie Mazowsza, 2025 r.',
    accuracy: 'exact',
    source: 'Rynek Zdrowia',
    href: LINKS.rzMazowsze,
  },
  {
    prefix: '~',
    value: 73,
    unit: '%',
    desc: 'specjalistów pracuje na kontrakcie B2B — kwot tych umów nikt nie publikuje',
    accuracy: 'est',
    source: 'Formy zatrudnienia',
  },
  {
    value: 4.2,
    decimals: 1,
    unit: 'mies.',
    desc: 'średni czas oczekiwania na specjalistę, choć budżet NFZ od 2015 r. realnie się podwoił',
    accuracy: 'exact',
    source: 'Barometr WHC 2025',
  },
  {
    value: 34,
    unit: 'mld zł',
    desc: 'zadłużenia szpitali — w większości związanego z kosztami wynagrodzeń',
    accuracy: 'exact',
    source: 'Zadłużenie SPZOZ',
  },
];

export const paths: PathCard[] = [
  {
    kicker: 'Jestem pacjentem',
    title: 'Prawa, kolejki i Twoje konto',
    desc: 'Co Ci przysługuje u lekarza, jak sprawdzić w IKP rozliczone wizyty i gdzie zgłosić naruszenie — z podstawą prawną.',
    tags: ['Prawa pacjenta', 'IKP', 'Kolejki'],
    href: '#pacjent',
  },
  {
    kicker: 'Chcę zrozumieć zarobki',
    title: 'Ile i za co płacimy lekarzom',
    desc: 'Od pensji rezydenta po górny 1%. Etaty, kontrakty, dyżury i stawki godzinowe w 29 specjalizacjach.',
    tags: ['Specjalizacje', 'Kontrakty', 'Dyżury'],
    href: '#dane',
    featured: true,
  },
  {
    kicker: 'Idę na medycynę',
    title: 'Droga do zawodu krok po kroku',
    desc: 'Limity miejsc, egzamin LEK, rezydentura i wybór specjalizacji. Co Cię czeka po dyplomie i ile to trwa.',
    tags: ['LEK', 'Rezydentura', 'Limity'],
    href: '#narzedzia',
  },
];

export const topics: Topic[] = [
  { title: 'Kontrakty i etaty', desc: '~73% specjalistów rozlicza się jako firma. Co to zmienia?', href: '/mechanizmy/kontrakt-vs-etat/', image: imgKontrakty, position: '42% 50%' },
  { title: 'Dyżury i wieloetatowość', desc: 'Kilka placówek, kilka umów — i nikt nie widzi sumy.', href: '/mechanizmy/wieloetatowosc/', image: imgDyzury, position: '55% 50%' },
  { title: 'Pieniądze a kolejki', desc: 'Budżet NFZ rośnie, czas oczekiwania nie maleje. Dlaczego?', href: '/dane/kolejki/', image: imgKolejki, position: '32% 50%' },
  { title: 'Dostęp do zawodu', desc: 'Limity miejsc i puste rezydentury. Skąd biorą się braki?', href: '/mechanizmy/reglamentacja-dostepu/', image: imgKsztalcenie, position: '50% 50%' },
];

export const waitingTimes: { rows: BarRow[]; max: number; average: number } = {
  max: 14,
  average: 4.2,
  rows: [
    { label: 'Neurochirurg', value: 13.1, display: '13,1', highlight: true },
    { label: 'Endokrynolog', value: 12.9, display: '12,9' },
    { label: 'Gastroenterolog', value: 9.9, display: '9,9' },
    { label: 'Kardiolog', value: 4.6, display: '4,6' },
    { label: 'Okulista', value: 3.0, display: '3,0' },
  ],
};

export const steps: TextItem[] = [
  {
    title: 'Płacimy wszyscy.',
    text: `Z naszych składek i dotacji z budżetu NFZ planuje wydać w 2026 r. ok. ${formatMld(CURRENT.costs)} mld zł. Duża część trafia do szpitali i przychodni, a stamtąd — na wynagrodzenia.`,
  },
  {
    title: 'Nikt nie widzi sumy.',
    text: 'Lekarz może pracować w kilku placówkach naraz — na etacie, kontrakcie i dyżurach. Każda płaci osobno, a łącznej kwoty nie publikuje nikt.',
  },
  {
    title: 'Rozwiązanie jest proste.',
    text: 'Co kwartał jawne dane o łącznych wynagrodzeniach z placówek z umową z NFZ — pod stałym identyfikatorem, bez nazwisk.',
  },
];

export const rights: TextItem[] = [
  { title: 'Informacja o stanie zdrowia', text: 'Zrozumiała, pełna — także o rokowaniu i alternatywnych metodach leczenia.' },
  { title: 'Druga opinia', text: 'Możesz poprosić lekarza o konsultację z innym lekarzem.' },
  { title: 'Leczenie bólu', text: 'Placówka ma obowiązek ocenić ból i go łagodzić.' },
  { title: 'Dokumentacja medyczna', text: 'Pierwsza kopia w żądanym zakresie jest bezpłatna.' },
];

export const tools: Tool[] = [
  {
    icon: 'pin',
    label: 'Przeglądarka',
    title: 'Monitoring płac lekarzy',
    desc: `${formatPL(monitoring.facilities.length)} ${plural(monitoring.facilities.length, ['placówka publiczna', 'placówki publiczne', 'placówek publicznych'])}. Kto ujawnił dane o wynagrodzeniach, kto odmówił, kto milczy.`,
    href: '/dane/monitoring-watchdog/',
  },
  {
    icon: 'chart',
    label: 'Symulator',
    title: 'Podaż lekarzy 1987–2050',
    desc: 'Zmieniaj limity przyjęć na studia i zobacz, ilu lekarzy będzie praktykować za 10, 20 i 30 lat.',
    href: '/analizy/symulator-podazy-lekarzy/',
  },
];

export const principles: TextItem[] = [
  { title: 'Źródło przy każdej liczbie', text: 'Linkujemy wyłącznie do ogólnodostępnych dokumentów, danych i odpowiedzi na wnioski o informację publiczną.' },
  { title: 'Szacunek to nie fakt', text: 'Każdą daną oznaczamy jako dokładną lub szacunkową. Puste pola zostawiamy puste — nie zgadujemy.' },
  { title: 'Mechanizmy, nie nazwiska', text: 'Opisujemy, jak działa system. Nie wskazujemy konkretnych lekarzy i nie publikujemy danych osobowych.' },
  { title: 'Prawo do sprostowania', text: 'Widzisz błąd? Napisz do nas. Poprawiamy tekst i zmieniamy datę aktualizacji.' },
];
