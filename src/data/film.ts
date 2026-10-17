/**
 * Film „Brak odczytu” (49 s, z lektorem) — strona główna (components/home/Film.astro) i /media/.
 * Pliki leżą w public/film/: MP4 (Chrome, Firefox, pobieranie), ten sam film pocięty na HLS
 * w hls/ (Safari, także na iOS) i okładka. HLS jest potrzebny, bo statyczne pliki Workera
 * ignorują nagłówek Range, a Safari bez odpowiedzi 206 nie odtwarza MP4 — kawałki HLS pobiera
 * w całości. Odtwarzacz podaje HLS jako pierwsze źródło; przeglądarki bez HLS biorą MP4.
 * `transcript` to słowa lektora (liczby cyframi) pogrupowane po tematach, ze źródłami, a `note` —
 * zastrzeżenia, które w filmie stoją w stopce kadru: opis dla czytników ekranu i miejsce, gdzie
 * każda liczba ma link (stopki w kadrze są za drobne, żeby je przeczytać na telefonie). Tekst
 * trzyma stan z filmu (monitoring: 12.10.2026), więc nie liczy się z bieżących danych — po zmianie
 * filmu albo lektora (social/film-brak-odczytu/lektor.mjs) poprawić go ręcznie.
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
  /** słowa lektora */
  text: string;
  /** zastrzeżenie albo doprecyzowanie spoza lektora (w filmie: stopka kadru) */
  note?: string;
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
  /** lista odtwarzania HLS (kawałki po 4 s, fMP4) */
  hls: '/film/hls/brak-odczytu.m3u8',
  /** pierwsza klatka filmu */
  poster: '/film/brak-odczytu.webp',
  /** nazwa pliku przy pobieraniu */
  download: 'zarobkilekarzy-brak-odczytu.mp4',
  width: 1920,
  height: 1080,
  seconds: 49,
  size: '5,7 MB',
  transcript: [
    {
      text: '1,6 mln zł w jeden rok. Tyle zarobił rezydent bez specjalizacji. W czterech szpitalach naraz. W jednym z nich rozliczał ponad 300 godzin miesięcznie.',
      note: 'Dane za 2025 r. W tym jednym szpitalu średnio 331 godzin w miesiącu; pełny etat to ok. 168. Sprawę badają prokuratura i izba lekarska.',
      sources: REZYDENT,
      more: { label: 'Cała sprawa: wieloetatowość', href: '/mechanizmy/wieloetatowosc/' },
    },
    {
      text: 'I żaden rejestr tego nie zsumował.',
      note: 'AOTMiT nie ma danych łączonych dla jednej osoby między placówkami.',
      sources: [{ label: 'Rynek Zdrowia, wywiad z prezesem AOTMiT', href: ROZKLAD.wywiad }],
    },
    {
      text: 'Najwyższy kontrakt w szpitalach wojewódzkich Mazowsza: 316 tys. zł miesięcznie. Ponad trzy razy więcej niż najwyższa pensja na etacie.',
      note: 'Dane za 2025 r.: kontrakt 316 079 zł (umowa została rozwiązana), najwyższa pensja na etacie 101 384 zł.',
      sources: [{ label: 'Rynek Zdrowia', href: REKORDY.rzMazowsze }],
    },
    {
      text: 'Ilu lekarzy zarabia ponad 100 tys. zł miesięcznie? Licząc każdy szpital osobno, około 560. Po zsumowaniu: szacunkowo od 7 do 14 tys. Dokładnej liczby nie zna nikt.',
      note: 'Szacunek prezesa AOTMiT: 5–10% lekarzy; liczbę osób wyliczył Rynek Zdrowia przy 140 tys. aktywnych lekarzy.',
      sources: [
        { label: 'Rynek Zdrowia, wywiad z prezesem AOTMiT', href: ROZKLAD.wywiad },
        { label: 'Rynek Zdrowia, przeliczenie na osoby', href: ROZKLAD.milion },
      ],
      more: { label: 'Rozkład wynagrodzeń', href: '/dane/rozklad-wynagrodzen/' },
    },
    {
      text: 'O płace zapytano ponad 1300 placówek. Dane ujawniło 175.',
      note: 'Pytała Sieć Obywatelska Watchdog Polska, o płace lekarzy za 2025 r.: 1358 placówek, 359 odmówiło, 469 nie odpowiedziało (stan na 12.10.2026).',
      sources: [{ label: 'Watchdog Polska, monitoring „Ile zarabiają lekarze?”', href: monitoring.source.url }],
      more: { label: 'Przeglądarka monitoringu', href: '/dane/monitoring-watchdog/' },
    },
    {
      text: 'Tymczasem państwo co roku łączy dane lekarzy z kilku rejestrów. Brakuje tylko kwoty.',
      note: 'GUS łączy rejestr lekarzy z danymi ZUS i umowami NFZ — wie, kto i gdzie pracuje, ale nie zbiera kwot.',
      sources: [{ label: 'GUS, zasoby kadrowe w zawodach medycznych', href: BRAKI.gus2024 }],
    },
    {
      text: 'Jawne kwoty. Chronione nazwiska.',
      sources: [],
      more: { label: 'Postulat', href: '/postulat/' },
    },
  ] satisfies FilmBeat[],
};
