// JEDNO ŹRÓDŁO PRAWDY dla TREŚCI petycji. Każda zmiana tutaj propaguje się na
// wszystkie podstrony przez komponent <PetycjaTresc /> oraz generator na /petycja.
// Tokeny {{IMIE}}, {{MIEJSCOWOSC}} i {{ADRES_KORESPONDENCJI}} podmienia fillPetycja()
// (build-time i w przeglądarce) — zależnie od kanału wysyłki: elektroniczny / druk.

export const PETYCJA_TEMAT =
  'Petycja — jawny rejestr wynagrodzeń lekarzy ze środków publicznych (per PWZ)';

// Treść JEDNA, neutralna względem adresata — ważna zarówno dla organu wykonawczego
// (Ministerstwo Zdrowia), jak i ustawodawczego (Senat). Nie zawiera linii „Adresat:” —
// adresata niesie kanał wysyłki (pole „Do” w mailu / wybór urzędu w piśmie ogólnym).
// Zawiera za to JAWNĄ linię „Adres do korespondencji” (wymóg art. 4 ust. 2 pkt 2 ustawy
// o petycjach; jej brak = pozostawienie bez rozpatrzenia bez wezwania, art. 7 ust. 1) —
// token {{ADRES_KORESPONDENCJI}} wypełnia fillPetycja() brzmieniem z KORESPONDENCJA.
export const PETYCJA_TRESC = `PETYCJA
w sprawie utworzenia jawnego, przeszukiwalnego rejestru wynagrodzeń wypłacanych ze środków publicznych osobom wykonującym zawód lekarza, powiązanego z numerem prawa wykonywania zawodu (PWZ).

Wnoszący petycję: {{IMIE}}, {{MIEJSCOWOSC}}
Adres do korespondencji: {{ADRES_KORESPONDENCJI}}

Na podstawie art. 63 Konstytucji Rzeczypospolitej Polskiej oraz art. 2 ustawy z dnia 11 lipca 2014 r. o petycjach, działając w interesie publicznym, wnoszę o podjęcie działań na rzecz:

1. utworzenia jawnego, ogólnodostępnego rejestru, który dla każdej osoby wykonującej zawód lekarza i lekarza dentysty — identyfikowanej jawnym numerem prawa wykonywania zawodu (PWZ) — wykazuje łączną roczną kwotę brutto otrzymaną ze środków Narodowego Funduszu Zdrowia; docelowo rejestr powinien obejmować także pozostałe środki publiczne (budżet państwa, publiczne podmioty lecznicze, uczelnie medyczne);

2. wykazywania tej kwoty w rozbiciu na poszczególne strumienie — podmiot wypłacający, formę współpracy (umowa o pracę, kontrakt, umowa cywilnoprawna), tytuł wypłaty (świadczenia, dyżur, gotowość, funkcja) oraz, o ile jest ewidencjonowany, odpowiadający im wymiar godzin — tak, aby widoczna była zarówno suma, jak i jej struktura; przy formach typu B2B rejestr wykazuje przychód brutto przed kosztami i podatkami, odzwierciedlając wydatek publiczny, a nie dochód osobisty;

3. publikowania rejestru jako otwarte dane — z możliwością wyszukiwania po numerze PWZ i po podmiocie oraz pobrania całości;

4. ograniczenia zakresu danych wyłącznie do roli zawodowej i kwoty ze środków publicznych, z wyłączeniem danych prywatnych (adresu zamieszkania, numeru PESEL, dochodów ze źródeł niepublicznych).

Zwracam się o powyższe stosownie do kompetencji adresata — w tym, o ile to konieczne, w drodze inicjatywy ustawodawczej.

UZASADNIENIE
Środki publiczne podlegają jawności — obywatel ma prawo wiedzieć, jak wydawany jest pieniądz, który wpłaca. W ochronie zdrowia dzieje się to wybiórczo: jawne są ustawowe stawki na etacie i płace kadry kierowniczej, ale ile jedna osoba otrzymuje łącznie z kontraktów — ze wszystkich publicznych źródeł i tytułów — nie wiadomo. Nie sumuje tego ani NFZ, ani AOTMiT (tylko dane zbiorcze placówek); rejestry umów i wniosek o informację publiczną sięgają najwyżej jednego kontraktu lub placówki. Przy budżecie NFZ ponad 200 miliardów złotych to realna luka w kontroli wydatków publicznych. Uchwalona w 2026 r. nowelizacja przewiduje wprawdzie gromadzenie przez AOTMiT danych o wynagrodzeniach powiązanych z numerem PWZ, lecz wyłącznie na potrzeby niejawnych analiz — niniejsza petycja dotyczy odrębnej decyzji ustawodawcy: uczynienia tych danych jawnymi.

Sama suma jednak nie wystarczy — dopiero rozbicie na podmiot, formę i wymiar godzin poddaje ten wydatek realnej kontroli, ujawniając choćby godziny rozliczane w kilku miejscach naraz lub przekraczające liczbę godzin w dobie. Ewidencja czasu pracy i dyżurów jest przy tym prowadzona przez podmioty lecznicze niezależnie od formy współpracy — potrzebne dane w znacznej mierze już istnieją i wymagają jedynie zestawienia. Dlatego rejestr musi być jawny, zsumowany per osoba i przeszukiwalny. Rejestr obejmuje lekarzy, bo to u nich publiczny pieniądz najczęściej rozprasza się na wiele równoległych kontraktów w różnych podmiotach — i tam najtrudniej złożyć jego sumę. Zasada pozostaje jednak uniwersalna: jawność należy się każdemu wydatkowi ze środków publicznych, a lekarze są jej pierwszym, najpilniejszym zastosowaniem, nie grupą wybraną wybiórczo. Na przejrzystości pieniądza publicznego zyskują pacjenci i samo środowisko lekarskie, któremu jawność daje jasne reguły zamiast zbiorowego podejrzenia.

Oparcie rejestru na jawnym już numerze PWZ ogranicza ujawnienie do proporcjonalnego minimum: tylko kwota ze środków publicznych, bez adresu, numeru PESEL i dochodów prywatnych. To standard znany z jawnych płac w administracji i oświadczeń majątkowych — ochrona danych osobowych nie stoi mu na przeszkodzie, gdy ujawnia je ustawa w interesie publicznym.

Oświadczenia
Petycja jest składana w interesie publicznym (art. 2 ust. 2 pkt 1 ustawy o petycjach).
Oświadczam, że nie wyrażam zgody na ujawnienie moich danych osobowych (imienia i nazwiska) na stronie internetowej podmiotu rozpatrującego petycję (art. 4 ust. 3 ustawy o petycjach).

Z poważaniem,
{{IMIE}}
{{MIEJSCOWOSC}}

———
Petycję przygotowano w ramach obywatelskiej inicjatywy ZarobkiLekarzy.pl (kontakt: kontakt@zarobkilekarzy.pl). Wnoszącym petycję i stroną postępowania pozostaje wyłącznie osoba podpisana powyżej; inicjatywa jedynie udostępnia gotowy wzór.`;

// Brzmienie linii „Adres do korespondencji” per kanał wysyłki. Status e-maila jako
// „adresu do korespondencji” jest w doktrynie nierozstrzygnięty, więc treść desygnuje
// go wprost; wydruk dostaje pole do odręcznego uzupełnienia. Obiekt serializowalny —
// trafia też do define:vars generatora na /petycja.
export const KORESPONDENCJA = {
  elektroniczny: 'adres elektroniczny, z którego wniesiono niniejszą petycję',
  druk: '……………………………………………………………… (uzupełnij odręcznie)',
} as const;

// Adresaci (do kart wysyłki i instrukcji). Petycję można złożyć do jednego lub obu.
// `blok` = linie adresowe do nagłówka WYDRUKU (bez dopisków kopertowych).
export const ADRESACI = {
  mz: {
    nazwa: 'Ministerstwo Zdrowia',
    email: 'kancelaria@mz.gov.pl',
    adres: 'Minister Zdrowia, Ministerstwo Zdrowia, ul. Miodowa 15, 00-952 Warszawa',
    blok: ['Minister Zdrowia', 'Ministerstwo Zdrowia', 'ul. Miodowa 15, 00-952 Warszawa'],
  },
  senat: {
    nazwa: 'Kancelaria Senatu',
    adres: 'Kancelaria Senatu, ul. Wiejska 6/8, 00-902 Warszawa (dopisek „Petycja”)',
    blok: [
      'Marszałek Senatu Rzeczypospolitej Polskiej',
      'Kancelaria Senatu',
      'ul. Wiejska 6/8, 00-902 Warszawa',
    ],
  },
} as const;

// Podmiana tokenów wg kanału wysyłki. Kanał 'elektroniczny' (domyślny — wsteczna
// zgodność z dotychczasowymi wywołaniami): puste pola → widoczne placeholdery do
// uzupełnienia na stronie. Kanał 'druk': puste pola → kropkowane linie do odręcznego
// wypełnienia (świadoma funkcja „pustego formularza do wydruku”).
export function fillPetycja(
  imie?: string,
  miejscowosc?: string,
  kanal: 'elektroniczny' | 'druk' = 'elektroniczny'
): string {
  const kropki = '…………………………………………';
  const i = (imie || '').trim() || (kanal === 'druk' ? kropki : '[Imię i nazwisko]');
  const m = (miejscowosc || '').trim() || (kanal === 'druk' ? kropki : '[miejscowość]');
  return PETYCJA_TRESC.replace(/\{\{IMIE\}\}/g, i)
    .replace(/\{\{MIEJSCOWOSC\}\}/g, m)
    .replace(/\{\{ADRES_KORESPONDENCJI\}\}/g, KORESPONDENCJA[kanal]);
}
