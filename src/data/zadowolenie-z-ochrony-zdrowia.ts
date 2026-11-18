/**
 * Analiza /analizy/zadowolenie-z-ochrony-zdrowia/: cztery badania opinii o ochronie zdrowia
 * (IRIS Network, CBOS, Ipsos, STADA) — wynik Polski, wyniki innych krajów i adresy źródeł.
 * Tekst i przypisy: content/articles/zadowolenie-z-ochrony-zdrowia.mdx; infografika: lib/infografiki/zestawy.ts.
 * Wszystkie wartości to odsetki (%) przepisane z raportów; każde badanie zadaje inne pytanie,
 * więc liczb z różnych badań nie uśredniamy ani nie odejmujemy.
 */

export const LINKS = {
  /** IRIS Network, „Global Public Confidence Study 2025 – Health Care Confidence Report” (plik z 20.03.2026); wyniki krajów: s. 11, metoda: s. 2 */
  iris: 'https://www.irisnetwork.org/IRIS---Global-Public-confidence_Healthcare_Q4-2025_20260320.pdf',
  /** CBOS, komunikat z badań nr 86/2025 „Opinie na temat funkcjonowania systemu opieki zdrowotnej” (wrzesień 2025) */
  cbos: 'https://www.cbos.pl/SPISKOM.POL/2025/K_086_25.PDF',
  /** Ipsos Health Service Report 2026 (październik 2026); indeks: s. 5–6, metoda: s. 34 */
  ipsos: 'https://resources.ipsos.com/rs/297-CXJ-795/images/IpsosHealthServiceReport2026.pdf?version=0',
  /** STADA Health Report 2026 (raport międzynarodowy, EN); zadowolenie: s. 6–7, metoda: s. 5 */
  stada: 'https://07.cdn.stada.com/media/y5rfptro/stada_health_report_2026_ai_is_transforming_healthcare.pdf',
  /** STADA Poland, informacja prasowa z 21.10.2026 — jedyne miejsce, które podaje pozycję Polski (17. z 20) */
  stadaPl: 'https://11.cdn.stada.com/media/vvfpss4u/stada_health-report_informacja-prasowa_2026.pdf',
  /** STADA, czeska broszura do raportu 2026 — wyniki Czech (74%) i Austrii (67%), których raport międzynarodowy nie podaje */
  stadaCz: 'https://08.cdn.stada.com/media/gvyfuah1/stada_health-report-26-cz_v06-1.pdf',
  /** OECD, „Health at a Glance 2025”, rozdział „Population coverage for healthcare” — wykres 5.2 i brzmienie pytania Gallupa */
  oecd: 'https://www.oecd.org/en/publications/health-at-a-glance-2025_8f9e3f98-en/full-report/population-coverage-for-healthcare_5c968b73.html',
  /** dane wykresu 5.2 (xlsx, wersja z 13.11.2025) */
  oecdData: 'https://stat.link/pv9eib',
  /** „Rzeczpospolita”, 10.04.2026 — omówienie raportu IRIS z liczbami innymi niż w raporcie */
  rp: 'https://www.rp.pl/ochrona-zdrowia/art44131661-polska-w-ogonie-zaufania-mieszkancow-do-systemu-ochrony-zdrowia',
};

export interface Study {
  key: 'iris' | 'cbos' | 'ipsos' | 'stada' | 'oecd';
  name: string;
  /** co mierzy liczba — krótko, do podpisu słupka i infografiki */
  measure: string;
  /** to samo jako pierwszy plan infografiki: krótko, od wielkiej litery */
  headline: string;
  /** termin badania */
  when: string;
  /** wynik Polski, % */
  poland: number;
  /** średnia podana w raporcie, %; brak = raport jej nie podaje albo badanie obejmuje tylko Polskę */
  average?: number;
  /** pozycja Polski i liczba krajów; brak = badanie krajowe */
  rank?: { place: number; of: number };
  href: string;
}

/** Od najniższego wyniku Polski. */
export const STUDIES: Study[] = [
  { key: 'iris', name: 'IRIS Network', headline: 'System „doskonały” lub „zasadniczo dobry”', measure: 'system „doskonały” lub „zasadniczo dobry”', when: 'IV kw. 2025', poland: 19, average: 45, rank: { place: 19, of: 20 }, href: LINKS.iris },
  { key: 'cbos', name: 'CBOS', headline: 'Zadowoleni z opieki zdrowotnej', measure: 'zadowoleni z opieki zdrowotnej', when: 'czerwiec 2025', poland: 25, href: LINKS.cbos },
  { key: 'ipsos', name: 'Ipsos', headline: 'Indeks jakości opieki z pięciu pytań', measure: 'indeks z pięciu pytań', when: 'lipiec–sierpień 2026', poland: 35, rank: { place: 30, of: 32 }, href: LINKS.ipsos },
  { key: 'stada', name: 'STADA', headline: 'Zadowoleni z publicznego systemu', measure: 'zadowoleni z publicznego systemu', when: 'luty–marzec 2026', poland: 38, average: 56, rank: { place: 17, of: 20 }, href: LINKS.stada },
];

export const study = (key: Study['key']) => STUDIES.find((s) => s.key === key)!;

export type CountryRow = [name: string, value: number];

/** IRIS 2025, s. 11: odsetek odpowiedzi „excellent” + „basically good”, 20 krajów. */
export const IRIS_COUNTRIES: CountryRow[] = [
  ['Korea Płd.', 86], ['Malezja', 81], ['Japonia', 81], ['Hiszpania', 65], ['Indonezja', 64], ['Australia', 58], ['Szwajcaria', 57],
  ['Niemcy', 47], ['USA', 45], ['Austria', 42], ['Kanada', 40], ['Irlandia', 35], ['Finlandia', 35], ['Włochy', 34], ['Dominikana', 33],
  ['Rumunia', 26], ['Bułgaria', 22], ['Grecja', 22], ['Polska', 19], ['Turcja', 15],
];

/** Ipsos 2026, s. 5–6: Quality of Care Perception Index, 32 kraje (raport nie podaje średniej indeksu). */
export const IPSOS_COUNTRIES: CountryRow[] = [
  ['Malezja', 72], ['Singapur', 68], ['Indie', 68], ['Wietnam', 67], ['Australia', 64], ['Holandia', 63], ['Tajlandia', 61],
  ['Korea Płd.', 60], ['Hiszpania', 60], ['RPA', 59], ['Belgia', 58], ['Indonezja', 57], ['Szwecja', 55], ['Argentyna', 53],
  ['Nowa Zelandia', 52], ['Francja', 52], ['Irlandia', 52], ['Wielka Brytania', 51], ['Kanada', 51], ['USA', 50], ['Turcja', 49],
  ['Japonia', 46], ['Meksyk', 45], ['Niemcy', 43], ['Brazylia', 42], ['Włochy', 42], ['Chile', 41], ['Rumunia', 41],
  ['Kolumbia', 40], ['Polska', 35], ['Peru', 33], ['Węgry', 28],
];

/**
 * STADA 2026: zadowoleni z publicznego systemu ochrony zdrowia — 17 z 20 krajów: 15 z tekstu raportu
 * międzynarodowego, Czechy i Austria z czeskiej broszury STADA (LINKS.stadaCz, sekcja o spokojenosti; broszura
 * powtarza też Niemcy 63, Słowację 38, Polskę 38 i Węgry 27). Bez Bułgarii, Irlandii i Włoch — oficjalnego źródła brak.
 */
export const STADA_COUNTRIES: CountryRow[] = [
  ['Belgia', 86], ['Uzbekistan', 82], ['Szwajcaria', 77], ['Czechy', 74], ['Francja', 71], ['Austria', 67], ['Wielka Brytania', 65], ['Niemcy', 63], ['Hiszpania', 62],
  ['Litwa', 60], ['Portugalia', 54], ['Rumunia', 48], ['Kazachstan', 43], ['Polska', 38], ['Słowacja', 38], ['Serbia', 36], ['Węgry', 27],
];

/**
 * CBOS 86/2025, s. 6: „Czy, ogólnie rzecz biorąc, jest Pan(i) zadowolony(a) czy też niezadowolony(a) z tego,
 * jak obecnie funkcjonuje opieka zdrowotna w naszym kraju?” — sumy odpowiedzi „zdecydowanie” i „raczej”, %.
 * `x` = położenie pomiaru na osi czasu (rok + ułamek z miesiąca).
 */
export const CBOS_SERIES: { label: string; x: number; satisfied: number; dissatisfied: number }[] = [
  { label: 'I 2001', x: 2001.04, satisfied: 31, dissatisfied: 64 }, { label: 'III 2007', x: 2007.21, satisfied: 37, dissatisfied: 58 },
  { label: 'VIII 2008', x: 2008.63, satisfied: 25, dissatisfied: 68 }, { label: 'III 2009', x: 2009.21, satisfied: 34, dissatisfied: 63 },
  { label: 'II 2010', x: 2010.13, satisfied: 22, dissatisfied: 75 }, { label: 'II 2012', x: 2012.13, satisfied: 19, dissatisfied: 78 },
  { label: 'VI 2014', x: 2014.46, satisfied: 28, dissatisfied: 68 }, { label: 'VI 2016', x: 2016.46, satisfied: 23, dissatisfied: 74 },
  { label: 'VI 2018', x: 2018.46, satisfied: 30, dissatisfied: 66 }, { label: 'VI 2020', x: 2020.46, satisfied: 36, dissatisfied: 58 },
  { label: 'VII 2021', x: 2021.54, satisfied: 29, dissatisfied: 67 }, { label: 'IX 2021', x: 2021.71, satisfied: 29, dissatisfied: 66 },
  { label: 'VI 2023', x: 2023.46, satisfied: 27, dissatisfied: 70 }, { label: 'VI 2025', x: 2025.46, satisfied: 25, dissatisfied: 70 },
];

/** CBOS 86/2025, s. 3 i 7: oceny poszczególnych stron opieki zdrowotnej, %. */
export const CBOS_ASPECTS = { specialistsBad: 82, appointmentsBad: 63, competenceGood: 73, satisfied65: 36 };

/**
 * CBOS 86/2025, rys. 2 (s. 5 komunikatu): „Czy zgadza się Pan(i) czy też nie zgadza z następującymi opiniami
 * dotyczącymi porad i świadczeń medycznych, jakie otrzymuje się obecnie w ramach powszechnego ubezpieczenia
 * zdrowotnego w NFZ?” — `yes` = „zdecydowanie tak” + „raczej tak”, `no` = „raczej nie” + „zdecydowanie nie”, %;
 * reszta to „trudno powiedzieć”. Stwierdzenia skrócone, kolejność jak na rysunku (od najwyższej zgody).
 */
export const CBOS_OPINIONS: { label: string; yes: number; no: number }[] = [
  { label: 'Lekarze są kompetentni', yes: 73, no: 19 },
  { label: 'Lekarze angażują się w swoją pracę', yes: 64, no: 26 },
  { label: 'Do lekarza POZ można dostać się bez trudności', yes: 63, no: 35 },
  { label: 'Wykorzystuje się nowoczesną aparaturę', yes: 62, no: 22 },
  { label: 'Lekarze POZ właściwie rozpoznają problemy pacjenta', yes: 60, no: 26 },
  { label: 'Pacjenci są traktowani z życzliwością i troską', yes: 59, no: 30 },
  { label: 'Jest dobra informacja, gdzie uzyskać pomoc', yes: 55, no: 36 },
  { label: 'Nawet w nocy można liczyć na natychmiastową pomoc', yes: 54, no: 35 },
  { label: 'Wszyscy pacjenci są równo traktowani', yes: 49, no: 35 },
  { label: 'Wykorzystuje się nowoczesne rozwiązania', yes: 49, no: 30 },
  { label: 'Pomoc łatwo uzyskać poza miejscem zamieszkania', yes: 47, no: 22 },
  { label: 'Lekarze i pracownie są w dogodnych lokalizacjach', yes: 46, no: 49 },
  { label: 'Opieka nocna i świąteczna dobrze działa', yes: 40, no: 36 },
  { label: 'Badania diagnostyczne można wykonać szybko', yes: 35, no: 60 },
  { label: 'Wizytę można umówić na dogodną godzinę', yes: 29, no: 63 },
  { label: 'Personelu w szpitalach jest wystarczająco dużo', yes: 17, no: 65 },
  { label: 'Łatwo dostać się do specjalisty', yes: 14, no: 82 },
];

/**
 * OECD, „Health at a Glance 2025”, wykres 5.2 (LINKS.oecdData): zadowoleni z dostępności dobrej jakościowo opieki
 * zdrowotnej w miejscu zamieszkania, 2024 r., sondaż Gallup World Poll (co najmniej 1000 osób 15+ w kraju), %.
 * 38 krajów OECD; Luksemburg — dane z 2023 r. Średnia OECD38: 64,3 (2024) i 68,8 (2014); Polska w 2014 r.: 43.
 * Starszy o rok pomiar i inne pytanie niż w czterech badaniach z STUDIES — dlatego osobno: nie wchodzi do
 * zakresu „19–38%”, infografiki ani obrazka OG, tylko do wykresu rozrzutu, tabeli badań i własnej sekcji.
 */
export const OECD_COUNTRIES: CountryRow[] = [
  ['Szwajcaria', 89], ['Belgia', 86], ['Dania', 86], ['Luksemburg', 86], ['Holandia', 83], ['Niemcy', 81], ['Japonia', 80], ['Norwegia', 80],
  ['Austria', 78], ['Czechy', 75], ['Szwecja', 75], ['USA', 75], ['Izrael', 73], ['Australia', 71], ['Słowenia', 71], ['Kostaryka', 70],
  ['Korea Płd.', 69], ['Irlandia', 65], ['Nowa Zelandia', 63], ['Estonia', 62], ['Islandia', 62], ['Hiszpania', 62], ['Finlandia', 61],
  ['Wielka Brytania', 61], ['Francja', 60], ['Portugalia', 58], ['Meksyk', 56], ['Słowacja', 56], ['Łotwa', 54], ['Litwa', 53], ['Polska', 51],
  ['Kanada', 50], ['Kolumbia', 46], ['Chile', 44], ['Włochy', 44], ['Węgry', 41], ['Turcja', 41], ['Grecja', 27],
];

export const OECD: Study = {
  key: 'oecd', name: 'OECD (Gallup)', headline: 'Zadowoleni z dostępności opieki w okolicy', measure: 'zadowoleni z dostępności opieki w okolicy',
  when: '2024', poland: 51, average: 64, rank: { place: 31, of: 38 }, href: LINKS.oecd,
};
/** Polska i średnia OECD dziesięć lat wcześniej (ten sam wykres, seria 2014), %. */
export const OECD_2014 = { poland: 43, average: 69 };
