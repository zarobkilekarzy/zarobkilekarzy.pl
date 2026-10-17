/**
 * Treść strony /prawa-pacjenta/sor/ — kolejki na SOR: jak działa kolejka i czego dane nie mówią.
 * Każdy punkt ma podstawę (przepis albo dokument) — pokazywaną pod tekstem i zebraną w `sources`.
 * Liczby z własnego przeglądu (17.10.2026, 01:28) są opisane datą; mapa pod spodem liczy się na żywo.
 */
import type { Source } from '@/types';

const isap = (year: number, pos: number) => `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU${year}${String(pos).padStart(7, '0')}`;

export const NIK_REPORT = 'https://www.nik.gov.pl/kontrole/wyniki-kontroli-nik/pobierz,kzd~p_25_042_202505211032541747816374~01,typ,kk.pdf';
export const MZ_REPLY = 'https://sejm.gov.pl/sejm10.nsf/interpelacjaTresc.xsp?key=DWPJ8J';

export const page = {
  title: 'Kolejki na SOR',
  seoTitle: 'Kolejki na SOR na żywo',
  lead: 'Ile osób czeka teraz na lekarza w każdym szpitalnym oddziale ratunkowym i czy czas oczekiwania mieści się w normie. Pod mapą: jak działa kolejka na SOR i czego te dane nie mówią.',
  description: 'Mapa szpitalnych oddziałów ratunkowych odświeżana co 10 minut: ile osób czeka na lekarza i czy w normie. Jak działa triaż i czego dane nie mówią.',
  emergency: 'Zagrożenie życia? Dzwoń pod 112 — nie sprawdzaj kolejek.',
  checked: new Date('2026-10-17'),
};

export interface Step {
  title: string;
  text: string;
  /** podstawa: przepis albo dokument */
  basis?: string;
  link?: { href: string; label: string };
  /** tabela norm czasu pod tekstem */
  norms?: boolean;
}

export const steps: Step[] = [
  {
    title: 'O kolejności decyduje stan zdrowia, nie godzina przyjazdu',
    text: 'Po wejściu pobierasz bilet. Pielęgniarka, ratownik medyczny albo lekarz przeprowadza segregację medyczną — triaż — i przydziela jedną z pięciu kategorii pilności. Pacjent w poważniejszym stanie wejdzie przed Tobą, nawet jeśli przyjechał później.',
    basis: 'ustawa o Państwowym Ratownictwie Medycznym, art. 33a ust. 1–2 · rozporządzenie w sprawie SOR, § 6 ust. 7 i 9',
  },
  {
    title: 'Każda kategoria ma najdłuższy dopuszczalny czas do lekarza',
    text: 'W systemie TOPSOR i na mapie kategorie nazywają się priorytetami: od najwyższego (czerwona) do najniższego (niebieska).',
    basis: 'rozporządzenie w sprawie SOR, § 6 ust. 9 · NIK, „System ratownictwa medycznego”, s. 78, przypis 107',
    norms: true,
  },
  {
    title: 'Masz prawo wiedzieć, na czym stoisz',
    text: 'Po triażu personel ma Ci podać przydzieloną kategorię, liczbę osób przed Tobą i najdłuższy przewidywany czas oczekiwania. Swój indywidualny czas powinien pokazać automat biletowy po zeskanowaniu kodu z biletu.',
    basis: 'rozporządzenie w sprawie SOR, § 6 ust. 10 · rozporządzenie o TOPSOR, § 2 pkt 5–6',
  },
  {
    title: 'Podczas czekania stan pacjenta jest oceniany na nowo',
    text: 'Personel ocenia stan osób czekających co najmniej co 90 minut od pobrania biletu, a kategoria może się zmienić. Jeśli czujesz się gorzej, powiedz o tym od razu.',
    basis: 'rozporządzenie w sprawie SOR, § 6 ust. 14 · rozporządzenie o TOPSOR, § 2 pkt 12 lit. a',
  },
  {
    title: 'Kategoria zielona i niebieska: SOR może skierować Cię do przychodni',
    text: 'SOR może odesłać pacjenta z kategorią zieloną lub niebieską do podstawowej opieki zdrowotnej, także nocnej i świątecznej. Zasady opisuje regulamin szpitala — wywieszony przy rejestracji i opublikowany na stronie szpitala. W dziesięciu szpitalach skontrolowanych przez NIK takich pacjentów było 44,6%, ale personel rzadko ich odsyłał.',
    basis: 'rozporządzenie w sprawie SOR, § 6 ust. 11–12 · NIK, „System ratownictwa medycznego”, s. 78',
  },
  {
    title: 'Czas na tablicy to średnia dla kategorii, nie Twój czas',
    text: 'Ekrany w SOR i ta mapa pokazują średni przewidywany czas dla całej kategorii. Twój może być krótszy albo dłuższy — zależy od tego, kto przyjedzie po Tobie.',
    basis: 'rozporządzenie o TOPSOR, § 2 pkt 4 i § 3 pkt 1',
  },
  {
    title: 'Gdy coś poszło nie tak',
    text: 'Jeśli uważasz, że Twoje prawa zostały naruszone — na przykład nikt nie powiedział Ci, jak długo poczekasz — zobacz, gdzie to zgłosić.',
    link: { href: '/prawa-pacjenta/#co-sie-stalo', label: 'Prawa pacjenta: gdzie zgłosić naruszenie' },
  },
];

export interface Gap {
  title: string;
  text: string;
  basis?: string;
}

export const gaps: Gap[] = [
  {
    title: 'To czas do lekarza, nie cały pobyt',
    text: 'Mapa pokazuje oczekiwanie na pierwszy kontakt z lekarzem. Cały pobyt w SOR trwa dłużej: badania, konsultacje, obserwacja i czekanie na wyniki.',
    basis: 'Ministerstwo Zdrowia, odpowiedź na zapytanie poselskie nr 3725 (3.08.2026)',
  },
  {
    title: 'Najpilniejsze kategorie są bez pomiaru',
    text: 'Przy kategorii czerwonej portal podaje „natychmiast”, przy pomarańczowej „poniżej 10 minut” — to tekst normy, nie zmierzony czas. W przeglądzie wszystkich SOR z 17 października 2026 r. tak było w każdym z 14 i 47 przypadków, w których ktoś w tych kategoriach czekał. Z publicznych danych nie da się więc sprawdzić, czy te dwie normy są dotrzymane.',
    basis: 'pomiar zarobkilekarzy.pl, pacjent.gov.pl, 17.10.2026, 01:28',
  },
  {
    title: 'Długie czasy są ucinane — choć dokładne istnieją',
    text: 'Portal pokazuje najwyżej „powyżej 2 godzin” w kategorii żółtej, „powyżej 4 godzin” w zielonej i „powyżej 6 godzin” w niebieskiej, więc wiadomo tylko, że norma została przekroczona. Ministerstwo zna dokładne wartości: dla SOR w Toruniu podało średnie z pierwszego półrocza 2026 r. co do sekundy, na przykład 22 min 34 s w kategorii żółtej.',
    basis: 'pomiar zarobkilekarzy.pl · Ministerstwo Zdrowia, odpowiedź na zapytanie nr 3725',
  },
  {
    title: 'Kreska znaczy zero albo brak danych',
    text: 'Gdy w kategorii nikt nie czeka, portal pokazuje kreskę. Tak samo wygląda brak danych z oddziału — tych dwóch sytuacji nie da się odróżnić.',
  },
  {
    title: 'Jedna kolejka, dwa oddziały',
    text: 'Pięć par SOR ma w danych ten sam numer. Kolejka jest wtedy jedna i nie wiadomo, którego oddziału dotyczy — mapa uprzedza o tym w dymku.',
  },
  {
    title: 'Historia jest — w raportach dla ministerstwa',
    text: 'pacjent.gov.pl pokazuje tylko stan bieżący. Administrator TOPSOR, czyli NFZ, co miesiąc przekazuje Ministerstwu Zdrowia raporty, m.in. z liczbą pacjentów, średnimi czasami oczekiwania i całkowitym czasem pobytu w SOR.',
    basis: 'rozporządzenie o TOPSOR, § 5 ust. 1 pkt 16 · Ministerstwo Zdrowia, odpowiedź na zapytanie nr 3725',
  },
  {
    title: 'Od lipca 2026 bez statystyk „na potrzeby strony internetowej”',
    text: 'Do lipca 2026 r. rozporządzenie wymagało, by serwer centralny TOPSOR udostępniał statystyki „bieżące i historyczne” na potrzeby strony internetowej. Po nowelizacji przepis mówi o statystykach z danych historycznych, ale bez odniesienia do strony.',
    basis: 'rozporządzenie o TOPSOR, § 3 pkt 3 — brzmienie z 2021 r. i po zmianie Dz.U. 2026 poz. 963',
  },
  {
    title: 'Czasy w systemie bywają wpisywane po fakcie',
    text: 'NIK sprawdziła dane TOPSOR z dziesięciu szpitali: w 77,7% rekordów czas obsługi lekarskiej i czas wypisu dzieliła najwyżej minuta. Wniosek kontroli: TOPSOR nie zapewniał rzetelnych danych o czasie obsługi pacjentów przez lekarzy. Ministerstwo przyznaje, że przy najpilniejszych pacjentach dane wprowadza się niekiedy dopiero po zakończeniu czynności ratunkowych.',
    basis: 'NIK, „System ratownictwa medycznego” (KSS.430.5.2026, czerwiec 2026), s. 76 · Ministerstwo Zdrowia, odpowiedź na zapytanie nr 3725',
  },
  {
    title: 'Mapa to zdjęcie chwili',
    text: 'W nocy i w szczycie kolejki wyglądają zupełnie inaczej. Pomiary zapisujemy co 10 minut — z kilku tygodni powstanie obraz typowego obciążenia każdego SOR.',
  },
];

export const editorial = {
  title: 'Pełne czasy i dane historyczne — publicznie',
  text: 'Ministerstwo ma dokładne średnie czasy i comiesięczne raporty z TOPSOR, a pacjenci widzą tylko ucięte „teraz”. Wystarczy publikować to, co już powstaje: czasy bez ucinania, także w kategoriach czerwonej i pomarańczowej, oraz miesięczne zestawienia dla każdego oddziału. Wtedy pacjent, szpital i NFZ patrzą na te same liczby — i widać, gdzie system nie nadąża.',
};

export const sources: Source[] = [
  { publisher: 'Sejm RP (ISAP)', title: 'Ustawa o Państwowym Ratownictwie Medycznym, tekst jednolity Dz.U. 2026 poz. 141 (art. 33a)', url: isap(2026, 141) },
  { publisher: 'Sejm RP (ISAP)', title: 'Rozporządzenie Ministra Zdrowia w sprawie systemu zarządzającego trybami obsługi pacjenta w SOR, Dz.U. 2021 poz. 1182', url: isap(2021, 1182) },
  { publisher: 'Sejm RP (ISAP)', title: 'Rozporządzenie zmieniające rozporządzenie w sprawie TOPSOR, Dz.U. 2026 poz. 963', url: isap(2026, 963) },
  { publisher: 'Sejm RP (ISAP)', title: 'Rozporządzenie Ministra Zdrowia w sprawie szpitalnego oddziału ratunkowego, tekst jednolity Dz.U. 2025 poz. 1646 (§ 6)', url: isap(2025, 1646) },
  { publisher: 'Sejm RP', title: 'Odpowiedź Ministerstwa Zdrowia na zapytanie nr 3725 w sprawie SOR w Toruniu', url: MZ_REPLY, date: '3.08.2026' },
  { publisher: 'Najwyższa Izba Kontroli', title: 'Informacja o wynikach kontroli „System ratownictwa medycznego” (KSS.430.5.2026)', url: NIK_REPORT, date: 'czerwiec 2026' },
  { publisher: 'pacjent.gov.pl', title: 'Szpitalny Oddział Ratunkowy — mapa i kolejki (dane TOPSOR, administrator: NFZ)', url: 'https://pacjent.gov.pl/szpitalny-oddzial-ratunkowy-sor' },
];
