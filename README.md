# zarobkilekarzy.pl

Obywatelska inicjatywa na rzecz **jawności wynagrodzeń w ochronie zdrowia**.
Serwis informacyjny: dane, baza ogólnodostępnych artykułów i postulat jawnego
rejestru wynagrodzeń lekarzy.

Stylistyka: pogranicze portalu finansowego i gabinetu lekarskiego — biel,
granat zaufania i oszczędny akcent alarmowy.

## Stack

- [Astro](https://astro.build) — statyczny generator (świetne SEO, szybki, tani hosting)
- Content Collections — baza artykułów jako pliki Markdown
- IBM Plex Sans / Serif / Mono (samohostowane, `@fontsource`)
- `@astrojs/sitemap` — mapa strony

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski → http://localhost:4321
npm run build    # produkcyjny build do ./dist
npm run preview  # podgląd builda
```

Wymaga Node 18+ (testowane na Node 22).

## Struktura

```
src/
  pages/            # Start, Mechanizmy, Dane, Artykuły, Postulat, Działaj, O projekcie
  layouts/          # BaseLayout (head, SEO, fonty)
  components/        # Nav, Footer, ArticleCard
  content/
    config.ts       # schemat bazy artykułów (Zod)
    articles/*.md    # wpisy bazy artykułów
  lib/categories.ts # etykiety kategorii i formatowanie dat
  styles/global.css # system projektowy (kolory, typografia, komponenty)
public/             # favicon, robots.txt
```

## Jak dodać artykuł do bazy

Utwórz nowy plik `src/content/articles/nazwa-wpisu.md`:

```yaml
---
title: "Tytuł materiału"
source: "nazwa wydawcy / źródła"
sourceType: "prasa"   # prasa | raport | analiza | dane | wideo
url: "https://adres-do-oryginalu"
date: 2026-06-01
category: "wieloetatowosc"  # wieloetatowosc | kontrakty | kolejki | wynagrodzenia | system
tags: ["tag1", "tag2"]
excerpt: "Krótki opis (1–2 zdania)."
example: false        # true = wpis poglądowy
---
```

Dla realnych wpisów ustaw `example: false` (wartość domyślna). Pełne zasady
redakcyjne i checklist wpisu znajdziesz w [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap (dobre na pierwszy wkład)

- [ ] Podłączyć formularz poparcia (`/dzialaj`) do backendu z double opt-in i RODO
      (np. Supabase + Cloudflare Turnstile)
- [ ] Uzupełniać dane liczbowe na `/dane` — każda liczba ze źródłem
- [ ] Dodać wykresy na `/dane` na podstawie danych ze źródeł
- [ ] Rozbudowywać bazę artykułów o nowe, publiczne źródła

## Deployment

Statyczny output (`./dist`) działa na dowolnym hostingu statycznym. Zalecane:

- **Cloudflare Pages** lub **Netlify** (darmowy tier, własna domena `zarobkilekarzy.pl`)
- build command: `npm run build`, katalog: `dist`

Dołączony workflow `.github/workflows/deploy.yml` i `wrangler.toml` celują w
konto Cloudflare maintainera (sekrety w GitHub Actions, deploy uruchamiany
ręcznie). **Fork nie potrzebuje ich do niczego.** Sonda i basic-auth to funkcje
Cloudflare — lokalny `npm run dev` działa bez nich i bez żadnych sekretów.

## Zasady redakcyjne (ważne)

Projekt celowo trzyma framing **jawności publicznych pieniędzy**, nie ataku na zawód:

- linkujemy wyłącznie do **ogólnodostępnych źródeł**, każda teza ma źródło;
- opisujemy **mechanizmy systemowe**, nie atakujemy imiennie osób (ryzyko z art. 212 k.k.);
- postulujemy **rejestr po numerze PWZ** (identyfikator zawodowy), nie po PESEL (dane wrażliwe, RODO);
- zapewniamy **prawo do sprostowania** i trzymamy się **prawa cytatu**.

To nie jest porada prawna — przed publikacją materiałów o konkretnych podmiotach
skonsultuj się z prawnikiem.

## Współtworzenie

To projekt **open source** — wkład mile widziany. Najczęstszy: dodanie artykułu
do bazy (link do publicznego źródła). Zanim wyślesz PR, przeczytaj:

- [CONTRIBUTING.md](CONTRIBUTING.md) — jak dodać artykuł, środowisko lokalne,
  proces PR i **zasady redakcyjne** (kluczowe),
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — kodeks postępowania.

Nie chcesz ruszać kodu? Otwórz Issue — „Propozycja artykułu" albo „Błąd lub
sprostowanie".

## Licencja

Podwójna licencja:

- **Kod** — [MIT](LICENSE).
- **Treść** (artykuły, teksty, opisy) — [CC BY 4.0](LICENSE-CONTENT.md).

Cytowane materiały źródłowe pozostają własnością ich wydawców — korzystamy z
prawa cytatu.
