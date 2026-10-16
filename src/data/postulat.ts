/**
 * Postulat serwisu — strona /postulat/ i blok „Stanowisko redakcji” (PostulatCta) na stronie głównej,
 * pod artykułami i na stronach działów. Postulat jest stały; projekt ustawy i jego etap
 * pochodzą z src/data/projekt-ustawy.ts, archiwum petycji — z src/data/petycja.ts.
 */
import type { Accuracy, CompareTable, FaqItem, Stat, TextItem } from '@/types';

/** Blok „Stanowisko redakcji” — wspólny dla strony głównej, artykułów i stron działów. */
export const postulat = {
  label: 'Stanowisko redakcji',
  title: 'Jawne kwoty, chronione nazwiska',
  text: 'Postulujemy, by państwo co kwartał publikowało łączne wynagrodzenie każdej osoby pracującej w placówkach z umową z NFZ — zsumowane ze wszystkich miejsc pracy, pod stałym identyfikatorem zamiast imienia i nazwiska.',
  primary: { label: 'Poznaj postulat', href: '/postulat/' },
  secondary: { label: 'Projekt ustawy', href: '/postulat/projekt-ustawy/' },
};

export const postulatPage = {
  eyebrow: 'Postulat',
  title: 'Jawne kwoty, chronione nazwiska',
  docTitle: 'Postulat: jawne płace z NFZ, bez nazwisk',
  lead: 'Postulujemy, by łączne wynagrodzenie każdej osoby pracującej w placówkach z umową z NFZ było jawne: zsumowane ze wszystkich miejsc pracy, publikowane co kwartał jako otwarte dane, pod stałym identyfikatorem zamiast imienia i nazwiska.',
  /** meta description (lead jest dłuższy niż 160 znaków) */
  description: 'Postulujemy jawne łączne wynagrodzenie każdej osoby z placówek z umową z NFZ: ze wszystkich miejsc pracy, co kwartał, z identyfikatorem zamiast nazwiska.',
  quote: 'Nie chodzi o to, ile zarabia lekarz, lecz o to, że nikt tego nie wie.',
};

/* ---------- Problem ---------- */

/** Artykuł Rynku Zdrowia o kontraktach powyżej miliona: wyliczenie 7–14 tys. i dane z Centralnego Rejestru Umów. */
const millionContracts =
  'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Kontrakty-roczne-na-milion-zlotych-dla-lekarza-Sprawdzilismy-centralny-rejestr,288374,1.html';

/** Wywiad z prezesem AOTMiT — pierwotne źródło liczb „ponad 1%” i „5–10%”. */
const aotmitInterview = {
  label: 'Rynek Zdrowia, 17.06.2026',
  href: 'https://www.rynekzdrowia.pl/Polityka-zdrowotna/Szef-rzadowej-agencji-po-aferze-Kacprzyka-wynaturzenia-musimy-sie-zabezpieczyc,285516,14.html',
};

export const problem = {
  title: 'Każda placówka widzi tylko swój kawałek',
  paragraphs: [
    'Lekarz może pracować jednocześnie w szpitalu, w poradni i na dyżurach w innym mieście — na etacie, kontrakcie i umowie cywilnoprawnej. Każda placówka płaci osobno i zna tylko swoją część. Łącznej kwoty z publicznych pieniędzy nie sumuje nikt: ani NFZ, ani AOTMiT, która — jak przyznaje jej prezes — nie ma danych łączonych dla jednej osoby między placówkami.',
  ],
  /** wyliczenie: jedna placówka → suma z wielu placówek → liczba lekarzy-milionerów; każda liczba ze źródłem */
  finding: {
    steps: [
      {
        value: '1%',
        prefix: '>',
        label: 'lekarzy zarabia ponad 100 tys. zł miesięcznie w jednej placówce — około 560 osób (w innej wypowiedzi prezes AOTMiT mówił o ok. 1,5%)',
        accuracy: 'exact',
        source: aotmitInterview,
      },
      {
        value: '5–10%',
        label: 'mogłoby ich być po zsumowaniu wypłat jednej osoby z wielu placówek — ocenia prezes AOTMiT',
        accuracy: 'est',
        source: aotmitInterview,
      },
    ] satisfies { value: string; prefix?: string; label: string; accuracy: Accuracy; source: { label: string; href: string } }[],
    result: {
      text: 'Przy około 140 tys. aktywnych lekarzy to od 7 do 14 tys. osób z dochodem ponad milion złotych rocznie, a nie około 600, o których mówiono dotąd.',
      source: {
        label: 'wyliczenie Rynku Zdrowia, 31.08.2026',
        href: millionContracts,
      },
    },
  },
  /** Centralny Rejestr Umów: jawne są pojedyncze umowy, a nie suma dla jednej osoby — to samo źródło co wyliczenie */
  contracts: {
    title: 'Jawne umowy to jeszcze nie jawna suma',
    text: 'Umowy zawierane od 1 lipca 2026 r. przez jednostki sektora finansów publicznych trafiają do Centralnego Rejestru Umów (szpitale-spółki są poza sektorem). Pod koniec sierpnia było w nim 54 umowy na świadczenia zdrowotne powyżej 1 mln zł, część z nich z indywidualnymi praktykami lekarskimi. Rejestr pokazuje jednak pojedyncze umowy, a nie ludzi: lekarz może mieć ich kilka, więc sumy dla jednej osoby nadal nikt nie widzi.',
    source: { label: 'Rynek Zdrowia, 31.08.2026', href: millionContracts },
  },
};

/* ---------- Co postulujemy ---------- */

export const demands: TextItem[] = [
  {
    title: 'Co kwartał, z mocy ustawy',
    text: 'Placówki z umową z NFZ przekazują dane o wynagrodzeniach regularnie, a nie na wniosek ministra — także o osobach na umowach cywilnoprawnych i w podwykonawstwie.',
  },
  {
    title: 'Jedna osoba, jeden identyfikator',
    text: 'Państwo zastępuje PESEL stałym pseudonimem. Ta sama osoba ma zawsze ten sam identyfikator, więc jej wynagrodzenia z wielu placówek dają się zsumować.',
  },
  {
    title: 'Otwarte dane',
    text: 'Dla każdego identyfikatora: łączna kwota i liczba placówek, które płacą, a w podziale na placówki — wynagrodzenie, wymiar czasu, forma zatrudnienia i specjalizacja.',
  },
  {
    title: 'Sankcja za milczenie',
    text: 'Placówka, która nie przekaże danych albo przekaże nierzetelne, płaci karę do 0,5% wartości swoich umów z NFZ.',
  },
];

export const disclosure = {
  public: {
    title: 'Jawne',
    note: 'bo to wydatek publiczny',
    items: [
      'łączna kwota wynagrodzeń jednej osoby ze wszystkich placówek',
      'liczba placówek, które jej płacą',
      'w podziale na placówki: wynagrodzenie, wymiar czasu, forma zatrudnienia, specjalizacja',
    ],
  },
  protected: {
    title: 'Chronione',
    note: 'bo do kontroli wydatku nie są potrzebne',
    items: [
      'imię i nazwisko',
      'PESEL i numer prawa wykonywania zawodu',
      'tytuły, stanowisko, wykształcenie',
      'adres, majątek, dane rodziny, dane pacjentów',
      'dochody spoza placówek z umową z NFZ',
    ],
  },
};

export const notDemanded =
  'Nie chcemy publikować nazwisk ani danych prywatnych i nie oceniamy konkretnych osób — opisujemy mechanizmy. Uczciwi lekarze na jawności zyskują: przestają być wrzucani do jednego worka z nadużyciami mniejszości.';

/* ---------- Dlaczego bez nazwisk ---------- */

export const withoutNames = {
  title: 'Dlaczego bez nazwisk',
  lead: 'Pierwsza wersja postulatu — i petycja z lipca 2026 r. — zakładała rejestr imienny, z wyszukiwaniem po numerze PWZ. Zmieniliśmy to. Do kontroli publicznych pieniędzy potrzebna jest suma i jej struktura, a nie nazwisko.',
  reasons: [
    {
      title: 'Widać to, co ważne.',
      text: 'Pod stałym identyfikatorem widać kumulację etatów i kontraktów, kominy płacowe i godziny, których nie da się przepracować. Do tego nie trzeba wiedzieć, kim jest konkretna osoba.',
    },
    {
      title: 'Tylko niezbędne dane.',
      text: 'RODO każe przetwarzać dane w zakresie niezbędnym do celu (art. 5 ust. 1 lit. c). Celem jest kontrola wydatku, nie ocena ludzi — a publikację bez nazwisk łatwiej obronić.',
    },
    {
      title: 'Mechanizmy, nie nazwiska.',
      text: 'Tak piszemy o ochronie zdrowia od początku: nie atakujemy imiennie osób. Postulat jest teraz spójny z tą zasadą i nie daje argumentu, że chodzi o pręgierz.',
    },
  ] satisfies TextItem[],
};

/* ---------- Jak działa identyfikator ---------- */

export const identifier = {
  title: 'Jak tablica rejestracyjna',
  lead: 'Tablicę rejestracyjną widzi każdy, a właściciela samochodu ustali tylko uprawniona instytucja, na przykład policja. Identyfikator w danych o wynagrodzeniach działa tak samo: każdy zobaczy, ile i z ilu placówek dostaje jedna osoba, ale kim ona jest, może ustalić tylko jednostka, która ma klucz.',
  analogy: {
    car: { title: 'Samochód', plate: 'XX 12345' },
    /** identyfikator na karcie liczy build z przykładu niżej (pseudonymDemo) */
    pay: { title: 'Wynagrodzenia' },
    rows: [
      { label: 'Widzi każdy', car: 'numer na tablicy', pay: 'stały identyfikator zamiast nazwiska' },
      { label: 'Co z tego wynika', car: 'że to ten sam samochód — gdzie bywa i jak często', pay: 'że to ta sama osoba — ile dostaje i z ilu placówek' },
      { label: 'Kto ustali tożsamość', car: 'tylko uprawnione instytucje, np. policja w bazie pojazdów', pay: 'tylko jednostka z kluczem (Centrum e-Zdrowia)' },
    ],
  },
};

/** Przykład pseudonimizacji w przeglądarce — numer i klucz są pokazowe, nie prawdziwe. */
export const pseudonymDemo = {
  title: 'Przykład: z numeru PWZ do identyfikatora',
  intro: 'Funkcja kryptograficzna z kluczem tajnym zamienia numer na ciąg znaków. Wpisz dowolny siedmiocyfrowy numer i sprawdź, jak się zachowuje. Obliczenia dzieją się w Twojej przeglądarce — nic nie jest wysyłane.',
  /** fikcyjny numer: nie spełnia warunku cyfry kontrolnej PWZ, więc nie należy do żadnego lekarza */
  pwz: '1234567',
  key: 'klucz-pokazowy',
  algorithm: 'HMAC-SHA-256',
  algorithmNote: 'Projekt ustawy nie przesądza algorytmu. HMAC-SHA-256 (RFC 2104, FIPS 198-1) to standardowy przykład funkcji skrótu z kluczem tajnym.',
  properties: [
    { ok: true, title: 'Ten sam numer, ten sam identyfikator.', text: 'Dlatego wypłaty jednej osoby z wielu placówek dają się zsumować.' },
    { ok: true, title: 'Jedna cyfra różnicy, zupełnie inny wynik.', text: 'Z identyfikatorów nie widać, które numery są do siebie podobne.' },
    { ok: false, title: 'Z identyfikatora nie da się odtworzyć numeru.', text: 'Funkcja działa w jedną stronę: nie ma wzoru, który z wyniku policzyłby numer PWZ.' },
  ],
  whyKey: {
    title: 'Po co klucz tajny',
    text: 'Numerów PWZ jest najwyżej 10 milionów. Zwykły skrót bez klucza każdy mógłby policzyć dla wszystkich numerów, a laptop zrobi to w kilka sekund, i z tak powstałej tabeli odczytać, kto jest kim. Z kluczem taką tabelę zbuduje tylko jednostka, która go ma — jak policja, która jako jedyna sprawdzi tablicę w bazie pojazdów.',
  },
  basis: 'W projekcie podstawą identyfikatora jest PESEL, a gdy go brak — numer PWZ (art. 27a ust. 5). Zasada działania jest ta sama.',
};

/* ---------- Droga do ustawy ---------- */

export const route = {
  title: 'Państwo zrobiło pół kroku',
  text: 'Ustawa z 19 czerwca 2026 r. (Dz. U. poz. 972) pozwoliła ministrowi zdrowia żądać od placówek danych o wynagrodzeniach powiązanych z numerem PESEL i numerem PWZ. Ma jednak trzy ograniczenia: dane zbiera się tylko na wniosek ministra, niczego się nie publikuje, a za niewykonanie obowiązku nie grozi żadna sankcja. Nasz projekt usuwa te ograniczenia, dodając do art. 27a dwa punkty.',
};

/* ---------- Dowody ---------- */

export const evidence: Stat[] = [
  {
    value: 73,
    prefix: '~',
    unit: '%',
    desc: 'specjalistów rozlicza się na kontraktach, które łatwo łączyć w wielu placówkach naraz',
    accuracy: 'est',
    source: 'Gazeta Prawna',
    href: 'https://www.gazetaprawna.pl/biznes/zdrowie/artykuly/11149864,pensje-lekarzy-i-pielegniarek-w-polsce-2025-ile-zarabiaja-etatowcy-i.html',
  },
  {
    value: 316079,
    unit: 'zł',
    desc: 'najwyższy ujawniony kontrakt miesięcznie — w regionie, którego szpitale mają 1,4 mld zł długu',
    accuracy: 'exact',
    source: 'Menedżer Zdrowia',
    href: 'https://www.termedia.pl/mz/Milioner-w-cztery-miesiace,66022.html',
  },
  {
    value: 633,
    unit: 'tys. zł',
    desc: 'mediana rocznego dochodu z pracy lekarzy-radnych za 2025 r. — każda kwota sprawdzona w oświadczeniu majątkowym (113 oświadczeń)',
    accuracy: 'exact',
    source: 'zarobkilekarzy.pl, analiza oświadczeń',
    href: '/analizy/lekarze-radni/',
  },
  {
    value: 21.9,
    decimals: 1,
    unit: '%',
    desc: 'badanych wskazało jawność kontraktów lekarskich — częściej niż zakaz prywatnej praktyki czy limity płac',
    accuracy: 'exact',
    source: 'UCE Research dla Onetu',
    href: 'https://wiadomosci.onet.pl/kraj/polacy-chca-wiedziec-ile-zarabiaja-lekarze-sa-wyniki-nowego-sondazu/v840y3y',
  },
];

/* ---------- Zarzuty ---------- */

export const objections: FaqItem[] = [
  {
    question: 'Czy do publikacji potrzebna jest zgoda lekarza?',
    answer: [
      'Nie. Zgoda to tylko jedna z sześciu podstaw przetwarzania danych. RODO dopuszcza przetwarzanie także wtedy, gdy jest niezbędne do wypełnienia obowiązku prawnego (art. 6 ust. 1 lit. c) lub do wykonania zadania w interesie publicznym (art. 6 ust. 1 lit. e). Projekt ustawy daje taką podstawę.',
    ],
  },
  {
    question: 'Czy identyfikator to nadal dane osobowe?',
    answer: [
      'Dla jednostki, która ma klucz — tak. Dlatego klucz przechowuje wyłącznie ona, a publikowane dane nie zawierają imienia, nazwiska, PESEL-u ani numeru PWZ.',
      'Czy identyfikator jest daną osobową także dla odbiorców danych otwartych, to jedno z pytań, które projekt kieruje do weryfikacji prawnej (motyw 26 RODO). Podstawę publikacji daje ustawa niezależnie od odpowiedzi.',
    ],
  },
  {
    question: 'Czy w małym szpitalu da się kogoś rozpoznać?',
    answer: [
      'Takie ryzyko istnieje: specjalizacja w podziale na placówki może wskazać jedyną osobę na oddziale. Projekt traktuje to jako otwarte pytanie i rozważa próg — na przykład niepublikowanie specjalizacji, którą ma mniej niż 5 osób w placówce.',
    ],
  },
  {
    question: 'Czy to nie jest atak na lekarzy?',
    answer: [
      'Nie. Jawne są już wynagrodzenia w administracji publicznej i oświadczenia majątkowe osób pełniących funkcje publiczne. Pieniądze ze składki zdrowotnej nie powinny być wyjątkiem. Postulat nie dotyczy nazwisk, a jawność chroni uczciwych lekarzy przed zbiorowym podejrzeniem.',
    ],
  },
];

/** Jedno zdanie pod zarzutami — szerszy program jest osobno (/program/), żeby postulat został jednym żądaniem. */
export const programNote =
  'Inne zmiany, które wynikają z tych samych danych — od ewidencji czasu pracy po sądy lekarskie — zbieramy osobno, poza postulatem.';

/* ---------- Petycja a obecny postulat (archiwum) ---------- */

export const evolution: CompareTable = {
  columns: ['', 'Petycja (lipiec 2026)', 'Postulat dziś'],
  rows: [
    { cells: ['Kogo dotyczy wpis', 'konkretnego lekarza, po jawnym numerze PWZ', 'stałego identyfikatora — bez imienia, nazwiska i numeru PWZ'] },
    { cells: ['Wyszukiwanie', 'po numerze PWZ i po placówce', 'dane otwarte do pobrania; bez wyszukiwania osoby'] },
    { cells: ['Zakres', 'kwoty ze środków NFZ, docelowo wszystkie środki publiczne', 'wynagrodzenia w placówkach z umową z NFZ'] },
    { cells: ['Droga', 'petycja do Ministra Zdrowia i Senatu', 'projekt ustawy wniesiony przez 15 posłów'] },
  ],
};
