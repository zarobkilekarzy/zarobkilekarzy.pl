/**
 * Strony o serwisie: /o-projekcie/ i /prywatnosc/.
 * Serwis jest anonimowy (decyzja redakcji z 15.10.2026): żadnych nazwisk, firm ani osób w treści —
 * na zewnątrz występuje wyłącznie zarobkilekarzy.pl i adres kontaktowy serwisu.
 */
import type { TextItem } from '@/types';

export const contact = {
  email: 'kontakt@zarobkilekarzy.pl',
};

export const legalPages = {
  prywatnosc: {
    title: 'Prywatność',
    docTitle: 'Polityka prywatności',
    lead: 'Nie prowadzimy kont, nie używamy ciasteczek i nie zbieramy danych osobowych. Tu opisujemy wszystko, co dzieje się z danymi podczas korzystania z serwisu.',
    /** wersja leadu, gdy działa newsletter (data/newsletter.ts → newsletterOn) */
    leadNewsletter: 'Nie prowadzimy kont i nie używamy ciasteczek. Jedyne dane osobowe, jakie przyjmujemy, to adresy osób zapisanych na newsletter. Tu opisujemy wszystko, co dzieje się z danymi.',
    description: 'Polityka prywatności zarobkilekarzy.pl: bez kont i ciasteczek, zbiorcza analityka Cloudflare, ustawienia tylko w Twojej przeglądarce.',
    updated: '16.10.2026',
  },
  oProjekcie: {
    title: 'O projekcie',
    docTitle: 'O projekcie: cel, zasady, sprostowania',
    lead: 'Obywatelski serwis o tym, jak płynie publiczny pieniądz w ochronie zdrowia — od składki po wynagrodzenia. Krytykujemy mechanizmy, nie zawód.',
    description: 'Po co powstał zarobkilekarzy.pl, na jakich zasadach dobieramy źródła i jak zgłosić błąd.',
    updated: '21.10.2026',
  },
};

/** Zasady pracy — rozwinięcie skrótu z bloku „Jak czytamy dane” na stronie głównej. */
export const editorialRules: TextItem[] = [
  {
    title: 'Źródło przy każdej liczbie',
    text: 'Korzystamy wyłącznie z ogólnodostępnych dokumentów, danych i odpowiedzi na wnioski o informację publiczną. Każda liczba ma przypis z linkiem, więc możesz ją sprawdzić sam.',
  },
  {
    title: 'Szacunek to nie fakt',
    text: 'Dane oznaczamy jako dokładne albo szacunkowe i nie mieszamy tych kategorii. Gdy czegoś nie wiadomo, piszemy, że nie wiadomo — nie zgadujemy.',
  },
  {
    title: 'Mechanizmy, nie nazwiska',
    text: 'Opisujemy, jak działa system. Nie wskazujemy konkretnych lekarzy i nie publikujemy danych osobowych.',
  },
  {
    title: 'Prawo cytatu',
    text: 'Cytujemy krótkie fragmenty i odsyłamy do oryginału. Teksty piszemy własnymi słowami.',
  },
];
