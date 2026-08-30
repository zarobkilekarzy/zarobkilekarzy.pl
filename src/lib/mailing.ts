// Szablony wiadomości do polityków — narzędzie /dzialaj/napisz.
//
// GŁOS: pisze OBYWATEL, nie inicjatywa. Pierwsza osoba, we własnym imieniu, bez
// „w imieniu ZarobkiLekarzy.pl". Strona jest miejscem, w którym nadawca sprawdził
// liczby, a nie nadawcą listu. To ma być głos społeczeństwa skupionego wokół
// watchdoga, nie mailing watchdoga.
//
// STRATEGIA: nie prosimy o poparcie postulatu — pokazujemy marchewkę. Każdy szablon
// daje adresatowi JEDEN instrument, który realnie ma w ręku, i JEDNO pytanie, na
// które dziś nikt nie zna odpowiedzi. Do tego trzy tropy do samodzielnego zgłębienia
// tematu, z linkami. Zamykamy prośbą o ODPOWIEDŹ, nie o poparcie — odpowiedzieć jest
// łatwiej, a każda odpowiedź (także odmowna) jest materiałem.
//
// PODZIAŁ: pięć szablonów wg instrumentu, którym adresat dysponuje — nie wg rangi
// i NIGDY wg partii (różnicowanie po partii ustawiłoby nas jako gracza politycznego;
// jeden przeciek i cała akcja traci wiarygodność).
//
// LICZBY: wyłącznie te opublikowane na stronie, z linkiem do miejsca, gdzie stoi
// źródło. Zweryfikowane 2026-08-29 na produkcji.
//
// Tokeny podstawiane przy renderze:
//   {blok}     — blok adresowy pisma; nazwisko w MIANOWNIKU, więc zero odmiany
//   {zwrot}    — „Szanowna Pani Poseł" / „Szanowni Państwo"
//   {funkcja}  — realna funkcja adresata (bez skrótów i nawiasowych dat)
//   {instrument} — „interpelacji" (Sejm) / „oświadczeniu senatorskim" (Senat).
//                SENATOROWIE NIE SKŁADAJĄ INTERPELACJI — pomylenie tego kompromituje
//                nadawcę u ponad połowy adresatów tej grupy.
//   {izba_narz} — „Sejmem" / „Senatem" (narzędnik)
//   {pan_dopelniacz} — „Pani" / „Pana" (dopełniacz: „mam do Pana prośbę")
//   {pan}      — „Pani" / „Pan"; czasowniki dobieramy w 3. osobie („czy rozważy {pan}"),
//                bo ta forma nie odmienia się przez rodzaj — zero „zechciał(a)"

//   {izba}     — „Sejmu" / „Senatu"
//   {imie} {nazwisko} {miasto} — podpis nadawcy

export type RolaSlug = 'resort' | 'kontrola' | 'komisja' | 'parlament' | 'klub';

export interface Szablon {
  id: RolaSlug;
  nazwa: string;
  /** Dla kogo — podpowiedź przy przełączniku szablonu. */
  komu: string;
  temat: string;
  tresc: string;
}

/** Wspólna stopka merytoryczna — te same trzy tropy, w tej samej kolejności. */
const OTWARCIE =
  'Wynagrodzenie lekarza na etacie jest jawne. Ten sam publiczny pieniądz wypłacony ' +
  'na kontrakcie — już nie. Nikt w państwie nie potrafi dziś podać, ile łącznie ze ' +
  'środków publicznych trafia do jednej osoby, bo nikt tego nie sumuje. To nie jest ' +
  'zarzut wobec lekarzy. To luka w sprawozdawczości państwa.';

export const SZABLONY: Record<RolaSlug, Szablon> = {
  // ——— 1. Resorty i urzędy wykonawcze: mogą zmienić zakres sprawozdawczości ———
  resort: {
    id: 'resort',
    nazwa: 'Resort lub urząd',
    komu: 'ministerstwa, NFZ, AOTMiT, kancelarie',
    temat: 'Trzy pytania o wynagrodzenia lekarzy ze środków publicznych — od najłatwiejszego',
    tresc: `{blok}

{zwrot},

w szpitalach, które ujawniły listy płac, mediana rocznej wypłaty dla lekarza wynosi około 200 tys. zł, co siódma pozycja przekracza 500 tys., a półtora procent — milion. To kwoty od jednej placówki. Ile ta sama osoba wzięła łącznie ze wszystkich publicznych umów, nie wie nikt.

Drugą stroną tej samej luki jest czas pracy. Przy umowie kontraktowej nie ma obowiązku ewidencjonowania godzin. Nie wiadomo więc, ile godzin z rzędu ma za sobą osoba, która staje do zabiegu. To już nie jest kwestia księgowa.

Piszę jako pacjent, bo nie widzę, żeby ten system zmierzał w dobrą stronę. Budżet NFZ wzrósł ze 144 mld zł w 2023 r. do 220 mld w 2025, a średni czas oczekiwania na gwarantowane świadczenie wydłużył się z 3,5 do 4,2 miesiąca. Dołożyliśmy 76 miliardów rocznie i czekamy dłużej. Ministra zdrowia podała w lipcu, że koszty wynagrodzeń pochłaniają średnio 81,3 proc. budżetów szpitali z umową z NFZ, a w skrajnych przypadkach 106 proc.

Powiem wprost: te wynagrodzenia są za wysokie. Nie w sensie moralnym, tylko arytmetycznym — są wyższe, niż ten system jest w stanie udźwignąć. Każdy kolejny miliard wsiąka w cenę tej samej godziny pracy i nie kupuje ani jednej dodatkowej wizyty. To wiadro bez dna.

Nie mam o to pretensji do lekarzy — przy takich regułach ich zachowanie jest racjonalne. Pretensję mam do zasad, które sprawiają, że opłaca się gromadzić umowy, a nie leczyć więcej pacjentów.

Mam w związku z tym trzy prośby, od najłatwiejszej. Pierwsza wymaga wyłącznie odpowiedzi: do ilu podmiotów leczniczych wystąpiono dotąd o dane o wynagrodzeniach na podstawie przepisów z 19 czerwca. Druga: opublikowanie w postaci zagregowanej wyników analiz, które już powstały. Trzecia jest postulatem i wymaga zmiany prawa — przepisu nakazującego coroczną publikację rozkładu łącznych wypłat ze środków publicznych, liczonych po numerze prawa wykonywania zawodu, bez nazwisk i bez numeru PESEL.

Piszę o zmianie prawa świadomie, bo dzisiejsze przepisy tego nie dają: pozwalają zapytać pojedynczą placówkę, na wniosek, a wskazane w nich cele są wewnętrzne — analiza i kontrola. Nie ma w nich ani obowiązku publikacji, ani mechanizmu sumującego wypłaty jednej osoby u różnych płatników. Dopóki go nie ma, debata toczy się po omacku: limity ustala się, nie znając rozkładu, który mają ograniczyć, a liczby krążące w dyskusji opisują pojedyncze umowy, nie ludzi. Jawność byłaby tu również osłoną dla lekarzy — zestawienia obejmującego wszystkich nie da się w nikogo wycelować.

Czego oczekuję jako pacjent: realnej kontroli tego, komu i za co płacimy, oraz decyzji, które uratują system uginający się pod ciężarem kosztów pracy. Proszę o odpowiedź przynajmniej na pierwsze z tych pytań, a jeśli publikacja nie jest rozważana — o wskazanie, co konkretnie stoi na przeszkodzie.

Źródła: https://zarobkilekarzy.pl/dane/zarobki-ujawnione-listy/ i https://zarobkilekarzy.pl/analizy/sladem-zlotowki/

Z poważaniem,
{imie} {nazwisko}
{miasto}`,
  },

  // ——— 2. Organy kontroli i ochrony praw: kontrola, wystąpienie generalne ———
  kontrola: {
    id: 'kontrola',
    nazwa: 'Kontrola i ściganie',
    komu: 'RPP, NIK, Ministerstwo Sprawiedliwości',
    temat: 'Co trzeci podmiot leczniczy milczy na wniosek o informację publiczną',
    tresc: `{blok}

{zwrot},

w monitoringu „Ile zarabiają lekarze?", prowadzonym przez Sieć Obywatelską Watchdog Polska, wysłano wnioski o informację publiczną do 1358 podmiotów leczniczych. 472 z nich — co trzeci — nie odpowiedziały w ogóle. Nie odmówiły z podaniem podstawy prawnej, nie przekazały sprawy dalej. Milczały.

Ustawa o dostępie do informacji publicznej nie przewiduje milczenia jako sposobu załatwienia wniosku. Przewiduje za nie odpowiedzialność karną: „Kto, wbrew ciążącemu na nim obowiązkowi, nie udostępnia informacji publicznej, podlega grzywnie, karze ograniczenia wolności albo pozbawienia wolności do roku" (art. 23). Nie znam ani jednego przypadku, w którym przepis ten zastosowano wobec podmiotu leczniczego.

Rzecz nie dotyczy drobiazgu. W szpitalach, które listy jednak ujawniły, mediana rocznej wypłaty dla lekarza wynosi około 200 tys. zł, co siódma pozycja przekracza 500 tys., a półtora procent — milion. To kwoty od jednej placówki; ile ta sama osoba wzięła łącznie ze wszystkich publicznych umów, nie wie nikt. W mniejszych szpitalach dziesięciu najlepiej opłacanych lekarzy potrafi zabierać od 40 do 60 proc. funduszu wynagrodzeń.

Piszę jako pacjent, bo nie widzę, żeby ten system zmierzał w dobrą stronę. Budżet NFZ wzrósł ze 144 mld zł w 2023 r. do 220 mld w 2025, a średni czas oczekiwania na gwarantowane świadczenie wydłużył się z 3,5 do 4,2 miesiąca. Ministra zdrowia podała w lipcu, że koszty wynagrodzeń pochłaniają średnio 81,3 proc. budżetów szpitali z umową z NFZ, a w skrajnych przypadkach 106 proc. Dołożyliśmy 76 miliardów rocznie i czekamy dłużej.

Powiem wprost: te wynagrodzenia są za wysokie — nie w sensie moralnym, tylko arytmetycznym. Nie mam o to pretensji do lekarzy, bo przy takich regułach ich zachowanie jest racjonalne. Mam pretensję do zasad, w których opłaca się gromadzić umowy, a nie leczyć więcej pacjentów, i do tego, że sprawdzić tego nie sposób, skoro co trzeci podmiot po prostu nie odpowiada.

Dlatego zwracam się z prośbą o zbadanie sprawy — w ramach kontroli, wystąpienia albo postępowania, zależnie od posiadanych kompetencji. Jeżeli co trzeci podmiot wydający publiczne pieniądze ignoruje ustawowy obowiązek i nie spotyka go za to nic, to nie jest kwestia pojedynczych zaniedbań, tylko stanu, w którym przepis pozostaje martwy.

Czego oczekuję jako pacjent: realnej kontroli tego, komu i za co płacimy.

Materiał źródłowy — wnioski, korespondencja i odpowiedzi każdej z placówek:
https://fedrowanie.siecobywatelska.pl/monitoringi/ile-zarabiaja-lekarze
Ta sama lista z filtrami, kto ujawnił, kto odmówił, a kto milczy:
https://zarobkilekarzy.pl/dane/monitoring-watchdog/
Kwoty i metoda liczenia: https://zarobkilekarzy.pl/dane/zarobki-ujawnione-listy/

Z poważaniem,
{imie} {nazwisko}
{miasto}`,
  },

  // ——— 3. Komisje Zdrowia: dezyderat, posiedzenie tematyczne ———
  komisja: {
    id: 'komisja',
    nazwa: 'Komisja Zdrowia',
    komu: 'członkowie Komisji Zdrowia Sejmu i Senatu',
    temat: 'Temat na posiedzenie Komisji: dane o wynagrodzeniach są, ale nikt ich nie zobaczy',
    tresc: `{blok}

{zwrot},

w szpitalach, które ujawniły listy płac, mediana rocznej wypłaty dla lekarza wynosi około 200 tys. zł, co siódma pozycja przekracza 500 tys., a półtora procent — milion. To kwoty od jednej placówki. Ile ta sama osoba wzięła łącznie ze wszystkich publicznych umów, nie wie nikt.

Drugą stroną tej samej luki jest czas pracy. Przy umowie kontraktowej nie ma obowiązku ewidencjonowania godzin. Nie wiadomo więc, ile godzin z rzędu ma za sobą osoba, która staje do zabiegu. To już nie jest kwestia księgowa.

Piszę jako pacjent, bo nie widzę, żeby ten system zmierzał w dobrą stronę. Budżet NFZ wzrósł ze 144 mld zł w 2023 r. do 220 mld w 2025, a średni czas oczekiwania na gwarantowane świadczenie wydłużył się z 3,5 do 4,2 miesiąca. Dołożyliśmy 76 miliardów rocznie i czekamy dłużej. Ministra zdrowia podała w lipcu, że koszty wynagrodzeń pochłaniają średnio 81,3 proc. budżetów szpitali z umową z NFZ, a w skrajnych przypadkach 106 proc.

Powiem wprost: te wynagrodzenia są za wysokie. Nie w sensie moralnym, tylko arytmetycznym — są wyższe, niż ten system jest w stanie udźwignąć. Każdy kolejny miliard wsiąka w cenę tej samej godziny pracy i nie kupuje ani jednej dodatkowej wizyty. To wiadro bez dna.

Nie mam o to pretensji do lekarzy — przy takich regułach ich zachowanie jest racjonalne. Pretensję mam do zasad: to państwo zbudowało system, w którym najlepiej wynagradzaną kompetencją lekarza nie jest leczenie, tylko zarządzanie własnym portfelem kontraktów.

Uprzedzę odpowiedź, której się spodziewam — że resort te dane ma. Ustawa z 19 czerwca daje ministrowi prawo o nie zapytać: pojedynczy podmiot, na wniosek, w terminie i zakresie, które sam wskazuje. Podmiotów leczniczych są tysiące, a ustawa nie mówi, kiedy ani wobec kogo wniosek ma być kierowany. Co ważniejsze, w całym jej tekście — trzy artykuły — nie pada ani razu słowo „jawność" i nie ma żadnego przepisu o publikacji. Dane mogą trafić do ministra i tam zostać. Obywatel nie zobaczy ich nigdy.

Dlatego proszę o jeden punkt porządku obrad albo dezyderat z trzema pytaniami: do ilu podmiotów minister dotąd wystąpił, jaka jest najwyższa łączna kwota wypłacona jednemu lekarzowi ze środków publicznych i co stoi na przeszkodzie, by wynik był jawny. Jawność chroni zresztą także lekarzy: rejestru działającego zawsze i wobec wszystkich nie da się w nikogo wycelować.

Oczekuję jako pacjent realnej kontroli tego, komu i za co płacimy. Zaczyna się ona od jednej liczby, której państwo dziś nie ma.

Źródła: https://zarobkilekarzy.pl/dane/zarobki-ujawnione-listy/ i https://zarobkilekarzy.pl/analizy/sladem-zlotowki/

Z poważaniem,
{imie} {nazwisko}
{miasto}`,
  },

  // ——— 4. Posłowie i senatorowie: interpelacja, zapytanie, oświadczenie ———
  parlament: {
    id: 'parlament',
    nazwa: 'Poseł lub senator',
    komu: 'pozostali parlamentarzyści i prezydia izb',
    temat: 'Szpitale wydają na pensje ponad 100 proc. budżetu — czego oczekuje pacjent',
    tresc: `{blok}

{zwrot},

w szpitalach, które ujawniły listy płac, mediana rocznej wypłaty dla lekarza wynosi około 200 tys. zł, co siódma pozycja przekracza 500 tys., a półtora procent — milion. To kwoty od jednej placówki. Ile ta sama osoba wzięła łącznie ze wszystkich publicznych umów, nie wie nikt. W mniejszych szpitalach dziesięciu najlepiej opłacanych lekarzy potrafi zabierać od 40 do 60 proc. funduszu wynagrodzeń — pieniędzy, których brakuje potem na resztę oddziału.

Drugą stroną tej samej luki jest czas pracy. Przy umowie kontraktowej nie ma obowiązku ewidencjonowania godzin. Nie wiadomo więc, ile godzin z rzędu ma za sobą osoba, która staje do zabiegu. To już nie jest kwestia księgowa.

Piszę jako pacjent, bo nie widzę, żeby ten system zmierzał w dobrą stronę. Budżet NFZ wzrósł ze 144 mld zł w 2023 r. do 220 mld w 2025, a średni czas oczekiwania na gwarantowane świadczenie wydłużył się z 3,5 do 4,2 miesiąca. Dołożyliśmy 76 miliardów rocznie i czekamy dłużej.

Wiadomo, dokąd te pieniądze poszły. Ministra zdrowia podała w lipcu, że koszty wynagrodzeń pochłaniają średnio 81,3 proc. budżetów szpitali z umową z NFZ, a w skrajnych przypadkach 106 proc. — więcej niż cały budżet placówki. To i tak obraz zaniżony, bo wypłaty dla lekarzy na kontraktach księguje się jako usługi obce, poza pozycją „wynagrodzenia".

Powiem wprost: te wynagrodzenia są za wysokie. Nie w sensie moralnym, tylko arytmetycznym — są wyższe, niż ten system jest w stanie udźwignąć. Widać to już na wejściu do zawodu: ustawowe minimum rezydenta to 11 655 zł brutto przy średniej krajowej 8 904 zł. Każdy kolejny miliard wsiąka w cenę tej samej godziny pracy i nie kupuje ani jednej dodatkowej wizyty. To wiadro bez dna.

Nie mam o to pretensji do lekarzy — przy takich regułach ich zachowanie jest racjonalne. Pretensję mam do zasad: to państwo zbudowało system, w którym najlepiej wynagradzaną kompetencją lekarza nie jest leczenie, tylko zarządzanie własnym portfelem kontraktów.

Ta liczba nie pojawi się sama. Ustawa z 19 czerwca dała ministrowi prawo zapytać placówkę o wynagrodzenia — ale tylko na wniosek i do każdej z osobna, a w całym jej tekście nie ma ani jednego przepisu o publikacji. Dane mogą trafić do ministra i tam zostać. Pytanie zadane publicznie w {instrument} jest dziś jedyną drogą, żeby wyszły na zewnątrz.

Czego oczekuję jako pacjent: realnej kontroli tego, komu i za co płacimy; powiązania wynagrodzenia z leczeniem, a nie z liczbą podpisanych umów; decyzji, które uratują system uginający się pod ciężarem kosztów pracy. Wszystko zaczyna się od jednej liczby, której państwo dziś nie pokazuje.

Źródła: https://zarobkilekarzy.pl/dane/zarobki-ujawnione-listy/ i https://zarobkilekarzy.pl/analizy/sladem-zlotowki/

Z poważaniem,
{imie} {nazwisko}
{miasto}`,
  },

  // ——— 5. Kluby, liderzy, biura partii: stanowisko programowe ———
  klub: {
    id: 'klub',
    nazwa: 'Klub lub partia',
    komu: 'kluby parlamentarne, liderzy, biura krajowe partii',
    temat: 'Postulat, który nie kosztuje ani złotówki i nie dzieli wyborców',
    tresc: `{blok}

{zwrot},

w szpitalach, które ujawniły listy płac, mediana rocznej wypłaty dla lekarza wynosi około 200 tys. zł, co siódma pozycja przekracza 500 tys., a półtora procent — milion. To kwoty od jednej placówki. Ile ta sama osoba wzięła łącznie ze wszystkich publicznych umów, nie wie nikt.

Drugą stroną tej samej luki jest czas pracy. Przy umowie kontraktowej nie ma obowiązku ewidencjonowania godzin. Nie wiadomo więc, ile godzin z rzędu ma za sobą osoba, która staje do zabiegu. To już nie jest kwestia księgowa.

Piszę jako pacjent, bo nie widzę, żeby ten system zmierzał w dobrą stronę. Budżet NFZ wzrósł ze 144 mld zł w 2023 r. do 220 mld w 2025, a średni czas oczekiwania na gwarantowane świadczenie wydłużył się z 3,5 do 4,2 miesiąca. Dołożyliśmy 76 miliardów rocznie i czekamy dłużej. Ministra zdrowia podała w lipcu, że koszty wynagrodzeń pochłaniają średnio 81,3 proc. budżetów szpitali z umową z NFZ, a w skrajnych przypadkach 106 proc.

Powiem wprost: te wynagrodzenia są za wysokie. Nie w sensie moralnym, tylko arytmetycznym — są wyższe, niż ten system jest w stanie udźwignąć. Każdy kolejny miliard wsiąka w cenę tej samej godziny pracy i nie kupuje ani jednej dodatkowej wizyty. To wiadro bez dna.

Nie mam o to pretensji do lekarzy — przy takich regułach ich zachowanie jest racjonalne. Pretensję mam do zasad: to państwo zbudowało system, w którym najlepiej wynagradzaną kompetencją lekarza nie jest leczenie, tylko zarządzanie własnym portfelem kontraktów.

Piszę akurat tutaj, bo to jest decyzja programowa, nie techniczna. Postulat brzmi: jawna, publikowana raz w roku suma tego, co jeden lekarz otrzymał ze środków publicznych, powiązana z numerem prawa wykonywania zawodu — bez numeru PESEL i bez danych prywatnych. Nie wymaga budowania niczego od zera: identyfikator istnieje, a od czerwca minister może zbierać dane o wynagrodzeniach powiązane z tym numerem. Brakuje przepisu, który każe je zsumować i pokazać. Nie dzieli wyborców, bo po drugiej stronie nie stoi żaden elektorat, tylko jedna organizacja zawodowa. I trudno go odrzucić, nie mówiąc wprost, że wydatek publiczny ma pozostać niejawny.

Dodam, że jawność chroni także lekarzy. Rejestru działającego zawsze i wobec wszystkich nie da się w nikogo wycelować — inaczej niż wniosku, przy którym ktoś decyduje, o kogo zapytać.

Czego oczekuję jako pacjent: realnej kontroli tego, komu i za co płacimy, oraz decyzji, które uratują system uginający się pod ciężarem kosztów pracy. Chcę wiedzieć, czy mogę na to liczyć akurat tutaj — i chętnie poznam argumenty przeciw, jeśli takie są.

Źródła: https://zarobkilekarzy.pl/dane/zarobki-ujawnione-listy/ i https://zarobkilekarzy.pl/analizy/sladem-zlotowki/

Z poważaniem,
{imie} {nazwisko}
{miasto}`,
  },
};

export const SZABLONY_LISTA = Object.values(SZABLONY);
