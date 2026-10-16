# System SEO — plan architektury

Status (15.10.2026): **wdrożone** (etapy 1–5 z §11) — `src/lib/seo/`, `src/components/seo/`, `src/data/seo/`, `integrations/seo/`, prop `seo` w `BaseLayout` na wszystkich stronach. Różnice wobec planu i stan audytu po wdrożeniu: §13. Plan powstał na podstawie audytu v2 (scratch build, 22 strony) w porównaniu z żywą zarobkilekarzy.pl (sitemap, nagłówki HTTP, HTML) i jej repozytorium.

Zakres: wszystko, co decyduje o tym, jak wyszukiwarki i platformy widzą serwis. Wchodzą tu `<head>`, dane strukturalne, adresy i przekierowania, pliki dla robotów oraz kontrola jakości w buildzie. Brakujących podstron („404”) **nie** rozwiązujemy tutaj, bo uzupełnia je równolegle inna sesja. Ten plan daje tylko **mechanizmy**: rejestr przekierowań, kontrakt starych adresów, stronę 404 i audyt, które pokażą, czego jeszcze brakuje.

## 1. Stan wyjściowy (skrót audytu)

| Obszar | v2 dziś | Live |
|---|---|---|
| `title`, `description`, `canonical`, OG, Twitter | jest, liczone w `BaseLayout` | jest |
| Szablon tytułu | każda strona skleja `${x} \| ${site.name}` sama (13 miejsc) | centralnie |
| `robots` meta | brak (domyślne) | `index,follow,max-image-preview:large`, `noindex` na /szukaj, /druk, /admin |
| JSON-LD | rozproszony: ArticleLayout, Breadcrumbs (w `<body>`), 2 strony ręcznie; bez escapowania `<` | jeden zestaw w BaseLayout, escapowany |
| Organization / WebSite | brak | na każdej stronie |
| Article: `image`, `author` | brak | jest |
| Sitemap | `@astrojs/sitemap` bez `lastmod`, /szukaj w mapie | `lastmod` z mapy dat, filtr noindex |
| Przekierowania | `redirects` w configu → meta refresh (bez 301) | `public/_redirects`, 17 linii historii |
| 404 | brak strony | `404.astro` |
| RSS, llms.txt, ikony, manifest, `_headers` | brak | są |
| Linki do `#` | 34 na stronie głównej (zapowiedzi + stopka) | — |
| Martwe linki wewnętrzne | 12 celów (z treści MDX) | — |

Hosting live to **Cloudflare Pages** (`wrangler.toml` → `pages_build_output_dir`). v2 wejdzie w ten sam projekt, więc obowiązują `_redirects` (2000 statycznych + 100 dynamicznych reguł), `_headers` (100 reguł) i automatyczne serwowanie `404.html` ze statusem 404. Pages sam normalizuje ukośnik na końcu (308 `/dane` → `/dane/`).

## 2. Zasady

1. **Jedno źródło prawdy na fakt.** Tytuł, opis i daty strona deklaruje raz. `<head>`, JSON-LD, sitemap, RSS i llms.txt są z tego wyprowadzane, a nie wpisywane drugi raz.
2. **Strona mówi, czym jest; moduł SEO decyduje, jak to opisać.** Ten sam podział co w OG (`lib/og/registry.ts`). Strony i layouty podają fakty (tytuł, typ, daty, okruszki), a znaczniki, szablony i graf schema.org buduje `lib/seo`.
3. **Zero pracy przy typowej stronie.** Artykuł z kolekcji i strona-indeks dostają komplet SEO z layoutu. Ręcznie uzupełnia się tylko wyjątki.
4. **Build pilnuje reguł.** Każda konwencja z tego dokumentu ma regułę w audycie (§9). Czego nie da się sprawdzić automatycznie, tego nie traktujemy jako zasady.
5. **HTML jest prawdą dla plików wtórnych.** Sitemap i audyt czytają wygenerowany HTML, a nie osobną listę. Strona z `noindex` sama wypada z mapy i nie da się tego rozjechać.

## 3. Wtyczki czy własny kod

Decyzja: **oficjalne integracje Astro tam, gdzie generują format pliku; własny, mały moduł tam, gdzie chodzi o model danych i reguły serwisu.** Bez wtyczek społecznościowych do SEO.

| Potrzeba | Wybór | Uzasadnienie |
|---|---|---|
| sitemap | `@astrojs/sitemap` (już jest) + własny `serialize` | format, indeks i limity wpisów robi integracja; `lastmod` i wykluczenia bierzemy z HTML (§8) |
| RSS | `@astrojs/rss` (nowa zależność, oficjalna) | poprawne XML i escapowanie, ten sam zespół co sitemap; live używa tego samego |
| znaczniki `<head>` | **własne** (`components/seo/SeoHead.astro`) | `astro-seo` i podobne to tylko drukarki tagów. Nie znają naszego OG, kolekcji ani okruszków, a dokładają zależność, która nie nadąża za Astro (API integracji zmieniło się w v5 i v6) |
| JSON-LD | **własne** buildery + `schema-dts` jako *devDependency* (tylko typy, Google, zero kodu w runtime) | `astro-seo-schema` to cienka nakładka na te same typy. Graf z `@id` (§6) i tak trzeba złożyć samemu |
| robots.txt, llms.txt | **własne** endpointy (robots już jest) | po kilkanaście linii; `astro-robots-txt` / `astro-llms-txt` nic nie wnoszą |
| `_redirects` | **własny** generator w integracji | jedno źródło dla dev (`redirects` w configu) i produkcji (301 na krawędzi Cloudflare) |
| audyt HTML | **własna** integracja + `ultrahtml` (jawna zależność; jest już w drzewie jako zależność Astro 7.3.8) | reguły są nasze (tytuły, kontrakt starych adresów, `href="#"`). Linkcheckery społecznościowe sprawdzają tylko linki |
| ikony | statyczne pliki w `public/` + jednorazowy skrypt na `sharp` (już jest) | bez wtyczki do faviconów |

Projekt pilnuje pochodzenia zależności (satori przypięte po sprawdzeniu provenance). Ten wybór dokłada **jedną** zależność runtime (`@astrojs/rss`) i dwie buildowe (`ultrahtml` przypięte do wersji, której używa Astro, oraz typy `schema-dts`).

## 4. Architektura

```
treść i dane                    model SEO (czyste TS)                    wyjście
──────────────                  ─────────────────────                    ───────
kolekcja articles ─┐
data/*.ts (strony) ├─▶ layouty ─▶ SeoInput ─▶ lib/seo/meta.ts ─────▶ SeoHead.astro ─▶ <head>
data/navigation    ┘   (Article/   (props)    lib/seo/schema/*  ─────▶ JsonLd.astro  ─▶ <script ld+json>
                        Index/Base)

data/seo/redirects.ts ──────────────────────────────────────────────▶ astro.config redirects (dev)
data/seo/legacy-urls.ts                                                integrations/seo ─▶ dist/_redirects
                                                                                      ─▶ sitemap serialize
dist/**/*.html ──────────────────────────────────▶ integrations/seo/facts.ts ─▶ audyt (raport / błąd buildu)
```

Warstwy zgodne z README: `lib/seo` nie importuje kolekcji ani `astro:*`, tylko czyste funkcje i typy. Dzięki temu korzystają z niego zarówno komponenty, jak i integracja w `astro.config.mjs`. Dane trafiają do niego przez layouty, tak jak konfiguracja serwisu trafia do komponentów przez `BaseLayout`.

### Pliki

```
src/lib/seo/
  config.ts        tożsamość: nazwa, adres, szablon tytułu, locale, wydawca (logo, sameAs, publishingPrinciples)
  types.ts         SeoInput, ResolvedSeo, Crumb, RobotsDirectives
  meta.ts          resolveSeo(input, url) → ResolvedSeo: pełny tytuł, opis, canonical, robots, OG/Twitter, article:*
  robots.ts        domyślne dyrektywy + reguły robots.txt (jedna lista dla meta i pliku)
  urls.ts          absoluteUrl(), normalizePath() — ukośnik na końcu, bez query/fragmentu
  schema/
    ids.ts         schemat @id: /#organization, /#website, {url}#webpage, #breadcrumb, #article, #dataset
    nodes.ts       organization(), website(), webPage(), breadcrumbList(), article(), dataset(), faqPage(), collectionPage()
    graph.ts       buildGraph(resolved, entities) → { '@context', '@graph': [...] }
    serialize.ts   bezpieczny JSON do <script>: escape <, >, &, U+2028/2029
src/data/seo/
  redirects.ts     rejestr przekierowań (dane, z komentarzem „dlaczego” przy każdej grupie)
  legacy-urls.ts   kontrakt starych adresów: migawka sitemap live + źródła z live _redirects
src/components/seo/
  SeoHead.astro    renderuje ResolvedSeo (title, meta, link rel, OG, Twitter, alternate RSS, ikony)
  JsonLd.astro     renderuje graf jednym <script type="application/ld+json">
integrations/seo/  (narzędzie buildu, poza kodem strony, jak integrations/ na live)
  index.ts         integracja Astro: hooki config:done / routes:resolved / build:done
  facts.ts         readPageFacts(outDir, path): parsowanie <head> z dist (ultrahtml), cache
  redirects.ts     zapis dist/_redirects z rejestru (warianty z i bez „/”)
  sitemap.ts       serialize() dla @astrojs/sitemap na podstawie facts
  audit/           jedna reguła = jeden plik; rules.ts składa listę; report.ts drukuje i zapisuje JSON
src/pages/
  robots.txt.ts    (jest) → z lib/seo/robots.ts
  rss.xml.ts       @astrojs/rss z lib/content
  llms.txt.ts      z kolekcji + hubów z data/navigation
  404.astro        mechanizm: BaseLayout + noindex (treść później)
public/
  _headers, site.webmanifest, favicon.ico, apple-touch-icon.png, icon-192/512(+maskable).png
```

## 5. Model danych

### `SeoInput`, czyli co strona przekazuje do layoutu

```ts
interface SeoInput {
  title: string;                 // bez sufiksu — szablon dodaje „ | zarobkilekarzy.pl”
  titleAbsolute?: boolean;       // strona główna i wyjątki: tytuł bez szablonu
  description: string;
  social?: { title?: string; description?: string };   // og/twitter, gdy mają być inne
  type?: 'website' | 'article';
  robots?: { index?: boolean; follow?: boolean };      // domyślnie index, follow
  canonical?: string;            // tylko dla duplikatów (np. wersja do druku → oryginał)
  dates?: { published?: Date; modified?: Date };
  section?: string;              // article:section
  breadcrumbs?: Crumb[];         // te same, które widzi czytelnik
  entities?: SchemaNode[];       // główny byt: Article, Dataset, FAQPage, CollectionPage…
}
```

`BaseLayout` dostaje `seo: SeoInput` zamiast `title/description/ogTitle/ogType`. Przejście jest bezpieczne: na czas migracji stare propsy mapują się na `SeoInput`. Pełny tytuł, `canonical`, obrazek OG (z `ogImageFor`, bez zmian) i graf liczy BaseLayout przez `resolveSeo` + `buildGraph`.

### Kto wypełnia `SeoInput`

| Producent | Skąd bierze dane |
|---|---|
| `ArticleLayout` | frontmatter: `title`, `summary`, `date`, `updated`, kategoria → `section`, okruszki z sekcji, `sources` + przypisy → `citation` |
| `IndexLayout` | propsy strony-indeksu + lista artykułów działu → `CollectionPage` + `ItemList` |
| strony ręczne (`postulat`, `program`, `prawa-pacjenta`…) | ich `data/*.ts`. Tam już są `docTitle` i `lead`, więc dochodzi tylko typ bytu |

### Nowe, opcjonalne pola frontmattera artykułu

| Pole | Po co |
|---|---|
| `seoTitle` | gdy tytuł H1 jest za długi albo nie zawiera frazy, której ludzie szukają (audyt ostrzega > 60 znaków) |
| `description` | gdy `summary` ma > 160 znaków; domyślnie meta description = `summary` |
| `dataset` | `{ license, temporalCoverage, spatialCoverage, distribution? }` → węzeł `Dataset` obok `Article` (live oznacza strony Danych jako Dataset, v2 dziś jako Article) |
| `noindex` | wyjątki (np. materiał roboczy z treścią) |

Nie skracamy opisów automatycznie w połowie zdania. Za długi opis to ostrzeżenie audytu i decyzja redakcji.

## 6. Dane strukturalne: jeden graf na stronę

Zamiast kilku niezależnych bloków (dziś Breadcrumbs dokłada własny `<script>` w `<body>`) każda strona ma **jeden `@graph`** w `<head>`. Węzły łączą się przez stałe `@id`: wydawca jest zdefiniowany raz, a Article wskazuje go referencją.

```
Organization  @id https://zarobkilekarzy.pl/#organization   (logo, sameAs: X, GitHub, Wykop; publishingPrinciples → metodologia)
WebSite       @id https://zarobkilekarzy.pl/#website        (publisher → #organization, inLanguage pl-PL)
WebPage       @id {url}#webpage                             (isPartOf → #website, breadcrumb → #breadcrumb, primaryImageOfPage → obrazek OG)
BreadcrumbList@id {url}#breadcrumb
Article       @id {url}#article                             (mainEntityOfPage → #webpage, author + publisher → #organization, image = OG)
```

| Rodzaj strony | Węzły poza Organization/WebSite/WebPage |
|---|---|
| strona główna | — (WebPage = `WebPage`, bez okruszków) |
| /dane/, /analizy/, /mechanizmy/ | `CollectionPage` + `ItemList` artykułów działu, `BreadcrumbList` |
| artykuł (Mechanizm, Analiza) | `Article`, `BreadcrumbList` |
| artykuł Dane z polem `dataset` | `Article` + `Dataset` (`isBasedOn` = źródła) |
| /dane/monitoring-watchdog/ | `Dataset` (przeniesiony z ręcznego bloku do buildera) |
| /prawa-pacjenta/ | `FAQPage`. Google od 2023 pokazuje FAQ tylko serwisom rządowym i medycznym, więc wyniku rozszerzonego się nie spodziewamy; zostaje dla innych wyszukiwarek i modeli |
| /analizy/symulator-podazy-lekarzy/ | `Article` (live tak miał; dziś v2 ma tylko okruszki) |
| /szukaj/, 404, strony `noindex` | brak grafu |

`author` = Organization (redakcja). Jeśli zdecydujesz się na autorów-osoby, dochodzi węzeł `Person` i strony autorów (§12).

## 7. Adresy, przekierowania i kontrakt starych URL-i

To jest mechanizm na „404”: nie przesądza, co zrobić z każdym starym adresem, ale nie pozwoli żadnego zgubić.

### Konwencja adresu

- `trailingSlash: 'always'` w `astro.config.mjs` (`build.format: 'directory'` już jest). Dev zachowuje się wtedy jak produkcja, a canonical zawsze kończy się ukośnikiem. Endpointy z rozszerzeniem (`.json`, `.png`, `.pdf`, `.txt`, `.xml`) tej zasady nie dotyczą.
- Linki wewnętrzne zawsze w formie kanonicznej (z „/”), żeby nie robić skoku 308. Pilnuje tego audyt.

### Rejestr przekierowań (`src/data/seo/redirects.ts`)

```ts
type Redirect = { from: string; to: string; status?: 301 | 302 | 308; note: string; since: string };
```

- Jedna lista na wszystko: przekierowania v2 (`/petycja/…` → `/postulat/…`) i **historia z live `_redirects`**. Na live jest 17 linii, m.in. `/dane/polska-na-tle-ue`, `/analizy/zarobki-lekarzy-niemcy-polska` i `/preview/*`. Bez nich stare linkowania z zewnątrz trafią w 404.
- `astro.config.mjs` importuje rejestr do `redirects`, więc dev działa jak dotąd. W buildzie integracja zapisuje `dist/_redirects` z kodem 301 i oboma wariantami ścieżki (z „/” i bez, tak jak na live). Meta refresh z Astro zostaje jako zapas, a Cloudflare i tak stosuje `_redirects` przed plikami.
- Grupy adresów obsługujemy splatem, np. `/artykuly/* → …` (limit 100 reguł dynamicznych).

### Kontrakt starych adresów (`src/data/seo/legacy-urls.ts`)

Migawka 94 adresów z sitemap live (15.10.2026) i źródeł z live `_redirects`. Każdy adres musi się w v2 rozwiązać na jedno z trzech:

| Stan | Znaczenie |
|---|---|
| `page` | v2 ma pod tym adresem stronę (wykrywane automatycznie z buildu) |
| `redirect` | rejestr ma przekierowanie do istniejącej strony |
| `removed` | świadomie usunięty, z powodem w rejestrze. Cloudflare `_redirects` nie obsługuje 410, więc taki adres dostaje 404 |

Adres bez żadnego z tych stanów oznacza naruszenie kontraktu. W trybie roboczym to ostrzeżenie, a w trybie wydania błąd buildu (§9). Dziś daje to 72 ostrzeżenia, które będą znikać w miarę, jak druga sesja przenosi podstrony. Przed przełączeniem domeny lista ma być pusta.

Kontrakt warto przed przełączeniem uzupełnić o adresy z Search Console, które mają ruch lub linki zewnętrzne, a nie występują w sitemap.

### Strona 404 (`src/pages/404.astro`)

Teraz tylko mechanizm: trasa, `BaseLayout` z `robots: { index: false }` i bez grafu. Cloudflare Pages serwuje `404.html` ze statusem 404 automatycznie. Treść (wyszukiwarka, popularne miejsca) przyjdzie później.

## 8. Pliki dla robotów i platform

| Plik | Źródło | Uwagi |
|---|---|---|
| `robots.txt` | `lib/seo/robots.ts` | tylko część wynikająca z buildu: `Sitemap`, `Disallow` dla ścieżek technicznych. Polityka wobec botów AI należy do Cloudflare (niżej) |
| `sitemap-index.xml` | `@astrojs/sitemap` + `serialize` z `integrations/seo/sitemap.ts` | `serialize` czyta fakty z wygenerowanego HTML: pomija `noindex` i strony, których canonical wskazuje gdzie indziej; `lastmod` = `article:modified_time` / `dateModified` strony. Filtr ścieżek (jak `/druk/` na live) staje się zbędny |
| `rss.xml` | `@astrojs/rss` z `lib/content` (opublikowane artykuły z datą, od najświeższych) | `<link rel="alternate">` w `SeoHead`; na live ten adres to „baza źródeł” (decyzja §12) |
| `llms.txt` | endpoint z kolekcji + huby z `data/navigation` | format llmstxt.org jak na live: H1, cytat-streszczenie, sekcje Dane / Analizy / Mechanizmy / Postulat. Cloudflare tego pliku nie generuje. Pełna treść stron dla agentów pochodzi z Markdown for Agents (niżej), więc `llms-full.txt` nie robimy |
| ikony + `site.webmanifest` | `public/`, wygenerowane raz z `favicon.svg` (sharp) | `favicon.ico` 32 px, `apple-touch-icon` 180 px, 192/512 + maskable; linki w `SeoHead` |
| `_headers` | `integrations/seo/headers.ts` (generowany z listy plików buildu) | długi cache dla `/_astro/*` (pliki z hashem), `X-Robots-Tag: noindex` dla `/szukaj.json` i JSON-ów danych, nagłówki bezpieczeństwa i CSP (`contentSecurityPolicy()`; endpoint newslettera dochodzi do `connect-src` sam). CSP sprawdza tylko `npm run preview:cf` — `astro preview` nie nakłada `_headers` |

### Co robi Cloudflare, a co repozytorium

Zasada podziału: **w repo to, co wynika z treści i buildu** (wersjonowane i sprawdzane audytem). **W Cloudflare polityka, którą zmienia się bez wdrożenia** i która wymaga egzekwowania na krawędzi.

| Warstwa | Gdzie | Dlaczego tam |
|---|---|---|
| `Sitemap:` i `Disallow` ścieżek technicznych w robots.txt | repo | adres sitemapy i lista ścieżek zmieniają się razem z kodem; audyt sprawdza zgodność z `noindex` |
| dyrektywy dla botów AI + Content Signals (`search`, `ai-input`, `ai-train`) | Cloudflare: **managed robots.txt** (AI Crawl Control → Bot Preference Sync, wszystkie plany) | Cloudflare dokleja swój blok **przed** naszym plikiem (scala, gdy nasz zwraca 200), utrzymuje listę crawlerów i może ich blokować na krawędzi, czego sam robots.txt nie potrafi |
| treść stron w Markdown dla agentów | Cloudflare: **Markdown for Agents** (plan Pro lub wyższy) | konwersja HTML → Markdown przy `Accept: text/markdown`, z zachowaniem naszego JSON-LD; zastępuje generowanie `llms-full.txt` w buildzie |
| `llms.txt` (spis) | repo | Cloudflare nie ma funkcji, która by go generowała (AI Search to wyszukiwarka dla własnej strony, a nie plik dla cudzych modeli) |

Na live managed robots.txt jest dziś wyłączony: plik nie zawiera bloku Cloudflare. Plan strefy (Free czy Pro) trzeba sprawdzić w panelu, bo od niego zależy Markdown for Agents. Search Console bywa, że zgłasza `Content-Signal` jako „Syntax not understood”. Według Cloudflare nie wpływa to na indeksowanie.

## 9. Audyt SEO w buildzie

Integracja `integrations/seo` w hooku `astro:build:done` czyta każdy wygenerowany HTML (`ultrahtml`), sitemapę, rejestr przekierowań i kontrakt. Wynik wypisuje w konsoli i zapisuje w `.astro/seo-report.json` (poza `dist/`, żeby nie trafił na serwer).

| Reguła | Poziom |
|---|---|
| brak / pusty `<title>` lub `description`, brak `lang` | błąd |
| canonical nieabsolutny, bez „/”, różny od adresu strony bez deklaracji | błąd |
| liczba `<h1>` ≠ 1 | błąd |
| JSON-LD niepoprawny albo węzeł bez pól, które przyjmujemy za obowiązkowe (Article: headline, image, author, datePublished; Dataset: name, description, license). Google formalnie tylko je zaleca, ale bez nich nie ma wyniku rozszerzonego | błąd |
| link wewnętrzny do nieistniejącej strony lub pliku | błąd |
| link wewnętrzny do przekierowania lub bez „/” | ostrzeżenie |
| `href="#"` (zapowiedzi i placeholdery w stopce; dziś 34 na stronie głównej) | ostrzeżenie |
| strona `noindex` w sitemap / strona indeksowalna poza sitemap | błąd |
| przekierowanie: źródło przykryte istniejącą stroną, cel nie istnieje, łańcuch A→B→C | błąd |
| kontrakt starych adresów niespełniony | ostrzeżenie → błąd w trybie wydania |
| tytuł > 60 znaków, opis > 160 lub < 70, duplikaty tytułów i opisów między stronami | ostrzeżenie |
| plik obrazka OG nie istnieje w `dist/` | błąd |
| `<img>` bez `alt` (poza dekoracyjnymi z `alt=""`) | ostrzeżenie |

**Tryby.** Domyślnie raport: błędy są widoczne, ale build przechodzi. Inaczej każda sesja pracująca równolegle blokowałaby pozostałe w trakcie migracji. `SEO_STRICT=1` (skrypt `npm run build:release`, CI przed wdrożeniem): błędy i naruszenia kontraktu przerywają build.

Linki **zewnętrzne** (źródła artykułów) to osobny skrypt `npm run check:links`. Działa z siecią, z limitem i cache, uruchamiany okresowo, a nie przy każdym buildzie.

## 10. Styk z istniejącymi modułami

- **OG** (`lib/og`): bez zmian. `resolveSeo` woła `ogImageFor`, a ten sam URL trafia do `og:image` i do `image` w Article. Audyt sprawdza, że plik istnieje.
- **Treść** (`lib/content`): `articleHref` dalej jest jedynym przełącznikiem adresu. Zapowiedź bez treści powinna renderować się jako tekst, a nie link do `#`. To zmiana w komponentach list, wychwytywana przez audyt.
- **Okruszki**: `Breadcrumbs.astro` zostaje czysto wizualny. Te same `crumbs`, które layout podaje do `PageHeader` / `ArticleHeader`, idą do `seo.breadcrumbs`, a graf powstaje w `<head>`.
- **Wyszukiwarka**: `/szukaj/` dostaje `noindex, follow`, więc audyt i `serialize` same usuną ją z mapy.
- **Sesje równoległe**: zmiany dotykają `BaseLayout`, `ArticleLayout`, `IndexLayout`, `Breadcrumbs`, `content.config.ts` i `astro.config.mjs`, czyli plików wspólnych. Wdrażać etapami (§11), każdy etap z buildem do scratchowego `--outDir`.

## 11. Etapy wdrożenia

| Etap | Zakres | Gotowe, gdy |
|---|---|---|
| **1. Rdzeń** | `lib/seo` (config, meta, robots, urls, schema), `SeoHead`, `JsonLd`, `BaseLayout` na `SeoInput` z mapowaniem starych propsów, `trailingSlash: 'always'`, `max-image-preview:large` | HTML wszystkich stron ma ten sam `<head>` co dziś + robots + graf z Organization/WebSite/WebPage; zero zmian wizualnych |
| **2. Producenci** | ArticleLayout / IndexLayout / strony ręczne wypełniają `SeoInput`; przeniesienie Dataset i FAQPage do builderów; okruszki do grafu; nowe pola frontmattera | Article ma `image` i `author`, strony-indeksy mają CollectionPage, w `<body>` nie zostaje żaden JSON-LD |
| **3. Mechanizmy adresów** | rejestr przekierowań (z historią live), kontrakt starych adresów, generator `_redirects`, `404.astro`, `serialize` sitemap z faktów HTML | `dist/_redirects` zawiera wszystkie reguły z live i v2; raport wypisuje listę niespełnionego kontraktu |
| **4. Audyt** | integracja z regułami §9, tryby raport / strict, `build:release` | raport bez błędów poza znanymi (martwe linki z MDX, kontrakt) |
| **5. Pliki dla robotów** | `rss.xml`, `llms.txt`, ikony + manifest, `_headers` | pliki w `dist/`, linki w `<head>` |
| **6. Redakcja** | poprawki `seoTitle` / `description` według ostrzeżeń audytu | brak ostrzeżeń o długości na stronach z ruchem |
| **7. Przełączenie** | `build:release` w CI, kontrakt pusty, kroki z §12 | patrz lista poniżej |

Etapy 1–2 są niezależne od migracji treści. Etap 3 jest „mechanizmem 404” i można go zrobić od razu, bo tylko raportuje.

### Lista przed przełączeniem domeny

1. `npm run build:release` przechodzi (kontrakt pusty, zero błędów).
2. Eksport z Search Console (strony z ruchem, linki zewnętrzne), dopisany do kontraktu i sprawdzony.
3. Wdrożenie podglądowe na Pages i test `_redirects` / `_headers` / 404 na prawdziwym runtime. `astro preview` nie nakłada tych plików, co widać po doświadczeniach z live.
4. Po przełączeniu: zgłoszenie sitemap w Search Console i Bing Webmaster, a przez 2–4 tygodnie obserwacja raportów „Strony” (404, przekierowania, „wykryta – nie zaindeksowana”). Opcjonalnie Crawler Hints (IndexNow) w panelu Cloudflare.
5. Poza SEO, ale do sprawdzenia przy przełączeniu: live ma Pages Functions (`/api/sonda`, `/api/clicks`, `/api/egzamin` z KV i D1). v2 ich nie ma.

## 12. Decyzje do podjęcia

1. **`/artykuly/` (31 adresów, „baza źródeł” na live).** Przenieść bazę źródeł, przekierować (dokąd?) czy oznaczyć jako `removed`? Od tego zależy też `rss.xml`: na live to kanał bazy źródeł, w planie kanał naszych artykułów.
2. **Autor w danych strukturalnych:** redakcja jako Organization (domyślnie) czy osoby (`Person` + strony autorów). W tematach płac i zdrowia Google mocniej waży wiarygodność autora (E-E-A-T).
3. **`/prawa-pacjenta/druk/`**: indeksować (to osobna strona z PDF-ami) czy `noindex` z canonical do `/prawa-pacjenta/`, jak na live?
4. **`schema-dts`**: dokładamy typy jako devDependency czy wystarczą własne, węższe typy węzłów?
5. **Tryb strict w CI** od razu (z listą wyjątków) czy dopiero przed przełączeniem?
6. **Polityka wobec AI (Content Signals):** domyślne ustawienie Cloudflare to `search=yes, ai-train=no`. Serwis, który chce, żeby jego liczby były cytowane (live publikuje llms.txt właśnie po to), może woleć `ai-input=yes` i świadomie zdecydować o `ai-train`. To decyzja redakcyjna, nie techniczna.
7. **Plan strefy Cloudflare:** czy jest Pro (wtedy Markdown for Agents), czy zostajemy na Free (wtedy tylko llms.txt z repo)?

## 13. Wdrożenie (15.10.2026)

### Różnice wobec planu

| Plan | Wdrożenie | Dlaczego |
|---|---|---|
| tożsamość w `lib/seo/config.ts` | `src/data/seo/identity.ts` | to dane (nazwa, opis, logo, licencja), a nie logika; `lib/seo` dostaje je przez `BaseLayout` |
| `entities?: SchemaNode[]` | `entities?: Entity[]` — opisy `{ kind: 'article' \| 'dataset', … }` | strona podaje fakty, węzły schema.org buduje wyłącznie `lib/seo/schema/nodes.ts` (§2, zasada 2) |
| `schema-dts` (decyzja 4) | własne, wąskie typy (`SchemaNode`, `Entity`, `PageSchema`) | bez nowej zależności; poprawność węzłów pilnuje audyt |
| `public/_headers` statyczny | `dist/_headers` generowany w buildzie (`integrations/seo/headers.ts`) | lista plików JSON (np. `/egzamin/lek.json`) powstaje z danych |
| ikony jako pliki w `public/` | endpointy `favicon.ico.ts`, `[icon].png.ts`, `site.webmanifest.ts` (`lib/seo/icons.ts`) | jedno źródło (`public/favicon.svg`), zero binariów |
| „jedna reguła = jeden plik” | jeden temat = jeden plik w `audit/rules/` | 7 plików: head, content, structured-data, links, sitemap, redirects, legacy |

### Decyzje przyjęte domyślnie (do zmiany jednym wpisem)

- **Autor** = Organization (redakcja) — `lib/seo/schema/nodes.ts` → `article()`.
- **`/prawa-pacjenta/druk/` w indeksie** — osobna strona z PDF-ami (fraza „prawa pacjenta pdf”), nie duplikat.
- **Licencja** treści i zestawień CC BY 4.0 (jak `LICENSE-CONTENT.md` dotychczasowej strony) — `identity.license`. v2 nie mówi o niej jeszcze nigdzie na stronie.
- **Dział Dane = Article + Dataset** automatycznie (jak na dotychczasowej stronie); pole `dataset` we frontmatterze uzupełnia zasięg i licencję.
- **`/rss.xml`** = nowe i zaktualizowane materiały serwisu (na dotychczasowej stronie: baza źródeł). Decyzja 1 (`/artykuly/`) dalej otwarta.
- **Artykuł bez `date`** nie dostaje zmyślonej daty publikacji — audyt ostrzega (`datePublished`), redakcja uzupełnia frontmatter.
- **Tryb strict** w `npm run build:release` — tak buduje CI (`.github/workflows/deploy.yml`).

### Stan audytu po wdrożeniu (build 15.10.2026, 40 stron)

21 błędów i ok. 45 ostrzeżeń — wszystkie dotyczą treści, nie mechanizmów:

- **12 martwych linków** z treści MDX do materiałów jeszcze nieprzeniesionych (`/dane/rekordy/`, `/dane/budzet-nfz/`, `/mechanizmy/brak-jawnosci/`…) i do PDF-u projektu ustawy (`/projekt-nowelizacji/projekt-nowelizacji-art27a-v0.3.pdf` — `projekt.pdf.href` wskazuje plik dotychczasowej strony, którego v2 nie ma).
- **9 przekierowań do celów bez strony** (scalenia po audycie treści, historia live) — znikną po przeniesieniu celów.
- **Kontrakt starych adresów:** 65 ze 103 bez rozwiązania (w tym 31 adresów `/artykuly/`).
- **373 linki `href="#"`** na 24 stronach (zapowiedzi i puste pozycje stopki).
- **Tytuły > 60 i opisy > 160 znaków** na większości stron — etap 6 (`seoTitle` / `description`).

Zostaje poza repo (panel Cloudflare): managed robots.txt i Content Signals (decyzja 6), Markdown for Agents przy planie Pro (decyzja 7).
