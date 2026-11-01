/**
 * Strona-ścieżka /dla-pacjenta/.
 * Układ jak /mechanizmy/: sekcje-pytania ze zdjęciem i liczbą, do tego małe narzędzie w tekście sekcji.
 * Liczby i odpowiedzi pochodzą z modułów źródłowych; tu tylko układ ścieżki i krótkie wprowadzenia.
 * Moduł czyta też wersja angielska: src/data/en/dla-pacjenta.ts.
 */
import type { ImageMetadata } from 'astro';
import { LINKS as QUEUE_LINKS, SPECIALISTS_2025 } from '@/data/kolejki';
import { routes } from '@/data/prawa-pacjenta';
import { formatPL } from '@/lib/format';
import type { Entry } from '@/lib/pacjent/types';
import type { MonitorEffect } from '@/lib/siatka';

import imgPrawa from '@/assets/img/pacjent-konsultacja.jpg';
import imgPilnie from '@/assets/img/temat-dyzury.jpg';
import imgKonto from '@/assets/img/mechanizm-jawnosc.jpg';
import imgKolejka from '@/assets/img/temat-kolejki.jpg';
import imgSkarga from '@/assets/img/sad-lekarski-sala.jpg';

export const pathPage = {
  title: 'Dla pacjenta',
  docTitle: 'Dla pacjenta: prawa, kolejki, konto i skargi',
  eyebrow: 'Ścieżka · pięć sytuacji',
  description: 'Pięć sytuacji pacjenta: co Ci przysługuje, jak działa kolejka na SOR, jak sprawdzić IKP, dlaczego się czeka i dokąd iść, gdy coś poszło nie tak.',
  lead: 'Pięć sytuacji, w których dobrze wiedzieć, na czym stoisz. Wybierz swoją albo przejdź je po kolei. Przy każdej jest coś do sprawdzenia od razu.',
};

export interface StopLink {
  /** id artykułu; bez niego potrzebne `href` i `label` */
  ref?: string;
  href?: string;
  label?: string;
  anchor?: string;
}

export interface Stop {
  id: string;
  /** etykieta nad pytaniem */
  short: string;
  question: string;
  lead: string;
  /** wejście na górze strony: ikona i co można tu zrobić */
  entry: Pick<Entry, 'icon' | 'text'>;
  image: ImageMetadata;
  position?: string;
  effect: MonitorEffect;
  /** liczba na zdjęciu; źródło jest przy narzędziu w sekcji */
  badge: { value: string; label: string; note: string };
  /** tekst główny („Zacznij tu”) */
  main: StopLink;
  more: StopLink[];
}

export const stops: Stop[] = [
  {
    id: 'prawa',
    short: 'Mam prawo',
    question: 'Co mi przysługuje',
    lead: 'Prawa pacjenta najłatwiej sprawdzić na konkretnych pytaniach, a przy każdej odpowiedzi stoi artykuł ustawy. Zobacz, ile z nich znasz, zanim przeczytasz całość.',
    entry: { icon: 'shield', text: 'Krótki test: przy każdej odpowiedzi artykuł ustawy.' },
    image: imgPrawa,
    position: '60% 50%',
    effect: 'pulse',
    badge: { value: '0 zł', label: 'pierwsza kopia dokumentacji medycznej', note: 'art. 28 ustawy o prawach pacjenta' },
    main: { ref: 'prawa-pacjenta' },
    more: [
      { label: 'Karta kieszonkowa do druku', href: '/prawa-pacjenta/druk/' },
    ],
  },
  {
    id: 'pilnie',
    short: 'Pilnie',
    question: 'Jak działa kolejka na SOR',
    lead: 'O kolejności decyduje stan zdrowia, nie godzina przyjazdu. Po wstępnej ocenie, czyli triażu, dostajesz jedną z pięciu kategorii pilności, a każda ma najdłuższy dopuszczalny czas do lekarza.',
    entry: { icon: 'alert', text: 'Ile osób czeka teraz i ile najdłużej możesz czekać po triażu.' },
    image: imgPilnie,
    position: '55% 50%',
    effect: 'ekg',
    badge: { value: '5', label: 'kategorii pilności, każda z własną normą czasu', note: 'rozporządzenie w sprawie SOR' },
    main: { ref: 'kolejki-sor' },
    more: [],
  },
  {
    id: 'konto',
    short: 'Moje konto',
    question: 'Czy na moim koncie wszystko się zgadza',
    lead: 'NFZ płaci za wpis w systemie, a nie za samą wizytę. Wizyty refundowane od 2008 r. sprawdzisz w Internetowym Koncie Pacjenta. Niżej zobaczysz tę drogę krok po kroku, zanim się zalogujesz.',
    entry: { icon: 'doc', text: 'Zobacz krok po kroku, jak dojść do historii wizyt w Internetowym Koncie Pacjenta.' },
    image: imgKonto,
    effect: 'scan',
    badge: { value: '>1 600', label: 'zasadnych zgłoszeń pacjentów do wpisów w IKP w 2024 r.', note: 'NFZ za: Rynek Zdrowia' },
    main: { ref: 'fikcyjne-wizyty' },
    more: [],
  },
  {
    id: 'kolejka',
    short: 'Czekam',
    question: 'Dlaczego tak długo czekam',
    lead: 'Koszty w planie NFZ wzrosły od 2015 r. po odliczeniu inflacji mniej więcej dwukrotnie, a średni czas oczekiwania wydłużył się o ok. 43%. Samych pieniędzy nie da się szybko zamienić na lekarzy: od przyjęcia na studia do tytułu specjalisty mija od 11 do 13 lat, a braki dotyczą konkretnych miejsc i dziedzin. Kto nie chce czekać, płaci w gabinecie obok.',
    entry: { icon: 'clock', text: 'Wybierz specjalistę i zobacz, na kiedy wypada średni termin.' },
    image: imgKolejka,
    position: '32% 50%',
    effect: 'pulse',
    badge: { value: formatPL(SPECIALISTS_2025.average, 1), label: 'mies. średnio na poradę specjalisty', note: 'Barometr WHC, IX/X 2025' },
    main: { ref: 'wizyty-prywatne-kolejka-cena' },
    more: [
      { ref: 'budzet-nfz', anchor: '#pieniadze-a-kolejka', label: 'Budżet NFZ a kolejki rok po roku' },
      { ref: 'dlaczego-brakuje-lekarzy' },
      { ref: 'publiczna-prywatna-ochrona-zdrowia' },
      { ref: 'poz-pieniadz-za-pacjenta' },
      { ref: 'apteka-pieniadz-publiczny' },
    ],
  },
  {
    id: 'skarga',
    short: 'Coś poszło nie tak',
    question: 'Dokąd z tym iść',
    lead: 'Instytucje nie przekazują sobie spraw, a zgłoszenie pod zły adres przepada. Przy każdej sytuacji widać, kto się nią zajmie. Rozwiń ją, a zobaczysz też, ile masz czasu i ile to kosztuje.',
    entry: { icon: 'flag', text: 'Każda sprawa ma inny adres: kto się nią zajmie i ile masz czasu.' },
    image: imgSkarga,
    effect: 'ekg',
    badge: { value: String(routes.length), label: 'sytuacji, każda z własnym adresem', note: 'pełny opis na stronie praw pacjenta' },
    main: { href: '/prawa-pacjenta/#co-sie-stalo', label: 'Gdzie zgłosić naruszenie praw pacjenta' },
    more: [
      { ref: 'jak-dzialaja-sady-lekarskie' },
      { ref: 'odpowiedzialnosc-zawodowa-lekarzy' },
      { label: 'Gra: czy orzekasz jak sąd lekarski?', href: '/sad-lekarski/' },
    ],
  },
];

/** „Tak czy nie”: pytania z data/prawa-pacjenta.ts o odpowiedzi Tak/Nie, na przemian. */
export const QUIZ_IDS = ['zgoda', 'druga-opinia', 'rodzic-przy-dziecku', 'osoba-bliska', 'godnosc', 'bol'];

/** Co warto wiedzieć na SOR: zdania z data/kolejki-sor.ts → steps. */
export const triageNotes = [
  'Pacjent w poważniejszym stanie wejdzie przed innymi, nawet jeśli przyjechał później.',
  'Po triażu personel ma Ci podać przydzieloną kategorię, liczbę osób przed Tobą i najdłuższy przewidywany czas oczekiwania.',
  'Personel ocenia stan czekających co najmniej co 90 minut, a kategoria może się zmienić. Jeśli czujesz się gorzej, powiedz o tym od razu.',
  'SOR może skierować Cię do podstawowej opieki zdrowotnej, także nocnej i świątecznej. Zasady opisuje regulamin szpitala.',
];
export const triageBasis = { label: 'rozporządzenie w sprawie SOR, § 6 ust. 9–14', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250001646' };

/**
 * Kroki w IKP ze zrzutów artykułu „Wizyty, których nie było”. `hot`: przycisk na zrzucie, w % całego pliku.
 * `end`: dymek przy prawej krawędzi przycisku, gdy na środku wyszedłby poza kadr.
 */
export const ikpSteps = [
  {
    tip: 'Zaloguj się',
    text: 'Wejdź na pacjent.gov.pl i wybierz „Zaloguj się”. Tożsamość potwierdzisz profilem zaufanym, w aplikacji mObywatel, e-dowodem albo przez bank.',
    alt: 'Strona główna pacjent.gov.pl. W prawym górnym rogu niebieski przycisk „Zaloguj się”.',
    hot: { x: 79.3, y: 13, w: 8, h: 5.7 },
    end: true,
  },
  {
    tip: 'Zobacz',
    text: 'Znajdź kafelek „Historia leczenia” i kliknij „Zobacz”.',
    alt: 'Kafelki IKP po zalogowaniu. Kafelek „Historia leczenia” obejmuje m.in. historię wizyt; pod nim przycisk „Zobacz”.',
    hot: { x: 53.6, y: 57.1, w: 33, h: 5.5 },
    end: false,
  },
  {
    tip: 'Zobacz',
    text: 'W sekcji „Świadczenia w ramach Narodowego Funduszu Zdrowia” otwórz „Historię wizyt”. Są tam wizyty refundowane przez NFZ od 2008 r., razem z kosztem refundacji.',
    alt: 'Sekcja „Świadczenia w ramach Narodowego Funduszu Zdrowia” z kafelkiem „Historia wizyt” oraz przyciskiem „Zobacz”.',
    hot: { x: 13.4, y: 50.3, w: 33, h: 5.5 },
    end: false,
  },
  {
    tip: 'Szczegóły',
    text: 'Szukaj placówek, których nie znasz, dat, w których nie było Cię u lekarza, i usług opłaconych prywatnie, a mimo to widniejących jako refundowane. „Szczegóły” pokazują, co rozliczono i za ile.',
    alt: 'Lista „Twoje wizyty”: wizyty ambulatoryjne z datami i przyciskami „Szczegóły”.',
    hot: { x: 73.6, y: 35.3, w: 13, h: 3.2 },
    end: true,
  },
];

export const ikpEnd = {
  title: 'Wpis się nie zgadza?',
  text: 'W „Szczegółach” wybierz „Zgłoś nieprawidłowość”, uzupełnij dane kontaktowe i wyślij. Zgłoszenie trafi do oddziału wojewódzkiego NFZ.',
  check: 'Najpierw wyklucz dwa fałszywe alarmy: teleporada też jest zapisywana jako wizyta, a przy podwykonawstwie może widnieć inna nazwa placówki, choć data się zgadza.',
  source: { label: 'NFZ za: Rynek Zdrowia', href: 'https://www.rynekzdrowia.pl/Prawo/Falszywe-informacje-o-wizytach-w-IKP-Pacjenci-w-calej-Polsce-zglaszaja-fikcyjne-swiadczenia,261578,2.html' },
};

/** Kolejka w kalendarzu: Barometr WHC, IX/X 2025, średnia z 41 specjalistów i wybrane poradnie. */
export const waitOptions = [
  { label: 'Średnio', value: SPECIALISTS_2025.average },
  ...SPECIALISTS_2025.rows.map((r) => ({ label: r.label, value: r.value })),
];
export const waitSource = { label: 'Barometr WHC, IX/X 2025', href: QUEUE_LINKS.whc2025 };
export const waitWhy = [
  { label: 'Budżet NFZ i kolejki', href: '/dane/budzet-nfz/#pieniadze-a-kolejka' },
  { label: 'Dlaczego brakuje lekarzy', href: '/analizy/dlaczego-brakuje-lekarzy/' },
];

/** Przeciętna cena prywatnej wizyty u specjalisty: GUS, BDL, zmienna 5076 (jak w artykule „Wizyty prywatne”). */
export const privateVisit = {
  value: 231.52,
  year: 2025,
  source: { label: 'GUS, Bank Danych Lokalnych', href: 'https://bdl.stat.gov.pl/api/v1/data/by-variable/5076?unit-level=0&format=json' },
};
