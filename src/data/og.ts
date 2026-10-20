/**
 * Obrazki OG stron spoza kolekcji (trasa → treść obrazka).
 * Artykuły mają je automatycznie (lib/og/presets.ts) i nadpisują polem `og` we frontmatterze.
 * Strona główna jest też obrazkiem domyślnym dla tras bez własnego wpisu.
 */
import type { OgPage } from '@/types';
import { site } from '@/data/navigation';
import { formatDate, formatPL, plural } from '@/lib/format';
import { monitoring, type Response } from '@/lib/monitoring';
import { currentStage, projekt } from '@/data/projekt-ustawy';
import { adresaci } from '@/data/adresaci';
import { writeToolOn } from '@/data/dzialaj';
import { helpline } from '@/data/prawa-pacjenta';
import { MEDIANS } from '@/data/rozklad-wynagrodzen';
import sorOgSnapshot from '@/data/sor/migawka-og.json';
import { frozenLayer } from '@/lib/sor/map';
import { simulatorOgPanels } from '@/lib/podaz/og';
import { nurseSimulatorOgPanels } from '@/lib/podaz/pielegniarki/og';
import { columnChart, lineChart, sumSchema, svg } from '@/lib/og/charts';
import { ageRows, dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { INDEX_CHART } from '@/data/kolejki';
import { BUDGET } from '@/data/budzet-nfz';
import { AOS_FIRST, AOS_LAST, WHC_2022, WHC_2024, pct as change } from '@/data/wizyty-prywatne-kolejka-cena';
import { funnelRows } from '@/data/odsiew-na-medycynie';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { COUNTRIES, WINDOW, ratePer100k, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { pseudonymDemo } from '@/data/postulat';
import { createHmac } from 'node:crypto';
import { KANADA, TAJWAN } from '@/lib/siatka/kraje';
import { CASES as COURT_CASES, CATALOG_HREF, GAME_HREF, SCALE as COURT_SCALE, caseHref, verdictLabel } from '@/data/sad-lekarski';

import barometrOg from '@/assets/img/barometr-polityczny-og.png';
import { newsIllustration } from '@/lib/news';
import { barometrProfiles } from '@/data/barometr-polityczny';

// odpowiedzi placówek na wniosek o płace (monitoring Watchdog Polska)
const answered = (...r: Response[]) => monitoring.facilities.filter((f) => r.includes(f.response)).length;
const fullLists = monitoring.facilities.filter((f) => f.payroll).length;

/* ---------- Wykresy na obrazkach (strony i artykuły) ---------- */

const MEDIA_W = 470; // kolumna mediów w lib/og/render.ts
const PANEL_H = 440;
const TWO_PANELS_H = 196;

// Postulat: trzy umowy jednej osoby (udziały poglądowe, bez kwot) i identyfikator z przykładu na /postulat/
const POSTULAT_PIECES = [
  { label: 'Szpital — etat', share: 5 },
  { label: 'Poradnia z umową z NFZ — kontrakt', share: 3 },
  { label: 'Dyżury w innym mieście — zlecenie', share: 2 },
];
const demoId = `${createHmac('sha256', pseudonymDemo.key).update(pseudonymDemo.pwz).digest('hex').slice(0, 8)}…`;

// Cięcie limitów: rok naboru skrócony do podpisu pod kolumną („2015/16” → „2015”, „1994–2000” → „94–00”)
const shortYear = (label: string) => (label.includes('–') ? label.replace(/\d\d(\d\d)–\d\d(\d\d)/, '$1–$2') : label.slice(0, 4));
const intakeCols = dayRows.map((r, i) => ({
  label: shortYear(r.label),
  value: r.value,
  display: i === 0 ? `>${formatPL(r.value)}` : r.highlight || i === dayRows.length - 1 ? r.display : undefined,
  highlight: r.highlight,
}));
// od najstarszych do najmłodszych, żeby oś czasu studiów szła w tę samą stronę co nabór
const ageCols = [...ageRows].reverse().map((r) => ({ label: r.label.replace(' lat', ''), value: r.value, display: r.highlight ? r.display : undefined, highlight: r.highlight }));

const finals = BUDGET.filter((r) => r.status === 'final');
const costCols = finals.map((r, i) => ({
  label: r.year % 5 === 0 ? String(r.year) : '',
  value: r.costs,
  display: i === 0 || i === finals.length - 1 ? formatPL(r.costs, 1) : undefined,
  highlight: i === finals.length - 1,
}));

const country = (key: CountryKey) => {
  const c = COUNTRIES.find((x) => x.key === key)!;
  // jedno miejsce po przecinku: Polska ma 1,2, a „1” zaniżałoby wynik na korzyść tezy
  return { label: c.name, sub: c.body, value: ratePer100k(key), display: formatPL(ratePer100k(key), 1), marked: key === 'pl' };
};

const aosCost = change(AOS_FIRST.cost, AOS_LAST.cost);
const aosServices = change(AOS_FIRST.services, AOS_LAST.services);
const queueGrowth = change(WHC_2022.single, WHC_2024.single);

/** Media artykułów (trasa → wykres w miejscu zdjęcia); etykieta, lead i stopka zostają z presetu artykułu. */
export const ogArticleMedia: Record<string, Pick<OgPage, 'bars' | 'panels' | 'dots'>> = {
  // mapy krajów z kropek (lib/siatka/kraje.ts); kolor = to, co o danej prowincji mówi artykuł
  '/analizy/kanada-lekarze-ustawa-specjalna/': {
    dots: {
      mask: KANADA,
      codes: { q: { size: 'on', color: 'blue' }, a: { size: 'on', color: 'seq-0' }, j: { size: 'on', color: 'ok' }, o: { size: 'mid', color: 'chart' } },
      legend: [
        { code: 'q', label: 'Quebec — ustawa nr 2 z 2025 r.' },
        { code: 'a', label: 'Ontario i Alberta — warunki narzucone wcześniej' },
        { code: 'j', label: 'Kolumbia Brytyjska i Nowy Brunszwik — jawne płatności' },
      ],
    },
  },
  '/analizy/tajwan-ochrona-zdrowia/': {
    dots: {
      mask: TAJWAN,
      codes: { '#': { size: 'on', color: 'blue' } },
      legend: [{ code: '#', label: 'Jeden płatnik dla całego kraju' }],
    },
  },
  '/analizy/ciecie-limitow-na-medycyne/': {
    panels: [
      { head: 'Miejsca na I roku medycyny', height: TWO_PANELS_H, svg: svg(MEDIA_W, TWO_PANELS_H, columnChart(intakeCols, MEDIA_W, TWO_PANELS_H)) },
      { head: 'Lekarze dziś według wieku', height: TWO_PANELS_H, svg: svg(MEDIA_W, TWO_PANELS_H, columnChart(ageCols, MEDIA_W, TWO_PANELS_H)) },
    ],
  },
  '/dane/kolejki/': {
    panels: [{ head: `Indeks, ${INDEX_CHART.base} = 100`, height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, lineChart(INDEX_CHART, MEDIA_W, PANEL_H, [INDEX_CHART.xMin, INDEX_CHART.xMin + 5, INDEX_CHART.xMax - 1])) }],
  },
  '/dane/budzet-nfz/': {
    panels: [{ head: 'Koszty w planie NFZ, mld zł', height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, columnChart(costCols, MEDIA_W, PANEL_H)) }],
  },
  '/analizy/wizyty-prywatne-kolejka-cena/': {
    bars: {
      head: `Poradnie specjalistyczne z NFZ, ${AOS_FIRST.year}–${AOS_LAST.year}`,
      unit: '%',
      rows: [
        { label: 'Pieniądze NFZ', sub: `z ${formatPL(AOS_FIRST.cost / 1e6, 1)} do ${formatPL(AOS_LAST.cost / 1e6, 1)} mld zł`, value: aosCost, display: `+${formatPL(aosCost, 1)}`, marked: true },
        { label: 'Świadczenia', sub: `z ${formatPL(AOS_FIRST.services / 1e6, 1)} do ${formatPL(AOS_LAST.services / 1e6, 1)} mln`, value: aosServices, display: `+${formatPL(aosServices, 1)}` },
        { label: 'Czas oczekiwania', sub: `z ${formatPL(WHC_2022.single, 1)} do ${formatPL(WHC_2024.single, 1)} mies.`, value: queueGrowth, display: `+${formatPL(queueGrowth)}` },
      ],
    },
  },
  '/analizy/odsiew-na-medycynie/': {
    bars: {
      head: 'Ze 100 osób, które zaczynają studia',
      rows: funnelRows.map((r) => ({ label: r.label, value: r.value, display: r.display, marked: r.highlight })),
    },
  },
  // mnożniki zamiast złotych: kwoty zmieniają się co roku z płacą minimalną, a na OG nic, co się zmienia
  '/analizy/limity-wynagrodzen-medykow/': {
    bars: {
      head: 'Pułap miesięczny w płacach minimalnych',
      unit: '×',
      rows: [
        { label: 'Pół etatu w jednej placówce', value: 4 },
        { label: 'Pełny etat w jednej placówce', value: 8 },
        { label: 'Etat z dodatkami', sub: 'np. za funkcję kierowniczą', value: 12 },
        { label: 'Łącznie we wszystkich placówkach', sub: 'najwyżej dwa etaty', value: 16, marked: true },
      ],
    },
  },
  '/analizy/odpowiedzialnosc-zawodowa-lekarzy/': {
    bars: {
      head: `Odebrania prawa do zawodu na 100 tys. lekarzy rocznie, ${WINDOW.from}–${WINDOW.to}`,
      rows: (['no', 'se', 'uk', 'pl'] as const).map(country),
    },
  },
};

export const ogPages: Record<string, OgPage> = {
  '/': {
    eyebrow: 'Przewodnik po pracy i zarobkach',
    title: 'Zarobki lekarzy.\nBez emocji,\nze źródłami',
    // obrazek domyślny (też dla tras bez własnego wpisu): okładka z siatki kropek, wersja ciemna jak w propozycji motywu
    cover: { lines: ['Zarobki lekarzy', 'bez emocji, ze źródłami'], label: 'zarobkilekarzy.pl', theme: 'ciemny' },
    footer: { text: 'Każda liczba ze źródłem', flags: true },
  },
  '/dane/': {
    eyebrow: 'Dane',
    title: 'Zarobki lekarzy\ni pieniądze publiczne',
    lead: 'Wynagrodzenia, budżet NFZ, długi szpitali i kolejki — każda liczba ze źródłem.',
    media: 'stat',
    stat: {
      // roczna = 12 × mediana miesięczna z lutego 2026 r., dlatego szacunek
      value: formatPL(MEDIANS.specKontrakt * 12),
      unit: 'zł',
      label: 'Roczna mediana kontraktu specjalisty',
      desc: 'brutto, z jednej umowy w jednym szpitalu: 12 × mediana miesięczna z lutego 2026 r.',
      accuracy: 'est',
      source: 'AOTMiT · Rzeczpospolita, 27.05.2026',
    },
    footer: { text: `Dział danych · stan na ${formatDate(site.updated)}`, flags: true },
  },
  // liczby z danych monitoringu — po regeneracji JSON-a obrazek aktualizuje się sam
  '/dane/monitoring-watchdog/': {
    eyebrow: 'Dane · przeglądarka monitoringu',
    title: 'Kto ujawnił\npłace lekarzy,\na kto milczy',
    bars: {
      head: `Odpowiedzi ${formatPL(monitoring.facilities.length)} placówek`,
      rows: [
        { label: 'Ujawniły dane', value: answered('disclosed'), sub: `w tym ${formatPL(fullLists)} ${plural(fullLists, ['pełna lista', 'pełne listy', 'pełnych list'])} płac`, marked: true },
        { label: 'Odmówiły', value: answered('refused') },
        { label: 'Nie odpowiedziały', value: answered('silence') },
        { label: 'Inna odpowiedź, bez danych', value: answered('other', 'receipt', 'forwarded', 'unknown') },
      ],
    },
    footer: { text: `Watchdog Polska, płace za ${monitoring.year} r.` },
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
  // osobna trasa (wpis kolekcji bez treści, więc bez presetu artykułu) — na obrazku wykresy samego narzędzia
  '/analizy/symulator-podazy-lekarzy/': {
    eyebrow: 'Analizy · narzędzie',
    title: 'Symulator\npodaży lekarzy',
    lead: 'Zmień limit przyjęć na medycynę i zobacz, ilu lekarzy będzie w 2040 i 2050 r.',
    panels: simulatorOgPanels(),
    footer: { text: 'Start modelu: rejestr NIL co do osoby' },
  },
  '/analizy/symulator-podazy-pielegniarek/': {
    eyebrow: 'Analizy · narzędzie',
    title: 'Symulator\npodaży pielęgniarek',
    lead: 'Zmień dopływ do zawodu i wiek odejścia — zobacz, ile pielęgniarek będzie pracować i jak zmieni się drabina wieku.',
    panels: nurseSimulatorOgPanels(),
    footer: { text: 'Start modelu: zatrudnione z rejestru CRPiP' },
  },
  '/egzamin/': {
    eyebrow: 'Egzamin LEK',
    title: 'Sprawdź się\nna pytaniach LEK',
    lead: '200 pytań, 4 godziny, próg 56%. Nauka, szybki test albo pełny egzamin na czas — ze statystyką zdających.',
    // ta sama lista co infografika „Jaka część zdających zdaje egzamin” (lib/infografiki/zestawy.ts)
    bars: {
      head: 'Zdało egzamin w 2025 r., wszystkie podejścia',
      unit: '%',
      rows: EXAMS_2025.map((e) => ({ label: e.name, value: passRate(e), display: formatPL(passRate(e), 1), marked: e.key === 'lek' })),
    },
  },
  // etap i wersja z projekt-ustawy.ts — zmiana etapu zmienia obrazek
  '/postulat/': {
    eyebrow: 'Postulat',
    title: 'Jawne kwoty,\nchronione nazwiska',
    lead: 'Łączne wynagrodzenie każdej osoby z placówek z umową z NFZ — co kwartał, jako otwarte dane, bez nazwisk.',
    panels: [{ head: 'Wynagrodzenie jednej osoby', height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, sumSchema(MEDIA_W, PANEL_H, POSTULAT_PIECES, demoId)) }],
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
  '/aktualnosci/': {
    eyebrow: 'O serwisie',
    title: 'Aktualności',
    lead: 'Co zmienia się na stronie i w projekcie — z datą przy każdym wpisie.',
    photo: newsIllustration.src,
    position: '70% 50%',
    footer: { text: 'Co nowego w projekcie' },
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
  // bez liczby partii i dat wysyłki — na OG nic, co się zmienia (X trzyma obrazek w pamięci).
  // Gotowa grafika (barometr publiczna–prywatna) zamiast generatora; tytuł zostaje jako og:image:alt.
  // Przy zmianie tekstu albo obszarów grafikę trzeba wygenerować od nowa.
  '/barometr-polityczny/': {
    image: barometrOg,
    eyebrow: 'Barometr polityczny',
    title: 'Co partie proponują\nw ochronie zdrowia',
    lead: 'Te same pytania dla każdej partii. Odpowiedzi publikujemy bez zmian w treści, z dokumentami wskazanymi przez partię.',
    footer: { text: 'Pieniądz publiczny, nie polityka' },
  },
  // Opis partii: logo partii (ta sama powierzchnia dla każdej), bez dat odpowiedzi i aktualizacji.
  // Wzór na fikcyjnej partii — logo serwisu w miejscu logo partii, jak na samej stronie.
  ...Object.fromEntries(
    barometrProfiles.map((profile): [string, OgPage] => [
      profile.href,
      {
        eyebrow: profile.example ? 'Barometr polityczny · wzór' : 'Barometr polityczny',
        title: profile.name,
        lead: 'Stanowisko w sześciu obszarach polityki zdrowotnej, w nadesłanym brzmieniu.',
        leadAlways: true,
        logo: profile.example ? 'serwis' : profile.logo,
        footer: { text: 'Pieniądz publiczny, nie polityka' },
      },
    ]),
  ),
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
  // gra i katalog orzeczeń sądów lekarskich: pieczątki jak w katalogu (ui/Stamp), kary ze skali art. 83 ust. 1
  [GAME_HREF]: {
    eyebrow: 'Gra · prawdziwe orzeczenia',
    title: 'Czy orzekasz\njak sąd lekarski?',
    lead: 'Fakty z prawomocnych orzeczeń. Wybierz karę ze skali z ustawy i porównaj z wyrokiem.',
    footer: { text: 'Orzeczenia z portalu Naczelnej Izby Lekarskiej' },
    stamps: [{ kicker: 'Sąd orzekł', label: COURT_SCALE[2].label, level: 2 }],
  },
  [CATALOG_HREF]: {
    eyebrow: 'Katalog orzeczeń',
    title: 'Za co i jak karzą\nsądy lekarskie',
    lead: 'Streszczenia prawomocnych orzeczeń: co ustalił sąd, jaki był zarzut i jaka zapadła kara.',
    footer: { text: 'Orzeczenia z portalu Naczelnej Izby Lekarskiej' },
    stamps: [
      { kicker: 'Sąd orzekł', label: 'Uniewinnienie', level: 0, tone: 'muted' },
      { kicker: 'Sąd orzekł', label: COURT_SCALE[3].label, level: 3 },
      { kicker: 'Sąd orzekł', label: COURT_SCALE[6].label, level: 6 },
    ],
  },
  // osobna strona każdej sprawy z katalogu: tytuł sprawy i pieczątka z orzeczoną karą
  ...Object.fromEntries(
    COURT_CASES.map((c): [string, OgPage] => [
      caseHref(c.id),
      {
        eyebrow: 'Sąd lekarski · orzeczenie',
        title: c.title,
        lead: c.summary,
        footer: { text: 'Orzeczenia z portalu Naczelnej Izby Lekarskiej' },
        stamps: [{ kicker: 'Sąd orzekł', label: verdictLabel(c), level: c.verdict.level, tone: c.verdict.level ? 'blue' : 'muted' }],
      },
    ]),
  ),
  '/szukaj/': {
    eyebrow: 'Wyszukiwarka',
    title: 'Szukaj w serwisie',
    lead: 'Artykuły, zestawienia danych i pojęcia ze słowniczka.',
  },
};
