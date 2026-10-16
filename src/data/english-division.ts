/**
 * Analiza /analizy/english-division/: limity przyjęć na kierunek lekarski z pulą w języku obcym,
 * miejsca w języku obcym według uczelni, czesne, stawki za zajęcia i szacunek wpływów z czesnego.
 * Tekst i przypisy są w content/articles/english-division.mdx — tu dane, które rysują
 * komponenty english-division/* i bloki w artykule.
 *
 * Aktualizacja raz w roku, gdy w Dz.U. ukaże się rozporządzenie MZ w sprawie limitu przyjęć
 * (sierpień–wrzesień): dopisz rok na końcu LIMITS i podmień UNIVERSITIES. Czesne — przy naborze.
 * Liczby w treści artykułu (udział, wzrost puli, suma) trzeba wtedy poprawić ręcznie.
 */
import type { BarRow } from '@/types';
import { formatPL } from '@/lib/format';

export interface Act {
  /** rok Dziennika Ustaw (= rok naboru) */
  year: number;
  /** pozycja w Dzienniku Ustaw */
  pos: number;
  /** „2026, poz. 1167” */
  label: string;
  href: string;
}

/** Rozporządzenie MZ w Dzienniku Ustaw: rok i pozycja → tekst aktu w API Sejmu. */
const du = (year: number, pos: number): Act => ({
  year,
  pos,
  label: `${year}, poz. ${pos}`,
  href: `https://api.sejm.gov.pl/eli/acts/DU/${year}/${pos}/text.pdf`,
});

/* ---------- Limit przyjęć na kierunek lekarski ---------- */

export interface LimitYear {
  /** rok akademicki */
  year: string;
  /**
   * Limit ogółem: suma czterech kolumn załącznika nr 1 — studia stacjonarne po polsku, miejsca dla
   * cudzoziemców na stacjonarnych po polsku, niestacjonarne po polsku i studia w języku innym niż polski.
   * Wersja końcowa: rozporządzenie razem z nowelizacjami z tego samego naboru (`amendments`).
   */
  total: number;
  /** w tym: studia stacjonarne lub niestacjonarne w języku innym niż polski */
  foreign: number;
  /** rozporządzenie wyjściowe */
  act: Act;
  /** rozporządzenia zmieniające załącznik nr 1 w tym samym naborze (wliczone w `total`) */
  amendments?: Act[];
  /** zastrzeżenie do wiersza — gwiazdka w tabeli, treść w podpisie */
  flag?: boolean;
}

/**
 * JEDNO ŹRÓDŁO limitów przyjęć na kierunek lekarski dla całego serwisu (english-division,
 * ciecie-limitow-na-medycyne, odsiew-na-medycynie) — nie wpisuj tych sum ręcznie gdzie indziej.
 *
 * Sumy po uczelniach, obliczenia własne, w WERSJI KOŃCOWEJ — po nowelizacjach z tego samego naboru
 * (od 16.10.2026; wcześniej plik trzymał brzmienie pierwotne). Nowelizacje, które zmieniły sumę:
 *   2018/19: Dz.U. 2018 poz. 1381 → poz. 1845 (+48 niestac. CM UMK, nowy wiersz WSTK Katowice 100 + 20) = 7 846 → 8 014
 *   2019/20: Dz.U. 2019 poz. 1344 → poz. 1713 (+12 niestac., Gdański UM) = 8 158 → 8 170
 *   2022/23: Dz.U. 2022 poz. 1655 → poz. 2023 (nowy lp. 24, +75 stac.) = 9 406 → 9 481
 *   2023/24: Dz.U. 2023 poz. 1322 → poz. 2027 (+50, +50, +30, +20 i lp. 31–36) = 9 804 → 10 289
 *            (wersję końcową podaje też MNiSW w odpowiedzi na interpelację nr 9177 z 28.04.2025)
 *   2024/25: Dz.U. 2024 poz. 1085 → poz. 1419 (ŚUM, UM Skłodowskiej-Curie, nowe lp. 31–33) = 9 882 → 10 065
 *            (MNiSW, interpelacja nr 9177: 6 468 + 106 + 1 652 + 1 839)
 * Żadna z tych nowelizacji nie zmieniła kolumny w języku obcym (`foreign`).
 * Pozostałe lata nie mają aktów zmieniających — według ELI („Akty zmieniające”), sprawdzone dla
 * wszystkich 15 aktów 16.10.2026. Przy nowym roku sprawdź to samo jesienią, po ewentualnej nowelizacji.
 * 2018/19: poz. 1845 (rozp. z 26.09.2018) zmienia wprost poz. 1381 — sprawdzone w tekście aktu 16.10.2026;
 * 8 014 podaje też aplikacja MZ (BASiW).
 * Wersje pierwotne 2015/16, 2019/20, 2023/24–2026/27 sprawdzone ponownie 15.10.2026 z tekstu aktów;
 * 2020/21–2021/22 zgadzają się z sumami podawanymi przez prasę branżową.
 */
export const LIMITS: LimitYear[] = [
  { year: '2012/13', total: 5202, foreign: 1288, act: du(2012, 864) },
  { year: '2013/14', total: 5352, foreign: 1361, act: du(2013, 986) },
  { year: '2014/15', total: 5510, foreign: 1451, act: du(2014, 1125) },
  // PDF z rozjechanym układem kolumn; sumy potwierdzone z warstwy tekstowej aktu (6 188 i 1 551)
  { year: '2015/16', total: 6188, foreign: 1551, act: du(2015, 1119), flag: true },
  { year: '2016/17', total: 7100, foreign: 1741, act: du(2016, 982) },
  { year: '2017/18', total: 7587, foreign: 1865, act: du(2017, 1251) },
  { year: '2018/19', total: 8014, foreign: 1891, act: du(2018, 1381), amendments: [du(2018, 1845)] },
  { year: '2019/20', total: 8170, foreign: 1892, act: du(2019, 1344), amendments: [du(2019, 1713)] },
  { year: '2020/21', total: 8309, foreign: 1967, act: du(2020, 1272) },
  { year: '2021/22', total: 9039, foreign: 1824, act: du(2021, 1359) },
  { year: '2022/23', total: 9481, foreign: 1879, act: du(2022, 1655), amendments: [du(2022, 2023)] },
  { year: '2023/24', total: 10289, foreign: 1829, act: du(2023, 1322), amendments: [du(2023, 2027)] },
  { year: '2024/25', total: 10065, foreign: 1839, act: du(2024, 1085), amendments: [du(2024, 1419)] },
  { year: '2025/26', total: 10504, foreign: 1888, act: du(2025, 1086) },
  { year: '2026/27', total: 10730, foreign: 1838, act: du(2026, 1167) },
];

/** Wiersz LIMITS dla roku akademickiego („2019/20”); brak roku to błąd w treści, więc build ma się wywrócić. */
export const limitOf = (year: string): LimitYear => {
  const row = LIMITS.find((r) => r.year === year);
  if (!row) throw new Error(`LIMITS: brak roku ${year}`);
  return row;
};

export const FIRST = LIMITS[0];
export const LATEST = LIMITS.at(-1)!;

/** Udział puli w języku obcym: 1 838 / 10 730 → „17,1%” */
export const share = (foreign: number, total: number) => `${formatPL((100 * foreign) / total, 1)}%`;

export const SUM = {
  total: LIMITS.reduce((s, r) => s + r.total, 0),
  foreign: LIMITS.reduce((s, r) => s + r.foreign, 0),
};

/* ---------- Miejsca w języku obcym według uczelni (rok LATEST) ---------- */

/** Dz.U. 2026 poz. 1167, zał. nr 1, ostatnia kolumna. Razem 1 838 w 17 uczelniach. */
export const UNIVERSITIES: { name: string; seats: number }[] = [
  { name: 'Uniwersytet Medyczny w Poznaniu', seats: 220 },
  { name: 'Uniwersytet Medyczny w Lublinie', seats: 200 },
  { name: 'Warszawski Uniwersytet Medyczny', seats: 170 },
  { name: 'Śląski Uniwersytet Medyczny w Katowicach', seats: 160 },
  { name: 'Uniwersytet Medyczny we Wrocławiu', seats: 140 },
  { name: 'Uniwersytet Medyczny w Białymstoku', seats: 126 },
  { name: 'Uniwersytet Jagielloński', seats: 120 },
  { name: 'Pomorski Uniwersytet Medyczny w Szczecinie', seats: 120 },
  { name: 'Uniwersytet Medyczny w Łodzi', seats: 104 },
  { name: 'Uniwersytet Warmińsko-Mazurski w Olsztynie', seats: 100 },
  { name: 'Uniwersytet Mikołaja Kopernika w Toruniu', seats: 96 },
  { name: 'Gdański Uniwersytet Medyczny', seats: 72 },
  { name: 'Akademia Śląska', seats: 60 },
  { name: 'Uniwersytet Jana Kochanowskiego w Kielcach', seats: 50 },
  { name: 'Uniwersytet Rzeszowski', seats: 40 },
  { name: 'Uniwersytet Andrzeja Frycza Modrzewskiego w Krakowie', seats: 40 },
  { name: 'Akademia WSB', seats: 20 },
];

/** Wiersze wykresu; wyróżniona największa pula. */
export const universityRows: BarRow[] = UNIVERSITIES.map((u, i) => ({
  label: u.name,
  value: u.seats,
  display: String(u.seats),
  highlight: i === 0,
}));

/* ---------- Czesne (kierunek lekarski po angielsku, rocznik 2026/27) ---------- */

export interface Fee {
  school: string;
  /** czesne za rok */
  year: string;
  /** cały sześcioletni program */
  total: string;
  href: string;
}

export const FEES: Fee[] = [
  {
    school: 'Uniwersytet Medyczny w Poznaniu',
    year: '71 000 zł (lata I–II), 85 750 zł (lata III–VI)',
    total: '485 000 zł',
    href: 'https://pums.edu.pl/tuition-fees',
  },
  {
    school: 'Uniwersytet Medyczny we Wrocławiu',
    year: '67 900 zł',
    total: '407 400 zł',
    href: 'https://www.umw.edu.pl/pl/kierunek-lekarski-english-division/tuition-fees',
  },
  {
    school: 'Śląski Uniwersytet Medyczny',
    year: '65 500 zł (2 × 32 750 zł)',
    total: '393 000 zł',
    href: 'https://student.sum.edu.pl/wp-content/uploads/2026/07/Tuition-Fees_2026_2027.pdf',
  },
  {
    school: 'Gdański Uniwersytet Medyczny',
    year: '64 200 zł',
    total: '385 200 zł',
    href: 'https://admission.mug.edu.pl/1447.html',
  },
  {
    school: 'Uniwersytet Jagielloński',
    year: '16 000 €',
    total: '96 000 €',
    href: 'https://medschool.uj.edu.pl/practical-info/tuition-fees/',
  },
];

/* ---------- Szacunek wpływów z czesnego (nie liczba sprawozdawcza) ---------- */

/**
 * Cudzoziemcy na kierunku lekarskim: 6,0% ze 105 090 studiowań cudzoziemców (OPI PIB, RAD-on,
 * stan na 1.07.2025) ≈ 6,3 tys. Czesne: najniższa i najwyższa stawka za I rok w tabeli FEES
 * (bez UJ, który podaje euro). Założenie: każdy z nich płaci czesne studiów po angielsku.
 */
export const ESTIMATE = {
  students: Math.round(0.06 * 105090),
  feeLow: 64200,
  feeHigh: 71000,
};
/** 6 305 × 64 200 zł ≈ 0,40 mld zł; × 71 000 zł ≈ 0,45 mld zł */
export const estimateBn = (fee: number) => formatPL((ESTIMATE.students * fee) / 1e9, 2);

/* ---------- Stawki za godzinę zajęć ---------- */

/** WUM: zasady przyznawania dodatkowych wynagrodzeń z przychodów własnych (zarządzenie nr 36/2017 ze zm.) */
export const WUM_RATES = {
  forms: ['Wykład', 'Seminarium', 'Ćwiczenia'],
  /** zał. nr 1 — studia anglojęzyczne, stawka maksymalna */
  english: [250, 150, 90],
  /** zał. nr 2 — studia niestacjonarne (zaoczne) po polsku */
  extramural: [120, 74, 65],
};

/** „2,08×” */
export const ratio = (a: number, b: number) => `${formatPL(a / b, 2)}×`;

/** UM w Lublinie, regulamin wynagradzania (tekst jednolity z 18.01.2021): zał. nr 5 i 6. */
export const LUBLIN = {
  /** dodatek do godziny ponadwymiarowej ze studentami anglojęzycznymi */
  bonus: { lecture: 60, other: 50 },
  /** dodatek do godziny w ramach pensum */
  bonusPensum: { lecture: 60, other: 40 },
  /** stawka za godzinę ponadwymiarową (zł) */
  positions: [
    { title: 'Profesor', rate: 98 },
    { title: 'Profesor uczelni, adiunkt z habilitacją', rate: 83 },
    { title: 'Adiunkt', rate: 69 },
    { title: 'Asystent, młodszy asystent', rate: 54 },
  ],
};

/* ---------- Publikacje, na które powołują się podpisy ilustracji (w treści — przypisy) ---------- */

export const LINKS = {
  ela: 'https://ela.nauka.gov.pl/pl/labor-market/absolwenci_obcokrajowcy_na_polskim_rynku_pracy',
  radon: 'https://radon.nauka.gov.pl/opendata/reports/download/pdf/Cudzoziemcy_na_uczelniach_w_Polsce_2024.pdf',
  wum1: 'https://praca.wum.edu.pl/sites/praca.wum.edu.pl/files/1wd_zarzadzenie_rektora_36-2017_zalacznik_zalacznik_1.pdf',
  wum2: 'https://praca.wum.edu.pl/sites/praca.wum.edu.pl/files/1wd_zarzadzenie_rektora_36-2017_zalacznik_zalacznik_2.pdf',
  lublin: 'https://bip.umlub.pl/download/gfx/bip/pl/bipdokumenty/6221/zalaczniki_regulamin_wynagradzania_tekst_jednolity.pdf',
} as const;
