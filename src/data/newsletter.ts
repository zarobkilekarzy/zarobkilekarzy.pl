/**
 * Newsletter w stopce — jedno miejsce z ustawieniami i tekstami.
 *
 * Blok pokazuje się tylko przy `enabled: true` i niepustym `endpoint`. Formularz wysyła
 * `POST endpoint` z JSON-em `{ "email": "…", "source": "/ścieżka/" }` i czyta kod odpowiedzi:
 *   2xx — zapisano (przy double opt-in: wysłano link potwierdzający),
 *   409 — adres jest już zapisany,
 *   400 / 422 — usługa odrzuciła adres,
 *   429 — za dużo prób,
 *   inny kod, brak odpowiedzi w `timeoutMs` albo błąd sieci — błąd ogólny.
 * Endpoint musi zezwalać na CORS z domeny serwisu. Kontrakt: docs/newsletter.md.
 *
 * Gdy newsletter ruszy, uzupełnij `provider` — /prywatnosc/ wypisze wtedy, kto przechowuje adresy.
 */

export interface NewsletterProvider {
  /** nazwa usługi, która przechowuje adresy i wysyła maile */
  name: string;
  /** jej polityka prywatności */
  privacyUrl: string;
}

export const newsletter = {
  /** false = blok newslettera w stopce się nie renderuje (decyzja z 15.10.2026: gotowy, ale ukryty) */
  enabled: false,
  /** adres usługi przyjmującej zapis; pusty = blok się nie renderuje */
  endpoint: '',
  /** dostawca opisany na /prywatnosc/ (null, dopóki newsletter nie ruszy) */
  provider: null as NewsletterProvider | null,
  /** usługa wysyła mail z linkiem potwierdzającym (zalecane: zapis nie działa bez kliknięcia) */
  doubleOptIn: true,
  /** po ilu ms przerwać czekanie na odpowiedź */
  timeoutMs: 10_000,

  title: 'Raz w miesiącu: nowe dane',
  lead: 'Krótkie podsumowanie nowych analiz i aktualizacji danych. Bez spamu, wypis jednym kliknięciem.',
  /** pod polem — co robimy z adresem; link do /prywatnosc/ dokłada komponent */
  note: 'Adresu użyjemy tylko do wysyłki newslettera. Wypiszesz się linkiem w każdym mailu.',
  messages: {
    sending: 'Zapisuję…',
    pending: 'Wysłaliśmy link potwierdzający. Sprawdź skrzynkę, także folder ze spamem.',
    subscribed: 'Gotowe — jesteś na liście. Pierwszy numer przyjdzie na początku miesiąca.',
    already: 'Ten adres jest już zapisany.',
    invalid: 'Podaj poprawny adres e-mail.',
    rejected: 'Usługa odrzuciła ten adres. Sprawdź, czy nie ma literówki.',
    tooMany: 'Za dużo prób w krótkim czasie. Spróbuj za kilka minut.',
    error: 'Nie udało się zapisać. Spróbuj ponownie za chwilę.',
  },
};

/** czy blok ma się pokazać (oba warunki naraz) */
export const newsletterOn = newsletter.enabled && newsletter.endpoint !== '';
