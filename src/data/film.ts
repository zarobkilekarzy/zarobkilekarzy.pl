/**
 * Film „Brak odczytu” (ok. 40 s) — strona główna (components/home/Film.astro) i /media/.
 * Plik i okładka leżą w public/film/. `transcript` to napisy z filmu ujęcie po ujęciu ze źródłami:
 * opis dla czytników ekranu i miejsce, gdzie każda liczba z filmu ma link — stopki w kadrze są
 * za drobne, żeby je przeczytać na telefonie. Tekst trzyma stan z filmu (monitoring: 12.10.2026),
 * więc nie liczy się z bieżących danych — po zmianie filmu poprawić go ręcznie.
 */
import { LINKS as REKORDY } from '@/data/rekordy';
import { LINKS as ROZKLAD } from '@/data/rozklad-wynagrodzen';
import { LINKS as BRAKI } from '@/data/dlaczego-brakuje-lekarzy';
import { monitoring } from '@/lib/monitoring';

export interface FilmSource {
  label: string;
  href: string;
}

export interface FilmBeat {
  text: string;
  sources: FilmSource[];
  /** strona serwisu, na której temat jest opisany szerzej */
  more?: FilmSource;
}

/** Sprawa warszawskiego rezydenta — te same źródła co w /mechanizmy/wieloetatowosc/ */
const REZYDENT: FilmSource[] = [
  { label: 'TVN Warszawa', href: 'https://tvn24.pl/tvnwarszawa/ursynow/warszawa-lekarz-radny-zarobil-1-6-miliona-kontrola-w-szpitalu-i-interwencja-naczelnej-izby-lekarskiej-st9096506' },
  { label: 'Rynek Zdrowia', href: 'https://www.rynekzdrowia.pl/Finanse-i-zarzadzanie/28-letni-lekarz-milioner-na-celowniku-Izby-Lekarskiej-Mial-pracowac-srednio-331-godzin-miesiecznie,285455,1.html' },
  { label: 'Polsat News', href: 'https://www.polsatnews.pl/wiadomosc/2026-06-15/16-mln-zl-w-rok-dla-lekarza-bez-specjalizacji-warszawa-zapowiada-kontrole/' },
];

export const film = {
  title: 'Brak odczytu',
  src: '/film/brak-odczytu.mp4',
  /** pierwsza klatka filmu */
  poster: '/film/brak-odczytu.webp',
  /** nazwa pliku przy pobieraniu */
  download: 'zarobkilekarzy-brak-odczytu.mp4',
  width: 1920,
  height: 1080,
  seconds: 40,
  size: '3,7 MB',
  transcript: [
    {
      text: 'Jeden lekarz, 2025 r.: ponad 1,6 mln zł w jeden rok. Rezydent bez ukończonej specjalizacji, cztery publiczne szpitale naraz. W jednym z nich średnio 331 godzin w miesiącu, a pełny etat to ok. 168. Sprawę badają prokuratura i izba lekarska.',
      sources: REZYDENT,
      more: { label: 'Cała sprawa: wieloetatowość', href: '/mechanizmy/wieloetatowosc/' },
    },
    {
      text: 'Żaden rejestr tego nie zsumował: AOTMiT nie ma danych łączonych dla jednej osoby między placówkami.',
      sources: [{ label: 'Rynek Zdrowia, wywiad z prezesem AOTMiT', href: ROZKLAD.wywiad }],
    },
    {
      text: 'Najwyższy kontrakt w szpitalach wojewódzkich Mazowsza w 2025 r.: 316 079 zł miesięcznie (umowa została rozwiązana). To 3,1 raza tyle co najwyższa pensja na etacie, 101 384 zł.',
      sources: [{ label: 'Rynek Zdrowia', href: REKORDY.rzMazowsze }],
    },
    {
      text: 'Szpital powiatowy, 2024 r.: faktury jednego lekarza na 11 577 godzin, a rok ma 8760. Czas pracy ewidencjonuje się tylko pracownikom na etacie. Śledztwo dotyczy byłego prezesa spółki prowadzącej szpital, nie lekarza; jest zawieszone, nikt nie usłyszał zarzutów.',
      sources: [
        { label: 'Dziennik Elbląski', href: REKORDY.deBraniewo },
        { label: 'Prokuratura', href: REKORDY.prokElblag },
        { label: 'TVN24', href: REKORDY.tvnBraniewo },
      ],
    },
    {
      text: 'Ilu lekarzy dostaje ponad 100 tys. zł miesięcznie? Gdy liczyć każdy szpital osobno: ok. 560. Po zsumowaniu wszystkich miejsc pracy, według szacunku prezesa AOTMiT: 7–14 tys. Dokładnej liczby nie zna nikt.',
      sources: [
        { label: 'Rynek Zdrowia, wywiad z prezesem AOTMiT', href: ROZKLAD.wywiad },
        { label: 'Rynek Zdrowia, przeliczenie na osoby', href: ROZKLAD.milion },
      ],
      more: { label: 'Rozkład wynagrodzeń', href: '/dane/rozklad-wynagrodzen/' },
    },
    {
      text: 'Sieć Obywatelska Watchdog Polska zapytała 1358 placówek o płace lekarzy za 2025 r. Dane ujawniło 175, odmówiło 359, nie odpowiedziało 469 (stan na 12.10.2026).',
      sources: [{ label: 'Watchdog Polska, monitoring „Ile zarabiają lekarze?”', href: monitoring.source.url }],
      more: { label: 'Przeglądarka monitoringu', href: '/dane/monitoring-watchdog/' },
    },
    {
      text: 'GUS co roku łączy dane jednej osoby z rejestru lekarzy, ZUS i umów NFZ. Brakuje tylko kwoty.',
      sources: [{ label: 'GUS, zasoby kadrowe w zawodach medycznych', href: BRAKI.gus2024 }],
    },
    {
      text: 'Jawne kwoty, chronione nazwiska.',
      sources: [],
      more: { label: 'Postulat', href: '/postulat/' },
    },
  ] satisfies FilmBeat[],
};
