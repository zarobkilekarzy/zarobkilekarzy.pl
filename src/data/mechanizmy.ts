/**
 * Strona /mechanizmy/: działy jako pytania czytelnika. Same mechanizmy to wpisy kolekcji
 * `articles` z polem `topic` — spis buduje lib/content.ts → getTopicGroups(MECHANISM_TOPICS, mechanismTopics).
 * Zdjęcia działów są pionowe (kadr 5:6) i własne dla tej strony; prawy dolny róg zasłania plakietka z liczbą.
 */
import type { MECHANISM_TOPICS, QuestionTopic } from '@/types';

import imgJawnosc from '@/assets/img/mechanizm-jawnosc.jpg';
import imgPlatnik from '@/assets/img/mechanizm-platnik.jpg';
import imgZatrudnienie from '@/assets/img/mechanizm-zatrudnienie.jpg';
import imgDostep from '@/assets/img/mechanizm-dostep.jpg';

export const mechanizmyPage = {
  title: 'Mechanizmy',
  eyebrow: 'Jak działa system',
  lead: 'Opisujemy mechanizmy systemowe, a nie konkretne osoby: jak konstrukcja systemu pozwala wąskiej grupie kumulować dochody ze środków publicznych — kosztem pacjentów i uczciwych lekarzy.',
  /** meta description (lead jest dłuższy niż 160 znaków) */
  description: 'Jak NFZ płaci szpitalom i kto ustala ceny, jak działają kontrakty i wiele etatów naraz, skąd się biorą fikcyjne wizyty i kto reguluje dostęp do zawodu.',
  common: {
    title: 'Wspólny mianownik: brak jawności',
    text: 'Wszystkie te mechanizmy łączy jedno: nie istnieje rejestr, który sumowałby publiczne wypłaty dla jednego lekarza. Dlatego nasz postulat dotyczy jawności, a nie osób. Każda teza na podstronach ma ogólnodostępne źródło.',
  },
};

export const mechanismTopics: Record<(typeof MECHANISM_TOPICS)[number], QuestionTopic> = {
  jawnosc: {
    label: 'Jawność i kontrola',
    question: 'Kto sprawdza, za co płacimy?',
    lead: 'Wizyty, których nie było, i brak rejestru, który by je wyłapał.',
    answer:
      'Prawie nikt. Kontrole NFZ są wybiórcze, a sumy publicznych wypłat dla jednego lekarza nikt nie publikuje — od 2026 r. państwo może ją policzyć, ale jej nie ujawnia. Jedynym świadkiem spoza układu placówka–Fundusz jest pacjent: w 2024 r. pacjenci zgłosili blisko 3,5 tys. zastrzeżeń do wpisów w IKP, a ponad 1,6 tys. okazało się zasadnych.',
    image: imgJawnosc,
    position: '50% 50%',
  },
  platnik: {
    label: 'Jak płaci NFZ',
    question: 'Za co właściwie płaci NFZ?',
    lead: 'Punkty, ryczałt, nadwykonania i ceny ustalane przez samego płatnika.',
    answer:
      'Za wpis w systemie, wyceniony w punktach — a nie za samą wizytę. Niezależna taryfa obejmuje ok. 17% wartości świadczeń, resztę cen ustala sam płatnik. Gdy cena rozjeżdża się z kosztem, jedne procedury stają się deficytowe (kolejka), a inne — magnesem na zysk.',
    image: imgPlatnik,
    position: '50% 50%',
  },
  zatrudnienie: {
    label: 'Formy zatrudnienia',
    question: 'Dlaczego nikt nie widzi, ile zarabia lekarz?',
    lead: 'Kontrakty, wiele etatów naraz i opłacana gotowość.',
    answer:
      'Około 73% specjalistów rozlicza się jako firma, a kwot kontraktów nikt nie publikuje. Ten sam lekarz może mieć umowy w kilku placówkach naraz i opłacaną gotowość „pod telefonem” — każda placówka widzi tylko swój kawałek.',
    image: imgZatrudnienie,
    position: '50% 10%',
  },
  dostep: {
    label: 'Dostęp do zawodu',
    question: 'Kto decyduje, ilu jest lekarzy?',
    lead: 'Limity miejsc na studiach i specjalizacjach, rola samorządu.',
    answer:
      'Limit miejsc na studiach i pulę rezydentur ustala minister zdrowia, placówki szkolące akredytuje CMKP, a jeden kierownik może prowadzić najwyżej trzech lekarzy. Samorząd lekarski opiniuje limity i sprzeciwia się nowym kierunkom; czy ograniczanie wejścia podnosi stawki, to w Polsce hipoteza.',
    image: imgDostep,
    position: '50% 30%',
  },
};
