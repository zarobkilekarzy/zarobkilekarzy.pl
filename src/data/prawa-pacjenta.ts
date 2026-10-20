/**
 * Treść strony /prawa-pacjenta/ i karty do druku (/prawa-pacjenta/druk/ + PDF).
 * Jedno źródło: strona, karta i PDF czytają te same obiekty.
 *
 * Zasady redakcyjne tej strony:
 * - najpierw odpowiedź („Tak”, „Nie”, „0 zł”), potem wyjaśnienie, na końcu artykuł ustawy;
 * - zwracamy się bezpośrednio, ale bez form rodzajowych w czasie przeszłym
 *   („gdy dowiesz się”, a nie „gdy dowiedziałeś się”), bo czytają to wszyscy;
 * - kwoty z datą obowiązywania — co roku (Fundusz) i co kwartał (kopie) trzeba je odświeżyć,
 *   zob. FUND i DOC_FEES niżej.
 */
import type { CardContent, CompareRow, Deadline, Entry, Phone, RightsGroup, Route } from '@/lib/pacjent/types';
import type { Source } from '@/types';
import { formatPL } from '@/lib/format';

/** Tekst jednolity ustawy z 6 listopada 2008 r. o prawach pacjenta i Rzeczniku Praw Pacjenta. */
export const ACT = {
  name: 'ustawa o prawach pacjenta i Rzeczniku Praw Pacjenta',
  citation: 'Dz.U. 2024 poz. 581',
  url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000581',
};

export const page = {
  title: 'Prawa pacjenta',
  docTitle: 'Prawa pacjenta: co Ci przysługuje i gdzie to zgłosić',
  /** <title> — docTitle jest za długi dla wyszukiwarki; docTitle zostaje w udostępnianiu */
  seoTitle: 'Prawa pacjenta: co Ci przysługuje',
  description:
    'Prawa pacjenta prostym językiem: informacja, zgoda, ból, dokumentacja, terminy i gdzie zgłosić naruszenie. Przy każdej odpowiedzi artykuł ustawy.',
  lead: 'Co Ci przysługuje u lekarza i w szpitalu, ile masz czasu, gdy coś pójdzie nie tak, i dokąd z tym iść. Prostym językiem, z artykułem ustawy przy każdej odpowiedzi — żeby można go było pokazać.',
  /** data ostatniej weryfikacji treści ze źródłami */
  checked: new Date('2026-10-15'),
  disclaimer:
    'To nie jest porada prawna. Zebraliśmy to, co wynika wprost z ustaw i z oficjalnych stron urzędów, z linkami do źródeł. W swojej sprawie zadzwoń na bezpłatną infolinię — odbierają ją ludzie, którzy robią to zawodowo.',
};

// ---------------------------------------------------------------------------
// Telefony
// ---------------------------------------------------------------------------

export const helpline = {
  phone: { display: '800 190 590', tel: '+48800190590' } satisfies Phone,
  name: 'Telefoniczna Informacja Pacjenta',
  hours: 'Bezpłatnie, całą dobę, 7 dni w tygodniu',
  who: 'Wspólna infolinia Rzecznika Praw Pacjenta i NFZ: prawa pacjenta, skargi, dostęp do leczenia, świadczenie kompensacyjne.',
  abroad:
    'Z zagranicy oficjalne źródła podają dwa numery: RPP — 22 688 05 00, NFZ — 22 125 66 00. Jeśli jeden nie odpowiada, spróbuj drugiego.',
};

export const emergency = {
  phone: { display: '112', tel: '112' } satisfies Phone,
  text: 'Zagrożenie życia? Dzwoń pod 112. Infolinia pacjenta nie wysyła karetki.',
};

// ---------------------------------------------------------------------------
// Wejścia „W jakiej jesteś sytuacji?”
// ---------------------------------------------------------------------------

export const entries: Entry[] = [
  { href: '#teraz', icon: 'pin', title: 'Jestem u lekarza albo w szpitalu', text: 'Informacja, zgoda, ból, bliska osoba przy Tobie, druga opinia.' },
  { href: '#dokumenty', icon: 'doc', title: 'Potrzebuję dokumentacji', text: 'Pierwsza kopia za darmo, jak długo się ją przechowuje, kto może ją zobaczyć.' },
  { href: '#co-sie-stalo', icon: 'alert', title: 'Coś poszło nie tak', text: 'Dokąd to zgłosić, ile masz czasu i ile to kosztuje.' },
  { href: '#fundusz', icon: 'shield', title: 'Szkoda w szpitalu', text: 'Fundusz czy sąd — przeczytaj, zanim cokolwiek podpiszesz.' },
];

// ---------------------------------------------------------------------------
// Stawki za kopie dokumentacji (art. 28 ust. 4) — przeliczane co kwartał
// ---------------------------------------------------------------------------

/**
 * Limit opłaty = ułamek przeciętnego wynagrodzenia z poprzedniego kwartału (komunikat Prezesa GUS).
 * Nowy kwartał: podmień `wage`, `period` i `source` — kwoty przeliczą się same.
 */
export const DOC_FEES = {
  wage: 9233.13,
  period: 'od 1 września do 30 listopada 2026 r.',
  source: {
    publisher: 'GUS',
    date: '10.08.2026',
    title: 'Komunikat Prezesa GUS w sprawie przeciętnego wynagrodzenia w drugim kwartale 2026 r. (M.P. 2026 poz. 779)',
    url: 'https://eli.gov.pl/eli/MP/2026/779/ogl/pol/pdf',
  } satisfies Source,
};
const fee = (share: number) => `${formatPL(Math.round(DOC_FEES.wage * share * 100) / 100, 2)} zł`;

// ---------------------------------------------------------------------------
// Świadczenie kompensacyjne — kwoty i opłaty waloryzowane co roku od 6 września
// ---------------------------------------------------------------------------

export const FUND = {
  since: 'od 6 września 2026 r.',
  patient: { min: '2 393 zł', max: '239 131 zł' },
  relative: { min: '23 914 zł', max: '119 566 zł' },
  fee: '361 zł',
  appealFee: '241 zł',
};

// ---------------------------------------------------------------------------
// Prawa jako pytania
// ---------------------------------------------------------------------------

export const rightsGroups: RightsGroup[] = [
  {
    id: 'teraz',
    eyebrow: 'Teraz, na miejscu',
    title: 'U lekarza i w szpitalu',
    lead: 'Punkt wyjścia: masz prawo do leczenia zgodnego z aktualną wiedzą medyczną, z należytą starannością (art. 6 ust. 1, art. 8). Z praw poniżej możesz skorzystać od razu. Przy każdym jest zdanie, które da się spokojnie powiedzieć, i artykuł ustawy — gdyby ktoś zapytał o podstawę.',
    items: [
      {
        id: 'informacja',
        q: 'Lekarz tłumaczy niezrozumiale. Mogę dopytać?',
        verdict: 'Tak',
        short: 'Masz prawo do informacji, którą zrozumiesz: o rozpoznaniu, możliwych metodach leczenia, ich skutkach i rokowaniu.',
        more: [
          'Ustawa mówi o informacji **przystępnej**, czyli jasnej dla Ciebie, a nie tylko poprawnej w dokumentacji. Obejmuje stan zdrowia, rozpoznanie, proponowane i możliwe metody diagnozy i leczenia, dające się przewidzieć skutki ich zastosowania albo zaniechania, wyniki leczenia i rokowanie.',
          'Osoba, która skończyła 16 lat, dostaje tę informację sama. Działa to też w drugą stronę: możesz poprosić, żeby o pewnych sprawach Cię nie informowano (art. 9 ust. 4).',
        ],
        say: 'Proszę mi to wyjaśnić prościej. Jakie są inne możliwości i co się stanie, jeśli nie podejmę leczenia?',
        basis: 'art. 9',
        card: 'Informacji o zdrowiu, leczeniu i rokowaniu — takiej, którą rozumiesz.',
      },
      {
        id: 'zgoda',
        q: 'Czy muszę zgodzić się na zabieg?',
        verdict: 'Nie',
        short: 'Decyzja należy do Ciebie — po tym, jak dostaniesz pełną informację. Na operację i zabieg o podwyższonym ryzyku zgoda musi być na piśmie.',
        more: [
          'Zgoda bez informacji nie jest prawdziwą zgodą. Dlatego najpierw lekarz wyjaśnia (art. 9), a potem Ty decydujesz: zgadzasz się albo odmawiasz (art. 16).',
          'Na zabieg operacyjny i na metodę leczenia lub diagnostyki o podwyższonym ryzyku zgodę wyraża się na piśmie (art. 18). Osoba, która skończyła 16 lat, wyraża własną zgodę — obok zgody rodzica lub opiekuna (art. 17).',
        ],
        say: 'Zanim podpiszę, proszę powiedzieć, jakie jest ryzyko i jakie są inne możliwości.',
        basis: 'art. 16–18',
        card: 'Zgody albo odmowy po uzyskaniu informacji. Operacja — zgoda na piśmie.',
      },
      {
        id: 'druga-opinia',
        q: 'Czy mogę poprosić o drugą opinię?',
        verdict: 'Tak',
        short: 'Możesz żądać konsultacji innego lekarza albo konsylium. Lekarz może odmówić, ale musi wpisać odmowę do dokumentacji.',
        more: [
          'Lekarz może uznać prośbę za bezzasadną. Wtedy ma obowiązek odnotować odmowę w dokumentacji medycznej. Ten wpis jest ważny: „nie” powiedziane w gabinecie zostaje na piśmie i da się je później sprawdzić.',
          'To samo działa wobec pielęgniarki i położnej: możesz żądać, żeby zasięgnęła opinii innej pielęgniarki lub położnej, a odmowa też trafia do dokumentacji (art. 6 ust. 3 pkt 2 i ust. 6).',
        ],
        say: 'Proszę o konsultację z innym lekarzem. Jeśli to niemożliwe, proszę wpisać odmowę do dokumentacji.',
        basis: 'art. 6 ust. 3–5',
        card: 'Drugiej opinii lub konsylium. Odmowa musi trafić do dokumentacji.',
      },
      {
        id: 'bol',
        q: 'Boli mnie. Czy leczenie bólu to moje prawo?',
        verdict: 'Tak',
        short: 'Tak, zapisane wprost. Placówka ma ocenić, jak mocno boli, leczyć ból i sprawdzać, czy leczenie działa.',
        more: [
          'To trzy osobne obowiązki: określić natężenie bólu, leczyć go i monitorować skuteczność. Podanie leku bez zmierzenia bólu i bez sprawdzenia, czy pomógł, nie wystarcza.',
        ],
        say: 'Ból się nie zmniejsza. Proszę ocenić ból i zmienić leczenie.',
        basis: 'art. 20a',
        card: 'Leczenia bólu: ocena, leczenie i sprawdzanie, czy działa.',
      },
      {
        id: 'osoba-bliska',
        q: 'Czy ktoś bliski może być przy mnie?',
        verdict: 'Tak',
        short: 'Na Twoje życzenie — także przy badaniu. Odmowa jest możliwa tylko z dwóch powodów i musi trafić do dokumentacji.',
        more: [
          'Personel może odmówić tylko wtedy, gdy istnieje ryzyko zagrożenia epidemicznego albo wymaga tego bezpieczeństwo zdrowotne pacjenta. „Taką mamy zasadę” nie jest żadnym z tych powodów.',
          'To prawo dotyczy obecności przy badaniu czy zabiegu. Opieka bliskiej osoby podczas pobytu w szpitalu to osobne prawo — [opisujemy je niżej](#opieka-bliskiej).',
        ],
        say: 'Chcę, żeby ta osoba była przy mnie. Jeśli to niemożliwe, proszę wpisać powód odmowy do dokumentacji.',
        basis: 'art. 21',
        card: 'Obecności bliskiej osoby. Odmowa tylko z powodu epidemii lub bezpieczeństwa.',
      },
      {
        id: 'godnosc',
        q: 'Przy badaniu są studenci albo inne osoby. Muszę się zgodzić?',
        verdict: 'Nie',
        short: 'Masz prawo do poszanowania intymności i godności. Obecność osób, które nie udzielają Ci świadczenia — na przykład studentów — wymaga Twojej zgody.',
        more: [
          'Każdy, kto wykonuje zawód medyczny, ma obowiązek postępować tak, by szanować Twoją intymność i godność (art. 20 ust. 1, art. 22 ust. 1). Inny personel medyczny uczestniczy w badaniu tylko wtedy, gdy jest to niezbędne ze względu na rodzaj świadczenia albo czynności kontrolne. Na obecność wszystkich innych osób potrzebna jest Twoja zgoda (art. 22 ust. 2). Za dziecko zgodę wyraża przedstawiciel ustawowy.',
          'Osoby obecne za Twoją zgodą też obowiązuje tajemnica (art. 22 ust. 3). Prawo do godności obejmuje również prawo do umierania w spokoju i godności (art. 20 ust. 2).',
          'Za zawinione naruszenie tego prawa sąd może przyznać zadośćuczynienie (art. 4) — [więcej przy zgłaszaniu naruszeń](#naruszone-prawa).',
        ],
        say: 'Nie zgadzam się na obecność innych osób przy badaniu.',
        basis: 'art. 20, 22',
        card: 'Godności i intymności. Studenci przy badaniu — tylko za Twoją zgodą.',
      },
      {
        id: 'opieka-bliskiej',
        q: 'Czy w szpitalu może się mną opiekować ktoś bliski?',
        verdict: 'Tak',
        short: 'Masz prawo do dodatkowej opieki pielęgnacyjnej: bliska osoba może się Tobą opiekować w szpitalu. Chodzi o opiekę, nie o leczenie — leczenie zapewnia personel.',
        more: [
          'Ustawa definiuje dodatkową opiekę pielęgnacyjną jako opiekę, która nie polega na udzielaniu świadczeń zdrowotnych. Wymienia wprost opiekę nad dzieckiem, nad osobą ze znacznym stopniem niepełnosprawności i nad kobietą w ciąży, w czasie porodu i połogu (art. 34 ust. 1–2).',
          'Szpital może pobrać za to opłatę, ale tylko w wysokości **rzeczywistych kosztów**. Wysokość opłaty i sposób jej wyliczenia muszą być jawne i dostępne w szpitalu (art. 35 ust. 1–3). Pobyt rodzica przy dziecku jest bezpłatny — [zobacz niżej](#rodzic-przy-dziecku).',
          'Kierownik placówki może ograniczyć to prawo przy zagrożeniu epidemicznym albo ze względu na bezpieczeństwo zdrowotne pacjentów (art. 5).',
        ],
        say: 'Chcę, żeby ta osoba się mną opiekowała. Jeśli jest opłata, proszę pokazać, ile wynosi i jak ją wyliczono.',
        basis: 'art. 34–35',
      },
      {
        id: 'rodzic-przy-dziecku',
        q: 'Szpital chce opłaty za mój pobyt przy dziecku. Wolno mu?',
        verdict: 'Nie',
        short: 'Za pobyt rodzica lub opiekuna przy dziecku albo przy osobie ze znacznym stopniem niepełnosprawności szpital nie może pobierać opłaty.',
        more: [
          'Co do zasady za dodatkową opiekę pielęgnacyjną płaci pacjent (art. 35 ust. 1). Ustawa wprost wyłącza jednak z opłaty pobyt przedstawiciela ustawowego albo opiekuna faktycznego przy pacjencie małoletnim lub z orzeczeniem o znacznym stopniu niepełnosprawności (art. 35 ust. 4 w związku z art. 34 ust. 3).',
          'To jeden z najczęściej łamanych przepisów. Jeśli szpital pobiera opłatę, zgłoś to [Rzecznikowi Praw Pacjenta](#naruszone-prawa).',
        ],
        say: 'Art. 35 ust. 4 ustawy o prawach pacjenta wyłącza opłatę za pobyt rodzica przy dziecku. Proszę jej nie naliczać.',
        basis: 'art. 35 ust. 4',
      },
      {
        id: 'nagly-przypadek',
        q: 'Nagły przypadek. Muszę czekać w kolejce?',
        verdict: 'Nie',
        short: 'Przy zagrożeniu zdrowia lub życia masz prawo do natychmiastowej pomocy — niezależnie od kolejek i skierowań.',
        more: [
          'To prawo działa niezależnie od list oczekujących. Osobno ustawa zapewnia kobiecie rodzącej prawo do świadczeń związanych z porodem (art. 7 ust. 2).',
          'Gdy życie jest zagrożone, nie szukaj przepisów — dzwoń pod **112**.',
        ],
        basis: 'art. 7',
        card: 'Natychmiastowej pomocy przy zagrożeniu życia — bez kolejki.',
      },
    ],
    also: {
      title: 'Pozostałe prawa w skrócie',
      items: [
        { text: 'Gdy świadczeń nie starcza dla wszystkich — przejrzysta, obiektywna procedura ustalania kolejności, oparta na kryteriach medycznych.', basis: 'art. 6 ust. 2' },
        { text: 'Informacja o prawach pacjenta na piśmie, wywieszona w placówce w ogólnodostępnym miejscu. Gdy nie możesz się poruszać — dostarczona do sali.', basis: 'art. 11' },
        { text: 'Wczesna informacja, gdy lekarz zamierza odstąpić od Twojego leczenia, i wskazanie, gdzie możesz leczyć się dalej.', basis: 'art. 10' },
        { text: 'Informacja w zrozumiały sposób dla osoby ze szczególnymi potrzebami, także z pomocą środków wspierających komunikowanie się.', basis: 'art. 12 ust. 2' },
        { text: 'W szpitalu — kontakt z innymi osobami osobiście, telefonicznie i listownie, a także prawo do odmowy kontaktu. Odwiedziny placówka może ograniczyć także ze względów organizacyjnych.', basis: 'art. 33, art. 5' },
        { text: 'W szpitalu — opieka duszpasterska. Gdy stan zdrowia się pogarsza lub życie jest zagrożone, szpital musi umożliwić kontakt z duchownym Twojego wyznania.', basis: 'art. 36–37' },
        { text: 'W szpitalu — przechowanie rzeczy wartościowych w depozycie, na koszt szpitala.', basis: 'art. 39' },
      ],
    },
  },
  {
    id: 'dokumenty',
    eyebrow: 'Dokumenty i dane',
    title: 'Twoja dokumentacja',
    lead: 'Dokumentacja medyczna to Twój najważniejszy dowód. Warto wiedzieć, jak ją dostać, jak długo leży w placówce i kto jeszcze może ją zobaczyć.',
    items: [
      {
        id: 'kopia-dokumentacji',
        q: 'Ile kosztuje kopia mojej dokumentacji?',
        verdict: '0 zł',
        short: 'Pierwsza kopia w danym zakresie jest bezpłatna. Za kolejne placówka może pobrać opłatę, ale tylko do ustawowego limitu.',
        more: [
          'Placówka nie pobiera opłaty, gdy udostępnia dokumentację pacjentowi albo jego przedstawicielowi ustawowemu **po raz pierwszy w żądanym zakresie** (art. 28 ust. 2a pkt 1). W rejestracji rzadko ktoś o tym wspomina.',
          'Za kolejne kopie tego samego zakresu opłata jest dozwolona, ale ustawa wyznacza jej górną granicę (art. 28 ust. 4). Limity liczy się od przeciętnego wynagrodzenia z poprzedniego kwartału, więc zmieniają się co kwartał.',
        ],
        table: {
          caption: `Najwyższe dozwolone opłaty ${DOC_FEES.period}`,
          rows: [
            { label: 'Strona kopii lub wydruku', value: fee(0.00007) },
            { label: 'Strona wyciągu lub odpisu', value: fee(0.002) },
            { label: 'Całość na płycie lub pendrivie', value: fee(0.0004) },
          ],
          note: `Wyliczone z przeciętnego wynagrodzenia w II kwartale 2026 r. (${formatPL(DOC_FEES.wage, 2)} zł, komunikat GUS).`,
        },
        say: 'Proszę o kopię mojej dokumentacji medycznej. To pierwsze udostępnienie w tym zakresie, więc bez opłaty.',
        basis: 'art. 28',
      },
      {
        id: 'przechowywanie',
        q: 'Jak długo placówka przechowuje moją dokumentację?',
        verdict: '20 lat',
        short: 'Zwykle 20 lat od końca roku, w którym dokonano ostatniego wpisu. Nie czekaj jednak — Twoje terminy na działanie są dużo krótsze.',
        more: [
          'Wyjątki: **30 lat**, gdy zgon nastąpił wskutek uszkodzenia ciała lub zatrucia; **22 lata** — dokumentacja dzieci do ukończenia 2. roku życia; **10 lat** — zdjęcia rentgenowskie przechowywane poza dokumentacją.',
          'Jeśli rozważasz jakiekolwiek kroki, poproś o kopię od razu. To jedyny dowód, a [Twoje terminy](#terminy) liczy się w dniach, miesiącach i latach — nie w dziesięcioleciach.',
        ],
        basis: 'art. 29',
      },
      {
        id: 'tajemnica',
        q: 'Czy lekarz może powiedzieć rodzinie o mojej chorobie?',
        verdict: 'Nie',
        short: 'Nie bez Twojej zgody. To Ty wskazujesz w dokumentacji, kto może dostać informacje — i możesz to w każdej chwili zmienić.',
        more: [
          'Personel musi zachować w tajemnicy informacje o Tobie, w tym o stanie zdrowia (art. 13). Tajemnica obowiązuje także po śmierci pacjenta (art. 14).',
          'Upoważnienie wypełnia się zwykle raz, przy przyjęciu, a potem łatwo o nim zapomnieć. Warto sprawdzić, kogo tam wpisano.',
        ],
        say: 'Kogo mam wpisanego jako osobę upoważnioną? Chcę to zmienić.',
        basis: 'art. 13–14',
        card: 'Tajemnicy o Twoim zdrowiu — to Ty wskazujesz, kto może wiedzieć.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Coś poszło nie tak
// ---------------------------------------------------------------------------

/** Zanim cokolwiek zgłosisz — kolejność ma znaczenie. */
export const firstSteps = [
  { title: 'Poproś o kopię dokumentacji', text: 'Pierwsza jest bezpłatna, a to Twój główny dowód. [Jak o nią poprosić](#kopia-dokumentacji).' },
  { title: 'Zapisz, co się stało', text: 'Data, godzina, miejsce, kto był obecny, co padło w rozmowie. Póki pamiętasz szczegóły.' },
  { title: 'Zachowaj papiery', text: 'Paragony, faktury, skierowania, wypisy, wyniki. Przy opłatach to one są dowodem.' },
  { title: 'Sprawdź termin i właściwy adres', text: 'Instytucje nie przekazują sobie spraw — zgłoszenie pod zły adres przepada. [Terminy](#terminy).' },
];

export const routesNote =
  'Drogi się nie wykluczają. Skarga do samorządu lekarskiego może ukarać lekarza, ale nie da Ci pieniędzy. Rzecznik Praw Pacjenta zajmie się naruszeniem praw, ale nie przyzna odszkodowania. Jedna ważna zależność: przyjęcie świadczenia z Funduszu zamyka drogę do sądu.';

export const routes: Route[] = [
  {
    id: 'naruszone-prawa',
    situation: 'Nie uszanowano moich praw',
    examples: 'Odmówiono informacji albo dokumentacji, kazano płacić za pobyt przy dziecku, zabrakło szacunku i intymności.',
    to: 'Rzecznik Praw Pacjenta',
    facts: [
      { label: 'Jak', text: 'Telefonicznie, e-mailem (kancelaria@rpp.gov.pl), przez ePUAP (/RzPP/skrytka) albo listem: ul. Płocka 11/13, 01-231 Warszawa.' },
      { label: 'Koszt', text: 'Bezpłatnie — wniosek do Rzecznika jest wolny od opłat (art. 50 ust. 2).' },
      { label: 'Na miejscu', text: 'Jeśli placówka ma pełnomocnika do spraw praw pacjenta, możesz zacząć od niego — bierze udział w rozpatrywaniu skarg (art. 40a). Podlega jednak kierownikowi placówki, więc nie jest niezależny jak Rzecznik.' },
      { label: 'Pieniądze', text: 'Rzecznik nie przyzna Ci pieniędzy. Za zawinione naruszenie praw pacjenta — na przykład godności, tajemnicy albo prawa do informacji — sąd może zasądzić zadośćuczynienie za doznaną krzywdę (art. 4 w związku z art. 448 Kodeksu cywilnego). To osobna podstawa niż odszkodowanie za szkodę na zdrowiu.' },
    ],
    actions: [
      { label: '800 190 590', href: 'tel:+48800190590', icon: 'phone' },
      { label: 'kancelaria@rpp.gov.pl', href: 'mailto:kancelaria@rpp.gov.pl', icon: 'mail' },
    ],
    card: { situation: 'Naruszono Twoje prawo pacjenta', contact: 'Rzecznik Praw Pacjenta · 800 190 590 · kancelaria@rpp.gov.pl' },
  },
  {
    id: 'oplata-nfz',
    situation: 'Kazano mi zapłacić za leczenie z NFZ',
    examples: 'Albo odmówiono zapisu, nie wykonano zleconych badań, coś nie zgadza się w rozliczeniu.',
    to: 'Oddział wojewódzki NFZ',
    facts: [
      { label: 'Jak', text: 'Formularz na skargi-i-wnioski.nfz.gov.pl, osobiście w oddziale, listem albo przez ePUAP.' },
      { label: 'Termin', text: 'NFZ odpowiada w 30 dni. Jeśli wezwie Cię do uzupełnienia braków, masz **7 dni** — inaczej sprawa zostanie bez rozpoznania.', urgent: true },
      { label: 'Koszt', text: 'Bezpłatnie.' },
      { label: 'Dobrze wiedzieć', text: 'Zachowaj paragon lub fakturę — to dowód. Bywa też odwrotnie: płacisz prywatnie, a placówka rozlicza to samo jeszcze z NFZ. Widać to w Twoim IKP.' },
    ],
    actions: [{ label: 'Formularz skargi NFZ', href: 'https://skargi-i-wnioski.nfz.gov.pl/' }],
    card: { situation: 'Kazano zapłacić za leczenie z NFZ', contact: 'Oddział NFZ · skargi-i-wnioski.nfz.gov.pl' },
  },
  {
    id: 'ikp',
    situation: 'W IKP widzę wizytę, której nie było',
    examples: 'Albo placówkę, w której Cię nie było, albo świadczenie opłacone prywatnie, a rozliczone z NFZ.',
    to: 'Zgłoszenie w Internetowym Koncie Pacjenta',
    facts: [
      { label: 'Jak', text: 'pacjent.gov.pl → Historia leczenia → Historia wizyt → Szczegóły → „Zgłoś nieprawidłowość”. Kilka minut.' },
      { label: 'Co dalej', text: 'Zgłoszenie trafia do oddziału NFZ, który wyjaśnia sprawę. Nie zgłaszaj tego samego dwa razy — to tylko opóźnia wyjaśnienie.' },
      { label: 'Koszt', text: 'Bezpłatnie.' },
      { label: 'Dobrze wiedzieć', text: 'W 2024 r. pacjenci zgłosili blisko 3,5 tys. takich świadczeń, a ponad 1,6 tys. zgłoszeń NFZ uznał za zasadne. Jesteś jedyną osobą spoza układu placówka–NFZ, która może to zauważyć.' },
    ],
    actions: [
      { label: 'Instrukcja krok po kroku', href: '/mechanizmy/fikcyjne-wizyty/#sprawdz-swoje-ikp-instrukcja', icon: 'arrow' },
      { label: 'pacjent.gov.pl', href: 'https://pacjent.gov.pl/' },
    ],
    card: { situation: 'Widzisz wizytę, której nie było', contact: 'IKP · pacjent.gov.pl › Historia leczenia › Zgłoś nieprawidłowość' },
  },
  {
    id: 'orzeczenie',
    situation: 'Nie zgadzam się z orzeczeniem lekarza',
    examples: 'Gdy opinia albo orzeczenie lekarza wpływa na Twoje prawa lub obowiązki wynikające z przepisów.',
    to: 'Komisja Lekarska przy Rzeczniku Praw Pacjenta',
    facts: [
      { label: 'Termin', text: '**30 dni** od wydania opinii lub orzeczenia. Termin jest sztywny.', urgent: true },
      { label: 'Jak', text: 'Sprzeciw składasz za pośrednictwem Rzecznika, nie wprost do Komisji. Musi mieć uzasadnienie i wskazywać przepis, z którego wynikają Twoje prawa lub obowiązki — bez tego wróci do Ciebie.' },
      { label: 'Co dalej', text: 'Komisja orzeka w 30 dni. Od jej rozstrzygnięcia nie ma odwołania, więc to jedno podejście — przygotuj je starannie (art. 31).' },
    ],
    actions: [{ label: '800 190 590', href: 'tel:+48800190590', icon: 'phone' }],
  },
  {
    id: 'szkoda',
    situation: 'Leczenie zaszkodziło. Chcę rekompensaty',
    examples: 'Zakażenie, uszkodzenie ciała, rozstrój zdrowia albo śmierć bliskiej osoby.',
    to: 'Fundusz Kompensacyjny przy RPP albo sąd cywilny',
    facts: [
      { label: 'Szkoda w szpitalu', text: 'Przy zdarzeniu od 6 września 2023 r. możesz wybrać Fundusz: szybciej, bez sądu i bez dowodzenia winy, ale z górnym limitem kwoty.' },
      { label: 'Każda inna sytuacja', text: 'Sąd cywilny — odszkodowanie i zadośćuczynienie bez ustawowego limitu.' },
      { label: 'Termin', text: 'Fundusz: rok od dowiedzenia się o szkodzie, najpóźniej 3 lata od zdarzenia. Sąd: 3 lata od dowiedzenia się o szkodzie i o tym, kto za nią odpowiada.', urgent: true },
    ],
    actions: [{ label: 'Porównaj Fundusz i sąd', href: '#fundusz', icon: 'arrow' }],
  },
  {
    id: 'blad-lekarza',
    situation: 'Lekarz popełnił błąd albo zachował się nieetycznie',
    examples: 'Chcesz, żeby sprawą zajął się samorząd lekarski i ocenił postępowanie lekarza.',
    to: 'Okręgowy rzecznik odpowiedzialności zawodowej (izba lekarska)',
    facts: [
      { label: 'Jak', text: 'Tylko pisemnie, do okręgowej izby lekarskiej, do której należy lekarz: Twoje dane, data i miejsce zdarzenia, opis, dane lekarza, własnoręczny podpis.' },
      { label: 'Termin', text: 'Postępowania nie wszczyna się po **3 latach** od zdarzenia (art. 64 ustawy o izbach lekarskich).', urgent: true },
      { label: 'Dobrze wiedzieć', text: 'To postępowanie dyscyplinarne: może ukarać lekarza, ale nie przyzna Ci pieniędzy. Skargę rozpatruje samorząd lekarski — to ta sama struktura pełni rolę oskarżyciela i sądu. [Opisujemy ten mechanizm](ref:odpowiedzialnosc-zawodowa-lekarzy).' },
    ],
  },
  {
    id: 'przestepstwo',
    situation: 'Ktoś chce łapówki albo podejrzewam przestępstwo',
    examples: 'Na przykład wpis o badaniu, którego nie było, albo żądanie „podziękowania” za szybsze przyjęcie.',
    to: 'Policja, prokuratura albo CBA',
    facts: [
      { label: 'Jak', text: 'Zawiadomienie w dowolnej jednostce policji albo w prokuraturze rejonowej — na piśmie albo ustnie do protokołu.' },
      { label: 'Korupcja', text: 'CBA: 800 808 808 (całą dobę), sygnal@cba.gov.pl.' },
      { label: 'Dobrze wiedzieć', text: 'Kto wręczył łapówkę, nie podlega karze, jeśli korzyść przyjęto, a on sam zawiadomił organy, zanim się o tym dowiedziały, i ujawnił wszystkie istotne okoliczności. Warunki muszą być spełnione łącznie (art. 229 § 6 k.k.).' },
    ],
    actions: [{ label: 'CBA: 800 808 808', href: 'tel:+48800808808', icon: 'phone' }],
  },
  {
    id: 'inne',
    situation: 'Lek zaszkodził, brud w placówce, zastrzeżenia do placówki',
    examples: 'Trzy sprawy, do których nie prowadzi ani Rzecznik, ani NFZ.',
    to: 'URPL, sanepid albo wojewoda',
    facts: [
      { label: 'Lek zaszkodził', text: 'Zgłoś działanie niepożądane — to Twoje prawo. Formularzem Urzędu Rejestracji Produktów Leczniczych, przez lekarza, pielęgniarkę lub farmaceutę, albo do producenta (adres w ulotce).' },
      { label: 'Brud, zakażenia', text: 'Sanepid: e.sanepid.gov.pl albo aplikacja mObywatel, całą dobę.' },
      { label: 'Sama placówka', text: 'Nadzór sprawuje wojewoda — wydział zdrowia urzędu wojewódzkiego. Publiczny rejestr placówek: rpwdl2.ezdrowie.gov.pl.' },
    ],
    actions: [
      { label: 'Formularz URPL', href: 'https://www.gov.pl/web/urpl/zglos-dzialanie-niepozadane2' },
      { label: 'e.sanepid.gov.pl', href: 'https://e.sanepid.gov.pl/interventions' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Terminy — od najkrótszego
// ---------------------------------------------------------------------------

export const deadlines: Deadline[] = [
  { value: '7', unit: 'dni', what: 'na uzupełnienie braków w skardze do NFZ', from: 'od wezwania', basis: 'inaczej sprawa zostanie bez rozpoznania', urgent: true },
  { value: '14', unit: 'dni', what: 'na odwołanie od decyzji w sprawie świadczenia kompensacyjnego', from: 'od doręczenia decyzji', basis: `Komisja Odwoławcza, opłata ${FUND.appealFee}`, urgent: true },
  {
    value: '30', unit: 'dni', what: 'na sprzeciw wobec opinii lub orzeczenia lekarza', from: 'od dnia wydania', basis: 'art. 31', urgent: true,
    card: 'na sprzeciw wobec orzeczenia lekarza — przez RPP, z podaniem przepisu. Odwołania nie ma.',
  },
  { value: '30', unit: 'dni', what: 'na decyzję, czy przyjmujesz przyznane świadczenie z Funduszu', from: 'od przyznania', basis: 'przyjęcie zamyka drogę do sądu', urgent: true },
  {
    value: '1', unit: 'rok', what: 'na wniosek o świadczenie kompensacyjne za szkodę w szpitalu', from: 'od dowiedzenia się o szkodzie, najpóźniej 3 lata od zdarzenia', basis: 'Fundusz Kompensacyjny',
    card: `na wniosek o świadczenie za szkodę w szpitalu (najpóźniej 3 lata od zdarzenia). Opłata ${FUND.fee}.`,
  },
  { value: '3', unit: 'lata', what: 'na pozew o odszkodowanie i zadośćuczynienie', from: 'od dowiedzenia się o szkodzie i o tym, kto za nią odpowiada', basis: 'art. 442¹ § 1 k.c.' },
  { value: '3', unit: 'lata', what: 'na skargę do rzecznika odpowiedzialności zawodowej', from: 'od zdarzenia', basis: 'art. 64 ustawy o izbach lekarskich' },
  {
    value: '20', unit: 'lat', what: 'tyle placówka przechowuje dokumentację', from: 'od końca roku ostatniego wpisu', basis: 'art. 29', info: true,
    card: 'tyle placówka przechowuje dokumentację (30 lat, gdy zgon z uszkodzenia ciała lub zatrucia).',
  },
];

/** Dopowiedzenie do terminu sądowego — najczęstszy mit. */
export const courtMyth =
  'Usłyszysz czasem, że „po 10 latach od zdarzenia i tak się przedawniło”. Przy szkodzie na osobie — a błąd medyczny nią jest — ten limit nie obowiązuje: 3 lata liczą się od dnia, w którym dowiesz się o szkodzie, nawet po wielu latach (art. 442¹ § 3 k.c.). Gdy szkoda wynikła z przestępstwa — 20 lat od jego popełnienia; u dziecka przedawnienie nie skończy się wcześniej niż 2 lata po osiągnięciu pełnoletności.';

// ---------------------------------------------------------------------------
// Szkoda w szpitalu: Fundusz czy sąd
// ---------------------------------------------------------------------------

export const fund = {
  lead: 'Od 1 lipca 2024 r. szkody ze szpitala rozpatruje Fundusz Kompensacyjny Zdarzeń Medycznych przy Rzeczniku Praw Pacjenta. To droga szybsza i prostsza niż sąd — bez pozwu, bez adwokata, bez dowodzenia winy konkretnej osoby. Ale ma warunki, które trzeba znać przed złożeniem wniosku, a nie po.',
  compare: [
    { label: 'Gdzie doszło do szkody', a: 'Tylko w szpitalu (także psychiatrycznym i uzdrowiskowym), przy leczeniu z pieniędzy publicznych', b: 'Wszędzie: w szpitalu, przychodni, gabinecie, także prywatnie' },
    { label: 'Od kiedy', a: 'Zdarzenia od 6 września 2023 r. albo wcześniejsze, o których dowiesz się po tej dacie', b: 'Bez takiego ograniczenia' },
    { label: 'Wina', a: 'Nie trzeba dowodzić winy konkretnej osoby', b: 'Trzeba wykazać odpowiedzialność; zwykle potrzebni są biegli' },
    { label: 'Termin', a: 'Rok od dowiedzenia się o szkodzie, najpóźniej 3 lata od zdarzenia', b: '3 lata od dowiedzenia się o szkodzie i o tym, kto odpowiada' },
    { label: 'Koszt', a: `Opłata ${FUND.fee}. Nie wraca, jeśli Rzecznik odmówi świadczenia. Przy trudnej sytuacji można prosić o zwolnienie`, b: 'Opłata sądowa' },
    { label: 'Czas', a: 'Decyzja w 3 miesiące od kompletnego, opłaconego wniosku', b: 'Sprawy o błąd medyczny bywają długie' },
    { label: 'Ile', a: `Pacjent: ${FUND.patient.min} – ${FUND.patient.max}. Bliska osoba zmarłego pacjenta: ${FUND.relative.min} – ${FUND.relative.max}, dla każdej osobno. Bez podatku`, b: 'Bez ustawowego limitu' },
  ] satisfies CompareRow[],
  catch: {
    title: 'Przyjęcie świadczenia zamyka drogę do sądu',
    text: 'Gdy Rzecznik przyzna świadczenie, masz 30 dni, żeby je przyjąć albo odrzucić. Przyjęcie oznacza zrzeczenie się roszczeń z tego zdarzenia — za szkody, które ujawniły się do dnia złożenia wniosku. To droga **zamiast** sądu, a nie obok niego. Przy poważnej szkodzie porozmawiaj z prawnikiem, zanim podpiszesz.',
  },
  conditions: [
    { title: 'Szpital', text: 'Do zdarzenia doszło w szpitalu, przy leczeniu finansowanym ze środków publicznych. Przychodnia, gabinet i leczenie prywatne — nie.' },
    { title: 'Po 6 września 2023 r.', text: 'Albo wcześniej, ale dowiesz się o nim już po tej dacie.' },
    { title: 'Zdarzenie medyczne, nie powikłanie', text: 'Skutek, którego z dużym prawdopodobieństwem dałoby się uniknąć przy leczeniu zgodnym z aktualną wiedzą. Normalne, przewidywalne następstwo metody, na którą była świadoma zgoda, to powikłanie — Fundusz go nie obejmuje.' },
    { title: 'W terminie', text: 'Rok od uzyskania informacji o zakażeniu, uszkodzeniu ciała, rozstroju zdrowia albo śmierci pacjenta — i nie później niż 3 lata od zdarzenia.' },
  ],
  how: [
    `**Złożenie:** na papierze (ul. Płocka 11/13, 01-231 Warszawa), przez ePUAP (/RzPP/skrytka) albo e-Doręczenia. Zwykły e-mail nie wystarczy — taki wniosek nie zostanie rozpatrzony.`,
    `**Opłata ${FUND.fee}** wraca, gdy świadczenie zostanie przyznane, gdy wniosek zostanie pozostawiony bez rozpoznania albo gdy Rzecznik odmówi wszczęcia postępowania.`,
    `**Odwołanie:** w 14 dni od doręczenia decyzji, do Komisji Odwoławczej za pośrednictwem Rzecznika (opłata ${FUND.appealFee}, zwracana, jeśli odwołanie zostanie uwzględnione). Potem skarga do Wojewódzkiego Sądu Administracyjnego w Warszawie.`,
  ],
  notes: [
    'Wojewódzkie komisje do spraw zdarzeń medycznych nie działają od 1 lipca 2024 r., a niezakończone sprawy przejął Rzecznik. Starsze poradniki wciąż do nich odsyłają.',
    'Nie myl Funduszu Kompensacyjnego Zdarzeń Medycznych z funduszami Szczepień Ochronnych i Badań Klinicznych — to osobne fundusze przy tym samym urzędzie, z osobnymi wnioskami i kontami.',
  ],
  amountsNote: `Kwoty i opłaty obowiązują ${FUND.since}; co roku we wrześniu są waloryzowane.`,
};

// ---------------------------------------------------------------------------
// Karta do druku (PDF) — wyciąg z treści wyżej, nie osobna kopia
// ---------------------------------------------------------------------------

/**
 * Na kartę trafiają tylko tezy, które mieszczą się uczciwie w jednym zdaniu (pole `card`
 * przy prawie, terminie i sytuacji). Pominięte świadomie: przedawnienie w sądzie (bez wyjaśnienia
 * brzmiałoby jak pułapka) i numery z zagranicy (źródła RPP i NFZ podają je rozbieżnie).
 */
export const card = {
  title: 'Prawa pacjenta',
  /** miesiąc ostatniej weryfikacji — widoczny na karcie, bo kwoty i stawki się zmieniają */
  stamp: `Stan na ${page.checked.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
  url: 'zarobkilekarzy.pl/prawa-pacjenta',
  rights: rightsGroups.flatMap((g) => g.items).filter((i) => i.card).map((i) => ({ text: i.card!, basis: i.basis })),
  free: [
    { text: 'Pierwsza kopia dokumentacji medycznej w żądanym zakresie.', basis: 'art. 28 ust. 2a' },
    { text: 'Pobyt rodzica lub opiekuna przy dziecku albo przy osobie ze znacznym stopniem niepełnosprawności.', basis: 'art. 35 ust. 4' },
    { text: 'Wniosek do Rzecznika Praw Pacjenta.', basis: 'art. 50 ust. 2' },
  ],
  deadlines: deadlines.filter((d) => d.card).map((d) => ({ value: `${d.value} ${d.unit}`, text: d.card!, basis: d.basis })),
  warning: 'Przyjęcie świadczenia z Funduszu oznacza rezygnację z roszczeń w sądzie. To droga zamiast sądu, nie obok niego.',
  routes: routes.filter((r) => r.card).map((r) => r.card!),
  legal: `Podstawa: ustawa o prawach pacjenta (${ACT.citation}). To nie jest porada prawna.`,
  /** dwie karty na kartce A4 — jedna dla siebie, druga dla kogoś bliskiego */
  howTo: ['Wydrukuj na zwykłej kartce A4, jednostronnie, w skali 100%.', 'Przetnij kartkę na pół wzdłuż linii przerywanej.', 'Złóż każdą połówkę wzdłuż kropek — napisem na zewnątrz.'],
} satisfies CardContent;

// ---------------------------------------------------------------------------
// Stanowisko redakcji i źródła
// ---------------------------------------------------------------------------

export const editorial = [
  'Bo prawa pacjenta działają tylko wtedy, gdy ktoś o nich wie. Bezpłatna pierwsza kopia dokumentacji przysługuje od lat, a w rejestracji nikt jej nie ogłasza. Zakaz opłat za pobyt rodzica przy dziecku jest w ustawie, a rachunki za „dostawkę” wciąż się zdarzają. Niewiedza też jest formą nieprzejrzystości.',
  'Widać to na Internetowym Koncie Pacjenta. Gdy pacjenci zobaczyli własne rozliczenia, w jednym roku ponad 1600 z nich okazało się nie do obrony. IKP pokazuje koszt Twojej wizyty, ale nie pokazuje, ile publicznych pieniędzy trafiło łącznie do konkretnego lekarza ze wszystkich źródeł. To ta sama luka — [brak jawności jako warunek nadużyć](ref:brak-jawnosci).',
  'Nie jesteśmy urzędem, kancelarią ani organizacją pacjentów, tylko obywatelskim serwisem o jawności pieniędzy publicznych. Opisujemy mechanizmy, nie osoby. Zdecydowana większość lekarzy i placówek pracuje rzetelnie; problemem jest system, w którym o swoich prawach dowiadujemy się zwykle wtedy, gdy już zostały naruszone.',
];

export const legalBasis = [
  `Ustawa z 6 listopada 2008 r. o prawach pacjenta i Rzeczniku Praw Pacjenta, tekst jednolity [${ACT.citation}](${ACT.url}). Artykuły bez nazwy ustawy dotyczą właśnie jej.`,
  'Przedawnienie roszczeń: art. 442¹ Kodeksu cywilnego. Że przy szkodzie na osobie nie działa dziesięcioletni limit od zdarzenia, przesądził Sąd Najwyższy (uchwała z 24 lutego 2009 r., III CZP 2/09), po wyroku Trybunału Konstytucyjnego w sprawie SK 14/05.',
  'Odpowiedzialność zawodowa lekarzy: art. 64 ustawy o izbach lekarskich (Dz.U. 2021 poz. 1342). Niekaralność przy zawiadomieniu o łapówce: art. 229 § 6 Kodeksu karnego.',
];

export const sources: Source[] = [
  { publisher: 'Sejm RP (ISAP)', title: 'Ustawa o prawach pacjenta i Rzeczniku Praw Pacjenta, tekst jednolity Dz.U. 2024 poz. 581', url: ACT.url },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Prawa pacjenta', url: 'https://www.gov.pl/web/rpp/prawa-pacjenta' },
  { publisher: 'Ministerstwo Zdrowia', title: 'Prawa pacjenta', url: 'https://www.gov.pl/web/zdrowie/prawa-pacjenta' },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Telefoniczna Informacja Pacjenta', url: 'https://www.gov.pl/web/rpp/telefoniczna-informacja-pacjenta' },
  { publisher: 'NFZ', title: 'Telefoniczna Informacja Pacjenta', url: 'https://www.nfz.gov.pl/kontakt/telefoniczna-informacja-pacjenta/' },
  DOC_FEES.source,
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Kiedy i komu przysługuje świadczenie kompensacyjne', url: 'https://www.gov.pl/web/rpp/kiedy-i-komu-przysluguje-swiadczenie' },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Jak złożyć wniosek o świadczenie kompensacyjne (opłata, kanały)', url: 'https://www.gov.pl/web/rpp/jak-zlozyc-wniosek3' },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Wysokość świadczenia kompensacyjnego (kwoty od 6 września 2026 r.)', url: 'https://www.gov.pl/web/rpp/wysokosc-swiadczenia-kompensacyjnego' },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Komisja Odwoławcza — termin i opłata od odwołania', url: 'https://www.gov.pl/web/rpp/komisja-odwolawcza2' },
  { publisher: 'Rzecznik Praw Pacjenta', title: 'Rzecznik przejmuje sprawy wojewódzkich komisji ds. orzekania o zdarzeniach medycznych', url: 'https://www.gov.pl/web/rpp/rzecznik-praw-pacjenta-przejmuje-sprawy-wojewodzkich-komisji-ds-orzekania-o-zdarzeniach-medycznych' },
  { publisher: 'Sejm RP (ISAP)', title: 'Ustawa o izbach lekarskich, tekst jednolity Dz.U. 2021 poz. 1342', url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342' },
  { publisher: 'Rynek Zdrowia', date: '10.08.2024', title: 'Zgłoszenia nieprawdziwych świadczeń widocznych w IKP — skala i przykłady', url: 'https://www.rynekzdrowia.pl/Prawo/Falszywe-informacje-o-wizytach-w-IKP-Pacjenci-w-calej-Polsce-zglaszaja-fikcyjne-swiadczenia,261578,2.html' },
];
