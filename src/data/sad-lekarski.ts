/**
 * /prototypy/sad-lekarski/ — gra „Czy orzekasz jak sąd lekarski”: gracz czyta stan faktyczny z prawomocnego
 * orzeczenia i wybiera karę ze skali art. 83 ustawy o izbach lekarskich; potem widzi wyrok.
 * Źródło spraw: portal prawomocnych orzeczeń NIL (zanonimizowane, kategoria I). Regulamin portalu
 * (§ 5 ust. 3) pozwala wykorzystywać orzeczenia w celach naukowych, dydaktycznych i informacyjnych.
 * Opisy piszemy sami, ogólniej niż orzeczenie: bez miejscowości, dat i kwot (portal i tak je zaczernia).
 */

export const PORTAL_URL = 'https://nil.org.pl/orzeczenia';
export const REGULAMIN_URL =
  'https://nil.org.pl/uploaded_files/art_1714140785_doc-1712063049-ru-010-24-ix-zal-regulamin-portalu-prawomocnych-orzeczen-sadow-lekarskich-tekst-jedn.pdf';
export const USTAWA_URL = 'https://api.sejm.gov.pl/eli/acts/DU/2021/1342/text.pdf';
export const ANALIZA_URL = '/analizy/odpowiedzialnosc-zawodowa-lekarzy/';

/** Skala rozstrzygnięć: 0 = bez kary, 1–7 = kary z art. 83 ust. 1 pkt 1–7, w kolejności ustawy. */
export const SCALE = [
  { level: 0, label: 'Bez kary', note: 'uniewinnienie lub umorzenie' },
  { level: 1, label: 'Upomnienie', note: 'art. 83 ust. 1 pkt 1' },
  { level: 2, label: 'Nagana', note: 'pkt 2' },
  { level: 3, label: 'Kara pieniężna', note: 'pkt 3' },
  { level: 4, label: 'Zakaz funkcji kierowniczych', note: 'pkt 4 · od roku do 5 lat' },
  { level: 5, label: 'Ograniczenie zakresu czynności', note: 'pkt 5 · od 6 miesięcy do 2 lat' },
  { level: 6, label: 'Zawieszenie prawa do zawodu', note: 'pkt 6 · od roku do 5 lat' },
  { level: 7, label: 'Pozbawienie prawa do zawodu', note: 'pkt 7' },
] as const;

export interface CourtCase {
  id: string;
  /** np. „Orzeczenie 1 · zarzut 1 z 3” */
  label: string;
  court: string;
  /** stan faktyczny — tylko to, co sąd wiedział przed wyrokiem */
  facts: string[];
  charge: string;
  verdict: { level: number; text: string };
  /** co sąd napisał w uzasadnieniu — pokazujemy dopiero po odpowiedzi */
  reasoning?: string;
  /** nazwa pliku na portalu NIL */
  file: string;
}

export const CASES: CourtCase[] = [
  {
    id: 'okulistka-badanie',
    label: 'Orzeczenie 1 · zarzut 1 z 3',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Matka złożyła skargę na badanie wzroku córki w poradni okulistycznej. Rzecznik zebrał dokumentację, przesłuchał matkę i lekarkę, a sprawę oceniła biegła okulistka.',
      'Ustalono, że lekarka nie zebrała wywiadu, nie sprawdziła korekcji w oprawkach próbnych ani na foropterze, nie ustaliła pełnej wady wzroku po kroplach porażających akomodację i nie oceniła przedniego odcinka oczu. Dziecko dostało nieprawidłowo dobrane okulary.',
      'Przed sądem lekarka tłumaczyła, że działała pod presją matki pacjentki i wystawiła receptę na jej żądanie.',
    ],
    charge: 'Brak należytej staranności (art. 1 ust. 3, art. 4 i 8 Kodeksu Etyki Lekarskiej, art. 4 ustawy o zawodach lekarza).',
    verdict: { level: 2, text: 'Nagana.' },
    reasoning:
      'Sąd nie przyjął tłumaczenia. Gdy porozumienie z pacjentem jest niemożliwe, lekarz może odmówić badania i wskazać inne możliwości leczenia, ale nie może działać pod presją pacjenta ani rodziny. Każdy dokument medyczny ma być zgodny z wiedzą i sumieniem lekarza (art. 41 KEL).',
    file: 'OSL/0011-25.pdf',
  },
  {
    id: 'okulistka-oct',
    label: 'Orzeczenie 1 · zarzut 2 z 3',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'To drugi zarzut z tej samej sprawy. W poradni lekarka wykonała tej pacjentce także OCT — optyczną tomografię siatkówki — choć według ustaleń nie było do niej wskazań.',
      'Sąd uznał, że dodatkowe badanie umożliwiło korzystniejsze rozliczenie wykonanych procedur.',
    ],
    charge: 'Naruszenie art. 1 ust. 3, art. 4 i 6 KEL oraz art. 4 ustawy o zawodach lekarza.',
    verdict: {
      level: 3,
      text: 'Kara pieniężna: dwukrotność przeciętnego miesięcznego wynagrodzenia w sektorze przedsiębiorstw (kwotę portal zaczernia).',
    },
    file: 'OSL/0011-25.pdf',
  },
  {
    id: 'okulistka-dokumentacja',
    label: 'Orzeczenie 1 · zarzut 3 z 3',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Trzeci zarzut dotyczy dokumentacji tej pacjentki. Lekarka nie wpisała wywiadu ani zaleceń, a skąpy opis badania umieściła w rubryce przeznaczonej na wywiad.',
      'Rozliczyła autorefraktometrię — komputerowy pomiar wady wzroku — ale nie odnotowała jego wyniku. Jako rozpoznanie wpisała kod ICD-10 H35 (inne zaburzenia siatkówki), choć nic na to nie wskazywało.',
    ],
    charge: 'Nierzetelna dokumentacja medyczna (art. 28 KEL, art. 41 ustawy o zawodach lekarza, art. 25 ustawy o prawach pacjenta).',
    verdict: {
      level: 4,
      text: 'Zakaz pełnienia funkcji kierowniczych w ochronie zdrowia na rok — najkrótszy okres, jaki przewiduje ustawa.',
    },
    reasoning:
      'Każdy wpis w dokumentacji ma być na tyle szczegółowy, by dało się odtworzyć i skontrolować przebieg leczenia oraz zlecone i wykonane czynności.',
    file: 'OSL/0011-25.pdf',
  },
  {
    id: 'teleporady-leki-nasenne',
    label: 'Orzeczenie 2',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Lekarka prowadziła pacjentkę wyłącznie przez teleporady na portalu internetowym. Przepisała jej łącznie 37 opakowań silnego leku nasennego po 30 tabletek, w dawkach ponad dopuszczalne według charakterystyki produktu. Już w trzech pierwszych teleporadach — 5 opakowań, czyli 150 tabletek, przy dawkowaniu jednej dziennie.',
      'Pacjentka trafiła później na oddział psychiatryczny z objawami odstawiennymi, uzależniona od tego leku.',
      'Lekarka tłumaczyła, że pacjentka ją okłamywała i zatajała uzależnienie, a gdy portal ją zablokował, założyła konto pod fałszywym nazwiskiem i groziła skargą do rzecznika. Twierdziła też, że stopniowo zmniejszała dawki i kierowała pacjentkę do szpitala.',
    ],
    charge: 'Brak należytej staranności (art. 8 KEL, art. 4 ustawy o zawodach lekarza).',
    verdict: { level: 1, text: 'Upomnienie — o taką karę wnosił sam rzecznik odpowiedzialności zawodowej.' },
    reasoning:
      'Sąd uznał, że lekarka powinna była odmówić wypisywania leku już w pierwszych dniach, a lekarz nie może ulegać presji ani szantażowi pacjenta. Surowsza kara, np. nagana lub kara pieniężna, byłaby jednak według sądu zbyt dolegliwa wobec stopnia winy; sąd wziął pod uwagę postawę lekarki i jej wcześniejszą niekaralność.',
    file: 'OSL/0013.pdf',
  },
  {
    id: 'ratownictwo-covid',
    label: 'Orzeczenie 3',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Lekarz, kierownik zespołu ratownictwa medycznego, badał pacjentkę chorą na COVID-19 i zdecydował, że nie trzeba jej hospitalizować. Nie uwzględnił przy tym dodatkowych czynników ryzyka, które u niej występowały.',
      'Sprawą zajął się najpierw sąd karny. Warunkowo umorzył postępowanie wobec lekarza na dwa lata próby, zasądził od niego zadośćuczynienie dla pokrzywdzonych i zobowiązał go do przeproszenia ich.',
      'Potem ten sam czyn trafił do sądu lekarskiego.',
    ],
    charge: 'Brak należytej staranności (art. 8 KEL w związku z art. 53 ustawy o izbach lekarskich).',
    verdict: { level: 0, text: 'Umorzenie postępowania (art. 82 ust. 2 ustawy o izbach lekarskich).' },
    reasoning:
      'Ustawa pozwala umorzyć sprawę, gdy kara byłaby oczywiście niecelowa wobec kary orzeczonej za ten sam czyn w innym postępowaniu. Sąd uznał rozstrzygnięcie sądu karnego za wystarczająco dotkliwe, a upomnienie, naganę czy karę pieniężną obok niego — za niecelowe.',
    file: 'OSL/0012.pdf',
  },
  {
    id: 'oddzial-ordynator',
    label: 'Orzeczenie 4 · ordynator',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Pacjentka trafiła do szpitala z dusznością, bólami brzucha, nudnościami i wymiotami; chirurdzy wykluczyli przyczynę chirurgiczną. Na oddziale nie dostała profilaktyki przeciwzakrzepowej, nikt nie szukał przyczyny duszności (echo serca, spirometria, angio-TK, peptyd natriuretyczny), nie powtórzono EKG mimo zmian w zapisie ani badań przy podwyższonych CRP, troponinie i D-dimerach.',
      'Ordynator — specjalista i jedyny lekarz decydujący o leczeniu i wypisie — zlecił wypis do domu przed zakończeniem diagnostyki. Nadzorował też dokumentację, w której brakowało wywiadu, obserwacji i planu leczenia.',
      'Pacjentka zmarła w domu. Sąd uznał, że najpewniej z powodu nierozpoznanego zawału serca albo zatoru tętnicy płucnej.',
    ],
    charge: 'Nieudzielenie należytej pomocy i wadliwy nadzór (art. 8 KEL, art. 4 ustawy o zawodach lekarza); nierzetelna dokumentacja.',
    verdict: {
      level: 6,
      text: 'Zawieszenie prawa wykonywania zawodu na 2 lata i zakaz pełnienia funkcji kierowniczych na 5 lat — najdłużej, jak pozwala ustawa. Za dokumentację osobno nagana.',
    },
    reasoning:
      'Zmiany w EKG nie były według sądu trudne w interpretacji — ich rozpoznania wymaga się od studenta 4. lub 5. roku medycyny. Kary mają zabezpieczyć pacjentów przed lekarzem, który poważnie naruszył standardy prowadzenia oddziału i leczenia. Wiek pacjentki nie może być wyznacznikiem należnej jej opieki.',
    file: 'OSL/0013-25.pdf',
  },
  {
    id: 'oddzial-asystent',
    label: 'Orzeczenie 4 · drugi lekarz',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'W tej samej sprawie rzecznik oskarżył drugiego lekarza z oddziału — asystenta bez specjalizacji, podległego ordynatorowi, który także zajmował się pacjentką. Zarzut obejmował te same zaniechania w leczeniu oraz nierzetelną dokumentację.',
      'Asystent zeznał, że mówił ordynatorowi, iż pacjentka nie powinna wychodzić ze szpitala. Wpisy w dokumentacji robił na polecenie ordynatora.',
    ],
    charge: 'Nieudzielenie należytej pomocy (art. 8 KEL, art. 4 ustawy o zawodach lekarza); nierzetelna dokumentacja.',
    verdict: {
      level: 0,
      text: 'Uniewinnienie od zarzutu złego leczenia. Co do dokumentacji — umorzenie jako przewinienia mniejszej wagi.',
    },
    reasoning:
      'Sąd ustalił, że asystent nie miał wpływu na przebieg hospitalizacji ani na decyzję o wypisie, której był przeciwny. Dokumentację prowadził źle, ale podporządkował się praktyce panującej na oddziale — dlatego sąd poprzestał na umorzeniu.',
    file: 'OSL/0013-25.pdf',
  },
  {
    id: 'medycyna-pracy',
    label: 'Orzeczenie 5',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Kontrola sprawdziła losowo 480 kart badań profilaktycznych pracowników wystawionych przez lekarza medycyny pracy. W żadnej nie było wywiadu zawodowego, w 185 brakowało badania przedmiotowego (tętna, ciśnienia, podstawowego badania okulistycznego i laryngologicznego), w pozostałych — jego części.',
      'Pracownikom na wysokości powyżej 3 m i kierowcom kategorii C i D nie robił pełnego zakresu badań wymaganego przepisami, podobnie osobom pracującym przy czynnikach szkodliwych. Część wydanych przez niego orzeczeń o zdolności do pracy uznano za nieważne.',
      'Rejestr orzeczeń prowadził niezgodnie z przepisami: co miesiąc numerował go od nowa, wpisywał do niego osoby badane na innej podstawie, a przy skreśleniach nie podawał powodu ani podpisu.',
    ],
    charge: 'Naruszenie przepisów o badaniach pracowników i dokumentacji medycznej, podważenie zaufania do zawodu (cztery zarzuty).',
    verdict: {
      level: 3,
      text: 'Kara pieniężna za każdy z czterech zarzutów — po połowie przeciętnego miesięcznego wynagrodzenia w sektorze przedsiębiorstw.',
    },
    file: 'OSL/0015.pdf',
  },
  {
    id: 'ciaza-hipotrofia',
    label: 'Orzeczenie 6',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Lekarka ginekolog-położnik prowadziła ciążę. Na wizycie, mimo stwierdzenia w USG hipotrofii płodu (za małej masy dziecka), nie zbadała przepływów krwi metodą Dopplera ani nie zrobiła KTG. Wyjaśniła, że nie umie wykonywać badań dopplerowskich, a aparat KTG w gabinecie miała, ale nie było go gdzie użyć. Dziecko urodziło się martwe.',
      'Lekarka tłumaczyła, że parametry płodu przeliczała w uznanym kalkulatorze i nieprawidłowe wyniki wyszły dopiero na kolejnej wizycie — wtedy skierowała pacjentkę do szpitala.',
      'Za ten sam czyn sąd karny skazał ją wcześniej na grzywnę za narażenie dziecka na niebezpieczeństwo utraty życia. Przed sądem lekarskim wyraziła żal i skruchę.',
    ],
    charge: 'Brak należytej staranności (art. 8 KEL, art. 4 ustawy o zawodach lekarza).',
    verdict: {
      level: 0,
      text: 'Uznana za winną, ale postępowanie umorzone (art. 82 ust. 2 ustawy o izbach lekarskich).',
    },
    reasoning:
      'Kara samorządu byłaby według sądu oczywiście niecelowa wobec grzywny prawomocnie orzeczonej przez sąd karny za ten sam czyn.',
    file: 'OSL/0014.pdf',
  },
  {
    id: 'skladki',
    label: 'Orzeczenie 7',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Przynależność do izby lekarskiej i składka członkowska są dla lekarza obowiązkowe. Lekarka przez dwa okresy nie płaciła składek na rzecz okręgowej izby; łączną kwotę zaległości portal zaczernia.',
      'Izba wzywała ją do dobrowolnej zapłaty, ale zaległość nie została uregulowana, więc rzecznik skierował sprawę do sądu.',
    ],
    charge: 'Uchylanie się od obowiązku wspierania samorządu (art. 59 zd. 1 KEL, art. 8 ustawy o izbach lekarskich).',
    verdict: { level: 1, text: 'Upomnienie.' },
    file: 'OSL/0012-25.pdf',
  },
];

export const sadPage = {
  title: 'Czy orzekasz jak sąd lekarski',
  lead:
    'Dziesięć prawdziwych spraw z prawomocnych orzeczeń. Przeczytaj, co ustalił sąd, wybierz karę ze skali, którą daje mu ustawa, i porównaj z wyrokiem.',
  sample:
    'To prototyp: dziesięć rozstrzygnięć z siedmiu orzeczeń okręgowych sądów lekarskich, opublikowanych na portalu NIL. Tak mała próba nie mówi nic o całym orzecznictwie — pokazuje tylko, jak sądy ważą konkretne sprawy.',
  national:
    'W skali kraju upomnienie, nagana i kara pieniężna to 86% z 2516 kar orzeczonych w pierwszej instancji w latach 2020–2025.',
};
