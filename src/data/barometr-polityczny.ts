/**
 * Barometr polityczny — strona /barometr-polityczny/. Docelowo: polityka zdrowotna każdej partii
 * opisana według tych samych obszarów. Na start: wstęp, zasady i zaproszenie do przesłania programu.
 * Bezstronność: te same pytania dla wszystkich, stanowisko partii oddzielone od faktów, bez nazwisk.
 */
import type { ImageMetadata } from 'astro';
import type { TextItem } from '@/types';
import { formatDate, formatPL, plural } from '@/lib/format';
import { contact } from '@/data/o-serwisie';
import { projekt } from '@/data/projekt-ustawy';

import centrumLogo from '@/assets/partie/centrum.png';
import demokracjaLogo from '@/assets/partie/demokracja-bezposrednia.png';
import kkpLogo from '@/assets/partie/kkp.png';
import koLogo from '@/assets/partie/ko.svg';
import konfederacjaLogo from '@/assets/partie/konfederacja.png';
import lewicaLogo from '@/assets/partie/lewica.png';
import nilLogo from '@/assets/partie/nil.png';
import pisLogo from '@/assets/partie/pis.svg';
import polska2050Logo from '@/assets/partie/polska2050.png';
import pslLogo from '@/assets/partie/psl.svg';
import razemLogo from '@/assets/partie/razem.svg';
import rozwojLogo from '@/assets/partie/rozwoj.png';

export const barometrPage = {
  href: '/barometr-polityczny/',
  eyebrow: 'Partie i ochrona zdrowia',
  title: 'Barometr polityczny',
  docTitle: 'Barometr polityczny: polityka zdrowotna partii',
  /** <title> — docTitle z nazwą serwisu ma 66 znaków (audyt SEO: > 60) */
  seoTitle: 'Barometr: polityka zdrowotna partii',
  lead: 'Co partie proponują w ochronie zdrowia — według tych samych pytań dla każdej z nich i ze źródłem przy każdej tezie. Zaczynamy od zaproszenia: każda partia może przedstawić nam swój program.',
  description: 'Polityka zdrowotna partii według tych samych pytań i ze źródłami. Zaproszenie dla partii do przesłania programu w ochronie zdrowia.',
  updated: new Date('2026-10-18'),
  /** true = szkic: noindex (także podstron partii). Opublikowane 17.10.2026; wzór opisu zostaje noindex zawsze. */
  draft: false,
};

/** Programy partii przyjmujemy na ogólny adres serwisu (decyzja redakcji 17.10.2026); temat wiadomości je wyróżnia. */
export const barometrContact = {
  email: contact.email,
  subject: 'Barometr polityczny — program partii',
};

/**
 * Wysyłka pytań: jednego dnia do wszystkich na liście (decyzje redakcji 17.10.2026), termin na odpowiedź liczony
 * od wysyłki. Po wysłaniu wpisać `status: { stage: 'wyslane', sent }` przy partiach; po terminie — `brak`
 * u tych, które nie odpowiedziały (statusy nie zmieniają się same: strona jest statyczna).
 */
export const barometrSchedule = {
  // pytania poszły w niedzielę 18.10, dzień przed zapowiedzią — do wszystkich naraz; termin bez zmian (decyzja redakcji 18.10.2026)
  sendOn: new Date('2026-10-18'),
  answerWeeks: 2,
  deadline: new Date('2026-11-02'),
};
/** ostatni dzień na odpowiedź */
export const answerDeadline = barometrSchedule.deadline;
/** status po wysyłce pytań — ten sam dzień u wszystkich */
const SENT: BarometrStatus = { stage: 'wyslane', sent: barometrSchedule.sendOn };
/** „3 tygodnie” */
export const answerTime = `${barometrSchedule.answerWeeks} ${plural(barometrSchedule.answerWeeks, ['tydzień', 'tygodnie', 'tygodni'])}`;

/**
 * Limit odpowiedzi w jednym obszarze: znaki ze spacjami, bez podziałów akapitów (decyzja redakcji 17.10.2026).
 * Dłuższą odpowiedź odsyłamy partii do skrócenia — sami nie skracamy; pełną wersję partia może dołączyć
 * jako dokument. Build przerywa się, gdy opis przekracza limit (zob. koniec pliku).
 */
export const ANSWER_LIMIT = 1500;
/** „1 500 znaków ze spacjami” */
export const answerLimitLabel = `${formatPL(ANSWER_LIMIT)} ${plural(ANSWER_LIMIT, ['znak', 'znaki', 'znaków'])} ze spacjami`;
/** długość odpowiedzi tą samą miarą co limit */
export const answerLength = (answer: string[]) => answer.join('').length;

/**
 * Pytania pomocnicze: podpowiedź, co ująć w odpowiedzi — nie obowiązek, ten sam limit znaków.
 * Zasada redakcji: każde dopuszcza każdą odpowiedź, także skrajną i „nic nie zmieniać” („Czy…? Jeśli tak — …”),
 * i da się je zadać każdej partii oraz NIL. Pytanie może mieć link (np. do projektu nowelizacji).
 */
export type BarometrHint = string | { text: string; link: { label: string; href: string } };
type Hints = BarometrHint[];

/** Część obszaru (kadry: lekarze, pielęgniarki, inne zawody) — osobna odpowiedź z tym samym limitem. */
export interface BarometrAreaPart extends TextItem {
  id: string;
  hints?: Hints;
}

/** Obszar opisu: `id` = kotwica sekcji na podstronie partii (stała — linkują do niej inne strony). */
export interface BarometrArea extends TextItem {
  id: string;
  /** części obszaru; każda to osobna odpowiedź (decyzja redakcji 17.10.2026 — kadry w trzech częściach) */
  parts?: BarometrAreaPart[];
  hints?: Hints;
}

/** Obszary opisu — te same dla każdej partii; to zarazem pytania, które wysyłamy partiom. */
export const barometrAreas: BarometrArea[] = [
  {
    id: 'finansowanie',
    title: 'Finansowanie.',
    text: 'Ile publicznych pieniędzy na ochronę zdrowia i skąd je wziąć: ze składki, z budżetu państwa, z innych źródeł.',
    hints: [
      'Kto powinien płacić za leczenie: pieniądze publiczne (składka, budżet), prywatne (ubezpieczenia, dopłaty pacjentów) czy jedne i drugie — i w jakich proporcjach?',
      'Czy ochrona zdrowia powinna być bardziej publiczna czy bardziej prywatna — np. czy zwiększyć, utrzymać czy zmniejszyć udział prywatnych placówek w leczeniu finansowanym z pieniędzy publicznych — i dlaczego?',
      'Czy zmieniać składkę zdrowotną — jej wysokość albo zasady naliczania, np. dla przedsiębiorców? Jeśli tak — jak?',
      'Czy zmieniać wysokość publicznych wydatków na zdrowie? Jeśli tak — o ile i do kiedy?',
    ],
  },
  {
    id: 'kadry',
    title: 'Kadry.',
    text: 'Jak zapewnić kadry ochrony zdrowia. Odpowiedź w trzech częściach:',
    parts: [
      {
        id: 'lekarze',
        title: 'Lekarze',
        text: 'kształcenie, liczba miejsc na studiach, specjalizacje.',
        hints: [
          'Czy zmienić liczbę miejsc na studiach lekarskich — zwiększyć, utrzymać czy zmniejszyć — i dlaczego?',
          'Czy lekarze, którzy robią specjalizację w rezydenturze opłacanej z pieniędzy publicznych, powinni mieć obowiązek pracy w Polsce albo w publicznym systemie po jej ukończeniu? Jeśli tak — przez ile lat i na jakich zasadach?',
          'Czy ewidencjonować i ograniczać łączny czas pracy lekarza we wszystkich miejscach, w których pracuje za pieniądze publiczne? Jeśli tak — jak to sprawdzać?',
          'Czy zmienić zasady dopuszczania do pracy lekarzy spoza Unii Europejskiej? Jeśli tak — jak?',
        ],
      },
      {
        id: 'pielegniarki',
        title: 'Pielęgniarki',
        text: 'kształcenie, liczba miejsc na studiach, specjalizacje.',
        hints: [
          'Czy zmienić liczbę miejsc na studiach pielęgniarskich — zwiększyć, utrzymać czy zmniejszyć — i dlaczego?',
          'Czy zmieniać zakres samodzielnych uprawnień pielęgniarek, np. wystawianie recept czy udzielanie porad? Jeśli tak — jak?',
        ],
      },
      {
        id: 'inne-zawody',
        title: 'Inne zawody medyczne',
        text: 'ratownicy medyczni, fizjoterapeuci, diagności laboratoryjni, farmaceuci i inni: kształcenie, liczba miejsc na studiach.',
        hints: ['Czy inne zawody medyczne, np. farmaceuci, powinny przejąć część zadań lekarzy, np. wystawianie recept czy udzielanie porad? Jeśli tak — które?'],
      },
    ],
  },
  {
    id: 'wynagrodzenia',
    title: 'Wynagrodzenia i jawność.',
    text: 'Jak ustalać i rozliczać wynagrodzenia z publicznych pieniędzy: etat i kontrakt, płace minimalne, jawność łącznych kwot.',
    hints: [
      'Jaka forma zatrudnienia w placówkach finansowanych przez NFZ: etat, kontrakt czy obie? Czy różnice w podatkach i składkach między nimi powinny zostać?',
      {
        text: 'Czy poparliby Państwo projekt nowelizacji przygotowany przez ten serwis — jawne łączne wynagrodzenia z pieniędzy publicznych pod stałym identyfikatorem zamiast nazwiska — bez zmian, z poprawkami czy wcale? I dlaczego?',
        link: { label: 'Projekt nowelizacji', href: projekt.href },
      },
    ],
  },
  {
    id: 'dostep',
    title: 'Dostęp i kolejki.',
    text: 'Jak skrócić czas oczekiwania na świadczenia i jak go rzetelnie mierzyć.',
    hints: [
      'Czy państwo powinno gwarantować najdłuższy czas oczekiwania na świadczenia? Jeśli tak — jaki i co, gdy zostanie przekroczony?',
      'Czy i jak państwo powinno wpływać na wybór między lekami oryginalnymi a ich zamiennikami (generykami) — w refundacji i w aptece?',
      'Czy i jak zmieniać dostęp do pomocy psychiatrycznej i psychologicznej, w tym dla dzieci i młodzieży?',
    ],
  },
  {
    id: 'szpitale',
    title: 'Szpitale.',
    text: 'Sieć szpitali, ich zadłużenie i zasady finansowania: kto pokrywa straty i kto decyduje o zmianach.',
    hints: [
      'Kto powinien prowadzić szpitale: państwo lub samorząd, prywatne podmioty czy jedni i drudzy?',
      'Czy zmieniać zasady postępowania z zadłużonymi szpitalami? Jeśli tak — jak?',
    ],
  },
  {
    id: 'pacjent',
    title: 'Pacjent.',
    text: 'Prawa pacjenta, informacja o jakości leczenia, dochodzenie roszczeń po błędzie medycznym.',
    hints: [
      'Kto powinien orzekać w sprawach odpowiedzialności zawodowej lekarzy — sądy samorządu lekarskiego, sądy powszechne czy skład mieszany, np. z udziałem przedstawicieli pacjentów — i dlaczego?',
      'Czy i jak sztuczna inteligencja powinna być używana w leczeniu — i kto ma odpowiadać za jej błędy?',
    ],
  },
];

/** Zasady barometru — jak publikujemy stanowiska partii. */
export const barometrRules: TextItem[] = [
  {
    title: 'Te same pytania dla wszystkich',
    text: `Każda partia dostaje ten sam zestaw obszarów i tyle samo miejsca: do ${answerLimitLabel} w każdym obszarze, a w kadrach — w każdej z trzech części. Dłuższą odpowiedź odsyłamy do skrócenia — pełną wersję partia może dołączyć jako dokument. Opisy układamy alfabetycznie.`,
  },
  {
    title: 'Słowa partii, nie nasz wybór',
    text: 'Odpowiedź publikujemy bez zmian w treści i podpisujemy jako stanowisko partii. Dokumenty pokazujemy tylko te, które partia sama wskaże — sami ich nie dobieramy.',
  },
  {
    title: 'Bez odpowiedzi — piszemy to wprost',
    text: `Na odpowiedź każda partia ma ${answerTime}. Potem przy karcie partii, która nie odpowiedziała, piszemy „Bez odpowiedzi” i datę wysłania pytań — bez opisu za partię. Spóźnioną odpowiedź dodamy, gdy tylko przyjdzie. Pominięty obszar też oznaczamy wprost: „Partia nie odniosła się do tego obszaru”.`,
  },
  {
    title: 'Prawo do poprawki',
    text: 'Każda partia może w dowolnym momencie uzupełnić albo sprostować swój opis. Każdą zmianę oznaczamy datą.',
  },
];

/** Co warto przesłać — lista w zaproszeniu. */
export const barometrToSend: TextItem[] = [
  {
    title: 'Program w ochronie zdrowia',
    text: 'Cały program albo jego część o zdrowiu — jako plik lub link do strony partii.',
  },
  {
    title: 'Odpowiedzi w sześciu obszarach',
    text: `Do ${answerLimitLabel} na każdy obszar z listy powyżej, a w kadrach — osobno na lekarzy, pielęgniarki i inne zawody medyczne. Obszar albo część, w której partia nie ma stanowiska, można pominąć — zaznaczymy wtedy wprost przy tym obszarze, że partia się do niego nie odniosła. Prosimy bez nazwisk — opisujemy programy, nie osoby.`,
  },
  {
    title: 'Koszt, źródło pieniędzy, termin',
    text: 'Jeśli propozycja tego dotyczy: ile ma kosztować, skąd wziąć na nią pieniądze i do kiedy ma zostać wdrożona.',
  },
  {
    title: 'Dokumenty na poparcie odpowiedzi',
    text: 'Linki do projektów ustaw, poprawek albo programu, które potwierdzają odpowiedź, a także pełna wersja odpowiedzi dłuższej niż limit. Pokażemy tylko dokumenty wskazane przez partię.',
  },
];

/* ---------- Partie ---------- */

export interface BarometrParty {
  /** kotwica karty, docelowo adres podstrony /barometr-polityczny/<id>/ */
  id: string;
  name: string;
  /** nazwa klubu albo koła dokładnie jak na stronie Sejmu (sejm.source); poza partiami — kim jest */
  club: string;
  logo: ImageMetadata;
  /** true = nie partia (np. samorząd zawodowy) — karta z wyraźnym oznaczeniem, na końcu listy */
  notParty?: boolean;
  /** objaśnienie w dymku „?” przy etykiecie „Nie partia”: dlaczego jest na liście, ze źródłem */
  about?: { heading: string; text: string; source: { label: string; href: string } };  /** etap kontaktu; brak = pytań jeszcze nie wysłano */
  status?: BarometrStatus;
}

/**
 * Etap kontaktu z partią — ten sam ciąg dla każdej: pytania niewysłane → wysłane → odpowiedź partii
 * albo „Bez odpowiedzi” z datą wysłania pytań — bez opisu przygotowanego za partię (decyzja redakcji 17.10.2026).
 * Daty wpisujemy w dniu zdarzenia (we wzorze i w legendzie ich nie ma — stąd pola opcjonalne).
 */
export type BarometrStatus =
  | { stage: 'niewyslane' }
  | { stage: 'wyslane'; sent?: Date }
  | { stage: 'odpowiedz'; sent?: Date; answered?: Date }
  | { stage: 'brak'; sent?: Date };

export const NOT_SENT: BarometrStatus = { stage: 'niewyslane' };

/** Etykieta stanu na karcie i w legendzie. */
export function statusLabel(status: BarometrStatus): string {
  const on = (d?: Date) => (d ? ` ${formatDate(d)}` : '');
  switch (status.stage) {
    case 'niewyslane': return 'Pytań jeszcze nie wysłaliśmy';
    case 'wyslane': return `Pytania wysłane${on(status.sent)}`;
    case 'odpowiedz': return status.answered ? `Odpowiedź z${on(status.answered)}` : 'Odpowiedź partii';
    case 'brak': return status.sent ? `Bez odpowiedzi · pytania wysłane${on(status.sent)}` : 'Bez odpowiedzi';
  }
}

/** Legenda stanów na stronie barometru — w kolejności etapów. */
export const statusLegend: BarometrStatus[] = [NOT_SENT, { stage: 'wyslane' }, { stage: 'odpowiedz' }, { stage: 'brak' }];

/** Skąd nazwy klubów i kół. Zmiana składu Sejmu = nowa data `asOf`. */
export const barometrSejm = {
  source: 'https://www.sejm.gov.pl/Sejm10.nsf/kluby.xsp',
  label: 'Sejm RP, „Kluby i koła” (X kadencja)',
  asOf: new Date('2026-10-17'),
};

/** Partie z klubem albo kołem w Sejmie — na stronie alfabetycznie (zasada „te same pytania dla wszystkich”). */
export const barometrParties: BarometrParty[] = (
  [
    { id: 'centrum', name: 'Centrum', club: 'Klub Parlamentarny Centrum', logo: centrumLogo, status: SENT },
    { id: 'demokracja-bezposrednia', name: 'Demokracja Bezpośrednia', club: 'Koło Poselskie Demokracja Bezpośrednia', logo: demokracjaLogo, status: SENT },
    { id: 'koalicja-obywatelska', name: 'Koalicja Obywatelska', club: 'Klub Parlamentarny Koalicja Obywatelska – Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni', logo: koLogo, status: SENT },
    { id: 'konfederacja', name: 'Konfederacja Wolność i Niepodległość', club: 'Klub Poselski Konfederacja', logo: konfederacjaLogo, status: SENT },
    { id: 'konfederacja-korony-polskiej', name: 'Konfederacja Korony Polskiej', club: 'Koło Poselskie Konfederacja Korony Polskiej', logo: kkpLogo, status: SENT },
    { id: 'lewica', name: 'Lewica', club: 'Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PPS, Unia Pracy)', logo: lewicaLogo, status: SENT },
    { id: 'polska-2050', name: 'Polska 2050', club: 'Klub Parlamentarny Polska 2050', logo: polska2050Logo, status: SENT },
    { id: 'psl', name: 'Polskie Stronnictwo Ludowe', club: 'Klub Parlamentarny Polskie Stronnictwo Ludowe – Trzecia Droga', logo: pslLogo, status: SENT },
    { id: 'pis', name: 'Prawo i Sprawiedliwość', club: 'Klub Parlamentarny Prawo i Sprawiedliwość', logo: pisLogo, status: SENT },
    { id: 'razem', name: 'Razem', club: 'Koło Poselskie Razem', logo: razemLogo, status: SENT },
    { id: 'rozwoj-plus', name: 'Rozwój Plus', club: 'Klub Parlamentarny Rozwój Plus', logo: rozwojLogo, status: SENT },
  ] satisfies BarometrParty[]
).sort((a, b) => a.name.localeCompare(b.name, 'pl'));

/** Uczestnicy sporu o politykę zdrowotną, którzy nie są partiami — za partiami, z oznaczeniem „nie partia”. */
export const barometrOthers: BarometrParty[] = [
  {
    id: 'nil',
    name: 'Naczelna Izba Lekarska',
    club: 'Samorząd zawodowy lekarzy i lekarzy dentystów',
    logo: nilLogo,
    notParty: true,
    status: SENT,
    // słowami ustawy (art. 5 pkt 14–16), nie „lobbuje” — lobbing ma w prawie węższe znaczenie
    about: {
      heading: 'Dlaczego NIL jest na liście',
      text: 'Naczelna Izba Lekarska nie jest partią, tylko samorządem zawodowym lekarzy. Z mocy ustawy występuje w obronie interesów lekarzy, zajmuje stanowisko w sprawach polityki zdrowotnej państwa i opiniuje projekty przepisów o ochronie zdrowia — dlatego dostaje te same pytania co partie.',
      source: { label: 'ustawa o izbach lekarskich, art. 5 pkt 14–16', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342' },
    },
  },
];

/* ---------- Opis partii (podstrona /barometr-polityczny/<id>/) ---------- */

/**
 * Dokument WSKAZANY PRZEZ PARTIĘ na poparcie odpowiedzi: projekt ustawy, poprawka, program…
 * Sami dokumentów nie dobieramy i nie pokazujemy głosowań (decyzja redakcji 17.10.2026, wariant A) —
 * wybór za partię byłby zarzutem stronniczości, a NIL w ogóle nie głosuje.
 */
export interface BarometrDocument {
  kind: string;
  title: string;
  /** link do dokumentu — w prawdziwym opisie obowiązkowy; we wzorze brak */
  href?: string;
  date?: Date;
}

/** Jeden obszar w opisie partii: stanowisko w nadesłanym brzmieniu, dokumenty wskazane przez partię, „Czy podano”. */
export interface BarometrAreaEntry {
  /** id obszaru z barometrAreas */
  area: string;
  /** id części obszaru (kadry: lekarze, pielegniarki, inne-zawody); brak = obszar bez części */
  part?: string;
  /** odpowiedź partii w nadesłanym brzmieniu (akapity); brak = partia nie odniosła się do obszaru */
  answer?: string[];
  /** dokumenty wskazane przez partię; puste = partia żadnego nie wskazała */
  documents: BarometrDocument[];
  /** czy przy propozycjach podano koszt, źródło pieniędzy i termin — nie oceniamy, czy propozycja jest dobra;
   *  'nie-dotyczy' = propozycja nie ma kosztu ani terminu (np. zmiana zasad bez wydatków) */
  checks?: { cost: BarometrCheck; funding: BarometrCheck; deadline: BarometrCheck };
}

export interface BarometrProfile {
  id: string;
  href: string;
  name: string;
  club: string;
  logo?: ImageMetadata;
  /** wzór na fikcyjnej partii: zawsze noindex, z ramką „to wzór” */
  example?: boolean;
  /** podstronę ma tylko partia, która odpowiedziała — bez odpowiedzi zostaje sama karta z datą wysłania pytań */
  status: Extract<BarometrStatus, { stage: 'odpowiedz' }>;
  updated: Date;
  areas: BarometrAreaEntry[];
  changes: { date: Date; text: string }[];
}

/** Trzy pytania sprawdzalności — te same w każdym obszarze i przy każdej partii. */
export type BarometrCheck = boolean | 'nie-dotyczy';

export const barometrChecks = [
  { key: 'cost', label: 'Koszt propozycji' },
  { key: 'funding', label: 'Źródło pieniędzy' },
  { key: 'deadline', label: 'Termin wdrożenia' },
] as const;

const profileHref = (id: string) => `${barometrPage.href}${id}/`;

/**
 * Wzór opisu na fikcyjnej partii — pokazuje układ, nie treść. Odpowiedzi opisują, co partia w danym
 * miejscu napisze; nie wolno tu wstawiać zmyślonych stanowisk ani przypisywać ich prawdziwej partii.
 * Wszystkie obszary i części uzupełnione: każda odpowiedź opisuje, czego dotyczą pytania pomocnicze w tym miejscu.
 */
export const barometrExample: BarometrProfile = {
  id: 'wzor',
  href: profileHref('wzor'),
  name: 'Partia Przykładowa',
  club: 'Fikcyjny klub parlamentarny — wzór opisu',
  example: true,
  status: { stage: 'odpowiedz' },
  updated: new Date('2026-10-17'),
  areas: [
    {
      area: 'finansowanie',
      // dokładnie 1500 znaków ze spacjami (bez podziałów akapitów) — pokazuje, ile miejsca ma odpowiedź w jednym obszarze
      answer: [
        'Tu partia opisuje własnymi słowami, ile publicznych pieniędzy chce przeznaczyć na ochronę zdrowia i skąd je wziąć. Ten tekst ma dokładnie tyle miejsca, ile dostanie każda partia w jednym obszarze: 1500 znaków ze spacjami, czyli mniej więcej dwieście słów. To wystarczy, żeby przedstawić jedną albo dwie konkretne propozycje razem z uzasadnieniem.',
        'W dobrej odpowiedzi czytelnik znajdzie najpierw krótki opis problemu, który partia chce rozwiązać, i to, co konkretnie proponuje zmienić. Potem koszt propozycji — choćby szacunkowy, z podaniem, jak go policzono. Dalej źródło pieniędzy: czy chodzi o wyższą składkę, większą dotację z budżetu państwa, przesunięcie wydatków w samym systemie, czy o inne rozwiązanie. Na końcu termin: do kiedy zmiana miałaby wejść w życie i po czym będzie można poznać, że działa.',
        'Najlepiej pisać tak, żeby odpowiedź dało się zrozumieć bez znajomości żargonu: zamiast skrótów i nazw programów — co się zmieni dla pacjenta, lekarza lub szpitala. Liczby warto podawać razem ze źródłem, z którego pochodzą, oraz z rokiem, którego dotyczą. Czytelnik porówna tę odpowiedź z odpowiedziami innych partii w tym samym obszarze, więc konkret działa tu lepiej niż ogólna, dobrze brzmiąca deklaracja.',
        'Jeśli partia ma do powiedzenia więcej, niż mieści się w limicie, może dołączyć link do swojego programu albo projektu ustawy — pokażemy go obok, wśród dokumentów wskazanych przez partię. Odpowiedzi nie skracamy ani nie zmieniamy: gdy tekst jest za długi, prosimy partię o krótszą wersję.',
      ],
      documents: [
        { kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' },
        { kind: 'Program', title: 'Fragment programu partii o finansowaniu ochrony zdrowia, z linkiem do dokumentu na stronie partii' },
      ],
      checks: { cost: true, funding: true, deadline: false },
    },
    // kadry w trzech częściach — każda odpowiedź opisuje, czego dotyczą pytania pomocnicze w tym miejscu
    {
      area: 'kadry',
      part: 'lekarze',
      answer: [
        'Tu partia odpowiada o lekarzach: czy zmienić liczbę miejsc na studiach lekarskich i czy lekarze, którzy robią specjalizację w rezydenturze opłacanej z pieniędzy publicznych, mają mieć obowiązek pracy w Polsce albo w publicznym systemie.',
        'Może też napisać, czy ewidencjonować i ograniczać łączny czas pracy lekarza we wszystkich miejscach finansowanych z pieniędzy publicznych oraz na jakich zasadach dopuszczać do pracy lekarzy spoza Unii Europejskiej.',
      ],
      documents: [{ kind: 'Poprawka', title: 'Poprawka, którą partia wskazała: do jakiej ustawy, z linkiem do druku' }],
      checks: { cost: false, funding: false, deadline: true },
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      answer: ['Tu partia odpowiada o pielęgniarkach: czy zmienić liczbę miejsc na studiach pielęgniarskich i czy zmieniać zakres ich samodzielnych uprawnień, np. wystawianie recept czy udzielanie porad.'],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o pielęgniarkach, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: true, deadline: false },
    },
    {
      area: 'kadry',
      part: 'inne-zawody',
      answer: ['Tu partia odpowiada o innych zawodach medycznych — ratownikach, fizjoterapeutach, diagnostach laboratoryjnych, farmaceutach: o kształceniu, liczbie miejsc na studiach i o tym, czy część zadań lekarzy mogłyby przejąć inne zawody.'],
      documents: [{ kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' }],
      checks: { cost: true, funding: false, deadline: true },
    },
    {
      area: 'wynagrodzenia',
      answer: [
        'Tu partia odpowiada o zasadach wynagradzania z publicznych pieniędzy: jaka forma zatrudnienia w placówkach finansowanych przez NFZ — etat, kontrakt czy obie — i czy różnice w podatkach i składkach między nimi powinny zostać.',
        'Może też odnieść się do projektu nowelizacji przygotowanego przez serwis: poprzeć go bez zmian, z poprawkami albo wcale — i wyjaśnić dlaczego.',
      ],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o wynagrodzeniach, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: true, deadline: true },
    },
    {
      area: 'dostep',
      answer: ['Tu partia odpowiada, czy państwo powinno gwarantować najdłuższy czas oczekiwania na świadczenia, jak wpływać na wybór między lekami oryginalnymi a generykami i jak zmieniać dostęp do pomocy psychiatrycznej i psychologicznej, w tym dla dzieci i młodzieży.'],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o kolejkach, lekach i zdrowiu psychicznym, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: false, deadline: false },
    },
    {
      area: 'szpitale',
      answer: ['Tu partia odpowiada, kto powinien prowadzić szpitale — państwo lub samorząd, prywatne podmioty czy jedni i drudzy — i czy zmieniać zasady postępowania z zadłużonymi szpitalami.'],
      documents: [{ kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' }],
      checks: { cost: false, funding: true, deadline: true },
    },
    {
      area: 'pacjent',
      answer: ['Tu partia odpowiada o prawach pacjenta i informacji o jakości leczenia: kto powinien orzekać w sprawach odpowiedzialności zawodowej lekarzy oraz czy i jak używać sztucznej inteligencji w leczeniu — i kto ma odpowiadać za jej błędy.'],
      documents: [{ kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' }],
      checks: { cost: false, funding: false, deadline: true },
    },
  ],
  changes: [{ date: new Date('2026-10-17'), text: 'Wzór opisu — pierwsza wersja.' }],
};

/** Opisy z własną podstroną. Prawdziwy opis: id = id karty partii, dane partii z barometrParties. */
export const barometrProfiles: BarometrProfile[] = [barometrExample];

// Strażnik limitu: odpowiedź dłuższa niż ANSWER_LIMIT zatrzymuje build — nie publikujemy jej skróconej przez nas.
for (const profile of barometrProfiles) {
  for (const entry of profile.areas) {
    const n = entry.answer ? answerLength(entry.answer) : 0;
    if (n > ANSWER_LIMIT) {
      const where = entry.part ? `${entry.area}/${entry.part}` : entry.area;
      throw new Error(`Barometr: odpowiedź „${profile.name}” w „${where}” ma ${n} znaków (limit ${ANSWER_LIMIT}) — odesłać partii do skrócenia`);
    }
  }
}
