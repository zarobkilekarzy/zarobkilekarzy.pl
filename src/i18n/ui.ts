/**
 * Napisy interfejsu (szkielet strony, artykuł, bloki) w obu językach. Polski jest wzorcem:
 * angielski musi mieć te same klucze, więc brak tłumaczenia to błąd typecheck, a nie polskie słowo na stronie EN.
 * Teksty treści (artykuły, dane stron) tu nie trafiają — mają własne pliki w src/content/en i src/data/en.
 *
 *   const t = uiOf(Astro.url);   // w komponencie .astro
 *   <p>{t.article.keyPoints}</p>
 */
import { localeOf, type Locale } from './locales';

const pl = {
  skipLink: 'Przejdź do treści',
  nav: {
    main: 'Główna nawigacja',
    search: 'Szukaj w serwisie',
    searchShort: 'Szukaj',
    display: 'Wyświetlanie',
    openMenu: 'Otwórz menu',
    closeMenu: 'Zamknij menu',
    darkMode: 'Tryb nocny',
    largerText: 'Większy tekst',
    language: 'Wersja językowa',
    breadcrumbs: 'Okruszki',
    selection: 'Zaznaczony fragment',
    home: 'Start',
    /** strona startowa wersji językowej (logo, okruszek „Start”) */
    homeHref: '/',
    logo: 'zarobkilekarzy.pl — strona główna',
  },
  topbar: { updated: 'Aktualizacja' },
  footer: {
    about: 'Obywatelska inicjatywa na rzecz jawności wydatków w ochronie zdrowia. Przewodnik dla pacjentów, studentów i wszystkich, którzy płacą składkę.',
    errorsBefore: 'Dane mogą zawierać błędy — ',
    errorsLink: 'zgłoś sprostowanie',
    errorsHref: '/o-projekcie/#sprostowania',
    errorsAfter: '. Serwis nie udziela porad medycznych ani prawnych.',
    privacy: 'Polityka prywatności',
  },
  /** dopisek do tekstu kopiowanego ze strony (site/CopySource) */
  copySource: 'źródło: ',
  /** dla czytników ekranu przy linku zewnętrznym (lib/inline) */
  newTab: 'otwiera się w nowej karcie',
  /** dopisek przy linku do strony, która istnieje tylko po polsku */
  inPolish: '',
  article: {
    published: 'Publikacja',
    updated: 'Aktualizacja',
    readingTime: 'Czas czytania',
    notes: 'Przypisy',
    notesWithSources: (n: number) => `${n} ze źródłami`,
    /** id listy przypisów (lib/markdown/footnotes.ts) */
    notesId: 'przypisy',
    notesHint: 'ustawy, dane i komunikaty, z których korzystaliśmy',
    noteBack: (n: string) => `Wróć do miejsca w tekście (przypis ${n})`,
    keyPoints: 'W skrócie',
    toc: 'W tym artykule',
    editorial: 'Dlaczego to nasz temat',
    fixTitle: 'Widzisz błąd?',
    fixText: 'Poprawki publikujemy w rejestrze sprostowań z datą i opisem zmiany. Opisujemy mechanizmy, a nie konkretne osoby.',
    fixLink: 'Zgłoś sprostowanie',
    fixHref: '/o-projekcie/#sprostowania',
    share: 'Pomóż nagłośnić',
    relatedEyebrow: 'Czytaj dalej',
    relatedTitle: 'Powiązane mechanizmy',
    changelog: 'Historia zmian',
    /** id sekcji historii zmian (kotwica #historia-zmian w tekstach) */
    changelogId: 'historia-zmian',
    /** podgląd w zwiniętej historii zmian: „ostatnia zmiana 28.10.2026 · …” */
    changelogLatest: 'ostatnia zmiana',
    /** etykieta wpisu-sprostowania (poprawka błędu) */
    correction: 'Sprostowanie',
    /** podpis w nagłówku artykułu (link do opisu pracy redakcji); bez „AI” obok „Przypisy … ze źródłami” — AI nie jest źródłem */
    byline: 'Opracowanie',
    bylineText: 'Redakcja',
    bylineHref: '/o-projekcie/#jak-powstaja-teksty',
    /** nota pod treścią: najpierw źródła, potem rola narzędzi AI, na końcu odpowiedzialność redakcji */
    madeTitle: 'Jak powstał ten tekst.',
    madeText: 'Źródła to publiczne dokumenty, dane i akty prawne — każde z linkiem w przypisach. Narzędzia AI pomagają je opracować: uporządkować, policzyć i zredagować tekst. O tezach decyduje redakcja, która zatwierdza każdą publikację.',
    updatedOn: (date: string) => `aktualizacja ${date}`,
  },
  /** karta profilu w serwisie X (blocks/XProfile) */
  xProfile: {
    card: (name: string, handle: string) => `${name} (@${handle}) w serwisie X`,
    inProfile: 'W profilu',
    profile: 'Profil na X',
    profileOf: (handle: string) => `Profil @${handle} na X`,
  },
  /** blocks/XPosts — karty wpisów z X */
  xPost: {
    list: 'Wpisy w serwisie X',
    kinds: { article: 'Artykuł na X', video: 'Film na X', post: 'Wpis na X' },
    open: 'Otwórz na X',
    card: (title: string, name: string, handle: string) => `${title} — ${name} (@${handle}) w serwisie X`,
  },
  share: { label: 'Udostępnij', copy: 'Kopiuj link', copied: 'Skopiowano ✓', failed: 'Nie udało się' },
  /** lista źródeł strony (article/SourceList) */
  sources: { title: 'Źródła', note: 'Linkujemy wyłącznie do ogólnodostępnych dokumentów i publikacji.' },
  blocks: {
    source: 'Źródło:',
    exact: 'Dokładna',
    estimate: 'Szacunek',
    average: (value: string, unit: string) => `średnio ${value} ${unit}`,
    /** podpis skali wykresu z kropek (blocks/UnitChart): „1 pole = …”, „1 kropka ≈ …” */
    unitCell: 'pole',
    /** domyślna etykieta bloku blocks/Verdict */
    verdict: 'Wniosek',
    /** etapy na osi (blocks/StatusTrack) */
    stage: { done: 'Zrobione', current: 'Jesteśmy tu', next: 'Przed nami' },
    unitDot: 'kropka',
    aside: { note: 'Dopowiedzenie', info: 'Warto wiedzieć', editorial: 'Stanowisko redakcji', warn: 'Jak czytać te liczby' },
    /** domyślny nagłówek listy materiałów pod odpowiedzią (blocks/QuestionBands) */
    readOn: 'Czytaj dalej',
    /** legenda etykiet dokładności (ui/AccuracyLegend) */
    legend: { label: 'Oznaczenia liczb', exact: 'liczba z dokumentu źródłowego', est: 'przybliżenie lub wyliczenie z danych' },
    /** słowniczek w zakładkach (blocks/Glossary) */
    glossary: { title: 'Słowniczek', more: 'Cały słownik', terms: 'Pojęcia' },
  },
  /** mapa Polski (components/mapa): napisy skryptu idą do atrybutów data-* tylko poza polską wersją */
  map: {
    layers: 'Co pokazać na mapie',
    loadError: 'Nie udało się wczytać danych. Spróbuj odświeżyć stronę za kilka minut.',
    /** liczba wyników wyszukiwarki: formy rozdzielone „|” (po polsku odmienia skrypt) */
    results: 'wynik|wyniki|wyników',
  },
  /** wyszukiwarka (components/site/Search*): napisy skryptu idą do atrybutów data-* tylko poza polską wersją */
  search: {
    dialog: 'Wyszukiwarka',
    close: 'Zamknij wyszukiwarkę',
    all: 'Wszystkie wyniki',
    placeholder: 'Szukaj: stawki, rezydentura, prawa pacjenta…',
    popular: 'Popularne',
    loading: 'Szukam…',
    results: 'Wyniki',
    error: 'Wyszukiwarka jest chwilowo niedostępna',
    list: 'Wyniki',
    emptyTitle: 'Brak w kartotece.',
    emptyBefore: 'Przetrząsnęliśmy szuflady i nic. Spróbuj krótszego słowa, np.',
    emptyWords: ['kontrakt', 'NFZ', 'limit'],
    emptyOr: ' albo ',
    emptyGlossary: ', albo zajrzyj do ',
    emptyGlossaryLink: 'słownika pojęć',
    glossaryHref: '/slownik/',
    /** ilustracja pustej listy (SearchEmptyArchive) */
    archive: { title: 'Szafa kartoteki z wysuniętą, pustą szufladą „Wyniki” — w środku tylko pajęczyna, wylatuje z niej ćma; obok lupa', plate: 'ARCHIWUM', top: 'A–M', bottom: 'N–Ż', drawer: 'WYNIKI' },
  },
};

export type Ui = typeof pl;

const en: Ui = {
  skipLink: 'Skip to content',
  nav: {
    main: 'Main navigation',
    search: 'Search the site',
    searchShort: 'Search',
    display: 'Display',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    darkMode: 'Dark mode',
    largerText: 'Larger text',
    language: 'Language',
    breadcrumbs: 'Breadcrumb',
    selection: 'Selected passage',
    home: 'Home',
    homeHref: '/en/',
    logo: 'zarobkilekarzy.pl — English home page',
  },
  topbar: { updated: 'Updated' },
  footer: {
    about: 'A citizens’ initiative for transparency in public healthcare spending in Poland. A guide for patients, students and everyone who pays the health contribution.',
    errorsBefore: 'The data may contain errors — ',
    errorsLink: 'report a correction',
    errorsHref: '/en/about/#corrections',
    errorsAfter: '. The site does not give medical or legal advice.',
    privacy: 'Privacy policy (in Polish)',
  },
  copySource: 'source: ',
  newTab: 'opens in a new tab',
  inPolish: ' (in Polish)',
  article: {
    published: 'Published',
    updated: 'Updated',
    readingTime: 'Reading time',
    notes: 'Notes',
    notesWithSources: (n: number) => `${n} with sources`,
    notesId: 'notes',
    notesHint: 'laws, data and statements we relied on',
    noteBack: (n: string) => `Back to the text (note ${n})`,
    keyPoints: 'Key points',
    toc: 'In this article',
    editorial: 'Why this is our subject',
    fixTitle: 'Spotted an error?',
    fixText: 'We publish corrections in a register, with the date and a description of each change. We describe mechanisms, not individuals.',
    fixLink: 'Report a correction',
    fixHref: '/en/about/#corrections',
    share: 'Help spread the word',
    relatedEyebrow: 'Read next',
    relatedTitle: 'Related mechanisms',
    changelog: 'Change history',
    changelogId: 'change-history',
    changelogLatest: 'latest change',
    correction: 'Correction',
    byline: 'Written by',
    bylineText: 'Editors',
    bylineHref: '/en/about/#how-we-work',
    madeTitle: 'How this text was made.',
    madeText: 'The sources are public documents, data and legal acts — each linked in the notes. AI tools help process them: organise, calculate and edit the text. The editors decide on the arguments and approve every publication.',
    updatedOn: (date: string) => `updated ${date}`,
  },
  xProfile: {
    card: (name: string, handle: string) => `${name} (@${handle}) on X`,
    inProfile: 'In the profile',
    profile: 'Profile on X',
    profileOf: (handle: string) => `@${handle} on X`,
  },
  xPost: {
    list: 'Posts on X',
    kinds: { article: 'Article on X', video: 'Video on X', post: 'Post on X' },
    open: 'Open on X',
    card: (title: string, name: string, handle: string) => `${title} — ${name} (@${handle}) on X`,
  },
  share: { label: 'Share', copy: 'Copy link', copied: 'Copied ✓', failed: 'Could not copy' },
  sources: { title: 'Sources', note: 'We link only to publicly available documents and publications.' },
  blocks: {
    source: 'Source:',
    exact: 'Exact',
    estimate: 'Estimate',
    average: (value: string, unit: string) => `average ${value} ${unit}`,
    unitCell: 'cell',
    verdict: 'Conclusion',
    stage: { done: 'Done', current: 'We are here', next: 'Ahead' },
    unitDot: 'dot',
    aside: { note: 'Note', info: 'Good to know', editorial: 'Editorial position', warn: 'How to read these numbers' },
    readOn: 'Read more',
    legend: { label: 'Figure labels', exact: 'a figure taken from the source document', est: 'an approximation or a calculation from the data' },
    glossary: { title: 'Glossary', more: 'Full glossary', terms: 'Terms' },
  },
  map: {
    layers: 'What to show on the map',
    loadError: 'Could not load the data. Try refreshing the page in a few minutes.',
    results: 'result|results',
  },
  search: {
    dialog: 'Search',
    close: 'Close search',
    all: 'All results',
    placeholder: 'Search: rates, residency, patient rights…',
    popular: 'Popular',
    loading: 'Searching…',
    results: 'Results',
    error: 'Search is temporarily unavailable',
    list: 'Results',
    emptyTitle: 'Nothing in the files.',
    emptyBefore: 'We went through the drawers and found nothing. Try a shorter word, e.g.',
    emptyWords: ['contract', 'NFZ', 'limit'],
    emptyOr: ' or ',
    emptyGlossary: ', or look in the ',
    emptyGlossaryLink: 'glossary',
    glossaryHref: '/en/glossary/',
    archive: { title: 'A filing cabinet with an empty “Results” drawer pulled out — only a cobweb inside and a moth flying out; a magnifying glass beside it', plate: 'ARCHIVE', top: 'A–M', bottom: 'N–Z', drawer: 'RESULTS' },
  },
};

export const ui: Record<Locale, Ui> = { pl, en };

/** Napisy dla strony pod danym adresem — `uiOf(Astro.url)`. */
export const uiOf = (url: URL) => ui[localeOf(url.pathname)];
