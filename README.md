# zarobkilekarzy.pl — redesign

Strona główna portalu „Twój przewodnik po temacie lekarzy”, zbudowana na **Astro 7**.

## Uruchomienie

Wymaga Node ≥ 22.22 (zob. `.nvmrc`).

```bash
npm install
npm run dev       # serwer deweloperski
npm run build     # statyczny build do dist/ + raport SEO (.astro/seo-report.json)
npm run build:release  # jak build, ale błędy audytu SEO i stare adresy bez rozwiązania przerywają build
npm run preview   # podgląd builda
npm run check     # kontrola typów (astro check)
npm run check:colors  # kolory na sztywno, które psują tryb nocny
```

## Architektura

```
src/
  content/                 TREŚCI (Content Collections, schematy w content.config.ts)
    articles/*.md(x)       artykuły i zestawienia: frontmatter (tytuł, kategoria, daty, lead,
                           „W skrócie”, źródła, powiązane, dział `topic`) + treść;
                           bez treści = tylko zapowiedź
    glossary.yaml          słownik pojęć: /slownik/, moduł „Słowniczek” na stronie głównej (pole `home`), wyszukiwarka
  data/
    navigation.ts          konfiguracja serwisu: menu, stopka, spis danych na stronie głównej, wyszukiwarka
    dane.ts                strona /dane/: opisy działów, osiem kluczowych liczb
    mechanizmy.ts          strona /mechanizmy/: działy jako pytania (odpowiedź, zdjęcie)
    analizy.ts             strona /analizy/: opisy działów
    home.ts                treści strony głównej (liczby, ścieżki, wykres, quiz…)
    postulat.ts            postulat (stały): blok „Stanowisko redakcji” i treść /postulat/
    projekt-ustawy.ts      projekt nowelizacji art. 27a (wersjonowany): tekst, etapy drogi do Sejmu, historia wersji
    petycja.ts             archiwum petycji z lipca 2026 r. (treść dosłowna, odpowiedzi urzędów)
    dzialaj.ts             /dzialaj/: karty działań, wpis na X, szablon listu „Napisz do polityka” — zob. „Działaj”
    adresaci.json + .ts    adresy narzędzia „Napisz do polityka” (stan_na, źródło przy każdym), grupy, zwrot grzecznościowy
    program.ts             szerszy program /program/: kierunki spoza postulatu (fakt ze źródłem, spór, `refs` do artykułów)
    tajwan.ts              analiza o Tajwanie: dopłaty, wartość punktu, przykładowy rachunek, karta NHI, kurs TWD
    zadluzenie.ts          /dane/zadluzenie-szpitali/: kwartalny szereg MZ, województwa, ranking strat — zob. „Zadłużenie szpitali”
    og.ts                  obrazki OG stron spoza kolekcji (strona główna = obrazek domyślny)
    seo/                   identity (wydawca, opis serwisu, licencja), redirects (rejestr przekierowań),
                           legacy-urls (kontrakt starych adresów) — zob. „SEO”
  types.ts                 kształty danych wspólne dla danych i komponentów
  icons.ts                 rejestr ikon → sprite + typ IconName
  lib/
    content.ts             jedyne miejsce z getCollection(): sortowanie, filtry, adresy
    search/                wyszukiwarka: text (analiza tekstu, wspólna), build (indeks przy buildzie),
                           engine (wyszukiwanie w przeglądarce) — zob. „Wyszukiwarka”
    egzamin/               moduł LEK: types, engine (dobór, czas, punktacja), session (stan + zapis),
                           source (skąd pytania), storage (localStorage), api (window.lek) — zob. „Egzamin LEK”
    format.ts              liczby, daty, polska typografia (typo), fold/slug
    markdown/              wtyczki procesora Markdown: id nagłówków bez polskich znaków, przypisy jako zwijana lista
    notes.ts               przypisy na stronach spoza MDX (te same znaczniki co GFM) — zob. „Nowa treść”
    images.ts              szerokości wariantów srcset (Photo, Screenshot)
    links.ts               linki zewnętrzne, aktywna pozycja menu
    og/                    obrazki Open Graph: schema pola `og`, presety, rejestr tras, szablon (Satori)
    seo/                   SEO: meta (szablon tytułu, canonical, robots), schema/ (graf JSON-LD), feeds (RSS, llms.txt),
                           icons (favicon.ico i PNG z favicon.svg / icon-maskable.svg) — bez importów `@/` tam, gdzie czyta je integracja
    monitoring/            dane monitoringu Watchdog: kontrakt JSON (zod, walidacja przy buildzie),
                           codes.ts — słowniki kodów bez zod (do importu w przeglądarce), name.ts — nazwy
                           placówek do wyświetlania, map.ts — warstwy mapy („Zarobki”, „Jawność”)
    mapa/                  mapy Polski: kontrakt warstwy (types), geometria z PRG (geo), układ punktów (layout),
                           renderer SVG dla strony i grafik (svg), test χ² (stat), rejestr zestawów (sets) — zob. „Mapy”
    tokens.ts              tokeny z tokens.css jako para [dzień, noc] — dla grafik generowanych w buildzie
    zadluzenie/model.ts    licznik długu szpitali: kotwica, tempa, wartość w chwili t, kwartały projekcji (bez DOM)
  components/
    ui/                    atomy: Button, LinkArrow, Icon, Heading, Eyebrow, Num, Flag,
                           Badge, Photo, Meta, Counter, Card, Logo, Sprite, Tag, AccuracyLegend
    layout/                układ: Section, SectionHead, Split, Actions, Breadcrumbs,
                           PageHeader, PageMeta (nagłówek i metadane stron działów)
    blocks/                bloki treści: StatRow, NumberedCards, ArticleFeature, ArticleList,
                           TopicStrip, BarChart, RatioDots, MiniStats, LinkIndex,
                           NumberedList, CheckList, ToolCard, Tabs, Glossary, KeyFacts,
                           Callout, NewsletterForm, Aside, Steps, Screenshot,
                           JumpList, NumberTiles, DatasetCard, ArticleTable (wiersze),
                           TopicCatalog (działy z wierszami), QuestionBands (działy jako pytania),
                           XProfile (karta profilu X bez skryptu X, awatar z lokalnej kopii; `size` full/compact, `width` fill/md/sm — w tekście artykułu md;
                           nasz kontekst — `eyebrow` i slot — stoi obok karty, poza ramką, karta pokazuje tylko dane z profilu),
                           XPosts (karty wpisów z X: artykuł, film, wpis — link do oryginału bez skryptu X),
                           Explainer (baner „Wyjaśniamy”: grafika jasna/ciemna, drabina pozycji z paskami w jednej skali, odpowiedź „po co”),
                           MonthGrid (siatka miesięcy: sprawdzone / niesprawdzone, kreska zdarzenia),
                           StatusTrack (oś etapów), TwoLists (jawne / chronione), Faq (rozwijane pytania),
                           Comparison (tabela porównania; wąsko — karty),
                           ProposalList (kierunki: opis, fakt ze źródłem, spór, linki, opcjonalnie karta XProfile; numeracja od `start`),
                           Figure (rama ilustracji w artykule: teza nad nią, podpis z uwagami i linkiem do źródła)
    article/               szablon artykułu: ArticleHeader, Toc, Prose, ProseLink, ShareLinks;
                           przypisy poza MDX: NoteRef, NoteList (lib/notes); SourceList — lista źródeł /prawa-pacjenta/
    site/                  elementy każdej strony: Topbar, Header, Footer, SearchDialog,
                           SearchBox, SearchResult, Analytics, PostulatCta,
                           ThemeToggle (przełącznik trybu nocnego)
    egzamin/               moduł LEK: ExamApp (zakładki), ExamSetup (kreator), ExamBank (baza pytań),
                           ExamRunner (okno testu), ExamResult (podsumowanie), QuestionTeaser
                           (jedno pytanie poza modułem, np. strona główna), question.css, client/*
    home/                  sekcje strony głównej — tylko kompozycja bloków z danymi
    postulat/              sekcje /postulat/ oraz tekst ustawy (BillText) i pisma petycji (PetitionText)
    program/               sekcje /program/: jak czytać, grupa kierunków (ProgramGroup), zakończenie
    tajwan/                ilustracje analizy o Tajwanie (statyczne, bez JS): Copays (tabela z paskami),
                           PointValue (wzór i skala wartości punktu), Receipt (rachunek z objaśnieniami), NhiCard
    datagrid/              generyczna tabela danych: wyszukiwanie, filtry z licznikami, sortowanie,
                           rozwijane wiersze, stan w adresie, CSV — zob. „Tabela danych”
    monitoring/            przeglądarka monitoringu płac: konfiguracja datagridu
    mapa/                  PolandMap (mapa z zestawu: przełącznik warstw, dymki, wersja bez JS), client.ts (<zl-map>)
    zadluzenie/            DebtCounter (licznik na żywo, <zl-debt-counter>), DebtChart (kwartały + projekcja 12 mies.),
                           RegionTable (województwa), LossRanking (straty netto, Kalisz)
  layouts/BaseLayout.astro <head> (SEO z propsa `seo` → components/seo), fonty; przekazuje konfigurację do site/*
  layouts/ArticleLayout.astro  artykuł: nagłówek, spis treści, źródła, powiązane, SEO (Article/Dataset); slot „aside” —
                               narzędzie obok tytułu zamiast „W skrócie” (mapa ASIDES w pages/[section]/[id].astro)
  layouts/IndexLayout.astro    strona-indeks działu: nagłówek z metadanymi i spisem działów,
                               treść (slot), stanowisko redakcji
  pages/[section]/[id].astro   trasa artykułu, np. /mechanizmy/fikcyjne-wizyty/
  pages/dane/index.astro       /dane/ — układ „Katalog” (TopicCatalog) + osiem liczb
  pages/dane/monitoring-watchdog/  przeglądarka monitoringu + publiczny JSON (…/monitoring-watchdog.json)
  pages/analizy/index.astro    /analizy/ — układ „Katalog”
  pages/mechanizmy/index.astro /mechanizmy/ — układ „Przewodnik” (QuestionBands)
  pages/postulat/             misja: /postulat/ (cel), /postulat/projekt-ustawy/ (dokument z kotwicami ustępów),
                              /postulat/petycja/ (archiwum); stare adresy → src/data/seo/redirects.ts
  pages/dzialaj/index.astro   /dzialaj/ — co może zrobić czytelnik + narzędzie #napisz (components/dzialaj, <zl-letter>)
  pages/program/index.astro   /program/ — szerszy program; celowo poza /postulat/ (stamtąd jedno zdanie pod „Zarzutami”)
  pages/og/[...route].png.ts   obrazki OG przy buildzie: /og/index.png, /og/<sekcja>/<id>.png
  pages/og-podglad/            galeria wszystkich obrazków OG — tylko w `npm run dev`
  pages/szukaj/index.astro     strona wyników /szukaj/?q=…
  pages/szukaj.json.ts         indeks wyszukiwarki jako plik statyczny /szukaj.json
  pages/egzamin/index.astro    symulator LEK/LDEK /egzamin/
  pages/egzamin/[exam].json.ts bank pytań jako plik statyczny /egzamin/lek.json, /egzamin/ldek.json
  pages/egzamin/statystyki.json.ts migawka sekcji „Wyniki na tej stronie” /egzamin/statystyki.json
  pages/prawa-pacjenta/sor/dane.json.ts historia kolejek na SOR (tabela, fakty) /prawa-pacjenta/sor/dane.json
  pages/mapy/[set].json.ts     treść dymków map jako plik statyczny /mapy/<zestaw>.json
  scripts/reveal.ts        animacje wejścia sterowane atrybutami (data-reveal, data-count)
  scripts/open-target.ts   link do miejsca w zwiniętym <details> (lista przypisów, odpowiedź FAQ) najpierw je rozwija
  styles/                  tokens.css (kolory jako light-dark(dzień, noc)) + base.css (reset, typografia systemowa)
                           + footnotes.css (numer przypisu i lista „Przypisy” — globalnie, bo stoją też poza Prose)
```

### Zasady

- **Importy** przez alias `@/` (`@/components/ui/Button.astro`), bez ścieżek `../../`.
- **Kierunek zależności:** `pages → home → blocks → ui`. Atomy i bloki dostają dane wyłącznie przez propsy i nie importują `src/data` ani kolekcji. Dane trafiają do komponentów w sekcjach (`home/*`) i w layoucie.
- **Style lokalne** (`<style>` w komponencie). Globalnie są tylko tokeny, reset i klasy typografii (`.display`, `.h2`, `.lead`, `.mono-label`).
- **Typowanie propsów:** komponenty renderujące element przyjmują `HTMLAttributes<'tag'>` z `astro/types` i przekazują `...rest` na element główny. Tak zaleca dokumentacja Astro, a przy okazji przechodzi atrybut zakresu `data-astro-cid-*`.
- **Rozszerzanie bez modyfikacji:** komponenty przyjmują `class` i przekazują resztę atrybutów na element główny, więc rodzic może dodać odstęp czy układ własną klasą. Wygląd dzieci zmienia się przez custom properties (`--num-color`, `--img-filter`…), a nie przez nadpisywanie ich selektorów.
- **Interakcje wielokrotnego użytku** to custom elements (`<zl-tabs>`, `<zl-popover>`, `<zl-exam>`, `<zl-question-teaser>`, `<zl-newsletter>`), więc każda instancja na stronie działa niezależnie.
- **Animacje** są deklaratywne: komponent oznacza element `data-reveal`, a `reveal.ts` nie zna żadnego komponentu.
- **Jedno źródło prawdy:** tytuł artykułu zapisany w `content/articles` trafia na stronę główną i do wyszukiwarki. Adresy artykułów definiuje tylko `articleHref()`.

### Nowa treść

- **Artykuł:** dodaj plik `src/content/articles/<id>.md` z frontmatterem. Pojawi się w „Nowe i zaktualizowane” (jeśli ma datę) i w wyszukiwarce.
- **Pełny artykuł:** gdy plik ma treść, powstaje podstrona `/<sekcja>/<id>/` (sekcję wyznacza kategoria, mapa `SECTIONS` w `lib/content.ts`) i trafia do sitemapy. Wzorzec: `fikcyjne-wizyty.mdx`.
  - Bloki w `.mdx`: `StatRow`, `Steps` (zrzut ekranu `<Screenshot>` wcięty pod krokiem), `Aside` (`note` / `info`), `Button`. Nagłówki `##` budują spis treści, a odstępy między blokami ustawia `Prose`, więc bloki nie mają własnych marginesów zewnętrznych. Kolumna treści sięga do prawej krawędzi siatki (jak nagłówek artykułu): akapity, listy i `h3` kończą się na `--measure` (780 px, ok. 90 znaków przy 19 px), a bloki osadzone w MDX (ilustracje, tabele, liczby) biorą całą szerokość kolumny.
  - **Źródła to przypisy** — jedyny wzorzec: `tekst[^id]` w treści i `[^id]: Wydawca, [tytuł](adres), data.` na końcu pliku (jedna linia na przypis, w kolejności tekstu). Numer stoi po słowie albo po znaku interpunkcyjnym, którego dotyczy (`mln zł.[^nfz]`, `podał Rynek Zdrowia,[^rz] a…`). Nie ma linków do źródeł w nawiasach ani nazwy wydawcy jako linku w zdaniu; nazwa może zostać w zdaniu zwykłym tekstem („podał Rynek Zdrowia”), gdy niesie sens — link idzie do przypisu. Ten sam przypis można wskazać kilka razy. Każda publikacja, z której korzysta tekst, ma przypis — także ta, na którą powołuje się tylko liczba w bloku.
  - Numerację nadaje procesor, `lib/markdown/footnotes.ts` zwija listę w „Przypisy” (numer w tekście ją rozwija), a `getFootnotes()` daje liczbę do nagłówka artykułu, stopki obrazka OG i adresy do JSON-LD. Przypisy nie liczą się do czasu czytania ani do wyszukiwarki. Przypis działa też w treści bloków pisanej Markdownem (`Aside`, `Steps`). Definicja bez odwołania w tekście znika z listy bez ostrzeżenia, więc po dopisaniu sprawdź liczbę „Przypisy” w nagłówku. Wzorce: `tajwan-ochrona-zdrowia.mdx`, `fikcyjne-wizyty.mdx`.
  - Pole `sources` i komponent `Cite` są wycofane — schemat odrzuca `sources` z komunikatem.
  - Ramka „Dlaczego to nasz temat” to opcjonalne pole `editorial` (akapity) — tylko przy tematach, w których redakcja zajmuje stanowisko.
  - **Data aktualizacji = historia zmian.** Pola `updated` nie ma (schemat je odrzuca): datę „Aktualizacja” w nagłówku, `dateModified` w JSON-LD, `lastmod` w sitemapie i datę w RSS wyznacza najnowszy wpis `changelog` (`{ date, text, correction? }`, zapis `lib/inline`). Wpis = zmiana merytoryczna widoczna dla czytelnika: nowe lub zmienione dane, zmiana opisywanej sprawy, nowa sekcja albo teza, poprawka błędu (`correction: true` — etykieta „Sprostowanie” przy wpisie i pozycja w rejestrze na `/o-projekcie/#sprostowania`). Literówki, układ, kod, SEO, obrazki i tłumaczenia nie dostają wpisu ani nowej daty. Jeden wpis na dzień; schemat odrzuca wpis starszy niż publikacja i z przyszłości. Komponent `article/Changelog` (zwinięty, data w nagłówku do niego prowadzi). Tłumaczenie ma te same wpisy po angielsku i te same daty — jego daty to daty oryginału, dzień tłumaczenia pokazuje nota nad treścią.
  - **Strony-narzędzia** (`.astro` z wpisem-opakowaniem w kolekcji: SOR, monitoring, prawa pacjenta, egzamin, symulator) mają `changelog` we frontmatterze opakowania (`kolejki-sor.md`, `monitoring-watchdog.md`…); strona czyta wpis przez `getArticle(id)`, pokazuje `Changelog` i bierze z niego daty. Wpisy EN takich stron: `changelog` w module `src/data/en/<strona>.ts`. „Sprawdzone ze źródłami” (sprawdzenie bez zmian) to `dates.reviewed` → `lastReviewed`, nie `dateModified`.
  - **Daty ogólne liczy build:** pasek nad nagłówkiem (`siteUpdated()` w `lib/content.ts`: najświeższy tekst albo wpis aktualności), „Aktualizacja” stron działów i stopka OG działu danych (`lastUpdated()` w `i18n/entries.ts`: najświeższy materiał ze spisu). Nie wpisuj tych dat ręcznie.
  - Liczba w komponencie (`StatRow`, `Figure`, `Comparison`, `BarChart`) nie może mieć przypisu — dostaje link wprost: podpis `Figure` (`source={{ label, href }}`) albo `href` w `StatRow`. Te adresy trzyma `export const LINKS = { … }` na początku pliku MDX (albo `LINKS` w `src/data/<id>.ts`, gdy artykuł ma plik danych), a ta sama publikacja ma przypis przy zdaniu, które z liczby korzysta (albo przy zdaniu, które blok zapowiada). Tabela z wieloma źródłami (np. zawody w `personel-medyczny.mdx`) może mieć jeden przypis zbiorczy z kilkoma linkami.
  - **Przypisy poza MDX** (strona `.astro`, teksty z `src/data`): `defineNotes({ id: 'Wydawca, [tytuł](adres), data.' })` z `lib/notes.ts` (treść w zapisie `lib/inline`, kolejność jak w tekście), w szablonie `<NoteRef notes={notes} id="…" />` przy słowie, a w tekstach z danych `[^id]` przetwarzane przez `inline(text, resolve, notes)`; pod treścią `<NoteList notes={notes} />`. Znaczniki są te same co z GFM, więc wygląd (`styles/footnotes.css`) i rozwijanie (`scripts/open-target.ts`) działają bez zmian. Jedna lista na stronę. Wzorce: `pages/analizy/symulator-podazy-lekarzy.astro`, `data/faq.ts` + `pages/faq/`.
  - Poza blokami z listy wyżej w treści działają też `Comparison` (tabela → karty na wąskim ekranie), `NumberedList`, `TwoLists` („dowodzą / nie dowodzą”, „jawne / niejawne”) i `BarChart` w ramie `Figure`. `Prose` styluje tylko listy z Markdownu (`ul`/`ol` bez klasy), więc blok-lista nie dostaje drugiej numeracji.
  - Kwoty zależne od jednej liczby zmieniającej się co roku (kwota bazowa, stawka NFZ) liczy się w `src/data/<id>.ts`, a nie wpisuje w tabelę: `data/personel-medyczny.ts` (siatka płac, aktualizacja 1 lipca) i `data/poz.ts` (stawka kapitacyjna).
  - **Budżet NFZ** ma jedno źródło: `src/data/budzet-nfz.ts` (koszty ogółem z ostatecznego planu finansowego, rok w toku = plan aktualny; definicja i sposób aktualizacji w komentarzu pliku). Strony i strona główna importują `BUDGET`/`CURRENT` — nie wpisuj kwot budżetu ręcznie. Szereg kolejek WHC, CPI i składki: `src/data/kolejki.ts`; wykres indeksowy: `components/budzet/IndexChart.astro`.
  - Zrzuty i grafiki artykułu: `src/assets/articles/<id>/`.
- **Strony działów:** materiał pojawia się na stronie-indeksie, gdy ma pole `topic`, np. `topic: finanse` → /dane/, `topic: jawnosc` → /mechanizmy/, `topic: rejestr` → /analizy/. Lista działów, np. `topic: [kadry, porownania]`, pokazuje materiał na kilku stronach.
  - Działy i ich kolejność: `DATA_TOPICS`, `MECHANISM_TOPICS` i `ANALYSIS_TOPICS` w `src/types.ts`. Opisy działów: `src/data/dane.ts`, `mechanizmy.ts` i `analizy.ts`.
  - Nowa strona-indeks: `IndexLayout` plus `getTopicGroups()`, a w treści `TopicCatalog` (wiersze; przy kilkudziesięciu materiałach) albo `QuestionBands` (kilka działów-pytań ze zdjęciami).
  - Kolejność w dziale: pole `order`, a bez niego alfabetycznie.
  - Zestawienia danych mają też `format` (Wykresy, Tabela, Ranking…) i `stat`, czyli liczbę na karcie: `{ value: "3 746", unit: rozliczeń }`.
  - Dział może wskazywać stronę niezależnie od kategorii (np. analiza „Polska na tle sąsiadów” jest w spisie /dane/).
  - Id wpisu = ostatni segment adresu. Nie zmieniaj go po publikacji.
- **Pojęcie:** dopisz wpis w `src/content/glossary.yaml` (opis pól w nagłówku pliku). Strona `/slownik/` sortuje hasła alfabetycznie i daje każdemu kotwicę `#<id>` — id nie zmieniaj po publikacji. Definicja: 1–3 zdania, bez ocen i bez kwot, które się starzeją (kwota zostaje w tekście z `more`). Każde hasło ma `more` (id artykułu, opcjonalnie `anchor`, albo `{ href, label }`) i `sources` (podstawa prawna albo źródło: `{ label, href }`) — źródło to link pod hasłem, jak podpis `Figure`, a nie przypis. `home: n` wstawia hasło do modułu na stronie głównej (6–8 haseł).
- **Dane monitoringu płac:** podmień `src/data/monitoring-watchdog.json` (generuje go skrypt; kontrakt: schemat w `src/lib/monitoring`). Build sprawdzi plik i przeliczy stronę, publiczny JSON, obrazek OG, mapę i jej grafiki. Pole `teryt` (kod gminy siedziby) stawia placówkę na mapie — bez niego placówki na mapie nie ma.
- **Linki artykułów** wylicza tylko `articleHref()`: opublikowane prowadzą do podstrony, zapowiedzi do `href` z frontmattera.

### Tabela danych (datagrid)

`components/datagrid/` to tabela dla dużych zbiorów. Konfiguracja (`GridConfig` w `types.ts`) opisuje kolumny, grupy kolumn, filtry, przełączniki, szczegóły wiersza i eksport CSV. To zwykły moduł TS współdzielony przez serwer i przeglądarkę, więc komórki renderuje ta sama funkcja (`render.ts`).

- **Serwer** (`Datagrid.astro`) renderuje pierwszy widok: pasek filtrów z licznikami, nagłówek i pierwsze wiersze. Bez JS strona też coś pokazuje.
- **Przeglądarka:** komponent z konfiguracją wywołuje `defineDatagrid('zl-…', config)` (`element.ts`). Custom element pobiera pełne dane z `src` i przejmuje tabelę.
- **Filtry** liczą opcje „przy pozostałych filtrach” (faceted search). Filtr z `display: 'bar'` jest paskiem rozkładu, który działa też jako filtr.
- **Stan** (szukanie, filtry, sortowanie, strona) siedzi w adresie strony, więc link do widoku da się wkleić do artykułu.
- **Paginacja:** `pageSize` wierszy na stronie (monitoring: 25), wybór „na stronie” z `pageSizes` (0 = wszystkie).
- **Szerokość:** kolumny o priorytecie 2 i 3 znikają w węższym kontenerze (container queries). Poniżej 720 px tabela zamienia się w karty.
- **Grupa kolumn** bez danych w danym wierszu (np. brak listy płac) to jedna komórka z wyjaśnieniem zamiast rzędu kresek.
- **Przełącznik** może być włączony domyślnie (`default`) i „miękki” (`fallback`). Gdy z nim nic nie zostaje, tabela pokazuje wszystkie pasujące wiersze z komunikatem. Tak działa „Tylko z listą płac” w monitoringu.

Wzorzec: `components/monitoring/` (`grid.ts` + `MonitoringGrid.astro`).

### Dymek (popover / tooltip)

`ui/Popover.astro` to jeden moduł na oba przypadki: objaśnienie po kliknięciu (popover) i podgląd po najechaniu (tooltip).

```astro
<Popover label="Objaśnienie 1: opłata rejestracyjna" heading="Opłata rejestracyjna">
  <Fragment slot="trigger">1</Fragment>
  Opłata administracyjna spoza ubezpieczenia.
</Popover>
```

- **Podstawa to natywny `popover="auto"`:** klik lub dotyk otwiera dymek, a Esc albo klik obok go zamyka. Otwarty jest zawsze tylko jeden. Wszystko działa bez JS.
- **Pozycję wyznacza CSS anchor positioning** (Baseline 2026: Chrome 125, Safari 26, Firefox 147). Dymek stoi nad wyzwalaczem. Gdy brakuje miejsca, przeglądarka przenosi go pod spód albo przesuwa do krawędzi (`position-try-fallbacks`). Przeglądarka bez kotwic pokazuje dymek jako pasek u dołu ekranu.
- **`peek`** jest domyślnie włączony. Przy myszy dymek wysuwa się po najechaniu, a przy klawiaturze po fokusie, jak tooltip. Klik przypina go do czasu zamknięcia przez Esc lub klik obok. Dotyk zawsze działa kliknięciem. `peek={false}` zostawia tylko klik.
- **Wyzwalacz:** `variant="marker"` to numer w kwadracie (objaśnienia do ilustracji), `variant="term"` to termin w tekście z kropkowanym podkreśleniem, `variant="hint"` to kółko „?” przy etykiecie (domyślna treść wyzwalacza), a `variant="pin"` to wypełniony numer nad ilustracją (rozmiar z `--pop-pin`, domyślnie 22 px). `placement="bottom"` otwiera dymek pod wyzwalaczem, a gdy brakuje miejsca, nad nim. Przy krawędzi okna dymek dosuwa się do środka i zostaje 8 px od brzegu.
- **Kolor zależy od motywu strony.** W dzień dymek ma jasną powierzchnię (`--surface`) z ramką `--line-2` i miękkim cieniem. W nocy to granat uniesiony nad tło (`--inverse-2`) z białym tekstem. Dymek ma własny `color-scheme` zsynchronizowany z `:root[data-theme]`, więc idzie za stroną, a nie za ilustracją, w której stoi (papier rachunku i karta NHI są zawsze jasne). Font to Plex Sans 13,5 px, a szerokość to maksymalnie 300 px. Treść musi być frazowa (tekst, `<strong>`, `<a>`), bo dymek bywa osadzony w akapicie.
- **Kiedy lista zamiast dymków:** gdy objaśnień jest kilka i każde jest ważne, na wąskim ekranie lepiej pokazać je listą pod ilustracją. Widać je bez stukania i nie zasłaniają liczb. Tak robią `tajwan/Receipt` i `tajwan/NhiCard`: od 640 px figury numery otwierają dymki, a poniżej są zwykłymi znakami odsyłającymi do listy. Dymek z samym nagłówkiem (bez opisu) nie zostawia pustego odstępu.
- Unikalne id daje `uid()` z `lib/uid.ts`. Licznik działa na poziomie modułu, bo frontmatter komponentu wykonuje się przy każdym renderze.
- **Użycia:** objaśnienia na rachunku (`tajwan/Receipt`), numery na karcie NHI (`tajwan/NhiCard`, `pin`) i definicje w datagridzie (`hint` + `placement="bottom"` przy pasku rozkładu i w nagłówkach kolumn, id `<tag>-pop-<pole>`). Dymek w przyklejonym nagłówku tabeli przesuwa się razem z nim, więc nie trzeba go chować przy przewijaniu.

## Integracje

| Integracja | Do czego |
|---|---|
| `@astrojs/sitemap` | `sitemap-index.xml` przy każdym buildzie; o obecności strony i `lastmod` decyduje jej HTML (zob. „SEO”). |
| `@astrojs/rss` | `/rss.xml` — nowe i zaktualizowane materiały (`src/pages/rss.xml.ts`). |
| `integrations/seo` | Własna integracja: `dist/_redirects`, `dist/_headers`, sitemap z faktów HTML i audyt po buildzie (zob. „SEO”). |
| `@astrojs/mdx` | Artykuły `.mdx` mogą osadzać bloki z `src/components` (np. `<BarChart />`, `<Callout />`). Proste teksty zostają w `.md`. |
| Cloudflare Web Analytics | `src/components/site/Analytics.astro`: skrypt bez ciasteczek, renderowany tylko w buildzie produkcyjnym z ustawionym tokenem. |

Świadomie **bez** adaptera `@astrojs/cloudflare`, bo serwis jest statyczny. Adapter dodamy, gdy pojawi się backend (formularze, API). Wtedy trzeba ustawić `imageService: 'compile'`, żeby zachować kompresję zdjęć przy buildzie. Partytown nie jest potrzebny, bo skrypt Cloudflare jest lekki i ładuje się asynchronicznie.

### Zmienne środowiskowe

Zob. `.env.example`. Schemat (`astro:env`) jest w `astro.config.mjs`.

- `CF_WEB_ANALYTICS_TOKEN`: token z panelu Cloudflare (Web Analytics → Manage site). Zostaw pusty, jeśli domena jest proxowana przez Cloudflare z **automatycznym** wstrzykiwaniem skryptu. Na stronie może być tylko jeden taki skrypt.

## Zdjęcia

Zdjęcia leżą w `src/assets/img/` w oryginalnej jakości. Komponent `Photo.astro` (`<Image />` z `astro:assets` + sharp) przy buildzie:

- kompresuje je do **WebP** (jakość 72) w kilku szerokościach,
- generuje `srcset` i `sizes`, więc przeglądarka pobiera najmniejszy wystarczający wariant,
- obrazowi nad zgięciem (hero) nadaje `fetchpriority="high"`, a reszta ładuje się leniwie.

Przykład: hero ma 242 kB w JPG, a pobierany wariant WebP waży 29 kB.

## Fonty

Inter Tight, IBM Plex Sans i IBM Plex Mono przez **Fonts API** Astro (provider Fontsource). Fonty pobierają się przy buildzie i są serwowane z własnej domeny, bez zapytań do Google Fonts. Tam, gdzie to możliwe, używane są wersje zmienne. Podzbiory latin i latin-ext pokrywają polskie znaki. Astro generuje też metryczne fonty zastępcze, co ogranicza przeskok układu (CLS).

**Preload wszystkich 8 plików** (`<Font … preload />` w `BaseLayout`). Polskie litery poza „ó” są w podzbiorze latin-ext, a ten jest potrzebny na każdej stronie. Plik bez preloadu przeglądarka zamawia dopiero po znalezieniu znaku w tekście, czyli po pierwszej klatce. Wtedy ł, ą, ę, ż rysują się fontem zastępczym, przesuwają resztę linii i podmieniają się chwilę później: przy każdym wejściu na podstronę mrugały same polskie znaki, a z nimi etykiety w Plex Mono. Najmocniej widać to na `astro dev`, który wysyła fonty z `no-store`, i przy pierwszej wizycie na produkcji. Preload nie dokłada bajtów, bo wszystkie pliki i tak są pobierane na każdej stronie. Zmienia tylko kolejność.

Każdy font ma jedną rolę. Na stronie nie ma fontu szeryfowego, a wzorem jest czysta groteska:

- **Inter Tight** (`--f-display`) składa nagłówki, tytuły kart i duże liczby.
- **IBM Plex Sans** (`--f-body`) składa każdy tekst do czytania: akapity, uwagi pod ilustracjami, podpisy tabel, legendy, wiersze tabel i list oraz jednostki obok dużych liczb (`<small>`).
- **IBM Plex Mono** (`--f-mono`) służy do etykiet i metadanych w rozmiarze 10–12,5 px. Są to eyebrow i `.mono-label` (zwykle wersaliki), linie „Źródło: …”, daty, liczniki, okruszki, podziałki wykresów i `kbd`. Ten font składa też tekst maszynowy: kod, hashe, identyfikatory, numery.

Plex Mono ma szeryfy typu slab (widać je na „i”, „l”, „r”). W krótkiej etykiecie są niewidoczne, ale w zdaniu albo w tekście 13 px i większym zamieniają groteskę w „maszynopis”. Dlatego uwagi, opisy i wiersze treści idą w Plex Sans nawet wtedy, gdy są drobne i szare. W `Figure` mono zostaje tylko w linii źródła.

## Tryb nocny

Strona ma tryb nocny „granat nocny”. Domyślnie idzie za ustawieniem systemu, a przełącznik w nagłówku (`site/ThemeToggle.astro`) zapisuje wybór w `localStorage` (`zl-theme`) i ustawia `<html data-theme="light|dark">`. Skrypt w `<head>` (`BaseLayout`) nakłada zapisany motyw przed pierwszym malowaniem, więc strona nie miga. Wybór zgodny z systemem kasuje zapis.

Każdy kolor w `tokens.css` to para `light-dark(dzień, noc)`. Komponenty używają tokenów, więc działają w obu trybach bez własnych reguł. Zasady dla nowych komponentów:

- **Tło karty lub pola** to `var(--surface)`, nie `#fff`. Tło w kolorze strony to `var(--bg)`. Wycięcie (np. podpis zasłaniający linię wykresu) to `var(--under)`: domyślnie `--bg`, a `ui/Card` ustawia je na swoje tło, więc wycięcie nie zostawia prostokąta w karcie.
- **Tekst na wypełnieniu** `--ink`, `--ok` albo `--bad` (wybrany chip, poprawna odpowiedź) to `var(--on-ink)`. W nocy wypełnienie jaśnieje, a tekst ciemnieje.
- **Kobaltowe wypełnienie pod białym tekstem** (przycisk, karta, „W skrócie”) to `--blue-fill`, a hover `--blue-600`. Oba są stałe. Samo `--blue` (tekst, linie, kropki) w nocy jaśnieje, żeby utrzymać kontrast.
- **Sekcje zawsze ciemne** (topbar, stopka, `.section--dark`, bloki kodu) to `--inverse`. Dymki i elementy pływające to `--inverse-2`, które w nocy unosi się nad tłem.
- **Neutralne słupki wykresów** to `--chart`, a wyróżnienie to `--blue`. Więcej w „Wykresy” niżej.
- **Ilustracja papieru** (podgląd wydruku, tablica rejestracyjna) ustawia lokalnie `color-scheme: light`, a wtedy tokeny w środku przyjmują wartości dzienne.
- **Logo partnera** zostaje w oryginalnych kolorach. W nocy dostaje białą plakietkę: `background` i `box-shadow` z `light-dark(transparent, #fff)`.
- **Własny `<select>`** ma strzałkę z `var(--select-arrow)`. Wartości, które nie są kolorem (`--select-arrow`, `--photo-filter`), nie przyjmują `light-dark()`, więc ich wersje nocne są zdefiniowane osobno na końcu `tokens.css`.
- **Obrazki OG** są zawsze dzienne. `lib/og/render.ts` czyta `tokens.css` jako tekst i z `light-dark()` bierze pierwszą wartość.

Tych zasad pilnuje `npm run check:colors` (`scripts/check-colors.mjs`): białe tło oraz biały tekst na `--ink`, `--ok`, `--bad` lub `--blue` w tej samej regule to błąd (kod wyjścia 1), inne surowe hexy poza `tokens.css` to ostrzeżenie, a celowy wyjątek przepuszcza znacznik `/* kolor-stały: powód */` w linii albo para `/* kolor-stały: początek */` … `/* kolor-stały: koniec */`.

## Dostępność: wielkość tekstu i kontrast

- **Rozmiary tekstu są w `rem`** (1rem = 16 px): `font`, `font-size`, `line-height` i własne właściwości `--*-size`. Odstępy, szerokości i obramowania zostają w px. Dzięki temu tekst rośnie razem z ustawieniem czcionki w przeglądarce i z przełącznikiem „Większy tekst”, a układ się nie rozjeżdża. Nowe style też piszemy w rem. Przeliczanie: 11 px = `0.6875rem`, 12 px = `0.75rem`, 14 px = `0.875rem`, 15 px = `0.9375rem`, 18 px = `1.125rem`. Całą stronę przepisano tak 2026-10-15.
- **„Większy tekst”** to przycisk w nagłówku obok trybu nocnego (`site/TextSizeToggle.astro`). Na telefonie siedzi w menu, z podpisem, a na stronie pacjenta jest dodatkowo duży przycisk (`pacjent/TextSize.astro`). Wszystkie trzy działają na jednym stanie: `<html data-text-size="lg">`, czyli rozmiar bazowy 118,75% (16 → 19 px, `base.css`). Wybór jest zapisany w localStorage `zl-text-size`, a skrypt w `<head>` (`BaseLayout`) nakłada go przed pierwszym malowaniem. Logika jest w `lib/text-size.ts`: delegowany klik obsługuje każdy `<button data-text-size-toggle>`. Wygląd „włączony” wybiera CSS z atrybutu na `<html>`, a nie `aria-pressed`, żeby przycisk nie mignął przy wejściu na stronę.
- **Układ przy większym tekście.** Nagłówek chowa nawigację w menu już do 1080 px, bo menu potrzebuje ok. 625 px. Siatki z kilkoma liczbami obok siebie układają się w wiersze, gdy się nie mieszczą (`MiniStats`: `@container` z progiem w rem, który rośnie razem z tekstem). Po zmianie układu sprawdź stronę na 360 px z większym tekstem.
- **Kontrast domyślny spełnia WCAG AA**, więc na stronie nie ma przełącznika kontrastu. Tekst ma 7,6:1 (dzień) i 8,5:1 (noc), nagłówki od 13:1. Drobne etykiety `--muted` mają co najmniej 4,5:1 na `--bg`, `--bg-soft` i `--blue-50`; do 2026-10-15 w dzień było to 3,8:1. Szary tekst na ciemnych sekcjach (`rgba(255,255,255,a)` na `--inverse`) ma a ≥ 0,5, czyli co najmniej 5,3:1. Link, który od tekstu odróżnia tylko podkreślenie (przypisy), ma podkreślenie w `--muted`, a nie w `--line-2`.
- **Systemowe „zwiększ kontrast”** (`prefers-contrast: more`) zaostrza tokeny o stopień: tekst ma co najmniej 12:1, `--muted` 6,9:1, obramowania pól 3,5:1, a słupki wykresów 4,2:1. Blok jest na końcu `tokens.css`. Nowy token koloru tekstu albo linii dostaje tam swoją mocniejszą wersję.

## Wykresy

Wykresy mówią tym samym językiem co reszta strony: atrament to tekst i linie 1 px, nie pola.

- **Kolor niesie rolę, nie dekorację.** `--chart` to dane bez wyróżnienia (jasny łupek), `--chart-soft` to drugi segment słupka albo historia, `--blue` to jedyny akcent: to, o czym jest teza nad wykresem. `--chart-proj` z krawędzią `--blue` to szacunek, nie dane. Czerwień (`--bad`) tylko tam, gdzie znaczy „źle” (np. wzrost szybszy niż w kraju), nie dla adnotacji.
- **Bez szyn i kreskowania.** Słupek stoi sam, bez szarego toru pod spodem. Projekcja to blade wypełnienie, nie wzór.
- **Podpisy w kolorach tekstu.** Wartość przy słupku `--ink`, nigdy w kolorze serii. Plex Mono tylko dla osi, etykiet i metadanych; jednostka przy dużej liczbie (`zł/mies.`, `≈ 6 zł`) to Plex Sans.
- **Adnotacje to włoskowa linia `--ink` i etykieta mono wersalikami** (średnia w `BarChart`, „teraz” w `DebtChart`). Linia jest ciągła; gdzie przechodzi przez napis, napis ma tło `var(--under)` i ją wycina. Średnia w `BarChart` kończy się na ostatnim zwykłym wierszu — słupek porównawczy (`secondary`) do niej nie należy. Kropka `--bad` przy „teraz” łączy wykres z licznikiem „na żywo”.
- **Oś tylko wtedy, gdy wartości nie są podpisane.** `BarChart` podpisuje każdy wiersz (wartość tuż za końcem słupka), więc nie ma osi ani propa `ticks`. Siatka: linia przez całą szerokość, podpis nad nią przy lewej krawędzi, jednostka tylko przy najwyższej wartości (`60 mld zł`, `12 tys.`).
- **Segmenty w stosie** dzieli szczelina 2 px w kolorze tła (`border`/`box-shadow` w `var(--bg)`), nie obrys.
- **Symulator podaży:** kobalt znaczy „twoje” — zmieniony nabór, twój scenariusz na wykresie wyniku i ruszony suwak; nieruszony suwak jest neutralny.

## Mapy

Mapa Polski to zestaw warstw (`lib/mapa/sets.ts`) przełączanych na jednej mapie. Warstwa (`MapLayer` w `lib/mapa/types.ts`) to gotowe do wyświetlenia dane jednego trybu: wartości, skala klas, teksty legendy i dymków, źródła. Dwa rodzaje: `regions` (kartogram województw) i `points` (punkty, kolor = klasa, pole koła ∝ wielkość, szare = brak danych). Najechane koło rośnie, a spod niego pulsuje kółko w jego kolorze (bez animacji przy `prefers-reduced-motion`).

- **Na stronie:** `<PolandMap set="monitoring" heading={{ eyebrow, title, id }} />`. `layers={['jawnosc']}` wybiera warstwy i ich kolejność na przełączniku, `initial` — warstwę na starcie, `interactive={false}` daje mapę bez przełącznika, dymków i skryptu (np. w artykule).
- **Grafika do pobrania:** pozycja w `lib/infografiki/zestawy.ts` z polem `map: { set, layer }` — szablon infografik (pion i poziom, jasna i ciemna) bierze mapę z tego samego renderera (`lib/mapa/svg.ts`, motyw `jasny`/`ciemny` z wpisanymi kolorami tokenów).
- **Dymki** nie siedzą w HTML: komponent pobiera `/mapy/<zestaw>.json` przy pierwszym ruchu nad mapą.
- **Kolory:** skala sekwencyjna `--seq-0…4` i tekst na niej `--on-seq-0…4` w `tokens.css` (w nocy więcej = jaśniej). Skala ma najwyżej 5 klas; przy mniejszej liczbie klas `scale.tones` wybiera stopnie rampy (np. `[0, 1, 3, 4]`).
- **Geometria:** `src/data/geo/polska.json` — województwa i środki gmin z Państwowego Rejestru Granic (GUGiK), uproszczone i przeliczone z PUWG 1992 na płaszczyznę mapy; parametry przeliczenia są w polu `projection`. Plik generuje skrypt spoza repozytorium.
- **Położenie punktu:** współrzędne geograficzne (`at: { lat, lng }`, rzut `geo.project` na tę samą płaszczyznę co granice) albo środek gminy z kodu TERYT siedziby (`geo.communePoint` rozumie dzielnice, delegatury i części gmin miejsko-wiejskich). Nachodzące się koła rozsuwa `relax.ts` (deterministycznie, więc strona i grafika wyglądają tak samo); promień koła ustawia `size.radius`.
- **Warstwa na żywo** (`live: { url, adapter, pending }`): w buildzie punkty są szare, a skrypt mapy wczytuje plik `url`, przepuszcza go przez adapter z `lib/mapa/live.ts` (wartości, wielkości i dymki punktów, liczebność klas, podsumowanie, linia stanu, lista `top`) i od nowa rozsuwa koła. Dymek może mieć duże liczby (`stats`), profil w słupkach (`profile`: wartości, wyróżniony słupek `mark`, kreska `now`, podpisy) i tabelę (`cols`, wiersze `TipRow` z podpisem i wyróżnieniem). Opcja `search` daje nad mapą wyszukiwarkę punktów (po tytule i podpisie dymku, bez polskich znaków, najpierw miejscowość): wybór przypina dymek i podświetla punkt. Wzór: `lib/sor/` (zestaw `sor`, strona `/prawa-pacjenta/sor/`).
- **Nowy temat:** funkcja budująca warstwy w module danych tematu (wzór: `lib/monitoring/map.ts`), wpis w `lib/mapa/sets.ts`, `<PolandMap set="…" />` na stronie. Zastrzeżenia liczone z danych (np. `stat.homogeneityP` — czy różnice między województwami są większe niż przypadkowe) zamiast wpisanych na sztywno.

### Kolejki na SOR (Worker `zarobkilekarzy-sor`)

Bieżące kolejki na szpitalnych oddziałach ratunkowych zbiera osobny Worker z cronem (`workers/sor/`), niezależny od Workera strony. Mapa (`lib/sor/`) liczy z migawki klasę każdego SOR: najgorszy czas w kategoriach żółtej, zielonej i niebieskiej wobec normy z rozporządzenia w sprawie SOR (§ 6 ust. 9) — kategorie czerwona i pomarańczowa zawsze mają w API tekst normy, nie pomiar. Lokalny podgląd przed włączeniem crona: `PUBLIC_SOR_URL=/ścieżka/do/migawki.json npm run dev`. Wynik leży w bazie D1 `zarobki-sor`, a ten sam Worker podaje ostatnią migawkę pod `https://dane.zarobkilekarzy.pl/sor/teraz.json` (CORS `*`, minuta w cache Workera i przeglądarki — bazę czyta najwyżej raz na minutę na lokalizację Cloudflare). Każde pobranie to jednak wywołanie Workera liczone do dziennego limitu konta (Free: 100 tys.), dlatego kafelek na stronie głównej pobiera dane dopiero po przewinięciu do sekcji. Bazę i domenę zakłada OpenTofu w repozytorium infrastruktury (`cloudflare_sor.tf`).

- **Źródło:** `GET https://pacjent.gov.pl/api/v1/datatopsor/{numer}?_format=json&t={unix}` — system TOPSOR, tylko stan „teraz”, bez historii. Parametr `t` jest obowiązkowy: bez niego portal oddaje starą kopię z własnego cache. Lista oddziałów i numerów: `src/data/sor/lista.json` (5 par SOR dzieli numer, czyli jedną kolejkę).
- **Rytm:** cron co 2 minuty, każde uruchomienie pyta o 1/5 numerów (≤ 49 zapytań, najwyżej 6 naraz, limit 8 s na zapytanie) — każdy SOR odświeża się co 10 minut.
- **`teraz.json`:** `{ zrodlo, aktualizacja, etapy: [7 nazw], sor: { "<numer>": wpis } }`. Wpis poprawny: `t` (czas zapytania), `ts` (czas wygenerowania odpowiedzi), `w` (wszyscy pacjenci na SOR), `e` — 7 par `[liczba, "czas oczekiwania"]` w kolejności `etapy` (brakujący etap `[null, null]`), opcjonalnie `inne` — etapy spoza listy, surowo. Wpis błędu: `t`, `blad` (`HTTP 503`, `limit czasu`, `połączenie`, `format`, `brak danych`, `nieaktualne`) i `poprzedni` — ostatni poprawny pomiar, jeśli ma mniej niż 24 h. Pełny opis: komentarz na górze `workers/sor/src/index.js`.
- **Archiwum:** tabela `pomiary` — wiersz na uruchomienie (czas crona w sekundach unix jako klucz, partia, surowa partia jako JSON skompresowany gzipem, średnio 1,1 KB); z niej build liczy historię (niżej). Wiersz zajmuje w bazie ok. 1,34 KB, czyli ok. 1 MB na dobę; baza na planie Free mieści 500 MB, więc limit wypada ok. lutego–marca 2028. Nie `WITHOUT ROWID`: tam dłuższy wiersz dostaje całą stronę przepełnienia (4 KB) — tak było w tabeli `archiwum` (klucz ISO UTC), do której szły pomiary od 17.10.2026. Przeniesienie po wdrożeniu: `workers/sor/migracje/0001-pomiary.sql` (kroki uruchamiane ręcznie, opis w pliku).
- **Historia (strona):** fakty pod mapą, tabela wszystkich SOR z CSV i profil „zwykle o tej porze” w dymku mapy liczy build w `lib/sor/history.ts` z ostatnich 28 pełnych dni `pomiary` (czasu polskiego). D1 czyta jeden build na dobę — nocny przebieg `deploy.yml` (i ręczny) z `SOR_HISTORIA=d1`, ok. 21 tys. wierszy; wynik trafia do pliku statycznego `/prawa-pacjenta/sor/dane.json`, z którego biorą go pozostałe buildy (w CI bez migawki — raz D1, lokalnie — bez sekcji). Praca lokalna bez sieci: `SOR_HISTORIA=<katalog>` z plikami `wrangler d1 execute --json` (kolumny `uruchomienie`, `h` = `hex(gz)`); `SOR_HISTORIA=0` wyłącza historię. Profil w dymku pojawia się od 7 dni pomiarów; tabela (`components/sor/grid.ts`, datagrid) jest tylko po polsku — strona EN ma fakty i odnośnik. Definicje liczb: komentarz na górze `lib/sor/history.ts`, legenda tabeli. „Powyżej 2/4/6 godzin” to reguła portalu (liczbę podaje do 119, 239 i 359 minut), nie wybór szpitala.
- **Wdrożenie (pierwsze, w trzech krokach):** tofu zakłada bazę (`apply -target=cloudflare_d1_database.sor`), jej ID z `tofu output d1_sor_database_id` trafia do `workers/sor/wrangler.jsonc`, potem `npx wrangler deploy -c workers/sor/wrangler.jsonc` z katalogu głównego, a na końcu pełne `apply` przypina domenę (Custom Domain wymaga istniejącego Workera). Kolejne wdrożenia: sam `wrangler deploy`.
- **Włączenie odpytywania:** w `workers/sor/wrangler.jsonc` `triggers.crons` jest celowo puste — wdrożenie niczego nie uruchamia. Włączenie: `["*/2 * * * *"]` i ponowne wdrożenie (zmiana dociera w kilka minut); wyłączenie: z powrotem `[]`. Kod zakłada odstęp 2 minut (numer partii liczony z czasu crona).
- **Testy (bez sieci):** `node --test workers/sor/test/sor.test.js` (Node 22 nie przyjmuje samego katalogu). Schemat tabel i plik migracji sprawdzają na prawdziwym SQLite z `node:sqlite` (wbudowany w Node, wypisuje ostrzeżenie „experimental”). Lokalne uruchomienie (`npx wrangler dev -c workers/sor/wrangler.jsonc --test-scheduled`, potem `curl "http://localhost:8787/cdn-cgi/local/scheduled"`) pisze do lokalnej bazy D1 (`.wrangler/state`), ale pyta prawdziwe pacjent.gov.pl — 49 zapytań na wywołanie.

## Obrazki OG

Każda strona dostaje obrazek 1200×630 generowany przy buildzie (`lib/og`: Satori → sharp → PNG). `BaseLayout` sam wylicza adres ze ścieżki strony i dodaje `og:image` oraz `twitter:card`.

- **Artykuł** ma obrazek automatycznie: etykieta sekcji, tytuł, pierwsze zdanie `summary`, okładka (jeśli jest) i stopka ze źródłami i datą.
- **Nadpisanie** to pole `og` we frontmatterze, gdzie każde pole jest opcjonalne. Przykłady: `title` (z `\n` do ręcznego łamania), `lead: false`, `stat` (karta liczby), `photo` + `position`, `badge`, `media: none`. `illustration` to grafika w miejscu zdjęcia, która zostaje w kolorze (zdjęcia idą w skali szarości) i nie ma etykiety. Gotowa grafika to `image`, która omija generator. Literówka w nazwie pola zatrzymuje build.
- **Strona spoza kolekcji** to wpis w `src/data/og.ts`. Stopka jest domyślnie hasłem serwisu, chyba że wpis poda własną. Trasy bez wpisu dostają obrazek strony głównej, a build wypisuje ostrzeżenie `[og]`.
- **Podgląd:** `npm run dev` → `/og-podglad/`. Po zmianie frontmattera wystarczy odświeżyć stronę.
- **Zależności przypięte dokładnie:** `satori` 0.57.2 i `@fontsource/*` 5.3.0. Przed podbiciem Satori porównaj obrazki z poprzednimi, bo nowe wersje zmieniają silnik układu. Szczegóły w specyfikacji, §6.

## SEO

Zasada: strona mówi, czym jest; `lib/seo` decyduje, jak to opisać.

- **Strona** przekazuje do `BaseLayout` prop `seo` (`SeoInput` z `lib/seo/types.ts`): tytuł **bez** nazwy serwisu (szablon „ | zarobkilekarzy.pl” dopisuje `lib/seo/meta.ts`), opis, okruszki (te same co w `PageHeader`), rodzaj strony (`CollectionPage`, `FAQPage`) i byty (`article`, `dataset`, `termSet` — słownik pojęć jako DefinedTermSet). Artykuły i strony-indeksy mają to z layoutów. Stare `title`/`description` działają, ale build ostrzega `[seo]`.
- **Dane strukturalne:** jeden graf JSON-LD w `<head>` (`lib/seo/schema`): Organization, WebSite, WebPage, obrazek OG, BreadcrumbList i Article/Dataset, połączone przez `@id`. Nie dodawaj własnych `<script type="application/ld+json">`.
- **Pliki CSV w zbiorach danych:** strona, z której pochodzi plik z `/media/` (`DATASETS` w `lib/media/dane.ts`, pole `route`), dostaje w schema.org/Dataset `distribution` z tym plikiem (`datasetFiles()`, ArticleLayout) — także poza działem Dane (wtedy nazwa i opis zbioru z pliku).
- **Zaufanie (YMYL):** serwis jest anonimowy, więc wiarygodność pokazuje to, jak pracuje. Wydawca (`data/seo/identity.ts`) ma e-mail i `contactPoint`, `publishingPrinciples`, `correctionsPolicy` i `ownershipFundingInfo` (sekcje `/o-projekcie/`: zasady, sprostowania, finansowanie, „Jak powstają teksty” — pomoc AI pod redakcją człowieka); `/o-projekcie/` to `AboutPage`. Nagłówek artykułu ma podpis z linkiem do opisu pracy redakcji, a data aktualizacji wynika z historii zmian (zob. „Nowa treść”).
- **Frontmatter artykułu:** `seoTitle` (gdy tytuł H1 jest za długi), `description` (gdy `summary` > 160 znaków), `noindex`, `dataset` (dział Dane dostaje Dataset automatycznie).
- **Przekierowania:** tylko w `src/data/seo/redirects.ts` (z powodem). Build zapisuje z nich `dist/_redirects` (301 w Cloudflare) i `redirects` dla dev. **Stare adresy** dotychczasowej strony: `src/data/seo/legacy-urls.ts` — każdy ma mieć stronę, przekierowanie albo wpis w `removedUrls`.
- **Audyt po buildzie** (`integrations/seo/audit`): tytuły, opisy, canonical, `h1`, JSON-LD, martwe linki i `href="#"`, sitemap, przekierowania, kontrakt starych adresów. Raport w konsoli i w `.astro/seo-report.json`; `npm run build:release` przerywa build na błędach.
- **Pliki dla robotów:** `robots.txt`, `llms.txt`, `rss.xml`, `site.webmanifest`, ikony (`favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png` — rastrowane z `public/favicon.svg`; `icon-maskable-512.png` z `src/lib/seo/icon-maskable.svg`, bo szczyt EKG wychodzi poza strefę bezpieczną maski). Politykę wobec botów AI i Markdown dla agentów ustawia się w panelu Cloudflare, nie w repo.

## Wyszukiwarka

Statyczny indeks bez serwera i bez zależności. Build składa go z tych samych źródeł co reszta serwisu, a przeglądarka przeszukuje go w pamięci.

```
build:        kolekcje + konfiguracja → lib/search/build.ts → /szukaj.json (indeks odwrócony z wagami)
przeglądarka: fokus w polu → loadSearch() pobiera /szukaj.json raz → createSearch() → wyniki przy każdym znaku
```

- **Dwa wejścia, jeden komponent:** okno ⌘K (`SearchDialog`) i strona `/szukaj/?q=…` używają tego samego `SearchBox`, czyli custom elementu `<zl-search>` z polem, listą i klawiaturą (wzorzec ARIA combobox). Okno dokłada tylko otwieranie i zamykanie oraz link „Wszystkie wyniki” na stronę. Strona dokłada zapisywanie zapytania w adresie, więc wyniki można podlinkować, a przycisk Wstecz do nich wraca. Kolejne miejsce z wyszukiwarką to `<SearchBox id="…" popular={…} />`, bez nowego JS.
- **Kontrakt `SearchBox`:** sterujesz nim jak użytkownik: ustawiasz wartość pola i wysyłasz zdarzenie `input`. Enter „klika” wskazany wynik, więc rodzic obsługuje mysz i klawiaturę jednym nasłuchem na kliknięcie.
- **Jedna analiza tekstu** (`lib/search/text.ts`) dla treści i zapytań: małe litery, bez polskich znaków („zadluzenie” = „zadłużenie”), bez słów pomijalnych.
- **Odmiana:** słowo zapytania jest skracane do rdzenia lekkim stemmerem i pasuje do słów indeksu, które się od niego zaczynają („lekarzom” → lekarz, lekarze, lekarzy). To samo obsługuje niedokończone słowo w trakcie pisania. Identyczne słowo waży dwa razy więcej niż inna forma.
- **Ranking:** wagę słowa w dokumencie liczy build. Tytuł ma 8, słowa z adresu i nagłówki sekcji po 4, lead i „W skrócie” 2, treść 1, a powtórzenia liczą się najwyżej 3 razy. Przeglądarka mnoży tę wagę przez rzadkość słowa (IDF) i sumuje. Wynik musi zawierać wszystkie słowa zapytania.
- **Sekcje:** gdy zapytanie pasuje do nagłówka `##`, a nie do tytułu, wynik prowadzi prosto do sekcji (kotwice jak w spisie treści).
- **Wydajność:** strony nie niosą indeksu w HTML. Plik pobiera się dopiero, gdy kursor albo fokus trafi na lupę lub pole, albo po skrócie klawiszowym. Słownik jest posortowany, więc słowa o wspólnym początku znajduje wyszukiwanie binarne. „Popularne” renderuje serwer, bez czekania na indeks.
- **Nowe źródło** (np. strona spoza kolekcji) to wpis w `searchExtras` (`data/navigation.ts`). Nowe pole do przeszukiwania to jedna linia w `FIELDS` (`build.ts`).
- **Granica skali:** jeden plik sprawdza się do kilkuset stron. Gdy `/szukaj.json` przekroczy ~150 kB po kompresji, indeks trzeba podzielić albo przejść na Pagefind. `SearchBox` zależy tylko od `loadSearch()` i `SearchHit`, więc wymiana silnika nie dotyka UI.

## Linki do sekcji i do fragmentu

Dwa mechanizmy w `BaseLayout`, bez pracy w komponentach treści:

```
kotwica:   nagłówek h2/h3 w <main> → ikona linku (site/HeadingAnchors) → klik: adres #sekcja w schowku i w pasku adresu
fragment:  zaznaczenie w <main> → pasek „Kopiuj link / Udostępnij” (site/SelectionShare) → #sekcja:~:text=początek,koniec
odbiorca:  przeglądarka sama przewija i zaznacza fragment (Text Fragments), wygląd = ::target-text w base.css
```

- **Jaki adres ma sekcja** — jedna reguła w `scripts/anchors.ts`: `data-anchor` → id regionu, który nagłówek nazywa (`<section id="jawnosc" aria-labelledby="jawnosc-title">` daje `#jawnosc`) → id nagłówka → id kontenera, który nagłówek otwiera (`<li id="…"><h3>`). Nagłówek bez żadnego z nich (tytuł karty) nie dostaje ikony; `data-no-anchor` wyłącza ją wprost. Nowa sekcja z ładną kotwicą = `id` + `aria-labelledby` na `<section>`.
- **Id nagłówków Markdown/MDX** bez polskich znaków: `lib/markdown/heading-ids.ts` (wtyczka Sätteri w `astro.config.mjs`), np. `#sprawdz-swoje-ikp-instrukcja`. Spis treści i wyszukiwarka biorą te same id z `render()`.
- **Link do fragmentu** to standard Text Fragments (Chrome, Edge, Safari 16.1+, Firefox 131+). Generator (`scripts/text-fragment.ts`) dzieli tekst na bloki jak przeglądarka, dociąga zaznaczenie do całych słów i dokłada kontekst (`prefiks-,` / `,-sufiks`) tylko wtedy, gdy te same słowa padły wcześniej. Przed dyrektywą stoi kotwica sekcji: gdy tekst zostanie poprawiony, link prowadzi przynajmniej do właściwej sekcji.
- **Wyłączenie paska** dla obszaru (np. interaktywne narzędzie): `data-no-share`. Pola formularzy i `<dialog>` są wyłączone zawsze.
- **Dopisek przy kopiowaniu** (`site/CopySource`): tekst skopiowany ze strony (Cmd/Ctrl+C, menu) dostaje „źródło: zarobkilekarzy.pl”, w wersji sformatowanej z linkiem do strony. Linki z przycisków serwisu idą przez `navigator.clipboard`, więc dopisku nie dostają; pola formularzy też nie.

## Przejścia między podstronami

Natywne przejścia przeglądarki między dokumentami (View Transitions dla MPA), bez `<ClientRouter />` Astro: każda podstrona ładuje się jak zwykle, więc skrypty komponentów nie potrzebują `astro:page-load`, a stan i historia działają jak dotąd.

- **Włączenie i animacja:** `@view-transition` w `base.css` (sekcja „Przejścia między podstronami”). Cała strona przenika się jako jedna warstwa animacją przeglądarki (250 ms), a nasz CSS ustawia tylko czas i krzywą na `::view-transition-group(root)`. Nagłówek, pasek i tło są takie same na obu stronach, więc stoją w miejscu. Przenika się tylko to, co się zmienia, np. wyróżnienie aktywnej pozycji menu.
- **Nie nadpisywać `animation` na `::view-transition-old/new(root)`.** Przeglądarka miesza obie strony trybem `plus-lighter`, więc piksele wspólne (pasek, tło, menu) stoją w miejscu. Skrót `animation` kasuje to mieszanie, a w połowie przejścia prześwituje tło i miga cała strona: ciemny pasek u góry rozjaśniał się prawie do bieli.
- **Menu nie drga:** każda pozycja ma miejsce na swoją pogrubioną wersję (`::before` z `data-label`), więc aktywna pozycja nie przesuwa pozostałych przy zmianie sekcji.
- **Prefetch:** `prefetch` w `astro.config.mjs` (wszystkie linki, strategia `hover`). Strona przychodzi z cache, więc przejście startuje od razu. Wyłączenie dla linku: `data-astro-prefetch="false"`.
- **Żadnych `view-transition-name` na elementach.** Safari nie rysuje nowej wersji nazwanego elementu do końca przejścia: stara wersja gaśnie, a nowa pojawia się dopiero na końcu. Tak mrugał nazwany nagłówek, a w teście także zwykły `h1`. Chrome robi to dobrze, ale strona ma wyglądać tak samo w obu przeglądarkach. Dyrektyw `transition:name` / `transition:animate` też nie używamy: to API `<ClientRouter />`, a bez niego `fade` odwołuje się do brakujących klatek kluczowych.
- **Strona przewinięta:** nagłówek jest przyklejony u góry, a nowa strona zaczyna się od paska nad nim. Przy kliknięciu w menu w połowie lektury nagłówek przez 250 ms przenika się między tymi dwoma miejscami (o wysokość paska, 38 px).
- **Bez przejścia:** przeglądarki bez obsługi przejść między dokumentami (są w Chrome/Edge 126+ i Safari 18.2+) i ustawienie „ogranicz ruch” (`prefers-reduced-motion`). Wtedy działa zwykła nawigacja.

## Egzamin LEK

Symulator `/egzamin/`: kreator testu, przeglądarka bazy i test w trybie skupienia. Funkcje jak na obecnej stronie (tryby nauka / szybki test / pełny egzamin, LEK i LDEK, sesje, dziedziny, losowa kolejność, mapa pytań, oznaczanie, notatki, pauza, skróty klawiszowe, wynik na tle progu i przeciętnego zdającego, dziedziny, baza vs nowe, porównanie z innymi, przegląd odpowiedzi, `window.lek`). Zmienia się sposób podania:

- **Test to pełnoekranowy `<dialog>`**, nie fragment długiej strony. Pasek górny (tryb, licznik, czas albo bilans dobrych i złych, mapa, „Zakończ”) i dolny (Poprzednie / Oznacz / Notatka / Następne — pod kciukiem) stoją w miejscu; przewija się tylko treść pytania. Wpis `#test` w historii: „Wstecz” zamyka test, odświeżenie wraca do pytania.
- **Mapa pytań** jest kolumną obok pytania (≥ 1181 px), szufladą (tablet) albo arkuszem od dołu (telefon). Filtry: bez odpowiedzi, oznaczone, z notatką, błędne; przy > 200 pytaniach — zakresy numerów.
- **Nauka:** po odpowiedzi statystyka sali rysuje się w samych wierszach odpowiedzi (paski), werdykt pod spodem, fokus przechodzi na „Następne”. Przed odpowiedzią przycisk mówi „Pomiń”.
- **Pauza** zasłania pytanie (żeby nie była dodatkowym czasem). Wyjście z okna wstrzymuje test na czas; czas poza stroną się nie liczy.
- **Podsumowanie:** wynik na jednej skali z progiem i przeciętnym zdającym, paski dziedzin ze znacznikiem sali, histogram innych, przegląd z filtrami i „Powtórz błędne w trybie nauki”.

**Pytanie na stronie głównej** to `QuestionTeaser` z tym samym renderem i zachowaniem co tryb nauki (klucz, statystyka sali, werdykt). Pytanie bierze z banku (`sampleQuestion` w `data/egzamin.ts`), więc zapowiedź i test zawsze wyglądają tak samo.

Warstwy: `lib/egzamin` nie zna DOM — `ExamSession` to jedyne miejsce zmian stanu (UI i `window.lek` wołają te same metody i słuchają zdarzenia `change`). `client/render.ts` to czyste funkcje stan → HTML, wspólne dla testu, przeglądu wyniku i bazy (style `.lq-` w `question.css`, bo znaczniki powstają w przeglądarce). Konfiguracja (tryby, sesje, dziedziny) trafia do klienta jako JSON z `data/egzamin.ts`; pytania — osobnym plikiem pobieranym przed startem.

**Wersja demonstracyjna.** `data/egzamin-demo.ts` ma 40 przykładowych pytań redakcji (nie z bazy CEM) ze statystykami przykładowymi, a `lib/egzamin/source.ts → expandDemo` rozkłada je powtarzalnie na 200 numerów każdej sesji, żeby UI pracował w pełnej skali. Rozkład wyników innych (`DEMO_DISTRIBUTION`) też jest przykładowy, a wynik nigdzie nie jest wysyłany. Produkcja: `loadPool` czyta pliki sesji z jawnej bazy CEM (ten sam kształt `QuestionBody` + `session`, `nr`), bez `expandDemo`; zbiórka wyników wymaga backendu.

**Wyniki na tej stronie.** Ukończony test trafia anonimowo do D1 (`worker/egzamin.js`, `POST /api/egzamin`: dzień, tryb, sesja, punkty, czas — bez IP i identyfikatorów), a sekcję ze zbiorczymi wynikami (`SiteStats`) składa build w `lib/egzamin/site-stats.ts`. Grupowanie czyta całą tabelę wyników, a dzienny limit odczytów D1 jest wspólny dla konta (plan Free: 5 mln wierszy), więc bazę odpytuje jeden build na dobę: nocny przebieg `deploy.yml` (i ręczny) z `EGZAMIN_STATS=d1`. Wynik trafia do pliku statycznego `/egzamin/statystyki.json`. Każdy inny build — po pushu w CI i lokalny — pobiera tę migawkę z produkcji i publikuje ją dalej, bez Workera i bez D1. Gdy produkcja migawki nie ma, build w CI raz czyta D1, a lokalny pomija sekcję; `EGZAMIN_STATS=0` wyłącza statystyki.

## Prawa pacjenta

`/prawa-pacjenta/` układa prawa według sytuacji czytelnika, a nie rozdziałów ustawy: „jestem u lekarza”, „potrzebuję dokumentacji”, „coś poszło nie tak”, „szkoda w szpitalu”. Treść jest w `data/prawa-pacjenta.ts`, kształty w `lib/pacjent/types.ts`, komponenty w `components/pacjent/`.

- **Odpowiedź od razu:** każde prawo to pytanie z odpowiedzią jednym słowem („Tak”, „0 zł”), jednym-dwoma zdaniami i artykułem ustawy. Szczegóły i zdanie „Możesz powiedzieć” są po rozwinięciu. Kotwica (`#kopia-dokumentacji`) otwiera odpowiedź, a „Wyślij tę odpowiedź” daje link do niej (na telefonie arkusz udostępniania).
- **Gdzie zgłosić** to wybór sytuacji z celem widocznym na zwiniętym wierszu. **Terminy** stoją na jednej liście od najkrótszego, a krótkie są oznaczone słowem, nie tylko kolorem. **Fundusz czy sąd** to tabela obu dróg z haczykiem (przyjęcie świadczenia = rezygnacja z sądu) nad nią.
- **Dostępność:** treść w `rem`, więc rośnie z ustawieniem czcionki w przeglądarce i z przełącznikiem „Większy tekst” (wspólny z nagłówkiem, patrz „Dostępność: wielkość tekstu i kontrast”). Infolinia jest na pierwszym ekranie telefonu, a po przewinięciu wraca jako przycisk pod kciukiem (`CallBar`). Cele dotyku mają co najmniej 44 px. Teksty nie używają form rodzajowych w czasie przeszłym („gdy dowiesz się”). Pytania trafiają do danych strukturalnych FAQPage i jako sekcje do wyszukiwarki (`searchExtras`).
- **Kwoty z datą:** limity opłat za kopie (`DOC_FEES`) liczą się z przeciętnego wynagrodzenia GUS — co kwartał trzeba podmienić płacę i okres. Kwoty Funduszu (`FUND`) są waloryzowane co roku od 6 września. `page.checked` to data weryfikacji widoczna na stronie, karcie i PDF.
- **Wydruk strony** (Ctrl+P) rozwija wszystkie odpowiedzi i chowa nawigację.

**PDF-y** generuje build (`lib/pacjent/pdf.ts` na `lib/pdf/typeset.ts`, pdfkit 0.20.2 przypięty dokładnie) z obiektu `card`, który jest wyciągiem z tej samej treści:

- `karta.pdf` — dwie karty na kartce A4 drukowanej jednostronnie: przetnij na pół, złóż połówkę i masz kartę A6 z przodem i tyłem, bez druku dwustronnego i bez papieru A6.
- `duzy-druk.pdf` — dwie strony A4, tekst 14 pt.
- Oba są czarno-białe i otagowane (język, tytuł, struktura H1/H2/P/L; druga karta na arkuszu i linie to dekoracja). Fonty to te same statyczne WOFF z @fontsource; łamanie wierszy jest własne, bo polskie litery są w osobnym podzbiorze fontu. Gdy tekst nie zmieści się w ramce, build kończy się błędem z nazwą miejsca (`fit`), a nie wydrukiem uciętej karty.
- `/prawa-pacjenta/druk/` to wybór wersji, instrukcja w trzech krokach i podgląd karty w HTML (`CardPreview`, te same dane, proporcje 1:1 z PDF). Rozmiar przy przyciskach pochodzi z prawdziwego pliku (`lib/pacjent/downloads.ts`).

## Projekt ustawy: PDF

PDF obywatelskiego projektu nowelizacji art. 27a składa build z tego samego źródła co strona `/postulat/projekt-ustawy/`, czyli z `data/projekt-ustawy.ts`. Skład robi `lib/projekt/pdf.ts` na `lib/pdf/typeset.ts`, plik wystawia endpoint `pages/projekt-nowelizacji/[name].pdf.ts`.

- **Adres** to `projekt.pdf.href` (`/projekt-nowelizacji/projekt-nowelizacji-art27a-v<wersja>.pdf`), wyliczany z `version`. To adres ze starej wersji serwisu, linkowany z zewnątrz.
- **Liczba stron** przy linkach („PDF (8 stron)” na `/postulat/` i na stronie projektu) pochodzi z gotowego pliku (`lib/projekt/download.ts → projektPdfPages`). W danych nie ma jej wpisanej.
- **Układ** jest jak w wersji 0.3 sprzed przebudowy serwisu: strona tytułowa, nota o statusie z objaśnieniem oznaczeń (`legend`), tekst projektu, uzasadnienie i załączniki A–C. Każda część zaczyna się od nowej strony.
  - Na każdej stronie jest znak wodny „wersja wstępna” i stopka „n / liczba stron”. Liczbę stron daje drugi przebieg składu.
  - Akapit przechodzi na następną stronę co najmniej dwoma wierszami, nagłówek nie zostaje sam u dołu strony, a wiersz tabeli przenosi się w całości.
  - `[?]` w treści drukuje się na czerwono (`--bad`), a nowe ustępy w Załączniku A mają kobaltowe tło i znacznik „nowy”, jak w `Comparison`.
- **Anonimowość:** PDF nie ma pola Author (`createPdf({ author: null })`), a kontakt to wyłącznie `contact.email`. Po buildzie sprawdź `pdfinfo` i to, że `strings plik.pdf | grep -i users` nic nie zwraca.
- **Nowa wersja projektu:**
  1. Zamroź PDF bieżącej wersji: skopiuj `dist/projekt-nowelizacji/projekt-nowelizacji-art27a-v<stara>.pdf` do `public/projekt-nowelizacji/`. Wpis w `history` i adres starej wersji muszą działać dalej, a endpoint składa tylko bieżącą wersję.
  2. W `data/projekt-ustawy.ts` zmień `version`, `projekt.date` i tekst, a do `history` dopisz nową wersję.
  3. Zbuduj serwis i obejrzyj strony PDF, np. `pdftoppm -r 80 -png`.
- **Kolizja z `public/`:** plik w `public/` pod adresem bieżącej wersji kończy build błędem, bo dwa źródła tego samego pliku nadpisałyby się po cichu.

## Symulator podaży lekarzy

`/analizy/symulator-podazy-lekarzy/`: ustawiasz nabór na medycynę, a model pokazuje, ilu lekarzy będzie do 2062 r. Zasada układu: **wynik zawsze w polu widzenia**.

- **Desktop:** ustawienia w lewej kolumnie (01 scenariusz, 02 jeden limit od 2027/28, 03 nabór rok po roku, 04 losy rocznika, 05 założenia), wynik w prawej — przyklejony (`position: sticky`), więc każdy ruch suwaka widać bez przewijania.
- **Telefon (≤ 860 px):** `.sim__out` ma `display: contents`, więc karta wyniku (liczba na 2050 r. + wykres) staje się elementem całego symulatora i przykleja się pod nagłówkiem strony, a kroki przewijają się pod nią. Statystyki i komentarz idą na koniec.
- **Wykresy** rysują czyste funkcje `lib/podaz/charts.ts` (stan → treść `<svg>`) w rozmiarze kontenera (`viewBox` = piksele), więc podpisy osi mają zawsze 11 px. Ten sam kod daje pierwszy render na serwerze i każdą klatkę w przeglądarce; style `c-*` przez `:global()`.
- **Nabór rok po roku:** mysz rysuje (szybkie przeciągnięcie interpoluje lata pomiędzy), kliknięcie i stuknięcie otwierają dymek z dokładną liczbą, klawiatura: strzałki/Shift/Home/End/Enter. Palec na wykresie przewija stronę.

Rachunek to `lib/podaz/model.ts` — port 1:1 z poprzedniej wersji serwisu (`symulatorPodazy.ts`), sprawdzony porównaniem obu modeli na wszystkich scenariuszach i siatce ustawień. Przy ustawieniach domyślnych rok 2026 równa się rejestrowi NIL co do osoby; komentarz słowny liczy `lib/podaz/summary.ts`. Dane z datą: rejestr NIL (stan na 31.12.2025), limit 2025/26, GUS 2024 — przy nowym wydruku rejestru podmień `AGE_GROUPS`, `OVER_70` i `REGISTER_*`.

## Działaj

- **Narzędzie „Napisz do polityka” jest wyłączone** (`writeToolOn = false` w `src/data/dzialaj.ts`, decyzja z 16.10.2026): karta jest wyszarzona z dopiskiem „Wkrótce”, sekcja `#napisz` się nie renderuje, a tytuł, opis, OG i wyszukiwarka pomijają list. Włącz na etapie szukania poparcia posłów — razem z treścią listu przygotowaną na ten etap (`letterTemplate`).

`/dzialaj/`: karty działań od najprostszego (udostępnij, napisz do polityka, poleć projekt, prześlij dane, zapytaj szpital; newsletter tylko przy `newsletterOn`) i narzędzie „Napisz do polityka” (`#napisz`, stary adres `/dzialaj/napisz/` przekierowuje). Etap projektu i wersja w nagłówku i w liście pochodzą z `data/projekt-ustawy.ts`.

- **Adresy:** `data/adresaci.json` (kopia zweryfikowanej listy, pole `zrodlo` przy każdym wpisie). Odświeżenie: podmień `osoby` i `stan_na`; wpisy ze `status: "niepotwierdzony"` zostają w pliku, ale strona ich nie pokazuje. Przy biurach partii funkcja bez nazwisk liderów.
- **List:** jeden szablon w `data/dzialaj.ts` (`letterTemplate`), składany przez `lib/dzialaj/letter.ts` na serwerze (wersja bez JS: „Szanowni Państwo”) i w przeglądarce. Zwrot z `rodzaj`, funkcji i izby (`greeting` w `data/adresaci.ts`).
- **Długość mailto:** build liczy najgorszy przypadek (najdłuższy adres i zwrot, podpis do limitu pola w polskich znakach) i przerywa się powyżej 2000 znaków. Po zmianie szablonu sprawdź build; gdy link mimo to byłby za długi, przycisk otwiera pocztę z samym tematem i kopiuje treść.
- **Prywatność:** narzędzie nic nie wysyła i nie używa localStorage. Bez JS strona to lista adresów z linkami mailto (sam temat) i list do skopiowania.

## Zadłużenie szpitali

`/dane/zadluzenie-szpitali/` to artykuł MDX z licznikiem obok tytułu (slot `aside` nagłówka zamiast „W skrócie”, przypisany w `ASIDES` w `pages/[section]/[id].astro`).

- **Licznik to szacunek, nie odczyt.** Kotwica = ostatni kwartał MZ: dług wszystkich SPZOZ + szpitali-spółek i instytutów (te MZ podało raz, za koniec 2025 r.; dalej rosną w tempie SPZOZ). Tempo = wzrost SPZOZ w ostatnich czterech kwartałach, składany w sposób ciągły. Serwer renderuje stan z chwili buildu, `<zl-debt-counter>` przelicza go na żywo (`prefers-reduced-motion` — raz).
- **Projekcja tylko na 12 miesięcy:** słupki kwartałów, których koniec wypada najwyżej rok od dziś, w tempie licznika; linia przerywana — wolniejszy wariant (średnie tempo z pięciu lat, IV kw. do IV kw.). Znacznik „teraz” poprawia skrypt według zegara czytelnika.
- **Aktualizacja co kwartał** (MZ publikuje ok. 2–3 miesiące po końcu kwartału): dopisz kwartał do `SPZOZ_QUARTERS`, podmień `REGIONS` w `data/zadluzenie.ts`; licznik, tempa, wykres, tabela i liczby w treści (wyrażenia `{…}`) przeliczą się same. Ręcznie: `summary`, `stat` i `og` we frontmatterze oraz tezy opisowe (najszybszy wzrost od 2004 r., województwa z najszybszym wzrostem).

## Uwagi

- Liczby pochodzą z obecnego zarobkilekarzy.pl. Etykiety „Dokładna” i „Szacunek” wymagają weryfikacji redakcyjnej.
- Linki do podstron to na razie `#`. Newsletter jest makietą i niczego nie wysyła.
