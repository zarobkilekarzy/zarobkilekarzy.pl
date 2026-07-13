// Źródło prawdy dla dynamicznych obrazów OG (Open Graph / Twitter card).
// Klucz = trasa bez wiodącego „/" ('home' dla strony głównej). Wartość steruje
// tym, co pojawia się na obrazie 1200×630 generowanym w buildzie przez satori.
// Trasy spoza tej mapy dziedziczą OG najbliższego rodzica, a przy jego braku
// kartę strony głównej /og/home.png (fallback w BaseLayout) — nigdy statycznego pliku.

export interface OgPage {
  title: string;      // duży nagłówek (serif)
  subtitle: string;   // jednozdaniowy opis (sans)
  tag: string;        // etykieta sekcji (mała, wersaliki)
}

export const ogPages: Record<string, OgPage> = {
  home: {
    tag: 'Inicjatywa obywatelska',
    title: 'Publiczne pieniądze, niejawne zarobki',
    subtitle: 'Część lekarzy rozlicza miliony ze środków publicznych, a pacjenci czekają w kolejce. Zbieramy dane i postulujemy jawny rejestr.',
  },

  // — Dane —
  'dane': {
    tag: 'Dane',
    title: 'Dane o pieniądzu publicznym w ochronie zdrowia',
    subtitle: 'Wydatki, wynagrodzenia i dostępność świadczeń — każda liczba z podaniem źródła.',
  },
  'dane/rekordy': {
    tag: 'Dane · Rekordy',
    title: 'Rekordowe rozliczenia',
    subtitle: 'Od 316 tys. zł miesięcznie po miliony rocznie — ze środków publicznych. Bez nazwisk, sam mechanizm.',
  },
  'dane/patologia-w-liczbach': {
    tag: 'Dane · Patologia w liczbach',
    title: 'Patologia w liczbach',
    subtitle: 'Najmocniejsze liczby o pieniądzu publicznym w ochronie zdrowia — na wykresach. 316 tys. zł kontraktu, 26 tys. zł za godzinę, 11 577 godzin w roku, który ma 8 760. Każda ze źródłem.',
  },
  'dane/kolejki': {
    tag: 'Dane · Kolejki',
    title: 'Pieniądze rosną, kolejka nie maleje',
    subtitle: 'Budżet NFZ, składka i dopłaty w górę — a czas oczekiwania do lekarza też. Same pieniądze nie kupują krótszych kolejek.',
  },
  'dane/zadluzenie-szpitali': {
    tag: 'Dane · Zadłużenie',
    title: 'Zadłużenie szpitali: 34 mld zł',
    subtitle: 'Dług idzie nie na inwestycje, lecz na bieżące wynagrodzenia — pensje wypłacane na kredyt, który spłaca podatnik.',
  },
  'dane/budzet-nfz': {
    tag: 'Dane · Budżet',
    title: 'Budżet NFZ',
    subtitle: 'Budżet rośnie, ale wzrost pochłaniają ustawowe płace, nie nowe świadczenia dla pacjenta.',
  },
  'dane/rozklad-wynagrodzen': {
    tag: 'Dane · Rozkład',
    title: 'Rozkład wynagrodzeń lekarzy',
    subtitle: 'Od pensji rezydenta po górny 1% — cała rozpiętość, per forma zatrudnienia. Kwot kontraktów nikt nie publikuje.',
  },
  'dane/wedlug-specjalizacji': {
    tag: 'Dane · Specjalizacje',
    title: 'Zarobki według specjalizacji',
    subtitle: 'Pensja rezydenta, stawka rynkowa, miejsca i konkurencja — dla 29 dziedzin.',
  },
  'dane/personel-medyczny': {
    tag: 'Dane · Inni pracownicy OZ',
    title: 'Inni pracownicy ochrony zdrowia — obok lekarzy',
    subtitle: 'Pielęgniarki, ratownicy, diagności, fizjoterapeuci — ustawowa drabina płac obok zarobków lekarzy. Ta część wynagrodzeń jest jawna.',
  },
  'dane/pensje-rezydentow': {
    tag: 'Dane · Rezydenci',
    title: 'Pensje rezydentów',
    subtitle: 'Jedyna dokładna liczba „zł per specjalizacja". Paradoks priorytetów systemu.',
  },
  'dane/stawki': {
    tag: 'Dane · Stawki',
    title: 'Stawki godzinowe: minimum kontra rynek',
    subtitle: 'Od ustawowego minimum na etacie po kontrakty B2B. Oferta to nie to samo co wypłata.',
  },

  // — Analizy —
  'analizy': {
    tag: 'Analizy',
    title: 'Pogłębione analizy jawności',
    subtitle: 'Porównania międzynarodowe, mechanika niedoboru lekarzy i kształcenia. Każda teza z linkiem do źródła.',
  },
  'analizy/sladem-zlotowki': {
    tag: 'Analiza · Jak działa system',
    title: 'Śladem publicznej złotówki',
    subtitle: 'Od Twojej składki do kontraktu lekarza. Na każdym etapie widać zbiorczą kwotę — nigdy tego, ile trafiło do konkretnego numeru PWZ.',
  },
  'analizy/zarobki-lekarzy-polska-sasiedzi': {
    tag: 'Analiza',
    title: 'Zarobki lekarzy: Polska na tle Europy',
    subtitle: 'Czechy, Niemcy, Austria, Szwecja — płace jawne z taryf, w Szwecji imiennie. U nas dochód ukrywa niejawny kontrakt.',
  },
  'analizy/dlaczego-brakuje-lekarzy': {
    tag: 'Analiza',
    title: 'Dlaczego brakuje lekarzy — choć miejsc jest dużo',
    subtitle: 'Miejsc do kształcenia sporo, a lekarza „nie ma". Sześć mechanizmów paradoksu i lejek liczby lekarzy.',
  },
  'analizy/lejek-ksztalcenia': {
    tag: 'Analiza',
    title: 'Lejek kształcenia lekarzy',
    subtitle: 'Miejsc przybywa, ale 2/3–3/4 miejsc specjalizacyjnych co roku stoi pustych. Wąskie gardło jest strukturalne.',
  },
  'analizy/lekarze-ze-wschodu': {
    tag: 'Analiza',
    title: 'Lekarze ze wschodu — kogo wpuszczamy',
    subtitle: 'Lekarze spoza UE wchodzą do zawodu decyzją ministra, z pominięciem izb i weryfikacji dyplomu. Mechanizm, liczby i luki jawności.',
  },
  'analizy/poz-pieniadz-za-pacjenta': {
    tag: 'Analiza',
    title: 'POZ: pieniądz za zarejestrowanego pacjenta',
    subtitle: 'Kapitacja jest jawna co do grosza — a i tak nie wiadomo, ile zostaje lekarzowi. Publiczny strumień policzalny, wynik nieprzejrzysty.',
  },
  'analizy/apteka-pieniadz-publiczny': {
    tag: 'Analiza',
    title: 'Apteka i recepta: pieniądz, którego nikt nie sumuje',
    subtitle: 'Refundacja, wyłudzenia, receptomaty, kolejka po receptę — wszystko zbiega się na numerze PWZ, a nikt tego nie łączy ani nie publikuje.',
  },
  'analizy/covid-pieniadz-publiczny': {
    tag: 'Analiza',
    title: 'COVID-19: miliardy bez jawnego rozliczenia',
    subtitle: '~190 mld zł przez Fundusz COVID, ~9 mld dodatków wypłaconych bez kontroli, 15 tys. zł za 30 minut pracy. Nie o szczepionkach — o pieniądzu, którego nikt nie zsumował.',
  },
  'analizy/ucieczka-lekarzy': {
    tag: 'Analiza · Kadry',
    title: 'Zarezerwowane dla lekarzy — rynek „urody”, który wyciąga ich z kolejki',
    subtitle: 'Państwo oddaje lekarzom wyłączność na dochodową medycynę estetyczną. Skoro tylko oni mogą, a gotówka bije NFZ — rezerwacja przeciąga ich od pacjenta. Bodziec stworzony przez państwo, nie zarzut wobec lekarzy.',
  },
  'analizy/nil-a-kontrakty-lekarskie': {
    tag: 'Analiza · Samorząd',
    title: 'Naczelna Izba Lekarska a kontrakty lekarskie',
    subtitle: 'Kontraktów samorząd nie wprowadził — zrobił to związek zawodowy i ustawodawca. NIL ani ich nie forsuje, ani przeciw nim nie protestuje: broni prawa do kontraktu, lecz krytykuje nadużycia. Rozwiązaniem nie jest likwidacja formy, lecz jawność łącznej kwoty po numerze PWZ.',
  },
  'analizy/zarobki-dyrektorow-szpitali': {
    tag: 'Analiza · Dyrektorzy',
    title: 'Zarobki dyrektorów szpitali są jawne',
    subtitle: 'Oświadczenia majątkowe pokazują pensje kadry zarządzającej co do złotówki — z mocy prawa od 1997 r. To odwrotność ukrytych kontraktów. Problem nie w tajemnicy, lecz w tym, co ta jawność odsłania: kumulację funkcji, pensje rosnące mimo długu i lukę między SPZOZ a spółką.',
  },
  'analizy/komin-placowy': {
    tag: 'Analiza · Pojęcia',
    title: 'Co to jest komin płacowy',
    subtitle: 'Rażąco wysoka płaca jednej osoby, „wystająca” ponad resztę. Ustawa kominowa miała je ścinać — działa jednak tam, gdzie pieniądz i tak widać (jawna pensja na etacie), a jest ślepa na najwyższy komin w ochronie zdrowia: kontrakt sumowany po placówkach.',
  },

  // — Mechanizmy —
  'mechanizmy': {
    tag: 'Mechanizmy',
    title: 'Jak działa nieprzejrzystość',
    subtitle: 'Wieloetatowość, dyżury, rozliczenia NFZ, samorząd, reglamentacja dostępu — mechanizmy, nie osoby.',
  },
  'mechanizmy/wieloetatowosc': {
    tag: 'Mechanizm',
    title: 'Wieloetatowość',
    subtitle: 'Ten sam lekarz rozlicza kontrakty w kilku placówkach naraz — a nikt tego nie sumuje.',
  },
  'mechanizmy/dyzury-i-gotowosc': {
    tag: 'Mechanizm',
    title: 'Dyżury i gotowość',
    subtitle: 'Jak kontrakty bez limitu godzin pozwalają rozliczać setki godzin miesięcznie.',
  },
  'mechanizmy/rozliczenia-nfz': {
    tag: 'Mechanizm',
    title: 'Rozliczenia NFZ',
    subtitle: 'Płatnik zna każdą wypłatę, ale nie łączy jej po lekarzu ani nie publikuje.',
  },
  'mechanizmy/wycena-swiadczen': {
    tag: 'Mechanizm',
    title: 'Wycena świadczeń: kto ustala, ile płaci NFZ',
    subtitle: 'Niezależną taryfą objęto ~17% wartości świadczeń — resztę ustala sam płatnik. Cena leczenia to decyzja, nie pomiar.',
  },
  'mechanizmy/brak-jawnosci': {
    tag: 'Mechanizm',
    title: 'Brak jawności',
    subtitle: 'Publicznych rejestrów łącznych wynagrodzeń lekarzy ze środków publicznych: zero.',
  },
  'mechanizmy/samorzad-nil': {
    tag: 'Mechanizm',
    title: 'Samorząd lekarski (NIL)',
    subtitle: 'Etyka, „prokuratura" i „sąd" zamknięte w jednej strukturze o jednym celu.',
  },
  'mechanizmy/reglamentacja-dostepu': {
    tag: 'Mechanizm',
    title: 'Reglamentacja dostępu do zawodu',
    subtitle: 'Jak ograniczanie podaży lekarzy winduje stawki płacone ze środków publicznych.',
  },

  // — Działanie / reszta —
  'postulat': {
    tag: 'Postulat',
    title: 'Jawny rejestr wynagrodzeń ze środków publicznych',
    subtitle: 'Łączne wynagrodzenie lekarza z NFZ, powiązane z numerem PWZ — nie z PESEL, nie z danymi prywatnymi.',
  },
  'petycja': {
    tag: 'Petycja',
    title: 'Wyślij petycję o jawność wynagrodzeń lekarzy',
    subtitle: 'Gotowa, formalna petycja o jawny rejestr wynagrodzeń ze środków publicznych. Wpisz imię, skopiuj, wyślij — urząd ma obowiązek ją rozpatrzyć.',
  },
  'petycja/tresc': {
    tag: 'Petycja · Treść',
    title: 'Treść petycji o jawny rejestr',
    subtitle: 'Pełna treść petycji o jawny rejestr wynagrodzeń lekarzy ze środków publicznych — z omówieniem, z czego się składa i dlaczego.',
  },
  'petycja/jak-to-dziala': {
    tag: 'Petycja · Jak to działa',
    title: 'Jak działa ta petycja — i dlaczego tak',
    subtitle: 'Dlaczego formalna petycja zamiast change.org, dlaczego każdy w swoim imieniu, co z danymi i jaka jest moc prawna.',
  },
  'artykuly': {
    tag: 'Baza artykułów',
    title: 'Baza artykułów o pieniądzu w ochronie zdrowia',
    subtitle: 'Oźródłowane doniesienia o rozliczeniach, kontraktach, kolejkach i jawności. Każdy wpis z linkiem.',
  },
  'dzialaj': {
    tag: 'Działaj',
    title: 'Dołącz do sprawy',
    subtitle: 'Poprzyj postulat jawności, udostępnij dane, wesprzyj projekt. Pieniądz publiczny, nie polityka.',
  },
  'faq': {
    tag: 'Pytania i zarzuty',
    title: 'Najczęstsze zarzuty — i nasze odpowiedzi',
    subtitle: 'Gramy w otwarte karty: kontrargumenty wobec postulatu jawności i co na nie odpowiadamy.',
  },
  'o-projekcie': {
    tag: 'O projekcie',
    title: 'O projekcie',
    subtitle: 'Obywatelski watchdog jawności pieniędzy publicznych w ochronie zdrowia. Po stronie pacjentów i uczciwych lekarzy.',
  },
  'prywatnosc': {
    tag: 'Informacje',
    title: 'Prywatność',
    subtitle: 'Postulujemy jawność pieniędzy publicznych, nie danych prywatnych — także u siebie. Jak strona obchodzi się z danymi.',
  },
};
