/**
 * Szerszy program — strona /program/. Kierunki, które wynikają z tych samych danych co postulat,
 * ale nie są jego częścią: postulat (src/data/postulat.ts) zostaje jednym żądaniem z projektem ustawy.
 * Przy każdym kierunku: fakt ze źródłem, najmocniejszy kontrargument i materiały serwisu (`refs` = id artykułów).
 */
import type { Proposal, TextItem } from '@/types';
import { PENALTIES_MILD, PENALTIES_TOTAL, PENALTY_WINDOW, FIRST_YEAR, LAST_YEAR, total as revocations } from '@/data/odpowiedzialnosc-zawodowa-lekarzy';

import beautyRazemAvatar from '@/assets/people/beautyrazem.jpg';

export const programPage = {
  href: '/program/',
  eyebrow: 'Poza postulatem',
  title: 'Szerszy program',
  docTitle: 'Szerszy program: co poza jawnością wynagrodzeń',
  /** <title> — docTitle (też tytuł w wyszukiwarce serwisu) jest za długi dla Google */
  seoTitle: 'Szerszy program: poza jawnością płac',
  lead: 'Postulat serwisu jest jeden: jawne łączne wynagrodzenia, bez nazwisk. Tu zbieramy osiem dalszych kierunków, które wynikają z tych samych danych — od ewidencji czasu pracy po sądy lekarskie. To kierunki, nie projekty ustaw: przy każdym podajemy fakt, na którym go opieramy, i najmocniejszy kontrargument, jaki znamy.',
  /** meta description (lead jest dłuższy niż 160 znaków) */
  description: 'Dalsze kierunki, które wynikają z danych o wynagrodzeniach — od ewidencji czasu pracy po sądy lekarskie. Przy każdym fakt i najmocniejszy kontrargument.',
  updated: new Date('2026-10-15'),
};

/* ---------- Jak czytać program ---------- */

export const howToRead = {
  title: 'Jedno żądanie, osiem kierunków',
  text: 'Jawność wynagrodzeń to jedyna sprawa, o którą zabiegamy formalnie: ma projekt ustawy, uzasadnienie i drogę do Sejmu. Program nie jest jej częścią i nie wyprzedza jej w kolejce. Wynika z tych samych danych, ale idzie dalej — i część punktów budzi spór także wśród osób, które jawność popierają.',
  principles: [
    {
      title: 'Najpierw jawność.',
      text: 'Bez łącznych kwot i godzin większości tych kierunków nie da się ani sprawdzić, ani rozliczyć. Dlatego limit wynagrodzeń stoi na samym końcu.',
    },
    {
      title: 'Fakt przy każdym punkcie.',
      text: 'Każdy kierunek opieramy na liczbie albo przepisie ze źródłem i na materiale z tego serwisu.',
    },
    {
      title: 'Spór nazwany wprost.',
      text: 'Przy każdym punkcie piszemy najmocniejszy kontrargument, jaki znamy. Program, który go przemilcza, przekona tylko przekonanych.',
    },
  ] satisfies TextItem[],
};

/* ---------- Kierunki ---------- */

/** Kierunek w danych: zamiast gotowych linków — id materiałów serwisu, adresy wylicza articleHref(). */
type ProposalEntry = Omit<Proposal, 'id' | 'more'> & {
  /** kotwica na stronie — stała, linkują do niej wyszukiwarka i inne strony */
  id: string;
  refs: string[];
};

export interface ProgramGroup {
  id: string;
  /** krótka nazwa — etykieta sekcji i pozycja spisu */
  label: string;
  title: string;
  intro: string;
  items: ProposalEntry[];
}

export const programGroups: ProgramGroup[] = [
  {
    id: 'jawnosc',
    label: 'Jawność',
    title: 'Pieniądze to połowa obrazu',
    intro: 'Postulat pokaże, ile publicznych pieniędzy trafia do jednej osoby. Nie pokaże, ile godzin ta osoba naprawdę przepracowała — a od tego zależy bezpieczeństwo pacjenta.',
    items: [
      {
        id: 'ewidencja-czasu-pracy',
        title: 'Krajowa ewidencja czasu pracy',
        text: 'Godziny jednej osoby ze wszystkich placówek publicznych zapisywane w jednym miejscu — jak tachograf, który liczy czas za kierownicą bez względu na to, dla kogo kierowca jeździ. Kontrolerzy widzieliby, kiedy suma przekracza to, co da się przepracować. Publicznie godziny pokazywałyby się tak jak wynagrodzenia: pod identyfikatorem, bez nazwisk.',
        fact: {
          text: 'Lekarz w trakcie specjalizacji wykazał w jednym roku 3 976 godzin pracy w czterech publicznych placówkach — średnio 331 godzin miesięcznie. Każda z nich widziała tylko swoją część.',
          source: { label: 'TVN Warszawa', href: 'https://tvn24.pl/tvnwarszawa/ursynow/warszawa-lekarz-radny-zarobil-1-6-miliona-kontrola-w-szpitalu-i-interwencja-naczelnej-izby-lekarskiej-st9096506' },
        },
        dispute: 'Lekarzy na kontraktach nie obejmują normy czasu pracy z Kodeksu pracy, więc sama ewidencja niczego nie zakaże. Pokaże skalę — o granicach godzin trzeba będzie zdecydować osobno.',
        refs: ['wieloetatowosc'],
      },
    ],
  },
  {
    id: 'przy-pacjencie',
    label: 'Więcej lekarza przy pacjencie',
    title: 'Brakuje lekarzy tam, gdzie nie ma chętnych',
    intro: 'Miejsc na studiach i rezydentur przybyło. Brakuje lekarzy w konkretnych dziedzinach, regionach i godzinach — i tam powinny trafiać pieniądze i zachęty.',
    items: [
      {
        id: 'wiecej-lekarzy',
        title: 'Więcej lekarzy tam, gdzie realnie brakuje',
        text: 'Zamiast ogólnego „więcej miejsc” — finansowane rezydentury w dziedzinach i regionach z niedoborem oraz zachęty do pracy w publicznych szpitalach powiatowych. Więcej dyplomów nie skróci kolejki, jeśli absolwenci nie trafią tam, gdzie jest najdłuższa.',
        fact: {
          text: 'Jesienią 2025 r. obsadzono 5 483 z 14 598 oferowanych miejsc specjalizacyjnych — 62% zostało pustych.',
          source: { label: 'Termedia', href: 'https://www.termedia.pl/wartowiedziec/Ostateczne-wyniki-rekrutacji-na-specjalizacje-w-sesji-jesiennej-2025,64937.html' },
        },
        dispute: 'Specjalizacja trwa kilka lat, więc nawet trafnie skierowane miejsca dadzą specjalistów dopiero w następnej dekadzie. To kierunek na lata, nie sposób na dzisiejsze kolejki.',
        refs: ['dlaczego-brakuje-lekarzy', 'wedlug-specjalizacji'],
      },
      {
        id: 'lekarze-spoza-ue',
        title: 'Szybsza, ale rzetelna ścieżka dla lekarzy spoza UE',
        text: 'Dla doświadczonych specjalistów o sprawdzonych kwalifikacjach — przyspieszone uznanie dyplomu i okres pracy pod nadzorem. Dla pozostałych — przewidywalna droga do pełnych uprawnień przez egzamin i staż. Bezpieczeństwo pacjenta jest warunkiem, ale bariera nie powinna marnować ludzi gotowych do pracy.',
        fact: {
          text: 'Dziś obok nostryfikacji albo egzaminu LEW działa tryb uproszczony: prawo wykonywania zawodu z decyzji ministra zdrowia, bez uznania dyplomu. Jedna droga jest powolna, druga mało przejrzysta — a projekt ministerstwa przewiduje przyjmowanie wniosków w trybie uproszczonym tylko do końca 2026 r.',
        },
        dispute: 'Najczęstszy zarzut: szybsza ścieżka obniży standardy i utrudni porozumienie z pacjentem. Dlatego proponujemy nadzór i sprawdzian, a nie automatyczne uprawnienia.',
        refs: ['lekarze-ze-wschodu'],
      },
      {
        id: 'medycyna-estetyczna',
        title: 'Koniec ucieczki od leczenia do zabiegów urody',
        text: 'Za zabiegi estetyczne pacjent płaci prywatnie, poza NFZ, więc godzina specjalisty w gabinecie urody może być godziną mniej w kolejce — nikt tego nie mierzy. Nie chcemy, by państwo wzmacniało ten bodziec, zastrzegając zabiegi estetyczne dla lekarzy. Lekarz ma przede wszystkim leczyć.',
        fact: {
          text: 'W styczniu 2026 r. Ministerstwo Zdrowia wyjaśniło, że zabiegi medycyny estetyczno-naprawczej, od toksyny botulinowej po nici liftingujące, są świadczeniami zdrowotnymi. Mogą je wykonywać specjaliści dermatologii i wenerologii albo chirurgii plastycznej oraz lekarze z certyfikatem tej umiejętności (kod 028, rozporządzenie z 2023 r.); kosmetolodzy nie.',
          source: { label: 'DOZ.pl', href: 'https://www.doz.pl/czytelnia/a18563-Te_zabiegi_medycyny_estetycznej_wykona_tylko_lekarz_Jest_stanowisko_Ministerstwa_Zdrowia' },
        },
        dispute: 'Za wyłącznością lekarzy przemawia bezpieczeństwo: powikłania po źle wykonanych zabiegach bywają poważne. Spór dotyczy więc tego, kto i po jakim szkoleniu może wykonywać które zabiegi. Ten punkt jest świadomie sprzeczny z obecnym kierunkiem resortu.',
        refs: ['ucieczka-lekarzy'],
        // opis z profilu bez emoji; strony z profilu (lista kandydatów w wyborach) celowo nie linkujemy
        profile: {
          name: 'Beauty Razem',
          handle: 'BeautyRazem',
          avatar: beautyRazemAvatar,
          eyebrow: 'Strona sporu na X',
          bio: 'Fundacja 100k salonów beauty. Wprowadziliśmy VAT 8%. Bronimy kosmetologów w estetyce. Na X 50% humor, 50% ekonomia.',
          note: 'Fundacja salonów beauty — strona tego sporu, a nie niezależne źródło. Sprzeciwia się zastrzeżeniu zabiegów estetycznych wyłącznie dla lekarzy.',
        },
      },
      {
        id: 'odpracowanie-specjalizacji',
        title: 'Odpracowanie specjalizacji opłaconej przez państwo',
        text: 'Rezydenturę finansuje Ministerstwo Zdrowia. Lekarz, któremu państwo opłaciło specjalizację, przepracowałby potem określony czas w placówce z umową z NFZ albo szkolił kolejnych specjalistów — jak przy stypendium z zobowiązaniem.',
        fact: {
          text: 'Taki mechanizm już działa, ale dobrowolnie: rezydent, który zobowiąże się przepracować łącznie 2 z 5 lat po specjalizacji w placówce udzielającej świadczeń finansowanych ze środków publicznych, dostaje dodatek — 700 zł miesięcznie w dziedzinie priorytetowej, 600 zł w pozostałych. Kto zobowiązania nie dotrzyma, płaci 75% otrzymanych dodatków, proporcjonalnie mniej za przepracowany okres.',
          source: { label: 'Ustawa o zawodach lekarza i lekarza dentysty, art. 16j', href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000037' },
        },
        dispute: 'Obowiązek odpracowania może zniechęcić część absolwentów do specjalizacji w kraju albo skłonić ich do wyjazdu. Otwarte pozostaje, jaki okres jest proporcjonalny do kosztu szkolenia.',
        refs: ['wedlug-specjalizacji'],
      },
    ],
  },
  {
    id: 'renta-i-nadzor',
    label: 'Renta z niedoboru i nadzór',
    title: 'Nikt nie powinien sędziować we własnej sprawie',
    intro: 'Niedobór lekarzy daje przewagę tym, którzy wybierają, gdzie i za ile pracują. Trzy kierunki dotyczą chwil, w których ta przewaga staje się kosztem dla pacjenta i budżetu.',
    items: [
      {
        id: 'prywatne-i-publiczne',
        title: 'Rozdzielenie pracy prywatnej i publicznej',
        text: 'Nie postulujemy zakazu pracy prywatnej. Postulujemy koniec zarabiania dwa razy na tym samym pacjencie albo tych samych godzinach: odsyłania z kolejki NFZ do własnego gabinetu, terminów w publicznej poradni, które „znajdują się” po płatnej wizycie, i płatnej gotowości do dyżuru spędzonej na prywatnych wizytach.',
        fact: {
          text: 'Konstytucja zobowiązuje władze publiczne do zapewnienia równego dostępu do świadczeń finansowanych ze środków publicznych, niezależnie od sytuacji materialnej pacjenta.',
          source: { label: 'Konstytucja, art. 68 ust. 2', href: 'https://bip.brpo.gov.pl/pl/kategoria-konstytucyjna/art-68-prawo-do-ochrony-zdrowia' },
        },
        dispute: 'W mniejszych miejscowościach bywa jeden specjalista danej dziedziny, który przyjmuje i na NFZ, i prywatnie. Sztywny podział mógłby tam zmniejszyć dostępność — dlatego chodzi o zasady konfliktu interesów i kontrolę terminów, a nie o wybór „albo–albo”.',
        refs: ['wieloetatowosc'],
      },
      {
        id: 'sad-nad-lekarzem',
        title: 'Oddzielić sąd nad lekarzem od obrony lekarza',
        text: 'Samorząd lekarski z mocy ustawy reprezentuje zawód i broni jego interesów — i ten sam samorząd orzeka w sprawach odpowiedzialności zawodowej. Proponujemy rozdzielenie tych ról oraz silną, ustawową reprezentację pacjentów: odpowiednik izby lekarskiej po ich stronie.',
        fact: {
          text: `Gdy sąd lekarski karze, w ${Math.round((PENALTIES_MILD / PENALTIES_TOTAL) * 100)}% przypadków wybiera upomnienie, naganę albo karę pieniężną (${PENALTIES_MILD} z ${PENALTIES_TOTAL} kar orzeczonych w pierwszej instancji w latach ${PENALTY_WINDOW.from}–${PENALTY_WINDOW.to}). Prawo wykonywania zawodu prawomocnie odebrał w latach ${FIRST_YEAR}–${LAST_YEAR} ${revocations('pl')} lekarzom.`,
          source: { label: 'Naczelna Izba Lekarska', href: 'https://nil.org.pl/izba/naczelny-sad-lekarski/sprawozdania/dane-liczbowe-dotyczace-sadow-lekarskich' },
        },
        dispute: 'Konstytucja (art. 17 ust. 1) pozwala tworzyć samorządy zawodów zaufania publicznego, które zarazem reprezentują zawód i sprawują pieczę nad jego należytym wykonywaniem. Rozdzielenie ról musi zmieścić się w tej formule — na przykład przez niezależny skład orzekający z udziałem spoza zawodu.',
        refs: ['odpowiedzialnosc-zawodowa-lekarzy'],
      },
      {
        id: 'limit-po-jawnosci',
        title: 'Limit wynagrodzeń — dopiero po jawności',
        text: 'Najpierw jawne dane, potem ewentualny limit. Jeśli w ogóle, to tylko na skrajne przypadki i tylko na łączną kwotę ze środków publicznych dla jednej osoby — nigdy na dochód z pracy prywatnej. Celem jest kontrola publicznych pieniędzy, a nie to, ile kto zarabia.',
        fact: {
          text: 'W sondażu UCE Research dla Onetu limity wynagrodzeń wskazało 14,3% badanych — mniej niż jawność kontraktów lekarskich (21,9%).',
          source: { label: 'Onet', href: 'https://wiadomosci.onet.pl/kraj/polacy-chca-wiedziec-ile-zarabiaja-lekarze-sa-wyniki-nowego-sondazu/v840y3y' },
        },
        dispute: 'Najmocniejszy zarzut: limit w czasie niedoboru wypchnie lekarzy do sektora prywatnego. Dlatego stoi na końcu — o tym, czy i gdzie postawić próg, mogą przesądzić dopiero jawne dane.',
        refs: ['komin-placowy'],
      },
    ],
  },
];

/* ---------- Zakończenie ---------- */

export const closing = {
  title: 'To nie jest program antylekarski',
  text: 'Uczciwi lekarze na nim zyskują: krótsze kolejki, jasne zasady i koniec wrzucania wszystkich do jednego worka z nadużyciami mniejszości. Ostrze kierujemy w nieprzejrzystość i niedobór, nie w zawód ani w ludzi — dlatego opisujemy mechanizmy, a nie nazwiska.',
};
