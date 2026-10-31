/**
 * /podcasty/ — indeks odcinków podcastu, /podcasty/<slug>/ — podstrona odcinka. Lista `episodes` = kolejność w indeksie (od najnowszego).
 * Nagrań nie trzymamy w serwisie: odcinek ma odtwarzacz YouTube (blocks/YouTube), a `youtube` i `duration`
 * uzupełnia się po publikacji filmu. Źródła: podkładka scenariusza (social/<odcinek>/scenariusz.md).
 * Okładka: ekran powitalny filmu, klatka z silnika (`eksport.mjs filmy/<odcinek> --stills 2.4`), ten sam plik to miniatura na YouTube.
 */
import type { ImageMetadata } from 'astro';
import okladkaPolEtatu from '@/assets/podcasty/pol-etatu.png';

export interface PodcastSource {
  label: string;
  href: string;
}

export interface PodcastSourceGroup {
  /** temat w kolejności rozmowy */
  title: string;
  sources: PodcastSource[];
  /** źródła bez linku (adres zawiera nazwisko albo nazwę konta) */
  note?: string;
}

export interface PodcastEpisode {
  /** adres podstrony: /podcasty/<slug>/ */
  slug: string;
  number: number;
  title: string;
  date: Date;
  /** długość filmu, np. „17:18” */
  duration: string;
  /** jedno zdanie: karta w indeksie i obrazek OG */
  summary: string;
  /** opis na podstronie odcinka */
  lead: string;
  /** stan prawny, postać fikcyjna, głosy syntetyczne */
  note: string;
  /** identyfikator filmu z adresu youtube.com/watch?v=…; do publikacji puste */
  youtube?: string;
  /** okładka odcinka w odtwarzaczu (16:9, ta sama co miniatura na YouTube) */
  cover?: ImageMetadata;
  sources: PodcastSourceGroup[];
}

export const podcastPage = {
  href: '/podcasty/',
  title: 'Podcasty',
  seoTitle: 'Podcasty o pieniądzach w ochronie zdrowia',
  lead: 'Rozmowy o pieniądzach publicznych w ochronie zdrowia i o przepisach, które o nich decydują. Podcast to forma publicystyczna: rozmówcy się spierają, a serwis mówi wprost, co uważa. Źródła są przy każdym odcinku.',
  description: 'Odcinki podcastu zarobkilekarzy.pl na YouTube, ze źródłami: rozmowy o pieniądzach publicznych w ochronie zdrowia.',
};

export const episodeHref = (ep: PodcastEpisode) => `${podcastPage.href}${ep.slug}/`;

const LIMITY: PodcastSource = { label: 'zarobkilekarzy.pl: Limity płac medyków', href: '/analizy/limity-wynagrodzen-medykow/' };
const DRUK_SENAT: PodcastSource = { label: 'Druk senacki nr 893, art. 132aa', href: 'https://www.senat.gov.pl/download/gfx/senat/pl/senatdruki/14799/druk/893.pdf' };
const DRUK_SEJM: PodcastSource = { label: 'Druk sejmowy nr 3157: raport z konsultacji i ocena skutków regulacji', href: 'https://api.sejm.gov.pl/sejm/term10/prints/3157/3157.pdf' };
const KOMISJA: PodcastSource = { label: 'Komisja Zdrowia, 7.10.2026', href: 'https://api.sejm.gov.pl/sejm/term10/committees/ZDR/sittings/166/pdf' };
const GUS: PodcastSource = { label: 'GUS: Zasoby kadrowe w wybranych zawodach medycznych w 2024 r.', href: 'https://stat.gov.pl/obszary-tematyczne/zdrowie/zdrowie/zasoby-kadrowe-w-wybranych-zawodach-medycznych-na-podstawie-zrodel-administracyjnych-w-2024-r-,28,4.html' };

export const episodes: PodcastEpisode[] = [
  {
    slug: 'pol-etatu',
    number: 1,
    title: 'Pół etatu: kogo to naprawdę boli',
    date: new Date('2026-10-31'),
    duration: '15:00',
    summary: 'Czego przepis nie obejmuje, gdzie krytycy mają rację i czego nikt nie policzył.',
    lead: 'Sejm uchwalił wymóg co najmniej pół etatu w szpitalach i poradniach przyszpitalnych, a ustawą zajmuje się teraz Senat. Serwis rozmawia z Darkiem, anestezjologiem dyżurującym w szpitalu powiatowym: czego przepis nie obejmuje, gdzie krytycy mają rację i czego nikt nie policzył.',
    note: 'Stan prawny: 31.10.2026 (druk senacki nr 893). Darek jest postacią fikcyjną i mówi argumentami, które naprawdę padły w tym sporze. Głosy są syntetyczne.',
    cover: okladkaPolEtatu,
    youtube: 'L5Moo2zethg',
    sources: [
      {
        title: 'Czego przepis nie obejmuje',
        sources: [DRUK_SENAT, LIMITY],
      },
      {
        title: 'Nocna pomoc i Holandia',
        sources: [
          { label: 'Rzeczpospolita, 15.05.2014: NIK o nocnej i świątecznej opiece', href: 'https://www.rp.pl/prawo-dla-ciebie/art5051051-nik-o-nocnej-i-swiatecznej-opiece-zdrowotnej' },
          { label: 'Forsal, 15.05.2014', href: 'https://forsal.pl/artykuly/797121,duzyry-nocne-i-weekendowe-sa-nieprzystosowane-do-potrzeb-pacjentow.html' },
          { label: 'Ostra opieka w Wielkiej Brytanii i Holandii (PMC)', href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6660652' },
          { label: 'Nivel: Zorg via de huisartsenspoedpost, 2021–2025', href: 'https://www.nivel.nl/sites/default/files/bestanden/13405.pdf' },
          { label: 'ZorgkaartNederland: katalog punktów', href: 'https://www.zorgkaartnederland.nl/huisartsenpost' },
          { label: 'Healthcare-in-Europe', href: 'https://healthcare-in-europe.com/en/tag/381-profession/page-2.html' },
          { label: 'Forsal: ludność Mazowsza', href: 'https://forsal.pl/artykuly/9646225,populacja-woj-mazowieckiego-szybko-rosnie-powiekszyla-sie-o-caly-gd.html' },
          { label: 'Polska w liczbach: województwo mazowieckie', href: 'https://www.polskawliczbach.pl/mazowieckie' },
          { label: 'The European Conservative za CBS: ludność Holandii', href: 'https://europeanconservative.com/?p=68303' },
        ],
      },
      {
        title: 'Zarzuty, które się zdezaktualizowały',
        sources: [LIMITY, DRUK_SEJM, KOMISJA],
      },
      {
        title: 'Zakaz pracy na NFZ i izba lekarska',
        sources: [
          LIMITY,
          { label: 'Rynek Zdrowia, 29.10.2026: stanowisko rzecznika izby', href: 'https://www.rynekzdrowia.pl/Prawo/Dozywotni-zakaz-pracy-na-NFZ-moze-byc-niezgodny-z-konstytucja-Senat-szuka-poprawek,290629,2.html' },
          { label: 'zarobkilekarzy.pl: Najwyższa kara, której prawie się nie orzeka', href: '/analizy/odpowiedzialnosc-zawodowa-lekarzy/' },
          { label: 'Konstytucja RP, art. 17 ust. 1', href: 'https://api.sejm.gov.pl/eli/acts/DU/1997/483/text.pdf' },
          { label: 'Rzeczpospolita/PAP, 22.06.2026: stanowisko izby', href: 'https://www.rp.pl/ochrona-zdrowia/art44671951-nil-o-odebraniu-prawa-wykonywania-zawodu-lek-dawidowi-kacprzykowi' },
          { label: 'RMF24, 24.06.2026: zapowiedź wniosku o zawieszenie', href: 'https://www.rmf24.pl/regiony/warszawa/news-bedzie-wniosek-o-zawieszenie-prawa-wykonywania-zawodu-dawida,nId,8091297' },
          { label: 'Interia, 11.09.2026: powrót lekarza do pracy', href: 'https://wydarzenia.interia.pl/kraj/news-co-dalej-z-dawidem-kacprzykiem-media-znalazl-nowa-prace,nId,23542476' },
          { label: 'RMF24, 22.09.2026: rozmowa o decyzji izby', href: 'https://www.rmf24.pl/rozmowy/rozmowa-o-7/news-decyzja-ws-kacprzyka-zupelnie-niezrozumiala-jestem-zniesmacz,nIdn,1018559' },
        ],
      },
      {
        title: 'Lekarze objazdowi',
        sources: [
          { label: 'zarobkilekarzy.pl: Wieloetatowość i równoległe kontrakty', href: '/mechanizmy/wieloetatowosc/' },
          { label: 'Wirtualna Polska, 9.07.2026: relacja dyrektora szpitala', href: 'https://wiadomosci.wp.pl/dyrektor-szpitala-obejrzal-konferencje-ministry-ujawnia-nowy-skandal-lekarze-turysci-7305643749149024a' },
          { label: 'zarobkilekarzy.pl: rekordy godzin', href: '/dane/rekordy/' },
        ],
      },
      {
        title: 'Wirtualna dostępność',
        sources: [
          { label: 'OECD: Health at a Glance: Europe 2024', href: 'https://www.oecd.org/en/publications/health-at-a-glance-europe-2024_b3704e14-en.html' },
          GUS,
          { label: 'RMF24, 19.10.2026: dyrektorzy szpitali o anestezjologach', href: 'https://www.rmf24.pl/fakty/polska/news-limity-zarobkow-i-czasu-pracy-lekarzy-dyrektorzy-szpitali-ch,nIdn,1022528' },
          { label: 'Rzeczpospolita, 30.10.2026: poprawki w Senacie', href: 'https://www.rp.pl/ochrona-zdrowia/art45422991-dziewiec-poprawek-do-pakietu-zmian-w-ochronie-zdrowia-we-wtorek-zajmie-sie-nimi-senat' },
        ],
        note: 'O konsolidacji szpitali: wpis lekarza w serwisie X, 23.10.2026. Bez linku, bo adres zawiera nazwę konta.',
      },
      {
        title: 'Gdzie krytyk ma rację',
        sources: [DRUK_SENAT, KOMISJA],
      },
      {
        title: 'Onkolog i pacjent',
        sources: [DRUK_SENAT],
        note: 'Sytuacja onkologa i ocena poprawek: wpisy lekarza w serwisie X, 24.07 i 23.10.2026. Bez linków, bo adresy zawierają nazwę konta.',
      },
      {
        title: 'Liczba, której nie ma',
        sources: [DRUK_SEJM, GUS],
      },
      {
        title: '240 złotych i prywatne przychodnie',
        sources: [
          LIMITY,
          { label: 'CBOS, raport nr 69/2025', href: 'https://www.cbos.pl/PL/publikacje/raporty/open_file.php?id=7056' },
          DRUK_SENAT,
          { label: 'Sejm, 22.10.2026, głosowanie nr 128: poprawki odrzucone', href: 'https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=glosowania&NrKadencji=10&NrPosiedzenia=67&NrGlosowania=128' },
          { label: 'Landrigan i in., NEJM 2004: długie dyżury a poważne błędy', href: 'https://read.qxmd.com/read/15509817/effect-of-reducing-interns-work-hours-on-serious-medical-errors-in-intensive-care-units' },
          { label: 'TVN24, 25.08.2021: Wałbrzych', href: 'https://tvn24.pl/wroclaw/walbrzych-zmarl-39-letni-anestezjolog-prokuratura-wszczela-sledztwo-st5330399' },
        ],
      },
    ],
  },
];
