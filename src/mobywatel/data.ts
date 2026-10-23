/**
 * Podprojekt „Prototypy mObywatela” (konkurs mObywatel Challenge, mobywatel.ai): rejestr prototypów
 * do strony konkursu /mobywatel/ i treść tej strony.
 *
 * Cały podprojekt jest wydzielony — korzysta z serwisu (tokeny, fonty, BaseLayout), serwis z niego nie:
 * - src/mobywatel/ — ten plik, integracja.ts, prototypy/ (warianty na froncie z mobywatel.ai, README tam)
 *   oraz własna baza Astro (AppLayout, components/, icons.ts; odłożona, strona /mobywatel/baza/),
 * - src/pages/mobywatel/ — strona konkursu i baza Astro (Astro trzyma strony tylko w src/pages),
 * - astro.config.mjs — wpis integracji `mobywatel()` (składa warianty pod /mobywatel/<wariant>/),
 * - integrations/seo/headers.ts — reguła `/mobywatel/*` (ramka telefonu na stronie konkursu),
 * - scripts/check-colors.mjs — wyłączenie prototypy/ (aplikacja z własną paletą),
 * - src/assets/mobywatel/ + dwa wpisy na końcu ogPages w src/data/og.ts — obrazek OG (narzedzia/og.mjs).
 * Usunięcie podprojektu = skasowanie trzech katalogów, wpisu integracji, reguły, wyłączenia i wpisów OG.
 *
 * Nowy wariant: katalog w prototypy/warianty/ (z opis.json) + wpis w `prototypes`.
 */
import type { MobIconName } from '@/mobywatel/icons';
import mojeZdrowie from '@/mobywatel/prototypy/warianty/moje-zdrowie/opis.json';

export interface MobTab {
  /** id ekranu, który otwiera karta (Screen z tym id i `tab`) */
  id: string;
  label: string;
  icon: MobIconName;
}

export interface MobPrototype {
  slug: string;
  title: string;
  /** jedno–dwa zdania na stronę inicjatywy: jaki problem rozwiązuje i dla kogo */
  description: string;
  /** szkic = jeszcze nie zgłoszony do konkursu */
  status: 'szkic' | 'zgłoszony';
  /** adres z parametrami (np. osoba w pokazie); brak = /mobywatel/<slug>/ */
  src?: string;
  /** opis wariantu (prototypy/warianty/<slug>/opis.json) — ten sam pokazuje panel obok telefonu w samym prototypie */
  opis?: { funkcje: { t: string; link?: { tekst: string; href: string } }[]; instrukcja: string[]; uwaga: string };
  /** false = poza katalogiem (strona dalej działa pod swoim adresem) */
  listed?: boolean;
}

export const MOB_BASE = '/mobywatel/';
export const CHALLENGE_URL = 'https://mobywatel.ai/';

export const prototypes: MobPrototype[] = [
  {
    slug: 'moje-zdrowie',
    title: mojeZdrowie.tytul,
    description: mojeZdrowie.opis,
    status: 'szkic',
    src: `${MOB_BASE}moje-zdrowie/?osoba=marta`,
    opis: mojeZdrowie,
  },
  {
    slug: 'baza',
    title: 'Baza prototypów',
    description:
      'Szkielet aplikacji, na którym powstają kolejne prototypy: pulpit, dokumenty, usługi, przejścia między ekranami i potwierdzenie sprawy.',
    status: 'szkic',
    listed: false,
  },
];

export const prototypeHref = (p: MobPrototype) => p.src ?? `${MOB_BASE}${p.slug}/`;

/**
 * Treść strony konkursu /mobywatel/. Opis wyłącznie rzeczowy: zasady z mobywatel.ai, bez organizatora,
 * patronów i nazwisk (decyzja usera 23.10.2026: „tylko apolityczny opis”).
 */
export const contestPage = {
  title: 'Prototypy mObywatela',
  eyebrow: 'Konkurs mObywatel Challenge',
  description: 'Klikalne prototypy aplikacji mObywatel przygotowane przez zarobkilekarzy.pl na konkurs mObywatel Challenge.',
  lead: 'Klikalne prototypy aplikacji mObywatel, które strona przygotowuje na konkurs mObywatel Challenge. Każdy działa w przeglądarce — na komputerze i w telefonie — pod własnym adresem.',
  about: {
    title: 'O konkursie',
    paragraphs: [
      '**mObywatel Challenge** to otwarty konkurs na klikalny prototyp aplikacji mObywatel. Udział może wziąć każdy: osoby prywatne, zespoły, uczniowie, studenci, firmy i organizacje.',
      'Warunek jest jeden: prototyp, przez który da się przejść ekran po ekranie, **bez logowania**. Same grafiki, szkic ani film nie wystarczą. Punktem odniesienia jest prototyp udostępniony na stronie konkursu — zgłoszenie ma być od niego prostsze, wygodniejsze, bardziej dostępne albo załatwiać więcej spraw.',
    ],
    facts: [
      { label: 'Forma', text: 'klikalny prototyp: Figma, Framer albo aplikacja w przeglądarce' },
      { label: 'Wyróżnienie', text: 'autorzy 10 najlepszych koncepcji zaprezentują je w Sejmie' },
      { label: 'Prawa', text: 'zostają przy autorach koncepcji' },
    ],
    source: { label: 'Zasady konkursu: mobywatel.ai', href: CHALLENGE_URL },
  },
  why: {
    title: 'Dlaczego strona bierze udział',
    paragraphs: [
      'zarobkilekarzy.pl zajmuje się jawnością pieniędzy publicznych w ochronie zdrowia. mObywatel to miejsce, w którym państwo już pokazuje obywatelowi dane z rejestrów — prototypy sprawdzają, jak mogłaby tam wyglądać jawność wydatków na leczenie.',
      'Prototypy są koncepcjami, nie aplikacją administracji publicznej. Osoby i dane w prototypach są fikcyjne.',
    ],
  },
  catalogTitle: 'Katalog prototypów',
};

/** Dolne menu wspólne dla prototypów — prototyp może podać własne. */
export const defaultTabs: MobTab[] = [
  { id: 'pulpit', label: 'Pulpit', icon: 'home' },
  { id: 'dokumenty', label: 'Dokumenty', icon: 'doc' },
  { id: 'uslugi', label: 'Usługi', icon: 'grid' },
  { id: 'wiecej', label: 'Więcej', icon: 'menu' },
];

/** Fikcyjna osoba. Żadne dane nie należą do prawdziwego człowieka. */
export const persona = {
  firstName: 'Anna',
  lastName: 'Zielińska',
  city: 'Poznań',
  birthDate: '14.03.1985',
  idCard: { series: 'AZL 482913', issued: '02.06.2021', validUntil: '02.06.2031', issuer: 'Prezydent Miasta Poznania' },
};
