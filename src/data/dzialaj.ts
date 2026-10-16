/**
 * /dzialaj/ — co czytelnik może zrobić, od najprostszego, i narzędzie „Napisz do polityka” (#napisz).
 * Etap projektu i wersja pochodzą z src/data/projekt-ustawy.ts, adresaci z src/data/adresaci.ts.
 *
 * Zasady treści (audyt 16.10.2026): postulat = łączne wypłaty bez nazwisk, pod stałym identyfikatorem;
 * żadnych ocen wysokości zarobków ani ramki „przeciw samorządowi”; nie obiecujemy ochrony adresów,
 * których nie chronimy (to publiczne adresy służbowe); list ma jeden szablon, krótki i rzeczowy.
 */
import { currentStage, projekt, stages } from '@/data/projekt-ustawy';
import type { LetterTemplate } from '@/lib/dzialaj/letter';

/**
 * Narzędzie „Napisz do polityka” jest gotowe, ale wyłączone (decyzja redakcji z 16.10.2026):
 * włączymy je na etapie szukania poparcia posłów, z listem przygotowanym na ten etap.
 * false = karta „Napisz do polityka” jest wyszarzona z dopiskiem „Wkrótce”, sekcja #napisz się nie renderuje.
 */
export const writeToolOn = false;

export const dzialajPage = {
  href: '/dzialaj/',
  eyebrow: 'Działaj',
  title: 'Jak możesz pomóc',
  docTitle: writeToolOn ? 'Jak możesz pomóc: napisz do polityka' : 'Jak możesz pomóc',
  lead: 'Jawność łącznych wypłat z publicznych pieniędzy nie wejdzie sama. Obywatelski projekt ustawy trafi do Sejmu, gdy podpisze go co najmniej 15 posłów — a posłowie najpierw muszą o nim usłyszeć. Poniżej kilka sposobów, od najprostszego.',
  description: writeToolOn
    ? 'Udostępnij postulat, napisz do posła lub senatora gotowym listem albo poleć projekt nowelizacji art. 27a. List wychodzi z Twojej skrzynki.'
    : 'Udostępnij postulat, poleć projekt nowelizacji art. 27a, przyślij dane albo sprostowanie i zapytaj szpital o informację publiczną.',
};

/** Pierwszy etap, który jeszcze przed nami — do metadanych nagłówka („Następny krok”). */
export const nextStage = stages.find((s) => s.state === 'next');

/* ---------- Udostępnij ---------- */

/** Wpis na X: bez ocen, z pytaniem, które postulat rozwiązuje. Adres dokłada X (parametr `url`). */
export const share = {
  path: '/postulat/',
  text: 'Ile publicznych pieniędzy trafia łącznie do jednej osoby w ochronie zdrowia? Dziś nikt tego nie sumuje. Obywatelski projekt nowelizacji: łączne wypłaty jawne, pod stałym identyfikatorem, bez nazwisk.',
};

/* ---------- Karty działań ---------- */

export const actions = {
  share: {
    title: 'Udostępnij postulat',
    text: 'Najszybsza pomoc: pokaż postulat znajomym. Wpis na X jest gotowy i neutralny, przed publikacją możesz go zmienić.',
  },
  write: {
    title: 'Napisz do polityka',
    text: 'Wybierz posła, senatora albo urząd z listy oficjalnych adresów, dopisz podpis i wyślij gotowy list ze swojej skrzynki.',
    cta: 'Przejdź do narzędzia',
    /** gdy narzędzie wyłączone (`writeToolOn = false`) */
    soonBadge: 'Wkrótce',
    soon: 'Uruchomimy je, gdy zaczniemy szukać poparcia posłów dla projektu ustawy — z listem przygotowanym na ten etap.',
  },
  read: {
    title: 'Przeczytaj i poleć projekt',
    text: 'Dwa nowe punkty w art. 27a ustawy o działalności leczniczej, z uzasadnieniem. Poleć go komuś, kto zna posła albo pracuje w ochronie zdrowia.',
    /** dopisek dla prawników — tylko na etapie weryfikacji prawnej (zob. `currentStage`) */
    legal: 'Znasz prawo administracyjne albo ochronę danych? Pytania do weryfikacji są w Załączniku B — uwagi prześlij na nasz adres.',
  },
  data: {
    title: 'Masz dane albo widzisz błąd',
    text: 'Napisz do nas. Najbardziej przydadzą się:',
    wanted: [
      'odpowiedzi szpitali na wnioski o informację publiczną — także odmowy i prośby o opłatę;',
      'sprostowania: liczba, która się nie zgadza, albo źródło, które przestało działać;',
      'dokumenty publiczne o wynagrodzeniach, których jeszcze u nas nie ma.',
    ],
  },
  ask: {
    title: 'Zapytaj szpital',
    text: 'Szpital publiczny musi odpowiedzieć na wniosek o informację publiczną, a składając go, nie musisz podawać powodu. Jak takie pytania wyglądają i czym się kończą, opisujemy w tekście o braku jawności.',
    link: { label: 'Wnioski o informację publiczną', href: '/mechanizmy/brak-jawnosci/#pytania-mediow-i-wnioski-o-informacje-publiczna' },
  },
  support: {
    title: 'Wesprzyj projekt',
    text: 'Serwis jest niezależny i niekomercyjny. Możesz go wesprzeć drobną wpłatą przez Suppi (BLIK, karta lub przelew, bez zakładania konta), także anonimowo.',
    link: { label: 'suppi.pl/zarobkilekarzy', href: 'https://suppi.pl/zarobkilekarzy' },
  },
  newsletter: {
    title: 'Zapisz się na newsletter',
    text: 'Raz w miesiącu nowe dane i postęp projektu ustawy. Formularz zapisu jest w stopce każdej strony.',
    cta: 'Do formularza',
  },
};

/* ---------- Napisz do polityka ---------- */

export const writeTool = {
  eyebrow: 'Napisz do polityka',
  title: 'Gotowy list, Twoja skrzynka',
  aside: 'Wybierz adresata, dopisz podpis i otwórz list w programie pocztowym. Treść możesz tam jeszcze zmienić.',
  /** pod narzędziem: skąd adresy (zdanie dokłada datę i liczbę) */
  sourcesTitle: 'Skąd te adresy',
  sources: 'Każdy adres to publiczny adres służbowy, przepisany dosłownie z oficjalnego źródła: API Sejmu, profilu senatora na senat.gov.pl, strony urzędu albo partii. Żadnego nie składaliśmy z imienia i nazwiska. Link „źródło” przy każdej pozycji prowadzi do strony, z której pochodzi adres.',
  privacyTitle: 'Co dzieje się z listem',
  privacy: 'Nic nie wysyłamy ani nie zapisujemy. List składa się w Twojej przeglądarce, a wychodzi z Twojej skrzynki, pod Twoim nazwiskiem albo bez niego. Podpis z pola trafia tylko do treści maila.',
  noJs: 'Bez JavaScriptu: kliknij adres na liście, a treść skopiuj z ramki „List”.',
};

/**
 * Jedyny szablon listu. Głos obywatela, we własnym imieniu; prośba o zapoznanie się z projektem
 * i o stanowisko albo poparcie. Bez liczb, które się starzeją, bez ocen wysokości zarobków,
 * bez instrumentów (interpelacja, oświadczenie), których adresat może nie mieć.
 * Formy 3. osoby („rozważy Pani”) nie odmieniają się przez rodzaj nadawcy.
 */
export function letterTemplate(origin: string | URL): LetterTemplate {
  const stage = `wersja ${projekt.version}, etap: ${currentStage.label.toLowerCase()}`;
  return {
    subject: 'Obywatelski projekt nowelizacji art. 27a ustawy o działalności leczniczej',
    body: [
      '{zwrot},',
      'piszę we własnym imieniu z prośbą o zapoznanie się z obywatelskim projektem nowelizacji art. 27a ustawy o działalności leczniczej.',
      'Każda placówka zna tylko swoją część wynagrodzeń. Nikt nie sumuje, ile pieniędzy publicznych trafia łącznie do jednej osoby, która pracuje w kilku miejscach.',
      'Projekt przewiduje, że placówki z umową z NFZ co kwartał przekazują te dane, a państwo publikuje łączne wypłaty ze środków publicznych dla każdej osoby jako dane otwarte: pod stałym identyfikatorem, bez nazwisk. Nie chodzi o ocenę niczyich zarobków, tylko o jawność wydatku publicznego.',
      `Projekt (${stage}) może trafić do Sejmu jako projekt poselski, gdy podpisze go co najmniej 15 posłów.`,
      '{prosba}',
      `Tekst projektu z uzasadnieniem: ${new URL(projekt.href, origin).href}`,
    ].join('\n\n'),
    ask: {
      k: 'Proszę o odpowiedź: jakie jest Pani stanowisko wobec projektu i czy rozważy Pani jego poparcie?',
      m: 'Proszę o odpowiedź: jakie jest Pana stanowisko wobec projektu i czy rozważy Pan jego poparcie?',
      inst: 'Proszę o odpowiedź: jakie jest Państwa stanowisko wobec projektu i czy rozważą Państwo jego poparcie?',
    },
    close: 'Z poważaniem',
  };
}
