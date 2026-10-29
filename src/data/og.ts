/**
 * Obrazki OG stron spoza kolekcji (trasa → treść obrazka).
 * Artykuły mają je automatycznie (lib/og/presets.ts) i nadpisują polem `og` we frontmatterze.
 * Strona główna jest też obrazkiem domyślnym dla tras bez własnego wpisu.
 */
import type { OgPage, OgStamp } from '@/types';
import { danePage, dataTopics } from '@/data/dane';
import { getArticle, getTopicGroups } from '@/lib/content';
import { lastUpdated } from '@/i18n/entries';
import { DATA_TOPICS } from '@/types';
import { formatDate, formatPL, plural } from '@/lib/format';
import { monitoring, type Response } from '@/lib/monitoring';
import { currentStage, projekt, stages } from '@/data/projekt-ustawy';
import { ui } from '@/i18n/ui';
import { adresaci } from '@/data/adresaci';
import { writeToolOn } from '@/data/dzialaj';
import { helpline } from '@/data/prawa-pacjenta';
import { MEDIANS } from '@/data/rozklad-wynagrodzen';
import sorOgSnapshot from '@/data/sor/migawka-og.json';
import { frozenLayer } from '@/lib/sor/map';
import { simulatorOgPanels } from '@/lib/podaz/og';
import { nurseSimulatorOgPanels } from '@/lib/podaz/pielegniarki/og';
import { columnChart, label, monthGrid, stageTrack, svg, virus } from '@/lib/og/charts';
import { hemicycle, tallyClubs } from '@/lib/sejm/hemicycle';
import { tokenColor } from '@/lib/tokens';
import { CLUBS_LAST, limityVoting } from '@/data/glosowania';
import { ageRows, dayRows } from '@/data/ciecie-limitow-na-medycyne';
import { BUDGET } from '@/data/budzet-nfz';
import filmDobaOg from '@/assets/aktualnosci/film-doba-og.webp';
import stronaPoAngielsku from '@/assets/aktualnosci/strona-po-angielsku.webp';
import { AOS_FIRST, AOS_LAST, WHC_2022, WHC_2024, pct as change } from '@/data/wizyty-prywatne-kolejka-cena';
import { funnelRows } from '@/data/odsiew-na-medycynie';
import { CONTROL_COUNTS, CONTROL_GRID } from '@/data/kontrola-nfz';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { COUNTRIES, WINDOW, ratePer100k, type CountryKey } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';
import { pseudonymDemo } from '@/data/postulat';
import { createHmac } from 'node:crypto';
import { KANADA, TAJWAN } from '@/lib/siatka/kraje';
import { globeOgBody } from '@/lib/swiat/og';
import { CASES as COURT_CASES, CATALOG_HREF, GAME_HREF, SCALE as COURT_SCALE, caseHref, verdictLabel } from '@/data/sad-lekarski';

import barometrOg from '@/assets/img/barometr-polityczny-og.png';
import mobywatelOg from '@/assets/mobywatel/og-moje-zdrowie.png';
import { newsIllustration } from '@/lib/news';
import { barometrPoliticians, barometrProfiles } from '@/data/barometr-polityczny';

// odpowiedzi placówek na wniosek o płace (monitoring Watchdog Polska)
const answered = (...r: Response[]) => monitoring.facilities.filter((f) => r.includes(f.response)).length;
const fullLists = monitoring.facilities.filter((f) => f.payroll).length;

/* ---------- Wykresy na obrazkach (strony i artykuły) ---------- */

const MEDIA_W = 470; // kolumna mediów w lib/og/render.ts
const PANEL_H = 440;
const TWO_PANELS_H = 196;

// Projekt ustawy: droga do Sejmu z projekt-ustawy.ts — przestawienie etapu zmienia obrazek
const STAGE_STATE = ui.pl.blocks.stage;
const TRACK_H = 470;
const billTrack = stageTrack(
  stages.map((s) => ({ state: s.state, kicker: s.date ? `${STAGE_STATE[s.state]} · ${formatDate(s.date)}` : STAGE_STATE[s.state], label: s.label, note: s.note })),
  MEDIA_W,
  TRACK_H,
);

// Postulat: identyfikator z przykładu na /postulat/ na zaczernionym nazwisku
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
// katalog orzeczeń sądów lekarskich: trzy rozstrzygnięcia z różnych końców skali (strona katalogu i wpis o nim)
const COURT_STAMPS: OgStamp[] = [
  { kicker: 'Sąd orzekł', label: 'Uniewinnienie', level: 0, tone: 'muted' },
  { kicker: 'Sąd orzekł', label: COURT_SCALE[3].label, level: 3 },
  { kicker: 'Sąd orzekł', label: COURT_SCALE[6].label, level: 6 },
];

// pułap płacy medyków w płacach minimalnych: mnożniki zamiast złotych, bo kwoty zmieniają się co roku
// z płacą minimalną, a na OG nic, co się zmienia (analiza i wpis o niej w aktualnościach)
const LIMITY_BARS: OgPage['bars'] = {
  head: 'Pułap miesięczny w płacach minimalnych',
  unit: '×',
  rows: [
    { label: 'Pół etatu w jednej placówce', value: 4 },
    { label: 'Pełny etat w jednej placówce', value: 8 },
    { label: 'Etat z dodatkami', sub: 'np. za funkcję kierowniczą', value: 12 },
    { label: 'Łącznie we wszystkich placówkach', sub: 'najwyżej dwa etaty', value: 16, marked: true },
  ],
};

/** Kontrola NFZ: siatka miesięcy pod lupą — szkło nad miesiącami, które sprawdziła kontrola; podpisy w języku obrazka. */
const CONTROL_PL = {
  head: 'Miesiące rozliczeń H52 i H53, 2021–2025',
  axis: ['I', 'IV', 'VII', 'X'],
  legend: ['sprawdzonych przez kontrolę NFZ', 'niesprawdzonych — H52', 'niesprawdzonych — H53 po zmianie kodu'],
};

export function controlPanels(text: typeof CONTROL_PL = CONTROL_PL): OgPage['panels'] {
  const { body, height } = monthGrid({
    ...CONTROL_GRID,
    after: CONTROL_GRID.switchAt,
    axis: text.axis,
    lens: { at: '2023-05' },
    legend: [
      { cell: 'on', count: String(CONTROL_COUNTS.checked), text: text.legend[0] },
      { cell: 'rest', count: String(CONTROL_COUNTS.h52), text: text.legend[1] },
      { cell: 'after', count: String(CONTROL_COUNTS.h53), text: text.legend[2] },
    ],
  }, MEDIA_W);
  return [{ head: text.head, height, svg: svg(MEDIA_W, height, body) }];
}

/** Podpisy półkola: legenda (za, przeciw, wstrzymało się, nie głosowało) i opis wyniku pod łukiem. */
const HEMICYCLE_PL = { legend: ['za', 'przeciw', 'wstrz.', 'nie gł.'], result: 'za : przeciw' };

/** Półkole głosowania nad ustawą o limitach płac (jak `sejm/Hemicycle` na stronie) — barwy dzienne, podpisy przez label(). */
/** Data „stan na” w stopce obrazka działu danych — ta sama co „Aktualizacja” na /dane/ (najświeższy materiał w spisie). */
export const dataUpdated = lastUpdated([
  await getArticle(danePage.flagship),
  ...(await getTopicGroups(DATA_TOPICS, dataTopics)).flatMap((g) => g.articles),
]);

export function hemicyclePanel(text: typeof HEMICYCLE_PL = HEMICYCLE_PL): string {
  const W = MEDIA_W, ARC_H = 250, H = 300;
  const tok = (name: string) => tokenColor(name, false);
  const { seats, dot } = hemicycle(limityVoting.votes, tallyClubs(limityVoting.votes, CLUBS_LAST), { width: W, height: ARC_H });
  const f = (n: number) => n.toFixed(1);
  const mark = (vote: string, x: number, y: number, r = dot) =>
    vote === 'YES' ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${tok('blue')}"/>`
    : vote === 'NO' ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.78)}" fill="none" stroke="${tok('ink')}" stroke-width="1.3"/>`
    : vote === 'ABSTAIN' ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.5)}" fill="${tok('text')}"/>`
    : `<path d="M${f(x - r * 0.55)} ${f(y)}h${f(r * 1.1)}M${f(x)} ${f(y - r * 0.55)}v${f(r * 1.1)}" stroke="${tok('chart')}" stroke-width="1.2"/>`;
  const { yes, no, abstain, absent } = limityVoting.totals;
  const legend = [['YES', `${text.legend[0]} ${yes}`], ['NO', `${text.legend[1]} ${no}`], ['ABSTAIN', `${text.legend[2]} ${abstain}`], ['ABSENT', `${text.legend[3]} ${absent}`]]
    .map(([v, text], i) => mark(v, 8 + i * 118, H - 14, 6) + label(20 + i * 118, H - 9, text));
  return svg(W, H, seats.map((s) => mark(s.vote.vote, s.x, s.y)).join('')
    + label(W / 2, ARC_H - 40, `${yes} : ${no}`, ['big', 'strong'], 'middle')
    + label(W / 2, ARC_H - 12, text.result, [], 'middle')
    + legend.join(''));
}

export const ogArticleMedia: Record<string, Pick<OgPage, 'bars' | 'panels' | 'dots' | 'stamps' | 'illustration' | 'position'>> = {
  '/mechanizmy/kontrola-nfz/': { panels: controlPanels() },
  '/analizy/covid-pieniadz-publiczny/': { panels: [{ height: MEDIA_W, svg: svg(MEDIA_W, MEDIA_W, virus(MEDIA_W)) }] },
  // wpis w aktualnościach: pieczątki jak na obrazku katalogu (okładka wpisu przycięta pokazałaby tylko tytuł)
  '/aktualnosci/gra-i-katalog-orzeczen/': { stamps: COURT_STAMPS },
  // wpis o filmie „Doba”: pionowy wariant miniatury w kolorze (miniatura 16:9 przycięta do panelu gubiłaby liczby)
  '/aktualnosci/film-doba/': { illustration: filmDobaOg },
  // wpis o wersji angielskiej: ilustracja w kolorze, kadr na stronie angielskiej (z przodu)
  '/aktualnosci/strona-po-angielsku/': { illustration: stronaPoAngielsku, position: '66% 50%' },
  // wpis o analizie limitów płac: paski jak na obrazku analizy (zdjęciem wpisu jest obrazek OG analizy)
  '/aktualnosci/limity-plac-medykow-w-sejmie/': { bars: LIMITY_BARS },
  // wpis o uchwaleniu ustawy: półkole głosowania nr 149 (jak w analizie i we wpisie)
  '/aktualnosci/sejm-uchwalil-limity-plac-medykow/': { panels: [{ head: 'Sejm, 22.10.2026 — głosowanie nad całością', height: 300, svg: hemicyclePanel() }] },
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
  // po uchwaleniu ustawy: półkole głosowania nr 149 zamiast pasków 4×–16× (paski zostają na wpisie z 20.10)
  '/analizy/limity-wynagrodzen-medykow/': { panels: [{ head: 'Sejm, 22.10.2026 — głosowanie nad całością', height: 300, svg: hemicyclePanel() }] },
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
    footer: { text: `Dział danych${dataUpdated ? ` · stan na ${formatDate(dataUpdated)}` : ''}`, flags: true },
  },
  // liczby z danych monitoringu — po regeneracji JSON-a obrazek aktualizuje się sam
  // glob w kolorach widoku „× przeciętna płaca”; bez napisów, ten sam rysunek na obrazku EN
  '/dane/zarobki-lekarzy-na-swiecie/': {
    eyebrow: 'Dane · porównanie międzynarodowe',
    title: 'Ile zarabia lekarz\nna świecie',
    lead: 'Płaca lekarza na tle przeciętnej płacy w kraju, kwota i siła nabywcza.',
    panels: [{ height: PANEL_H, svg: svg(MEDIA_W, PANEL_H, globeOgBody(MEDIA_W, PANEL_H)) }],
    footer: { text: 'OECD i krajowe urzędy statystyczne' },
  },
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
  '/ustawy/': {
    eyebrow: 'Przepisy',
    title: 'Ustawy\nna stronie',
    lead: 'Obowiązujące ustawy, projekty w Sejmie i projekt obywatelski: co mówią o płacach i jawności.',
    footer: { text: 'Opisy na podstawie tekstu aktu' },
    pictogram: 'paragraf',
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
      rows: EXAMS_2025.filter((e) => !e.approx).map((e) => ({ label: e.name, value: passRate(e), display: formatPL(passRate(e), 1), marked: e.key === 'lek' })),
    },
  },
  // bez wersji i etapu projektu: na obrazku nic, co się zmienia
  '/postulat/': {
    eyebrow: 'Postulat',
    title: 'Jawne kwoty,\nchronione nazwiska',
    redact: demoId,
    footer: { text: 'Łączna kwota każdej osoby · co kwartał · stały identyfikator' },
  },
  '/postulat/projekt-ustawy/': {
    eyebrow: 'Postulat · projekt ustawy',
    title: 'Nowelizacja art. 27a\nustawy o działalności\nleczniczej',
    lead: 'Co kwartał, bez nazwisk, z sankcją — dwa nowe punkty, bez zmian w obowiązujących przepisach.',
    panels: [{ head: 'Droga projektu do Sejmu', height: TRACK_H, svg: svg(MEDIA_W, TRACK_H, billTrack) }],
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
  // Wypowiedź polityka pod nazwiskiem: imię i nazwisko, bez dat i liczby obszarów.
  ...Object.fromEntries(
    barometrPoliticians.map((politician): [string, OgPage] => [
      politician.href,
      {
        eyebrow: politician.example ? 'Barometr polityczny · wzór' : 'Barometr polityczny · politycy',
        title: politician.name,
        lead: 'Wypowiedź pod własnym nazwiskiem o polityce zdrowotnej, w nadesłanym brzmieniu.',
        leadAlways: true,
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
    stamps: COURT_STAMPS,
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
  // Podprojekt „Prototypy mObywatela” (src/mobywatel/) — usunąć razem z nim. Gotowa grafika ze zrzutem
  // telefonu (src/mobywatel/prototypy/narzedzia/og.mjs); wariant pod /mobywatel/<wariant>/ to statyczna
  // aplikacja spoza BaseLayout — tagi og:* dopisuje mu zloz.mjs.
  '/mobywatel/': { image: mobywatelOg, title: 'Moje zdrowie w mObywatelu — prototyp na mObywatel Challenge' },
  '/mobywatel/moje-zdrowie/': { image: mobywatelOg, title: 'Moje zdrowie w mObywatelu — klikalny prototyp' },
};
