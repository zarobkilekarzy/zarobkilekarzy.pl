/**
 * Strona-ścieżka /droga-do-zawodu/.
 * Osią strony jest czas: rok matury i dziedzina czytelnika wstawiają lata na linijce i przy czterech przystankach.
 * Liczby pochodzą z modułów źródłowych. Tu tylko czas szkolenia z załącznika nr 5, liczby z wyników CEM i krótkie wprowadzenia.
 * Moduł czyta też wersja angielska: src/data/en/droga-do-zawodu.ts.
 */
import { lengthLabel, roadOf, type RoadLabel } from '@/components/droga-do-zawodu/road';
import { FIRST_YEAR, GRADUATES_PL, LINKS as DROPOUT_LINKS, PES_2025_ALL, PES_LINK, pesYear } from '@/data/odsiew-na-medycynie';
import { AT_LEAST_80, CREDIT, ELA_ROWS, LINKS as STUDY_LINKS, OLD_NEW, PLAN_TOTAL, TUITION, UJ_LEKARSKI, UW_LEKARSKI } from '@/data/studia-lekarskie';
import { AUTUMN_2025, LINKS as SPEC_LINKS, PRIORITY_FIELDS, RESIDENT_PAY, SPECIALTIES, spec } from '@/data/wedlug-specjalizacji';
import { formatPL, plural } from '@/lib/format';

export const pathPage = {
  title: 'Droga do zawodu',
  docTitle: 'Droga do zawodu lekarza: od matury do specjalisty',
  eyebrow: 'Ścieżka · od matury do specjalisty',
  description: 'Od przyjęcia na studia do tytułu specjalisty mija od 11 do 13 lat. Rekrutacja, studia, LEK ze stażem i specjalizacja: co czeka na każdym etapie.',
  lead: 'Od przyjęcia na studia do tytułu specjalisty mija od 11 do 13 lat, nie licząc przerw i czekania na miejsce. Cztery przystanki: rekrutacja, studia, LEK ze stażem i specjalizacja.',
};

/* ---------- Dziedziny do wyboru ---------- */

/**
 * Minimalny czas szkolenia lekarza bez wcześniejszej specjalizacji, w miesiącach:
 * rozporządzenie MZ z 4.05.2023, Dz.U. 2023 poz. 975, zał. nr 5, ostatnia kolumna (odczyt 31.10.2026).
 */
export const FIELD_MONTHS: Record<string, number> = {
  'anestezjologia': 72,
  'chirurgia-ogolna': 72,
  'chirurgia-plastyczna': 72,
  'choroby-pluc': 60,
  'choroby-wewnetrzne': 60,
  'choroby-zakazne': 60,
  'dermatologia': 60,
  'endokrynologia': 60,
  'gastroenterologia': 72,
  'geriatria': 60,
  'hematologia': 60,
  'kardiologia': 60,
  'medycyna-paliatywna': 48,
  'medycyna-pracy': 60,
  'medycyna-ratunkowa': 60,
  'medycyna-rodzinna': 48,
  'neonatologia': 60,
  'neurologia': 60,
  'okulistyka': 48,
  'onkologia-kliniczna': 72,
  'ortopedia': 60,
  'otorynolaryngologia': 60,
  'patomorfologia': 60,
  'pediatria': 60,
  'poloznictwo-ginekologia': 60,
  'psychiatria': 60,
  'radiologia': 54,
  'rehabilitacja-medyczna': 60,
  'urologia': 72,
};

const money = (n: number) => formatPL(n, 2);

/** Dziedziny z zestawienia „Według specjalizacji”, z napisami do karty; brak danych pisze się wprost. */
export const fields = [...SPECIALTIES]
  .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  .map((s) => {
    const months = FIELD_MONTHS[s.id];
    if (!months) throw new Error(`[droga-do-zawodu] brak czasu szkolenia dla ${s.id}`);
    const pay = s.priority ? RESIDENT_PAY.priority : RESIDENT_PAY.other;
    return {
      id: s.id,
      name: s.name,
      months,
      length: lengthLabel(months),
      priority: s.priority ? 'Dziedzina priorytetowa: wyższa pensja rezydenta' : 'Poza listą dziedzin priorytetowych',
      payFirst: `${money(pay.first)} zł`,
      payLater: `po dwóch latach ${money(pay.later)} zł`,
      candidates: typeof s.candidates === 'number' ? formatPL(s.candidates, 2) : s.candidates === 'below-1' ? 'poniżej 1' : 'nie podano',
      candidatesNote: typeof s.candidates === 'number' ? 'kandydata na jedno miejsce' : s.candidates === 'below-1' ? 'mniej chętnych niż miejsc' : 'CMKP nie podało tej liczby',
      places: formatPL(s.rez + s.nonRez),
      placesNote: `${formatPL(s.rez)} ${plural(s.rez, ['rezydenckie', 'rezydenckie', 'rezydenckich'])}, ${formatPL(s.nonRez)} ${plural(s.nonRez, ['pozarezydenckie', 'pozarezydenckie', 'pozarezydenckich'])}`,
      pes: s.pes ? `${formatPL((s.pes.passed / s.pes.n) * 100, 1)}%` : 'nie podano',
      pesNote: s.pes ? `z ${formatPL(s.pes.n)} podejść` : 'CEM nie publikuje wyników testu',
      rate: s.rate ? `${formatPL(s.rate, 2)} zł` : 'nie podano',
      rateNote: s.rate ? 'średnio za godzinę, brutto' : 'dziedziny nie ma w raporcie',
    };
  });

export type RoadField = (typeof fields)[number];

/** Stan startowy strony, zanim czytelnik cokolwiek wybierze; bez JS strona przy nim zostaje. */
export const startRoad = { matura: 2027, field: spec('choroby-wewnetrzne').id };
export const startField = fields.find((f) => f.id === startRoad.field)!;
export const startLabels = roadOf(startRoad.matura, startField.months).labels;
export const MATURA_RANGE = { min: 2015, max: 2040 };

/* ---------- Przystanki ---------- */

export interface RoadLink {
  /** id artykułu; bez niego potrzebne `href`, `label` i `text` */
  ref?: string;
  href?: string;
  label?: string;
  /** opis strony spoza kolekcji albo działu artykułu */
  text?: string;
  anchor?: string;
}

export interface RoadStop {
  id: string;
  name: string;
  question: string;
  /** które lata pokazać przy przystanku */
  span: RoadLabel;
  /** ile trwa etap; przy specjalizacji podmienia go wybór dziedziny */
  length?: { label: string; key?: RoadLabel };
  lead: string;
  /** objaśnienie mechanizmu, z HTML (`<strong>` przy kluczowych liczbach); każda teza ma adres w `sources` */
  body: string[];
  sources: { label: string; href: string }[];
  unknown: string;
  figure: { value: string; suffix?: string; unit: string };
}

const dropout = ELA_ROWS.reduce<Record<string, number>>((all, r) => ({ ...all, [r.major]: r.secondYear }), {});
const bio = AT_LEAST_80.find((r) => r.subject === 'biologia')!.share;
const chem = AT_LEAST_80.find((r) => r.subject === 'chemia')!.share;
const uj = [UJ_LEKARSKI[0], UJ_LEKARSKI[2]];
const startedPl = FIRST_YEAR.find((r) => r.year === '2018/19')!.pl.first;
const finishedPl = GRADUATES_PL['2023/24'];
const placesAll = AUTUMN_2025.rez + AUTUMN_2025.nonRez;
const placesTaken = AUTUMN_2025.takenRez + AUTUMN_2025.takenNonRez;
const emptyShare = Math.round(((placesAll - placesTaken) / placesAll) * 100);
const pes2025 = formatPL(pesYear(PES_2025_ALL).rate, 1);
const universities = OLD_NEW.old + OLD_NEW.new;
/** Uczelnie, które publikują próg (studia-lekarskie.mdx, sekcja „Matura i rekrutacja”). */
const PUBLISHED_THRESHOLDS = 14;

export const stops: RoadStop[] = [
  {
    id: 'rekrutacja',
    name: 'Matura i rekrutacja',
    question: 'Jak się dostać',
    span: 'year',
    length: { label: 'matura w maju, studia od października' },
    lead: 'Liczy się przede wszystkim rozszerzona biologia i chemia, a na wielu uczelniach także matematyka albo fizyka. Każda uczelnia ma własny wzór, więc progi da się porównać tylko jako procent maksymalnej liczby punktów.',
    body: [
      `Limit przyjęć na rok 2026/27 to <strong>${OLD_NEW.allTotal} miejsc</strong> na ${universities} uczelniach, z czego ${OLD_NEW.allPl} to studia stacjonarne po polsku. Na lekarski na UW przypadało w 2026 r. <strong>${formatPL(UW_LEKARSKI.perPlace, 1)} zgłoszenia na miejsce</strong>, a jedna osoba może się zgłosić na kilka kierunków.`,
      `Próg to wynik ostatniej osoby przyjętej, więc rośnie, gdy chętnych przybywa, a miejsc nie. Na UJ w latach 2024–2026 miejsc było ${UJ_LEKARSKI[0].places}, ${UJ_LEKARSKI[1].places} i ${UJ_LEKARSKI[2].places}, kandydatów przybyło z ${formatPL(uj[0].candidates)} do ${formatPL(uj[1].candidates)}, a próg wzrósł z ${formatPL(uj[0].threshold, 2)} do <strong>${formatPL(uj[1].threshold, 2)} pkt</strong>. Dla skali: w 2026 r. co najmniej 80% z rozszerzonej biologii miało ${bio}% zdających, a z rozszerzonej chemii ${chem}%.`,
      `Studia stacjonarne po polsku na uczelniach publicznych są bezpłatne. Rok studiów niestacjonarnych na uczelniach publicznych, których cenniki sprawdziliśmy, kosztuje od <strong>${TUITION.publicMin} do ${TUITION.publicMax} zł</strong>. Kredyt na studia medyczne to najwyżej ${formatPL(CREDIT.perSemester)} zł na semestr, mniej niż czesne na większości uczelni.`,
    ],
    sources: [
      { label: 'Dz.U. 2026 poz. 1167', href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/1167/text.pdf' },
      { label: 'UW, kandydaci na miejsce', href: STUDY_LINKS.uwKand },
      { label: 'UJ, zestawienie rekrutacji', href: STUDY_LINKS.ujStat },
      { label: 'CKE, centyle 2026', href: STUDY_LINKS.cke },
      { label: 'wykaz cenników uczelni', href: '/analizy/studia-lekarskie/#ile-kosztuja-studia' },
      { label: 'M.P. 2026 poz. 424', href: 'https://api.sejm.gov.pl/eli/acts/MP/2026/424/text.pdf' },
      { label: 'MZ, interpelacja 18621', href: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDX3JFB/i18621-o1.pdf' },
    ],
    unknown: `Próg opublikowało ${PUBLISHED_THRESHOLDS} z ${universities} uczelni, pozostałe pokazują wyniki tylko kandydatom na ich kontach. Nie wiadomo też, ile państwo wydaje na studenta bezpłatnych studiów: według MZ w subwencji dla uczelni „nie jest możliwe wyodrębnienie środków” na ten kierunek.`,
    figure: { value: formatPL(UW_LEKARSKI.perPlace, 1), unit: 'zgłoszenia na miejsce na lekarskim na UW w 2026 r.' },
  },
  {
    id: 'studia',
    name: 'Sześć lat studiów',
    question: 'Co czeka na studiach',
    span: 'studies',
    length: { label: '6 lat' },
    lead: `Studia trwają 12 semestrów i mają co najmniej ${formatPL(5700)} godzin zajęć. Na WUM rocznik 2026/27 ma w planie ${formatPL(PLAN_TOTAL.hours)} godzin i ${PLAN_TOTAL.exams} egzaminów. Pierwsze lata to nauki podstawowe, od czwartego roku dominują przedmioty kliniczne, a szósty to praktyka na oddziałach.`,
    body: [
      `Na drugi rok w terminie przechodzi <strong>${formatPL(dropout['Kierunek lekarski'], 1)}%</strong> studentów lekarskiego, na prawie ${formatPL(dropout['Prawo'], 1)}%, a na matematyce ${formatPL(dropout['Matematyka'], 1)}% (roczniki 2016–2018, ta sama miara dla wszystkich kierunków).`,
      `Z Polaków, którzy zaczynają medycynę, w terminie kończy ok. <strong>80%</strong>: ${formatPL(finishedPl)} absolwentów w 2023/24 wobec ${formatPL(startedPl)} studentów pierwszego semestru w 2018/19. Najwięcej osób odpada na pierwszym roku.`,
      'Większość godzin anatomii to ćwiczenia w prosektorium. Od roku 2025/26 przepisy pozwalają prowadzić <strong>od 5% do 15%</strong> ćwiczeń z nauk morfologicznych w warunkach symulowanych, np. na wirtualnym stole anatomicznym.',
    ],
    sources: [
      { label: 'Dz.U. 2021 poz. 755', href: STUDY_LINKS.standard },
      { label: 'WUM, program studiów', href: STUDY_LINKS.wumPlan },
      { label: 'ELA, dane źródłowe', href: STUDY_LINKS.ela },
      { label: 'MZ, studenci i absolwenci', href: DROPOUT_LINKS.mz },
      { label: 'WUM, przewodnik dla I roku', href: STUDY_LINKS.wumPrzewodnik },
      { label: 'Dz.U. 2025 poz. 1133', href: STUDY_LINKS.standard2025 },
      { label: 'Prawo o szkolnictwie wyższym, art. 344', href: 'https://eli.gov.pl/api/acts/DU/2024/1571/text.html' },
    ],
    unknown: 'Dlaczego studenci odpadają. System POL-on przechowuje datę skreślenia z listy studentów, ale nie jego przyczynę, a powód trafia tylko do decyzji uczelni.',
    figure: { value: formatPL(5700), unit: 'godzin zajęć to minimum na 12 semestrów' },
  },
  {
    id: 'staz',
    name: 'LEK i staż',
    question: 'Co po dyplomie',
    span: 'internship',
    length: { label: '13 miesięcy' },
    lead: 'Dyplom nie daje jeszcze pełnego prawa wykonywania zawodu. Absolwent dostaje je najpierw tylko na czas stażu podyplomowego, a pełne po stażu i po zdaniu Lekarskiego Egzaminu Końcowego.',
    body: [
      'LEK to <strong>200 pytań</strong> testowych, a zdaje się od <strong>56%</strong> poprawnych odpowiedzi. W pierwszym podejściu zdało jesienią 2025 r. 96,0% zdających, a jesienią 2026 r. <strong>87,1%</strong>. Wynik liczy się też później, bo to przede wszystkim on ustala kolejność w rankingu na specjalizacje. Dlatego część lekarzy podchodzi jeszcze raz, choć już zdała.',
      'Staż trwa <strong>13 miesięcy</strong>. Część stała to choroby wewnętrzne (11 tygodni), pediatria i chirurgia (po 8), medycyna rodzinna (6), medycyna ratunkowa (3) i intensywna terapia (2), a przez 10 tygodni stażysta uczy się w dziedzinie, którą sam wybierze. Od 1 lipca 2026 r. jego wynagrodzenie zasadnicze to <strong>8 458,38 zł</strong> brutto miesięcznie.',
      'Ministerstwo Zdrowia przygotowało projekt ustawy, który skraca staż do sześciu miesięcy, a Naczelna Rada Lekarska się temu sprzeciwia. Na razie to projekt: jego przyjęcie zaplanowano w wykazie prac rządu na IV kwartał 2026 r.',
    ],
    sources: [
      { label: 'ustawa o zawodach lekarza, Dz.U. 2026 poz. 37', href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/37/text.pdf' },
      { label: 'CEM, wyniki LEK', href: DROPOUT_LINKS.cem },
      { label: 'Dz.U. 2023 poz. 377', href: 'https://api.sejm.gov.pl/eli/acts/DU/2023/377/text.pdf' },
      { label: 'MZ, wynagrodzenie stażysty', href: 'https://www.gov.pl/web/zdrowie/obwieszczenie-ministra-zdrowia-w-sprawie-wysokosci-zasadniczego-wynagrodzenia-miesiecznego-lekarza-stazysty-i-lekarza-dentysty-stazysty6' },
      { label: 'projekt UD384', href: 'https://www.gov.pl/web/premier/projekt-ustawy-o-zmianie-ustawy-o-zawodach-lekarza-i-lekarza-dentysty-oraz-niektorych-innych-ustaw8' },
      { label: 'NRL, stanowisko 3/26/X', href: 'https://nil.org.pl/articleToPdf/9288' },
    ],
    unknown: 'Dlaczego w pierwszym podejściu jesienią 2026 r. zdało mniej osób niż rok wcześniej. CEM nie podaje przyczyny spadku.',
    figure: { value: '87,1', suffix: '%', unit: 'zdało LEK w pierwszym podejściu jesienią 2026 r.' },
  },
  {
    id: 'specjalizacja',
    name: 'Specjalizacja',
    question: 'Kim zostać i jak długo to trwa',
    span: 'spec',
    length: { label: startLabels.specLen, key: 'specLen' },
    lead: 'Po stażu i LEK lekarz może leczyć samodzielnie. Żeby zostać chirurgiem, pediatrą albo lekarzem rodzinnym, musi jeszcze odbyć szkolenie specjalizacyjne: od czterech do sześciu lat pracy według programu, zakończone Państwowym Egzaminem Specjalizacyjnym (PES).',
    body: [
      `Rozporządzenie wymienia <strong>77 specjalizacji</strong>, a 69 z nich można zacząć zaraz po stażu. Rezydentury przyznaje i finansuje minister zdrowia: od 1 lipca 2026 r. wynagrodzenie zasadnicze to <strong>${money(RESIDENT_PAY.other.first)} zł</strong> brutto miesięcznie, a w ${PRIORITY_FIELDS.length} dziedzinach priorytetowych ${money(RESIDENT_PAY.priority.first)} zł. Miejsca pozarezydenckie to pozostałe wolne miejsca w placówkach uprawnionych do szkolenia. Pensji z puli ministra przy nich nie ma.`,
      'Egzaminu wstępnego nie ma. Wniosek składa się dwa razy w roku i można w nim wskazać do 15 wariantów, czyli połączeń dziedziny, województwa i trybu. Gdy chętnych jest więcej niż miejsc, kolejność ustala ranking, w którym liczy się przede wszystkim wynik LEK.',
      `W sumie miejsc jest więcej niż chętnych. Jesienią 2025 r. było ich ${formatPL(placesAll)}, przyjęcie potwierdziło ${formatPL(placesTaken)} lekarzy i lekarzy dentystów, więc puste zostało <strong>${emptyShare}%</strong>. W pojedynczych dziedzinach bywa odwrotnie: w chirurgii plastycznej na miejsce przypadało 7,47 kandydata.`,
      `PES to test ze 120 pytań, zdany od 60%, i egzamin ustny, z którego zwalnia co najmniej 75% z testu. W 2025 r. zdanych było <strong>${pes2025}%</strong> podejść do testu, a wśród osób zdających po raz pierwszy 89,5%.`,
    ],
    sources: [
      { label: 'Dz.U. 2023 poz. 975', href: 'https://api.sejm.gov.pl/eli/acts/DU/2023/975/text.pdf' },
      { label: 'Dz.U. 2026 poz. 856', href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/856/text.pdf' },
      { label: 'ustawa o zawodach lekarza, Dz.U. 2026 poz. 37', href: 'https://api.sejm.gov.pl/eli/acts/DU/2026/37/text.pdf' },
      { label: 'CMKP, wyniki jesieni 2025', href: 'https://www.cmkp.edu.pl/aktualnosci/opublikowano-ostateczne-wyniki-rekrutacji-na-specjalizacje-w-sesji-jesiennej-2025' },
      { label: 'zestawienie dyrektora CMKP, za: beautyrazem.pl', href: SPEC_LINKS.candidates },
      { label: 'CEM, wyniki testu PES', href: PES_LINK },
      { label: 'MZ, interpelacja 31481', href: 'https://api.sejm.gov.pl/sejm/term9/interpellations/attachment/ATTCDFH9U/i31481-o1.pdf' },
    ],
    unknown: 'Ilu lekarzy co roku kończy specjalizację. MZ tego nie podaje, bo wielu z nich szkolenie przedłuża, a jako przybliżenie wskazuje liczbę osób, które zdały PES. Wyników części ustnej CEM nie publikuje, więc znana jest tylko zdawalność testu.',
    figure: { value: String(emptyShare), suffix: '%', unit: 'miejsc specjalizacyjnych zostało pustych jesienią 2025 r.' },
  },
];

const TEXTS = 'Teksty na tym przystanku';
const studies = 'studia-lekarskie';

export const links: Record<string, { label: string; items: RoadLink[] }[]> = {
  rekrutacja: [{
    label: TEXTS,
    items: [
      { ref: studies },
      { ref: studies, anchor: '#stare-i-nowe-uczelnie', label: 'Stare i nowe uczelnie', text: `Od 2015/16 limit dostało kolejnych ${OLD_NEW.new} uczelni. Nowe są zwykle małe, a po progach nie widać podziału na stare i nowe.` },
      { ref: studies, anchor: '#ile-kosztuja-studia', label: 'Ile kosztują studia', text: 'Za które studia się płaci, ile kosztuje rok na uczelni publicznej i niepublicznej i kiedy umarza się kredyt na studia medyczne.' },
      { ref: studies, anchor: '#na-tle-innych-trudnych-kierunkow', label: 'Na tle innych trudnych kierunków', text: 'Próg, liczba chętnych i odsiew na tych samych miarach: prawo, psychologia, architektura, matematyka, fizyka i informatyka.' },
    ],
  }],
  studia: [{
    label: TEXTS,
    items: [
      { ref: studies, anchor: '#szesc-lat-przedmioty-i-egzaminy', label: 'Sześć lat: przedmioty i egzaminy', text: 'Nauki podstawowe i kliniczne, terminy egzaminów, wpis warunkowy i zajęcia przy pacjentach.' },
      { ref: 'odsiew-na-medycynie' },
      { ref: studies, anchor: '#anatomia-i-prosektorium', label: 'Anatomia i prosektorium', text: 'Ile godzin zajmuje anatomia, jak wygląda egzamin praktyczny, skąd uczelnie mają ciała do nauki, a do tego model kości i naczyń do obejrzenia.' },
      { ref: studies, anchor: '#wirtualny-stol-gogle-i-druk-3d', label: 'Wirtualny stół, gogle i druk 3D', text: 'Co od roku 2025/26 wolno prowadzić w warunkach symulowanych i co zostaje w prosektorium.' },
      { ref: studies, anchor: '#wiecej-studentow-a-jakosc-ksztalcenia', label: 'Więcej studentów a jakość kształcenia', text: 'Co samorząd lekarski mówi o przyroście studentów, kto może uruchomić kierunek i co da się dziś zmierzyć.' },
    ],
  }],
  staz: [{
    label: TEXTS,
    items: [
      { ref: 'egzamin-lek' },
      { ref: studies, anchor: '#po-studiach-lek-i-staz', label: 'Po studiach: LEK i staż', text: 'Jak LEK wypada na tle egzaminów do innych zawodów, kto trafia na staż do którego szpitala i co zmieniłby projekt skrócenia stażu.' },
      { ref: 'odsiew-na-medycynie', anchor: '#od-miejsca-na-studiach-do-prawa-wykonywania-zawodu', label: 'Od miejsca na studiach do prawa wykonywania zawodu', text: 'Rachunek krok po kroku: do prawa wykonywania zawodu dochodzi ok. 55% miejsc z limitu, a większość różnicy to miejsca w języku obcym i dla cudzoziemców.' },
    ],
  }],
  specjalizacja: [{
    label: TEXTS,
    items: [
      { ref: 'specjalizacja-lekarska' },
      { ref: 'wedlug-specjalizacji' },
      { ref: studies, anchor: '#specjalizacja', label: 'Specjalizacja: moduły, tryby i ranking', text: 'Jak działa moduł podstawowy, czym różni się rezydentura od miejsca pozarezydenckiego i jak liczy się ranking.' },
      { ref: 'dlaczego-brakuje-lekarzy', anchor: '#miejsca-specjalizacyjne-wiecej-pustych-niz-obsadzonych', label: 'Miejsca specjalizacyjne: więcej pustych niż obsadzonych', text: 'Dlaczego obok pustych miejsc są lekarze, którzy nie zakwalifikowali się nigdzie, i co NIK ustaliła o przyznawaniu rezydentur.' },
      { ref: 'reglamentacja-dostepu', anchor: '#specjalizacja-trzy-limity-na-jedno-miejsce', label: 'Specjalizacja: trzy limity na jedno miejsce', text: 'Pula rezydentur, akredytacja placówki i limit lekarzy u jednego kierownika: kto ustala każdy z nich.' },
    ],
  }],
};

/** Po ostatnim przystanku: kto ustala liczbę miejsc, inne wejścia do zawodu i to, co po tytule specjalisty. */
export const after = [
  {
    title: 'Kto decyduje, ile osób przejdzie tę drogę',
    lead: 'Limity przyjęć, ich historia i to, co zmiana naboru robi z liczbą lekarzy po latach.',
    items: [{ ref: 'reglamentacja-dostepu' }, { ref: 'ciecie-limitow-na-medycyne' }, { ref: 'dlaczego-brakuje-lekarzy' }, { ref: 'symulator-podazy-lekarzy' }] as RoadLink[],
  },
  {
    title: 'Inne wejścia do zawodu',
    lead: 'Dyplom spoza Unii Europejskiej i osobna, płatna pula studiów w języku obcym.',
    items: [{ ref: 'lekarze-ze-wschodu' }, { ref: 'english-division' }] as RoadLink[],
  },
  {
    title: 'Po tytule specjalisty',
    lead: 'Jak wyglądają pieniądze po szkoleniu i kto rozlicza lekarzy z błędów.',
    items: [
      { label: 'Ile i za co płacimy', href: '/ile-placimy/', text: 'Od składki zdrowotnej do wypłaty lekarza: kto widzi jakie kwoty i w którym miejscu ślad pieniędzy się urywa.' },
      { ref: 'odpowiedzialnosc-zawodowa-lekarzy' },
      { ref: 'jak-dzialaja-sady-lekarskie' },
    ] as RoadLink[],
  },
];
