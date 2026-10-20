/**
 * /sad-lekarski/ — gra „Czy orzekasz jak sąd lekarski”: gracz czyta stan faktyczny z prawomocnego
 * orzeczenia i wybiera karę ze skali art. 83 ustawy o izbach lekarskich; potem widzi wyrok.
 * /sad-lekarski/orzeczenia/ — katalog wszystkich rozstrzygnięć, każde z osobną stroną.
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
  /** krótka nazwa sprawy — w tabeli wyników */
  title: string;
  /** jedno zdanie do karty w katalogu orzeczeń */
  summary: string;
  /** false = tylko w katalogu, nie w grze (np. temat światopoglądowy) */
  inGame?: boolean;
  /** miejsce w orzeczeniu z kilkoma zarzutami lub obwinionymi („zarzut 2 z 3”); pusty przy jednym */
  label: string;
  court: string;
  /** stan faktyczny — tylko to, co sąd wiedział przed wyrokiem */
  facts: string[];
  charge: string;
  verdict: { level: number; text: string };
  /** co sąd napisał w uzasadnieniu — pokazujemy dopiero po odpowiedzi */
  reasoning?: string;
  /** nazwa pliku na portalu NIL — też klucz grupy: sprawy z jednego orzeczenia losują się razem */
  file: string;
}

/** Ile rozstrzygnięć w jednej rozgrywce; gdy spraw jest więcej, gra losuje orzeczenia do tej liczby. */
export const ROUND_SIZE = 10;

/**
 * Luźny docelowy rozkład rozstrzygnięć w rozgrywce, zbliżony do rzeczywistego orzecznictwa:
 * – bez kary 24%: 200 z 827 prawomocnych orzeczeń od I półr. 2024 do I półr. 2025 to umorzenia lub uniewinnienia
 *   (tabela NIL „Prawomocne orzeczenia sądów lekarskich”, wiersz SUMA);
 * – reszta (76%) według struktury kar orzeczonych w I instancji w latach 2020–2025 (data/odpowiedzialnosc-zawodowa-lekarzy):
 *   upomnienie 42%, nagana 22%, kara pieniężna 23%, surowsze (zakaz, ograniczenie, zawieszenie, pozbawienie) 14%.
 * Kolejność = koszyki: 0 bez kary, 1 upomnienie, 2 nagana, 3 kara pieniężna, 4 surowsze (poziomy 4–7).
 */
export const ROUND_MIX = [0.24, 0.32, 0.16, 0.17, 0.11] as const;
export const NIL_PRAWOMOCNE_URL = 'https://nil.org.pl/rejestry/rejestr-ukaranych-lekarzy/prawomocne-orzeczenia-sadow-lekarskich';

export const CASES: CourtCase[] = [
  {
    id: 'okulistka-badanie',
    title: 'Okulistka: badanie wzroku dziecka',
    summary: 'Okulistka dobrała dziecku okulary bez pełnego badania wzroku i tłumaczyła się presją matki.',
    label: 'zarzut 1 z 3',
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
    title: 'Okulistka: badanie OCT bez wskazań',
    summary: 'Ta sama lekarka wykonała dziecku badanie OCT bez wskazań, co pozwoliło korzystniej rozliczyć procedury.',
    label: 'zarzut 2 z 3',
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
    title: 'Okulistka: dokumentacja medyczna',
    summary: 'W dokumentacji tej pacjentki zabrakło wywiadu i wyniku pomiaru wzroku, a rozpoznanie wpisano bez przesłanek.',
    label: 'zarzut 3 z 3',
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
    title: 'Teleporady: leki nasenne',
    summary: 'Przez teleporady lekarka przepisała pacjentce 37 opakowań silnego leku nasennego; pacjentka się uzależniła.',
    label: '',
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
    title: 'Ratownictwo: pacjentka z COVID-19',
    summary: 'Lekarz zespołu ratownictwa nie skierował do szpitala pacjentki z COVID-19 mimo czynników ryzyka; wcześniej orzekał sąd karny.',
    label: '',
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
    title: 'Wypis przed diagnozą: ordynator',
    summary: 'Ordynator wypisał pacjentkę przed zakończeniem diagnostyki, mimo zmian w EKG i podwyższonej troponiny; pacjentka zmarła w domu.',
    label: 'lekarz 1 z 2',
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
    title: 'Wypis przed diagnozą: asystent',
    summary: 'Asystent z tego samego oddziału, przeciwny wypisowi, odpowiadał za te same zaniechania w leczeniu i dokumentacji.',
    label: 'lekarz 2 z 2',
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
    title: 'Medycyna pracy: badania pracowników',
    summary: 'Lekarz medycyny pracy wydawał orzeczenia o zdolności do pracy bez pełnych badań; w żadnej z 480 sprawdzonych kart nie było wywiadu zawodowego.',
    label: '',
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
    title: 'Ciąża: hipotrofia płodu',
    summary: 'Ginekolożka nie zbadała przepływów ani nie zrobiła KTG mimo hipotrofii płodu; dziecko urodziło się martwe, a sąd karny skazał ją na grzywnę.',
    label: '',
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
    title: 'Nieopłacone składki członkowskie',
    summary: 'Lekarka przez dwa okresy nie płaciła obowiązkowych składek na izbę lekarską.',
    label: '',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Przynależność do izby lekarskiej i składka członkowska są dla lekarza obowiązkowe. Lekarka przez dwa okresy nie płaciła składek na rzecz okręgowej izby; łączną kwotę zaległości portal zaczernia.',
      'Izba wzywała ją do dobrowolnej zapłaty, ale zaległość nie została uregulowana, więc rzecznik skierował sprawę do sądu.',
    ],
    charge: 'Uchylanie się od obowiązku wspierania samorządu (art. 59 zd. 1 KEL, art. 8 ustawy o izbach lekarskich).',
    verdict: { level: 1, text: 'Upomnienie.' },
    file: 'OSL/0012-25.pdf',
  },
  {
    id: 'biegly-akta',
    title: 'Biegły: przetrzymane akta',
    summary: 'Biegły przez około dwa lata nie oddał opinii ani akt, przez co sprawa, w której opiniował, się przedawniła.',
    label: '',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Lekarz zgodził się sporządzić jako biegły opinię dla okręgowego rzecznika odpowiedzialności zawodowej w sprawie dotyczącej innego lekarza. Rzecznik wyznaczył termin i przekazał mu akta.',
      'Przez około dwa lata nie oddał ani opinii, ani akt, mimo wielu ponagleń i rozmów telefonicznych. Nie odpowiedział też na dwa pisma Naczelnego Rzecznika.',
      'Gdy w końcu odesłał akta z opinią, sprawy, w której opiniował, nie dało się już prowadzić — przedawniła się i została umorzona.',
      'Tłumaczył, że akta omyłkowo trafiły do innego sądu, a potem zaginęły wśród jego dokumentów. Na rozprawę się nie stawił.',
    ],
    charge: 'Niewywiązanie się z obowiązków wobec samorządu i instytucji (art. 59 zd. 1 w zw. z art. 61 KEL).',
    verdict: { level: 3, text: 'Kara pieniężna: czterokrotność przeciętnego miesięcznego wynagrodzenia w sektorze przedsiębiorstw.' },
    reasoning:
      'Według sądu zwłoka doprowadziła do umorzenia innej sprawy, a tłumaczenia świadczą jedynie o złej organizacji pracy. Odpowiedzialność za akta ponosi biegły, nie sekretarka, na którą próbował ją przerzucić.',
    file: 'OSL/OSL.07.01W.docx',
  },
  {
    id: 'psychiatra-portal',
    title: 'Tytuł psychiatry bez specjalizacji',
    summary: 'Lekarz w trakcie specjalizacji przedstawiał się w serwisie internetowym z lekarzami jako specjalista psychiatra.',
    label: '',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Na swoim profilu w popularnym serwisie internetowym, w którym pacjenci wyszukują lekarzy i umawiają wizyty, lekarz przedstawiał się jako specjalista psychiatra. Rzecznik sprawdził profil po zgłoszeniu.',
      'Urząd wojewódzki potwierdził, że lekarz był w trakcie szkolenia specjalizacyjnego z psychiatrii (rezydentury). Specjalizacji nie miał.',
      'Lekarz nie złożył wyjaśnień i nie stawił się na rozprawę.',
    ],
    charge: 'Posługiwanie się nienależnym tytułem i podważanie zaufania do zawodu (art. 1 ust. 3 i art. 62 KEL).',
    verdict: { level: 3, text: 'Kara pieniężna: trzykrotność przeciętnego miesięcznego wynagrodzenia w sektorze przedsiębiorstw.' },
    reasoning:
      'Tytuł specjalisty daje dopiero zdany egzamin specjalizacyjny, a pacjenci wybierają lekarza właśnie po dziedzinie. Sąd uznał, że podawanie nieprawdziwych informacji o wykształceniu „wymaga surowego ukarania przez sąd lekarski”.',
    file: 'OSL/OSL.07.02W.docx',
  },
  {
    id: 'okulistka-cxl',
    title: 'Okulistka: zabieg bez wskazań',
    summary: 'Okulistka w prywatnej klinice wykonała zabieg wzmacniania rogówki, choć schorzenie pacjenta nie było do niego wskazaniem.',
    label: '',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'Pacjent około dziesięć lat po laserowej korekcji wzroku zgłosił się do prywatnej kliniki, bo gorzej widział na prawe oko. Okulistka stwierdziła bliznę rogówki i zaproponowała cross-linking (CXL), który — jak przedstawiła — miał rozjaśnić bliznę i wzmocnić rogówkę.',
      'Dwie biegłe okulistki: wskazaniem do CXL jest stożek rogówki, nie blizna, a zabieg nie poprawia ostrości wzroku ani nie usuwa przymglenia.',
      'Po zabiegu pacjent miał ból oka i głowy i widział gorzej. Leczenie trwało miesiącami, doszło wirusowe zapalenie rogówki, a w innej klinice stwierdzono potrzebę przeszczepu rogówki. Biegłe nie przesądziły, czy dolegliwości wywołał zabieg, czy zapalenie.',
      'Lekarka nie przyznała się — jej zdaniem CXL stosuje się także przy innych schorzeniach rogówki.',
    ],
    charge: 'Brak należytej staranności (art. 4 ustawy o zawodach lekarza, art. 8 KEL).',
    verdict: { level: 3, text: 'Kara pieniężna: dwukrotność przeciętnego miesięcznego wynagrodzenia w sektorze przedsiębiorstw.' },
    reasoning:
      'Sąd uznał, że lekarka „nie kierowała się dobrem pacjenta, a jedynie względami finansowymi”, i ocenił stopień zawinienia jako znaczny. Na jej korzyść wziął brak wcześniejszych skarg i niekaralność. Przypisał jej to, że mogła narazić pacjenta na powikłania — nie to, że je spowodowała.',
    file: 'OSL/OSL.07.03W.docx',
  },
  {
    id: 'dokumentacja-pelnomocnik',
    title: 'Chirurg plastyczny: dokumentacja dla adwokata',
    summary: 'Pacjentka zarzuciła chirurgowi plastycznemu, że nie wydał dokumentacji medycznej, o którą prosił jej adwokat.',
    label: '',
    court: 'Sąd lekarski I instancji',
    facts: [
      'Po operacji plastycznej twarzy w prywatnym centrum adwokat pacjentki pisał do lekarza najpierw o zwrocie kosztów i zadośćuczynieniu, a potem dwukrotnie o wydanie dokumentacji medycznej.',
      'Do żadnego z tych pism nie załączył pełnomocnictwa od pacjentki.',
      'Lekarz wysłał dokumentację wraz ze zdjęciami na adres pacjentki, a pacjentka potwierdziła mailowo, że ją dostała. Rzecznik nie ustalił, czego miało w niej brakować.',
    ],
    charge: 'Nieudostępnienie dokumentacji medycznej osobie upoważnionej (art. 26 ustawy o prawach pacjenta).',
    verdict: { level: 0, text: 'Uniewinnienie; koszty postępowania poniósł Skarb Państwa.' },
    reasoning:
      'Sąd uznał, że czyn nie zaistniał: bez pełnomocnictwa lekarz nie miał podstaw, by wydać dokumentację adwokatowi, a pacjentka ją otrzymała.',
    file: 'OSL/OSL.07.05W.docx',
  },
  {
    id: 'przerwanie-ciazy',
    title: 'Ginekolożka: przerwanie ciąży poza przesłankami',
    summary: 'Ginekolożka za pieniądze przerwała ciążę poza ustawowymi przesłankami; wcześniej skazał ją sąd karny.',
    inGame: false,
    label: '',
    court: 'Okręgowy sąd lekarski',
    facts: [
      'W prywatnym gabinecie ginekolożka, za zgodą pacjentki i za pieniądze, przerwała jej ciążę, choć nie zachodziła żadna z przesłanek, które wówczas dopuszczała ustawa.',
      'Sąd karny prawomocnie skazał ją m.in. na 10 miesięcy pozbawienia wolności w zawieszeniu na 3 lata, grzywnę, przepadek korzyści i roczny zakaz wykonywania zawodu ginekologa-położnika.',
      'Sąd lekarski był związany ustaleniami wyroku karnego.',
    ],
    charge: 'Naruszenie art. 2 ust. 1 i art. 39 KEL oraz art. 4a ustawy o planowaniu rodziny.',
    verdict: { level: 0, text: 'Uznana za winną, ale postępowanie umorzone (art. 82 ust. 2 ustawy o izbach lekarskich).' },
    reasoning:
      'Kara samorządu byłaby oczywiście niecelowa wobec kary orzeczonej w postępowaniu karnym. Sąd podkreślił, że umorzenie przesądza o przewinieniu zawodowym, choć kary nie wymierza.',
    file: 'OSL/OSL.07.07W.docx',
  },
  {
    id: "endokrynolog-bez-uprawnien",
    title: "Endokrynolog bez uprawnień w Polsce",
    summary: "Lekarz z zagraniczną specjalizacją, z warunkowym prawem wykonywania zawodu jako lekarz bez specjalizacji, przyjmował pacjentów jako endokrynolog.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Lekarz z zagranicy, w swoim kraju specjalista endokrynolog, dostał w Polsce w uproszczonym trybie warunkowe prawo wykonywania zawodu — jako lekarz bez specjalizacji. W tym trybie tytułu specjalisty się nie uznaje.",
      "W przychodni, na umowie zlecenia, udzielał porad z endokrynologii. Na drzwiach gabinetu wisiała tabliczka z jego nazwiskiem i napisami „endokrynologia” i „diabetologia”; sąd uznał, że nie kazał jej zdjąć i godził się na wprowadzanie pacjentów w błąd. Ogłoszeń sam nie zamieszczał.",
      "Tłumaczył, że przyjęto go jako lekarza ogólnego i że znał przepisy. Dyrektor placówki przyznał, że zatrudnienie wynikało z błędnego rozumienia zasad; umowę zmieniono na porady w poradni lekarza rodzinnego.",
    ],
    charge: "Udzielanie świadczeń specjalistycznych bez uprawnień i posługiwanie się nieuznanym tytułem (art. 5, 7 i 16 ustawy o zawodach lekarza, art. 1 KEL).",
    verdict: { level: 0, text: "Umorzenie jako przewinienia mniejszej wagi (art. 82 ust. 2 ustawy o izbach lekarskich)." },
    reasoning:
      "Sąd uznał czyn za „wyraz pewnej lekkomyślności”, a nie zaplanowane działanie, a społeczną szkodliwość — za nieznaczną, bo żaden pacjent nie poniósł realnej szkody. Wziął pod uwagę dobrą opinię w obecnej pracy i niekaralność; samo stwierdzenie przewinienia ma być przestrogą.",
    file: "OSL/OSL.07.08W.docx",
  },
  {
    id: "wypowiedz-zgony",
    title: "Wypowiedź o przyczynach zgonów",
    summary: "Lekarz powiedział w mediach, że w aktach zgonu zwykle nie wpisuje się zakażenia jako przyczyny; skarżący uznał, że sugerował fałszowanie statystyk.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Na początku pandemii lekarz powiedział w wywiadzie na portalu internetowym, że w Polsce od zawsze unika się wpisywania zakażenia jako przyczyny zgonu, bo zgon z powodu zakażenia oznacza kłopoty szpitala — prościej wpisać niewydolność oddechową.",
      "Skargę złożył inny lekarz: wypowiedź sugerowała, że lekarze fałszują statystyki zgonów. Lekarz przeprosił w biuletynie izby lekarskiej, ale mediacja ostatecznie się nie powiodła i sprawa trafiła do sądu.",
      "Przyznał się do autorstwa, nie do winy: chodziło mu o niedoszacowanie zgonów z zakażeń, np. grypy, i powoływał się na dane statystyczne. Dodał, że dziś byłby ostrożniejszy w sformułowaniach.",
    ],
    charge: "Brak ostrożności w publicznej ocenie innych lekarzy (art. 52 ust. 2 KEL).",
    verdict: { level: 0, text: "Uznany za winnego, ale postępowanie umorzone jako przewinienie mniejszej wagi (art. 82 ust. 2)." },
    reasoning:
      "Sąd przyjął, że lekarz nie chciał zarzucać kolegom fałszerstwa, tylko zwrócić uwagę na problem ustalania przyczyn zgonów. Publiczne przeprosiny uznał za dotkliwą sankcję; wziął też pod uwagę długość postępowania i refleksję lekarza. Zaznaczył jednak, że w chaosie informacyjnym początku pandemii „podsycanie tych nastrojów” nie może być akceptowane.",
    file: "OSL/OSL.07.09W.docx",
  },
  {
    id: "zaklucie-igla",
    title: "Zakłucie igłą: odmowa skierowania",
    summary: "Lekarka medycyny pracy nie skierowała do poradni chorób zakaźnych lekarza, który zakłuł się igłą z krwią pacjentki.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Lekarz, który wykonywał rozmazy z biopsji, zakłuł się igłą z krwią pacjentki. Zgłosił się na SOR, a stamtąd — zgodnie z procedurą szpitala — następnego dnia do lekarki medycyny pracy.",
      "Lekarka odmówiła skierowania go do poradni chorób zakaźnych na profilaktykę poekspozycyjną i zaleciła tylko badania krwi po 6 tygodniach, 3 i 6 miesiącach. Nie wydała też zaświadczenia o odmowie. Lekarz poszedł do poradni sam, zobowiązując się pokryć koszt leków i badań.",
      "Biegła z chorób zakaźnych: zakłucie igłą to ewidentna ekspozycja i podstawa do skierowania, a każde opóźnienie wydłuża czas do oceny specjalisty. Lekarka twierdziła, że według procedur szpitala skierowanie nie było potrzebne, a wyniki z SOR były prawidłowe.",
    ],
    charge: "Brak należytej staranności (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — o taką karę wnosił rzecznik." },
    reasoning:
      "Sąd przyznał, że upomnienie jako kara „mogłaby się wydawać zbyt łagodna”, bo błąd mógł mieć negatywne skutki zdrowotne. Surowszą karę uznał jednak za zbyt dolegliwą wobec stopnia winy; wziął pod uwagę niekaralność w długim stażu i postawę lekarki.",
    file: "OSL/OSL.07.10W.docx",
  },
  {
    id: "skladki-kara",
    inGame: false,
    title: "Nieopłacone składki: lekarka nieobecna",
    summary: "Lekarka nie płaciła składek na izbę lekarską i nie stawiła się ani u rzecznika, ani w sądzie.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Rzecznik dowiedział się od sekretarza okręgowej rady lekarskiej, że lekarka zalega ze składkami członkowskimi. Część zaległości za sporny okres później opłaciła.",
      "Nie stawiła się ani na przesłuchanie u rzecznika, ani na rozprawę i nie złożyła żadnych wyjaśnień.",
    ],
    charge: "Uchylanie się od obowiązku wspierania samorządu (art. 59 zd. 1 i art. 76 KEL).",
    verdict: { level: 3, text: "Kara pieniężna (kwotę portal zaczernia)." },
    reasoning:
      "Sąd uznał karę pieniężną za adekwatną „do charakteru popełnionego czynu, stopnia zawinienia oraz postawy obwinionej”.",
    file: "OSL/OSL.07.11W.docx",
  },
  {
    id: "dentystka-dokumentacja",
    title: "Dentystka: zaginiona dokumentacja",
    summary: "Dentystka nierzetelnie prowadziła i zabezpieczała dokumentację pacjentki, a po jej rzekomej kradzieży nie próbowała jej odtworzyć.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Zarzut: dentystka nierzetelnie prowadziła i zabezpieczała dokumentację medyczną pacjentki, w tym zdjęcia rentgenowskie, a po „domniemanej kradzieży” dokumentacji nie próbowała jej odtworzyć.",
      "Lekarka sama wniosła o dobrowolne poddanie się karze, a rzecznik się nie sprzeciwił — sąd nie przeprowadzał więc postępowania dowodowego, a orzeczenie nie opisuje szczegółów zdarzenia.",
    ],
    charge: "Brak należytej staranności w prowadzeniu dokumentacji (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — w trybie dobrowolnego poddania się karze, o które wniosła sama lekarka." },
    reasoning:
      "Sąd wziął pod uwagę świadomość naruszenia zasad, pierwsze przewinienie oraz „wyrażony żal i ubolewanie”.",
    file: "OSL/OSL.07.12W.docx",
  },
  {
    id: "covid-zglaszanie",
    title: "Niezgłaszanie COVID-19 do sanepidu",
    summary: "Lekarz miał nie dokumentować wywiadu u trzech pacjentek i nie zgłaszać sanepidowi pacjentów z COVID-19.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Lekarz przychodni miał w dokumentacji trzech pacjentek pomijać wywiad, informacje o chorobach i uczuleniach oraz wyniki badania. Biegły ocenił tę dokumentację jako uzupełnioną tylko częściowo, z istotnymi nieprawidłowościami.",
      "Lekarz tłumaczył, że to wieloletnie pacjentki przychodni, które przychodziły po kontynuację leczenia — głównie recepty na stałe leki — a ich dane są w dokumentacji przychodni. W pandemii, przy natłoku pacjentów, wpisy bywały skrótowe.",
      "Czwarty zarzut: w czasie obowiązku zgłaszania nie zgłaszał inspektorowi sanitarnemu rozpoznań i podejrzeń COVID-19 u pacjentów, którzy do niego trafiali. Przyjmował wtedy pacjentów z całej Polski.",
    ],
    charge: "Nierzetelna dokumentacja (art. 8 KEL, art. 25 ustawy o prawach pacjenta) i niezgłaszanie zakażeń (art. 27 ustawy o zwalczaniu chorób zakaźnych).",
    verdict: { level: 0, text: "Uniewinnienie od zarzutów dotyczących dokumentacji; co do niezgłaszania COVID-19 — umorzenie jako przewinienia mniejszej wagi." },
    reasoning:
      "Sąd w całości dał wiarę wyjaśnieniom co do dokumentacji. Przyznał, że obowiązku zgłaszania nie dopełniono, ale wziął pod uwagę wyjątkową sytuację pandemii i to, że lekarz nie mógł sprawdzić, czy pacjent z innego regionu był już zgłoszony i objęty kwarantanną.",
    file: "OSL/OSL.07.13W.docx",
  },
  {
    id: "dyzur-nietrzezwy-dzieci",
    title: "Nietrzeźwy na dyżurze: niezbadane dzieci",
    summary: "Lekarz na dyżurze nocnej opieki był nietrzeźwy; dwojga chorych dzieci nie zbadał, rozmawiał z ojcami na korytarzu.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Lekarz w trakcie specjalizacji dyżurował w nocnej i świątecznej opiece zdrowotnej. Wieczorem przyszli dwaj ojcowie z chorymi dziećmi (gorączka, ból gardła, kaszel). Lekarz rozmawiał z nimi na korytarzu: dziewczynce zalecił herbatę, leżenie i coś z apteki, odmówił osłuchania i obejrzenia gardła; chłopcu tylko przyłożył dłoń do czoła. Żadnego dziecka nie przyjął do gabinetu i nie sporządził dokumentacji.",
      "Jeden z ojców zawiadomił policję. Badanie wydychanego powietrza wykazało 0,58–0,59 mg/l alkoholu. Następnego dnia w innej placówce u dziewczynki rozpoznano ostre zapalenie krtani i tchawicy, a u chłopca ostre zapalenie oskrzeli.",
      "Prokuratura umorzyła dochodzenie o narażenie pacjentów — biegły uznał uchybienia za bez skutku dla ich zdrowia. Lekarz przyznał się tylko do nietrzeźwości; twierdził, że ojciec „wymuszał antybiotyki”. Na rozprawę się nie stawił.",
    ],
    charge: "Naruszenie godności zawodu (art. 1 ust. 3 i art. 64 KEL), brak staranności i brak dokumentacji — pięć zarzutów.",
    verdict: { level: 3, text: "Kara pieniężna (jednokrotność przeciętnego wynagrodzenia) za nietrzeźwość, nagana za niezbadanie każdego z dzieci i upomnienie za brak dokumentacji. Sąd wystąpił też do komisji izby o zbadanie zdolności lekarza do wykonywania zawodu." },
    reasoning:
      "Sąd nazwał rozpoczęcie dyżuru po alkoholu „karygodnym i niedopuszczalnym”, a wypitą ilość — znaczną. Nie uwierzył, że lekarz nie wiedział o swoim stanie. Jako okoliczność łagodzącą wziął tylko wcześniejszą niekaralność.",
    file: "OSL/OSL.07.15W.docx",
  },
  {
    id: "sor-nietrzezwy",
    title: "Nietrzeźwy na dyżurze SOR",
    summary: "Chirurg na samodzielnym dyżurze na SOR leczył pacjentów, mając 0,41 mg/l alkoholu w wydychanym powietrzu.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Chirurg z wieloletnim stażem pełnił samodzielny dyżur na SOR. Po zgłoszeniu na policję badanie wykazało 0,41, a ok. 20 minut później 0,42 mg/l alkoholu w wydychanym powietrzu. Lekarza zatrzymano; dyżuru nie mógł dokończyć.",
      "Wcześniej tego wieczoru zajął się czterema pacjentami: nastawił palec, zlecił badania przy bólu brzucha, przyjął na oddział pacjenta z urazem biodra, zaopatrzył skręcony staw skokowy. Nikt nie wyczuł alkoholu ani nie miał zastrzeżeń; według dokumentacji nikomu nie zaszkodził.",
      "Lekarz przyznał się. Mówił o „głupim incydencie”, wypaleniu zawodowym, trudnej sytuacji rodzinnej i jednym piwie.",
    ],
    charge: "Naruszenie godności zawodu (art. 1 ust. 3 i art. 64 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie." },
    reasoning:
      "Sąd uznał picie na dyżurze za „karygodne i niedopuszczalne”, bo na samodzielnym dyżurze SOR lekarz musi być w jak najlepszym stanie. Złagodziły karę: niekaralność, skrucha, trudna sytuacja rodzinna, incydentalność zdarzenia i brak szkody u pacjentów.",
    file: "OSL/OSL.07.16W.docx",
  },
  {
    id: "sor-zawal",
    title: "SOR: przeoczony zawał",
    summary: "Lekarz SOR wypisał do domu starszą pacjentkę z cechami zawału w EKG; zmarła w domu. Wcześniej sąd karny skazał go na grzywnę.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Starsza pacjentka kilka razy trafiała na SOR z osłabieniem, bólem brzucha i zawrotami głowy. Przy ostatnim pobycie lekarz zlecił badania i EKG, wyrównał zaburzenia elektrolitowe i wypisał ją do domu. Wkrótce zmarła; sekcja wykazała świeży zawał serca.",
      "Biegli: EKG wykonano dopiero po półtorej godziny (zalecenie: do 10 minut), a zapis miał cechy zawału. Nie oznaczono troponin, nie powtórzono EKG, nie zlecono konsultacji kardiologa. Czy szybkie przekazanie do kardiologii by ją uratowało — nie da się stwierdzić, „lecz nie można tego wykluczyć”.",
      "Sąd karny prawomocnie skazał lekarza na grzywnę (150 stawek dziennych) za nieumyślne narażenie pacjentki na niebezpieczeństwo. Lekarz przyznał się; uniesienia w EKG uznał wtedy za mieszczące się w normie u starszej osoby.",
    ],
    charge: "Brak należytej staranności — nieumyślne narażenie pacjentki (art. 1 ust. 3 i art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Uznany za winnego, ale postępowanie umorzone (art. 82 ust. 2): kara byłaby oczywiście niecelowa wobec wyroku karnego." },
    reasoning:
      "Sąd przyznał, że zawał przebiegał w sposób „szczególnie trudny diagnostycznie”, ale powtarzające się utraty przytomności i zapis EKG powinny były skłonić do dalszej diagnostyki. Przy umorzeniu wziął pod uwagę grzywnę z wyroku karnego, niekaralność i skruchę.",
    file: "OSL/OSL.07.17W.docx",
  },
  {
    id: "dokumentacja-dla-sadu",
    title: "Dokumentacja, której nie dostał sąd",
    summary: "Lekarz przez ponad rok nie wydał sądowi dokumentacji medycznej zmarłego pacjenta, potrzebnej w sprawie o spadek.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "W sprawie o stwierdzenie nabycia spadku sąd cywilny potrzebował dokumentacji medycznej spadkodawcy, żeby biegły ocenił, czy świadomie sporządził testament. Lekarz był jedynym, u którego zmarły się leczył.",
      "Przez ponad rok sąd wzywał go listownie, telefonicznie i mailowo; dwa razy ukarał go grzywną. Lekarz mówił kolejno, że dokumentację wysłał, że nie pamięta kiedy, prosił o kontakt później. Na pisma rzecznika też nie odpowiadał.",
      "Dopiero przed rzecznikiem stwierdził, że „pierwszy raz w życiu” zaginęła mu dokumentacja pacjenta. Sąd lekarski w to nie uwierzył.",
    ],
    charge: "Nieudostępnienie dokumentacji medycznej sądowi (art. 26 ust. 3 ustawy o prawach pacjenta, art. 41 ust. 2 ustawy o zawodach lekarza, art. 1 ust. 3 KEL).",
    verdict: { level: 2, text: "Nagana." },
    reasoning:
      "Lekarz wiedział o żądaniu — odebrał wezwanie i rozmawiał z sądem — a sąd bez dokumentacji nie mógł prowadzić sprawy. Na korzyść lekarza sąd wziął tylko wcześniejszą niekaralność.",
    file: "OSL/OSL.07.18W.docx",
  },
  {
    id: "medycyna-pracy-uprawnienia",
    title: "Badania pracowników bez uprawnień",
    summary: "Lekarka wydawała orzeczenia o zdolności do pracy bez aktualnych uprawnień lekarza medycyny pracy.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Wojewódzki ośrodek medycyny pracy skontrolował badania profilaktyczne pracowników w praktyce lekarki. Wyszło, że nie miała aktualnych uprawnień lekarza medycyny pracy, używała nieaktualnej pieczątki i prowadziła dokumentację niezgodnie z przepisami.",
      "Jednemu pracownikowi wydała orzeczenie o zdolności do pracy bez wymaganej konsultacji okulistycznej.",
      "Rzecznik początkowo odmówił wszczęcia sprawy; sąd lekarski uchylił tę decyzję po zażaleniu. Lekarka przyznała się, wyraziła skruchę i zrezygnowała z badań pracowniczych.",
    ],
    charge: "Brak staranności, przekroczenie kompetencji, dokumentacja niezgodna z przepisami (art. 8 i 10 KEL).",
    verdict: { level: 1, text: "Upomnienie." },
    reasoning:
      "Sąd uznał, że doszło do „przekroczenia kompetencji przy wykonywaniu czynności orzeczniczych”, ale wziął pod uwagę dotychczasowy przebieg pracy, świadomość błędów i rezygnację z badań.",
    file: "OSL/OSL.07.19W.docx",
  },
  {
    id: "sor-symulant",
    title: "SOR: pacjent uznany za symulanta",
    summary: "Lekarz SOR po niespełna trzech minutach uznał objawy pacjenta za wymyślone, nie zbadał go i nie zostawił dokumentacji.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Młody mężczyzna przyszedł na SOR z ostrym bólem głowy, drętwieniem rąk, zaburzeniami wzroku i mowy oraz wysokim ciśnieniem. Lekarz po niespełna trzech minutach uznał objawy za wymyślone i kazał kupić w aptece tabletkę przeciwbólową. Gdy brat pacjenta poprosił o pisemne potwierdzenie, że nic mu nie grozi, lekarz — według skargi — krzyczał i wyrzucił obu z oddziału.",
      "Po południu lekarz nocnej opieki zbadał pacjenta i skierował go z powrotem na SOR; tomografia głowy wyszła prawidłowo. Z wizyty u pierwszego lekarza nie było żadnej dokumentacji.",
      "Lekarz nie stawił się ani u rzecznika, ani w sądzie i nie odbierał korespondencji. Był już wcześniej karany upomnieniem i naganą, a w innych sprawach toczyły się postępowania o podobne zarzuty.",
    ],
    charge: "Niezbadanie pacjenta i brak dokumentacji porady (art. 1 ust. 3 KEL, art. 4 i 41 ust. 1 ustawy o zawodach lekarza); sąd sam uzupełnił opis czynu o niezbadanie pacjenta.",
    verdict: { level: 6, text: "Zawieszenie prawa wykonywania zawodu na 5 lat — najdłużej, jak pozwala ustawa — i publikacja orzeczenia w biuletynie izby." },
    reasoning:
      "Sąd „nie dopatrzył się żadnych okoliczności łagodzących”: lekarz nie okazał skruchy, lekceważył samorząd, a wcześniejsza kara nie uległa zatarciu. Błędne uznanie pacjenta za symulanta „całkowicie dyskredytuje lekarza” — choć, na szczęście, nie miało poważnych skutków dla zdrowia.",
    file: "OSL/OSL.07.20W.docx",
  },
  {
    id: "most-filar",
    title: "Dentysta: most na chorym zębie",
    summary: "Dentysta oparł most protetyczny na zębie ze zmianą zapalną przy korzeniu, nie robiąc aktualnego zdjęcia.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjentka chciała odbudować ułamany ząb, leczony wcześniej kanałowo. Dentysta nie zlecił zdjęcia — posłużył się przyniesionym przez nią pantomogramem, zapewnił, że korzeń jest zdrowy, i założył most na tym i sąsiednim zębie.",
      "Później tomografia w innym gabinecie wykazała rozległy stan zapalny przy tym zębie. Biegły protetyk: ząb nie nadawał się na filar, a przed pracą trzeba było zrobić zdjęcie punktowe lub tomografię. Dokumentacja była uboga — bez planu leczenia i opisanej zgody.",
      "Dentysta zaproponował leczenie naprawcze, ale odmówił zwrotu kosztów. Obrońca twierdził, że ząb zakwalifikowała inna dentystka. Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Nieprawidłowe leczenie protetyczne (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "Dentysta miał obowiązek sam sprawdzić, czy ząb nadaje się na filar; NSL nie przyjął, że zrobiła to inna lekarka. Sąd I instancji wziął na korzyść propozycję leczenia naprawczego i to, że pacjentka nadal używa mostu.",
    file: "NSL/NSL.01.01-2024W.docx",
  },
  {
    id: "ortodontka-ekstrakcje",
    title: "Ortodoncja: trzy zbędne ekstrakcje",
    summary: "Dentystka usunęła pacjentce trzy zęby do leczenia ortodontycznego, choć według biegłej nie było takiej potrzeby.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Na pierwszej wizycie lekarka zdecydowała o usunięciu trzech zębów i założeniu aparatu stałego na oba łuki. Po około 2,5 roku chciała zakończyć leczenie; pacjentka nie przyjęła efektu i poszła do innego specjalisty.",
      "Biegła ortodontka: dokumentację do planowania wykonano, ale jej nie przeanalizowano — ekstrakcje były zbędne, prawidłowego zgryzu nie osiągnięto, a warunki zębowo-wyrostkowe się pogorszyły. W dokumentacji nie było planu leczenia ani opisu aktywacji aparatu.",
      "Lekarka twierdziła, że to pacjentka przerwała leczenie i nie chciała retencji; proponowała mediację. Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Nieprawidłowe leczenie ortodontyczne i nierzetelna dokumentacja (art. 6, 8 i 28 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana, a za dokumentację upomnienie. Sąd I instancji orzekł zawieszenie prawa wykonywania zawodu na rok — NSL złagodził je do nagany." },
    reasoning:
      "NSL nie miał wątpliwości co do winy, ale rok zawieszenia uznał za „zbyt surowy”: to pierwsze przewinienie, obrońca przedstawił sytuację rodzinną lekarki, a ona sama chciała mediacji. Próbę zrzucenia decyzji o ekstrakcjach na lekarza, który je wykonał, NSL nazwał „niestosowną i nieetyczną”.",
    file: "NSL/NSL.01.02-2024W.docx",
  },
  {
    id: "rtg-radiolog",
    title: "Opis RTG: przeoczony nowotwór",
    summary: "Radiolog opisał zdjęcie płuc bez sugestii pilnej tomografii; nowotwór rozpoznano dwa tygodnie później, pacjent zmarł.",
    label: "lekarz 1 z 2",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjent z bólem w klatce piersiowej trafił na SOR. Radiolog opisał zdjęcie rentgenowskie płuc (zagęszczenia, cechy zastoju), ale nie zasugerował pilnej tomografii. Sam przyznał później, że zmiany pozwalały podejrzewać nowotwór, choć „nie była to sprawa ewidentna”.",
      "Dwa tygodnie później tomografia wykazała zaawansowany nowotwór płuca; pacjent zmarł. Biegły powołany przez NSL: samo RTG nie pozwalało jednoznacznie rozpoznać nowotworu.",
      "Odwołanie wniosła rodzina pacjenta: chciała, by sąd przypisał lekarzowi wpływ na opóźnienie rozpoznania i zgon.",
    ],
    charge: "Nieprawidłowy opis badania RTG, który mógł opóźnić rozpoznanie (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "Brak sugestii pilnej tomografii był uchybieniem, ale NSL nie przypisał lekarzowi wpływu na zgon — „nie można domniemywać” okoliczności, za które ponosi się odpowiedzialność. Według NSL tomografia na SOR „nie była w stanie odmienić tragicznych losów chorego”.",
    file: "NSL/NSL.01.03-2024W.docx",
  },
  {
    id: "rtg-pulmonolog",
    title: "Konsultacja: tomografia ambulatoryjnie",
    summary: "Pulmonolożka konsultowała tego samego pacjenta na podstawie opisu RTG i zaleciła tomografię ambulatoryjnie.",
    label: "lekarz 2 z 2",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pulmonolożka na dyżurze konsultowała tego samego pacjenta na SOR. Według zarzutu oparła się na opisie RTG, nie oglądając zdjęcia, i źle oceniła stan chorego.",
      "Nie widziała wskazań do pilnej hospitalizacji, ale zaleciła antybiotyk i tomografię ambulatoryjnie — zapisała to w karcie. Tłumaczyła, że na dyżurze miała 28 pacjentów na oddziale i do tego konsultacje.",
      "Odwołanie wniosła rodzina pacjenta, chcąc ponownego rozpoznania sprawy.",
    ],
    charge: "Brak należytej staranności w ocenie stanu chorego (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Uniewinnienie — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "Wątpliwość, czy oglądała zdjęcie, NSL rozstrzygnął na jej korzyść. Zalecenie tomografii po antybiotykoterapii uznał za spełnienie wymogu należytej staranności — stan pacjenta był wtedy dobry.",
    file: "NSL/NSL.01.03-2024W.docx",
  },
  {
    id: "ozonoterapia",
    title: "Ozonoterapia dożylna",
    summary: "Lekarz w prywatnej „klinice” podawał pacjentom dożylnie ozonowaną krew — metodą bez naukowego potwierdzenia.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Izba lekarska sprawdzała lekarzy w placówkach reklamujących się jako „kliniki witaminowe”. W prywatnej placówce lekarz pobierał pacjentom 100–150 ml krwi, ozonował ją i podawał z powrotem do żyły. Strona placówki wymieniała choroby, które zabieg miał leczyć; lekarz mówił o 150 chorobach.",
      "Biegli: skuteczności dożylnej ozonoterapii nie potwierdzono w wiarygodnych badaniach — efekty nie przekraczały placebo. Taki zabieg z krwią powinien też podlegać przepisom o publicznej służbie krwi.",
      "Sprawa wróciła do NSL po wyroku Sądu Najwyższego, który kazał zasięgnąć opinii biegłych. Po rozprawie obrońca oświadczył, że lekarz zaprzestał tych zabiegów.",
    ],
    charge: "Stosowanie metod niezweryfikowanych naukowo (art. 57 ust. 1 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 3, text: "Kara pieniężna na fundację pomagającą dzieciom z chorobami nowotworowymi — orzeczona w I instancji i utrzymana przez NSL." },
    reasoning:
      "NSL: „Zdobywanie pieniędzy za wszelką cenę od ciężko chorych pacjentów jest niezgodne z etyką lekarską”. Okoliczności łagodzących nie znalazł — lekarz nie okazał poczucia winy; kara pieniężna miała być realną dolegliwością wobec czerpania korzyści.",
    file: "NSL/NSL.01.04-2024W.docx",
  },
  {
    id: "ortodoncja-11-lat",
    title: "Ortodoncja: jedenaście lat leczenia",
    summary: "Leczenie ortodontyczne tyłozgryzu trwało około 11 lat i nie przyniosło prawidłowego zgryzu.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Ortodontka leczyła pacjentkę z tyłozgryzem aparatem lingwalnym, a potem nakładkami. Według biegłej cel leczenia wymagał przesunięcia zębów szczęki, a zamykanie luk w żuchwie bez zakotwienia szkieletowego sprzyjało nasileniu wady. Przeciętne leczenie trwa 2–3 lata; tu trwało około 11 lat i prawidłowego zgryzu nie osiągnięto. Dokumentacja była skąpa.",
      "Lekarka wskazywała na brak współpracy pacjentki i jej odmowę usunięcia zęba mądrości. Pacjentka złożyła skargę dwa i pół roku po zakończeniu leczenia.",
      "Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Brak staranności w leczeniu i dokumentacji (art. 8 i 54 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Umorzenie z powodu przedawnienia. Sąd I instancji orzekł naganę i dwa upomnienia — NSL je uchylił, bo minęło 5 lat od czynu." },
    reasoning:
      "NSL zaznaczył, że materiał dowodowy „nie uzasadnia” uniewinnienia — przewinienie się po prostu przedawniło. Wskazał, że skargę złożono późno, a część postępowania przypadła na pandemię, i „ubolewa nad długotrwałością” takich spraw.",
    file: "NSL/NSL.01.05-2024W.docx",
  },
  {
    id: "maseczka-stetoskop",
    title: "Kwalifikacja do szczepienia bez maseczki",
    summary: "Właściciel przychodni kwalifikował pacjentkę do szczepienia przeciw COVID-19 bez maseczki i niezdezynfekowanym stetoskopem.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjentka przyszła na trzecią dawkę szczepionki przeciw COVID-19. Kwalifikował ją lekarz — właściciel i kierownik przychodni — bez maseczki i rękawiczek; stetoskopu nie zdezynfekował ani przed, ani po osłuchaniu.",
      "Lekarz to przyznał: jako właściciel wydał zarządzenie, że przyjmujący pacjentów nie muszą nosić maseczek, a stetoskop jego zdaniem „nie nadaje się do dezynfekcji”. Pacjentka nie doznała uszczerbku na zdrowiu.",
      "Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Niezapewnienie odpowiedniej jakości opieki — niezachowanie standardów sanitarnych w czasie epidemii (art. 11 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "Fakty były bezsporne. NSL wskazał, że stetoskop może przenosić zakażenia, a kara upomnienia jest „w pełni zasadna i konieczna” z potrzeb prewencji.",
    file: "NSL/NSL.01.06-2024W.docx",
  },
  {
    id: "negowanie-epidemii",
    title: "Publiczne negowanie epidemii",
    summary: "Pediatra na spotkaniu stowarzyszenia mówiła, że epidemie to „jedno wielkie kłamstwo”.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Na publicznym spotkaniu stowarzyszenia lekarka powiedziała w przemówieniu, że „te wszystkie epidemie to jest jedno wielkie kłamstwo”, i mówiła o szczepionkach. W tamtym roku w Polsce odnotowano 339 przypadków odry, wobec 63 rok wcześniej.",
      "Tłumaczyła, że chodziło jej o epidemie „medialne”, np. za granicą, i że przemówienie przerwano. NSL odtworzył całe nagranie i uznał tę wersję za „wręcz nieprawdopodobną”.",
      "Sprawa wróciła do NSL po wyroku Sądu Najwyższego — wcześniej obrońcę usunięto z sali rozpraw za brak maseczki, co naruszyło prawo do obrony.",
    ],
    charge: "Publiczne kwestionowanie występowania epidemii (art. 71 KEL).",
    verdict: { level: 0, text: "Umorzenie z powodu przedawnienia. Sąd I instancji orzekł naganę — NSL ją uchylił, bo minęło 5 lat od wypowiedzi." },
    reasoning:
      "NSL zaznaczył, że nie ma warunków do „całkowitego oczyszczenia” lekarki: czyn „nadal pozostaje przewinieniem zawodowym”, ale po przedawnieniu nie można za niego ukarać.",
    file: "NSL/NSL.01.07-2024W.docx",
  },
  {
    id: "ortodoncja-dieta",
    title: "Ortodoncja z dietą i wkładkami",
    summary: "Dentysta bez specjalizacji z ortodoncji leczył zgryz niezweryfikowaną metodą i zalecał dietę, sól gorzką i wkładki ortopedyczne.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjentka z bólami stawów skroniowo-żuchwowych i szumami usznymi znalazła dentystę w internecie. Ten zalecił jej m.in. dietę GAPS z podręcznikiem, sól gorzką, kurkumę, ozonowanie uszu, wkładki ortopedyczne i pas — według ustaleń kupione w jego gabinecie — oraz rozpoznał u niej wadę postawy i problemy dróg żółciowych.",
      "Zgryz leczył nadbudowami, które miały „wysunąć” zęby boczne. Dwie niezależne biegłe ortodontki: diagnoza była błędna, metoda niezweryfikowana naukowo, a u takich pacjentów to błąd w sztuce. Po ponad trzech latach pacjentka czuła się i wyglądała gorzej — wada się pogłębiła, pojawiły się recesje dziąseł i resorpcja korzeni.",
      "Dentysta przedstawiał się jako instruktor zagranicznego stowarzyszenia ortodontycznego; zarzutu posługiwania się tytułem specjalisty nie udowodniono. Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Błędna diagnoza i leczenie niezgodne ze współczesną wiedzą, wykraczanie poza kompetencje (art. 8 i 10 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 5, text: "Ograniczenie zakresu czynności na 6 miesięcy — zakaz samodzielnego wykonywania zabiegów ortodontycznych. Orzeczone w I instancji, utrzymane przez NSL." },
    reasoning:
      "NSL uznał, że dentysta ma „duże braki wiedzy” o współczesnej ortodoncji, nie poprosił o pomoc mimo pogorszenia, a zalecenia dietetyczne i ortopedyczne wykraczają poza kompetencje lekarza dentysty. Czas ograniczenia ma posłużyć uzupełnieniu wiedzy.",
    file: "NSL/NSL.01.08-2024W.docx",
  },
  {
    id: "nietrzezwa-gabinet",
    title: "Nietrzeźwa w gabinecie",
    summary: "Lekarka w czterech różnych dniach przyjmowała pacjentów w gabinecie w stanie nietrzeźwości.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "W czterech różnych dniach lekarka przyszła do pracy w gabinecie nietrzeźwa i przyjmowała pacjentów. Sprawa zaczęła się od pisma komisji izby lekarskiej badającej jej zdolność do wykonywania zawodu i notatki policji z interwencji w gabinecie.",
      "Nie ustalono narażenia konkretnego pacjenta; policja i prokuratura uznały, że czyn nie był przestępstwem. Wcześniej lekarka nie była karana.",
      "Od orzeczenia I instancji lekarka się odwołała, ale potem odwołanie cofnęła.",
    ],
    charge: "Stawienie się do pracy w stanie nietrzeźwości (art. 1 ust. 2 i 3, art. 8 i 64 KEL).",
    verdict: { level: 6, text: "Zawieszenie prawa wykonywania zawodu na rok — orzeczone w I instancji; NSL pozostawił odwołanie bez rozpoznania, bo lekarka je cofnęła." },
    reasoning:
      "Sąd I instancji nazwał przychodzenie do pracy po alkoholu „jednym z najbardziej skrajnych przykładów naruszenia zasad wykonywania zawodu” i podkreślił, że zdarzenia nie były incydentalne.",
    file: "NSL/NSL.02.01-2024W.docx",
  },
  {
    id: "cztery-dechy",
    title: "Wizyta domowa: „cztery dechy”",
    summary: "Lekarz na wizycie domowej powiedział: „Weź sobie cztery dechy, zbij pudło i idź się połóż na cmentarz”, a później stwierdził zgon pacjenta bez oględzin.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Lekarz przyjechał na wizytę domową do pacjenta po nadużyciu alkoholu. Zbadał go, rozpoznał ostry brzuch, wystawił skierowanie do szpitala i polecił rodzinie zawieźć chorego na chirurgię. Wychodząc, powiedział: „Weź sobie cztery dechy, zbij pudło i idź się połóż na cmentarz”. Twierdził, że mówił to do rodziny, jako ostrzeżenie przed skutkami picia.",
      "Stan pacjenta się pogorszył; zmarł mimo reanimacji. Lekarz wystawił kartę zgonu bez oględzin zwłok, tylko na podstawie karty od ratownika medycznego — sam przyznał, że „sytuacja taka nie powinna mieć miejsca”. Sąd nie wiązał śmierci pacjenta z zarzutami.",
      "Lekarz odwołał się od orzeczenia I instancji, a potem odwołanie cofnął.",
    ],
    charge: "Naruszenie zasad etyki w kontakcie z pacjentem (art. 8 i 12 KEL) i stwierdzenie zgonu bez osobistych oględzin (art. 43 ust. 1 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana za stwierdzenie zgonu bez oględzin i upomnienie za słowa — orzeczone w I instancji; NSL pozostawił odwołanie bez rozpoznania po jego cofnięciu." },
    reasoning:
      "Sąd I instancji: takie słowa są niedopuszczalne wobec chorego i rodziny nawet przy dobrych intencjach, a obowiązku osobistych oględzin nie zastąpi karta ratownika. Karę złagodziły częściowa skrucha i przyznanie się.",
    file: "NSL/NSL.02.02-2024W.docx",
  },
  {
    id: "badanie-bez-zgody",
    title: "Badanie psychiatryczne bez zgody",
    summary: "Psychiatra na prośbę męża zbadał kobietę w domu bez jej zgody i dał mężowi skierowanie do szpitala psychiatrycznego.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Mąż, w długim konflikcie z żoną, poprosił o domową wizytę psychiatry. Żona nie została uprzedzona i nie zgodziła się na badanie — tylko „z grzeczności” na rozmowę, a lekarz nie powiedział jej, że to badanie psychiatryczne. Rozmowa dotyczyła głównie konfliktu małżeńskiego.",
      "Po rozmowie lekarz wystawił skierowanie do szpitala psychiatrycznego i przekazał je mężowi, bez wiedzy pacjentki. Biegli z psychiatrii, medycyny ratunkowej i sądowej: nie było podstaw do skierowania ani zagrożenia życia lub zdrowia.",
      "Od orzeczenia I instancji odwołali się obrońcy lekarza i pełnomocniczka pokrzywdzonej, która żądała pozbawienia go prawa wykonywania zawodu.",
    ],
    charge: "Badanie bez zgody pacjentki i skierowanie do szpitala bez przesłanek (art. 15 ust. 3 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Umorzenie z powodu przedawnienia. Sąd I instancji orzekł naganę — NSL ją uchylił, bo minęło 5 lat od czynu." },
    reasoning:
      "NSL przyznał, że przypisanie winy było zasadne: skierowanie wystawiono bez przesłanek i bez zgody na badanie, a czyn „nadal pozostaje przewinieniem”. Nie było jednak postępowania karnego, które przedłużałoby termin, więc kary wymierzyć nie można.",
    file: "NSL/NSL.02.03-2024W.docx",
  },
  {
    id: "sor-kregoslup",
    title: "SOR: złamany kręgosłup po wypadku",
    summary: "Lekarka SOR nie zleciła badania kręgosłupa po wypadku samochodowym; złamanie kręgu wykryto po 20 dniach.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Młoda kobieta, kierująca samochodem, uderzyła w ogrodzenie. Ratownicy przywieźli ją na desce ortopedycznej z kołnierzem; ból lędźwiowy oceniono na 8 w skali 10. Lekarka dyżurna, internistka, zleciła tomografię głowy i badania krwi, ale nie badanie kręgosłupa — i rozpoznała stłuczenie.",
      "W karcie wypisowej znalazł się wpis o tomografii kręgosłupa bez zmian, choć takiego badania nie wykonano. Przez ten wpis lekarz rodzinny nie wystawił zwolnienia ani skierowania. Po 20 dniach rentgen wykazał złamanie kręgu L1.",
      "Lekarka twierdziła, że diagnostyka była wystarczająca, a ból nie mógł być silny, skoro pacjentka zgłosiła się do lekarza dopiero po 20 dniach. Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Niezlecenie badania kręgosłupa, które opóźniło rozpoznanie złamania (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 3, text: "Kara pieniężna — jednokrotność przeciętnego wynagrodzenia. Sąd I instancji orzekł trzykrotność, NSL ją obniżył. Z zarzutu poświadczenia nieprawdy w karcie lekarkę uniewinniono." },
    reasoning:
      "Winę NSL uznał za bezsporną — dwie zgodne opinie biegłych wskazywały na konieczność badania obrazowego. Karę złagodził: niekaralność w długiej pracy, trudna praca na SOR przy niedostatecznej obsadzie, lekarka jest internistką, nie ortopedą, a nierozpoznanie złamania nie miało większych skutków.",
    file: "NSL/NSL.02.04-2024W.docx",
  },
  {
    id: "karetka-nietrzezwy",
    title: "Karetka: nietrzeźwy kierownik zespołu",
    summary: "Lekarz kierujący zespołem ratownictwa był nietrzeźwy, nie zbadał pacjenta z dusznością i nie nadzorował transportu; pacjent zmarł.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Zespół ratownictwa przyjechał do pacjenta z silnym bólem brzucha i dusznością. Lekarz kierujący zespołem został w karetce i palił papierosa; do domu poszedł dopiero na żądanie żony chorego. Według rodziny i ratowników nie zbadał pacjenta — robili to ratownicy. Saturacja wynosiła 80%, a zlecono Relanium, przeciwwskazane przy niewydolności oddechowej.",
      "W czasie transportu siedział obok kierowcy i palił. Rodzina wyczuła od niego alkohol; badanie krwi wykazało ok. 1,2 promila. Pacjent zmarł z powodu masywnej zatorowości płucnej. Sąd karny skazał lekarza za wykonywanie czynności w stanie nietrzeźwości.",
      "NSL uznał, że nie da się pewnie powiązać postępowania lekarza ze śmiercią — choroba miała dynamiczny przebieg, a rokowanie i tak było złe. Sprawa trafiła do NSL po odwołaniu obrony.",
    ],
    charge: "Brak należytej staranności w stanie nietrzeźwości (art. 8 i 64 KEL).",
    verdict: { level: 6, text: "Zawieszenie prawa wykonywania zawodu na rok. Sąd I instancji orzekł 2 lata zawieszenia i naganę za dwa osobne czyny; NSL uznał to za jeden czyn i wymierzył jedną karę." },
    reasoning:
      "NSL nie miał wątpliwości co do winy: kierownik zespołu ma obowiązek osobiście zbadać chorego i go nadzorować. Rozbicie jednego zachowania na dwa przewinienia uznał za rażąco niesprawiedliwe. Na korzyść: niekaralność i dynamiczny przebieg choroby; lekarz był jednak „bezrefleksyjny” i „arogancki wobec standardów”.",
    file: "NSL/NSL.02.05-2024W.docx",
  },
  {
    id: "nocna-opieka-recepta",
    title: "Nocna opieka: „symulanci” i cudza recepta",
    summary: "Lekarka na nocnym dyżurze wulgarnie zarzuciła małżonkom symulowanie choroby i dała pacjentce receptę wystawioną na inną osobę.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Małżonkowie z objawami grypy, którzy nie mogli dostać się do lekarza rodzinnego, przyszli w nocy do nocnej opieki. Lekarka, pod koniec 13,5-godzinnego dyżuru z około 50 pacjentami, zbadała oboje i rozpoznała infekcję. Wulgarnie okazywała niezadowolenie i sugerowała, że symulują, by wyłudzić zwolnienie.",
      "Kobiecie wydała kartę i receptę z danymi innej pacjentki — zauważyła to sama pacjentka w domu. Lekarka poprawiła dokumentację i zaproponowała wymianę recepty. Tłumaczyła się epidemią grypy i nieprzespaną nocą.",
      "Sprawa była już wcześniej uchylana i rozpoznawana ponownie; do NSL trafiła po odwołaniu obrony.",
    ],
    charge: "Nierzetelna dokumentacja (art. 41 ustawy o zawodach lekarza) i nieetyczne zachowanie wobec pacjentów (art. 12 KEL).",
    verdict: { level: 0, text: "Umorzenie z powodu przedawnienia. Sąd I instancji dał upomnienie za zachowanie, a sprawę recepty umorzył jako przewinienie mniejszej wagi — NSL uchylił całość, bo minęło 5 lat." },
    reasoning:
      "NSL zaznaczył, że materiał dowodowy nie uzasadniał uniewinnienia od żadnego z zarzutów — sprawa po prostu się przedawniła.",
    file: "NSL/NSL.02.06-2024W.docx",
  },
  {
    id: "teleporada-udar",
    title: "Teleporada przy objawach udaru",
    summary: "Lekarka zastępująca lekarza rodzinnego wysłała do starszej pacjentki pielęgniarkę zamiast wezwać pogotowie; następnego dnia pacjentka trafiła na neurologię z udarem.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Syn zadzwonił do przychodni: matka nie może utrzymać laski ani stanąć na prawej nodze, drętwieją jej palce. Lekarka zastępowała lekarza rodzinnego w długi weekend i obsługiwała dwa rejony. Wysłała doświadczoną pielęgniarkę środowiskową.",
      "Pielęgniarka zbadała chorą — ciśnienie, cukier, ocena w kierunku udaru wypadła negatywnie — i po konsultacji telefonicznej zapisała zalecenia: odpoczynek, a przy opadnięciu kącika ust wezwanie pogotowia. Po południu stan się pogorszył; według syna matka dwa razy odmówiła jazdy do szpitala. Następnego dnia trafiła na neurologię z porażeniem.",
      "Skargę i odwołanie złożył syn pacjentki.",
    ],
    charge: "Niewezwanie pogotowia przy objawach mogących wskazywać na udar i brak dokumentacji teleporady (art. 8 KEL, art. 4 i 41 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Uniewinnienie od obu zarzutów — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "NSL uznał, że lekarka dochowała staranności: wysłała doświadczoną pielęgniarkę i wydała jasne zalecenie wezwania pogotowia przy pogorszeniu. W dacie zdarzenia nie było przepisów o teleporadzie, a wątpliwości rozstrzyga się na korzyść obwinionej.",
    file: "NSL/NSL.02.07-2024W.docx",
  },
  {
    id: "rynoplastyka",
    title: "Chirurgia plastyczna: operacja nosa",
    summary: "Pacjentka zarzuciła chirurgowi plastycznemu złą technikę operacji nosa i brak informacji o powikłaniach; rok później stwierdzono perforację przegrody.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjentka z trudnościami w oddychaniu, która chciała też poprawić wygląd nosa, była na trzech konsultacjach. Lekarz zlecił tomografię zatok i przeprowadził operację przegrody i nosa. Podpisała spersonalizowany formularz zgody; twierdziła, że podpisała pusty druk.",
      "Kontrole po zabiegu nie wykazały nieprawidłowości. Perforację przegrody stwierdził rok później inny laryngolog; kolejny lekarz wykonał operację korekcyjną. Biegli ocenili technikę jako niewłaściwą, ale nie badali pacjentki po pierwszej operacji.",
      "Drugi zarzut dotyczył wizyty kontrolnej, której nie ma w dokumentacji — lekarz twierdził, że w ogóle się nie odbyła. Do NSL odwołała się obrona.",
    ],
    charge: "Brak należytej staranności przy kwalifikacji, zgodzie i operacji oraz nieodnotowana wizyta (art. 6, 8, 13 i 28 KEL).",
    verdict: { level: 0, text: "Uniewinnienie od obu zarzutów. Sąd I instancji orzekł 12 miesięcy zakazu operacji głowy (ograniczenie zakresu czynności) i upomnienie — NSL zmienił to na uniewinnienie." },
    reasoning:
      "NSL: nie ma obiektywnego dowodu na pusty druk zgody, na złą technikę ani na związek perforacji z operacją, a opinie biegłych budzą „poważne wątpliwości”. Za wiarygodne źródło uznał dokumentację medyczną; wątpliwości rozstrzyga się na korzyść obwinionego.",
    file: "NSL/NSL.07.11-2024W.docx",
  },
  {
    id: "dyzur-chirurgia-zgon",
    title: "Dyżur na chirurgii: zgon po operacji",
    summary: "Lekarka dyżurna usunęła sondę żołądkową pacjentowi po operacji wyrostka i nie zostawiła wpisu z dyżuru; dwa dni później pacjent zmarł.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjenta zoperowano z powodu zgorzelinowego, perforowanego zapalenia wyrostka. W trzeciej dobie dyżur miała obwiniona: usunęła sondę żołądkową z powodu dyskomfortu pacjenta i zleciła potas. W dokumentacji brak obserwacji lekarskiej z tego dnia.",
      "Żona pacjenta, pielęgniarka, oceniała jego stan jako zły, ale z lekarką nie rozmawiała. Lekarka twierdziła, że pacjent był stabilny i chodził sam. W kolejnej dobie pojawiły się gorączka i wymioty; tomografia wykazała niedrożność jelit i podejrzenie ropnia. Po ponownej operacji pacjent zmarł we wstrząsie septycznym.",
      "Biegły chirurg zakwestionował tylko postępowanie lekarza dyżurnego. Sprawa była już raz w NSL; po ponownym rozpoznaniu odwołali się obrońca lekarki i pełnomocnik żony pacjenta.",
    ],
    charge: "Niedostrzeżenie pogorszenia stanu pacjenta i brak wpisu w dokumentacji, co miało opóźnić reoperację (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Uniewinnienie. Sąd I instancji przy ponownym rozpoznaniu orzekł naganę; pełnomocnik żony chciał kary pieniężnej — NSL uniewinnił." },
    reasoning:
      "NSL: z dowodów nie wynika, że lekarka wiedziała o pogorszeniu, a brak wpisu w trakcie dyżuru nie ma związku przyczynowego ze zgonem. Opinia biegłego nie może być „naddowodem”, a wpis niezgodny z prawdą musi być „niewątpliwy, a nie tylko prawdopodobny”.",
    file: "NSL/NSL.06.02-2024W.docx",
  },
  {
    id: "dmso-transmisja",
    title: "Transmisja na żywo: DMSO i perhydrol",
    summary: "Lekarz w transmisji internetowej mówił, że w zapaleniu płuc przy COVID-19 podałby witaminę C, DMSO albo rozcieńczony perhydrol.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Lekarz z wieloletnim doświadczeniem wystąpił w transmisji na żywo z osobą spoza zawodu. Nie reagował, gdy rozmówca mówił, że witamina C ratuje życie, a lekarze mają „bzdurne procedury”, przez które ludzie umierają w szpitalach.",
      "Sam mówił, że dożylne DMSO działa silnie przeciwzapalnie i nie stosuje się go „ze względu na biznes w medycynie”, że rozcieńczony nadtlenek wodoru ma „znakomite efekty lecznicze” i że w zapaleniu płuc przy COVID-19 zastosowałby witaminę C, DMSO lub perhydrol. Żadna z tych tez nie ma potwierdzenia w badaniach klinicznych.",
      "Faktów nie kwestionował. Kwestionował natomiast to, że w ogóle podlega samorządowi lekarskiemu, a do sądu napisał, że jego członkowie powinni się „douczyć”. Do NSL odwołał się sam.",
    ],
    charge: "Szerzenie informacji niezgodnych z aktualną wiedzą medyczną i podważanie zaufania do lekarzy (art. 1, 2, 4, 57 i 71 KEL).",
    verdict: { level: 6, text: "Zawieszenie prawa wykonywania zawodu na rok i kara pieniężna — czterokrotność przeciętnego wynagrodzenia. Orzeczone w I instancji, utrzymane przez NSL." },
    reasoning:
      "NSL: „oczywiście naganna postawa zawodowa” i względy prewencyjne; kary „dolegliwe, jednak nie nadmiernie represyjne”. Złagodzić mogłaby je udokumentowana zmiana postawy, której „dotychczas nie potwierdzono”. Sąd I instancji wziął pod uwagę duży zasięg przekazu i pismo z obraźliwymi epitetami.",
    file: "NSL/NSL - 0005-25.pdf",
  },
  {
    id: "karetka-aorta",
    title: "Karetka: „kręcz szyi” przy chorej aorcie",
    summary: "Lekarka kierująca zespołem ratownictwa rozpoznała kręcz szyi u pacjentki z bólem w klatce i poszerzoną aortą i zostawiła ją w domu; pacjentka zmarła.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pogotowie wezwano do pacjentki z zasłabnięciem i bólem w klatce piersiowej promieniującym do łopatek. Rodzina powiedziała o nadciśnieniu i poszerzeniu aorty i pokazała dokumentację. Zespół zrobił EKG, a lekarka rozpoznała kręcz szyi, podała leki w zastrzyku i zostawiła chorą w domu.",
      "Ból nie ustępował. Rodzina zawiozła pacjentkę do lekarza rodzinnego, ten skierował ją na SOR; badanie wykazało rozwarstwienie aorty. Po operacji kardiochirurgicznej pacjentka zmarła. Biegli: przy znanej chorobie aorty należało ją przewieźć do szpitala, ale nawet wtedy nie było pewności uratowania życia.",
      "Sąd karny prawomocnie skazał lekarkę na grzywnę za nieumyślne narażenie pacjentki na niebezpieczeństwo utraty życia. Do NSL odwołała się obrona.",
    ],
    charge: "Brak należytej staranności: błędne rozpoznanie i zaniechanie przewiezienia do szpitala (art. 1 ust. 3 i art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana — orzeczona w I instancji i utrzymana przez NSL." },
    reasoning:
      "Sąd I instancji uznał naganę za „najwłaściwszą z katalogu”: czyn incydentalny w długiej praktyce, wcześniejsza niekaralność i kara już wymierzona w sądzie karnym. NSL dodał, że wyrok karny nie czyni kary dyscyplinarnej niecelową.",
    file: "NSL/NSL - 0003.pdf",
  },
  {
    id: "karetka-saturacja",
    title: "Karetka: saturacja 78% i pacjentka w domu",
    summary: "Lekarz kierujący zespołem ratownictwa zostawił w domu duszną pacjentkę z saturacją 78%; następnego dnia trafiła do szpitala z sepsą i zapaleniem płuc.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Rodzina wezwała pogotowie do starszej pacjentki z dusznością, bladością i potliwością, która spadła z wersalki. Miesiąc wcześniej wypisała się na własne żądanie ze szpitala, gdzie leczono ją z powodu niewydolności krążenia i zapalenia płuc.",
      "Lekarz zapisał saturację 78% i ciśnienie 170/80, rozpoznał niewydolność serca i otyłość, podał nitroglicerynę i lek moczopędny i zostawił chorą w domu. Nie zebrał pełnego wywiadu i nie zapisał zaleceń — twierdził, że przekazał je ustnie. Następnego dnia saturacja spadła do 66%; w szpitalu rozpoznano urosepsę i obustronne zapalenie płuc.",
      "Lekarz tłumaczył, że duszność wynikała z wysiłku i otyłości, a parametry były zbliżone do tych z wypisu. Do NSL odwołał się sam.",
    ],
    charge: "Niepełny wywiad i dokumentacja (zarzut 1) oraz pozostawienie chorej w domu bez diagnostyki szpitalnej (zarzut 2) (art. 1 ust. 3 i art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana za pozostawienie chorej w domu; zarzut dotyczący wywiadu umorzono jako przewinienie mniejszej wagi. Orzeczone w I instancji, NSL utrzymał i zawęził opis pierwszego zarzutu." },
    reasoning:
      "NSL: saturacja 78% przy duszności wymagała diagnostyki szpitalnej, nawet jeśli wcześniej była niska. Nagana jest „adekwatna” — biegły nie uznał, że pacjentka była narażona na bezpośrednie niebezpieczeństwo utraty życia, a lekarz nie był wcześniej karany.",
    file: "NSL/NSL - 0014-25.pdf",
  },
  {
    id: "poz-korytarz",
    title: "Przychodnia: rozmowa na korytarzu zamiast badania",
    summary: "Lekarz POZ nie zbadał pacjenta z dusznością i dreszczami; pacjent sam wezwał karetkę spod przychodni.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjent przyszedł do przychodni z dusznością, dreszczami i złym samopoczuciem i chciał zostać zbadany. Lekarz rozmawiał z nim na korytarzu, nie zaprosił go do gabinetu i nie założył dokumentacji; podejrzewając COVID-19, zaproponował test w szpitalu w innej miejscowości.",
      "Personel nie wezwał karetki, więc pacjent zadzwonił na 112 sam. Ratownicy pod przychodnią zmierzyli ciśnienie 180/120, cukier 272 mg% i temperaturę 39,4°C. Lekarz zachowywał się wobec nich niewłaściwie — dyspozytor wezwał policję.",
      "Lekarz twierdził, że chciał zmierzyć saturację, a pacjent odmówił, i że działał według rozporządzenia o postępowaniu przy podejrzeniu COVID-19. Do NSL odwołała się obrona.",
    ],
    charge: "Nieudzielenie pomocy lekarskiej — brak badania podmiotowego i przedmiotowego (art. 2 i 8 KEL, art. 2 ust. 1 ustawy o zawodach lekarza).",
    verdict: { level: 1, text: "Upomnienie — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "NSL: rozporządzenie wymaga najpierw wywiadu i badania, a dopiero potem zlecenia testu. Z wypowiedzi lekarza wynikało, że w podobnej sytuacji zachowałby się tak samo — stąd potrzeba kary ze względów prewencyjnych.",
    file: "NSL/NSL.05.03-2024W.docx",
  },
  {
    id: "ciaza-pozamaciczna",
    title: "Ordynator: nierozpoznana ciąża pozamaciczna",
    summary: "Ordynator ginekologii nie rozpoznał ciąży pozamacicznej mimo trzech okazji, w tym wizyty w swoim prywatnym gabinecie; ciąża pękła.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pacjentka z plamieniem i rosnącym poziomem hormonu ciążowego dwukrotnie trafiła na oddział, którym kierował obwiniony. USG wykonywali rezydenci; wypisano ją najpierw z rozpoznaniem poronienia zagrażającego, potem poronienia chybionego, po lekach wywołujących poronienie.",
      "Kilka dni później przyszła do prywatnego gabinetu ordynatora. Po badaniu i USG nie stwierdził nic niepokojącego i wyznaczył wizytę za trzy miesiące. Następnego dnia trafiła na SOR we wstrząsie: pęknięta ciąża jajowodowa, 1,5–2 litry krwi w jamie brzusznej, usunięto jajowód.",
      "Lekarz twierdził, że podejrzewał ciążę pozamaciczną, a pacjentka wypisała się na własne żądanie — w dokumentacji nie ma o tym śladu. Do NSL odwołał się sam.",
    ],
    charge: "Brak należytej staranności w diagnostyce, w tym brak nadzoru nad badaniami rezydentów (art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana — orzeczona w I instancji i utrzymana przez NSL." },
    reasoning:
      "Sąd uznał, że ordynator nie nadzorował rezydentów, nie zlecił dalszej diagnostyki i zignorował wyniki hormonu, a wizyta w gabinecie była co najmniej trzecią okazją do rozpoznania. NSL: nagana „w pełni adekwatna i niezbędna”; na korzyść lekarza — niekaralność.",
    file: "NSL/NSL.08.02-2024W.docx",
  },
  {
    id: "ciaza-fikcyjna",
    title: "Fikcyjne ciąże i zwolnienia lekarskie",
    summary: "Ginekolożka wpisała dwóm pracownicom nieistniejące ciąże i wystawiła im zwolnienia, by koszty ich pensji przejęła instytucja wypłacająca zasiłki.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "W czasie pandemii firma prowadzona przez lekarkę zawiesiła działalność. Dwóm pracownicom zaproponowano pozostanie na zwolnieniu z powodu ciąży. Lekarka założyła im dokumentację ciąży i wystawiła cztery zwolnienia lekarskie, choć żadne badanie ciąży nie potwierdziło.",
      "Instytucja wstrzymała wypłaty po wykryciu nieprawidłowości, więc pieniądze nie zostały wypłacone. Sąd karny prawomocnie skazał lekarkę na rok pozbawienia wolności w zawieszeniu, grzywnę i rok zakazu wykonywania zawodu ginekologa; kary wykonała.",
      "Przed sądem lekarskim nazwała sąd karny „kapturowym”; później przyznała, że postąpiła źle. Do NSL odwołała się sama, prosząc o umorzenie.",
    ],
    charge: "Poświadczenie nieprawdy w dokumentacji i usiłowanie wyłudzenia świadczeń — podważenie zaufania do zawodu (art. 1 ust. 3 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 0, text: "Umorzenie — dalsza kara jest „oczywiście niecelowa” wobec kary karnej (art. 82 ust. 2). Sąd I instancji orzekł maksymalną karę pieniężną; NSL ją uchylił." },
    reasoning:
      "NSL zaznaczył, że to nie uniewinnienie: czyn przypisano, ale lekarka poniosła już dolegliwą karę karną, szczerze żałuje, a interes pokrzywdzonej instytucji jest zabezpieczony. Sąd I instancji pisał o „rażącej naganności” i wykorzystaniu pozycji zawodowej dla zysku.",
    file: "NSL/NSL - 0021-25.pdf",
  },
  {
    id: "skladki-po-wszczeciu",
    inGame: false,
    title: "Składki zapłacone po wszczęciu sprawy",
    summary: "Lekarz przez ponad trzy lata nie płacił składek na izbę lekarską mimo wezwań; zaległość spłacił dopiero po wszczęciu postępowania.",
    label: "",
    court: "Okręgowy sąd lekarski",
    facts: [
      "Lekarz przez ponad trzy lata nie płacił obowiązkowych składek członkowskich (60 zł miesięcznie, od 2023 r. 120 zł). Był wzywany do zapłaty, ale zalegał dalej; nie zwolniono go uchwałą z płacenia składki.",
      "Całą zaległość zapłacił dopiero po wszczęciu postępowania w sprawie odpowiedzialności zawodowej.",
    ],
    charge: "Uchylanie się od wspierania samorządu zawodowego (art. 59 KEL, art. 8 ustawy o izbach lekarskich).",
    verdict: { level: 1, text: "Upomnienie." },
    reasoning:
      "Sąd: to nie jednorazowe roztargnienie, lecz „długotrwałe i uporczywe uchylanie się”. Na korzyść — spłata całej zaległości; upomnienie ma być „bodźcem mobilizującym”.",
    file: "OSL/0015-25.pdf",
  },
  {
    id: "nastolatek-leki",
    title: "Nastolatek leczony bez wskazań",
    summary: "Dwaj lekarze, prywatnie, rozpoznali u nastolatka m.in. przewlekłe zapalenie prostaty i zaburzenia lipidowe i leczyli go wieloma lekami poza wskazaniami; okazał się zdrowy.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Chłopiec miał bóle brzucha. Rodzice, nie chcąc czekać na termin w poradni, poszli prywatnie do lekarza z doświadczeniem urologicznym. Ten rozpoznał przewlekłe zapalenie prostaty i zaburzenia lipidowe i zlecił dwa leki antybakteryjne — w dawkach i przez czas niezgodne z charakterystyką leku, bez pisemnej zgody rodziców na stosowanie poza wskazaniami.",
      "Drugi lekarz rozpoznał m.in. hiperlipidemię, insulinooporność, niedokrwistość i zaburzenia lękowe i przepisał łącznie 10 rodzajów leków, w tym dwa antydepresyjne przeciwwskazane u osób poniżej 18 lat. Pielęgniarki odmówiły podania zastrzyków jako niebezpiecznych.",
      "Po kilku dniach chłopiec miał silne bóle mięśni, sztywnienie nóg i duszność. W szpitalu odstawiono leki; badania wykazały, że jest zdrowy, a bóle brzucha wynikały z zaparć. Lekarze kwestionowali kompetencje biegłych. Do NSL odwołali się obaj i ich obrońcy.",
    ],
    charge: "Nieuprawnione rozpoznania i nieuzasadnione leczenie wieloma lekami niezgodnie z charakterystyką produktu (art. 8 KEL, art. 4 ustawy o zawodach lekarza).",
    verdict: { level: 5, text: "Ograniczenie zakresu czynności: zakaz leczenia osób poniżej 18 lat — na rok dla jednego lekarza i na 2 lata dla drugiego — oraz kary pieniężne. Sąd I instancji orzekł zawieszenie prawa wykonywania zawodu na 4 i 5 lat za każdy z czynów; NSL złagodził kary." },
    reasoning:
      "NSL: wielokrotne kary za jedno postępowanie lecznicze są „oczywiście niewspółmierne”, a zawieszenie prawa do zawodu zbyt dotkliwe przy pierwszym przewinieniu w długiej karierze. Lekarz leczący dziecko nie może polegać na doświadczeniu z leczenia dorosłych.",
    file: "NSL/NSL - 0003-25.pdf",
  },
  {
    id: "opioidy-recepty",
    title: "SOR: 443 recepty na opioidy",
    summary: "NFZ zakwestionował 443 recepty na silne opioidy dla dwóch pacjentów wystawione na blankietach lekarza SOR, bez dokumentacji wizyt.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Kontrola NFZ w szpitalu zakwestionowała 443 refundowane recepty na silne opioidy dla dwóch pacjentów, wystawione na blankietach lekarza SOR i nocnej opieki. Z 308 wizyt nie było żadnej dokumentacji. Przykładowe zalecenie oznaczało 1200 mg morfiny na dobę — przeciętne dawki ambulatoryjne nie przekraczają 100 mg.",
      "Jedna pacjentka była znajomą lekarza; drugi pacjent zeznał, że nigdy u niego nie był i go nie zna. Grafolog potwierdził jego pismo na ponad 100 receptach. Według prokuratury leki trafiały przez znajomych lekarza do sprzedaży w internecie; część recept sfałszowały osoby trzecie.",
      "Lekarz twierdził, że skradziono mu pieczątkę i blankiety — nie zgłosił tego izbie, pracodawcy, NFZ ani policji. Do NSL odwołali się on i jego obrońca.",
    ],
    charge: "Przepisywanie opioidów bez wskazań medycznych (zarzut 1) i brak dokumentacji (zarzut 2) (art. 6, 8 i 28 KEL, art. 4 i 41 ustawy o zawodach lekarza).",
    verdict: { level: 2, text: "Nagana za każdy z dwóch zarzutów — orzeczona w I instancji i utrzymana przez NSL." },
    reasoning:
      "NSL uznał nagany za „nieodzowne” wobec „bezrefleksyjnej postawy zawodowej”. Ocenił jednak, że lekarz mógł mieć w procederze „podrzędne znaczenie”, podczas gdy sąd I instancji pisał o jego „kluczowej roli” — kara pozostała ta sama.",
    file: "NSL/NSL.02.15-2026W.docx",
  },
  {
    id: "ciezarna-telefon",
    title: "Ciężarna odesłana po telefonie",
    summary: "Lekarka I dyżurna kliniki przez telefon odmówiła przyjęcia ciężarnej z bólem brzucha; rano płód był martwy, a macica pęknięta.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "W nocy na izbę przyjęć kliniki ginekologii przyszła kobieta w 33. tygodniu ciąży z bólami podbrzusza, z cukrzycą i po wcześniejszym usunięciu mięśniaka macicy. Rezydentka zbadała ją, zrobiła USG i oceniła KTG, po czym zadzwoniła do obwinionej — I dyżurnej, specjalistki.",
      "Lekarka przez telefon zdecydowała o odesłaniu pacjentki do domu, wiedząc, że przyczyny bólu nie ustalono; pacjentki nie zbadała. Rano kobieta wróciła z silnym bólem: płód był martwy, a podczas cięcia cesarskiego stwierdzono pęknięcie macicy w miejscu blizny.",
      "Biegły: rozpoznanie przekraczało umiejętności rezydentki — jeśli specjalista nie mógł przyjść, pacjentkę należało przyjąć. Nie wykazał jednak, że macica pękła w nocy. Lekarka tłumaczyła, że bóle ustąpiły. Do NSL odwołała się obrona.",
    ],
    charge: "Odmowa przyjęcia pacjentki wbrew wskazaniom, bez osobistego badania (art. 8 KEL).",
    verdict: { level: 1, text: "Upomnienie. Sąd I instancji orzekł naganę, NSL złagodził karę; winę utrzymał." },
    reasoning:
      "NSL: sąd I instancji „w zasadzie nie uzasadnił wymiaru kary”. Na korzyść lekarki — dotychczasowa praktyka i aktywny udział w postępowaniu; zarzut dotyczył decyzji, nie przypisywał jej śmierci płodu. Upomnienie wystarczy też jako przestroga dla innych.",
    file: "NSL/NSL.08.05-2024W.docx",
  },
  {
    id: "skladki-wznowienie",
    inGame: false,
    title: "Składki: wznowienie po zawieszeniu",
    summary: "Lekarkę ukarano za nieopłacone składki zawieszeniem prawa do zawodu; po wznowieniu postępowania sąd ją uniewinnił.",
    label: "",
    court: "Okręgowy sąd lekarski · wznowienie postępowania",
    facts: [
      "Lekarka została prawomocnie ukarana za nieopłacanie składek na izbę lekarską karą pieniężną i zawieszeniem prawa wykonywania zawodu na rok. Obrońca wniósł o wznowienie postępowania.",
      "Przez lata składki potrącał pracodawca, który co roku zapewniał lekarkę, że je odprowadza. Wezwania szły na nieaktualny adres, a odbiór pism w zakładzie pracy kwitowały pracownice rejestracji. Gdy lekarka dowiedziała się o zaległości, od razu ją spłaciła — w czasie, gdy przez karę nie mogła pracować.",
    ],
    charge: "Uchylanie się od wspierania samorządu zawodowego (art. 59 i 76 KEL).",
    verdict: { level: 0, text: "Uniewinnienie po wznowieniu postępowania — wcześniejsze kary (pieniężną i zawieszenie na rok) uchylono." },
    reasoning:
      "Sąd uznał za nowy, nieznany wcześniej fakt utrwalone „błędne przekonanie” lekarki, że składki odprowadza pracodawca. W tych okolicznościach czyn „nie podlega karze”.",
    file: "OSL/0011.pdf",
  },
  {
    id: "homeopatia-ziola",
    title: "Homeopatia i zioła sprzedane w gabinecie",
    summary: "Lekarka zaleciła kaszlącemu dziecku leki homeopatyczne, sprzedała matce w gabinecie „zestaw ziół nr 1” i miała na pieczątce słowo „homeopata”.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Matka przyszła z 4-letnim synem, który od kilku dni kaszlał. Lekarka zbadała go i zaleciła leki homeopatyczne oraz „zestaw nr 1” z ziół, który sprzedała matce w gabinecie — bez składu, proporcji, terminu ważności i producenta. Według matki lekarka mówiła też, że szczepienia powodują atopię.",
      "Następnego dnia pediatra zlecił RTG, które wykazało zapalenie płuc; antybiotyk wyleczył dziecko. Na pieczątce w dokumentacji lekarka miała określenie „homeopata”.",
      "Lekarka twierdziła, że dziecko było w dobrym stanie, homeopatia jest legalna, a zapłacona kwota to opłata za wizytę, nie za zioła. Na rozprawę nie przyszła. Do NSL odwołała się sama.",
    ],
    charge: "Nierozpoznanie zapalenia płuc, metody niezweryfikowane naukowo, sprzedaż produktów w gabinecie i nienależne określenie na pieczątce (art. 57 i 62 KEL, art. 46 ust. 1 ustawy o zawodach lekarza).",
    verdict: { level: 3, text: "Kara pieniężna — trzykrotność przeciętnego wynagrodzenia — za sprzedaż ziół, nagana za homeopatię i nagana za pieczątkę. Od zarzutu nierozpoznania zapalenia płuc — uniewinnienie. Sąd I instancji za pieczątkę orzekł karę pieniężną; NSL zmienił ją na naganę." },
    reasoning:
      "Sąd uznał, że przy dobrym stanie dziecka lekarka nie miała podstaw podejrzewać zapalenia płuc. Sprzedaż nieopisanej mieszanki ziół „naraziła pacjenta na poważne skutki”, a nagana za homeopatię jest „niezbędna wobec wymogów prewencyjnych”.",
    file: "NSL/NSL - 0033-25.pdf",
  },
  {
    id: "telewizja-metoda",
    title: "Telewizja: „absolutnie nowatorska metoda”",
    summary: "Stomatolożka w programie telewizyjnym przedstawiła się jako autorka „absolutnie nowatorskiej metody”, podała adres strony swojej placówki i radziła uważnie wybierać lekarzy.",
    label: "",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "W programie telewizyjnym lekarka przedstawiła się jako autorka „absolutnie nowatorskiej metody” leczenia implantologicznego. Podano adres strony jej placówki, a ona zachęcała do kontaktu telefonicznego nawet w święto.",
      "Dwukrotnie radziła widzom „bardzo dokładnie i rozważnie wybierać swojego lekarza” i mówiła o pacjentach, którzy trafiają do niej „po różnych nieudanych próbach”. Biegły uznał, że opisane techniki są powszechnie znane z literatury.",
      "Lekarka tłumaczyła się stresem i brakiem doświadczenia w telewizji; przed NSL wyraziła skruchę. Sprawa była już raz w NSL i wróciła do ponownego rozpoznania. Do NSL odwołała się obrona.",
    ],
    charge: "Niedozwolona reklama i nielojalność wobec innych lekarzy (art. 63, 65 i 66 KEL).",
    verdict: { level: 1, text: "Upomnienie. Sąd I instancji orzekł karę pieniężną — trzykrotność przeciętnego wynagrodzenia; NSL uznał ją za „niewspółmiernie surową”." },
    reasoning:
      "NSL: wystąpienie „nie wyrządziło krzywdy pacjentom”, lekarka okazała skruchę i nie była karana. Umorzenia jednak odmówił — niedozwolona reklama to „przykre zjawisko”, a upomnienie jest „bezwzględnie konieczne” jako prewencja.",
    file: "NSL/NSL - 0005.pdf",
  },
  {
    id: "sor-alkohol-powtorny",
    title: "SOR: nietrzeźwy na dyżurze po raz drugi",
    summary: "Lekarz pełnił dyżur na SOR po wypiciu wódki — choć już wcześniej ukarano go za to samo zakazem samodzielnych dyżurów.",
    label: "zarzut 1 z 2",
    court: "Naczelny Sąd Lekarski · odwołanie",
    facts: [
      "Pracownicy szpitala zgłosili, że lekarz pełni dyżur na szpitalnym oddziale ratunkowym pod wpływem alkoholu. Wezwana policja zbadała go trzykrotnie: od 1,19 do 1,32 mg/l alkoholu w wydychanym powietrzu. Lekarz oświadczył, że w trakcie dyżuru wypił ok. 400 ml wódki.",
      "Wcześniej NSL prawomocnie ukarał go za to samo zachowanie na SOR innego szpitala — zakazem samodzielnych dyżurów na 2 lata i karą pieniężną. Drugi zarzut dotyczył złamania tego zakazu; z niego sąd I instancji lekarza uniewinnił, bo na oddziale pracowało kilku lekarzy.",
      "Przed sądem I instancji lekarz wielokrotnie się nie stawiał. Obrona powoływała się na jego dorobek naukowy, poszukiwane kompetencje i żal, i prosiła o łagodniejszą karę. Do NSL odwołał się obrońca.",
    ],
    charge: "Wykonywanie zawodu w stanie nietrzeźwości (art. 1 ust. 3 i art. 64 KEL).",
    verdict: { level: 7, text: "Pozbawienie prawa wykonywania zawodu — orzeczone w I instancji i utrzymane przez NSL." },
    reasoning:
      "NSL: liczyły się miejsce czynu — SOR, gdzie trafiają pacjenci w stanie zagrożenia życia — ilość alkoholu i powtórzenie czynu. Lekarz nie skorzystał z „szansy poprawy”, którą dawało mu wcześniejsze orzeczenie; dorobek naukowy i „bardzo poszukiwane kompetencje” nie przeważyły. „Jedynie kara pozbawienia prawa wykonywania zawodu” jest adekwatna.",
    file: "NSL/NSL.05.06-2024W.docx",
  },
];

export const sadPage = {
  title: 'Czy orzekasz jak sąd lekarski',
  lead:
    'Dziesięć prawdziwych spraw z prawomocnych orzeczeń. Przeczytaj, co ustalił sąd, wybierz karę ze skali, którą daje mu ustawa, i porównaj z wyrokiem.',
  sample:
    'Sprawy pochodzą z {files} orzeczeń sądów lekarskich opublikowanych na portalu NIL. Gra dobiera je tak, by udział spraw bez kary, upomnień, nagan, kar pieniężnych i kar surowszych był zbliżony do rzeczywistego orzecznictwa — ale z luzem, więc każda rozgrywka jest inna.',
};

/** Adresy: gra, katalog orzeczeń i osobna strona sprawy (do udostępniania linku do jednego rozstrzygnięcia). */
export const GAME_HREF = '/sad-lekarski/';
export const CATALOG_HREF = '/sad-lekarski/orzeczenia/';
export const caseHref = (id: string) => `${CATALOG_HREF}${id}/`;

/** Nazwa kary ze skali; przy „bez kary” — uniewinnienie albo umorzenie, jak w orzeczeniu (napis na pieczątce). */
export const verdictLabel = ({ verdict }: Pick<CourtCase, 'verdict'>) =>
  verdict.level > 0 ? SCALE.find((s) => s.level === verdict.level)!.label : /^uniewinn/i.test(verdict.text) ? 'Uniewinnienie' : 'Umorzenie';
