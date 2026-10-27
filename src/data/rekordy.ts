/**
 * Zestawienie /dane/rekordy/: pojedyncze ujawnione kwoty rozliczeń lekarzy ze środków publicznych.
 * Tekst i przypisy są w content/articles/rekordy.mdx — tu wiersze tabel (components/rekordy/RecordTable),
 * tabela Mazowsza (Comparison) i LINKS dla bloków w artykule.
 *
 * Zasady wiersza:
 * - bez nazwisk; przy sprawach w toku bez funkcji lekarza, a gdy kwota dotyczy jednej osoby w sprawie karnej —
 *   także bez nazwy szpitala (typ placówki i region);
 * - próg ze źródła zostaje progiem („ponad”, „prawie”), nigdy nie zamienia się w dokładną kwotę;
 * - każdy wiersz ma źródła i pole `status` z datą najnowszej informacji (stan na 16.10.2026).
 *
 * Sprawdzone 15.10.2026 (tabela 88 twierdzeń + druga weryfikacja).
 * Aktualizacja 16.10.2026: nowe wiersze Dolny Śląsk, Lubuskie, Podkarpacie, Warmia i Mazury, Ostróda, Warsaw Medical
 * Center, Zamość, Sosnowiec, Wadowice; tabela województw (REGIONS_TABLE); statusy spraw bez zmian.
 * Celowo pominięte (brak drugiego źródła): Kraków (Dietl, 2,3 mln zł — tylko materiał Radia Kraków i przedruki),
 * Żary, Jastrzębie-Zdrój, Płock, Bydgoszcz, Sandomierz i Kutno (półrocze 2025, zestawienie posła — mogą to być spółki,
 * jak sprostowana Sokółka). Zachodniopomorskie 216 643,81 zł to rekordzista z Koszalina (wiersz roczny) — nie dublujemy.
 * Celowo pominięte (jedno miejsce w serwisie): radni-lekarze (Słupsk, Piotrków) → /analizy/lekarze-radni/;
 * sprawa warszawska (postępowanie w toku) → tylko /mechanizmy/wieloetatowosc/, bez kwot; prezes szpitala z Grójca → /analizy/zarobki-dyrektorow-szpitali/.
 *
 * Wiersze i liczby (MONTHLY, DAILY, YEARLY, MAZOWSZE, REGIONS) czyta też wersja angielska — src/data/en/rekordy.ts.
 */
import type { CompareTable } from '@/types';
import { formatPL } from '@/lib/format';

export const LINKS = {
  rzMazowsze: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Kacprzyk-nie-byl-rekordzista-W-szpitalach-mazowieckich-mozna-zarobic-nawet-316-tys-zl-miesiecznie,285578,1.html',
  aotmit: 'https://www.rp.pl/ochrona-zdrowia/art44466691-625-lekarzy-w-polsce-zarabia-powyzej-100-tys-zl-dotarlismy-do-wyliczen',
  tvnAnkieta: 'https://tvn24.pl/polska/ile-zarabiaja-lekarze-wyslalismy-pytania-do-ponad-500-szpitali-st9136735',
  moneyPila: 'https://www.money.pl/gospodarka/307-tys-zl-dla-jednego-lekarza-dyrektor-szpitala-wyjasnia-7307017357007296a.html',
  astaPila: 'https://www.asta24.pl/2026/07/13/zarobki-lekarzy-w-pile-szpital-wyjasnia',
  dwLublin: 'https://www.dziennikwschodni.pl/artykul/386459,ile-zarabiaja-lekarze-w-lublinie-stawki-moga-zaskoczyc',
  dziennikBelchatow: 'https://wiadomosci.dziennik.pl/wydarzenia/artykuly/11264456,po-roku-zostaja-milionerami-ujawnili-stawki-lekarzy-na-kontraktach.html',
  ddWloclawek: 'https://ddwloclawek.pl/pl/11_wiadomosci/95804_milionowe-zarobki-lekarzy-takze-w-szpitalu-we-wloclawku-rekordzista-dostal.html',
  rpNeuro: 'https://www.rp.pl/ochrona-zdrowia/art44774891-300-tys-zl-za-dzien-pracy-tyle-mieli-zarabiac-neurochirurdzy-w-szpitalach',
  bankierNeuro: 'https://www.bankier.pl/wiadomosc/Bez-zarzutow-po-1-5-roku-Prokuratura-bada-dzialalnosc-neurochirurgow-w-Mogilnie-9165261.html',
  wpKoszalin: 'https://wiadomosci.wp.pl/ogromne-zarobki-lekarzy-w-koszalinie-placowka-odpowiada-na-pytania-7307285538121728a',
  rzKalisz: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/Szpital-w-Kaliszu-ma-placic-czterem-lekarzom-10-mln-zl-rocznie-Pielegniarka-chora-sytuacja-trwa,277827,1.html',
  eskaKaliszZawiadomienie: 'https://kalisz.eska.pl/kalisz-szpital-w-prokuraturze-jest-zawiadomienie-od-marszalka-aa-7Vss-wSxr-KUh9.html',
  eskaKalisz: 'https://ostrow.eska.pl/kalisz-nieprawidlowosci-w-kaliskim-szpitalu-sledztwo-przedluzone-do-14-grudnia-aa-d83o-arbE-tKYV.html',
  infoKonin: 'https://infokonin.com.pl/artykul/lekarze-milionerzy-w-n2401341',
  poranny: 'https://poranny.pl/milionowe-wyplaty-i-pytania-o-wysokosc-dodatkow-audyt-w-bialostockim-centrum-onkologii-i-dluga-lista-watpliwosci/ar/c14p2-29190385',
  wyborczaBialystok: 'https://bialystok.wyborcza.pl/bialystok/7,35241,32903969,prawie-3-mln-zl-dla-jednego-lekarza-bco-nie-chce-ujawnic-szczegolow.html',
  interiaBraniewo: 'https://wydarzenia.interia.pl/kraj/news-lekarz-pracowal-72-godziny-na-dobe-to-bylo-wprost-dojenie-sz,nId,23511769',
  deBraniewo: 'https://dziennikelblaski.pl/artykul/zarobki-lekarza-siegnely-n2405057',
  prokElblag: 'https://www.gov.pl/web/po-elblag/komunikat-rp-o-prowadzeniu-przez-prokurature-rejonowa-w-elblagu-sledztwa-w-sprawie-nieprawidlowosci-w-dzialaniu-powiatowego-centrum-medycznego-sp-zoo-zs-w-braniewie-skutkujacych-wyrzadzeniem-mu-znacznej-szkody-majatkowej-w-kwocie-300000-zl',
  tvnBraniewo: 'https://tvn24.pl/olsztyn/braniewo-sledztwo-w-sprawie-chirurga-zawieszone-mial-wykazywac-72-godziny-pracy-na-dobe-st9237358',
  moneyDolnoslaskie: 'https://www.money.pl/biznes/275-tys-zl-netto-na-miesiac-oto-najwyzsze-zarobki-lekarzy-na-dolnym-slasku-7321135719266432a.html',
  moneyLubuskie: 'https://www.money.pl/praca/miesieczna-pensja-wystarczy-na-auto-z-salonu-mamy-nowe-dane-o-zarobkach-lekarzy-7313338003085376a.html',
  moneyPodkarpacie: 'https://www.money.pl/praca/ponad-1-66-mln-zl-w-rok-poznalismy-zarobki-lekarzy-w-kolejnym-regionie-7312997743819168a.html',
  moneyWarmia: 'https://www.money.pl/praca/zarobki-lekarzy-na-warmii-i-mazurach-oto-rekordzisci-ze-szpitali-wojewodzkich-7309824059086944a.html',
  moneyZachodniopomorskie: 'https://www.money.pl/praca/ponad-2-6-mln-zl-w-rok-milionerow-w-szpitalach-na-pomorzu-zachodnim-jest-wiecej-7307681959659520a.html',
  polsatOstroda: 'https://www.polsatnews.pl/wiadomosc/2026-07-28/placa-lekarzowi-1600-zl-za-godzine-szpital-tonie-w-milionowych-dlugach/',
  interiaOstroda: 'https://wydarzenia.interia.pl/warminsko-mazurskie/news-lekarz-zarobil-1600-zl-za-godzine-powiatowy-szpital-z-milion,nId,23520736',
  bankierWmc: 'https://www.bankier.pl/wiadomosc/Prywatny-szpital-ujawnil-zarobki-lekarzy-pracujacych-na-NFZ-Rekordzista-dostal-337-tys-zl-9184717.html',
  rmfWmc: 'https://www.rmf24.pl/regiony/warszawa/news-niemal-8-tys-zl-za-godzine-warszawski-szpital-ujawnil-ile-pl,nIdn,1014388',
  interiaZamosc: 'https://wydarzenia.interia.pl/kraj/news-ponad-2-7-mln-zl-w-rok-dla-lekarza-z-zamoscia-wiemy-jaka-mia,nId,23530244',
  dwZamosc: 'https://www.dziennikwschodni.pl/artykul/393013,placili-mu-wiecej-za-czekanie-niz-za-prace-oto-skladniki-rekordowych-zarobkow-radiologa-z-zamoscia',
  pzSosnowiec: 'https://politykazdrowotna.com/artykul/18-mln-zl-dla-lekarza-n2446601',
  wprostSosnowiec: 'https://www.wprost.pl/kraj/12411411/szpital-w-sosnowcu-ujawnil-zarobki-lekarzy-padl-rekord-to-pokazuje-skale-problemu.html',
  tvnWadowice: 'https://tvn24.pl/krakow/wadowice-zarobki-lekarzy-w-szpitalu-st9135375',
  wadowice24: 'https://wadowice24.pl/polityka/zarabiaja-miliony-a-i-tak-ida-tam-gdzie-placa-jeszcze-wiecej-powiat-wadowicki-walczy-o-lekarzy/',
  dlZgierz: 'https://dzienniklodzki.pl/lekarz-pracowal-55-godzin-na-dobe-takie-cuda-tylko-w-wojewodzkim-szpitalu-specjalistycznym-w-zgierzu-inny-w-miesiac-zarobil-405-tys-zl/ar/c1p2-29381417',
  dlZgierzSprostowanie: 'https://dzienniklodzki.pl/lekarz-mial-pracowac-55-godzin-dziennie-szpital-w-zgierzu-wyjasnia-skad-wziely-sie-te-dane/ar/c1p2-29384233',
  onetZgierz: 'https://kobieta.onet.pl/wiadomosci/ponad-400-tys-zl-za-miesiac-pracy-tyle-dostal-lekarz-spod-lodzi/7xps193',
};

/** Etap sprawy — neutralna etykieta; brak = źródła nie opisują żadnego postępowania. */
export type CaseStage = 'brak' | 'kontrola' | 'audyt' | 'sledztwo';

export interface CaseStatus {
  stage: CaseStage;
  /** etykieta na stronie, np. „śledztwo, brak zarzutów” */
  label: string;
  /** data najnowszej informacji o stanie sprawy (jak w źródle) */
  asOf: string;
  /** dopowiedzenie: kogo dotyczy postępowanie, co dalej */
  note?: string;
}

export interface RecordRow {
  id: string;
  /** typ placówki i region — bez nazwiska; przy sprawach w toku bez nazwy szpitala i bez funkcji */
  place: string;
  /** czym jest kwota: kto i za co (rola tylko poza sprawami w toku) */
  what: string;
  /** kwota jak w źródle; próg zostaje progiem */
  amount: string;
  /** okres i rodzaj kwoty: za miesiąc, za rok, jedna faktura… */
  period: string;
  /** zastrzeżenie pod kwotą */
  note?: string;
  status: CaseStatus;
  sources: { label: string; href: string }[];
}

/** Wiersz bez postępowania: data to dzień naszego sprawdzenia, a nie publikacji. */
const NONE: CaseStatus = { stage: 'brak', label: 'źródła nie opisują postępowania', asOf: '16.10.2026' };

/**
 * Rozliczenia za miesiąc, od najwyższej kwoty (Dolny Śląsk podaje netto — stoi według swojej kwoty, bo i tak
 * przewyższa niższe wiersze). Na końcu dwa wiersze poza kolejnością: faktura zbiorcza z Piły
 * (obejmuje cztery miesiące) i Zgierz — 442 tys. zł opisane w zestawieniu jako kontrakt na miesiąc, ale szpital
 * sprostował kolumnę z okresem zatrudnienia (25.09.2026), więc okres kwoty jest niepewny. Nie zamieniać go na
 * rekord miesięczny, dopóki szpital nie poda faktycznego okresu umowy.
 */
export const MONTHLY: RecordRow[] = [
  {
    id: 'mazowsze',
    place: 'Szpitale wojewódzkie Mazowsza',
    what: 'Najwyższy kontrakt w zestawieniu urzędu marszałkowskiego',
    amount: '316 079 zł',
    period: 'za miesiąc, 2025 r.',
    note: 'Umowa została rozwiązana. Źródło podaje dla kontraktu jedną kwotę, bez podziału na brutto i netto.',
    status: NONE,
    sources: [{ label: 'Rynek Zdrowia', href: LINKS.rzMazowsze }],
  },
  {
    id: 'dolnoslaskie',
    place: 'Szpitale samorządu województwa dolnośląskiego',
    what: 'Najwyższy kontrakt w zestawieniu urzędu marszałkowskiego',
    amount: '275 222,45 zł',
    period: 'netto, za miesiąc, 2025 r.',
    note: 'Urząd podał wszystkie kwoty netto, więc nie zestawiamy ich wprost z kwotami brutto z innych województw. Szpitala nie wskazano.',
    status: NONE,
    sources: [{ label: 'money.pl', href: LINKS.moneyDolnoslaskie }],
  },
  {
    id: 'lublin',
    place: 'Uniwersytecki Szpital Kliniczny nr 4 w Lublinie',
    what: 'Najwyższa stawka w zestawieniu miesięcznych stawek kontraktowych szpitala (neurochirurg)',
    amount: '216 185 zł',
    period: 'za miesiąc',
    note: 'Źródło nie podaje, którego miesiąca dotyczy stawka, ani czy to kwota brutto.',
    status: NONE,
    sources: [{ label: 'Dziennik Wschodni', href: LINKS.dwLublin }],
  },
  {
    id: 'lubuskie',
    place: 'Szpitale samorządu województwa lubuskiego',
    what: 'Najwyższy kontrakt w zestawieniu urzędu marszałkowskiego',
    amount: '198 042,50 zł',
    period: 'brutto, za miesiąc, 2025 r.',
    note: 'Kwota z dyżurami i dodatkami cyklicznymi. Szpitala nie wskazano.',
    status: NONE,
    sources: [{ label: 'money.pl', href: LINKS.moneyLubuskie }],
  },
  {
    id: 'belchatow-urolog',
    place: 'Szpital wojewódzki w Bełchatowie',
    what: 'Urolog na kontrakcie: stawka za godzinę i procent od zabiegów',
    amount: '151 097 zł',
    period: 'za miesiąc',
    status: NONE,
    sources: [{ label: 'Dziennik.pl', href: LINKS.dziennikBelchatow }],
  },
  {
    id: 'lodzkie-ortopeda',
    place: 'Szpital w województwie łódzkim',
    what: 'Ortopeda na kontrakcie — w zestawieniu stawek łódzkich szpitali',
    amount: '142 032 zł',
    period: 'za miesiąc',
    note: 'Źródło nie podaje, w którym szpitalu.',
    status: NONE,
    sources: [{ label: 'Dziennik.pl', href: LINKS.dziennikBelchatow }],
  },
  {
    id: 'wloclawek-maj',
    place: 'Szpital wojewódzki we Włocławku',
    what: 'Najwyższe miesięczne rozliczenie lekarza (dane szpitala)',
    amount: '139 957 zł',
    period: 'brutto, maj 2026 r.',
    status: NONE,
    sources: [{ label: 'DDWłocławek', href: LINKS.ddWloclawek }],
  },
  {
    id: 'tarnobrzeg',
    place: 'Szpital wojewódzki w Tarnobrzegu',
    what: 'Najwyższy kontrakt w zestawieniu urzędu marszałkowskiego Podkarpacia',
    amount: '138 967,51 zł',
    period: 'brutto, za miesiąc, 2025 r.',
    note: '„Ponad 1,66 mln zł w rok” z tytułu źródła to ta kwota razy 12, a nie roczna wypłata.',
    status: NONE,
    sources: [{ label: 'money.pl', href: LINKS.moneyPodkarpacie }],
  },
  {
    id: 'warmia',
    place: 'Szpitale samorządu województwa warmińsko-mazurskiego',
    what: 'Najwyższy kontrakt w zestawieniu urzędu marszałkowskiego',
    amount: '136 520,32 zł',
    period: 'brutto, za miesiąc, 2025 r.',
    note: 'Kwota z tabeli urzędu; tekst artykułu podaje „ponad 132,5 tys. zł” i nie wyjaśnia różnicy. Szpitala nie wskazano.',
    status: NONE,
    sources: [{ label: 'money.pl', href: LINKS.moneyWarmia }],
  },
  {
    id: 'ostroda',
    place: 'Szpital powiatowy w Ostródzie (spółka powiatu)',
    what: 'Najwyższe miesięczne wynagrodzenie lekarza w zestawieniu dla radnego powiatu',
    amount: '100 865,22 zł',
    period: 'luty 2026 r., za 117 godzin',
    note: 'Umowa cywilnoprawna. Inną wypłatę (91 462,26 zł za 56 godzin w kwietniu) media przeliczyły na ok. 1600 zł za godzinę; szpital kwestionuje to wyliczenie, bo liczy ono tylko godziny na oddziale i w POZ.',
    status: NONE,
    sources: [
      { label: 'Interia', href: LINKS.interiaOstroda },
      { label: 'Polsat News', href: LINKS.polsatOstroda },
    ],
  },
  {
    id: 'pila',
    place: 'Szpital specjalistyczny w Pile',
    what: 'Najwyższe rozliczenie lekarza na kontrakcie w ankiecie TVN24',
    amount: '307 tys. zł',
    period: 'jedna faktura zbiorcza, maj 2026 r.',
    note: 'To nie zapłata za miesiąc. Według dyrektora szpitala faktura obejmuje świadczenia z czterech miesięcy, bo za procedury lekarz dostaje pieniądze dopiero po wpłacie z NFZ.',
    status: NONE,
    sources: [
      { label: 'money.pl', href: LINKS.moneyPila },
      { label: 'asta24', href: LINKS.astaPila },
    ],
  },
  {
    id: 'zgierz',
    place: 'Szpital wojewódzki w Zgierzu',
    what: 'Najwyższy kontrakt „na miesiąc” w zestawieniu dla radnego miejskiego',
    amount: '442 tys. zł',
    period: 'kontrakt opisany jako miesięczny, 2025 r.',
    note: 'Okresu nie da się potwierdzić. Szpital sprostował kolumnę z okresem zatrudnienia: w części wierszy system kadrowo-płacowy wpisał datę ostatniej zmiany w danych, a nie faktyczny okres umowy.',
    status: { stage: 'brak', label: 'szpital sprostował okresy w zestawieniu, źródła nie opisują postępowania', asOf: '25.09.2026' },
    sources: [
      { label: 'Dziennik Łódzki', href: LINKS.dlZgierz },
      { label: 'Dziennik Łódzki — sprostowanie', href: LINKS.dlZgierzSprostowanie },
      { label: 'Onet', href: LINKS.onetZgierz },
    ],
  },
];

/** Rozliczenia za dzień i godzinę — opisane osobno, bo to stawki albo kwoty przeliczone na godzinę, a nie wypłaty za okres. */
export const DAILY: RecordRow[] = [
  {
    id: 'neurochirurdzy',
    place: 'Dwa szpitale w mniejszych miastach (kujawsko-pomorskie i pomorskie)',
    what: 'Rachunki spółki neurochirurgów za dzień zabiegów',
    amount: 'ponad 300 tys. zł',
    period: 'za dzień; nawet 26 tys. zł za godzinę',
    note: 'Kwoty według ustaleń Wirtualnej Polski: spółka mogła wystawiać takie rachunki. NFZ nałożył na jeden ze szpitali karę ponad 2,6 mln zł; szpital się odwołał.',
    status: {
      stage: 'sledztwo',
      label: 'dwa śledztwa, brak zarzutów',
      asOf: '8.07.2026',
      note: 'Nadzorują je prokuratury okręgowe w Bydgoszczy i w Słupsku; drugie prowadzi CBA. W pierwszym neurochirurgów dotąd nie przesłuchano.',
    },
    sources: [
      { label: 'Rzeczpospolita (PAP)', href: LINKS.rpNeuro },
      { label: 'Bankier.pl (PAP)', href: LINKS.bankierNeuro },
    ],
  },
  {
    id: 'wmc',
    place: 'Prywatny szpital w Warszawie z kontraktem NFZ',
    what: 'Ortopeda — wypłata podzielona przez przepracowane godziny',
    amount: '7848 zł',
    period: 'za godzinę; ok. 337 tys. zł za 43 godziny',
    note: 'Szpital podał kwoty i liczbę godzin bez okresu rozliczenia. To przelicznik, nie umówiona stawka: według ekspertów wypłata wynika raczej z procentu od wartości zabiegów. Pieniądze pochodzą z kontraktu z NFZ.',
    status: NONE,
    sources: [
      { label: 'Bankier.pl', href: LINKS.bankierWmc },
      { label: 'RMF24', href: LINKS.rmfWmc },
    ],
  },
];

/**
 * Rozliczenia roczne jednej osoby, od najwyższej kwoty (próg według swojej wartości),
 * a na końcu suma dla czterech lekarzy z Kalisza — nie jest kwotą jednej osoby, więc nie stoi w kolejności.
 */
export const YEARLY: RecordRow[] = [
  {
    id: 'bialystok',
    place: 'Publiczne centrum onkologii w Białymstoku',
    what: 'Jeden lekarz na kontrakcie z wynagrodzeniem procentowym od procedur',
    amount: 'prawie 3 mln zł',
    period: 'za 2024 r.',
    note: 'Próg z ustaleń audytu, nie dokładna kwota. Kolejnych 16 osób: od miliona do blisko półtora miliona zł.',
    status: {
      stage: 'audyt',
      label: 'audyt właściciela',
      asOf: 'lipiec 2026',
      note: 'Audyt urzędu marszałkowskiego z końca 2025 r.: 48 zaleceń do wdrożenia do 14.08.2026. Informacji o wdrożeniu nie znaleźliśmy.',
    },
    sources: [
      { label: 'Kurier Poranny', href: LINKS.poranny },
      { label: 'Wyborcza Białystok', href: LINKS.wyborczaBialystok },
    ],
  },
  {
    id: 'zamosc',
    place: 'Szpital wojewódzki w Zamościu',
    what: 'Radiolog na umowie cywilnoprawnej — najwyższe wynagrodzenie w szpitalu',
    amount: '2 741 513,36 zł',
    period: 'za 2025 r.',
    note: 'Kwotę potwierdził dyrektor szpitala. W odpowiedzi szpitala na interpelację posła pada 2 693 719,58 zł — różnicy źródła nie wyjaśniają. Ponad 1,77 mln zł to opisy badań, reszta m.in. gotowość do zabiegów i godziny poza ordynacją.',
    status: NONE,
    sources: [
      { label: 'Interia', href: LINKS.interiaZamosc },
      { label: 'Dziennik Wschodni', href: LINKS.dwZamosc },
    ],
  },
  {
    id: 'koszalin',
    place: 'Szpital wojewódzki w Koszalinie',
    what: 'Najlepiej zarabiający lekarz',
    amount: '2 599 725 zł',
    period: 'za 2025 r.',
    note: 'Średnio ponad 216 tys. zł miesięcznie. Dane ujawnił radny, powołując się na Sieć Obywatelską Watchdog Polska.',
    status: NONE,
    sources: [{ label: 'Wirtualna Polska', href: LINKS.wpKoszalin }],
  },
  {
    id: 'konin',
    place: 'Szpital wojewódzki w Koninie',
    what: 'Najwyższe roczne wynagrodzenie lekarza (wszystkie składniki)',
    amount: 'ponad 2 mln zł',
    period: 'brutto, za 2025 r.',
    note: 'Próg, nie dokładna kwota. Redakcja nie podała, skąd pochodzi zestawienie.',
    status: NONE,
    sources: [{ label: 'infoKONIN', href: LINKS.infoKonin }],
  },
  {
    id: 'sosnowiec',
    place: 'Szpital miejski w Sosnowcu',
    what: 'Otorynolaryngolog na kontrakcie — najwyższe wynagrodzenie w szpitalu',
    amount: '1,835 mln zł',
    period: 'za 2025 r.',
    note: 'Dane szpitala w odpowiedzi na interpelację radnej. Źródło nie podaje, czy to kwota brutto.',
    status: NONE,
    sources: [
      { label: 'Polityka Zdrowotna', href: LINKS.pzSosnowiec },
      { label: 'Wprost', href: LINKS.wprostSosnowiec },
    ],
  },
  {
    id: 'braniewo',
    place: 'Szpital powiatowy na Warmii i Mazurach',
    what: 'Faktury jednego lekarza na kontrakcie',
    amount: '1 772 879,50 zł',
    period: 'za rok (2024 r.)',
    note: 'W 2024 r. lekarz wykazał 11 577 godzin pracy — więcej, niż ma cały rok.',
    status: {
      stage: 'sledztwo',
      label: 'śledztwo zawieszone, brak zarzutów',
      asOf: '15.09.2026',
      note: 'Prokuratura Rejonowa w Elblągu bada działania byłego prezesa spółki prowadzącej szpital, nie lekarza. Śledztwo czeka na opinię biegłego.',
    },
    sources: [
      { label: 'Dziennik Elbląski', href: LINKS.deBraniewo },
      { label: 'Prokuratura', href: LINKS.prokElblag },
      { label: 'TVN24', href: LINKS.tvnBraniewo },
    ],
  },
  {
    id: 'wloclawek-rok',
    place: 'Szpital wojewódzki we Włocławku',
    what: 'Najlepiej zarabiający lekarz (dane szpitala)',
    amount: '1 474 919 zł',
    period: 'za 2025 r.',
    status: NONE,
    sources: [{ label: 'DDWłocławek', href: LINKS.ddWloclawek }],
  },
  {
    id: 'wadowice',
    place: 'Szpital powiatowy w Wadowicach',
    what: 'Anestezjolog — najwyższe wynagrodzenie w szpitalu',
    amount: '1 346 906,59 zł',
    period: 'za 2025 r.',
    note: 'Szpital rozlicza 89 lekarzy na umowach cywilnoprawnych, łącznie ponad 43 mln zł rocznie. Kolejne dwie kwoty: ok. 1,31 i 1,20 mln zł.',
    status: NONE,
    sources: [
      { label: 'TVN24', href: LINKS.tvnWadowice },
      { label: 'Wadowice24', href: LINKS.wadowice24 },
    ],
  },
  {
    id: 'kalisz',
    place: 'Szpital wojewódzki w Kaliszu',
    what: 'Czterej najlepiej zarabiający lekarze na kontraktach — łącznie',
    amount: 'ok. 10 mln zł',
    period: 'rocznie, dla czterech osób razem',
    note: 'Kwotę potwierdził dyrektor szpitala. Szpital ma ponad 40 mln zł długu.',
    status: {
      stage: 'sledztwo',
      label: 'śledztwo, brak zarzutów',
      asOf: '6.08.2026',
      note: 'Prokuratura Okręgowa w Ostrowie Wlkp. bada okres poprzedniej dyrekcji, m.in. zakupy leków i wysokie wynagrodzenia kilku lekarzy. Śledztwo przedłużono do 14.12.2026.',
    },
    sources: [
      { label: 'Rynek Zdrowia', href: LINKS.rzKalisz },
      { label: 'ESKA Ostrów', href: LINKS.eskaKalisz },
    ],
  },
];

/**
 * Dziesięć najwyższych wynagrodzeń personelu medycznego w szpitalach wojewódzkich Mazowsza za 2025 r.,
 * osobno dla każdej formy zatrudnienia (zestawienie urzędu marszałkowskiego za Rynkiem Zdrowia).
 * Wiersz to miejsce w rankingu danej formy, a nie jedna osoba. Kwoty za miesiąc, zaokrąglone do złotego: etat i umowa
 * cywilnoprawna brutto, kontrakt — jedna kwota bez podziału na brutto i netto (tak podaje źródło).
 */
export const MAZOWSZE: { etat: number; kontrakt: number; rozwiazana?: boolean; cywilna: number }[] = [
  { etat: 101384, kontrakt: 316079, rozwiazana: true, cywilna: 100147 },
  { etat: 97736, kontrakt: 258400, rozwiazana: true, cywilna: 62600 },
  { etat: 93928, kontrakt: 231738, cywilna: 51980 },
  { etat: 90473, kontrakt: 210301, cywilna: 49710 },
  { etat: 87129, kontrakt: 199100, cywilna: 43200 },
  { etat: 86145, kontrakt: 198204, cywilna: 35167 },
  { etat: 81046, kontrakt: 197229, cywilna: 33820 },
  { etat: 79807, kontrakt: 188775, cywilna: 32580 },
  { etat: 78712, kontrakt: 178638, cywilna: 32010 },
  { etat: 74737, kontrakt: 174636, cywilna: 31752 },
];

const zl = (n: number) => `${formatPL(n)} zł`;

export const MAZOWSZE_TABLE: CompareTable = {
  caption: 'Dziesięć najwyższych miesięcznych wynagrodzeń w szpitalach wojewódzkich Mazowsza, 2025 r., osobno dla każdej formy zatrudnienia. Etat i umowa cywilnoprawna — brutto; dla kontraktu źródło podaje jedną kwotę.',
  columns: ['Miejsce', 'Etat', 'Kontrakt', 'Umowa cywilnoprawna'],
  rows: MAZOWSZE.map((r, i) => ({
    cells: [`${i + 1}.`, zl(r.etat), r.rozwiazana ? `${zl(r.kontrakt)} (umowa rozwiązana)` : zl(r.kontrakt), zl(r.cywilna)],
    marked: i === 0,
  })),
};

/**
 * Najwyższy kontrakt i najwyższa pensja na etacie w szpitalach samorządu województwa, 2025 r. — tylko województwa,
 * których urzędy podały kwoty brutto według tej samej definicji co Mazowsze (jedna osoba, miesiąc, z dyżurami
 * i dodatkami cyklicznymi). Dolny Śląsk podał netto, Opolskie inny okres — poza tabelą (opis w artykule).
 * Podkarpacie: kontrakt z Tarnobrzega, etat z Rzeszowa (urząd podał po pięć kwot na szpital).
 * Zachodniopomorskie: etat „ponad 55,8 tys. zł” — próg, więc iloraz jest górną granicą.
 */
export const REGIONS: { name: string; kontrakt: number; etat: string; ratio: string }[] = [
  { name: 'mazowieckie', kontrakt: 316079, etat: zl(101384), ratio: '3,1' },
  { name: 'zachodniopomorskie', kontrakt: 216644, etat: 'ponad 55 800 zł', ratio: 'do 3,9' },
  { name: 'lubuskie', kontrakt: 198043, etat: zl(95443), ratio: '2,1' },
  { name: 'podkarpackie', kontrakt: 138968, etat: zl(71424), ratio: '1,9' },
  { name: 'warmińsko-mazurskie', kontrakt: 136520, etat: zl(67232), ratio: '2,0' },
];

export const REGIONS_TABLE: CompareTable = {
  caption: 'Najwyższe miesięczne wynagrodzenie na kontrakcie i na etacie w szpitalach samorządu województwa, 2025 r., brutto, według zestawień urzędów marszałkowskich.',
  columns: ['Województwo', 'Najwyższy kontrakt', 'Najwyższy etat', 'Kontrakt ÷ etat'],
  rows: REGIONS.map((r, i) => ({ cells: [r.name, zl(r.kontrakt), r.etat, `${r.ratio}×`], marked: i === 0 })),
};
