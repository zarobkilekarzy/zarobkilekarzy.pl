/**
 * Teksty strony /konstelacja/ („Konstelacja ochrony zdrowia”).
 * Dane grafu: src/data/konstelacja/graf.json — kopia research/powiazania/graf.json (tam źródło prawdy, walidator
 * i ZASADY.md). Logika: src/lib/konstelacja/, widok: components/konstelacja/.
 */
import type { TextItem } from '@/types';

export const konstelacjaPage = {
  title: 'Konstelacja ochrony zdrowia',
  seoTitle: 'Konstelacja ochrony zdrowia — kto decyduje o pieniądzach',
  eyebrow: 'Narzędzie · powiązania w danych',
  lead:
    'Kto decyduje o publicznych pieniądzach w ochronie zdrowia — pisze przepisy, głosuje nad nimi, nadzoruje płatnika, reprezentuje zawód — i jak te osoby łączą się ze sobą w ogólnodostępnych danych. Każda linia ma źródło.',
  description:
    'Interaktywny graf osób, instytucji i ustaw, które decydują o publicznych pieniądzach w ochronie zdrowia. Każde powiązanie ze źródłem i stopniem pewności.',
};

/** „Jak czytać” — pierwszy akapit z metaforą konstelacji (użyta raz), potem punkty */
export const howToRead = {
  intro:
    'Gwiazdy w gwiazdozbiorze łączy linia narysowana przez obserwatora, a nie fizyczna więź. Tak samo tutaj: linia mówi, że dwie osoby albo osoba i instytucja spotykają się w dokumentach — nie, że współpracują.',
  items: [
    {
      title: 'Najjaśniejsze punkty to huby.',
      text: 'Hub to węzeł z największą liczbą różnych sąsiadów — na grafie ma dodatkową ramkę i podpis „HUB”. Wylicza go narzędzie z danych; redakcja niczego nie wskazuje ręcznie.',
    },
    {
      title: 'Kształt to pewność, kolor to rodzaj.',
      text: 'Linia ciągła gruba — dokument (rejestr, druk, stenogram); ciągła cienka — potwierdziła osoba albo instytucja; kropkowana — podają media, nikt nie zaprzecza; przerywana — sporne: ktoś zaprzecza albo źródło jest anonimowe.',
    },
    {
      title: 'Linia nie jest zarzutem.',
      text: 'Powiązanie to fakt o relacji. Zarzut karny stoi osobno, zawsze z dopiskiem „nie udowodniony fakt”, a osoba ma tylko inicjał nazwiska.',
    },
    {
      title: 'Rdzeń, widoki, analiza.',
      text: 'Domyślnie widać osoby, które łączą co najmniej dwie instytucje albo mają powiązanie z inną osobą; reszta kryje się pod licznikiem „+N”. Widok to jedna teza i kilkanaście węzłów z faktami. „Analiza” szuka ścieżki między osobami, porównuje dwie osoby i liczy, na czym stoją źródła.',
    },
  ] satisfies TextItem[],
};

/** Metoda: źródła i kryteria wejścia do grafu (streszczenie research/powiazania/ZASADY.md, p. 2, 5, 6, 7) */
export const method = {
  sources:
    'Źródła są ogólnodostępne i idą od najtwardszych: rejestry i bazy (Sejm, Senat, KRS, informator NFZ o umowach), druki, stenogramy, oświadczenia majątkowe, publikacje z DOI; potem oficjalne komunikaty; na końcu media z nazwą redakcji i datą. Każde źródło jest otwarte i przeczytane przed wpisaniem faktu. Wikipedia, X, fora i narzędzia AI służą najwyżej za wskazówkę, gdzie szukać — nigdy za źródło.',
  criteriaIntro: 'Osoba trafia do grafu, gdy spełnia co najmniej jedno kryterium i ma źródło:',
  criteria: [
    {
      title: 'Funkcja w organie, który decyduje o pieniądzach lub zawodzie',
      text: '— kierownictwo MZ i NFZ, Prezydium Naczelnej Rady Lekarskiej, prezydium sejmowej i cały skład senackiej Komisji Zdrowia.',
    },
    {
      title: 'Rola w procesie ustawy z grafu',
      text: '— autor projektu, poprawki albo wniosku, sprawozdawca, przedstawiciel rządu.',
    },
    {
      title: 'Głos nad ustawą z grafu i powiązanie z ochroną zdrowia',
      text: '— zawód medyczny albo funkcja w MZ, NFZ, samorządzie zawodowym lub kierownictwie szpitala. Sam głos nie wystarcza.',
    },
    {
      title: 'Udokumentowane powiązanie z osobą, która już jest w grafie',
      text: '— wspólna funkcja, współpraca, rodzina; co najmniej doniesienie medialne z nazwą redakcji.',
    },
  ] satisfies TextItem[],
  rules:
    '„Kontrowersyjny” nie jest kryterium. Nie wchodzą członkowie rodzin bez funkcji publicznych, osoby prywatne ani pacjenci. Obowiązkowe członkostwo w izbie lekarskiej nie jest linią — linię daje dopiero funkcja. Partia to cecha osoby, nie węzeł, a kryteria są te same dla wszystkich klubów.',
};

/** Granice danych */
export const limits = [
  'Dane są niepełne. Graf obejmuje osoby, do których dotarł research według kryteriów wyżej, a nie cały system. Brak linii nie znaczy, że powiązania nie ma; lista osób z jednej partii nie mówi nic o całej partii.',
  'Publiczny odpis z KRS maskuje nazwiska (zostaje pierwsza litera i długość). Wpis z rejestru przypisujemy osobie dopiero wtedy, gdy niezależne źródło z pełnym nazwiskiem mówi o tej samej funkcji; samo dopasowanie maski do grafu nie trafia.',
  'Oświadczenie majątkowe mówi, kto płaci, a nie skąd płatnik ma pieniądze. Umowa z NFZ to wartość umów za rok, nie wypłaty.',
  'Wspólne okresy funkcji są wyliczane z dat. Gdy znamy tylko rok albo miesiąc, liczymy ostrożnie — nakładanie się wychodzi tylko z dokładnych dat.',
  'Ścieżka w grafie to powiązanie w danych, nie dowód współpracy ani zarzut. Narzędzie nie szuka „wzorców konfliktu interesów” — ocenę zostawia czytelnikowi.',
];

/** Nota pod treścią: najpierw źródła, potem rola narzędzi AI, na końcu odpowiedzialność redakcji (AGENTS.md) */
export const madeNote = {
  title: 'Jak powstała ta strona.',
  text: 'Źródła to publiczne rejestry, dokumenty, druki i publikacje — każde z linkiem przy fakcie. Narzędzia AI pomagają je wyszukać i uporządkować oraz liczą wyniki analizy. Fakt trafia do grafu dopiero wtedy, gdy redakcja otworzy i przeczyta źródło; o doborze osób, treści opisów i widokach decyduje redakcja.',
};

export const caveat = {
  text: 'Zestawienie może zawierać błędy wynikające z błędnej interpretacji faktów. Dokładamy wszelkich starań, aby ich nie było: każdy fakt ma źródło, a pomyłki poprawiamy po zgłoszeniu.',
  link: 'Zgłoś błąd',
};

export const fixNote = {
  title: 'Widzisz błąd?',
  text: 'Nieaktualną funkcję, złą datę albo brakujące źródło zgłoś — poprawimy z datą i opisem zmiany.',
  link: 'Zgłoś sprostowanie',
  href: '/o-projekcie/#sprostowania',
};
