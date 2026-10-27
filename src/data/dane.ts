/**
 * Strona /dane/: opisy działów i kluczowe liczby. Same zestawienia to wpisy kolekcji
 * `articles` z polem `topic` — spis buduje lib/content.ts → getTopicGroups(DATA_TOPICS, dataTopics).
 */
import type { DATA_TOPICS, KeyNumber, TopicInfo } from '@/types';

export const danePage = {
  title: 'Dane',
  lead: 'Zestawiamy wydatki publiczne, wynagrodzenia i dostępność świadczeń dla pacjenta. Zasada jest jedna: żadnej liczby bez źródła. Każdą oznaczamy jako dokładną albo szacunek i nie mieszamy tych kategorii.',
  /** meta description (lead jest dłuższy niż 160 znaków) */
  description: 'Zarobki lekarzy, budżet NFZ, długi szpitali i kolejki w liczbach. Każda liczba ma źródło i etykietę: dokładna albo szacunek — bez mieszania tych kategorii.',
  /** wyróżnione narzędzie */
  flagship: 'monitoring-watchdog',
  note: 'Nie publikujemy liczb „z pamięci”. Dopóki pole nie ma źródła, zostaje oznaczone jako „—”.',
};

export const dataTopics: Record<(typeof DATA_TOPICS)[number], TopicInfo> = {
  wynagrodzenia: {
    label: 'Wynagrodzenia',
    lead: 'Od pensji rezydenta po górny 1% — etaty, kontrakty, stawki i rekordy, z dokumentów.',
  },
  finanse: {
    label: 'Pieniądze publiczne',
    lead: 'Budżet NFZ, długi szpitali i to, co z tych pieniędzy ma pacjent w kolejce.',
  },
  zawod: {
    label: 'Droga do zawodu',
    lead: 'Egzamin LEK, rezydentura i 29 specjalizacji — pensje, miejsca i konkurencja.',
  },
  kadry: {
    label: 'Kadry i porównania',
    lead: 'Pielęgniarki, ratownicy, diagności — i Polska obok Czech, Niemiec i Austrii.',
  },
};

/** Osiem liczb na start: każda prowadzi do zestawienia z pełnym rozbiciem i źródłami. */
export const keyNumbers: (Omit<KeyNumber, 'href' | 'target'> & { ref: string })[] = [
  { value: '300 tys.', unit: 'zł / dzień', desc: 'Rekordowy dzień neurochirurga (zarzut — sprawa w toku).', ref: 'rekordy' },
  { value: '316 079', unit: 'zł / mies.', desc: 'Najwyższy kontrakt — w regionie, którego szpitale mają 1,4 mld zł długu.', ref: 'rekordy' },
  { value: '0', unit: 'rejestrów', desc: 'Publicznych rejestrów sumujących wypłaty jednego lekarza. To sedno problemu.', ref: 'projekt-nowelizacji-art-27a' },
  { value: '~73%', unit: 'na kontrakcie', desc: 'Specjalistów rozlicza się na umowach cywilnoprawnych — a sumy wypłat dla jednej osoby nikt nie liczy.', ref: 'kontrakt-vs-etat' },
  { value: '4,2', unit: 'miesiąca', desc: 'Średnio tyle czeka się na poradę specjalisty (Barometr WHC 2025), choć koszty w planie NFZ realnie podwoiły się od 2015 r.', ref: 'budzet-nfz' },
  { value: '40,8', unit: 'mld zł', desc: 'Dług publicznych szpitali w połowie 2026 r. — idzie głównie na pensje wypłacane „na kredyt”.', ref: 'zadluzenie-szpitali' },
  { value: '2,15', unit: 'mln zł / rok', desc: 'Najwyższy roczny dochód z pracy lekarza-radnego w sprawdzonych oświadczeniach majątkowych za 2025 r.', ref: 'lekarze-radni' },
  { value: '5,9', unit: 'piel. / 1000', desc: 'Pielęgniarek na 1000 mieszkańców — wobec 9,2 średnio w OECD.', ref: 'personel-medyczny' },
];
