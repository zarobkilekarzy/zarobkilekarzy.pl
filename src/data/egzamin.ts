/**
 * Moduł „Egzamin LEK”: egzaminy, tryby, sesje, dziedziny i treści strony /egzamin/.
 * Pytania przychodzą osobno (lib/egzamin/source.ts) — tu jest tylko to, co zna build i kreator.
 */
import { cemFields, cemQuestions, cemSessionCodes, cemSessions } from '@/lib/egzamin/cem';
import { isCounted } from '@/lib/egzamin/engine';
import type { ExamId, ExamQuestion, FieldInfo, ModeInfo, SessionInfo } from '@/lib/egzamin/types';

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

/** Sesje z jawnej bazy CEM (src/data/egzamin-lek, normalizator). W latach 2016–2020 CEM nie ujawniał pytań. */
export const SESSIONS: SessionInfo[] = cemSessions();

export const GAP_YEARS = '2016–2020';

export const FIELDS: Record<ExamId, FieldInfo[]> = { lek: cemFields('lek'), ldek: cemFields('ldek') };

/** Liczby bazy w nagłówku strony (stan jawnej bazy CEM). */
const ALL_QUESTIONS = (['lek', 'ldek'] as const).flatMap((exam) => cemSessionCodes(exam).flatMap(cemQuestions));

export const BANK = {
  questions: ALL_QUESTIONS.length,
  withStats: ALL_QUESTIONS.filter((q) => isCounted(q) && q.stats).length,
  sessions: SESSIONS.length,
  fields: FIELDS.lek.length,
};

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
  // Ten sam interfejs co window.lek (lib/egzamin/api.ts) — przy zmianie API aktualizuj oba miejsca.
  agentPrompt: `Rozwiąż pełny egzamin LEK (200 pytań) na https://zarobkilekarzy.pl/egzamin/ przez window.lek (JavaScript w karcie; funkcje zwracają Promise).

1. Najnowsza sesja: const [s] = await lek.sesje(); await lek.rozpocznij("egzamin", s.id)
2. Partiami po 25: await lek.pytania(1, 25), potem await lek.odpowiedzi({ 1: "A", 2: "C", … }); dalej 26–50 itd.
3. Gdy await lek.bezOdpowiedzi() zwróci [], await lek.zakoncz() zwraca wynik.

Odpowiadaj tylko z własnej wiedzy: bez czytania kodu i plików danych strony, bez internetu (klucz jest publiczny).

Podaj: sesję, punkty / maksimum i procent, próg i czy zdany, przeciętny wynik zdających, liczbę błędnych, bez odpowiedzi i unieważnionych oraz tabelę według dziedzin.`,
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
 * Pytanie na stronie głównej — z tej samej bazy co test, więc wygląda i działa jak tryb nauki.
 * Prawdziwe pytanie CEM (LEK jesień 2026, nr 4); brak go w danych zatrzymuje build.
 */
export const sampleQuestion: ExamQuestion = (() => {
  const q = ALL_QUESTIONS.find((x) => x.id === '20262:4');
  if (!q || !isCounted(q)) throw new Error('[egzamin] brak pytania 20262:4 w src/data/egzamin-lek');
  return q;
})();
