/**
 * Archiwum petycji z lipca 2026 r. (/postulat/petycja/) — pierwsza forma postulatu: rejestr imienny po PWZ.
 * Treść petycji jest dokumentem historycznym: zapisana dosłownie, z polami do uzupełnienia w nawiasach.
 * Gdy urząd odpowie, uzupełnij `answers` (data, adresat, link do odpowiedzi w BIP).
 */

export const petycja = {
  href: '/postulat/petycja/',
  launched: new Date('2026-07-13'),
  /** ustawowy termin odpowiedzi Ministerstwa Zdrowia: 3 miesiące (art. 10 ust. 1 ustawy o petycjach) */
  deadline: new Date('2026-10-13'),
  addressees: ['Minister Zdrowia', 'Senat (Komisja Petycji)'],
  subject: 'Petycja — jawny rejestr wynagrodzeń lekarzy ze środków publicznych (per PWZ)',
  /** lista petycji publikowana przez ministerstwo */
  registry: { label: 'Petycje na stronie Ministerstwa Zdrowia', href: 'https://www.gov.pl/web/zdrowie/petycje2' },
  law: { label: 'Ustawa o petycjach', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20140001195' },
  /** ostatnie sprawdzenie listy petycji MZ — zaktualizuj datę i tekst przy kolejnym sprawdzeniu */
  registryCheck: {
    date: new Date('2026-10-15'),
    text: 'Na liście petycji Ministerstwa Zdrowia nie ma jeszcze tej petycji ani odpowiedzi na nią.',
  },
  /** archiwalne wzory do druku (te same co na dawnej stronie /petycja/), w public/postulat/petycja/ */
  pdfs: [
    { label: 'Wzór do Ministra Zdrowia', href: '/postulat/petycja/petycja-ministerstwo-zdrowia.pdf', pages: 2 },
    { label: 'Wzór do Senatu', href: '/postulat/petycja/petycja-senat.pdf', pages: 2 },
  ],
};

/** Oficjalne odpowiedzi na petycję — puste, dopóki żadnej nie opublikujemy. */
export const answers: { date: Date; from: string; text: string; href?: string }[] = [];

/**
 * Odpowiedź MZ na podobną petycję innej osoby (2 lipca 2026) — pokazuje stanowisko resortu w sprawie danych
 * o wynagrodzeniach. To NIE jest odpowiedź na naszą petycję. PDF bez zmian, pobrany z BIP Ministerstwa Zdrowia.
 */
export const relatedAnswer = {
  title: 'Odpowiedź MZ na podobną petycję',
  petition: 'Petycja z 2 lipca 2026 r. w sprawie kontroli wynagrodzeń w szpitalach publicznych, niepublicznych, poradniach POZ i AOS',
  petitionNote: 'Złożyła ją inna osoba po doniesieniach o Szpitalu Południowym. Prosiła o kontrolę wynagrodzeń, nie o ich jawność.',
  date: new Date('2026-09-07'),
  from: 'Ministerstwo Zdrowia, Departament Dialogu Społecznego',
  sign: 'DSW.055.10.2026.MC',
  summary: [
    'Ministerstwo odpowiada, że od 5 sierpnia 2026 r. obowiązuje ustawa z 19 czerwca 2026 r. (Dz. U. poz. 972). Daje ona ministrowi zdrowia, NFZ i AOTMiT prawo do zbierania danych o zatrudnieniu i wynagrodzeniach pracowników podmiotów leczniczych, powiązanych z numerem PESEL lub PWZ, a AOTMiT — zadanie ich analizy dla ministra.',
    'Wniosek resortu: ustawodawca „wprowadził już instrumenty prawne” do pozyskiwania i analizowania tych informacji.',
  ],
  comment: 'O publikacji danych odpowiedź nie mówi nic. Instrumenty, o których pisze ministerstwo, służą analizom dla ministra, a jawności nie przewidują. Tę lukę ma zamknąć nasz projekt ustawy.',
  pdf: { href: '/postulat/petycja/odpowiedz-mz-2026-09-07.pdf', pages: 1 },
  source: {
    label: 'Petycja i odpowiedź w BIP MZ',
    href: 'https://www.gov.pl/web/zdrowie/petycja-z-2-lipca-2026-r-w-sprawie-kontroli-wynagrodzen-w-szpitalach-publicznych-niepublicznych-poradniach-poz-i-aos',
  },
};

/** Treść petycji — dosłownie, tak jak ją wysyłano. */
export const petitionText = {
  title: 'Petycja',
  subject:
    'w sprawie utworzenia jawnego, przeszukiwalnego rejestru wynagrodzeń wypłacanych ze środków publicznych osobom wykonującym zawód lekarza, powiązanego z numerem prawa wykonywania zawodu (PWZ).',
  sender: ['Wnoszący petycję: [Imię i nazwisko], [miejscowość]', 'Adres do korespondencji: adres elektroniczny, z którego wniesiono niniejszą petycję'],
  basis:
    'Na podstawie art. 63 Konstytucji Rzeczypospolitej Polskiej oraz art. 2 ustawy z dnia 11 lipca 2014 r. o petycjach, działając w interesie publicznym, wnoszę o podjęcie działań na rzecz:',
  demands: [
    'utworzenia jawnego, ogólnodostępnego rejestru, który dla każdej osoby wykonującej zawód lekarza i lekarza dentysty — identyfikowanej jawnym numerem prawa wykonywania zawodu (PWZ) — wykazuje łączną roczną kwotę brutto otrzymaną ze środków Narodowego Funduszu Zdrowia; docelowo rejestr powinien obejmować także pozostałe środki publiczne (budżet państwa, publiczne podmioty lecznicze, uczelnie medyczne);',
    'wykazywania tej kwoty w rozbiciu na poszczególne strumienie — podmiot wypłacający, formę współpracy (umowa o pracę, kontrakt, umowa cywilnoprawna), tytuł wypłaty (świadczenia, dyżur, gotowość, funkcja) oraz, o ile jest ewidencjonowany, odpowiadający im wymiar godzin — tak, aby widoczna była zarówno suma, jak i jej struktura; przy formach typu B2B rejestr wykazuje przychód brutto przed kosztami i podatkami, odzwierciedlając wydatek publiczny, a nie dochód osobisty;',
    'publikowania rejestru jako otwarte dane — z możliwością wyszukiwania po numerze PWZ i po podmiocie oraz pobrania całości;',
    'ograniczenia zakresu danych wyłącznie do roli zawodowej i kwoty ze środków publicznych, z wyłączeniem danych prywatnych (adresu zamieszkania, numeru PESEL, dochodów ze źródeł niepublicznych).',
  ],
  closing: 'Zwracam się o powyższe stosownie do kompetencji adresata — w tym, o ile to konieczne, w drodze inicjatywy ustawodawczej.',
  justification: [
    'Środki publiczne podlegają jawności — obywatel ma prawo wiedzieć, jak wydawany jest pieniądz, który wpłaca. W ochronie zdrowia dzieje się to wybiórczo: jawne są ustawowe stawki na etacie i płace kadry kierowniczej, ale ile jedna osoba otrzymuje łącznie z kontraktów — ze wszystkich publicznych źródeł i tytułów — nie wiadomo. Nie sumuje tego ani NFZ, ani AOTMiT (tylko dane zbiorcze placówek); rejestry umów i wniosek o informację publiczną sięgają najwyżej jednego kontraktu lub placówki. Przy budżecie NFZ ponad 200 miliardów złotych to realna luka w kontroli wydatków publicznych. Uchwalona w 2026 r. nowelizacja przewiduje wprawdzie gromadzenie przez AOTMiT danych o wynagrodzeniach powiązanych z numerem PWZ, lecz wyłącznie na potrzeby niejawnych analiz — niniejsza petycja dotyczy odrębnej decyzji ustawodawcy: uczynienia tych danych jawnymi.',
    'Sama suma jednak nie wystarczy — dopiero rozbicie na podmiot, formę i wymiar godzin poddaje ten wydatek realnej kontroli, ujawniając choćby godziny rozliczane w kilku miejscach naraz lub przekraczające liczbę godzin w dobie. Ewidencja czasu pracy i dyżurów jest przy tym prowadzona przez podmioty lecznicze niezależnie od formy współpracy — potrzebne dane w znacznej mierze już istnieją i wymagają jedynie zestawienia. Dlatego rejestr musi być jawny, zsumowany per osoba i przeszukiwalny. Rejestr obejmuje lekarzy, bo to u nich publiczny pieniądz najczęściej rozprasza się na wiele równoległych kontraktów w różnych podmiotach — i tam najtrudniej złożyć jego sumę. Zasada pozostaje jednak uniwersalna: jawność należy się każdemu wydatkowi ze środków publicznych, a lekarze są jej pierwszym, najpilniejszym zastosowaniem, nie grupą wybraną wybiórczo. Na przejrzystości pieniądza publicznego zyskują pacjenci i samo środowisko lekarskie, któremu jawność daje jasne reguły zamiast zbiorowego podejrzenia.',
    'Oparcie rejestru na jawnym już numerze PWZ ogranicza ujawnienie do proporcjonalnego minimum: tylko kwota ze środków publicznych, bez adresu, numeru PESEL i dochodów prywatnych. To standard znany z jawnych płac w administracji i oświadczeń majątkowych — ochrona danych osobowych nie stoi mu na przeszkodzie, gdy ujawnia je ustawa w interesie publicznym.',
  ],
  statements: [
    'Petycja jest składana w interesie publicznym (art. 2 ust. 2 pkt 1 ustawy o petycjach).',
    'Oświadczam, że nie wyrażam zgody na ujawnienie moich danych osobowych (imienia i nazwiska) na stronie internetowej podmiotu rozpatrującego petycję (art. 4 ust. 3 ustawy o petycjach).',
  ],
  signature: ['Z poważaniem,', '[Imię i nazwisko]', '[miejscowość]'],
  footer:
    'Petycję przygotowano w ramach obywatelskiej inicjatywy ZarobkiLekarzy.pl. Wnoszącym petycję i stroną postępowania pozostaje wyłącznie osoba podpisana powyżej; inicjatywa jedynie udostępnia gotowy wzór.',
};
