# Współtworzenie zarobkilekarzy.pl

Dzięki, że chcesz pomóc! To projekt obywatelski na rzecz **jawności
wynagrodzeń w ochronie zdrowia**. Najczęstszy wkład to **dodanie wpisu do bazy
artykułów** (link do publicznego źródła), ale przyjmujemy też poprawki kodu,
treści, dostępności i tłumaczeń metodologii.

Zanim wyślesz PR, przeczytaj **Zasady redakcyjne** poniżej — to nie formalność,
to oś projektu. PR-y łamiące te zasady będą odrzucane niezależnie od jakości kodu.

---

## Zasady redakcyjne (przeczytaj najpierw)

Projekt celowo trzyma framing **jawności publicznych pieniędzy**, a nie ataku
na zawód lekarza. Każdy wkład musi to respektować:

1. **Każda teza ma źródło.** Linkujemy **wyłącznie do ogólnodostępnych**
   materiałów (prasa, raporty, dane publiczne, BIP, oświadczenia majątkowe).
   Żadnych treści zza paywalla jako jedynego źródła, screenshotów z zamkniętych
   grup, prywatnej korespondencji ani niesprawdzalnych „przecieków".
2. **Mechanizmy, nie nazwiska.** Opisujemy **systemowe mechanizmy**
   (wieloetatowość, kumulacja funkcji, kontrakty, kolejki), **nie** atakujemy
   imiennie osób prywatnych. Publikowanie zarzutów pod adresem konkretnej osoby
   to realne ryzyko z **art. 212 k.k.** (zniesławienie). Wyjątek: wypowiedzi i
   dane **osób publicznych w zakresie pełnionych funkcji** (np. minister,
   prezes izby) — i tylko z podaniem źródła.
3. **PWZ, nie PESEL.** Postulujemy rejestr po **numerze PWZ** (identyfikator
   zawodowy), nigdy po PESEL (dane wrażliwe, RODO). Nie dodawaj treści, które
   wiążą kwoty z PESEL-em, adresem zamieszkania czy innymi danymi wrażliwymi.
4. **Prawo cytatu i sprostowania.** Cytujemy w granicach prawa cytatu i
   zapewniamy prawo do sprostowania. Nie kopiujemy całych artykułów — linkujemy
   do oryginału i podajemy krótkie streszczenie własnymi słowami.
5. **Ton.** Rzeczowo, bez epitetów („konował", „złodzieje" itp.). Energię
   kierujemy na **jawność i mechanizmy**, nie na zbiorowy atak na grupę zawodową.

> To nie jest porada prawna. Przy materiałach o konkretnych podmiotach —
> skonsultuj się z prawnikiem.

---

## Jak dodać artykuł do bazy

Najprostszy wkład. Utwórz nowy plik `src/content/articles/krotka-nazwa.md`
(nazwa pliku = slug, małe litery, myślniki) z takim nagłówkiem (frontmatter):

```yaml
---
title: "Tytuł materiału"
source: "nazwa wydawcy / źródła"      # np. "Rzeczpospolita", "NIK", "AOTMiT"
sourceType: "prasa"                    # prasa | raport | analiza | dane | wideo
url: "https://adres-do-oryginalu"      # pełny, działający, publiczny URL
date: 2026-06-01                        # data publikacji źródła (YYYY-MM-DD)
category: "wieloetatowosc"             # wieloetatowosc | kontrakty | kolejki | wynagrodzenia | system
tags: ["tag1", "tag2"]                  # opcjonalne
excerpt: "Krótki opis 1–2 zdania, własnymi słowami."
example: false                          # zawsze false dla realnych wpisów
---
```

Pola są walidowane schematem **Zod** w `src/content/config.ts` — `sourceType` i
`category` muszą być jedną z dozwolonych wartości, a `url` musi być poprawnym
adresem. Build padnie, jeśli coś się nie zgadza (to dobrze — łapie błędy przed
publikacją).

**Checklist wpisu:**

- [ ] Źródło jest **publiczne** i działa (otwórz link w trybie incognito).
- [ ] `excerpt` napisany **własnymi słowami** (nie wklejony lead artykułu).
- [ ] Treść opisuje **mechanizm**, nie piętnuje imiennie osoby prywatnej.
- [ ] `date` to data publikacji źródła, nie data dodania wpisu.
- [ ] `npm run build` przechodzi.

---

## Środowisko lokalne

Wymagany **Node 18+** (testowane na Node 22).

```bash
npm install
npm run dev      # serwer deweloperski → http://localhost:4321
npm run build    # produkcyjny build do ./dist (uruchom przed PR)
npm run preview  # podgląd builda
```

**Do pracy lokalnej nie potrzebujesz żadnych sekretów ani konta Cloudflare.**
Sonda (`/api/sonda`) i basic-auth działają tylko na Cloudflare Pages; lokalnie
`npm run dev` renderuje stronę bez nich (sonda działa w trybie fallback).

---

## Proces Pull Request

1. Zrób **fork** i własną gałąź: `git checkout -b dodaj-artykul-xyz`.
2. Wprowadź zmiany. Pisz kod w stylu otaczających plików (komentarze po polsku,
   te same konwencje nazewnicze).
3. Uruchom `npm run build` — musi przejść bez błędów.
4. Commit zwięźle i po polsku (jak dotychczasowa historia, np.
   „Artykuły: +1 wpis (limity studiów → niedobór)").
5. Otwórz PR i wypełnij szablon. Opisz **źródło** i dlaczego wpis pasuje do
   zasad redakcyjnych.

PR-y nie deployują się automatycznie. Wdrożenie produkcyjne (Cloudflare Pages)
uruchamia ręcznie maintainer — nie potrzebujesz do tego żadnych uprawnień.

---

## Zgłaszanie bez kodu

Nie chcesz ruszać kodu? Otwórz **Issue**:

- **Propozycja artykułu** — podrzuć link do źródła, dopiszemy wpis.
- **Błąd lub sprostowanie** — zgłoś nieścisłość, martwy link, błąd faktograficzny.

---

## Licencja wkładu

Wysyłając wkład, zgadzasz się na jego udostępnienie na licencjach projektu:
**MIT** dla kodu (`LICENSE`) i **CC BY 4.0** dla treści (`LICENSE-CONTENT.md`).
