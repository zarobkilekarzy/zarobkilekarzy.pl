# Polityka bezpieczeństwa

## Zgłaszanie podatności

Jeśli znajdziesz lukę bezpieczeństwa, **nie otwieraj publicznego Issue**.
Zgłoś ją prywatnie:

- e-mail: **kontakt@zarobkilekarzy.pl**, albo
- prywatny kanał GitHub: *Security → Report a vulnerability* (jeśli włączony).

Postaramy się odpowiedzieć w rozsądnym terminie i ustalić sposób oraz moment
ujawnienia po naprawie.

## Zakres

Serwis to statyczna strona (Astro) hostowana na Cloudflare Workers (static assets). Powierzchnia
do oceny obejmuje przede wszystkim:

- Worker `worker/` z endpointem statystyk egzaminu `/api/egzamin` (Cloudflare D1, Turnstile),
- nagłówki bezpieczeństwa i przekierowania generowane przy buildzie (`integrations/seo/`),
- konfigurację wdrożenia (`wrangler.jsonc`, `.github/workflows/deploy.yml`).

## Prywatność i treść

Ten projekt z założenia operuje na **danych publicznych** i unika danych
osobowych. Jeśli zauważysz w treści dane, które mogą naruszać prywatność
(np. dane osoby prywatnej, dane wrażliwe), potraktuj to jako zgłoszenie
priorytetowe — napisz na **kontakt@zarobkilekarzy.pl** lub otwórz Issue typu
„Błąd lub sprostowanie".

## Sekrety

Repozytorium nie powinno zawierać żadnych sekretów. Sekret Turnstile i tokeny
Cloudflare żyją wyłącznie w sekretach (Cloudflare Workers / GitHub Secrets). Jeśli zauważysz w repo lub w historii git
przypadkowo zacommitowany sekret — zgłoś to jak podatność.
