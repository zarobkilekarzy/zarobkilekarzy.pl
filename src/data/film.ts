/**
 * Filmy serwisu. „Brak odczytu” (49 s) — strona główna (components/home/Film.astro) i /media/;
 * „Doba” (2 min 37 s) — /media/ i wpis w aktualnościach. Lista `films` = kolejność na /media/.
 * Pliki leżą w public/film/ („Doba” w public/film/doba/, także pion do pobrania): MP4 (Chrome, Firefox, pobieranie), ten sam film pocięty na HLS
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

export interface FilmData {
  title: string;
  /** opis nad filmem na /media/ */
  lead: string;
  src: string;
  /** lista odtwarzania HLS (kawałki po 4 s, fMP4) */
  hls: string;
  /** pierwsza klatka filmu */
  poster: string;
  /** nazwa pliku przy pobieraniu */
  download: string;
  width: number;
  height: number;
  seconds: number;
  size: string;
  /** ta sama treść w pionie 9:16 (TikTok, Shorts, relacje) — tylko do pobrania, bez odtwarzacza i HLS */
  vertical?: { src: string; download: string; width: number; height: number; size: string };
  transcript: FilmBeat[];
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

export const film: FilmData = {
  title: 'Brak odczytu',
  lead: '49 sekund, z lektorem i dźwiękiem monitora pracy serca. Jeden rezydent, cztery szpitale i suma, której żaden rejestr nie zsumował.',
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
  ],
};

/** Pozostałe źródła „Doby” — te same adresy co w tekstach serwisu */
const DOBA = {
  druk3157: 'https://api.sejm.gov.pl/sejm/term10/processes/3157',
  dlug: 'https://www.rp.pl/ochrona-zdrowia/art44638431-rosnie-zadluzenie-publicznych-szpitali-to-juz-34-mld-zlotych',
  udl: 'https://api.sejm.gov.pl/eli/acts/DU/2026/156/text.pdf',
  /** 73,16% podaje tekst z 27.05.2026 (por. kontrakt-vs-etat.mdx) */
  aotmit73: 'https://www.rp.pl/ochrona-zdrowia/art44466691-625-lekarzy-w-polsce-zarabia-powyzej-100-tys-zl-dotarlismy-do-wyliczen',
  ustawa972: 'https://api.sejm.gov.pl/eli/acts/DU/2026/972/text.pdf',
};

/**
 * Model z „Doby”: roczne kwoty brutto trzech umów jednego lekarza (procent od procedur liczony od razu
 * za rok — średnio ok. 33 tys. zł miesięcznie) i godziny, które każda umowa rozlicza w tej samej dobie.
 * Te same liczby mówi lektor; infografika filmu (lib/infografiki/zestawy.ts) liczy z tego obiektu.
 */
export const DOBA_MODEL = { etat: 240_000, kontrakt: 399_999, ucp: 360_000, hours: 24 } as const;

/**
 * Film „Doba” (2 min 37 s): jeden lekarz z trzema umowami — 999 999 zł w roku i 72 godziny w jednej
 * dobie. Lekarz jest przykładem modelowym; mechanizmy ilustrują prawdziwe sprawy. Kod filmu, lektor
 * i scenariusz: social/film-doba/ (poza repo) — po zmianie lektora poprawić `transcript` ręcznie.
 */
export const filmDoba: FilmData = {
  title: 'Doba',
  lead: '2 min 37 s, z lektorem. Jeden lekarz, trzy umowy: 999 999 zł w roku i 72 godziny w jednej dobie. Lekarz jest przykładem modelowym, a każdy mechanizm ilustruje prawdziwa sprawa.',
  src: '/film/doba/doba.mp4',
  hls: '/film/doba/hls/doba.m3u8',
  poster: '/film/doba/doba.webp',
  download: 'zarobkilekarzy-doba.mp4',
  width: 1920,
  height: 1080,
  seconds: 157,
  size: '25,4 MB',
  vertical: { src: '/film/doba/doba-pion.mp4', download: 'zarobkilekarzy-doba-pion.mp4', width: 1080, height: 1920, size: '22,5 MB' },
  transcript: [
    {
      text: 'Ten lekarz ma etat za 20 tys. zł miesięcznie. Tyle widać na pasku. Ale to tylko jedna z trzech umów.',
      note: 'Lekarz z filmu to przykład modelowy: nie istnieje, ale każda z jego umów jest zgodna z obowiązującymi przepisami. Wszystkie kwoty brutto.',
      sources: [],
    },
    {
      text: 'W drugim szpitalu ma kontrakt. Dostaje procent od każdej wykonanej procedury. Przez rok to prawie 400 tys. zł. Do tego umowa cywilnoprawna: 30 tys. zł miesięcznie.',
      note: 'Płaca liczona jako procent od procedur rozliczanych z NFZ jest dziś dozwolona. Sejm uchwalił jej zakaz 22.10.2026 r.; ustawa czeka na Senat i prezydenta.',
      sources: [{ label: 'Sejm, druk nr 3157 — przebieg prac', href: DOBA.druk3157 }],
      more: { label: 'Limity płac medyków', href: '/analizy/limity-wynagrodzen-medykow/' },
    },
    {
      text: 'Policzmy cały rok. Etat: 240 tys. Kontrakt: prawie 400. Umowa cywilnoprawna: 360. Razem: 999 999 zł. Do miliona brakuje złotówki. Formalnie nie jest „milionerem”.',
      note: '240 000 + 399 999 + 360 000 zł. Procent od procedur zmienia się co miesiąc — średnio ok. 33 tys. zł.',
      sources: [],
    },
    {
      text: 'A tej sumy nie widzi nikt. Każde z trzech miejsc zna tylko swoją umowę.',
      sources: [],
    },
    {
      text: 'To był przykład modelowy. W prawdziwej sprawie z Białegostoku lekarz dostał za jeden rok prawie 3 mln zł. Szpital tłumaczył to procentem od procedur.',
      note: 'Wynagrodzenie za 2024 r. w Białostockim Centrum Onkologii; kwotę ujawnił audyt urzędu marszałkowskiego.',
      sources: [{ label: 'Kurier Poranny', href: REKORDY.poranny }],
      more: { label: 'Rekordy wynagrodzeń', href: '/dane/rekordy/' },
    },
    {
      text: 'Wszystko to jest legalne. I płaci za to ta sama kasa, z której leczy się pacjentów. Szpitale publiczne mają już 34 mld zł długu. System, który nie widzi własnych kosztów, nie wie, ile jeszcze udźwignie.',
      note: 'Zobowiązania 562 publicznych szpitali na koniec 2025 r.: SPZOZ 27 mld, spółki 4,1 mld, instytuty 2,9 mld zł.',
      sources: [{ label: 'Rzeczpospolita', href: DOBA.dlug }],
      more: { label: 'Zadłużenie szpitali', href: '/dane/zadluzenie-szpitali/' },
    },
    {
      text: 'Teraz czas. Dzień na etacie i dyżur po nim to pełna doba. W tej samej dobie: dyżur na kontrakcie i dyżur w karetce. Na każdej umowie rozlicza 24 godziny. Razem 72. W jednej dobie. Trzecia w nocy. Według grafików jest w trzech miejscach naraz. A gdzie znajdzie go pacjent?',
      note: 'Etat 7 h 35 min i dyżur medyczny 16 h 25 min; czas dyżuru wlicza się do czasu pracy (art. 95 ustawy o działalności leczniczej).',
      sources: [{ label: 'Ustawa o działalności leczniczej, t.j. Dz.U. 2026 poz. 156', href: DOBA.udl }],
    },
    {
      text: 'Według doniesień w Braniewie lekarz rozliczał właśnie takie doby.',
      note: 'W 2024 r. 11 577 godzin, przy 8760 godzinach w roku. Śledztwo dotyczy byłego prezesa spółki prowadzącej szpital, nie lekarza; zawieszone, bez zarzutów.',
      sources: [
        { label: 'Interia', href: REKORDY.interiaBraniewo },
        { label: 'Dziennik Elbląski', href: REKORDY.deBraniewo },
        { label: 'Prokuratura Rejonowa w Elblągu', href: REKORDY.prokElblag },
      ],
      more: { label: 'Rekordy wynagrodzeń', href: '/dane/rekordy/' },
    },
    {
      text: 'Każde z tych miejsc widzi tylko swoje godziny. Całości nie widzi nikt. Na umowach cywilnoprawnych pracuje 73% lekarzy specjalistów. Ich godzin nie sumuje żaden rejestr.',
      note: 'Dokładnie 73,16% specjalistów rozlicza się na kontrakcie B2B albo zleceniu (dane AOTMiT).',
      sources: [{ label: 'Rzeczpospolita, dane AOTMiT', href: DOBA.aotmit73 }],
      more: { label: 'Kontrakt czy etat', href: '/mechanizmy/kontrakt-vs-etat/' },
    },
    {
      text: 'Państwo już wie, gdzie kto pracuje. GUS co roku łączy rejestr lekarzy z danymi ZUS i umowami NFZ. Kwot jednej osoby nikt nie sumuje.',
      sources: [{ label: 'GUS, zasoby kadrowe w zawodach medycznych', href: BRAKI.gus2024 }],
    },
    {
      text: 'Ustawa z czerwca pozwala ministrowi o te kwoty zapytać. Nie każe ich publikować ani zbierać regularnie. Dlatego potrzebna jest nowelizacja.',
      note: 'Ustawa z 19 czerwca 2026 r.: dane przekazuje się „na wniosek ministra”, „w terminie i w sposób przez niego wskazany”. O publikacji nie ma w niej ani słowa.',
      sources: [{ label: 'Dz.U. 2026 poz. 972', href: DOBA.ustawa972 }],
      more: { label: 'Projekt nowelizacji', href: '/postulat/projekt-ustawy/' },
    },
    {
      text: 'Wystarczy, żeby kwoty jednej osoby sumowały się w jednym miejscu. Pod stałym identyfikatorem, bez nazwiska. Jedna osoba. Jedna suma. Anonimowo. zarobkilekarzy.pl',
      sources: [],
      more: { label: 'Postulat', href: '/postulat/' },
    },
  ],
};

/** kolejność na /media/: od najnowszego */
export const films: FilmData[] = [filmDoba, film];
