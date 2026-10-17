/**
 * Barometr polityczny — strona /barometr-polityczny/. Docelowo: polityka zdrowotna każdej partii
 * opisana według tych samych obszarów. Na start: wstęp, zasady i zaproszenie do przesłania programu.
 * Bezstronność: te same pytania dla wszystkich, stanowisko partii oddzielone od faktów, bez nazwisk.
 */
import type { ImageMetadata } from 'astro';
import type { TextItem } from '@/types';
import { formatDate, formatPL, plural } from '@/lib/format';
import { contact } from '@/data/o-serwisie';

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
  updated: new Date('2026-10-17'),
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
  sendOn: new Date('2026-10-19'),
  answerWeeks: 2,
};
/** ostatni dzień na odpowiedź */
export const answerDeadline = new Date(barometrSchedule.sendOn.getTime() + barometrSchedule.answerWeeks * 7 * 86_400_000);
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

/** Część obszaru (kadry: lekarze, pielęgniarki, inne zawody) — osobna odpowiedź z tym samym limitem. */
export interface BarometrAreaPart extends TextItem {
  id: string;
}

/** Obszar opisu: `id` = kotwica sekcji na podstronie partii (stała — linkują do niej inne strony). */
export interface BarometrArea extends TextItem {
  id: string;
  /** części obszaru; każda to osobna odpowiedź (decyzja redakcji 17.10.2026 — kadry w trzech częściach) */
  parts?: BarometrAreaPart[];
}

/** Obszary opisu — te same dla każdej partii; to zarazem pytania, które wysyłamy partiom. */
export const barometrAreas: BarometrArea[] = [
  {
    id: 'finansowanie',
    title: 'Finansowanie.',
    text: 'Ile publicznych pieniędzy na ochronę zdrowia i skąd je wziąć: ze składki, z budżetu państwa, z innych źródeł.',
  },
  {
    id: 'kadry',
    title: 'Kadry.',
    text: 'Jak zapewnić kadry ochrony zdrowia. Odpowiedź w trzech częściach:',
    parts: [
      { id: 'lekarze', title: 'Lekarze', text: 'kształcenie, liczba miejsc na studiach, specjalizacje.' },
      { id: 'pielegniarki', title: 'Pielęgniarki', text: 'kształcenie, liczba miejsc na studiach, specjalizacje.' },
      { id: 'inne-zawody', title: 'Inne zawody medyczne', text: 'ratownicy medyczni, fizjoterapeuci, diagności laboratoryjni i inni: kształcenie, liczba miejsc na studiach.' },
    ],
  },
  {
    id: 'wynagrodzenia',
    title: 'Wynagrodzenia i jawność.',
    text: 'Jak ustalać i rozliczać wynagrodzenia z publicznych pieniędzy: etat i kontrakt, płace minimalne, jawność łącznych kwot.',
  },
  {
    id: 'dostep',
    title: 'Dostęp i kolejki.',
    text: 'Jak skrócić czas oczekiwania na świadczenia i jak go rzetelnie mierzyć.',
  },
  {
    id: 'szpitale',
    title: 'Szpitale.',
    text: 'Sieć szpitali, ich zadłużenie i zasady finansowania: kto pokrywa straty i kto decyduje o zmianach.',
  },
  {
    id: 'pacjent',
    title: 'Pacjent.',
    text: 'Prawa pacjenta, informacja o jakości leczenia, dochodzenie roszczeń po błędzie medycznym.',
  },
];

/** Zasady barometru — jak publikujemy stanowiska partii. */
export const barometrRules: TextItem[] = [
  {
    title: 'Te same pytania dla wszystkich',
    text: `Każda partia dostaje ten sam zestaw obszarów i tyle samo miejsca: do ${answerLimitLabel} na każdą odpowiedź. Dłuższą odpowiedź odsyłamy do skrócenia — pełną wersję partia może dołączyć jako dokument. Opisy układamy alfabetycznie.`,
  },
  {
    title: 'Słowa partii, nie nasz wybór',
    text: 'Odpowiedź publikujemy bez zmian w treści i podpisujemy jako stanowisko partii. Dokumenty pokazujemy tylko te, które partia sama wskaże — sami ich nie dobieramy.',
  },
  {
    title: 'Bez odpowiedzi — piszemy to wprost',
    text: `Na odpowiedź każda partia ma ${answerTime}. Potem przy karcie partii, która nie odpowiedziała, piszemy „Bez odpowiedzi” i datę wysłania pytań — bez opisu za partię. Spóźnioną odpowiedź dodamy, gdy tylko przyjdzie.`,
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
    text: `Do ${answerLimitLabel} na każdy obszar z listy powyżej, a w kadrach — osobno na lekarzy, pielęgniarki i inne zawody medyczne. Obszar albo część, w której partia nie ma stanowiska, można pominąć. Prosimy bez nazwisk — opisujemy programy, nie osoby.`,
  },
  {
    title: 'Koszt, źródło pieniędzy, termin',
    text: 'Przy każdej propozycji: ile ma kosztować, skąd wziąć na nią pieniądze i do kiedy ma zostać wdrożona.',
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
  notParty?: boolean;  /** etap kontaktu; brak = pytań jeszcze nie wysłano */
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
    { id: 'centrum', name: 'Centrum', club: 'Klub Parlamentarny Centrum', logo: centrumLogo },
    { id: 'demokracja-bezposrednia', name: 'Demokracja Bezpośrednia', club: 'Koło Poselskie Demokracja Bezpośrednia', logo: demokracjaLogo },
    { id: 'koalicja-obywatelska', name: 'Koalicja Obywatelska', club: 'Klub Parlamentarny Koalicja Obywatelska – Platforma Obywatelska, Nowoczesna, Inicjatywa Polska, Zieloni', logo: koLogo },
    { id: 'konfederacja', name: 'Konfederacja Wolność i Niepodległość', club: 'Klub Poselski Konfederacja', logo: konfederacjaLogo },
    { id: 'konfederacja-korony-polskiej', name: 'Konfederacja Korony Polskiej', club: 'Koło Poselskie Konfederacja Korony Polskiej', logo: kkpLogo },
    { id: 'lewica', name: 'Lewica', club: 'Koalicyjny Klub Parlamentarny Lewicy (Nowa Lewica, PPS, Unia Pracy)', logo: lewicaLogo },
    { id: 'polska-2050', name: 'Polska 2050', club: 'Klub Parlamentarny Polska 2050', logo: polska2050Logo },
    { id: 'psl', name: 'Polskie Stronnictwo Ludowe', club: 'Klub Parlamentarny Polskie Stronnictwo Ludowe – Trzecia Droga', logo: pslLogo },
    { id: 'pis', name: 'Prawo i Sprawiedliwość', club: 'Klub Parlamentarny Prawo i Sprawiedliwość', logo: pisLogo },
    { id: 'razem', name: 'Razem', club: 'Koło Poselskie Razem', logo: razemLogo },
    { id: 'rozwoj-plus', name: 'Rozwój Plus', club: 'Klub Parlamentarny Rozwój Plus', logo: rozwojLogo },
  ] satisfies BarometrParty[]
).sort((a, b) => a.name.localeCompare(b.name, 'pl'));

/** Uczestnicy sporu o politykę zdrowotną, którzy nie są partiami — za partiami, z oznaczeniem „nie partia”. */
export const barometrOthers: BarometrParty[] = [
  { id: 'nil', name: 'Naczelna Izba Lekarska', club: 'Samorząd zawodowy lekarzy i lekarzy dentystów', logo: nilLogo, notParty: true },
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
  /** czy przy propozycjach podano koszt, źródło pieniędzy i termin — nie oceniamy, czy propozycja jest dobra */
  checks?: { cost: boolean; funding: boolean; deadline: boolean };
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
export const barometrChecks = [
  { key: 'cost', label: 'Koszt propozycji' },
  { key: 'funding', label: 'Źródło pieniędzy' },
  { key: 'deadline', label: 'Termin wdrożenia' },
] as const;

const profileHref = (id: string) => `${barometrPage.href}${id}/`;

/**
 * Wzór opisu na fikcyjnej partii — pokazuje układ, nie treść. Odpowiedzi opisują, co partia w danym
 * miejscu napisze; nie wolno tu wstawiać zmyślonych stanowisk ani przypisywać ich prawdziwej partii.
 * Jeden obszar bez odpowiedzi (szpitale) i jeden bez wskazanych dokumentów (dostęp) — żeby było widać oba przypadki.
 */
export const barometrExample: BarometrProfile = {
  id: 'wzor',
  href: profileHref('wzor'),
  name: 'Partia Przykładowa',
  club: 'Fikcyjny klub parlamentarny — wzór opisu',
  example: true,
  status: { stage: 'odpowiedz' },
  updated: barometrPage.updated,
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
    // kadry w trzech częściach: pełna odpowiedź, odpowiedź bez dokumentów i część pominięta
    {
      area: 'kadry',
      part: 'lekarze',
      answer: ['Tu odpowiedź partii o lekarzach: kształceniu, liczbie miejsc na studiach i specjalizacjach.'],
      documents: [{ kind: 'Poprawka', title: 'Poprawka, którą partia wskazała: do jakiej ustawy, z linkiem do druku' }],
      checks: { cost: false, funding: false, deadline: true },
    },
    {
      area: 'kadry',
      part: 'pielegniarki',
      answer: ['Tu odpowiedź partii o pielęgniarkach: kształceniu, liczbie miejsc na studiach i specjalizacjach.'],
      documents: [],
      checks: { cost: true, funding: true, deadline: false },
    },
    { area: 'kadry', part: 'inne-zawody', documents: [] },
    {
      area: 'wynagrodzenia',
      answer: ['Tu odpowiedź partii o zasadach wynagradzania z publicznych pieniędzy, w tym o jawności łącznych kwot.'],
      documents: [{ kind: 'Program', title: 'Fragment programu partii o wynagrodzeniach, z linkiem do dokumentu na stronie partii' }],
      checks: { cost: true, funding: true, deadline: true },
    },
    {
      area: 'dostep',
      answer: ['Tu odpowiedź partii o skracaniu kolejek i o tym, jak mierzyć czas oczekiwania na świadczenia.'],
      documents: [],
      checks: { cost: true, funding: false, deadline: false },
    },
    {
      area: 'szpitale',
      documents: [],
    },
    {
      area: 'pacjent',
      answer: ['Tu odpowiedź partii o prawach pacjenta, informacji o jakości leczenia i dochodzeniu roszczeń po błędzie medycznym.'],
      documents: [{ kind: 'Projekt ustawy', title: 'Projekt, który partia wskazała na poparcie odpowiedzi: tytuł, numer druku i link do strony Sejmu' }],
      checks: { cost: false, funding: false, deadline: true },
    },
  ],
  changes: [{ date: barometrPage.updated, text: 'Wzór opisu — pierwsza wersja.' }],
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
