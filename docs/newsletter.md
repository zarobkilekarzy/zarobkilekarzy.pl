# Newsletter

Formularz w stopce jest gotowy, ale ukryty (`enabled: false` w `src/data/newsletter.ts`, decyzja z 15.10.2026). Brakuje tylko usługi, która przyjmie zapis.

## Włączenie

1. Postaw endpoint zgodny z kontraktem poniżej (np. funkcja Cloudflare przy stronie albo pośrednik do dostawcy wysyłki).
2. W `src/data/newsletter.ts` ustaw `endpoint`, `provider` (nazwa i link do polityki prywatności dostawcy) i `enabled: true`.
3. Zbuduj stronę. Stopka pokaże blok, a `/prywatnosc/` dopisze sekcję „Newsletter” i zmieni lead (dane: `src/data/o-serwisie.ts → leadNewsletter`).

## Kontrakt endpointu

Formularz wysyła:

```http
POST <endpoint>
Content-Type: application/json

{ "email": "ktos@example.com", "source": "/dane/" }
```

`source` to ścieżka strony, z której ktoś się zapisał. Formularz rozpoznaje odpowiedzi:

| Kod | Znaczenie | Komunikat |
|---|---|---|
| 2xx | zapisano; przy double opt-in wysłano mail z linkiem potwierdzającym | `pending` albo `subscribed` |
| 409 | adres już jest na liście | `already` |
| 400 / 422 | usługa odrzuciła adres | `rejected` |
| 429 | za dużo prób | `tooMany` |
| inny, brak odpowiedzi po `timeoutMs`, błąd sieci | błąd ogólny | `error` |

Endpoint musi odpowiadać na CORS z domeny serwisu (`Access-Control-Allow-Origin`, obsługa `OPTIONS`). Klucze API dostawcy zostają po stronie endpointu — nigdy w kodzie strony.

Ochrona przed botami po stronie strony: pole-pułapka `company` (wypełnione = udany „zapis” bez wysyłki). Po stronie endpointu warto dodać limit zapytań na IP.

## Wybór usługi — do decyzji

- **Własny endpoint na Cloudflare** (funkcja + D1 na listę + Cloudflare Email Service do wysyłki): wszystko w jednym koncie, bez zewnętrznej firmy z listą adresów. Najwięcej pracy: potwierdzenie zapisu, wypis, wysyłka numerów.
- **Dostawca newsletterów z UE** (np. MailerLite, Brevo) z krótkim pośrednikiem, który trzyma klucz API: gotowe potwierdzanie, wypis i szablony maili; lista adresów jest u dostawcy.

Przy obu wariantach trzeba rozstrzygnąć anonimowość: regulaminy dostawców i przepisy o świadczeniu usług drogą elektroniczną wymagają danych nadawcy, a polityka prywatności musi wskazać, kto przechowuje adresy.

## Podgląd

Do obejrzenia stanów formularza wystarczy makieta endpointu: zwraca 200, 409 albo 500 zależnie od adresu. Tak sprawdzano formularz 15.10.2026: build z tymczasowym `enabled: true` i `endpoint` wskazującym makietę na 127.0.0.1.
