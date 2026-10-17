/**
 * Obrazki OG stron spoza kolekcji (trasa → treść obrazka).
 * Artykuły mają je automatycznie (lib/og/presets.ts) i nadpisują polem `og` we frontmatterze.
 * Strona główna jest też obrazkiem domyślnym dla tras bez własnego wpisu.
 */
import type { OgPage } from '@/types';
import { site } from '@/data/navigation';
import { formatDate, formatPL } from '@/lib/format';
import { monitoring } from '@/lib/monitoring';
import { currentStage, projekt } from '@/data/projekt-ustawy';
import { adresaci } from '@/data/adresaci';
import { writeToolOn } from '@/data/dzialaj';
import { helpline } from '@/data/prawa-pacjenta';
import { HEADLINE } from '@/data/zarobki-ujawnione-listy';
import sorOgSnapshot from '@/data/sor/migawka-og.json';
import { frozenLayer } from '@/lib/sor/map';

import heroImg from '@/assets/img/hero-pokoj-lekarski.jpg';

export const ogPages: Record<string, OgPage> = {
  '/': {
    eyebrow: 'Przewodnik po pracy i zarobkach',
    title: 'Zarobki lekarzy.\nBez emocji,\nze źródłami',
    photo: heroImg,
    position: '38% 50%',
    badge: `${formatPL(HEADLINE.positions)} rozliczeń w bazie`,
    badgeIcon: 'db',
    footer: { text: 'Każda liczba ze źródłem', flags: true },
  },
  '/dane/': {
    eyebrow: 'Dane',
    title: 'Zarobki lekarzy\ni pieniądze publiczne',
    lead: 'Wynagrodzenia, budżet NFZ, długi szpitali i kolejki — każda liczba ze źródłem.',
    media: 'stat',
    stat: {
      value: `~${HEADLINE.medianK}`,
      unit: 'tys. zł',
      label: 'Mediana rocznego rozliczenia',
      desc: 'lekarza w placówkach, które ujawniły pełne listy płac',
      accuracy: 'est',
      source: `${HEADLINE.listsLabel} · ${HEADLINE.positionsLabel}`,
    },
    footer: { text: `Dział danych · stan na ${formatDate(site.updated)}`, flags: true },
  },
  // liczby z danych monitoringu — po regeneracji JSON-a obrazek aktualizuje się sam
  '/dane/monitoring-watchdog/': {
    eyebrow: 'Dane · przeglądarka monitoringu',
    title: 'Kto ujawnił\npłace lekarzy,\na kto milczy',
    media: 'stat',
    stat: {
      value: formatPL(monitoring.facilities.filter((f) => f.response === 'disclosed').length),
      unit: `z ${formatPL(monitoring.facilities.length)}`,
      label: 'placówek ujawniło dane',
      desc: `${formatPL(monitoring.facilities.filter((f) => f.response === 'refused').length)} odmówiło, ${formatPL(monitoring.facilities.filter((f) => f.response === 'silence').length)} nie odpowiedziało`,
      accuracy: 'exact',
      source: `Watchdog Polska, płace za ${monitoring.year} r.`,
    },
    footer: { text: `Przeglądarka · stan na ${formatDate(new Date(monitoring.updated))}`, flags: true },
  },
  '/mechanizmy/': {
    eyebrow: 'Mechanizmy',
    title: 'Jak działa system,\nnie kto w nim pracuje',
    lead: 'Rozliczenia NFZ, kontrakty, dyżury i dostęp do zawodu — opisujemy mechanizmy, nie nazwiska.',
    footer: { text: 'Każda teza ze źródłem' },
  },
  '/analizy/': {
    eyebrow: 'Analizy',
    title: 'Pogłębione tematy\nze źródłami',
    lead: 'Jawność i rejestr, pieniądz publiczny, kształcenie lekarzy i porównania międzynarodowe.',
    footer: { text: 'Każda teza ze źródłem' },
  },
  '/egzamin/': {
    eyebrow: 'Egzamin LEK',
    title: 'Sprawdź się\nna pytaniach LEK',
    lead: '200 pytań, 4 godziny, próg 56%. Nauka, szybki test albo pełny egzamin na czas — ze statystyką zdających.',
  },
  // etap i wersja z projekt-ustawy.ts — zmiana etapu zmienia obrazek
  '/postulat/': {
    eyebrow: 'Postulat',
    title: 'Jawne kwoty,\nchronione nazwiska',
    lead: 'Łączne wynagrodzenie każdej osoby z placówek z umową z NFZ — co kwartał, jako otwarte dane, bez nazwisk.',
    footer: { text: `Projekt ustawy · wersja ${projekt.version} · ${currentStage.label.toLowerCase()}` },
  },
  '/postulat/projekt-ustawy/': {
    eyebrow: 'Postulat · projekt ustawy',
    title: 'Nowelizacja art. 27a\nustawy o działalności\nleczniczej',
    lead: 'Co kwartał, bez nazwisk, z sankcją — dwa nowe punkty, bez zmian w obowiązujących przepisach.',
    footer: { text: `Wersja ${projekt.version} · ${formatDate(projekt.date)} · ${currentStage.label.toLowerCase()}` },
  },
  '/postulat/petycja/': {
    eyebrow: 'Postulat · archiwum',
    title: 'Petycja o jawny\nrejestr wynagrodzeń',
    lead: 'Pierwsza forma postulatu (lipiec 2026): rejestr imienny po numerze PWZ. Dziś postulujemy publikację bez nazwisk.',
  },
  // etap z projekt-ustawy.ts, liczba adresów z adresaci.json — zmiana etapu albo listy zmienia obrazek
  '/dzialaj/': {
    eyebrow: 'Działaj',
    title: 'Jak możesz pomóc\nprojektowi ustawy',
    lead: writeToolOn
      ? 'Udostępnij postulat, napisz do posła lub senatora gotowym listem, poleć projekt ustawy.'
      : 'Udostępnij postulat, poleć projekt ustawy, przyślij dane albo sprostowanie.',
    footer: { text: writeToolOn ? `${adresaci.length} oficjalnych adresów · etap: ${currentStage.label.toLowerCase()}` : `etap projektu: ${currentStage.label.toLowerCase()}` },
  },
  '/o-projekcie/': {
    eyebrow: 'O serwisie',
    title: 'O projekcie\nzarobkilekarzy.pl',
    lead: 'Po co powstał serwis, na jakich zasadach dobieramy źródła i jak zgłosić błąd.',
    footer: { text: 'Mechanizmy, nie nazwiska' },
  },
  '/media/': {
    eyebrow: 'O serwisie',
    title: 'Materiały\nmedialne',
    lead: 'Infografiki do pobrania: źródła, adres strony i kod QR na każdej grafice.',
    footer: { text: 'Licencja CC BY 4.0' },
  },
  '/prywatnosc/': {
    eyebrow: 'O serwisie',
    title: 'Polityka\nprywatności',
    lead: 'Bez kont, bez ciasteczek, bez zbierania danych osobowych.',
    footer: { text: 'kontakt@zarobkilekarzy.pl' },
  },
  '/faq/': {
    eyebrow: 'Pytania i zarzuty',
    title: 'Najczęstsze zarzuty\nwobec jawności płac',
    lead: 'Populizm, emigracja, RODO, porównania z OECD — co odpowiadamy na kontrargumenty, które słyszymy najczęściej.',
    footer: { text: 'Krytykujemy mechanizm, nie zawód' },
  },
  '/slownik/': {
    eyebrow: 'Słownik pojęć',
    title: 'Kontrakt, kapitacja,\nryczałt — po ludzku',
    lead: 'Najważniejsze pojęcia z ochrony zdrowia w kilku zdaniach. Przy każdym haśle podstawa prawna albo źródło.',
    footer: { text: 'Definicje bez ocen, ze źródłem' },
  },
  // bez liczby partii i dat wysyłki — na OG nic, co się zmienia (X trzyma obrazek w pamięci)
  '/barometr-polityczny/': {
    eyebrow: 'Barometr polityczny',
    title: 'Co partie proponują\nw ochronie zdrowia',
    lead: 'Te same pytania dla każdej partii. Odpowiedzi publikujemy bez zmian w treści, z dokumentami wskazanymi przez partię.',
    footer: { text: 'Pieniądz publiczny, nie polityka' },
  },
  '/program/': {
    eyebrow: 'Szerszy program',
    title: 'Co poza jawnością\nwynagrodzeń',
    lead: 'Osiem kierunków — od ewidencji czasu pracy po sądy lekarskie. Przy każdym fakt ze źródłem i najmocniejszy kontrargument.',
    footer: { text: 'Kierunki, nie projekt ustawy' },
  },
  // „0 zł” zamiast numeru infolinii: 11 znaków numeru nie mieści się w karcie liczby bez łamania
  '/prawa-pacjenta/': {
    eyebrow: 'Dla pacjenta',
    title: 'Prawa pacjenta.\nCo Ci przysługuje\ni gdzie to zgłosić',
    media: 'stat',
    stat: {
      value: '0 zł',
      label: 'Pierwsza kopia dokumentacji',
      desc: `W rejestracji rzadko ktoś o tym mówi. Bezpłatna infolinia pacjenta: ${helpline.phone.display}.`,
      source: `art. 28 ustawy o prawach pacjenta`,
    },
    footer: { text: 'Prostym językiem, ze źródłami' },
  },
  '/prawa-pacjenta/druk/': {
    eyebrow: 'Prawa pacjenta · do druku',
    title: 'Karta kieszonkowa\ni duży druk',
    lead: 'Dwie karty na kartce A4: przetnij i złóż. Albo dwie strony dużą czcionką — dla osoby starszej i na tablicę.',
    footer: { text: 'PDF, czarno-biały, do rozdawania bez pytania o zgodę' },
  },
  '/prawa-pacjenta/sor/': {
    eyebrow: 'Dla pacjenta · na żywo',
    title: 'Kolejki na SOR.\nIle się czeka\ni czy w normie',
    lead: 'Wszystkie szpitalne oddziały ratunkowe na jednej mapie, odświeżanej co 10 minut — z normami czasu z rozporządzenia.',
    footer: { text: 'Dane systemu TOPSOR, ze źródłami' },
    // ilustracja z jednej migawki (17.10.2026, 13:26) — zamrożona, bo na OG nic się nie zmienia
    map: { layer: frozenLayer(sorOgSnapshot), theme: 'ciemny', legend: [[1, 'w normie'], [2, 'ponad normę'], [3, 'ponad 2× normę']] },
  },
  '/szukaj/': {
    eyebrow: 'Wyszukiwarka',
    title: 'Szukaj w serwisie',
    lead: 'Artykuły, zestawienia danych i pojęcia ze słowniczka.',
  },
};
