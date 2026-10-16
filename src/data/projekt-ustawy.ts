/**
 * Obywatelski projekt nowelizacji art. 27a ustawy o działalności leczniczej — jedno źródło prawdy
 * dla strony /postulat/projekt-ustawy/, osi etapów na /postulat/ i statusu w PostulatCta.
 *
 * Nowa wersja projektu: podmień `version`, `projekt.date`, tekst i dopisz wpis w `history`
 * (PDF poprzedniej wersji zamroź w public/ — README, „Projekt ustawy: PDF”).
 * Postęp na drodze do Sejmu: przestaw `state` w `stages` (dokładnie jeden etap „current”).
 * Adres strony nie zawiera wersji ani etapu — przeżyje zmianę projektu roboczego w druk sejmowy.
 */
import type { CompareTable, FaqItem, Stage, TextItem } from '@/types';

const version = '0.3';

export const projekt = {
  href: '/postulat/projekt-ustawy/',
  title: 'Projekt ustawy o zmianie ustawy o działalności leczniczej',
  subject: 'Jawność wynagrodzeń w ochronie zdrowia finansowanych ze środków publicznych — nowelizacja art. 27a w dwóch punktach.',
  /** rodzaj dokumentu — zmieni się po wniesieniu do Sejmu (projekt poselski, druk nr …) */
  kind: 'Obywatelski projekt roboczy',
  version,
  versionLabel: 'wstępna',
  date: new Date('2026-10-11'),
  scope: 'art. 27a ust. 1a oraz ust. 5–7',
  /**
   * PDF składa build z tej treści (lib/projekt/pdf.ts → pages/projekt-nowelizacji/[name].pdf.ts),
   * pod adresem ze starej wersji serwisu (linkowany z zewnątrz; /preview/… przekierowuje tutaj).
   * Liczbę stron liczy build z gotowego pliku (lib/projekt/download.ts → projektPdf()).
   */
  pdf: { href: `/projekt-nowelizacji/projekt-nowelizacji-art27a-v${version}.pdf` },
  disclaimer:
    'Dokument nie jest projektem ustawy w rozumieniu Regulaminu Sejmu. Wersja 0.3 służy weryfikacji prawnej przed publikacją; miejsca oznaczone [?] wymagają sprawdzenia. Treść może się zmienić w całości.',
};

/** Droga projektu do Sejmu (art. 32 i 34 Regulaminu Sejmu). */
export const stages: Stage[] = [
  { label: 'Projekt roboczy', note: 'wersja 0.3', date: projekt.date, state: 'done' },
  { label: 'Weryfikacja prawna', note: 'pytania w Załączniku B', state: 'current', href: `${projekt.href}#zalacznik-b` },
  { label: 'Poparcie 15 posłów', note: 'art. 32 ust. 2 Regulaminu Sejmu', state: 'next' },
  { label: 'Złożenie u Marszałka Sejmu', note: 'z uzasadnieniem i skutkami regulacji', state: 'next' },
  { label: 'Opinie i pierwsze czytanie', state: 'next' },
];

export const currentStage = stages.find((s) => s.state === 'current') ?? stages[stages.length - 1];

/** „W skrócie” — trzy zmiany po ludzku, z odesłaniem do ustępów. */
export const changes: (TextItem & { ref: string; anchor: string })[] = [
  {
    title: 'Co kwartał, z mocy ustawy',
    text: 'Placówki z umową z NFZ przekazują dane o wynagrodzeniach co kwartał — także o osobach na umowach cywilnoprawnych i w podwykonawstwie. Dziś robią to tylko na wniosek ministra.',
    ref: 'ust. 1a',
    anchor: 'ust-1a',
  },
  {
    title: 'Jawnie, ale bez nazwisk',
    text: 'Centrum e-Zdrowia zastępuje PESEL stałym identyfikatorem i publikuje dane otwarte: łączną kwotę wynagrodzeń każdej osoby i liczbę placówek, które jej płacą.',
    ref: 'ust. 5–6',
    anchor: 'ust-5',
  },
  {
    title: 'Z sankcją',
    text: 'Za brak danych, dane niepełne albo niezgodne ze stanem faktycznym grozi kara do 0,5% wartości umów z NFZ, nakładana przez Prezesa NFZ.',
    ref: 'ust. 7',
    anchor: 'ust-7',
  },
];

/** Uzasadnienie, pkt 2 — stan obecny a projektowany. */
export const comparison: CompareTable = {
  caption: 'Różnica między stanem obecnym a projektowanym',
  columns: ['Kwestia', 'Stan obecny (Dz. U. 2026 poz. 972)', 'Stan projektowany'],
  rows: [
    {
      cells: [
        'Kiedy dane są przekazywane',
        'na wniosek ministra, w terminie i w sposób przez niego wskazany',
        'dodatkowo co kwartał, z mocy ustawy, przez podmioty realizujące umowy z NFZ',
      ],
    },
    {
      cells: [
        'Kto widzi dane',
        'minister; NFZ, jednostka lub AOTMiT, jeżeli minister je wskaże',
        'dodatkowo każdy, w postaci spseudonimizowanej, jako dane otwarte',
      ],
    },
    { cells: ['Sankcja', 'brak', 'administracyjna kara pieniężna nakładana przez Prezesa NFZ'] },
  ],
};

/** Jak projekt ma trafić do Sejmu. */
export const path = {
  intro:
    'Projekt ma zostać wniesiony jako projekt poselski, czyli podpisany i złożony przez co najmniej 15 posłów. Tylu podpisów wymaga art. 32 ust. 2 Regulaminu Sejmu; prawo inicjatywy ustawodawczej daje posłom art. 118 ust. 1 Konstytucji RP.',
  steps: [
    { title: 'Weryfikacja prawna.', text: 'Przed wniesieniem tekst musi przejść weryfikację prawną; pytania do niej zawiera Załącznik B.' },
    { title: 'Poparcie co najmniej 15 posłów.', text: 'Ich podpisy pod projektem są warunkiem wniesienia go jako projektu poselskiego.' },
    {
      title: 'Złożenie u Marszałka Sejmu.',
      text: 'Projekt składa się na piśmie razem z uzasadnieniem, a wnioskodawcy wskazują swojego przedstawiciela (art. 34 ust. 1–2 Regulaminu Sejmu). Deklarowane skutki regulacji przedstawia się na formularzu Prezydium Sejmu (art. 34 ust. 3a), a skutki finansowe wnioskodawcy muszą przedstawić zawsze (art. 118 ust. 3 Konstytucji RP).',
    },
    {
      title: 'Opinie i pierwsze czytanie.',
      text: 'Jeśli wnioskodawcy nie zasięgnęli wymaganych opinii, Marszałek Sejmu przed skierowaniem projektu do pierwszego czytania kieruje go do zaopiniowania (art. 34 ust. 3 Regulaminu Sejmu).',
    },
  ] satisfies TextItem[],
  sources: [
    { label: 'Konstytucja RP, art. 118', href: 'https://api.sejm.gov.pl/eli/acts/DU/1997/483/text.pdf' },
    { label: 'Regulamin Sejmu (tekst jednolity: M.P. z 2026 r. poz. 573), art. 32 ust. 2 i art. 34', href: 'https://api.sejm.gov.pl/eli/acts/MP/2026/573/text.pdf' },
  ],
};

/** Nota o statusie dokumentu. */
export const statusNote = [
  'Niniejszy dokument jest obywatelskim projektem roboczym inicjatywy zarobkilekarzy.pl. Nie jest projektem ustawy w rozumieniu Regulaminu Sejmu; staje się nim dopiero po wniesieniu przez uprawniony podmiot.',
  'Wersja 0.3 służy weryfikacji prawnej przed jakąkolwiek publiczną promocją. Pytania do osoby weryfikującej zawiera Załącznik B.',
  'Projekt nie zmienia żadnego z obowiązujących przepisów art. 27a ustawy o działalności leczniczej w brzmieniu nadanym ustawą z dnia 19 czerwca 2026 r. (Dz. U. poz. 972). Dodaje do niego dwa punkty: stały kwartalny obowiązek przekazywania tych samych danych (ust. 1a) oraz ich publikację w postaci spseudonimizowanej wraz z sankcją za niewykonanie obowiązku (ust. 5–7).',
];

/* ---------- Tekst projektu ---------- */

/** Ustęp dodawany do art. 27a — `id` to kotwica do cytowania (#ust-1a). */
export interface BillUnit {
  id: string;
  label: string;
  text: string;
}

export interface BillPoint {
  label: string;
  intro: string;
  units: BillUnit[];
  /** znak po cudzysłowie zamykającym: „…”; albo „…”. */
  end: ';' | '.';
}

export interface BillArticle {
  id: string;
  label: string;
  text: string;
  points?: BillPoint[];
}

export const bill: { heading: string[]; articles: BillArticle[] } = {
  heading: ['Ustawa', 'z dnia …………………… 2026 r.', 'o zmianie ustawy o działalności leczniczej'],
  articles: [
    {
      id: 'art-1',
      label: 'Art. 1.',
      text: 'W ustawie z dnia 15 kwietnia 2011 r. o działalności leczniczej (Dz. U. z 2026 r. poz. 156 i 972) w art. 27a wprowadza się następujące zmiany:',
      points: [
        {
          label: '1)',
          intro: 'po ust. 1 dodaje się ust. 1a w brzmieniu:',
          end: ';',
          units: [
            {
              id: 'ust-1a',
              label: '1a.',
              text: 'Niezależnie od obowiązku, o którym mowa w ust. 1, podmiot wykonujący działalność leczniczą, który realizuje umowę o udzielanie świadczeń opieki zdrowotnej zawartą z Narodowym Funduszem Zdrowia, gromadzi oraz przekazuje jednostce podległej ministrowi właściwemu do spraw zdrowia właściwej w zakresie systemów informacyjnych w ochronie zdrowia, zwanej dalej „jednostką”, za każdy kwartał kalendarzowy, w terminie 45 dni od jego zakończenia, dane, o których mowa w ust. 1, dotyczące również osób świadczących na rzecz tego podmiotu usługi na podstawie umowy cywilnoprawnej lub w ramach podwykonawstwa. Dane przekazuje się w postaci elektronicznej, w formacie określonym przez jednostkę i ogłoszonym na jej stronie podmiotowej Biuletynu Informacji Publicznej.',
            },
          ],
        },
        {
          label: '2)',
          intro: 'dodaje się ust. 5–7 w brzmieniu:',
          end: '.',
          units: [
            {
              id: 'ust-5',
              label: '5.',
              text: 'Jednostka zastępuje numer PESEL, a w przypadku jego braku – numer prawa wykonywania zawodu lub dane dokumentu potwierdzającego tożsamość, identyfikatorem wygenerowanym przy użyciu funkcji kryptograficznej z kluczem tajnym, tak aby tej samej osobie odpowiadał zawsze ten sam identyfikator. Klucz przechowuje wyłącznie ta jednostka.',
            },
            {
              id: 'ust-6',
              label: '6.',
              text: 'Jednostka, w terminie 90 dni od dnia zakończenia kwartału, udostępnia publicznie jako dane otwarte w rozumieniu przepisów o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego, w odniesieniu do każdego identyfikatora: łączną kwotę wynagrodzeń, o których mowa w ust. 1 pkt 2 lit. c, oraz liczbę podmiotów, które wypłaciły wynagrodzenie. Dane, o których mowa w ust. 1 pkt 2 lit. c, d, g i h, udostępnia się także w podziale na te podmioty.',
            },
            {
              id: 'ust-7',
              label: '7.',
              text: 'Podmiot, który nie przekazuje danych, o których mowa w ust. 1a, w terminie albo przekazuje dane niepełne lub niezgodne ze stanem faktycznym, podlega administracyjnej karze pieniężnej w wysokości do 0,5% wartości umów o udzielanie świadczeń opieki zdrowotnej zawartych z Narodowym Funduszem Zdrowia w poprzednim roku kalendarzowym, nakładanej w drodze decyzji przez Prezesa Narodowego Funduszu Zdrowia.',
            },
          ],
        },
      ],
    },
    {
      id: 'art-2',
      label: 'Art. 2.',
      text: 'Ustawa wchodzi w życie z pierwszym dniem kwartału kalendarzowego następującego po upływie 12 miesięcy od dnia ogłoszenia.',
    },
  ],
};

/* ---------- Uzasadnienie ---------- */

/** Akapit uzasadnienia; `lead` — pogrubiony początek („Dla podmiotów leczniczych.”). */
export interface Paragraph {
  lead?: string;
  text: string;
}

export const justification: { id: string; title: string; paragraphs: Paragraph[]; table?: CompareTable; after?: Paragraph[] }[] = [
  {
    id: 'potrzeba-i-cel',
    title: '1. Potrzeba i cel',
    paragraphs: [
      {
        text: 'Ustawa z dnia 19 czerwca 2026 r. (Dz. U. poz. 972) nadała art. 27a ustawy o działalności leczniczej brzmienie, na podstawie którego minister właściwy do spraw zdrowia może żądać od podmiotów leczniczych danych o wynagrodzeniach powiązanych z numerem PESEL i numerem prawa wykonywania zawodu. W uzasadnieniu rządowego projektu (druk sejmowy nr 2685) wskazano, że „istotne znaczenie ma możliwość określania i sumowania wysokości wynagrodzeń uzyskiwanych przez poszczególne osoby niezależnie od podstawy prawnej świadczenia pracy”.',
      },
      {
        text: 'Obowiązujący przepis ma trzy ograniczenia. Obowiązek powstaje wyłącznie „na wniosek ministra”, bez cyklu i bez kryterium doboru podmiotów. Przepis nie przewiduje publikacji żadnych wyników; według oceny skutków dla ochrony danych dołączonej do projektu dane „mogą być udostępnione wyłącznie ministrowi właściwemu do spraw zdrowia, na jego wniosek”. Za niewykonanie obowiązku nie grozi żadna sankcja.',
      },
      {
        text: 'Projekt usuwa te trzy ograniczenia, nie zmieniając żadnego z obowiązujących ustępów art. 27a. Realizuje prawo do uzyskiwania informacji o działalności osób i jednostek gospodarujących majątkiem publicznym (art. 61 ust. 1 Konstytucji RP), nie ujawniając tożsamości osób, których dane dotyczą.',
      },
    ],
  },
  {
    id: 'roznica',
    title: '2. Różnica między stanem obecnym a projektowanym',
    paragraphs: [],
    table: comparison,
    after: [{ text: 'Uprawnienia ministra wynikające z ust. 1–4 pozostają bez zmian. Zestawienie brzmień zawiera Załącznik A.' }],
  },
  {
    id: 'skutki',
    title: '3. Skutki regulacji',
    paragraphs: [
      {
        lead: 'Dla podmiotów leczniczych.',
        text: 'Zakres danych jest ten sam, który podmiot musi przygotować na wniosek ministra; nowością jest regularność. Ocena skutków regulacji do druku nr 2685 uznała obowiązek zbierania tych danych za bezkosztowy (pkt 6).',
      },
      {
        lead: 'Dla finansów publicznych.',
        text: 'Koszt ponosi jednostka, czyli Centrum e-Zdrowia: przyjmowanie danych, nadawanie identyfikatorów i publikacja. Szacunek własny, wymagający weryfikacji [?]: jednorazowo kilka milionów złotych, rocznie 2–4 mln zł. Wpływy z kar są niekwantyfikowalne.',
      },
      {
        lead: 'Dla ochrony danych osobowych.',
        text: 'Podstawą przetwarzania jest art. 6 ust. 1 lit. c i e RODO. Dane o wynagrodzeniu nie należą do szczególnych kategorii danych z art. 9 RODO, co potwierdza ocena skutków regulacji do druku nr 2685. Publikowane dane nie zawierają imienia, nazwiska, numeru PESEL ani numeru prawa wykonywania zawodu, a klucz pozwalający powiązać identyfikator z osobą przechowuje wyłącznie jednostka.',
      },
      {
        lead: 'Skutki prawne.',
        text: 'Projekt zmienia jeden artykuł jednej ustawy. Nie wymaga aktów wykonawczych; format danych określa i ogłasza jednostka, na wzór art. 31lc ust. 4c ustawy o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych.',
      },
    ],
  },
  {
    id: 'zgodnosc-z-ue',
    title: '4. Zgodność z prawem Unii Europejskiej',
    paragraphs: [
      {
        text: 'Projekt jest zgodny z prawem Unii Europejskiej, w szczególności z rozporządzeniem (UE) 2016/679 oraz dyrektywą (UE) 2019/1024 w sprawie otwartych danych. Nie podlega notyfikacji.',
      },
    ],
  },
  {
    id: 'konsultacje',
    title: '5. Konsultacje',
    paragraphs: [
      {
        text: 'Wersja 0.3 nie była konsultowana. Przed wniesieniem projekt powinien zostać zaopiniowany co najmniej przez Prezesa Urzędu Ochrony Danych Osobowych, Naczelną Radę Lekarską, Prezesa Narodowego Funduszu Zdrowia i Centrum e-Zdrowia.',
      },
    ],
  },
];

/* ---------- Załączniki ---------- */

/** Tytuły załączników — nagłówki na stronie i w PDF. */
export const annexes = {
  a: { id: 'zalacznik-a', label: 'Załącznik A', title: 'Art. 27a ustawy o działalności leczniczej po nowelizacji' },
  b: { id: 'zalacznik-b', label: 'Załącznik B', title: 'Pytania do weryfikacji prawnej' },
  c: { id: 'zalacznik-c', label: 'Załącznik C', title: 'Źródła' },
};

/** PDF: objaśnienie oznaczeń pod notą o statusie (na stronie oba wyróżnienia mają własny podpis). */
export const legend = [
  { mark: '[?]', text: 'miejsce, które przed wniesieniem projektu musi sprawdzić prawnik.' },
  { mark: 'nowy', text: 'w Załączniku A: ustęp dodawany projektem. Pozostałe ustępy art. 27a pozostają bez zmian.' },
];

/** Załącznik A — tekst ujednolicony art. 27a po nowelizacji; nowe ustępy wyróżnione. */
export const consolidated: CompareTable = {
  caption: 'Tekst ujednolicony. Obowiązujące ustępy pozostają bez zmian; nowe ustępy wyróżniono.',
  columns: ['Brzmienie obowiązujące (Dz. U. 2026 poz. 972)', 'Po nowelizacji'],
  rows: [
    {
      cells: [
        '1. Podmiot wykonujący działalność leczniczą, na wniosek ministra właściwego do spraw zdrowia, gromadzi oraz przekazuje, w terminie i w sposób przez niego wskazany, dane dotyczące osób zatrudnionych w tym podmiocie obejmujące: 1) liczbę tych osób; 2) dane osoby zatrudnionej: a) numer PESEL […], b) numer prawa wykonywania zawodu […], c) informację o wysokości wynagrodzenia, w tym wynagrodzenia zasadniczego, stawek godzinowych, jeżeli dotyczy, oraz dodatków, d) wymiar czasu pracy, e) tytuły zawodowe, jeżeli posiada, f) zajmowane stanowisko, g) formę zatrudnienia, h) posiadane specjalizacje, jeżeli dotyczy, i) wymagane na zajmowanym stanowisku wykształcenie.',
        'bez zmian',
      ],
    },
    {
      marked: true,
      cells: [
        '—',
        '1a. Niezależnie od obowiązku, o którym mowa w ust. 1, podmiot wykonujący działalność leczniczą, który realizuje umowę o udzielanie świadczeń opieki zdrowotnej zawartą z Narodowym Funduszem Zdrowia, gromadzi oraz przekazuje jednostce […], za każdy kwartał kalendarzowy, w terminie 45 dni od jego zakończenia, dane, o których mowa w ust. 1, dotyczące również osób świadczących na rzecz tego podmiotu usługi na podstawie umowy cywilnoprawnej lub w ramach podwykonawstwa. […]',
      ],
    },
    {
      cells: [
        '2.–4. Cele przetwarzania danych przez ministra; możliwość wskazania we wniosku NFZ, jednostki lub AOTMiT jako podmiotu, do którego przekazuje się dane.',
        'bez zmian',
      ],
    },
    {
      marked: true,
      cells: [
        '—',
        '5. Pseudonimizacja: identyfikator z numeru PESEL, a w jego braku z numeru prawa wykonywania zawodu lub danych dokumentu, wygenerowany funkcją kryptograficzną z kluczem tajnym; ta sama osoba zawsze ma ten sam identyfikator; klucz wyłącznie w jednostce.',
      ],
    },
    {
      marked: true,
      cells: [
        '—',
        '6. Publikacja jako dane otwarte w 90 dni po kwartale: dla każdego identyfikatora łączna kwota i liczba podmiotów; dane z lit. c, d, g i h w podziale na podmioty. Bez PESEL, numeru prawa wykonywania zawodu, tytułów, stanowiska i wykształcenia.',
      ],
    },
    { marked: true, cells: ['—', '7. Administracyjna kara pieniężna do 0,5% wartości umów z NFZ z poprzedniego roku, nakładana przez Prezesa NFZ.'] },
  ],
};

/** Załącznik B — pytania do weryfikacji prawnej (tytuł + treść). */
export const legalQuestions: FaqItem[] = [
  {
    question: 'Technika dodania ust. 1a',
    answer: [
      'Czy odesłanie „dane, o których mowa w ust. 1” poprawnie przenosi katalog danych, skoro ust. 1 mówi o „osobach zatrudnionych”, a ust. 1a obejmuje też umowy cywilnoprawne i podwykonawstwo? Czy skrót „jednostka” wprowadzony w ust. 1a nie koliduje z pełną nazwą użytą w obowiązującym ust. 3?',
    ],
  },
  {
    question: 'Podwykonawstwo przez spółkę',
    answer: [
      'Czy obowiązek obejmuje lekarzy udzielających świadczeń za pośrednictwem spółki niewpisanej do rejestru podmiotów wykonujących działalność leczniczą? Jeżeli nie, czy wystarczy dopisać obowiązek wskazania osoby fizycznej przez taką spółkę?',
    ],
  },
  {
    question: 'Wymiar czasu pracy',
    answer: ['Pojęcie z lit. d dotyczy pracowników. Czy publikacja lit. d ma sens dla osób na umowach cywilnoprawnych bez dodatkowego pojęcia „wymiaru zatrudnienia”?'],
  },
  {
    question: 'Identyfikator a RODO',
    answer: ['Czy dane opublikowane na podstawie ust. 6 pozostają danymi osobowymi w świetle motywu 26 RODO? Jakie ma to konsekwencje dla podstawy publikacji?'],
  },
  {
    question: 'Ryzyko rozpoznania osoby',
    answer: [
      'Specjalizacja w podziale na podmioty może pozwolić rozpoznać osobę w małym szpitalu. Czy potrzebny jest próg, na przykład niepublikowanie specjalizacji posiadanej przez mniej niż 5 osób w podmiocie?',
    ],
  },
  {
    question: 'Wynagrodzenia z mieszanych źródeł',
    answer: [
      'Ust. 6 publikuje całe wynagrodzenie wypłacone przez podmiot realizujący umowę z NFZ, także część finansowaną ze źródeł prywatnych. Czy trzeba to ograniczyć do części ze środków publicznych?',
    ],
  },
  {
    question: 'Kara',
    answer: [
      'Czy podstawa wymiaru „wartość umów z NFZ z poprzedniego roku” i właściwość Prezesa NFZ są prawidłowe? Czy przesłanki wymiaru kary trzeba określić w ustawie, czy wystarczy art. 189d k.p.a.?',
    ],
  },
  {
    question: 'Wejście w życie',
    answer: ['Czy formuła z art. 2 daje jednostce dość czasu na ogłoszenie formatu danych? Czy termin ogłoszenia formatu trzeba zapisać w ustawie?'],
  },
  {
    question: 'Relacja do art. 31lc ustawy o świadczeniach',
    answer: [
      'Świadczeniodawca może przekazywać te same dane dwoma torami: do AOTMiT i do jednostki. Czy zostawić to dla prostoty, czy dodać odesłanie?',
    ],
  },
  {
    question: 'Ścieżka wniesienia',
    answer: [
      'Projekt poselski czy petycja do Komisji do Spraw Petycji z wnioskiem o inicjatywę komisyjną? Jakie są wymagania formalne każdej ze ścieżek?',
    ],
  },
];

/** Załącznik C — źródła. */
export const references: { text: string; link?: { label: string; href: string } }[] = [
  {
    text: 'Ustawa z dnia 19 czerwca 2026 r. o zmianie ustawy o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych oraz ustawy o działalności leczniczej (Dz. U. poz. 972).',
    link: { label: 'Tekst po III czytaniu', href: 'https://api.sejm.gov.pl/sejm/term10/processes/2685/attachment/2685_u3.pdf' },
  },
  {
    text: 'Rządowy projekt ustawy, druk sejmowy nr 2685, z uzasadnieniem, oceną skutków regulacji i oceną skutków dla ochrony danych.',
    link: { label: 'druk nr 2685 (PDF)', href: 'https://api.sejm.gov.pl/sejm/term10/prints/2685/2685.pdf' },
  },
  { text: 'Ustawa z dnia 15 kwietnia 2011 r. o działalności leczniczej (Dz. U. z 2026 r. poz. 156 i 972), art. 27a.' },
  { text: 'Ustawa z dnia 27 sierpnia 2004 r. o świadczeniach opieki zdrowotnej finansowanych ze środków publicznych, art. 31lc.' },
  { text: 'Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO), art. 6 ust. 1 lit. c i e, art. 9, motyw 26.' },
];

/** Historia wersji — każda wersja zostaje z datą i plikiem, żeby cytaty „v0.3, ust. 6” dalej działały. */
export const history: { version: string; date: Date; text: string; pdf?: string }[] = [
  { version: '0.3', date: projekt.date, text: 'Wersja wstępna do weryfikacji prawnej.', pdf: projekt.pdf.href },
];
