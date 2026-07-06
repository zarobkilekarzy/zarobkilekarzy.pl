// Źródło prawdy dla dynamicznych obrazów OG (Open Graph / Twitter card).
// Klucz = trasa bez wiodącego „/" ('home' dla strony głównej). Wartość steruje
// tym, co pojawia się na obrazie 1200×630 generowanym w buildzie przez satori.
// Strony spoza tej mapy dostają domyślny /og-image.png (fallback w BaseLayout).

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
    subtitle: 'Pensja rezydenta, stawka rynkowa, miejsca i konkurencja — dla 15 dziedzin.',
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
  'analizy/zarobki-lekarzy-polska-sasiedzi': {
    tag: 'Analiza',
    title: 'Zarobki lekarzy: Polska na tle sąsiadów',
    subtitle: 'Czechy, Niemcy, Austria — u sąsiadów płace jawne w taryfie. U nas realny dochód ukrywa niejawny kontrakt.',
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
  'analizy/poz-pieniadz-za-pacjenta': {
    tag: 'Analiza',
    title: 'POZ: pieniądz za zarejestrowanego pacjenta',
    subtitle: 'Kapitacja jest jawna co do grosza — a i tak nie wiadomo, ile zostaje lekarzowi. Publiczny strumień policzalny, wynik nieprzejrzysty.',
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
};
