/**
 * Zdawalność egzaminów państwowych w 2025 r. — LEK na tle egzaminów prawniczych i prawa jazdy
 * (infografika na /media/, zestaw w lib/infografiki/zestawy.ts).
 *
 * Wszędzie ta sama miara: odsetek przystępujących, którzy zdali, liczony ze wszystkich podejść
 * w sesji (edycji, okresie) — z powtórkami. Przy LEK powtórki to głównie osoby, które już zdały
 * i poprawiają wynik do rankingu na specjalizacje; przy pierwszym podejściu zdało 96,0%
 * (2583 z 2690, ta sama tabela CEM). Egzaminy na uprawnienia budowlane (test i ustny) liczymy
 * jak IARP: zdało całość / (zdało + nie zdało na którymkolwiek etapie).
 *
 * Doradcy podatkowego tu nie ma: za 2025 r. MF nie opublikowało liczb (wyniki części pisemnej
 * zdjęte ze strony, ustnej nie publikuje); jest tylko „nie przekroczyła 35%” od 2014 r.
 * (uzasadnienie projektu, druk Sejmu nr 1729) — górna granica z 12 lat, nie pomiar za rok.
 */

export interface ExamPassRate {
  key: string;
  name: string;
  /** kto przeprowadza / jaki egzamin i okres — dopisek pod nazwą */
  note: string;
  /** przystąpiło i zdało, gdy źródło podaje liczby; inaczej sam odsetek */
  took?: number;
  passed?: number;
  /** odsetek podany przez źródło (gdy nie ma liczb) */
  percent?: number;
  source: { publisher: string; title: string; url: string };
}

export const EXAMS_2025: ExamPassRate[] = [
  {
    key: 'lek',
    name: 'Egzamin lekarski (LEK)',
    note: 'CEM · jesień 2025',
    took: 9850,
    passed: 9679,
    source: {
      publisher: 'Centrum Egzaminów Medycznych',
      title: 'Zbiorcze wyniki Lekarskiego Egzaminu Końcowego w sesji jesiennej 2025 r.',
      url: 'https://www.cem.edu.pl/lep_s.php',
    },
  },
  {
    key: 'radcowski',
    name: 'Egzamin radcowski',
    note: 'MS · kwiecień 2025',
    took: 2056,
    passed: 1711,
    source: {
      publisher: 'Ministerstwo Sprawiedliwości',
      title: 'Wyniki egzaminu adwokackiego i radcowskiego (23.05.2025)',
      url: 'https://www.gov.pl/web/sprawiedliwosc/wyniki-egzaminu-adwokackiego-i-radcowskiego2',
    },
  },
  {
    key: 'adwokacki',
    name: 'Egzamin adwokacki',
    note: 'MS · kwiecień 2025',
    took: 1535,
    passed: 1264,
    source: {
      publisher: 'Ministerstwo Sprawiedliwości',
      title: 'Wyniki egzaminu adwokackiego i radcowskiego (23.05.2025)',
      url: 'https://www.gov.pl/web/sprawiedliwosc/wyniki-egzaminu-adwokackiego-i-radcowskiego2',
    },
  },
  {
    // 4990 uprawnień z 6871 zakończonych podejść: 209 nie zdało testu, 1672 — części ustnej
    // (tab. 5.2.5: test 5302 z 5511, ustny 4990 z 6662). PIIB podaje też „ogólną zdawalność”
    // 84,55%, ale sumuje w niej oba etapy jak dwa osobne egzaminy — tej miary nie bierzemy.
    key: 'inzynier',
    name: 'Inżynier budownictwa',
    note: 'PIIB · 2025',
    took: 4990 + 209 + 1672,
    passed: 4990,
    source: {
      publisher: 'Polska Izba Inżynierów Budownictwa',
      title: 'Sprawozdanie Krajowej Komisji Kwalifikacyjnej za 2025 r., tabela 5.2.5',
      url: 'https://www.piib.org.pl/pliki/organy/krajowy-zjazd-delegatow/ukz/uchwaly-xxv-krajowego-zjazdu-piib/Zalacznik_do_uchwaly_PIIB_KZ_0010_2026.pdf',
    },
  },
  {
    // wykres „zdało / nie zdało” 2022–2025 (sumy zgodne z tekstem strony: 2098 i 1085)
    key: 'architekt',
    name: 'Architekt',
    note: 'IARP · 2025',
    took: 440 + 285,
    passed: 440,
    source: {
      publisher: 'Izba Architektów RP',
      title: 'Statystyka egzaminacyjna Krajowej Komisji Kwalifikacyjnej (10.06.2026)',
      url: 'https://www.izbaarchitektow.pl/pokaz/statystyka-egzaminacyjna,3785/',
    },
  },
  {
    // MI podaje tylko odsetek, bez liczby egzaminów; okres: II półrocze 2025
    key: 'prawo-jazdy',
    name: 'Prawo jazdy kat. B',
    note: 'praktyczny · II półr. 2025',
    percent: 34.97,
    source: {
      publisher: 'Ministerstwo Infrastruktury',
      title: 'Odpowiedź na interpelację nr 14849 (2.02.2026)',
      url: 'https://api.sejm.gov.pl/sejm/term10/interpellations/attachment/ATTDQXK99/i14849-o1.pdf',
    },
  },
];

/** Odsetek zdanych w procentach — z liczb, a gdy źródło ich nie podaje, z jego odsetka. */
export const passRate = (e: ExamPassRate) => (e.took && e.passed ? (e.passed / e.took) * 100 : e.percent!);
