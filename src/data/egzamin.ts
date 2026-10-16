/**
 * Moduł „Egzamin LEK”: egzaminy, tryby, sesje, dziedziny i treści strony /egzamin/.
 * Pytania przychodzą osobno (lib/egzamin/source.ts) — tu jest tylko to, co zna build i kreator.
 */
import type { ExamId, FieldInfo, ModeInfo, QuestionBody, SessionInfo } from '@/lib/egzamin/types';
import { demoQuestions } from './egzamin-demo';

/** Zasady egzaminu z rozporządzenia MZ (Dz.U. 2021 poz. 828). */
export const RULES = { questions: 200, minutes: 240, threshold: 0.56 } as const;

export const MODES: ModeInfo[] = [
  {
    id: 'nauka',
    label: 'Nauka',
    desc: 'Po każdej odpowiedzi od razu widzisz prawidłową i to, jak odpowiadała sala.',
    facts: ['bez limitu czasu', 'odpowiedź od razu'],
    instant: true,
    scoped: true,
  },
  {
    id: 'szybki',
    label: 'Szybki test',
    desc: '20 losowych pytań w tempie egzaminu. Na przerwę na kawę.',
    facts: ['20 pytań', '24 min'],
    instant: false,
    size: 20,
    minutesPerQuestion: RULES.minutes / RULES.questions,
    scoped: true,
  },
  {
    id: 'egzamin',
    label: 'Pełny egzamin',
    desc: 'Cała sesja i odliczanie czasu. Wynik dopiero na końcu, jak w sali egzaminacyjnej.',
    facts: ['200 pytań', '4 h', 'próg 56%'],
    instant: false,
    minutesPerQuestion: RULES.minutes / RULES.questions,
    scoped: false,
  },
];

export const EXAMS: { id: ExamId; label: string; name: string }[] = [
  { id: 'lek', label: 'LEK', name: 'Lekarski Egzamin Końcowy' },
  { id: 'ldek', label: 'LDEK', name: 'Lekarsko-Dentystyczny Egzamin Końcowy' },
];

/** Lata z opublikowanymi pytaniami. W latach 2016–2020 CEM nie ujawniał pytań. */
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2015, 2014, 2013];

export const SESSIONS: SessionInfo[] = YEARS.flatMap((year) => [
  { id: `${year}-jesien`, label: `jesień ${year}`, year, season: 'jesien' as const, count: RULES.questions },
  { id: `${year}-wiosna`, label: `wiosna ${year}`, year, season: 'wiosna' as const, count: RULES.questions },
]);

export const GAP_YEARS = '2016–2020';

export const FIELDS: Record<ExamId, FieldInfo[]> = {
  lek: [
    { id: 'interna', label: 'Choroby wewnętrzne', short: 'Interna' },
    { id: 'pediatria', label: 'Pediatria', short: 'Pediatria' },
    { id: 'chirurgia', label: 'Chirurgia', short: 'Chirurgia' },
    { id: 'ginekologia', label: 'Położnictwo i ginekologia', short: 'Ginekologia' },
    { id: 'ratunkowa', label: 'Medycyna ratunkowa i intensywna terapia', short: 'Ratunkowa' },
    { id: 'rodzinna', label: 'Medycyna rodzinna', short: 'Rodzinna' },
    { id: 'psychiatria', label: 'Psychiatria', short: 'Psychiatria' },
    { id: 'bioetyka', label: 'Bioetyka i prawo medyczne', short: 'Bioetyka' },
    { id: 'zdrowie-publiczne', label: 'Zdrowie publiczne', short: 'Zdr. publiczne' },
    { id: 'orzecznictwo', label: 'Orzecznictwo lekarskie', short: 'Orzecznictwo' },
  ],
  ldek: [
    { id: 'zachowawcza', label: 'Stomatologia zachowawcza z endodoncją', short: 'Zachowawcza' },
    { id: 'protetyka', label: 'Protetyka stomatologiczna', short: 'Protetyka' },
    { id: 'chirurgia-stom', label: 'Chirurgia stomatologiczna', short: 'Chirurgia' },
    { id: 'dziecieca', label: 'Stomatologia dziecięca', short: 'Dziecięca' },
    { id: 'ortodoncja', label: 'Ortodoncja', short: 'Ortodoncja' },
    { id: 'periodontologia', label: 'Periodontologia', short: 'Periodontologia' },
  ],
};

/** Liczby bazy w nagłówku strony (stan jawnej bazy CEM). */
export const BANK = {
  questions: 3600,
  withStats: 3528,
  sessions: SESSIONS.length,
  fields: FIELDS.lek.length,
};

/**
 * Rozkład wyników innych użytkowników (10 przedziałów po 10 pp.) — porównanie w podsumowaniu.
 * DEMO: liczby przykładowe; w produkcji przychodzą z anonimowej zbiórki wyników.
 */
export const DEMO_DISTRIBUTION = [2, 4, 9, 21, 48, 96, 131, 102, 41, 6];

/** Pochodzenie pytań vs skuteczność zdających — obliczenia redakcji na wskaźnikach trudności CEM. */
export const ORIGIN_TABLE = {
  sessions: 'jesień 2026, wiosna 2023',
  rows: [
    { label: 'z jawnej bazy CEM', count: 289, share: 83 },
    { label: 'nowe', count: 103, share: 64.6 },
  ],
  note: 'Pytania przypisane do bazy przez porównanie treści z plikami „Baza pytań do LEK” (CEM); unieważnione pominięte. Różnica nie musi wynikać tylko z jawności — nowe pytania mogą być też trudniejsze same w sobie.',
};

export const egzaminPage = {
  title: 'Egzamin LEK',
  lead: '200 pytań jednokrotnego wyboru, 4 godziny, próg 56%. Pytania są jawne: CEM publikuje je po każdej sesji z kluczem i statystyką odpowiedzi. Rozwiąż cały egzamin, szybki test albo ucz się pytanie po pytaniu.',
  privacy:
    'Odpowiedzi, postęp i notatki zostają w tej przeglądarce. Do porównania z innymi trafia anonimowo tylko wynik ukończonego testu: sesja, tryb, punkty i czas.',
  agentPrompt:
    'Na stronie https://zarobkilekarzy.pl/egzamin/ jest obiekt window.lek (wszystkie funkcje zwracają Promise). Przeczytaj window.lek.opis, potem: await lek.rozpocznij("szybki", "2026-jesien"); pobieraj pytania przez lek.pytania(1, 20), odpowiadaj z własnej wiedzy przez lek.odpowiedzi({ 1: "A", 2: "C", … }), a na koniec wywołaj lek.zakoncz() i podaj wynik z lek.wynik().',
};

/** Źródła zasad i jawności — wspólne dla sekcji „Skąd te pytania” i stopki źródeł. */
export const egzaminSources = [
  { label: 'Baza pytań LEK — Centrum Egzaminów Medycznych', href: 'https://cem.edu.pl/pytcem/eula_lek_p.php' },
  { label: 'Art. 14c ustawy o zawodach lekarza i lekarza dentysty', href: 'https://lexlege.pl/ustawa-o-zawodach-lekarza-i-lekarza-dentysty/art-14c/' },
  { label: 'Rozporządzenie MZ, Dz.U. 2021 poz. 828', href: 'https://api.sejm.gov.pl/eli/acts/DU/2021/828/text.html' },
  { label: 'Wyrok NSA I OSK 2466/19 — Sieć Obywatelska Watchdog', href: 'https://siecobywatelska.pl/wazna-wygrana-nsa-pominal-niekonstytucyjne-przepisy-w-sprawie-jawnosci-egzaminow-medycznych/' },
  { label: 'Projekt likwidacji jawnej bazy — Termedia', href: 'https://www.termedia.pl/mz/LEK-i-LDEK-bez-jawnej-bazy-pytan,65929.html' },
];

/**
 * Pytanie przykładowe na stronie głównej — z tego samego banku co test, więc wygląda
 * i działa jak tryb nauki. Brak pytania w banku zatrzymuje build.
 */
export const sampleQuestion: QuestionBody = (() => {
  const q = demoQuestions.find((x) => x.exam === 'lek' && x.text.startsWith('Odtrutką stosowaną w zatruciu paracetamolem'));
  if (!q) throw new Error('[egzamin] brak pytania przykładowego w data/egzamin-demo.ts');
  return q;
})();
