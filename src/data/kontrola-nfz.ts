/**
 * „Kontrola NFZ: kilka miesięcy z kilku lat” (/mechanizmy/kontrola-nfz/) — studium przypadku:
 * Szpital Wojewódzki im. Mikołaja Kopernika w Koszalinie (NIP 6691044410), grupy JGP H52, H53, H55.
 *
 * Liczby hospitalizacji szpitala: dane.gov.pl, zbiór 3009 (miesiąc × NIP × grupa JGP × długość pobytu × tryb
 * × płeć × wiek). Komórki z 1–4 pobytami są ukryte („<5”). Szacujemy je średnią wartością ukrytej komórki
 * w kraju dla danej grupy i roku: c = (dokładna krajowa liczba z API statystyk JGP NFZ − suma jawnych komórek)
 * / liczba ukrytych (c ≈ 1,3–1,8). Krajowe sumy i pobyty zerodniowe (2017–2024) są dokładne — API NFZ,
 * histogram czasu pobytu. Rok 2025: c z 2024 r., krajowe liczby też szacowane (API ich jeszcze nie ma).
 * Skrypty i przedziały (dolna granica: „<5” = 1, górna: „<5” = 4): research/hospitalizacje-nfz/.
 *
 * AKTUALIZACJA: nowy rok w zbiorze 3009 (ok. lipca) → przelicz research/hospitalizacje-nfz/zawez.py
 * i dopisz wiersz do MONTHLY.
 */

export const LINKS = {
  /** dane.gov.pl, zbiór 3009 „Dane dotyczące hospitalizacji rozliczonych JGP” */
  d3009: 'https://dane.gov.pl/pl/dataset/3009',
  /** Portal statystyk NFZ — JGP (API: app-stat-api-jgp, histogram czasu pobytu) */
  stat: 'https://statystyki.nfz.gov.pl/Benefits/1a',
  /** NFZ, zarządzenie 48/2025/DSOZ (leczenie szpitalne), zał. 1 — katalog JGP; AOS: 132/2024/DSOZ */
  katalog: 'https://baw.nfz.gov.pl/NFZ/document/43566/Zarzadzenie-48_2025_DSOZ',
  /** Centrum e-Zdrowia, „Liczba pacjentów JGP” — wartość jednostek rozliczonych per świadczeniodawca, zakres, grupa, rok */
  ezdrowie: 'https://ezdrowie.gov.pl/portal/home/badania-i-dane/zdrowe-dane/zestawienia/liczba-pacjentow-jgp',
  /** NFZ, „Szczegółowe wyniki kontroli” — wpisy DK.TWK-X.4840.006.2024 i DK.TWK-X.4840.026.2025 */
  kontrole: 'https://www.nfz.gov.pl/o-nfz/kontrole/kontrole-nfz/szczegolowe-wyniki-kontroli/',
  kontroleXlsx: 'https://www.nfz.gov.pl/download/gfx/nfz/pl/defaultstronaopisowa/1087/1/12/szczegolowe_informacje_o_wynikach_kontroli_7.xlsx',
};

/** Szacowana miesięczna liczba hospitalizacji Koszalina: rok → 12 miesięcy */
export const MONTHLY: Record<'H52' | 'H53', Record<number, number[]>> = {
  H52: {
    2019: [26, 24, 30, 40, 30, 29, 24, 23, 26, 29, 1, 4],
    2020: [18, 25, 14, 10, 23, 26, 23, 19, 29, 38, 26, 63],
    2021: [66, 91, 113, 83, 97, 114, 132, 106, 94, 62, 87, 108],
    2022: [120, 117, 137, 132, 121, 136, 118, 165, 154, 167, 139, 127],
    2023: [88, 107, 156, 133, 116, 129, 108, 48, 39, 55, 86, 52],
    2024: [68, 85, 101, 105, 16, 16, 18, 16, 15, 16, 16, 13],
    2025: [15, 19, 15, 18, 21, 20, 13, 16, 19, 20, 25, 25],
  },
  H53: {
    2019: [0, 0, 0, 0, 0, 0, 3, 1, 0, 0, 1, 1],
    2020: [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 5],
    2021: [4, 1, 4, 3, 6, 3, 1, 3, 1, 1, 0, 1],
    2022: [4, 1, 4, 3, 0, 0, 0, 1, 0, 3, 3, 1],
    2023: [7, 0, 4, 4, 1, 5, 0, 3, 1, 0, 0, 4],
    2024: [14, 13, 16, 6, 77, 81, 109, 114, 159, 139, 125, 122],
    2025: [92, 114, 116, 113, 99, 98, 90, 116, 102, 111, 86, 78],
  },
};

const MONTH_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Punkty serii do IndexChart: środek miesiąca na osi lat */
export const monthlyPoints = (jgp: 'H52' | 'H53') =>
  Object.entries(MONTHLY[jgp]).flatMap(([year, months]) =>
    months.map((v, m) => ({ x: Number(year) + (m + 0.5) / 12, v, label: `${MONTH_NAMES[m]} ${year}`, tip: `ok. ${v}` })),
  );

/** Miesiące RRRR-MM od–do (do siatek zasięgu kontroli) */
export const monthRange = (from: string, to: string) => {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) { m = 1; y++; }
  }
  return out;
};

/** Zasięg drugiej kontroli w siatce miesięcy (obrazek OG): masowe rozliczenia H52 do kwietnia 2024 r., potem H53 */
export const CONTROL_GRID = {
  years: [2021, 2025] as [number, number],
  from: '2021-01',
  to: '2025-12',
  marked: monthRange('2023-01', '2023-08'),
  switchAt: '2024-05',
};
const gridMonths = monthRange(CONTROL_GRID.from, CONTROL_GRID.to);
/** liczby do legendy: sprawdzone, niesprawdzone H52, niesprawdzone H53 po zmianie kodu */
export const CONTROL_COUNTS = {
  checked: CONTROL_GRID.marked.length,
  h52: gridMonths.filter((k) => k < CONTROL_GRID.switchAt && !CONTROL_GRID.marked.includes(k)).length,
  h53: gridMonths.filter((k) => k >= CONTROL_GRID.switchAt).length,
};
