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
import korwinLogo from '@/assets/partie/korwin.png';
import koLogo from '@/assets/partie/ko.svg';
import konfederacjaLogo from '@/assets/partie/konfederacja.png';
import lewicaLogo from '@/assets/partie/lewica.png';
import nilLogo from '@/assets/partie/nil.png';
import pisLogo from '@/assets/partie/pis.svg';
import polska2050Logo from '@/assets/partie/polska2050.png';
import pslLogo from '@/assets/partie/psl.svg';
import razemLogo from '@/assets/partie/razem.svg';
import rozwojLogo from '@/assets/partie/rozwoj.png';
import komarewiczPhoto from '@/assets/barometr/komarewicz.jpg';
import wzorPhoto from '@/assets/barometr/wzor-zdjecie.png';

export const barometrPage = {
  href: '/barometr-polityczny/',
  eyebrow: 'Partie i ochrona zdrowia',
  title: 'Barometr polityczny',
  docTitle: 'Barometr polityczny: polityka zdrowotna partii',
  /** <title> — docTitle z nazwą serwisu ma 66 znaków (audyt SEO: > 60) */
  seoTitle: 'Barometr: polityka zdrowotna partii',
  lead: 'Co partie proponują w ochronie zdrowia — według tych samych pytań dla każdej z nich i ze źródłem przy każdej tezie. Zaczynamy od zaproszenia: każda partia może przedstawić nam swój program.',
  description: 'Polityka zdrowotna partii według tych samych pytań i ze źródłami. Zaproszenie dla partii do przesłania programu w ochronie zdrowia.',
  updated: new Date('2026-11-13'),
  /** true = szkic: noindex (także podstron partii). Opublikowane 17.10.2026; wzór opisu zostaje noindex zawsze. */
  draft: false,
};

/**
 * Historia zmian strony barometru (blok „Historia zmian” na końcu strony, od najnowszego): zmiany w zasadach
 * i układzie, nie każda poprawka. Zapis wpisu: lib/inline (**b**, [a](href)). Nowy wpis = też `barometrPage.updated`.
 */
export const barometrChangelog: { date: Date; text: string }[] = [
  {
    date: new Date('2026-11-13'),
    text: 'Polska 2050 odpowiedziała 12.11.2026, ale odpowiedź przekracza dopuszczalny limit znaków, więc nie mogliśmy jej opublikować. 13.11.2026 wysłaliśmy partii prośbę o skrócenie.',
  },
  {
    date: new Date('2026-11-13'),
    text: 'Pierwsza wypowiedź w sekcji [„Politycy”](#politycy): [Rafał Komarewicz](/barometr-polityczny/politycy/komarewicz/), poseł klubu Centrum — pod własnym nazwiskiem, w nadesłanym brzmieniu.',
  },
  {
    date: new Date('2026-11-06'),
    text: 'Odpowiedź partii [Razem](/barometr-polityczny/razem/) — stanowisko partii w nadesłanym brzmieniu.',
  },
  {
    date: new Date('2026-11-04'),
    text: 'Porównanie dwóch partii: zaznacz „Porównaj” przy dwóch kartach w sekcji [Partie](#partie) albo wybierz partię na podstronie innej — odpowiedzi stoją obok siebie, obszar po obszarze. Partia bez odpowiedzi też ma kolumnę, w której piszemy to wprost.',
  },
  {
    date: new Date('2026-11-04'),
    text: 'Odpowiedź [Lewicy](/barometr-polityczny/lewica/) — stanowisko partii w nadesłanym brzmieniu.',
  },
  {
    date: new Date('2026-11-03'),
    text: 'Pierwsza odpowiedź: [KORWiN](/barometr-polityczny/korwin/) — stanowisko partii w nadesłanym brzmieniu.',
  },
  {
    date: new Date('2026-10-30'),
    text: 'Termin odpowiedzi przedłużony dla wszystkich z 02.11.2026 do 12.11.2026. Po tej dacie przy partii, która nie odpowie, napiszemy „Bez odpowiedzi”. Więcej: [wpis w aktualnościach](/aktualnosci/barometr-termin-przedluzony/).',
  },
  {
    date: new Date('2026-10-26'),
    text: 'Nowa sekcja [„Politycy”](#politycy): posłowie, senatorowie i politycy partii z listy mogą wypowiedzieć się pod własnym nazwiskiem — na tych samych zasadach co partie. Wypowiedź podpisujemy jako zdanie tej osoby, nie stanowisko partii.',
  },
  // wcześniejsze wpisy odtworzone z historii zmian w repozytorium; pierwsza wersja razem z doprecyzowaniem zasad
  // z 18.10 jako jeden wpis, dopisanie KORWiN pominięte jako mało istotne (decyzja redakcji 26.10.2026)
  {
    date: new Date('2026-10-18'),
    text: 'Pytania wysłane do wszystkich 11 klubów i kół Sejmu oraz do Naczelnej Izby Lekarskiej — dzień przed zapowiedzianą datą. Termin odpowiedzi bez zmian: 02.11.2026. Więcej: [wpis w aktualnościach](/aktualnosci/pytania-barometru-wyslane/).',
  },
  {
    date: new Date('2026-10-17'),
    text: 'Pierwsza wersja barometru: 11 klubów i kół Sejmu X kadencji oraz Naczelna Izba Lekarska (samorząd zawodowy, nie partia), sześć obszarów pytań — kadry w trzech częściach: lekarze, pielęgniarki, inne zawody medyczne — z pytaniami pomocniczymi i [wzór opisu partii](/barometr-polityczny/wzor/). Zasady: do 1\u00a0500 znaków na każdy obszar (w kadrach — na każdą część); koszt, źródło pieniędzy i termin — jeśli propozycja tego dotyczy; obszar pominięty przez partię oznaczamy wprost. Na odpowiedź każdy ma dwa tygodnie od wysłania pytań.',
  },
];

/** Programy partii przyjmujemy na ogólny adres serwisu (decyzja redakcji 17.10.2026); temat wiadomości je wyróżnia. */
export const barometrContact = {
  email: contact.email,
  subject: 'Barometr polityczny — program partii',
};

/**
 * Wysyłka pytań: jednego dnia do wszystkich na liście (decyzje redakcji 17.10.2026). Po wysłaniu wpisać
 * `status: { stage: 'wyslane', sent }` przy partiach; po terminie — `brak` u tych, które nie odpowiedziały
 * (statusy nie zmieniają się same: strona jest statyczna).
 */
export const barometrSchedule = {
  // pytania poszły w niedzielę 18.10, dzień przed zapowiedzią — do wszystkich naraz
  sendOn: new Date('2026-10-18'),
  // pierwotnie 2.11.2026; przedłużony dla wszystkich (decyzja redakcji 30.10.2026)
  deadline: new Date('2026-11-12'),
};
/** ostatni dzień na odpowiedź */
export const answerDeadline = barometrSchedule.deadline;
/** status po wysyłce pytań — ten sam dzień u wszystkich */
const SENT: BarometrStatus = { stage: 'wyslane', sent: barometrSchedule.sendOn };

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
    text: `Na odpowiedź każda partia ma czas do ${formatDate(answerDeadline)}. Potem przy karcie partii, która nie odpowiedziała, piszemy „Bez odpowiedzi” i datę wysłania pytań — bez opisu za partię. Spóźnioną odpowiedź dodamy, gdy tylko przyjdzie. Pominięty obszar też oznaczamy wprost: „Partia nie odniosła się do tego obszaru”.`,
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
  /** true = partia bez klubu i koła w Sejmie — karta z etykietą „Poza Sejmem”, za partiami w Sejmie */
  outsideSejm?: boolean;
  /** objaśnienie w dymku „?” przy etykiecie („Nie partia”, „Poza Sejmem”): dlaczego jest na liście, ze źródłem */
  about?: { heading: string; text: string; source: { label: string; href: string } };
  /** etap kontaktu; brak = pytań jeszcze nie wysłano */
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

/** Stan kontaktu z Razem — ten sam na karcie i na podstronie. */
const RAZEM_STATUS: Extract<BarometrStatus, { stage: 'odpowiedz' }> = { stage: 'odpowiedz', sent: barometrSchedule.sendOn, answered: new Date('2026-11-06') };

/** Stan kontaktu z Lewicą — ten sam na karcie i na podstronie. */
const LEWICA_STATUS: Extract<BarometrStatus, { stage: 'odpowiedz' }> = { stage: 'odpowiedz', sent: barometrSchedule.sendOn, answered: new Date('2026-11-03') };

/** Partie z klubem albo kołem w Sejmie — na stronie alfabetycznie (zasada „te same pytania dla wszystkich”). */
export const barometrParties: BarometrParty[] = (
  [
    { id: 'centrum', name: 'Centrum', club: 'Klub Parlamentarny Centrum', logo: centrumLogo, status: SENT },
    { id: 'demokracja-bezposrednia', name: 'Demokracja Bezpośrednia', club: 'Koło Poselskie Demokracja Bezpośrednia', logo: demokracjaLogo, status: SENT },
    { id: 'koalicja-obywatelska', name: 'Koalicja Obywatelska', club: 'Klub Parlamentarny Koalicja Obywatelska – Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni', logo: koLogo, status: SENT },
    { id: 'konfederacja', name: 'Konfederacja Wolność i Niepodległość', club: 'Klub Poselski Konfederacja', logo: konfederacjaLogo, status: SENT },
    { id: 'konfederacja-korony-polskiej', name: 'Konfederacja Korony Polskiej', club: 'Koło Poselskie Konfederacja Korony Polskiej', logo: kkpLogo, status: SENT },
    { id: 'lewica', name: 'Lewica', club: 'Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PPS, Unia Pracy)', logo: lewicaLogo, status: LEWICA_STATUS },
    { id: 'polska-2050', name: 'Polska 2050', club: 'Klub Parlamentarny Polska 2050', logo: polska2050Logo, status: SENT },
    { id: 'psl', name: 'Polskie Stronnictwo Ludowe', club: 'Klub Parlamentarny Polskie Stronnictwo Ludowe – Trzecia Droga', logo: pslLogo, status: SENT },
    { id: 'pis', name: 'Prawo i Sprawiedliwość', club: 'Klub Parlamentarny Prawo i Sprawiedliwość', logo: pisLogo, status: SENT },
    { id: 'razem', name: 'Razem', club: 'Koło Poselskie Razem', logo: razemLogo, status: RAZEM_STATUS },
    { id: 'rozwoj-plus', name: 'Rozwój Plus', club: 'Klub Parlamentarny Rozwój Plus', logo: rozwojLogo, status: SENT },
  ] satisfies BarometrParty[]
).sort((a, b) => a.name.localeCompare(b.name, 'pl'));

/** Stan kontaktu z KORWiN — ten sam na karcie i na podstronie. Pytania poszły dzień po klubach i kołach (decyzja redakcji 19.10.2026); termin ten sam. */
const KORWIN_STATUS: Extract<BarometrStatus, { stage: 'odpowiedz' }> = { stage: 'odpowiedz', sent: new Date('2026-10-19'), answered: new Date('2026-11-02') };

/**
 * Spoza wykazu klubów i kół — za partiami w Sejmie: partie bez klubu i koła w Sejmie (etykieta „Poza Sejmem”)
 * i uczestnicy sporu o politykę zdrowotną, którzy nie są partiami (etykieta „Nie partia”).
 */
export const barometrOthers: BarometrParty[] = [
  {
    id: 'korwin',
    // nazwa tak, jak partia zapisuje ją na swojej stronie (korwin.com.pl: „Partia KORWiN”)
    name: 'KORWiN',
    club: 'Partia bez klubu i koła w Sejmie X kadencji',
    logo: korwinLogo,
    outsideSejm: true,
    about: {
      heading: 'Dlaczego KORWiN jest na liście',
      text: 'KORWiN nie ma w Sejmie X kadencji klubu ani koła, dlatego nie ma jej w wykazie klubów. Dopisaliśmy ją do barometru jako partię spoza Sejmu: dostaje te same pytania, a jej stanowisko publikujemy na tych samych zasadach.',
      source: { label: 'Sejm RP, „Kluby i koła” (X kadencja)', href: 'https://www.sejm.gov.pl/Sejm10.nsf/kluby.xsp' },
    },
    status: KORWIN_STATUS,
  },
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

/**
 * Odpowiedź KORWiN (plik od partii, 02.11.2026). Tekst słowo w słowo, w podziale na akapity jak w nadesłanym pliku —
 * nie poprawiać ani nie skracać; zmiana tylko na prośbę partii, z datą w `changes`. Partia nie wskazała dokumentów.
 * „Czy podano”: w odpowiedzi nie ma kwot ani dat, więc koszt i termin = nie podano; źródło pieniędzy wprost tylko
 * w finansowaniu i dostępie: częściowa odpłatność, dopłaty (decyzja redakcji 3.11.2026).
 */
const barometrKorwin: BarometrProfile = {
  id: 'korwin',
  href: profileHref('korwin'),
  name: 'KORWiN',
  club: 'bez klubu i koła w X kadencji',
  logo: korwinLogo,
  status: KORWIN_STATUS,
  updated: new Date('2026-11-03'),
  areas: [
    {
      area: 'finansowanie',
      answer: [
        'Celem KORWiN jest odejście od państwowego monopolu na finansowanie leczenia i świadczenie usług. Docelowo państwo powinno wycofać się z bezpośredniego prowadzenia i finansowania usług takich jak ochrona zdrowia czy edukacja. Obywatel powinien sam decydować, na co przeznacza swoje pieniądze, z jakich usług korzysta i jak zabezpiecza się na przyszłość. Ceny, jakość i dostępność powinny kształtować konkurencja oraz swoboda wyboru, a rolą państwa powinno być egzekwowanie prawa, ochrona przed oszustwami i zapewnienie uczciwych reguł gry.',
        'Nie proponujemy chaotycznego zamknięcia NFZ z dnia na dzień. Potrzebny jest skoordynowany proces zmian w ochronie zdrowia, ubezpieczeniach i świadczeniach społecznych, uwzględniający sytuację emerytów i osób przewlekle chorych, których rynek może nie ubezpieczyć na dotychczasowych zasadach. W okresie przejściowym warto wykorzystać wybrane rozwiązania zagraniczne, m.in. elementy modelu singapurskiego, ale celem KORWiN pozostaje dobrowolność i ograniczenie przymusu państwowego.',
        'Już teraz należy ograniczać zbędne wydatki, wprowadzać częściową odpłatność za wybrane podstawowe wizyty i procedury oraz ściśle kontrolować publiczne pieniądze. Składki przymusowe należy stopniowo obniżać i likwidować, pozostawiając środki obywatelom.',
      ],
      documents: [],
      checks: { cost: false, funding: true, deadline: false },
    },
    {
      area: 'kadry',
      part: 'lekarze',
      answer: [
        'Należy znieść administracyjne limity miejsc na studiach medycznych, otworzyć kształcenie na konkurencję i uprościć uznawanie kwalifikacji lekarzy zagranicznych, weryfikując ich rzeczywiste kompetencje. Nie popieramy przymusu odpracowywania rezydentury w Polsce ani w systemie publicznym. Nie należy administracyjnie ograniczać łącznego czasu pracy lekarzy. Dopóki istnieją publiczne kontrakty, trzeba jednak kontrolować rzeczywiste godziny pracy, wykonane świadczenia i wypłaty.',
        'Lekarz to zawód wymagający wiedzy i odpowiedzialności, ale nie świętość ani powód do tworzenia uprzywilejowanej kasty. W normalnych warunkach rynkowych wynagrodzenia wynikają z popytu, podaży, kwalifikacji i odpowiedzialności. Nie należy obniżać ich ustawą — trzeba urynkowić usługi medyczne.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      answer: [
        'Należy znieść limity kształcenia pielęgniarek i poszerzać ich samodzielne uprawnienia stosownie do kwalifikacji. Powinny móc udzielać porad, wykonywać procedury i wydawać zalecenia dotyczące stosowania leków. Pacjent nie powinien płacić za wizytę u lekarza wyłącznie po to, by formalnie przedłużyć leczenie, jeśli nie ma medycznych wskazań do ponownego badania.',
        'O podziale zadań powinny decydować kompetencje, odpowiedzialność i umowy, a nie monopole zawodowe. Państwo ma chronić bezpieczeństwo pacjentów i ścigać oszustwa, a nie szczegółowo organizować rynek pracy medyków.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'inne-zawody',
      answer: [
        'Farmaceuci, ratownicy medyczni, fizjoterapeuci i diagności powinni móc przejmować zadania, do których mają odpowiednie kompetencje, w tym udzielać porad i wydawać zalecenia dotyczące leków. Należy zlikwidować zbędne bariery wejścia do zawodów i ograniczyć monopole korporacyjne. Pacjent ma wybierać usługodawcę według ceny, jakości i własnej oceny potrzeb.',
        'Zakres uprawnień powinien wynikać z kwalifikacji i odpowiedzialności za wykonaną usługę. Nie ma powodu, by lekarz musiał zatwierdzać każdą czynność innego specjalisty. Konkurencja zwiększy dostępność świadczeń, a likwidacja zbędnych procedur pozwoli lepiej wykorzystać personel.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'wynagrodzenia',
      answer: [
        'Nie popieramy ustawowego ograniczania wynagrodzeń lekarzy ani narzucania jednej formy zatrudnienia. Płace powinny wynikać z umów i warunków rynkowych. Obecna sytuacja — wielomilionowe wypłaty z publicznych pieniędzy, rozliczanie nieobecności czy płacenie za niewykonane świadczenia — wymaga zdecydowanej reakcji. Problem dotyczy nie tylko medyków, lecz także korupcji w NFZ, politycznych zarządów szpitali i osób rozdzielających publiczne środki.',
        'Dopóki istnieją publiczne wydatki, jawne muszą być wszystkie ich przeznaczenia: wynagrodzenia, kontrakty, zakupy, refundacje leków, świadczenia i koszty administracyjne. Decyzje refundacyjne muszą opierać się na jasnych kryteriach, a osoby odpowiedzialne za niegospodarność, konflikt interesów lub naruszenie prawa powinny ponosić odpowiedzialność. Konieczne są niezależne audyty i kontrola wykonania umów.',
        'Kradniesz — idziesz siedzieć. Udowodnione wyłudzenia, korupcja, fałszowanie dokumentacji i przywłaszczanie pieniędzy muszą oznaczać realną karę, zwrot środków i odebranie korzyści pochodzących z przestępstwa. Nie wystarczą limity płac ani kolejne formularze: potrzebne są jawność, kontrola i nieuchronne egzekwowanie prawa.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'dostep',
      answer: [
        'Kolejki wynikają m.in. z reglamentacji świadczeń, administracyjnego ustalania cen i ograniczania podaży. Docelowo pacjent powinien sam wybierać usługę, placówkę, ubezpieczenie i sposób zapłaty. Zamiast obiecywać ustawowe terminy, których państwo nie potrafi zagwarantować, trzeba uwolnić konkurencję, dopuścić przejrzyste dopłaty i publikować ceny.',
        'Wiele zmian można jednak wprowadzić od razu, bez likwidowania NFZ. Należy ograniczyć zbędne skierowania i wizyty oraz umożliwić kontynuację leczenia bez kolejnej konsultacji, gdy nie ma ku niej wskazań medycznych. Należy znieść obowiązek uzyskiwania recept na leki. Lekarz ma leczyć i udzielać zaleceń, a nie wydawać pozwolenia na zakup preparatów. Decyzja o zakupie i stosowaniu leków należy do pacjenta. Trzeba uprościć zasady refundacji, jasno określić odpowiedzialność za decyzje i kontrolować wydatkowanie środków.',
        'Częściowa odpłatność za wybrane podstawowe wizyty może ograniczyć wizyty niepotrzebne, przy zachowaniu rozwiązań dla osób rzeczywiście potrzebujących pomocy. Docelowo należy zlikwidować państwowy system refundacji leków i pozostawić pacjentom oraz specjalistom swobodę wyboru terapii.',
      ],
      documents: [],
      checks: { cost: false, funding: true, deadline: false },
    },
    {
      area: 'szpitale',
      answer: [
        'Szpitale powinny docelowo działać jako podmioty prywatne, na własny rachunek i odpowiedzialność. Majątek publiczny należy stopniowo sprzedawać lub przekształcać, a strat źle zarządzanych placówek nie wolno automatycznie pokrywać z podatków. Zadłużenie powinno prowadzić do restrukturyzacji, zmiany właściciela albo upadłości zgodnie z prawem.',
        'Już teraz potrzebne są audyty finansów, kontraktów, zakupów, wynagrodzeń i wykonanych świadczeń. Trzeba ustalić, gdzie pieniądze są marnowane i kto odpowiada za decyzje. Dotyczy to dyrektorów, politycznych nominatów, urzędników i personelu medycznego. Podejrzenia należy zbadać, a udowodnione kradzieże, korupcję i wyłudzenia surowo karać.',
        'Państwo ma pilnować uczciwości i bezpieczeństwa, nie zarządzać szpitalami ani bez końca finansować ich nieefektywności. Konkurencja i odpowiedzialność właścicielska powinny zastąpić polityczne rozdawnictwo.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'pacjent',
      answer: [
        'Pacjent powinien sam decydować o leczeniu, wyborze lekarza i ubezpieczenia. Państwo nie powinno narzucać usług, badań ani procedur, jeśli nie uzasadnia ich konkretne zagrożenie bezpieczeństwa lub ochrona praw innych osób.',
        'Już teraz trzeba zlikwidować zbędną biurokrację: administracyjny przymus medycyny pracy tam, gdzie nie uzasadnia go konkretne ryzyko, rutynowe zaświadczenia do pracy, na prawo jazdy i do innych celów bez rzeczywistych przesłanek medycznych oraz obowiązek wykonywania czynności wyłącznie dla spełnienia formalności. Należy uprościć skierowania i kontynuację leczenia. Pacjent nie powinien odbywać wizyty tylko po to, by uzyskać podpis, pieczątkę lub formalną zgodę na zakup leku. Lekarze powinni udzielać zaleceń, a decyzja o zakupie i przyjmowaniu leków należy do pacjenta. Nie oznacza to rezygnacji z badań chroniących życie i zdrowie innych.',
        'O błędach medycznych powinny orzekać niezależne sądy powszechne, a nie wyłącznie sądy korporacyjne. Pacjent musi móc dochodzić odszkodowania, a jakość leczenia powinna być przejrzysta. Za szkody związane z użyciem AI odpowiadają podmioty stosownie do swojej roli i prawa.',
        'Medycyna nie powinna być otoczona państwowym kultem. Żywność jest równie niezbędna do życia, a nikt nie tworzy narodowego funduszu jedzenia. Ta sama zasada dotyczy edukacji i innych usług. Państwo powinno chronić wolność wyboru, uczciwą konkurencję i bezpieczeństwo, rozbijać monopole oraz karać oszustów, a nie zarządzać całym życiem obywateli.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
  ],
  changes: [{ date: new Date('2026-11-03'), text: 'Opis opublikowany: odpowiedź partii w nadesłanym brzmieniu.' }],
};

/**
 * Odpowiedź Lewicy (plik od partii, 03.11.2026). Tekst słowo w słowo, w podziale na akapity jak w nadesłanym pliku —
 * nie poprawiać ani nie skracać; zmiana tylko na prośbę partii, z datą w `changes`. Pominięte tylko dopiski partii
 * z liczbą znaków na końcu każdej odpowiedzi i podwójna spacja. Partia nie wskazała dokumentów.
 * „Czy podano”: wprost tylko w finansowaniu — koszt (9% PKB), źródło (podatek zdrowotny, opłata od żywności
 * wysokoprzetworzonej, akcyza) i termin (4 lata); w pozostałych odpowiedziach nie ma kwot, źródeł ani dat
 * (decyzja redakcji 4.11.2026).
 */
const barometrLewica: BarometrProfile = {
  id: 'lewica',
  href: profileHref('lewica'),
  name: 'Lewica',
  club: 'Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PPS, Unia Pracy)',
  logo: lewicaLogo,
  status: LEWICA_STATUS,
  updated: new Date('2026-11-04'),
  areas: [
    {
      area: 'finansowanie',
      answer: [
        'Pogłębiająca się luka finansowa w budżecie NFZ dowodzi, że system oparty na składce zdrowotnej nie sprawdza się. Liczne wyjątki, ulgi i przywileje czynią system niesprawiedliwym i niedostatecznie finansowanym. Nie zgadzamy się na prywatyzację systemu ochrony zdrowia. Publiczne placówki, publiczne finansowanie są gwarantem zapewnienia sprawiedliwego dostępu do opieki medycznej.',
        'Lewica postuluje likwidację składki zdrowotnej i zastąpienie jej podatkiem zdrowotnym. Jednolita stawka dla wszystkich podatników z kwotą wolną w wysokości 30 tys zł - dla większości podatników nic się nie zmieni. Do systemu ochrony zdrowia więcej zaczną dokładać najbogatsi płatnicy PIT oraz - to nowość - najwięksi płatnicy CIT. Duże firmy, międzynarodowe korporacje korzystające z pracy polskich pracowników dofinansują system ochrony zdrowia. Dodatkowe źródła finansowania to opłata od żywności wysokoprzetworzonej, wzorowana na opłacie cukrowej, oraz jednolita akcyza na alkohol i tytoń. Fundusze z tych danin będą przeznaczane na profilaktykę, by osiągnąć średnią unijną wydatków na mieszkańca w tej kategorii. W Narodowym Programie Zdrowia oszczędności generowane przez 1 zł wydaną na programy profilaktyczne szczuje się na 27 zł oszczędności w wydatkach całego systemu ochrony zdrowia.',
        'Sprzeciwiamy się ulgom dotującym prywatną opiekę zdrowotną z budżetu, bo to droga do prywatyzacji systemu.',
        'Celem zmian jest osiągnięcie poziomu finansowania ochrony zdrowia w wysokości 9% PKB w perspektywie 4 lat.',
      ],
      documents: [],
      checks: { cost: true, funding: true, deadline: true },
    },
    {
      area: 'kadry',
      part: 'lekarze',
      answer: [
        'Systematycznie rośnie ilość miejsc na kierunkach lekarskich. Kluczowe jest, aby liczba osób kończących studia i podejmujących pracę w publicznym systemie była zbliżona do liczby osób je rozpoczynających. Wyzwaniem pozostaje luka pokoleniowa. Struktura wiekowa kadry przypomina klepsydrę - wielu lekarzy w wieku około emerytalnym, najmniej w średnim wieku, oraz znaczna w okresie rezydentury lub tuż po niej. Konieczne jest utrzymanie najstarszych wiekiem lekarzy w systemie do czasu aż uda się spłaszczyć strukturę wiekową.',
        'Wyzwaniem jest zapewnienie kadr dla mniejszych szpitali powiatowych. System rynkowy spowodował powstanie gigantycznych kominów płacowych i drenaż budżetów mniejszych placówek. Wprowadzenie górnych limitów zarobków, bez rozróżnienia geograficznego nie polepszy sytuacji szpitali w małych i średnich miastach.',
        'Wypoczęty lekarz to dobry lekarz i dobrze zaopiekowany pacjent, praca ponad siły nie jest rozwiązaniem problemów kadrowych i stanowi zagrożenie dla pacjentów. Wprowadzamy ewidencje czasu pracy, ale docelowo powinna być oparta o system informatyczny, bez papierowych oświadczeń i biurokracji, która generuje koszty i zabiera czas lekarzom i kadrze pomocniczej.',
        'Polska jest atrakcyjnym krajem dla lekarzy spoza UE, musimy być gotowi na sprawną weryfikację umiejętności zdobytych na uczelniach pozaeuropejskich. Trzeba wypracować sprawny system egzaminacji i nadzoru, który z jednej strony nie będzie odstraszać, z drugiej będzie dawał gwarancję należytej opieki nad pacjentami.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      answer: [
        'Pielęgniarki i położne są filarem systemu, a ich praca musi być godnie wynagradzana. Sytuacja kadrowa w tej grupie zawodowej jest najbardziej dramatyczna. 40% aktywnych zawodowo pielęgniarek jest w wieku 50-59 lat, znaczna część osób kończących pielęgniarstwo nie rozpoczyna pracy z pacjentem w publicznym systemie ochrony zdrowia. Obecnie to już nie kwestie finansowe a systemowe zniechęcają młodych do pracy w publicznych szpitalach. Konieczne jest odciążenie personelu pielęgniarskiego. W tym celu do standardu powinna wejść minimalna obsada opiekunów medycznych. Należy kontynuować poszerzanie uprawnień pielęgniarek oraz wprowadzić Zaawansowaną Praktykę Pielęgniarską.',
        'Dla środowiska pielęgniarskiego kluczowe jest ostateczne uznanie kwalifikacji posiadanych nad wymaganymi przy zaliczeniu do grupy płacowej, co przerwie spiralę procesów wytaczanych podmiotom medycznym przez personel pielęgniarski wynagradzania poniżej swoich umiejętności.',
        'Nie możemy zapomnieć o położnych. Spadająca dzietność rodzi zagrożenie dla miejsc pracy osób wykonujących ten zawód medyczny. Położna powinna powinna być przewodniczką w zakresie kobiecości przez cały okres życia kobiety. Rozszerzenie opieki położnych na okres menopauzalny, dostęp do kursów i szkoleń zwiększających możliwe dalsze ścieżki rozwoju zawodowego oraz odpowiednie wynagrodzenie za tym płynące to odpowiedź na wyzwania związane z demografia całego społeczeństwa.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'inne-zawody',
      answer: [
        'Ratownicy medyczni, fizjoterapeuci, diagności laboratoryjni i inni pracownicy ochrony zdrowia wraz z lekarzami i pielęgniarkami tworzą jeden zespół, a ich praca zasługuje na godne wynagrodzenie. Popieramy rozwój kształcenia w tych zawodach i dostosowanie liczby miejsc na studiach do potrzeb systemu.',
        'Zwiększanie uprawnień innych zawodów medycznych leży w interesie pacjentów. Poziom wykształcenie np. farmaceutów umożliwia im przejęcie części dotychczas zarezerwowanych dla innych zawodów uprawnień. Wpłynie to pozytywnie na dostępność świadczeń, długość kolejek oraz koszty funkcjonowania systemu ochrony zdrowia. Poszerzenia uprawnień musi odbywać się w atmosferze dialogu między środowiskami zawodowymi, lecz bez ulegania nadmiernym żądaniom i dotychczasowym przyzwyczajeniom.',
        'Sprawnie działający system opieki medycznej musi przewidywać stałe miejsce dla opiekunów medycznych. Ich wykształcenie i posiadane umiejętności pozwolą znacząco odciążyć personel pielęgniarski i usprawnić opiekę nad chorymi.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'wynagrodzenia',
      answer: [
        'Jawność wynagrodzeń jest konieczna, dla zapewnienia przejrzystości publicznego systemu ochrony zdrowia. Domyślną i główną formą zatrudnienia powinien być etat, dający ochronę Kodeksu pracy oraz kończący z patologiczną sytuacją, w której pacjent płaci wyższe podatki niż leczący go lekarz.',
        'Powiązanie górnych limitów zarobków w ochronie zdrowia z najniższą płacą to mechanizm prosty, sprawny i sprawiedliwy. Docelowo w ten sposób powinny być waloryzowane kwoty minimalne ustalane dla poszczególnych grup zawodowych w systemie ochrony zdrowia. Zmiany w tym zakresie muszą być poprzedzone realnym dialogiem ze stroną związkową.',
        'Należy obserwować skutki wprowadzonych limitów zarobków i elastycznie reagować, by poziomem płac zapewniać równy dostęp do ochrony zdrowia na terenie całego kraju oraz zmniejszyć deficyty kadrowe w kluczowych specjalizacjach.',
        'Potrzebne jest wyjście naprzeciw oczekiwaniom poszczególnych grup zawodowych, w szczególności pielęgniarek i położnych, dla których konieczne jest ostateczne uregulowanie kwestii umiejętności posiadanych i wymaganych na danym stanowisku.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'dostep',
      answer: [
        'Celem jest znaczące skrócenie kolejek do lekarzy specjalistów i na planowe zabiegi medyczne. E-rejestracja i e-kolejka już ułatwiają zapisanie się i odwołanie wizyty, a to początek cyfryzacji w ochronie zdrowia. Wykorzystanie nowych technologii w komunikacji lekarz pacjent, w diagnostyce i ocenie ryzyk zdrowotnych może w perspektywie najbliższych kilku lat znacząco usprawnić przebieg procesu leczenia. Z punktu widzenia dostępu do specjalistów konieczne jest, by pacjent już podczas pierwszych dwóch wizyt otrzymywał właściwą diagnozę i dokładny plan leczenia i opieki, bez konieczności ponownego przeprowadzania badań, poza wskazaniami czysto kontrolnymi oraz wizyt w gabinecie poza sytuacjami nagłej zmiany stanu zdrowia.',
        'Systematycznie rosną wydatki z tytułu refundacji leków. Żaden system nie będzie w stanie opłacić wszystkich terapii i najdroższych leków, dlatego w tam gdzie to możliwe bez szkody dla pacjenta pierwszeństwo w wyborze terapii powinny mieć leki generyczne. W tym aspekcie należy również wspomnieć o zapewnieniu bezpieczeństwa lekowego i konieczności rozwoju produkcji podstawowych substancji czynnych na terenie Polski.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'szpitale',
      answer: [
        'Szpitale powinny być przede wszystkim publiczne, prowadzone przez państwo i samorząd. Jednak rozdrobnienie struktury właścicielskiej generuje liczne problemy. Spadająca liczba ludności w połączeniu z migracją do większych miast zwiększa koszty funkcjonowania szpitali w mniejszych miejscowościach. Polska utrzymuje wyraźnie wyższą od średniej UE liczbę łóżek szpitalnych w przeliczeniu na 100 tys mieszkańców. Konieczna jest zmiana struktury właścicielskiej szpitali. Dotychczasowe szpitale miejskie i powiatowe, powinny zostać zintegrowane ze szpitalami wojewódzkimi, tworząc spójną sieć dającą gwarancję redukcji kosztów operacyjnych, zapewniających dostęp do wykwalifikowanej i doświadczonej kadry oraz nowoczesnej aparatury diagnostycznej. Z poziomu obejmującego kilka powiatów dużo łatwiej jest zarządzać strukturą łóżek szpitalnych na poszczególnych oddziałach, bez ryzyka pozbawiania całych regionów dostępu np. do porodówek.',
        'Postępujące zadłużenie szpitali jest zagrożeniem dla stabilności systemu. Integracja z jednej strony pozwoli na zmniejszenie części kosztów, ale to nie wystarczy. Potrzebne jest częstsze aktualizowanie wycen procedur medycznych. W tym celu należy wzmocnić kadrowo i finansowo AOTMiT. Dodatkowo dla najbardziej zadłużonych placówek, które nawet w wyniku integracji z innymi podmiotami nie są w stanie samodzielnie spłacić zobowiązań potrzebny jest system częściowego oddłużenia, po spełnieniu odpowiednich kryteriów.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'pacjent',
      answer: [
        'Popieramy przejrzystość i dostęp do danych, pacjent ma prawo do rzetelnej i przystępnej informacji o jakości leczenia i skutecznego dochodzenia roszczeń w przypadku błędów medycznych. Ma również prawo do ochrony przed dezinformacją medyczną.',
        'Organizacje pacjenckie są równym partnerem w dyskusji o kształcie systemu ochrony zdrowia. Ich głos musi być słyszany i brany pod uwagę przy planowaniu zmian.',
        'Sztuczna inteligencja już jest wykorzystywana we wsparciu diagnozowania pacjentów, trwają liczne i intensywne prace wspierane przez rząd nad polskimi rozwiązaniami w zakresie AI w medycynie. Kluczowe jest aby nowe technologie były uzupełnieniem a nie zastępstwem dla personelu medycznego, aby dane medyczne były bezpieczne. Ostateczna decyzja o sposobie i rodzaju leczenia musi pozostać w ręku lekarza, na tym polu żaden algorytm nie może zastąpić człowieka.',
        'Wyzwaniem jest wykorzystanie AI w samoleczeniu, w dezinformacji medycznej. Po stronie publicznego systemu ochrony zdrowia jest budowa zaufania pacjenta do lekarza i jego diagnozy.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
  ],
  changes: [{ date: new Date('2026-11-04'), text: 'Opis opublikowany: odpowiedź partii w nadesłanym brzmieniu.' }],
};

/**
 * Odpowiedź Razem (plik od partii, 06.11.2026). Tekst słowo w słowo, w podziale na akapity jak w nadesłanym pliku —
 * nie poprawiać ani nie skracać; zmiana tylko na prośbę partii, z datą w `changes`. Pominięte tylko puste akapity
 * i podwójne spacje. Partia nie wskazała dokumentów.
 * „Czy podano”: w finansowaniu koszt (8% PKB, brakuje 78 mld zł) i źródło (progresywna danina, podatek zdrowotny
 * dla podatników CIT, podatek cyfrowy i inne); w dostępie koszt (10 mld zł na „receptę za 5 zł”) i źródło (wpływy
 * z rozwiązań podatkowych do NFZ); terminu nie podano nigdzie, w pozostałych odpowiedziach nie ma kwot ani źródeł
 * (decyzja redakcji 6.11.2026).
 */
const barometrRazem: BarometrProfile = {
  id: 'razem',
  href: profileHref('razem'),
  name: 'Razem',
  club: 'Koło Poselskie Razem',
  logo: razemLogo,
  status: RAZEM_STATUS,
  updated: new Date('2026-11-06'),
  areas: [
    {
      area: 'finansowanie',
      answer: [
        'Leczenie powinno być finansowane ze środków publicznych. Prywatne ubezpieczenia i dopłaty pacjentów nie uzupełniają systemu, tylko pokazują, jak bardzo jest niedofinansowany. Badania wskazują, że najbardziej efektywne są usługi, gdzie pieniędzmi zarządza państwo.',
        'Publiczna ochrona zdrowia potrzebuje co najmniej 8% PKB, liczonego od PKB z tego samego roku. W budżecie na 2027 do tego poziomu brakuje 78 mld zł. Partia Razem wie, skąd je wziąć. Wprowadzimy projekt jednolitej, progresywnej daniny, który pozwoli nam sfinansować wyższe nakłady na ochronę zdrowia oraz podatek zdrowotny dla podatników CIT i wielkich przedsiębiorstw.',
        'Sposób pobierania środków na ochronę zdrowia trzeba zmienić. Nie przez podwyżkę składki dla zatrudnionych na etatach – bo już dziś płacą najwięcej. Partia Razem chce, żeby każdy dochód wiązał się z odprowadzaniem pieniędzy na ochronę zdrowia – na tych samych zasadach i proporcjonalnie do jego wysokości. Zniesiemy przywileje podatkowe i składkowe, które dziś pozwalają dobrze zarabiającym płacić mniej – ryczałt, podatek liniowy, specjalne stawki dla duchownych czy KRUS dla przedsiębiorców rolnych.',
        'Te zmiany zasilą system z wielu stron. Wpływy z jednolitej daniny trafią do NFZ, a dodatkowe środki pochodzić będą również z nowe wpływów do budżetu państwa z podatku zdrowotnego dla podatników CIT i wielkich przedsiębiorstw, podatku cyfrowego, opodatkowania wielkich fortun i spekulacji. Najwyższy czas, żeby najbogatsi proporcjonalnie dołożyli się do społeczeństwa.',
      ],
      documents: [],
      checks: { cost: true, funding: true, deadline: false },
    },
    {
      area: 'kadry',
      part: 'lekarze',
      answer: [
        'Sukcesywnie będziemy zwiększać liczbę miejsc na studiach i specjalizacjach, dostosowując limity do realnych potrzeb, przy zachowaniu najwyższych standardów kształcenia. Wymaga to stworzenia nowych miejsc kształcenia, szczególnie poza dużymi ośrodkami, gdzie niedobór specjalistów jest duży. Uważamy, że przestarzały hierarchiczny system podziału pracy i zadań zawodów medycznych marnuje potencjał zarówno lekarzy jak i zawodów medycznych w ogóle, dlatego będziemy dążyć do przenoszenia zadań tak, by wykorzystać potencjał wszystkich zawodów medycznych i poszerzyć dostęp pacjentów do świadczeń. Czas lekarzy jako samotnych kowbojów się skończył – nowoczesna medycyna wymaga zgranego, dobrze zintegrowanego zespołu specjalistów z różnych zawodów medycznych o różnych umiejętnościach, wspólnie dbających o dobro pacjenta. Nie widzimy obecnie potrzeby zmiany zasad ułatwiających pracę dla lekarzy z zagranicy, uważamy, że zasoby powinny skoncentrować się synergii między lekarzem a pozostałymi zawodami medycznymi.',
        'Ewidencja czasu pracy lekarza musi być zbierana na bieżąco i zautomatyzowana z systemem P1. Wprowadzimy limity czasu pracy zarówno w publicznej jak i w prywatnej ochronie zdrowia ze względu na bezpieczeństwo pacjentów i jakość opieki. Nad przestrzeganiem limitów czuwać będą dofinansowane państwowe instytucje kontrolne. Docelowo zakażemy łączenia pracy w publicznej i prywatnej ochronie zdrowia.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      answer: [
        'Podobnie jak w przypadku lekarzy – należy zwiększyć również liczbę kształconych pielęgniarek. Polska znacząco odstaje pod względem średniej OECD w liczbie pielęgniarek na 1000 osób. Pielęgniarki i położne są kluczowym elementem systemu. Ich kompetencje, tak jak wielu innych zawodów medycznych, są w polskim systemie ochrony zdrowia marnowane. Partia Razem proponuje poszerzenie kompetencji i przeniesienie zadań na personel pielęgniarski i położniczy wszędzie tam, gdzie może to zmniejszyć popyt na pracę lekarzy – w przychodniach POZ i specjalistycznych, ginekologii, medycynie szkolnej czy opiece długoterminowej. Dodatkowe zadania będą uwzględniane w proponowanej przez Razem sektorowej siatce wynagrodzeń.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'kadry',
      part: 'inne-zawody',
      answer: [
        'Dokonamy przeglądu możliwych do wprowadzenia zmian w podziale zadań między zawodami medycznymi. W porozumieniu z przedstawicielami personelu ochrony zdrowia przygotujemy kompleksowy plan przenoszenia i poszerzenia kompetencji.',
        'Większa samodzielność zawodów medycznych to olbrzymi niewykorzystany potencjał. Tak samo jak pielęgniarki – farmaceuci, diagności laboratoryjni, ratownicy medyczni i fizjoterapeuci mogą zmniejszać popyt na drogą pracę lekarzy przez poszerzenie kompetencji i przenoszenie zadań np. w ramach opieki farmaceutycznej czy zlecania dodatkowych badań przez diagnostów laboratoryjnych. Takie rozwiązanie oszczędza też czas pacjentów i pieniądze NFZ kierowane na finansowanie wizyt lekarskich „po pieczątkę pod skierowaniem”. Będziemy dążyć do wprowadzenia ustawy o zawodzie dietetyka, by unormować zadania i kompetencje tego zawodu w systemie ochrony zdrowia.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'wynagrodzenia',
      answer: [
        'Wprowadzimy nową ustawę o wynagrodzeniach w ochronie zdrowia dla wszystkich zawodów medycznych oraz pomocniczych, obejmującą sektorową, obowiązującą w całym kraju siatkę płac z minimalnymi i maksymalnymi wynagrodzeniami uzależnioną od stażu, kwalifikacji oraz potrzeb zdrowotnych – w szczególności dotyczących terenów poza wielkimi miastami. Siatka płac negocjowana będzie z przedstawicielami związków zawodowych i izb.',
        'Skończymy ze „śmieciówkami” i kontraktami. Podstawą zatrudnienia w publicznej opiece zdrowotnej powinna być umowa o pracę. Kontrakty i praca na podstawie umów cywilnoprawnych to nie tylko narzędzie stosowane przez lekarzy w celu optymalizacji podatkowej, ale także mechanizm odbierania praw pracowniczych i stabilności zatrudnienia pielęgniarkom, ratownikom medycznym i personelowi pomocniczemu.',
        'Zapewnimy godne i regularnie waloryzowane pensje dla pielęgniarek, położnych, ratowników medycznych, fizjoterapeutów, farmaceutów i diagnostów laboratoryjnych oraz innych osób wykonujących zawody medyczne i działających w dziedzinach mających zastosowanie w ochronie zdrowia. Stawki będą waloryzowane w zależności od stażu pracy, specjalnych umiejętności oraz zapotrzebowania i lokalizacji wykonywania świadczeń. Podstawą będzie średnia krajowa, wyciągana ze sprawozdania GUS, co pół roku.',
        'Partia Razem opowiada się za obowiązkową jawnością wynagrodzeń w całej gospodarce, a więc także dla zawodów medycznych.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'dostep',
      answer: [
        'Dzięki poszerzeniu i przenoszeniu kompetencji i zadań między zawodami medycznymi zlikwidujemy „pętle kolejkowe” w ochronie zdrowia. Ograniczymy w ten sposób liczbę bezsensownych wizyt lekarskich „po pieczątkę”. Wykorzystamy możliwość zlecenia dodatkowych badań przez diagnostę laboratoryjnego czy wystawiania recept, skierowań przez pielęgniarki i fizjoterapeutów. Poszerzymy zadania farmaceutów.',
        'Zniesiemy limitowanie procedur medycznych – wprowadzimy ryczałtowe finansowanie na personel i bieżące utrzymanie placówek ochrony zdrowia, zgodne z lokalnymi potrzebami.',
        'W Polsce problemem jest bariera ekonomiczna przy wykupie leków – to jedna z przyczyn rosnących nierówności w zdrowiu ze względu na zasobność portfela. W aptekach wprowadzimy system „recepta za 5 zł” tam gdzie leki już dziś nie są bezpłatne. Priorytet w stosowaniu będą miały leki generyczne produkowane w całości w Polsce. Pozwoli to na lepsze wykorzystanie budżetu na leki oraz na rozwój krajowego przemysłu farmaceutycznego – istotny dla bezpieczeństwa państwa i gospodarki. Szacunkowy koszt takiego rozwiązania to 10 mld zł – część dodatkowych środków skierowanych dzięki rozwiązaniom podatkowym do NFZ.',
        'Szczególnym wyzwaniem jest dostęp do ochrony zdrowia psychicznego. Co najmniej 6% budżetu NFZ przeznaczymy na zakres zdrowia psychicznego i rozwój psychiatrii środowiskowej. Uregulujemy kształcenie zawodowe psychoterapeutów i opracujemy jednolite standardy postępowania, również dla podmiotów prywatnych.',
      ],
      documents: [],
      checks: { cost: true, funding: true, deadline: false },
    },
    {
      area: 'szpitale',
      answer: [
        'Razem opowiada się za zatrzymaniem komercjalizacji oraz dekomercjalizacją szpitali oraz przeniesieniem ich własności w ręce wojewodów lub samorządów wojewódzkich. Dzięki temu rozwiązaniu będzie możliwa bardziej racjonalna i skoordynowana polityka dotycząca rozmieszczenia szpitali i oddziałów zgodnie z potrzebami zdrowotnymi.',
        'Nasza polityka cenowa dotycząca świadczeń zdrowotnych uwzględniać będzie potrzebę utrzymania niezbędnych oddziałów w szpitalach powiatowych – chirurgii, oddziałów chorób wewnętrznych, pediatrii i oddziałów ginekologiczno-położniczych, które przy obecnej polityce cenowej są dla szpitali „nieopłacalne”.',
        'O tym, gdzie i jakie leczenie jest dostępne, powinno decydować to, czego potrzebują mieszkańcy danego terenu, a nie konkurencja o najbardziej opłacalne zabiegi.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
    {
      area: 'pacjent',
      answer: [
        'Polski system ochrony zdrowia bardzo często łamie prawa pacjenta. Dostęp do leczenia, prawo do informacji, autonomii i godności zbyt często brzmią jak pobożne życzenia.',
        'W obszarze odpowiedzialności zawodowej porównanie liczby i charakteru kar, a co ważniejsze – efektów dla przestrzegania praw pacjentów np. z krajami skandynawskimi wskazuje, że polski system, w którym pracowników oceniają wolontaryjne sądy złożone z ich kolegów nie działa. Ze strony organizacyjnej akredytacja, certyfikacja placówek oraz kontrola przez konsultantów bywa równie nieskuteczna przy kontroli jakości opieki nad pacjentami.',
        'Dlatego postulujemy wzmocnienie i dofinansowanie urzędu Rzecznika Praw Pacjenta. Należy rozważyć powołanie przy RPP niezależnego od izb zawodowych Państwowego Inspektoratu Ochrony Zdrowia, działającego w obszarze standardów organizacyjnych, standardów postępowania, błędów medycznych i łamania praw pacjenta. Kompetencje tej inspekcji obejmowałyby kontrolę działalności placówek ochrony zdrowia: wydawanie i kontrolę realizacji zaleceń oraz w razie potrzeby nakładanie kar administracyjnych jak również stosowanie środków dyscyplinarnych wobec personelu. W przypadku odbierania Praw Wykonywania Zawodu należy rozważyć powołanie przy RPP komisji złożonej z przedstawicieli personelu medycznego, pacjentów, i ekspertów prawa medycznego, która opiniowałaby stosowanie środków dyscyplinarnych przez RPP oraz wspierała Rzeczników Odpowiedzialności Zawodowej z izb zawodowych.',
      ],
      documents: [],
      checks: { cost: false, funding: false, deadline: false },
    },
  ],
  changes: [{ date: new Date('2026-11-06'), text: 'Opis opublikowany: odpowiedź partii w nadesłanym brzmieniu.' }],
};

/**
 * Druga fikcyjna partia — tylko do wzoru porównania (bez własnej podstrony). Pokazuje stany, których nie ma
 * w pierwszym wzorze: obszar i część bez odpowiedzi, brak dokumentów, „nie dotyczy” w „Czy podano”.
 * Jak w pierwszym wzorze: teksty opisują, co tu będzie — żadnych zmyślonych stanowisk.
 */
export const barometrExample2: BarometrProfile = {
  id: 'wzor-2',
  href: profileHref('wzor'),
  name: 'Partia Wzorcowa',
  club: 'Fikcyjne koło poselskie — wzór porównania',
  example: true,
  status: { stage: 'odpowiedz' },
  updated: new Date('2026-10-20'),
  areas: [
    {
      area: 'finansowanie',
      answer: [
        'Tu druga partia odpowiada na te same pytania o finansowanie. Jej odpowiedź może być krótsza od odpowiedzi obok — limit 1500 znaków to górna granica, nie wymóg.',
        'W porównaniu obie odpowiedzi stoją obok siebie w tym samym obszarze, w nadesłanym brzmieniu. Nie zaznaczamy, w czym się zgadzają, a w czym różnią — to ocena czytelnika.',
      ],
      documents: [],
      checks: { cost: false, funding: true, deadline: false },
    },
    {
      area: 'kadry',
      part: 'lekarze',
      answer: ['Tu druga partia odpowiada o lekarzach: o liczbie miejsc na studiach, obowiązku pracy po rezydenturze, czasie pracy we wszystkich miejscach i lekarzach spoza Unii Europejskiej.'],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o lekarzach, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: true, deadline: true },
    },
    // pielęgniarki pominięte — w porównaniu widać wtedy ramkę „nie odniosła się do tej części”
    {
      area: 'kadry',
      part: 'inne-zawody',
      answer: ['Tu druga partia odpowiada o innych zawodach medycznych i o tym, czy mogłyby przejąć część zadań lekarzy.'],
      documents: [],
      checks: { cost: 'nie-dotyczy', funding: 'nie-dotyczy', deadline: true },
    },
    {
      area: 'wynagrodzenia',
      answer: ['Tu druga partia odpowiada o formie zatrudnienia w placówkach finansowanych przez NFZ i o projekcie nowelizacji przygotowanym przez serwis.'],
      documents: [{ kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' }],
      checks: { cost: 'nie-dotyczy', funding: 'nie-dotyczy', deadline: false },
    },
    // dostęp i kolejki pominięty — ramka „nie odniosła się do tego obszaru”
    {
      area: 'szpitale',
      answer: ['Tu druga partia odpowiada, kto powinien prowadzić szpitale i czy zmieniać zasady postępowania z zadłużonymi szpitalami.'],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o szpitalach, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: false, deadline: false },
    },
    {
      area: 'pacjent',
      answer: ['Tu druga partia odpowiada o odpowiedzialności zawodowej lekarzy i o sztucznej inteligencji w leczeniu.'],
      documents: [],
      checks: { cost: 'nie-dotyczy', funding: 'nie-dotyczy', deadline: true },
    },
  ],
  changes: [{ date: new Date('2026-10-20'), text: 'Wzór porównania — pierwsza wersja.' }],
};

/** Opisy z własną podstroną. Prawdziwy opis: id = id karty partii, dane partii z barometrParties. */
export const barometrProfiles: BarometrProfile[] = [barometrExample, barometrKorwin, barometrLewica, barometrRazem];

/* ---------- Porównanie dwóch partii (/barometr-polityczny/porownanie/<a>/<b>/) ---------- */

/**
 * Porównać można dowolne dwie karty z listy (barometrParties i barometrOthers), także bez odpowiedzi — kolumna takiej
 * partii pokazuje wtedy w każdym obszarze stan kontaktu zamiast stanowiska (decyzja redakcji 4.11.2026).
 * Para ma jeden adres: kolumny i adres w kolejności alfabetycznej nazw, niezależnie od tego, którą partię czytelnik
 * wybrał pierwszą — jak na liście kart. Strony par są poza wyszukiwarkami (noindex): to te same odpowiedzi co na
 * podstronach partii, inaczej ułożone. Wzór na dwóch fikcyjnych partiach: /barometr-polityczny/porownanie/wzor/.
 */
export const comparePage = {
  href: `${barometrPage.href}porownanie/`,
  title: 'Porównanie partii',
  lead: 'Odpowiedzi dwóch partii na te same pytania, obszar po obszarze — obok siebie i w nadesłanym brzmieniu.',
};

/** Partia w porównaniu: dane karty z listy i opis, jeśli partia odpowiedziała. */
export interface CompareParty {
  id: string;
  name: string;
  club: string;
  /** 'serwis' = logo serwisu we wzorze, jak na wzorze podstrony partii */
  logo: ImageMetadata | 'serwis';
  status: BarometrStatus;
  /** opis partii; brak = partia nie odpowiedziała — w jej kolumnie stan kontaktu */
  profile?: BarometrProfile;
  /** adres podstrony partii, jeśli ją ma */
  page?: string;
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pl');

/** wszystkie karty z listy, alfabetycznie */
export const compareParties: CompareParty[] = [...barometrParties, ...barometrOthers]
  .map((party) => {
    const profile = barometrProfiles.find((p) => p.id === party.id);
    return { id: party.id, name: party.name, club: party.club, logo: party.logo, status: party.status ?? NOT_SENT, profile, page: profile?.href };
  })
  .sort(byName);

/** wzór porównania: dwie fikcyjne partie; podstronę (wzór) ma tylko pierwsza */
export const compareExample = [barometrExample, barometrExample2]
  .map((profile): CompareParty => ({ id: profile.id, name: profile.name, club: profile.club, logo: 'serwis', status: profile.status, profile, page: profile === barometrExample ? profile.href : undefined }))
  .sort(byName) as [CompareParty, CompareParty];
export const compareExampleHref = `${comparePage.href}wzor/`;

/** adres pary — zawsze w kolejności alfabetycznej nazw */
export function compareHref(x: { id: string; name: string }, y: { id: string; name: string }): string {
  const [a, b] = [x, y].sort(byName);
  return `${comparePage.href}${a.id}/${b.id}/`;
}

/** mapa „id|id” → adres pary, dla pól wyboru i zaznaczania kart (skrypt w przeglądarce); bez par dwóch partii bez odpowiedzi */
export function compareHrefMap(pool: CompareParty[], href: (a: CompareParty, b: CompareParty) => string = compareHref) {
  return Object.fromEntries(
    pool.flatMap((a) => pool.filter((b) => b !== a && (a.profile || b.profile)).map((b) => [`${a.id}|${b.id}`, href(a, b)])),
  );
}

/**
 * pary, w których odpowiedziała choć jedna partia — dwie kolumny bez odpowiedzi nie mają czego pokazać; każdą parę
 * linkuje podstrona partii, która odpowiedziała
 */
export const comparePairs: [CompareParty, CompareParty][] = compareParties.flatMap((a, i) =>
  compareParties.slice(i + 1).filter((b) => a.profile || b.profile).map((b) => [a, b] as [CompareParty, CompareParty]));

/** grupy w polach wyboru partii — według stanu kontaktu, w kolejności etapów */
const compareGroupLabels: Record<BarometrStatus['stage'], string> = {
  odpowiedz: 'Odpowiedziały',
  wyslane: 'Czekamy na odpowiedź',
  brak: 'Bez odpowiedzi',
  niewyslane: 'Pytania jeszcze niewysłane',
};
export function compareGroups(pool: CompareParty[]) {
  return (['odpowiedz', 'wyslane', 'brak', 'niewyslane'] as const)
    .map((stage) => ({ label: compareGroupLabels[stage], parties: pool.filter((p) => p.status.stage === stage) }))
    .filter((g) => g.parties.length > 0);
}

/** ramka w kolumnie partii bez odpowiedzi — w każdym obszarze, zamiast stanowiska */
export function compareNoAnswer(status: BarometrStatus): string {
  const sent = 'sent' in status && status.sent ? ` Pytania wysłane ${formatDate(status.sent)}.` : '';
  switch (status.stage) {
    case 'wyslane': return `Jeszcze bez odpowiedzi — termin mija ${formatDate(answerDeadline)}.${sent}`;
    case 'brak': return `Bez odpowiedzi.${sent}`;
    case 'niewyslane': return 'Pytań jeszcze nie wysłaliśmy.';
    case 'odpowiedz': return 'Partia nie odniosła się do tego obszaru.';
  }
}


/* ---------- Politycy pod nazwiskiem (sekcja #politycy, podstrony /barometr-polityczny/politycy/<id>/) ---------- */

/**
 * Wypowiedź polityka pod własnym nazwiskiem — nie wyjątek od zasady „bez nazwisk” (decyzja redakcji 26.10.2026):
 * polityk sam zabiera głos, my nie opisujemy osób. Zdanie tej osoby, nie stanowisko partii.
 * Te same reguły co odpowiedzi partii: te same obszary, limit ANSWER_LIMIT na każdy, bez zmian w treści, z datą.
 * Obszar bez odpowiedzi oznaczamy wprost („Bez odpowiedzi”, bez rodzaju gramatycznego) — jak u partii, żeby dało się
 * porównać dwóch polityków albo polityka z partią w tym samym obszarze.
 */
export interface BarometrStatementEntry {
  /** id obszaru z barometrAreas */
  area: string;
  /** id części obszaru (kadry); brak = obszar bez części */
  part?: string;
  /** wypowiedź w nadesłanym brzmieniu (akapity) */
  text: string[];
}

export interface BarometrPolitician {
  id: string;
  href: string;
  /** imię i nazwisko tak, jak podpisał się autor */
  name: string;
  /** funkcja publiczna, np. „Poseł na Sejm X kadencji” */
  role: string;
  /**
   * partia albo klub, jeśli autor do niego należy: na karcie listy sama nazwa, logo tylko na podstronie.
   * Logo: import z src/assets/partie/ (to samo co na karcie partii); 'serwis' = logo zarobkilekarzy.pl —
   * tylko we wzorze na fikcyjnej partii, jak u Partii Przykładowej.
   */
  party?: { name: string; logo?: ImageMetadata | 'serwis' };
  /**
   * kim jest i czym się zajmuje — jedno, dwa zdania na karcie listy i w nagłówku podstrony.
   * Same fakty z oficjalnych danych (np. strona Sejmu: zawód, komisje, okręg) albo od autora — bez ocen.
   */
  about: string;
  /** zdjęcie (opcjonalne) — nadesłane przez autora albo oficjalne, bez metadanych; w kolorze, jak awatary w kartach profili */
  photo?: ImageMetadata;
  /** profil w mediach społecznościowych (na razie X) — po nim czytelnik sprawdza, kto mówi */
  /** `bio` = opis z profilu, przepisany bez zmian */
  x: { handle: string; avatar?: ImageMetadata; bio?: string };
  statements: BarometrStatementEntry[];
  updated: Date;
  changes: { date: Date; text: string }[];
  /** wzór na fikcyjnej osobie: zawsze noindex, ramka „to wzór”, bez linku do profilu X */
  example?: boolean;
}

export const barometrStatementsIntro = {
  title: 'Politycy pod własnym nazwiskiem',
  aside: `Stanowisko partii to jedno, zdanie jej polityków — drugie. Tu posłowie, senatorowie i politycy partii z listy mogą wypowiedzieć się pod własnym nazwiskiem w sprawach z sześciu obszarów. Zasady są te same co dla partii: te same obszary, do ${answerLimitLabel} w każdym, bez zmian w treści, z datą, a obszar bez odpowiedzi oznaczamy wprost. Wypowiedź podpisujemy jako zdanie tej osoby, nie partii. Przy każdej podajemy profil autora w mediach społecznościowych, żeby każdy mógł sprawdzić, kto mówi.`,
  /** jak przesłać: z oficjalnego adresu, z profilem w mediach społecznościowych, który pokażemy przy wypowiedzi */
  send: 'Wypowiedź prosimy przysłać z oficjalnego adresu (np. poselskiego) i podać profil w mediach społecznościowych, który pokażemy obok. Można dołączyć zdjęcie. Przed publikacją potwierdzamy autorstwo.',
  subject: 'Barometr polityczny — wypowiedź polityka',
};

const politicianHref = (id: string) => `${barometrPage.href}politycy/${id}/`;

/**
 * Wzór wypowiedzi na fikcyjnej osobie — pokazuje układ; teksty opisują, co tu będzie, bez zmyślonych stanowisk.
 * Nazwy kont X mają ponad 15 znaków (więcej, niż dopuszcza X), więc takie konta nie istnieją — nikogo prawdziwego nie wskazujemy.
 */
export const barometrStatementExample: BarometrPolitician = {
  id: 'wzor',
  href: politicianHref('wzor'),
  name: 'Jan Przykładowy',
  role: 'Poseł na Sejm — osoba fikcyjna',
  party: { name: 'Partia Przykładowa', logo: 'serwis' },
  photo: wzorPhoto,
  about: 'Ekonomista, wcześniej w samorządzie powiatu. W Sejmie w komisji finansów publicznych; zajmuje się budżetem państwa i finansowaniem szpitali powiatowych.',
  x: { handle: 'posel_przykladowy' },
  statements: [
    {
      area: 'finansowanie',
      text: [
        'Tu polityk pisze własnymi słowami, co sądzi o sprawie z jednego z sześciu obszarów barometru — w tym miejscu o tym, ile publicznych pieniędzy przeznaczyć na ochronę zdrowia i skąd je wziąć. Ma na to tyle samo miejsca co partia w jednym obszarze.',
        'Wypowiedź może zgadzać się ze stanowiskiem partii albo się od niego różnić — dlatego podpisujemy ją imieniem i nazwiskiem autora, a nie nazwą partii.',
      ],
    },
    {
      area: 'kadry',
      part: 'lekarze',
      text: ['Tu polityk odpowiada o lekarzach: o liczbie miejsc na studiach, specjalizacjach i czasie pracy. Każdy obszar i każda część kadr to osobna wypowiedź z własnym limitem znaków.'],
    },
    {
      area: 'wynagrodzenia',
      text: ['Tu polityk pisze o zasadach wynagradzania z publicznych pieniędzy — etacie, kontrakcie i jawności łącznych kwot. Obszar, w którym autor nie odpowiedział, oznaczamy wprost: „Bez odpowiedzi”.'],
    },
  ],
  updated: new Date('2026-10-26'),
  changes: [{ date: new Date('2026-10-26'), text: 'Wzór wypowiedzi polityka — pierwsza wersja.' }],
  example: true,
};

/**
 * Dodatkowe wzory tylko w podglądzie (npm run dev): jak wygląda lista z kilkoma osobami.
 * W buildzie ich nie ma — na stronie zostaje jeden wzór, dopóki nie przyjdą prawdziwe wypowiedzi.
 */
const previewExamples: BarometrPolitician[] = [
  {
    id: 'wzor-senatorka',
    href: politicianHref('wzor-senatorka'),
    name: 'Anna Wzorcowa',
    role: 'Senatorka — osoba fikcyjna',
    party: { name: 'Partia Przykładowa', logo: 'serwis' },
    photo: wzorPhoto,
    about: 'Lekarka rodzinna, przez lata kierowała przychodnią na wsi. W Senacie w komisji zdrowia; zajmuje się prawami pacjenta i dostępem do lekarza.',
    x: { handle: 'senatorka_wzorcowa' },
    statements: [
      { area: 'dostep', text: ['Tu senatorka pisze o kolejkach: czy państwo powinno gwarantować najdłuższy czas oczekiwania na świadczenia i co, gdy zostanie przekroczony.'] },
      { area: 'pacjent', text: ['Tu pisze o prawach pacjenta: kto powinien orzekać w sprawach odpowiedzialności zawodowej lekarzy i kto ma odpowiadać za błędy sztucznej inteligencji w leczeniu.'] },
    ],
    updated: new Date('2026-10-26'),
    changes: [{ date: new Date('2026-10-26'), text: 'Wzór — pierwsza wersja.' }],
    example: true,
  },
  {
    id: 'wzor-poslanka',
    href: politicianHref('wzor-poslanka'),
    name: 'Ewa Próbna',
    role: 'Posłanka na Sejm — osoba fikcyjna',
    party: { name: 'Inna Partia Przykładowa', logo: 'serwis' },
    about: 'Pielęgniarka, wcześniej oddziałowa w szpitalu wojewódzkim. W Sejmie w komisji zdrowia; zajmuje się kształceniem kadr medycznych.',
    x: { handle: 'poslanka_probna_x' },
    statements: [
      { area: 'kadry', part: 'pielegniarki', text: ['Tu posłanka odpowiada o pielęgniarkach: o liczbie miejsc na studiach i o zakresie samodzielnych uprawnień, np. wystawianiu recept.'] },
      { area: 'kadry', part: 'inne-zawody', text: ['Tu pisze o innych zawodach medycznych — czy część zadań lekarzy mogliby przejąć np. farmaceuci albo ratownicy.'] },
      { area: 'szpitale', text: ['Tu pisze o szpitalach: kto powinien je prowadzić i co robić z zadłużonymi.'] },
    ],
    updated: new Date('2026-10-26'),
    changes: [{ date: new Date('2026-10-26'), text: 'Wzór — pierwsza wersja.' }],
    example: true,
  },
  {
    id: 'wzor-polityk',
    href: politicianHref('wzor-polityk'),
    name: 'Tomasz Testowy',
    role: 'Członek władz partii — osoba fikcyjna',
    party: { name: 'Inna Partia Przykładowa', logo: 'serwis' },
    about: 'Przedsiębiorca, radny miasta. W partii odpowiada za program gospodarczy, w tym zasady zatrudniania w ochronie zdrowia.',
    x: { handle: 'polityk_testowy_x' },
    statements: [{ area: 'wynagrodzenia', text: ['Tu polityk spoza parlamentu pisze o wynagrodzeniach z publicznych pieniędzy. Na liście może być ktoś, kto wypowiedział się tylko w jednym obszarze.'] }],
    updated: new Date('2026-10-26'),
    changes: [{ date: new Date('2026-10-26'), text: 'Wzór — pierwsza wersja.' }],
    example: true,
  },
];

/**
 * Rafał Komarewicz — wypowiedź z 10.11.2026 (plik tekstowy nadesłany przez posła), opublikowana 13.11.2026.
 * Tekst w nadesłanym brzmieniu; pominięte tylko nagłówki obszarów i powtórzone pod nimi pytania barometru.
 * „O autorze”: dane ze strony Sejmu (wykształcenie, zawód, okręg, funkcje w komisjach), stan na 13.11.2026.
 * Zdjęcie i opis w karcie profilu: z profilu autora w serwisie X, stan na 13.11.2026.
 */
const barometrKomarewicz: BarometrPolitician = {
  id: 'komarewicz',
  href: politicianHref('komarewicz'),
  name: 'Rafał Komarewicz',
  role: 'Poseł na Sejm X kadencji',
  party: { name: 'Centrum', logo: centrumLogo },
  about: 'Z wykształcenia lekarz dentysta, z zawodu przedsiębiorca. Poseł z okręgu krakowskiego; w Sejmie przewodniczy Komisji Gospodarki i Rozwoju i jest zastępcą przewodniczącego Komisji do Spraw Energii, Klimatu i Aktywów Państwowych.',
  photo: komarewiczPhoto,
  x: { handle: 'RKomarewicz', bio: 'Poseł na Sejm RP | Przewodniczący Komisji Gospodarki i Rozwoju | Wiceprzewodniczący Komisji Energii, Klimatu i Aktywów Państwowych' },
  statements: [
    {
      area: 'finansowanie',
      text: [
        'Na dziś podstawą finansowania ochrony zdrowia powinna pozostać składka zdrowotna. Warto jednak czerpać wzorce z rozwiązań Tajwanu czy Skandynawii jako przykładów dobrze działających systemów ochrony zdrowia.',
        'Mamy również kilka przykładów prywatnej lub publicznej z elementami prywatnej ochrony zdrowia, jak Szwajcaria czy Singapur.',
        'Ochrona zdrowia powinna przy tym pozostać zdecydowanie bardziej publiczna niż prywatna. Wymaga jednak bezwzględnej i głębokiej reformy.',
        'Rynek usług medycznych jest ogromny, a dziś pozwalamy firmom czerpać z niego garściami - praktycznie nic nie wymagając w zamian.',
        'Książkowym wręcz przykładem prywatyzacji zysków, a uspołeczniania strat jest leczenie powikłań po prywatnych zabiegach przez publiczną ochronę zdrowia.',
        'Składkę zdrowotną również trzeba uporządkować. Dziś mamy różne składki, płacone w zależności od formy pracy. Jednak zanim to nastąpi, konieczne jest zatamowanie wycieku pieniędzy z NFZ, w tym na wynagrodzenia lekarzy.',
        'Jednocześnie nie da się rzetelnie określić potrzeb systemu, skoro nie wiemy, ile wydajemy na wynagrodzenia lekarzy i personelu. W ciągu dekady publiczne nakłady na ochronę zdrowia wzrosły o ponad 130 mld zł, a jakość leczenia i czas oczekiwania realnie się nie poprawiły. Według obecnych szacunków może być nawet kilkanaście tysięcy lekarzy zarabiających powyżej miliona złotych z publicznej ochrony zdrowia. To absurd i jest on nie do utrzymania.',
        'Najpierw przejrzystość wydatków, potem decyzje o kolejnych miliardach.',
      ],
    },
    {
      area: 'kadry',
      part: 'lekarze',
      text: [
        'Należy dążyć do sukcesywnego zniesienia limitu miejsc na studiach lekarskich, a także na poszczególnych specjalizacjach - przy jednoczesnej kontroli jakości kształcenia oraz pracy.',
        'Ostrzeżenia o nadmiernej liczbie lekarzy wydają się próbą ograniczenia konkurencji wśród medyków. Jeżeli oczekujemy ograniczenia wynagrodzeń lekarzy, a także poprawy jakości służby zdrowia, musimy doprowadzić do konkurencji. To rozwiązanie z korzyścią dla pacjentów.',
        'Należy wprowadzić obowiązek pracy w Polsce przez określony czas dla lekarzy, którzy zostali wykształceni z pieniędzy polskich podatników. Określenie formy i czasu takiego zobowiązania musi być poprzedzone szeroką dyskusją i opierać się na sprawdzonych rozwiązaniach, funkcjonujących w innych państwach.',
        'Dla bezpieczeństwa pacjentów, ale i samych lekarzy, należy wprowadzać ograniczenia w wymiarze czasu pracy. Państwo powinno mieć możliwość kontrolowania stosowania się do tych ograniczeń, dlatego powinno dysponować systemem informatycznym, który będzie zliczał łączny czas pracy nie tylko w publicznym systemie, ale także prywatnym.',
      ],
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      text: [
        'Liczba miejsc na studiach pielęgniarskich powinna być zwiększana, gdy wymaga tego wzrost popytu na ten kierunek. Niepokoi mnie struktura wieku w tym zawodzie, czyli tzw. luka pokoleniowa. Średni wiek pielęgniarki w Polsce to już ok. 55 lat. Starzejące się polskie społeczeństwo będzie natomiast wymagać coraz większej ilości pielęgniarek, a już dziś jesteśmy w tyle względem państw europejskich, jeśli chodzi o ich ilość na 100 tysięcy mieszkańców.',
        'Należy lepiej wykorzystywać kompetencje, które pielęgniarki już mają. Zakres ich uprawnień powinien zostać poszerzony, a dobrym rozwiązaniem jest samodzielna zaawansowana praktyka pielęgniarska, znana z wielu krajów. Prace nad nowymi uprawnieniami ciągną się jednak od miesięcy, a to rozwiązanie potrzebne jak najszybciej.',
        'Zapowiedź Ministerstwa Zdrowia, by pielęgniarki mogły przy infekcjach przepisywać leki i wystawiać L4 do pięciu dni, to krok w dobrą stronę. W znaczący sposób obniży to koszty funkcjonowania przychodni bez spadku jakości opieki, a lekarzom pozwoli skupić się na pacjentach, którzy najbardziej ich potrzebują.',
      ],
    },
    {
      area: 'kadry',
      part: 'inne-zawody',
      text: [
        'Uważam, że część zadań wykonywanych dziś przez lekarzy mogą przejąć także inne zawody medyczne, w tym farmaceuci. Powinni oni otrzymać szersze uprawnienia - w ich przypadku uproszczenie zasad wydawania niektórych leków bez konieczności wizyty u lekarza.',
        'Farmaceuci to świetnie wykształceni eksperci, doskonale znający działanie leków i ich interakcje, a apteki są dostępne niemal wszędzie, często także wieczorami i w weekendy. Wielu pacjentów mogłoby więc szybciej otrzymać pomoc, bez czekania na termin w przychodni. Odciążyłoby to lekarzy podstawowej opieki zdrowotnej i obniżyło koszty systemu. Katalog takich leków i zasady ich wydawania powinny zostać jasno określone, tak aby bezpieczeństwo pacjentów pozostało priorytetem.',
      ],
    },
    {
      area: 'wynagrodzenia',
      text: [
        'Praca w publicznym systemie powinna opierać się przede wszystkim na rozwiązaniu etatowym. Dziś kontrakty wybierane są w znacznym stopniu z przyczyn podatkowych. Dopuszczono do sytuacji, w której osoby pracujące na etacie płacą niewspółmiernie większe podatki niż osoby rozliczające się ryczałtem, którego stawka w przypadku lekarzy wynosi 14%. Praca na etacie wiąże się ze znacznie większymi obciążeniami, szczególnie po przekroczeniu II progu, który nawet po obecnej nowelizacji będzie na absurdalnie niskim poziomie.',
        'W związku z tym należy uporządkować system podatkowy i odciążyć osoby pracujące na etacie. W tym celu przygotowałem Pakiet dla Klasy Średniej - zakłada on II próg na poziomie 200 tys. złotych, kwotę wolną 45 tys. złotych oraz coroczną waloryzację obu tych kwot.',
        'Jednocześnie, uważam za konieczne wprowadzenie jawnego rejestru wynagrodzeń lekarzy, tak aby obywatele mogli kontrolować sposób w jaki wydawane są ich pieniądze. Taki rejestr powinien obejmować zarobki lekarza we wszystkich placówkach przy zachowaniu ochrony jego danych osobowych. W tym celu powinny powstać identyfikatory dla każdego lekarza, których powiązanie z konkretną osobą będzie możliwe tylko dla właściwych organów.',
        'Niezbędne są także limity wynagrodzeń dla lekarzy. Nie ma matematycznie możliwości spiąć systemu ochrony zdrowia, gdy zarobki są nieproporcjonalnie wysokie, a słyszymy o coraz większych grupach lekarzy zarabiających więcej niż 100 tysięcy miesięcznie.',
      ],
    },
    {
      area: 'dostep',
      text: [
        'Usługi medyczne finansowane z publicznych pieniędzy muszą podlegać rzetelnej ocenie - dotyczy to zarówno lekarzy, jak i szpitali. Mierniki jakości, z których rozliczani będą lekarze pracujący w publicznym sektorze powinien wdrożyć Narodowy Fundusz Zdrowia. Pacjent i płatnik muszą wiedzieć, za co płacą i jakie są efekty leczenia.',
        'Po ograniczeniu wynagrodzeń lekarzy, NFZ będzie miał w budżecie więcej pieniędzy na opłacanie samych świadczeń. Problem długich kolejek jednak pozostanie. Jego główną przyczyną jest niestety wieloletnie ograniczanie dostępu do zawodu lekarza i do specjalizacji. Dlatego tak ważne jest docelowe zniesienie limitów miejsc na studiach lekarskich i specjalizacjach, o którym piszę w części dotyczącej kadr.',
        'Trzeba też uczciwie powiedzieć, że efekty tych zmian zobaczymy dopiero w dłuższej perspektywie, bo wykształcenie lekarza specjalisty zajmuje wiele lat. Tym bardziej nie możemy dłużej zwlekać z wprowadzeniem takich rozwiązań.',
      ],
    },
    {
      area: 'szpitale',
      text: [
        'Uważam, że szpitale powinny być prowadzone zarówno przez państwo i samorządy, jak i przez podmioty prywatne. Należy przy tym rozgraniczyć pracę w systemie publicznym i prywatnym. Sprzęt finansowany z publicznych pieniędzy powinien bezwzględnie służyć tylko do leczenia w systemie publicznym. Należy więc wprowadzić przepisy determinujące konieczność wyboru formy pracy. Lekarz pracujący prywatnie nie powinien mieć możliwości jednoczesnej pracy w publicznym systemie. Może prowadzić to do uprzywilejowanego traktowania pacjentów przyjmowanych najpierw prywatnie, a potem w ramach publicznej ochrony zdrowia.',
        'Należy zadbać, aby kadry zarządzające szpitalami składały się z profesjonalistów, a nie partyjnych nominatów niemających pojęcia o systemie ochrony zdrowia, czego przykładem była sytuacja w Szpitalu Południowym. Dlatego od lat postuluję odpolitycznienie w organach spółek i podmiotów publicznych.',
      ],
    },
    {
      area: 'pacjent',
      text: [
        'Samorząd lekarski nie wywiązuje się dziś ze swoich obowiązków, zwłaszcza w zakresie odpowiedzialności zawodowej. Widać to w statystykach: z danych Biura Rzecznika Praw Pacjenta, przedstawionych w tym roku w Sejmie, wynika, że średnio tylko 13% skarg pacjentów kończyło się wnioskiem o ukaranie lekarza. W analizowanym okresie sądy lekarskie orzekły zaledwie 5 kar pozbawienia prawa wykonywania zawodu, podczas gdy samorząd radców prawnych wydał 46 takich decyzji. Pacjenci skarżą się też na przewlekłość postępowań i przedawnianie się spraw.',
        'Reforma tego systemu jest konieczna. Trudno mi jednak rekomendować przeniesienie tych spraw do sądów powszechnych. Wszyscy wiemy, w jakim stanie jest dziś polskie sądownictwo i jak długo trwa przeciętna sprawa, więc pacjenci mogliby czekać na rozstrzygnięcia jeszcze dłużej. Zmiany muszą sprawić, że postępowania w sprawie odpowiedzialności zawodowej lekarzy będą skuteczne, szybkie i przejrzyste dla pacjentów, dlatego poprawkę pozwalającą na stosowanie zakazu pracy na NFZ dla nieuczciwych lekarzy uważałem za dobre rozwiązanie i poparłem je w Sejmie.',
        'Uważam, że to właśnie NFZ mógłby przejąć wyciąganie odpowiedzialności wobec lekarzy.',
      ],
    },
  ],
  updated: new Date('2026-11-13'),
  changes: [{ date: new Date('2026-11-13'), text: 'Wypowiedź opublikowana: tekst z 10.11.2026 w nadesłanym brzmieniu.' }],
};

/** nazwisko = ostatni człon — do kolejności alfabetycznej */
const surname = (name: string) => name.split(' ').at(-1) ?? name;

/** Politycy na stronie — alfabetycznie według nazwiska (te same zasady dla wszystkich). */
export const barometrPoliticians: BarometrPolitician[] = [barometrStatementExample, barometrKomarewicz, ...(import.meta.env.DEV ? previewExamples : [])]
  .sort((a, b) => surname(a.name).localeCompare(surname(b.name), 'pl'));

/**
 * Odpowiedzi przyjęte ponad limit — dokładna długość, więc każda zmiana tekstu znów zatrzyma build.
 * Lewica, kadry/lekarze: partia policzyła 1485 znaków, naszą miarą 1504; przyjęte bez skracania (decyzja redakcji 4.11.2026).
 */
const acceptedOverLimit: Record<string, number> = { 'lewica/kadry/lekarze': 1504 };

// Strażnik limitu: odpowiedź dłuższa niż ANSWER_LIMIT zatrzymuje build — nie publikujemy jej skróconej przez nas.
for (const profile of [...barometrProfiles, barometrExample2]) {
  for (const entry of profile.areas) {
    const n = entry.answer ? answerLength(entry.answer) : 0;
    const where = entry.part ? `${entry.area}/${entry.part}` : entry.area;
    if (n > ANSWER_LIMIT && acceptedOverLimit[`${profile.id}/${where}`] !== n) {
      throw new Error(`Barometr: odpowiedź „${profile.name}” w „${where}” ma ${n} znaków (limit ${ANSWER_LIMIT}) — odesłać partii do skrócenia`);
    }
  }
}
for (const p of barometrPoliticians) {
  for (const entry of p.statements) {
    const n = answerLength(entry.text);
    const where = entry.part ? `${entry.area}/${entry.part}` : entry.area;
    if (n > ANSWER_LIMIT) throw new Error(`Barometr: wypowiedź „${p.name}” w „${where}” ma ${n} znaków (limit ${ANSWER_LIMIT}) — odesłać autorowi do skrócenia`);
  }
}
