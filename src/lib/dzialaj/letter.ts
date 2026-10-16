/**
 * List do polityka: wypełnienie szablonu i link mailto. Czyste funkcje bez importów danych —
 * ten sam kod składa list na serwerze (wersja bez JS) i w przeglądarce (components/dzialaj/client.ts).
 * Treść szablonu: src/data/dzialaj.ts → `letter`.
 */

export type Rodzaj = 'k' | 'm' | 'inst';

export interface LetterTemplate {
  subject: string;
  /** akapity z tokenami {zwrot} i {prosba}; podpis dokłada `fillLetter` */
  body: string;
  /** zdanie z prośbą w formie dla adresatki, adresata i instytucji */
  ask: Record<Rodzaj, string>;
  close: string;
}

/** Najdłuższy podpis, jaki przyjmuje pole (atrybut maxlength i obcięcie w `cleanSignature`). */
export const SIGNATURE_MAX = 50;

/**
 * Bezpieczna długość adresu mailto. Programy pocztowe i systemy obcinają albo odrzucają dłuższe
 * (Outlook na Windows ok. 2 tys. znaków); powyżej tego progu przycisk otwiera pocztę bez treści.
 */
export const MAILTO_MAX = 2000;

/** Podpis z pola: jedna linia, bez nadmiarowych spacji, najwyżej SIGNATURE_MAX znaków. */
export const cleanSignature = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, SIGNATURE_MAX);

export function fillLetter(t: LetterTemplate, to: { greeting: string; rodzaj: Rodzaj }, signature = ''): string {
  const sign = cleanSignature(signature);
  return [
    t.body.replace('{zwrot}', to.greeting).replace('{prosba}', t.ask[to.rodzaj]),
    sign ? `${t.close}\n${sign}` : t.close,
  ].join('\n\n');
}

/** mailto z tematem i treścią; nowe linie jako CRLF (RFC 6068). Pusty adres — program poprosi o odbiorcę. */
export function mailto(email: string, subject: string, body?: string): string {
  const q = [`subject=${encodeURIComponent(subject)}`];
  if (body !== undefined) q.push(`body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`);
  return `mailto:${email}?${q.join('&')}`;
}
