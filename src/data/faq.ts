/**
 * /faq/ — najczęstsze zarzuty wobec serwisu i nasze odpowiedzi.
 * Zarzuty prawne wobec samego postulatu (RODO, identyfikator, mały szpital) są na /postulat/#zarzuty —
 * tu jest do nich jedno odesłanie, bez powtarzania odpowiedzi.
 * Odpowiedzi w zapisie lib/inline: **pogrubienie**, [link](adres) — linkuj tylko do stron, które istnieją —
 * i przypis [^id]: źródło spoza serwisu idzie do `faqNotes`, a nie w nawias.
 */
import type { FaqItem } from '@/types';
import { defineNotes } from '@/lib/notes';

export const faqPage = {
  title: 'Najczęstsze zarzuty',
  docTitle: 'Zarzuty wobec jawności płac lekarzy',
  lead: 'Kontrargumenty, które najczęściej słyszymy, i to, co na nie odpowiadamy. Krytykujemy mechanizm, nie zawód.',
  description: 'Czy jawność płac to atak na lekarzy, populizm albo zachęta do emigracji? Najczęstsze zarzuty wobec serwisu i nasze odpowiedzi.',
  updated: '15.10.2026',
};

export const faqItems: FaqItem[] = [
  {
    question: 'Lekarze latami się kształcą i ciężko pracują. Należą im się wysokie zarobki.',
    answer: [
      'Zgadzamy się i nie kwestionujemy wysokości godziwych wynagrodzeń. Kwestionujemy co innego: to, że publicznych pieniędzy wypłacanych jednej osobie nikt nie sumuje, więc nie widać ani typowej kwoty, ani rozliczeń z kilku placówek naraz. Opisujemy to w tekście o [wieloetatowości](/mechanizmy/wieloetatowosc/).',
      'To krytyka mechanizmu, a nie zawodu.',
    ],
  },
  {
    question: 'To populizm i zazdrość o cudze pensje.',
    answer: [
      'Nie chodzi o to, ile kto zarabia, tylko o to, czy wydatek publiczny jest jawny. Jawne są już płace w administracji i oświadczenia majątkowe osób pełniących funkcje publiczne. Pieniądze ze składki zdrowotnej nie powinny być wyjątkiem.',
      'Nie postulujemy obniżek ani odbierania komukolwiek pieniędzy. Postulujemy, żeby było widać, dokąd trafiają.',
    ],
  },
  {
    question: 'Lekarze wyjeżdżają. Trzeba dobrze płacić, żeby zostali.',
    answer: [
      'Częściowo to prawda. Jawność nikomu jednak płacy nie obniża. Pokazuje za to, czy kolejne miliardy na podwyżki trafiają tam, gdzie brakuje lekarzy, czy rozpraszają się na kontrakty, których sumy nikt nie widzi.',
      'Można jednocześnie zatrzymywać lekarzy w kraju i wiedzieć, ile system im płaci.',
    ],
  },
  {
    question: 'Z porównań międzynarodowych wynika, że polscy lekarze zarabiają mało.',
    answer: [
      'Nowsze dane OECD pokazują coś innego: polski lekarz specjalista na etacie zarabia ok. 2,9 razy więcej niż przeciętny pracownik (dane za 2022 r.) — powyżej średniej OECD, która wynosi 2,8. Po przeliczeniu według siły nabywczej Polska wypada jednak słabiej.[^demagog]',
      'Ważniejsze zastrzeżenie: te dane obejmują wyłącznie lekarzy na etatach. Ok. 73% specjalistów rozlicza się na kontraktach, których statystyki OECD nie uwzględniają — dlatego żadne porównanie nie pokazuje dziś, ile łącznie zarabia jedna osoba ([Kontrakt czy etat](/mechanizmy/kontrakt-vs-etat/)).',
    ],
  },
  {
    question: 'Sami piszecie, że lekarzy jest za mało. To o co chodzi?',
    answer: [
      'Lekarzy przy pacjentach rzeczywiście brakuje, a skąd się to bierze i jak może wyglądać przyszłość, pokazuje [symulator podaży lekarzy](/analizy/symulator-podazy-lekarzy/).',
      'Niedobór i wysokie stawki nie są ze sobą sprzeczne. Kiedy lekarzy jest mało, szpitale konkurują o każdego, kto obsadzi dyżur, i to podnosi ceny. Tym bardziej warto widzieć, ile publicznych pieniędzy trafia do jednej osoby.',
    ],
  },
  {
    question: 'Praca na kilku kontraktach jest legalna. Co w tym złego?',
    answer: [
      'Sama w sobie nic. Legalność to jednak nie to samo co jawność. Problem polega na tym, że nikt nie widzi **łącznych** godzin ani łącznych wypłat jednej osoby z publicznych pieniędzy, więc nie da się ocenić ani kosztów, ani wpływu na dostępność dla pacjentów.',
      'Dlatego [postulujemy](/postulat/) jawne łączne wypłaty dla każdej osoby, pod stałym identyfikatorem i bez nazwisk.',
    ],
  },
  {
    question: 'Jawność płac narusza prywatność i RODO.',
    answer: [
      'Postulat dotyczy wyłącznie pieniędzy publicznych i nie obejmuje nazwisk: publikowane dane mają stały identyfikator zamiast imienia, nazwiska, PESEL-u czy numeru prawa wykonywania zawodu. Podstawę prawną, ryzyko rozpoznania osoby w małym szpitalu i pozostałe pytania prawne omawiamy [przy postulacie](/postulat/#zarzuty).',
    ],
  },
];

/** Przypisy do odpowiedzi (lista „Przypisy” pod pytaniami), w kolejności, w jakiej stoją w odpowiedziach. */
export const faqNotes = defineNotes({
  demagog:
    'Demagog, [weryfikacja wypowiedzi o zarobkach lekarzy w Polsce na tle Europy](https://demagog.org.pl/wypowiedzi/polska-trzecia-w-europie-pod-wzgledem-zarobkow-lekarzy-nie-da-sie-tego-zweryfikowac/), na podstawie raportu OECD „Health at a Glance 2025”.',
});
