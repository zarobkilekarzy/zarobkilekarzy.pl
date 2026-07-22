// Rejestr stron treściowych — JEDEN rekord na trasę.
//
// Dwie warstwy opisu strony:
//   • `dzial`  — GATUNEK tekstu (mechanizm ≠ liczba ≠ argument). Wyznacza URL
//                i nawigację górną. To jest teza redakcyjna serwisu, nie zmieniamy jej.
//   • `tematy` — KATEGORIA do oznaczenia karty na hubie działu (/mechanizmy, /dane,
//                /analizy). Wiodąca (`tematy[0]`) to etykieta widoczna na karcie.
//
// Zasada przypisania tematu: temat mówi, o czym strona JEST, a nie jaka jest jej teza.
// Jawność jest tezą KAŻDEJ strony, więc jako temat obejmuje tylko te, w których sam
// rejestr/jawność są przedmiotem — inaczej byłaby szufladą „reszta" (tak jak dziś
// `category: system` łapie 40 z 95 artykułów).
//
// Ten plik zastępuje ręczne tablice kart w hubach. Docelowo wchłania też
// `pageDates.mjs` (daty) i `ogPages.ts` (karty OG) — dziś tytuł i opis strony żyją
// w trzech kopiach naraz.

export const TEMATY = {
  jawnosc: {
    label: 'Jawność i rejestr',
    opis: 'Co jest jawne, co nie i dlaczego — rejestr jako przedmiot, nie jako teza.',
  },
  'pieniadz-nfz': {
    label: 'Pieniądz publiczny i wynagrodzenia',
    opis: 'Cały strumień publicznego pieniądza: budżet i wycena NFZ, dług, kontrakty, dyżury i realne wynagrodzenia — i gdzie po drodze znika jawność.',
  },
  'dostep-do-zawodu': {
    label: 'Dostęp do zawodu i kształcenie',
    opis: 'Limity miejsc, lejek specjalizacji, rola izby i wejścia spoza UE.',
  },
  kadra: {
    label: 'Kadra i porównania',
    opis: 'Reszta personelu ochrony zdrowia i Polska na tle sąsiadów.',
  },
} as const;

export type TematSlug = keyof typeof TEMATY;
export type Dzial = 'mechanizmy' | 'dane' | 'analizy';

export interface Strona {
  dzial: Dzial;
  /** Tytuł karty w hubie (krótszy niż <title> strony). */
  tytul: string;
  /** Opis karty w hubie. */
  opis: string;
  /** Oś tematyczna — max 2. Pierwszy temat jest wiodący. */
  tematy: TematSlug[];
}

// Klucz = ścieżka bez końcowego „/" (jak w pageDates.mjs).
export const strony: Record<string, Strona> = {
  // — Mechanizmy —
  '/mechanizmy/wieloetatowosc': {
    dzial: 'mechanizmy',
    tytul: 'Wieloetatowość i równoległe kontrakty',
    opis: 'Ten sam lekarz rozlicza kontrakty w kilku placówkach naraz — nikt nie widzi sumy.',
    tematy: ['pieniadz-nfz'],
  },
  '/mechanizmy/kontrakt-vs-etat': {
    dzial: 'mechanizmy',
    tytul: 'Kontrakt czy etat',
    opis: 'Dlaczego ~73% specjalistów rozlicza się jako firma — i czemu to właśnie forma zatrudnienia decyduje o jawności.',
    tematy: ['pieniadz-nfz'],
  },
  '/mechanizmy/dyzury-i-gotowosc': {
    dzial: 'mechanizmy',
    tytul: 'Dyżur „pod telefonem”',
    opis: 'Opłacana gotowość bez obecności w szpitalu. Ile ich przypada na tę samą dobę?',
    tematy: ['pieniadz-nfz'],
  },
  '/mechanizmy/rozliczenia-nfz': {
    dzial: 'mechanizmy',
    tytul: 'Rozliczenia: ryczałt, punkty, nadwykonania',
    opis: 'Nieprzejrzysty sposób rozliczeń tworzy przestrzeń do optymalizacji przychodu.',
    tematy: ['pieniadz-nfz'],
  },
  '/mechanizmy/fikcyjne-wizyty': {
    dzial: 'mechanizmy',
    tytul: 'Wizyty, których nie było',
    opis: 'Świadczenie sprawozdane do NFZ na pacjenta, który o nim nie wie. Jedynym świadkiem spoza układu placówka–NFZ jest ten pacjent — sprawdź swoje IKP.',
    tematy: ['jawnosc'],
  },
  '/mechanizmy/wycena-swiadczen': {
    dzial: 'mechanizmy',
    tytul: 'Wycena świadczeń: kto ustala, ile płaci NFZ',
    opis: 'Niezależną taryfą objęto ~17% wartości świadczeń — resztę cen ustala sam płatnik. Cena rozjeżdża się z kosztem: raz szpital traci na leczeniu (kolejka), raz procedura staje się magnesem na zysk.',
    tematy: ['pieniadz-nfz'],
  },
  '/mechanizmy/brak-jawnosci': {
    dzial: 'mechanizmy',
    tytul: 'Brak jawności jako warunek nadużyć',
    opis: 'Wspólny mianownik wszystkich mechanizmów — i to, kto na tym traci.',
    tematy: ['jawnosc'],
  },
  '/mechanizmy/samorzad-nil': {
    dzial: 'mechanizmy',
    tytul: 'Rola samorządu (NIL)',
    opis: 'Izba z mocy ustawy reprezentuje interesy zawodu, nie pacjentów. Asymetria głosu.',
    tematy: ['dostep-do-zawodu'],
  },
  '/mechanizmy/reglamentacja-dostepu': {
    dzial: 'mechanizmy',
    tytul: 'Reglamentacja dostępu do zawodu',
    opis: 'Limity miejsc i sprzeciw wobec nowych kierunków. Mniej konkurencji to wyższe stawki.',
    tematy: ['dostep-do-zawodu'],
  },

  // — Dane —
  '/dane/patologia-w-liczbach': {
    dzial: 'dane',
    tytul: 'Patologia w liczbach',
    opis: 'Najmocniejsze liczby serwisu — na wykresach. Mało tekstu, twarde dane, źródła.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/rozklad-wynagrodzen': {
    dzial: 'dane',
    tytul: 'Rozkład wynagrodzeń',
    opis: 'Od pensji rezydenta po górny 1% — cała rozpiętość, per forma zatrudnienia.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/zarobki-ujawnione-listy': {
    dzial: 'dane',
    tytul: 'Zarobki z ujawnionych list płac',
    opis: '54 szpitale ujawniły pełne listy — 3746 rozliczeń. Mediana ~200 tys. zł/rok, co siódme ponad pół miliona, dziesiątki powyżej miliona — a każda kwota to zapłata jednego tylko szpitala. Dane z obywatelskiego monitoringu Watchdog Polska.',
    tematy: ['pieniadz-nfz', 'jawnosc'],
  },
  '/dane/personel-medyczny': {
    dzial: 'dane',
    tytul: 'Inni pracownicy OZ',
    opis: 'Pielęgniarki, ratownicy, diagności, fizjoterapeuci — drabina taryfowa ustawy obok zarobków lekarzy.',
    tematy: ['kadra'],
  },
  '/dane/wedlug-specjalizacji': {
    dzial: 'dane',
    tytul: 'Według specjalizacji',
    opis: 'Pensja rezydenta, stawka rynkowa, miejsca i konkurencja — dla 29 dziedzin.',
    tematy: ['dostep-do-zawodu'],
  },
  '/dane/pensje-rezydentow': {
    dzial: 'dane',
    tytul: 'Pensje rezydentów',
    opis: 'Jedyna dokładna liczba „zł per specjalizacja”. Paradoks priorytetów.',
    tematy: ['dostep-do-zawodu', 'pieniadz-nfz'],
  },
  '/dane/rekordy': {
    dzial: 'dane',
    tytul: 'Rekordowe rozliczenia',
    opis: 'Od 316 tys. zł/mies. po miliony rocznie. Bez nazwisk — mechanizm, nie osoba.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/stawki': {
    dzial: 'dane',
    tytul: 'Stawki godzinowe',
    opis: 'Minimum ustawowe kontra rynek. Oferta to nie to samo co wypłata.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/budzet-nfz': {
    dzial: 'dane',
    tytul: 'Budżet NFZ',
    opis: 'Budżet rośnie, ale wzrost pochłaniają ustawowe płace, nie nowe świadczenia.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/zadluzenie-szpitali': {
    dzial: 'dane',
    tytul: 'Zadłużenie szpitali',
    opis: 'Dług 34 mld zł idzie głównie na wynagrodzenia — pensje na kredyt, który spłacamy.',
    tematy: ['pieniadz-nfz'],
  },
  '/dane/kolejki': {
    dzial: 'dane',
    tytul: 'Pieniądze a kolejka',
    opis: 'Infografika + dłuższa perspektywa: budżet, składka, dopłaty i inflacja rosną — kolejka też.',
    tematy: ['pieniadz-nfz'],
  },

  // — Analizy —
  '/analizy/monitor-reformy-zdrowia': {
    dzial: 'analizy',
    tytul: 'Monitor reformy zdrowia',
    opis: 'Żywe rozliczenie reformy: zbieramy deklaracje rządu i twarde etapy legislacyjne, układamy je na osi czasu i śledzimy status każdej obietnicy — spełniona, w toku, spóźniona czy porzucona. Każda pozycja z linkiem do źródła.',
    tematy: ['pieniadz-nfz', 'jawnosc'],
  },
  '/analizy/ustawa-o-danych-a-jawny-rejestr': {
    dzial: 'analizy',
    tytul: 'Państwo policzy, obywatel nie zobaczy',
    opis: 'Podpisana 17 lipca 2026 r. ustawa pozwala państwu po raz pierwszy zsumować wypłaty jednej osoby z wielu placówek — skreśla słowo „zanonimizowane” i dokłada PESEL oraz PWZ. Cała mieści się w trzech artykułach, w których nie ma ani jednego przepisu nakazującego cokolwiek opublikować. Analiza przepisów i cztery różnice wobec jawnego rejestru po numerze PWZ.',
    tematy: ['jawnosc'],
  },
  '/analizy/pielegniarstwo-w-polsce': {
    dzial: 'analizy',
    tytul: 'Pielęgniarstwo w Polsce: drabina wieku i nadchodzący niedobór',
    opis: 'Najstarsza kadra systemu: średni wiek pielęgniarki to 54 lata, 34% jest już w wieku emerytalnym, a do 2030 r. będzie ich 65%. Wchodzi 6205 rocznie, w wiek emerytalny — nawet 10 tys. Do tego gęstość 5,9 na 1000 (najniższa w UE), emigracja i starzejące się społeczeństwo. Nożyce, które właśnie się zamykają.',
    tematy: ['kadra'],
  },
  '/analizy/sladem-zlotowki': {
    dzial: 'analizy',
    tytul: 'Śladem publicznej złotówki',
    opis: 'Prześledź jedną złotówkę: od Twojej składki, przez wycenę leczenia i ryczałt szpitala, po wypłatę lekarza. Na każdym z pięciu przystanków widać zbiorczą kwotę — nigdy tego, ile trafiło do konkretnego numeru PWZ. Wykład o tym, jak działa finansowanie NFZ, i o tym, gdzie po drodze znika jawność.',
    tematy: ['pieniadz-nfz', 'jawnosc'],
  },
  '/analizy/jedno-pwz': {
    dzial: 'analizy',
    tytul: 'Jeden lekarz, wiele strumieni',
    opis: 'Kontrakt, dyżury i poradnia mogą zbiegać się na jednym numerze PWZ — a łącznej sumy nikt nie liczy. Model tego, czego nie widać.',
    tematy: ['jawnosc', 'pieniadz-nfz'],
  },
  '/analizy/poz-pieniadz-za-pacjenta': {
    dzial: 'analizy',
    tytul: 'POZ: pieniądz za zarejestrowanego pacjenta',
    opis: 'Kapitacja jest jawna co do grosza — a i tak nie wiadomo, ile zostaje lekarzowi. Ten sam strumień naraz najbardziej i najmniej jawny w systemie.',
    tematy: ['pieniadz-nfz'],
  },
  '/analizy/zarobki-lekarzy-polska-sasiedzi': {
    dzial: 'analizy',
    tytul: 'Zarobki lekarzy: Polska na tle sąsiadów',
    opis: 'Czechy, Niemcy, Austria — u sąsiadów płace są jawne w taryfach. Polska ukrywa realny dochód w niejawnym kontrakcie.',
    tematy: ['kadra', 'jawnosc'],
  },
  '/analizy/dlaczego-brakuje-lekarzy': {
    dzial: 'analizy',
    tytul: 'Dlaczego brakuje lekarzy',
    opis: 'Miejsc jest dużo, a lekarza „nie ma”. Sześć mechanizmów paradoksu — i dlaczego to nie problem samej liczby.',
    tematy: ['dostep-do-zawodu'],
  },
  '/analizy/lekarze-ze-wschodu': {
    dzial: 'analizy',
    tytul: 'Lekarze ze wschodu',
    opis: 'Lekarze spoza UE wchodzą do zawodu decyzją ministra, z pominięciem izb i weryfikacji dyplomu. Mechanizm, liczby i luki jawności.',
    tematy: ['dostep-do-zawodu', 'kadra'],
  },
  '/analizy/lejek-ksztalcenia': {
    dzial: 'analizy',
    tytul: 'Lejek kształcenia',
    opis: 'Miejsc przybywa, ale 2/3–3/4 miejsc specjalizacyjnych co roku stoi pustych. Wąskie gardło jest strukturalne.',
    tematy: ['dostep-do-zawodu'],
  },
  '/analizy/apteka-pieniadz-publiczny': {
    dzial: 'analizy',
    tytul: 'Apteka i recepta: pieniądz, którego nikt nie sumuje',
    opis: 'Refundacja 25,5 mld zł, wyłudzenia, receptomaty, kolejka po receptę — wszystko zbiega się na numerze PWZ, a nikt tego nie łączy ani nie publikuje.',
    tematy: ['pieniadz-nfz'],
  },
  '/analizy/covid-pieniadz-publiczny': {
    dzial: 'analizy',
    tytul: 'COVID-19: miliardy bez jawnego rozliczenia',
    opis: 'Fundusz COVID ~190 mld zł, ~9 mld dodatków wypłaconych — wg NIK — bez żadnej kontroli, 15 tys. zł za 30 minut pracy. Nie o szczepionkach, o pieniądzu.',
    tematy: ['pieniadz-nfz'],
  },
  '/analizy/ucieczka-lekarzy': {
    dzial: 'analizy',
    tytul: 'Zarezerwowane dla lekarzy: rynek urody, który wyciąga ich z kolejki',
    opis: 'Państwo oddaje lekarzom wyłączność na dochodową medycynę estetyczną. Skoro tylko oni mogą — gotówka przeciąga deficytowe godziny od pacjenta. Miarą ciągu jest cały zagrożony rynek beauty, nie garstka dzisiejszych lekarzy.',
    tematy: ['dostep-do-zawodu'],
  },
  '/analizy/odpowiedzialnosc-zawodowa-lekarzy': {
    dzial: 'analizy',
    tytul: 'Najwyższa kara, której prawie się nie orzeka',
    opis: 'Sąd lekarski może odebrać prawo do zawodu — przez ćwierć wieku (2000–2024) zrobił to prawomocnie wobec około 20 lekarzy, mniej więcej jednego rocznie. 86% spraw kończy się upomnieniem, naganą lub grzywną. Dane policzone z rocznych sprawozdań sądów lekarskich. Nie o „bezkarnych lekarzach”, lecz o tym, jak korporacja rozlicza samą siebie.',
    tematy: ['dostep-do-zawodu', 'jawnosc'],
  },
  '/analizy/nil-a-kontrakty-lekarskie': {
    dzial: 'analizy',
    tytul: 'Naczelna Izba Lekarska a kontrakty lekarskie',
    opis: 'Kontraktów samorząd nie wprowadził — zrobił to związek zawodowy (OZZL) i ustawodawca. NIL ani ich nie forsuje, ani przeciw nim nie protestuje: broni prawa do kontraktu, lecz krytykuje nadużycia. Rozwiązaniem nie jest likwidacja formy, lecz jawność łącznej kwoty po numerze PWZ.',
    tematy: ['pieniadz-nfz', 'dostep-do-zawodu'],
  },
  '/analizy/zarobki-dyrektorow-szpitali': {
    dzial: 'analizy',
    tytul: 'Ile zarabiają dyrektorzy szpitali — i dlaczego akurat to jest jawne',
    opis: 'Zarobki dyrektorów SPZOZ i części prezesów spółek są jawne co do złotówki — z mocy prawa, w oświadczeniach majątkowych. To odwrotność ukrytych kontraktów. A jednak ta jawność odsłania kumulację funkcji, pensje rosnące mimo długu i lukę między reżimem SPZOZ a spółką. Dowód, że jawny rejestr jest wykonalny.',
    tematy: ['jawnosc'],
  },
  '/analizy/komin-placowy': {
    dzial: 'analizy',
    tytul: 'Co to jest komin płacowy',
    opis: 'Rażąco wysoka płaca jednej osoby, „wystająca” ponad resztę jak komin ponad dach. Ustawa kominowa miała je ścinać — działa jednak tam, gdzie pieniądz i tak widać (jawna pensja na etacie), a jest ślepa na najwyższy komin w ochronie zdrowia: kontrakt sumowany po placówkach.',
    tematy: ['jawnosc', 'pieniadz-nfz'],
  },
  // Poradnik dla pacjenta pod adresem /prawa-pacjenta (poza prefiksem /analizy/),
  // ale wystawiony na hubie analiz — `dzial` steruje tylko przynależnością do huba,
  // href karty bierze się z klucza. Oś „jawność": poinformowany pacjent to audyt.
  '/prawa-pacjenta': {
    dzial: 'analizy',
    tytul: 'Prawa pacjenta — i gdzie zgłosić naruszenie',
    opis: 'Poinformowany pacjent to jedyny codzienny audyt systemu. Co gwarantuje Ci ustawa, ile masz czasu i pod jaki numer zadzwonić — prawa, terminy i kanały zgłoszeń, każda pozycja z artykułem ustawy.',
    tematy: ['jawnosc'],
  },
};

// — Odczyt —

/** Ścieżka bez końcowego „/" — te same zasady co pageDates.normalizePath. */
export function normalize(pathname: string): string {
  const stripped = String(pathname || '').replace(/^\/+|\/+$/g, '');
  return stripped ? `/${stripped}` : '/';
}

export interface Wpis extends Strona {
  href: string;
}

const wpisy: Wpis[] = Object.entries(strony).map(([sciezka, s]) => ({
  ...s,
  href: `${sciezka}/`,
}));

/** Strony jednego działu — w kolejności deklaracji w rejestrze. */
export function stronyDzialu(dzial: Dzial): Wpis[] {
  return wpisy.filter((w) => w.dzial === dzial);
}

/** Pojedyncza strona po ścieżce (dla kart-gości w cudzym hubie). */
export function strona(sciezka: string): Wpis {
  const s = strony[normalize(sciezka)];
  if (!s) throw new Error(`pages.ts: brak wpisu dla „${sciezka}"`);
  return { ...s, href: `${normalize(sciezka)}/` };
}

