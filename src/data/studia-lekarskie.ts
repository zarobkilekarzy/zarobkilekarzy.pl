/**
 * Analiza /analizy/studia-lekarskie/: rekrutacja, porównanie z innymi kierunkami, program studiów,
 * anatomia (model) i nowe metody nauczania. Tekst i przypisy są w content/articles/studia-lekarskie.mdx.
 *
 * Skąd liczby (odczyt 27.10.2026, research/studia-lekarskie/):
 * - progi: zestawienia uczelni („wynik ostatniej osoby przyjętej” albo najbliższa temu miara —
 *   definicje się różnią, opis w `note` wykresu); UJ, UW i WUM sprawdzone w PDF-ach uczelni,
 * - odsiew: ELA (OPI PIB), plik students-major-data.csv, studia stacjonarne, roczniki 2016–2018,
 *   średnie ważone liczbą studentów programu (obliczenia własne, powtórzone dwukrotnie),
 * - centyle: CKE, „Wstępne informacje o wynikach egzaminu maturalnego 2026 — centyle”; „co najmniej 80%”
 *   = 100 − centyl wyniku o jeden punkt niższego niż 80%,
 * - model anatomii: liczby kości i opisy naczyń z podręcznika OpenStax „Anatomy and Physiology 2e”
 *   (CC BY 4.0), łacina według Terminologia Anatomica; rysunki — data/anatomia/*.svg.
 */
import type { BarRow } from '@/types';
import { formatPL } from '@/lib/format';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import { limitOf } from '@/data/english-division';

/* ---------- Publikacje, na które powołują się podpisy ilustracji (w treści — przypisy) ---------- */

export const LINKS = {
  ujStat: 'https://rekrutacja.uj.edu.pl/documents/1458734/161721486/1s_SWJP_P.pdf/8c916dda-1726-431c-b0e3-3481c2f06efb',
  uwProgi: 'https://rekrutacja.uw.edu.pl/files/pdf/Punkty_ostatnia_osoba_przyjeta_2026-27.pdf',
  uwKand: 'https://rekrutacja.uw.edu.pl/files/pdf/Kandydaci_na_miejsce_2026-27.pdf',
  wumProgi: 'https://rekrutacja-info.wum.edu.pl/sites/rekrutacja-info.wum.edu.pl/files/progi_punktowe_2026_za_wkr_0.pdf',
  cke: 'https://cke.gov.pl/images/_EGZAMIN_MATURALNY_OD_2023/Informacje_o_wynikach/2026/20260708%20Wst%C4%99pne%20informacje%20o%20wynikach%20EM26%20CENTYLE.pdf',
  ela: 'https://ela.nauka.gov.pl/pl/experts/source-data',
  standard: 'https://api.sejm.gov.pl/eli/acts/DU/2021/755/text.pdf',
  standard2025: 'https://api.sejm.gov.pl/eli/acts/DU/2025/1133/text.pdf',
  wumPrzewodnik: 'https://wl.wum.edu.pl/sites/wl.wum.edu.pl/files/przewodnik-dydaktyczny-dla-studentow-i-roku-stacjonarne_2.pdf',
  wumPlan: 'https://wl.wum.edu.pl/sites/wl.wum.edu.pl/files/program-studiow-dla-cyklu-ksztalcenia-rozpoczynajacego-sie-w-roku-2026-2027.pdf',
  ujAnatomia: 'https://katedra-anatomii.cm-uj.krakow.pl/cm/uploads/2026/10/Lekarski_Harmonogram-2026-27.pdf',
  ujSylabus: 'https://sylabus.cm-uj.krakow.pl/pl/8/1/7/1/1',
  openstax: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system',
  openstaxNaczynia: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways',
  ta2: 'https://ta2viewer.openanatomy.org/',
  commonsSzkielet: 'https://commons.wikimedia.org/wiki/File:Human_skeleton_front_en.svg',
  commonsNaczynia: 'https://commons.wikimedia.org/wiki/File:Circulatory_System_en.svg',
  sghProgi: 'https://www.sgh.waw.pl/archiwalne-progi-punktowe-na-studia-licencjackie',
  sghPunkty: 'https://www.sgh.waw.pl/przeliczanie-punktow-z-matury',
  sghTest: 'https://www.sgh.waw.pl/test-z-wiedzy-o-przedsiebiorczosci',
  sghLimity: 'https://www.sgh.waw.pl/limity-przyjec-na-studia-licencjackie',
  sghZasady: 'https://www.sgh.waw.pl/rekrutacja-krok-po-kroku-na-studia-licencjackie',
} as const;

/* ---------- Rekrutacja 2026: progi na kierunku lekarskim ---------- */

interface Threshold {
  school: string;
  /** wynik w punktach uczelni i maksimum */
  points: number;
  max: number;
  /** dopisek o definicji progu, gdy to nie „ostatnia przyjęta osoba po wszystkich turach” */
  note?: string;
  /** najniższy wynik na liście zakwalifikowanych, a nie przyjętych — poza zakresem w tekście */
  listOnly?: boolean;
  /** uczelnia „nowa”: pierwszy limit przyjęć na lekarski od 2015/16 (UNIVERSITIES_2026) */
  nowa?: boolean;
}

/** Studia stacjonarne po polsku, rekrutacja 2026/27; tylko uczelnie, które publikują próg */
export const THRESHOLDS_2026: Threshold[] = [
  { school: 'UM Lublin', points: 251, max: 300 },
  { school: 'UJK Kielce', points: 167.29, max: 200, note: 'I tura', nowa: true },
  { school: 'GUMed', points: 167, max: 200 },
  { school: 'UJ CM', points: 81.33, max: 100, note: 'I tura' },
  { school: 'UM Łódź', points: 324, max: 400, note: 'ostatni ogłoszony próg' },
  { school: 'UM Białystok', points: 161, max: 200 },
  { school: 'Uniwersytet Warszawski', points: 79.83, max: 100, nowa: true },
  { school: 'PUM Szczecin', points: 159, max: 200 },
  { school: 'ŚUM Katowice', points: 154, max: 200 },
  { school: 'UKSW', points: 76.5, max: 100, nowa: true },
  { school: 'Politechnika Wrocławska', points: 600.55, max: 785, note: 'I tura', nowa: true },
  { school: 'WUM', points: 229, max: 300 },
  { school: 'ŚUM, filia w Bielsku-Białej', points: 151, max: 200, note: 'filia od 2023/24' },
  { school: 'ANS w Nowym Targu', points: 137, max: 200, note: 'ostatnia lista zakwalifikowanych', listOnly: true, nowa: true },
  { school: 'AMiSNS w Elblągu', points: 141.4, max: 250, note: 'ostatnia lista zakwalifikowanych', listOnly: true, nowa: true },
];

const pct = (t: Threshold) => (t.points / t.max) * 100;
/** Punkty bez zbędnych zer: 600,55 · 141,4 · 229 */
const pts = (n: number) => formatPL(n, 2).replace(/,?0+$/, '');

export const thresholdRows: BarRow[] = THRESHOLDS_2026.map((t) => ({
  label: t.school,
  note: `${pts(t.points)} z ${formatPL(t.max)} pkt${t.note ? ` · ${t.note}` : ''}${t.nowa ? ' · nowa' : ''}`,
  value: pct(t),
  display: `${formatPL(pct(t), 1)}%`,
  highlight: t.nowa,
}));

/**
 * SGH dla porównania (nie kierunek lekarski): studia stacjonarne po polsku, obywatele polscy, nabór 2026.
 * Jedna lista na całą uczelnię — kierunek wybiera się pod koniec pierwszego roku. Próg podany przez SGH
 * (w pierwszym rankingu 340 pkt); maksimum 433 = 333 za cztery matury + 100 za test SGH. Limit: 970 miejsc.
 * Liczby kandydatów SGH nie publikuje. Źródła: LINKS.sghProgi, LINKS.sghPunkty, LINKS.sghTest, LINKS.sghLimity.
 */
export const SGH_2026 = { points: 336, firstRound: 340, max: 433, maturaMax: 333, testMax: 100, places: 970 } as const;
const sghPct = (SGH_2026.points / SGH_2026.max) * 100;
export const sghRow: BarRow = {
  label: 'SGH — studia ekonomiczne',
  note: `${SGH_2026.points} z ${SGH_2026.max} pkt · matury i test SGH`,
  value: sghPct,
  display: `${formatPL(sghPct, 1)}%`,
  group: 'Dla porównania',
};

/** Zakres progów bez uczelni, które publikują tylko listy zakwalifikowanych */
const admitted = THRESHOLDS_2026.filter((t) => !t.listOnly).map(pct);
export const thresholdRange = {
  min: formatPL(Math.min(...admitted), 1),
  max: formatPL(Math.max(...admitted), 1),
};
/** Przedział progów starych uczelni i progi nowych (bez list zakwalifikowanych) — do akapitu o starych i nowych */
const oldPct = THRESHOLDS_2026.filter((t) => !t.listOnly && !t.nowa).map(pct);
export const thresholdOld = { min: formatPL(Math.min(...oldPct), 1), max: formatPL(Math.max(...oldPct), 1) };
export const thresholdNew = THRESHOLDS_2026.filter((t) => !t.listOnly && t.nowa).map((t) => ({ school: t.school, pct: formatPL(pct(t), 1) }));
export const listOnlyRows = THRESHOLDS_2026.filter((t) => t.listOnly).map((t) => ({ school: t.school, pct: formatPL(pct(t), 1) }));

/* ---------- UJ: ta sama liczba miejsc, więcej chętnych, wyższy próg ---------- */

export const UJ_LEKARSKI = [
  { year: 2024, places: 258, candidates: 1085, threshold: 73.67 },
  { year: 2025, places: 253, candidates: 1243, threshold: 75.67 },
  { year: 2026, places: 252, candidates: 1779, threshold: 81.33 },
] as const;

/* ---------- Stare i nowe uczelnie: limity przyjęć na kierunek lekarski ---------- */

/**
 * Uczelnie z limitem większym od zera w załączniku nr 1 rozporządzeń MZ o limitach przyjęć, w wersji
 * końcowej (z nowelizacjami z tego samego naboru) — akty i sumy w data/english-division.ts (LIMITS).
 * Policzone z tekstu aktów 27.10.2026 (research/studia-lekarskie/uczelnie-limity.md); wiersze
 * z samymi zerami (np. pięć uczelni w 2024/25) nie liczą się. Filie w wierszach „w tym” należą do uczelni.
 */
export const UNIVERSITY_COUNTS = [
  { year: '2012/13', n: 12 },
  { year: '2013/14', n: 12 },
  { year: '2014/15', n: 12 },
  { year: '2015/16', n: 15 },
  { year: '2016/17', n: 16 },
  { year: '2017/18', n: 19 },
  { year: '2018/19', n: 20 },
  { year: '2019/20', n: 21 },
  { year: '2020/21', n: 21 },
  { year: '2021/22', n: 22 },
  { year: '2022/23', n: 24 },
  { year: '2023/24', n: 36 },
  { year: '2024/25', n: 33 },
  { year: '2025/26', n: 36 },
  { year: '2026/27', n: 39 },
] as const;

export const universityColumns = UNIVERSITY_COUNTS.map((r) => ({
  /** „12/13” — pełne „2012/13” przy 15 kolumnach na siebie wchodzi */
  label: r.year.slice(2),
  value: r.n,
  display: String(r.n),
}));

/**
 * Limity 2026/27 (Dz.U. 2026 poz. 1167, zał. nr 1): `pl` — studia stacjonarne po polsku (bez miejsc dla
 * cudzoziemców), `total` — wszystkie cztery kolumny. `first` — pierwszy rok z limitem; „stare” = 12 uczelni
 * z limitem jeszcze w 2014/15, „nowe” = pierwszy limit od 2015/16.
 */
const UNIVERSITIES_2026: { school: string; first: string; pl: number; total: number }[] = [
  { school: 'UM w Białymstoku', first: '2006/07', pl: 196, total: 450 },
  { school: 'GUMed', first: '2006/07', pl: 326, total: 553 },
  { school: 'ŚUM w Katowicach', first: '2006/07', pl: 806, total: 1127 },
  { school: 'UM w Lublinie', first: '2006/07', pl: 330, total: 744 },
  { school: 'UM w Łodzi', first: '2006/07', pl: 680, total: 874 },
  { school: 'UM w Poznaniu', first: '2006/07', pl: 340, total: 702 },
  { school: 'PUM w Szczecinie', first: '2006/07', pl: 255, total: 447 },
  { school: 'WUM', first: '2006/07', pl: 550, total: 882 },
  { school: 'UM we Wrocławiu', first: '2006/07', pl: 417, total: 656 },
  { school: 'Uniwersytet Jagielloński', first: '2006/07', pl: 255, total: 380 },
  { school: 'UMK (Collegium Medicum w Bydgoszczy)', first: '2006/07', pl: 240, total: 413 },
  { school: 'UWM w Olsztynie', first: '2008/09', pl: 170, total: 270 },
  { school: 'UJK w Kielcach', first: '2015/16', pl: 100, total: 231 },
  { school: 'Uniwersytet Rzeszowski', first: '2015/16', pl: 130, total: 225 },
  { school: 'Uniwersytet Zielonogórski', first: '2015/16', pl: 90, total: 140 },
  { school: 'Uniwersytet AFM w Krakowie', first: '2016/17', pl: 160, total: 200 },
  { school: 'Uniwersytet Opolski', first: '2017/18', pl: 120, total: 170 },
  { school: 'Uniwersytet Radomski', first: '2017/18', pl: 120, total: 170 },
  { school: 'Uczelnia Łazarskiego', first: '2017/18', pl: 120, total: 130 },
  { school: 'Akademia Śląska', first: '2018/19', pl: 225, total: 375 },
  { school: 'UKSW', first: '2019/20', pl: 70, total: 130 },
  { school: 'Uczelnia Medyczna im. M. Skłodowskiej-Curie', first: '2020/21', pl: 200, total: 200 },
  { school: 'UJD w Częstochowie', first: '2022/23', pl: 60, total: 90 },
  { school: 'AMiSNS w Elblągu', first: '2022/23', pl: 95, total: 100 },
  { school: 'Uniwersytet Kaliski', first: '2023/24', pl: 60, total: 75 },
  { school: 'KUL', first: '2023/24', pl: 80, total: 80 },
  { school: 'Akademia Mazowiecka', first: '2023/24', pl: 96, total: 96 },
  { school: 'Uniwersytet w Siedlcach', first: '2023/24', pl: 45, total: 45 },
  { school: 'Politechnika Wrocławska', first: '2023/24', pl: 120, total: 120 },
  { school: 'Uniwersytet Warszawski', first: '2023/24', pl: 60, total: 60 },
  { school: 'ANS w Nowym Sączu', first: '2023/24', pl: 45, total: 45 },
  { school: 'ANS w Nowym Targu', first: '2023/24', pl: 45, total: 45 },
  { school: 'Poznańska Akademia Medyczna NS', first: '2023/24', pl: 30, total: 40 },
  { school: 'SAN w Łodzi', first: '2023/24', pl: 50, total: 50 },
  { school: 'Akademia WSB', first: '2023/24', pl: 90, total: 140 },
  { school: 'AKSiM w Toruniu', first: '2023/24', pl: 80, total: 80 },
  { school: 'Akademia Tarnowska', first: '2024/25', pl: 60, total: 60 },
  { school: 'Politechnika Bydgoska', first: '2024/25', pl: 75, total: 75 },
  { school: 'UAM, filia w Pile', first: '2026/27', pl: 60, total: 60 },
];

const isNew = (u: { first: string }) => u.first >= '2015/16';
const oldU = UNIVERSITIES_2026.filter((u) => !isNew(u));
const newU = UNIVERSITIES_2026.filter(isNew);
const sum = (rows: { pl: number; total: number }[], k: 'pl' | 'total') => rows.reduce((a, r) => a + r[k], 0);
const totalAll = sum(UNIVERSITIES_2026, 'total');
if (totalAll !== limitOf('2026/27').total || UNIVERSITIES_2026.length !== UNIVERSITY_COUNTS.at(-1)!.n) {
  throw new Error(`UNIVERSITIES_2026: suma ${totalAll} albo liczba uczelni niezgodna z LIMITS / UNIVERSITY_COUNTS`);
}
const sizes = newU.map((u) => u.total).sort((a, b) => a - b);

/** Liczby do tekstu: ile nowych, ich miejsca i udział w limicie 2026/27, wielkość roczników (surowe — EN formatuje sam) */
export const OLD_NEW_N = {
  old: oldU.length,
  new: newU.length,
  new2023: newU.filter((u) => u.first === '2023/24').length,
  newTotal: sum(newU, 'total'),
  allTotal: totalAll,
  newShare: Math.round((100 * sum(newU, 'total')) / totalAll),
  newPl: sum(newU, 'pl'),
  allPl: sum(UNIVERSITIES_2026, 'pl'),
  newPlShare: Math.round((100 * sum(newU, 'pl')) / sum(UNIVERSITIES_2026, 'pl')),
  newMin: sizes[0],
  newMax: sizes.at(-1)!,
  newUnder100: sizes.filter((n) => n < 100).length,
  oldMin: Math.min(...oldU.map((u) => u.total)),
  oldMax: Math.max(...oldU.map((u) => u.total)),
  oldTotal: sum(oldU, 'total'),
  oldTotal2012: limitOf('2012/13').total,
};
const big = ['newTotal', 'allTotal', 'newPl', 'allPl', 'newMax', 'oldMax', 'oldTotal', 'oldTotal2012'] as const;
/** To samo z liczbami do tekstu po polsku (1 127, 3 232) */
export const OLD_NEW = {
  ...OLD_NEW_N,
  ...(Object.fromEntries(big.map((k) => [k, formatPL(OLD_NEW_N[k])])) as Record<(typeof big)[number], string>),
};

/* ---------- Ile kosztują studia: czesne za pierwszy rok, rocznik 2026/27 ---------- */

/**
 * Opłata za pierwszy rok przy płatności jednorazowej (albo za dwa semestry), zł; studia po polsku.
 * Źródła — zarządzenia i cenniki uczelni (research/studia-lekarskie/koszt-studiow.md, przypis [^czesne]).
 * Pominięte: UM w Lublinie (zarządzenie nieosiągalne z tej maszyny), UM w Poznaniu i CM UMK (kwot nie
 * pobrano), Uczelnia Łazarskiego (brak cennika uczelni — kwoty tylko z portali).
 */
export const TUITION_2026: { school: string; perYear: number; publicSchool: boolean; note?: string }[] = [
  { school: 'WUM', perYear: 69_500, publicSchool: true, note: '417 000 zł za 6 lat według uczelni' },
  { school: 'PUM w Szczecinie', perYear: 63_000, publicSchool: true },
  { school: 'ŚUM w Katowicach', perYear: 57_000, publicSchool: true },
  { school: 'UM w Łodzi', perYear: 54_000, publicSchool: true },
  { school: 'GUMed', perYear: 53_800, publicSchool: true },
  { school: 'UM we Wrocławiu', perYear: 53_000, publicSchool: true },
  { school: 'UM w Białymstoku', perYear: 53_000, publicSchool: true, note: 'od IV roku więcej' },
  { school: 'Uniwersytet Rzeszowski', perYear: 40_000, publicSchool: true },
  { school: 'Uniwersytet AFM w Krakowie', perYear: 60_000, publicSchool: false, note: 'co rok o 800 zł więcej' },
  { school: 'Akademia Śląska', perYear: 50_000, publicSchool: false, note: 'od III roku więcej' },
  { school: 'Uczelnia Medyczna im. M. Skłodowskiej-Curie', perYear: 50_000, publicSchool: false },
  { school: 'Akademia WSB', perYear: 48_000, publicSchool: false, note: 'od II roku więcej' },
];

export const tuitionRows: BarRow[] = TUITION_2026.map((t, i, all) => ({
  label: t.school,
  note: t.note ? `· ${t.note}` : undefined,
  value: t.perYear,
  display: `${formatPL(t.perYear)} zł`,
  group: i === 0 || all[i - 1].publicSchool !== t.publicSchool
    ? (t.publicSchool ? 'Uczelnie publiczne · studia niestacjonarne' : 'Uczelnie niepubliczne · studia stacjonarne')
    : undefined,
}));
const publicFees = TUITION_2026.filter((t) => t.publicSchool).map((t) => t.perYear);
const privateFees = TUITION_2026.filter((t) => !t.publicSchool).map((t) => t.perYear);
export const TUITION = {
  publicMin: formatPL(Math.min(...publicFees)),
  publicMax: formatPL(Math.max(...publicFees)),
  privateMin: formatPL(Math.min(...privateFees)),
  privateMax: formatPL(Math.max(...privateFees)),
};

/** Limit 2026/27: miejsca niestacjonarne po polsku (płatne) i wszystkie — Dz.U. 2026 poz. 1167 */
export const PAID_PLACES = { extramural: 1734, total: limitOf('2026/27').total };

/**
 * Kredyt na studia medyczne (art. 103a–103d i 422a PSW; M.P. 2026 poz. 424; BGK, FKSM, stan na 30.09.2026).
 * Umowy i wartość — narastająco od 18.07.2022; dopłaty do odsetek za cały 2025 r.
 */
export const CREDIT = { perSemester: 22_000, max: 264_000, contracts: 5_807, valueBln: 1.27, interest2025Mln: 25.6 } as const;

/* ---------- UW 2026: próg i kandydaci na miejsce ---------- */

export const UW_2026 = [
  { label: 'Informatyka', threshold: 91.1, perPlace: 4.6 },
  { label: 'Matematyka', threshold: 86.11, perPlace: 4.5 },
  { label: 'Fizyka', threshold: 81.04, perPlace: 4.6 },
  { label: 'Psychologia', threshold: 80.75, perPlace: 14.6 },
  { label: 'Prawo', threshold: 80.1, perPlace: 5.5 },
  { label: 'Kierunek lekarski', threshold: 79.83, perPlace: 32.8 },
];

/** Wykres „kolejka i poprzeczka”: od najwyższego progu, lekarski wyróżniony */
export const uwQueueRows = [...UW_2026]
  .sort((a, b) => b.threshold - a.threshold)
  .map((r) => ({
    label: r.label,
    count: r.perPlace,
    countDisplay: formatPL(r.perPlace, 1),
    bar: r.threshold,
    barDisplay: pts(r.threshold),
    highlight: r.label === 'Kierunek lekarski',
  }));

export const UW_LEKARSKI = UW_2026.find((r) => r.label === 'Kierunek lekarski')!;
export const UW_INFORMATYKA = UW_2026.find((r) => r.label === 'Informatyka')!;
const WORDS = ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'];
/** „siedem razy więcej” — ile razy więcej zgłoszeń na miejsce na lekarskim niż na informatyce (słownie, zaokr. w dół) */
export const uwQueueRatio = WORDS[Math.floor(UW_LEKARSKI.perPlace / UW_INFORMATYKA.perPlace)] ?? String(Math.floor(UW_LEKARSKI.perPlace / UW_INFORMATYKA.perPlace));

/* ---------- Matura 2026: odsetek zdających z wynikiem co najmniej 80% (CKE) ---------- */

export const AT_LEAST_80 = [
  { subject: 'biologia', share: 6 },
  { subject: 'matematyka', share: 8 },
  { subject: 'chemia', share: 10 },
  { subject: 'język polski', share: 14 },
] as const;

/* ---------- Odsiew: ELA, studia stacjonarne, roczniki 2016–2018 ---------- */

export const ELA_ROWS = [
  { major: 'Kierunek lekarski', length: '6 lat', secondYear: 81.3, dropout: 7.4, marked: true },
  { major: 'Architektura', length: '4 lata', secondYear: 82.3, dropout: 8.6 },
  { major: 'Psychologia', length: '5 lat', secondYear: 74.8, dropout: 9.8 },
  { major: 'Prawo', length: '5 lat', secondYear: 73.3, dropout: 7.5 },
  { major: 'Informatyka', length: '4 lata', secondYear: 62.6, dropout: 17.7 },
  { major: 'Matematyka', length: '3 lata', secondYear: 42.3, dropout: 12.0 },
  { major: 'Fizyka', length: '3 lata', secondYear: 34.4, dropout: 21.2 },
];

/* ---------- Model anatomii ---------- */

export interface Bone {
  name: string;
  latin: string;
  fact?: string;
}

/** Klucze = `data-bone` w data/anatomia/szkielet.svg; liczby z OpenStax (rozdz. 7–8) */
export const BONES: Record<string, Bone> = {
  Cranium: { name: 'Czaszka', latin: 'cranium', fact: 'Razem z żuchwą to 22 kości: 8 tworzy puszkę mózgową, 14 to kości twarzy.' },
  Mandible: { name: 'Żuchwa', latin: 'mandibula', fact: 'Jedyna ruchoma kość czaszki.' },
  CervicalVertebrae: { name: 'Kręgi szyjne', latin: 'vertebrae cervicales', fact: 'Siedem kręgów, C1–C7.' },
  ThoracicVertebrae: { name: 'Kręgi piersiowe', latin: 'vertebrae thoracicae', fact: 'Dwanaście kręgów, Th1–Th12.' },
  LumbarVertebrae: { name: 'Kręgi lędźwiowe', latin: 'vertebrae lumbales', fact: 'Pięć kręgów, L1–L5.' },
  Sacrum: { name: 'Kość krzyżowa', latin: 'os sacrum', fact: 'Powstaje ze zrostu pięciu kręgów krzyżowych.' },
  Coccyx: { name: 'Kość guziczna', latin: 'os coccygis', fact: 'Powstaje ze zrostu drobnych kręgów guzicznych, zwykle czterech.' },
  Manubrium: { name: 'Rękojeść mostka', latin: 'manubrium sterni', fact: 'Górna z trzech części mostka.' },
  Sternum: { name: 'Mostek', latin: 'sternum', fact: 'Trzy części: rękojeść, trzon i wyrostek mieczykowaty.' },
  Ribs: { name: 'Żebra', latin: 'costae', fact: 'Dwanaście par; razem z mostkiem i chrząstkami żebrowymi tworzą klatkę piersiową.' },
  Clavicle: { name: 'Obojczyk', latin: 'clavicula' },
  Scapula: { name: 'Łopatka', latin: 'scapula' },
  Humerus: { name: 'Kość ramienna', latin: 'humerus' },
  Radius: { name: 'Kość promieniowa', latin: 'radius' },
  Ulna: { name: 'Kość łokciowa', latin: 'ulna' },
  Carpals: { name: 'Kości nadgarstka', latin: 'ossa carpi', fact: 'Osiem w każdej ręce.' },
  Metacarpals: { name: 'Kości śródręcza', latin: 'ossa metacarpi', fact: 'Pięć w każdej ręce.' },
  Phalanges: { name: 'Paliczki ręki', latin: 'phalanges manus', fact: 'Czternaście w każdej ręce. Cała kończyna górna to 30 kości.' },
  PelvicGirdle: { name: 'Kości miedniczne', latin: 'ossa coxae', fact: 'Każda powstaje ze zrostu trzech kości: biodrowej, kulszowej i łonowej.' },
  Femur: { name: 'Kość udowa', latin: 'femur', fact: 'Najdłuższa i najmocniejsza kość ciała.' },
  Patella: { name: 'Rzepka', latin: 'patella', fact: 'Największa trzeszczka, czyli kość tkwiąca w ścięgnie.' },
  Tibia: { name: 'Kość piszczelowa', latin: 'tibia' },
  Fibula: { name: 'Kość strzałkowa', latin: 'fibula' },
  Tarsals: { name: 'Kości stępu', latin: 'ossa tarsi', fact: 'Siedem w każdej stopie.' },
  Metatarsals: { name: 'Kości śródstopia', latin: 'ossa metatarsi', fact: 'Pięć w każdej stopie.' },
  PhalangesFoot: { name: 'Paliczki stopy', latin: 'phalanges pedis', fact: 'Czternaście w każdej stopie.' },
};

export interface BonePin {
  name: string;
  latin: string;
  /**
   * Położenie w ramce kości widocznej po prawej stronie rysunku (AnatomyModel, szkielet odbity w lustrze):
   * x od lewej krawędzi ramki (0) do prawej (1), y od góry (0) do dołu (1). Kości stoją ukośnie,
   * więc strona przyśrodkowa nie zawsze leży przy x = 0 — punkty sprawdzone isPointInFill.
   */
  x: number;
  y: number;
}

/** Struktury do wskazania, jak na egzaminie praktycznym (OpenStax, rozdz. 8.2 i 8.4) */
export const BONE_PINS: Record<string, BonePin[]> = {
  Humerus: [
    { name: 'Głowa kości ramiennej', latin: 'caput humeri', x: 0.08, y: 0.04 },
    { name: 'Guzek większy', latin: 'tuberculum majus', x: 0.4, y: 0.05 },
    { name: 'Guzowatość naramienna', latin: 'tuberositas deltoidea', x: 0.52, y: 0.42 },
    { name: 'Nadkłykieć przyśrodkowy', latin: 'epicondylus medialis', x: 0.5, y: 0.94 },
    { name: 'Główka kości ramiennej', latin: 'capitulum humeri', x: 0.82, y: 0.94 },
  ],
  Femur: [
    { name: 'Głowa kości udowej', latin: 'caput femoris', x: 0.52, y: 0.04 },
    { name: 'Krętarz większy', latin: 'trochanter major', x: 0.88, y: 0.08 },
    { name: 'Krętarz mniejszy', latin: 'trochanter minor', x: 0.66, y: 0.16 },
    { name: 'Kłykieć przyśrodkowy', latin: 'condylus medialis', x: 0.07, y: 0.94 },
    { name: 'Kłykieć boczny', latin: 'condylus lateralis', x: 0.48, y: 0.95 },
  ],
};

/** Opisy do struktur z BONE_PINS (pod listą w panelu) */
export const BONE_NOTES: Record<string, string> = {
  Humerus: 'Do guzowatości naramiennej przyczepia się mięsień naramienny, a do nadkłykcia przyśrodkowego — mięśnie przedniej strony przedramienia, którymi chwytamy.',
  Femur: 'Głowa kości udowej tworzy z panewką miednicy staw biodrowy, a kłykcie — razem z kością piszczelową — staw kolanowy.',
};

export interface VesselPin {
  name: string;
  latin: string;
  text: string;
  /** współrzędne w układzie rysunku naczynia.svg (koniec linii odnośnika w oryginale) */
  x: number;
  y: number;
}

/** OpenStax, rozdz. 20.5 */
export const VESSEL_PINS: VesselPin[] = [
  { name: 'Serce', latin: 'cor', text: 'Pompuje krew do dwóch obiegów: płucnego i ogólnego.', x: 325.4, y: 239.3 },
  { name: 'Łuk aorty', latin: 'arcus aortae', text: 'Aorta to największa tętnica ciała.', x: 306, y: 197.5 },
  { name: 'Żyła główna górna', latin: 'vena cava superior', text: 'Zbiera krew z większości ciała powyżej przepony.', x: 286.8, y: 215.4 },
  { name: 'Żyła główna dolna', latin: 'vena cava inferior', text: 'Zbiera krew z ciała poniżej przepony.', x: 286.3, y: 261.2 },
  { name: 'Tętnica szyjna wspólna i żyła szyjna wewnętrzna', latin: 'arteria carotis communis, vena jugularis interna', text: 'Tętnica dzieli się na szyjną wewnętrzną i zewnętrzną; żyła odprowadza krew głównie z mózgu.', x: 312, y: 152 },
  { name: 'Tętnica i żyła nerkowa', latin: 'arteria et vena renalis', text: 'Żyły nerkowe to zwykle największe żyły uchodzące do żyły głównej dolnej.', x: 284, y: 333.5 },
  { name: 'Tętnica i żyła udowa', latin: 'arteria et vena femoralis', text: 'Tętnica biodrowa zewnętrzna po wyjściu z jamy brzusznej zmienia nazwę na udową.', x: 329.1, y: 503.7 },
  { name: 'Żyła odpiszczelowa', latin: 'vena saphena magna', text: 'Duża żyła powierzchowna kończyny dolnej.', x: 304.9, y: 625.2 },
  { name: 'Tętnica promieniowa', latin: 'arteria radialis', text: 'Biegnie wzdłuż kości promieniowej, jak tętnica łokciowa wzdłuż łokciowej.', x: 150.3, y: 393.5 },
  { name: 'Żyła pośrodkowa łokcia', latin: 'vena mediana cubiti', text: 'Najczęstsze miejsce pobierania krwi żylnej.', x: 179.8, y: 328.7 },
];

/** viewBox rysunków (muszą się zgadzać z data/anatomia/*.svg) */
export const VIEWBOX = {
  szkielet: [50, 12, 365, 818],
  naczynia: [92, 14, 366, 806],
} as const;

/* ---------- LEK na tle innych egzaminów (te same liczby co infografika na /media/) ---------- */

export const examRows: BarRow[] = [...EXAMS_2025]
  .sort((a, b) => passRate(b) - passRate(a))
  .map((e) => ({
    label: e.name,
    note: e.approx ? `${e.note} · szacunek` : e.note,
    value: passRate(e),
    display: `${formatPL(passRate(e), 1)}%`,
    highlight: e.key === 'lek',
  }));

export const examSources = EXAMS_2025.map((e) => ({ label: `${e.source.publisher}, ${e.source.title}`, href: e.source.url }));
export const lekRate = formatPL(passRate(EXAMS_2025.find((e) => e.key === 'lek')!), 1);

/* ---------- Plan studiów WUM, cykl 2026/27: przedmioty rok po roku ---------- */

/** e — egzamin, z — zaliczenie, p — praktyki wakacyjne (zaliczenie) */
export type Form = 'e' | 'z' | 'p';

export interface PlanSubject {
  name: string;
  /** podpis na odcinku wykresu */
  short: string;
  hours: number;
  ects: number;
  form: Form;
  /** ten sam przedmiot na różnych latach (podświetla się razem), np. chirurgia */
  key?: string;
}

/**
 * WUM, „Program studiów dla cyklu kształcenia rozpoczynającego się w roku 2026/2027” (LINKS.wumPlan),
 * tabele lat I–VI. Części jednego przedmiotu z jednym zaliczeniem (np. choroby wewnętrzne na IV roku:
 * pulmonologia, angiologia, kardiologia) połączone w jeden odcinek; BHP z przysposobieniem bibliotecznym też.
 * Kontrola w buildzie: suma godzin roku = wiersz sumy w programie (884, 870, 874, 1064, 1168, 900).
 */
const subj = (name: string, short: string, hours: number, ects: number, form: Form, key?: string): PlanSubject => ({ name, short, hours, ects, form, key });

export const WUM_PLAN: { year: string; hours: number; subjects: PlanSubject[] }[] = [
  { year: 'I', hours: 884, subjects: [
    subj('Anatomia prawidłowa', 'Anatomia', 180, 20, 'e'),
    subj('Histologia z embriologią i cytofizjologią', 'Histologia', 120, 11, 'e'),
    subj('Pierwsza pomoc i elementy pielęgniarstwa', 'Pierwsza pomoc', 45, 3, 'z'),
    subj('Statystyka i informatyka medyczna', 'Statystyka', 35, 2, 'z'),
    subj('Historia medycyny', 'Historia medycyny', 35, 2, 'z'),
    subj('Biofizyka', 'Biofizyka', 30, 2, 'z'),
    subj('Etyka lekarska z elementami filozofii', 'Etyka', 30, 2, 'z'),
    subj('Język obcy', 'Język obcy', 60, 4, 'z', 'jezyk'),
    subj('Wychowanie fizyczne', 'WF', 60, 0, 'z'),
    subj('Podstawy biologii molekularnej', 'Biologia molekularna', 20, 1, 'z'),
    subj('Psychologia medyczna', 'Psychologia', 20, 1, 'z'),
    subj('Komunikacja medyczna', 'Komunikacja', 18, 1, 'z', 'komunikacja'),
    subj('Propedeutyka medycyny uzależnień', 'Uzależnienia', 15, 1, 'z'),
    subj('Bezpieczeństwo i higiena pracy, przysposobienie biblioteczne', 'BHP', 6, 0, 'z'),
    subj('Przedmiot do wyboru', 'Do wyboru', 90, 6, 'z', 'wybor'),
    subj('Praktyki zawodowe', 'Praktyki', 120, 4, 'p', 'praktyki'),
  ] },
  { year: 'II', hours: 870, subjects: [
    subj('Fizjologia z patofizjologią', 'Fizjologia', 220, 18, 'e'),
    subj('Biochemia z elementami chemii', 'Biochemia', 180, 16, 'e'),
    subj('Immunologia', 'Immunologia', 40, 3, 'e'),
    subj('Parazytologia', 'Parazytologia', 35, 2, 'e'),
    subj('Język obcy', 'Język obcy', 60, 4, 'e', 'jezyk'),
    subj('Genetyka', 'Genetyka', 25, 2, 'z', 'genetyka'),
    subj('Komunikacja medyczna', 'Komunikacja', 35, 2, 'z', 'komunikacja'),
    subj('Metodologia badań naukowych', 'Metodologia', 35, 2, 'z'),
    subj('Higiena i epidemiologia', 'Epidemiologia', 30, 2, 'z'),
    subj('Przedmiot do wyboru', 'Do wyboru', 90, 6, 'z', 'wybor'),
    subj('Praktyki zawodowe', 'Praktyki', 120, 4, 'p', 'praktyki'),
  ] },
  { year: 'III', hours: 874, subjects: [
    subj('Patomorfologia', 'Patomorfologia', 128, 15, 'e'),
    subj('Farmakologia i toksykologia', 'Farmakologia', 100, 9, 'e', 'farmakologia'),
    subj('Mikrobiologia', 'Mikrobiologia', 80, 6, 'e'),
    subj('Diagnostyka laboratoryjna', 'Diagnostyka lab.', 45, 2, 'e'),
    subj('Genetyka', 'Genetyka', 30, 2, 'e', 'genetyka'),
    subj('Propedeutyka chorób wewnętrznych', 'Propedeutyka interny', 101, 6, 'z', 'interna'),
    subj('Propedeutyka pediatrii', 'Propedeutyka pediatrii', 60, 4, 'z', 'pediatria'),
    subj('Radiologia', 'Radiologia', 40, 2, 'z', 'radiologia'),
    subj('Komunikacja medyczna', 'Komunikacja', 35, 2, 'z', 'komunikacja'),
    subj('Zdrowie publiczne', 'Zdrowie publiczne', 30, 2, 'z'),
    subj('Propedeutyka stomatologii i chirurgii szczękowo-twarzowej', 'Stomatologia', 30, 1, 'z'),
    subj('Onkogenetyka', 'Onkogenetyka', 15, 1, 'z'),
    subj('Przedmiot do wyboru', 'Do wyboru', 60, 4, 'z', 'wybor'),
    subj('Praktyki zawodowe', 'Praktyki', 120, 4, 'p', 'praktyki'),
  ] },
  { year: 'IV', hours: 1064, subjects: [
    subj('Choroby zakaźne', 'Choroby zakaźne', 95, 6, 'e'),
    subj('Dermatologia z wenerologią', 'Dermatologia', 90, 5, 'e'),
    subj('Laryngologia', 'Laryngologia', 65, 3, 'e'),
    subj('Radiologia', 'Radiologia', 50, 3, 'e', 'radiologia'),
    subj('Urologia', 'Urologia', 35, 2, 'e'),
    subj('Chirurgia', 'Chirurgia', 110, 8, 'z', 'chirurgia'),
    subj('Choroby wewnętrzne: pneumonologia i alergologia, angiologia, kardiologia', 'Interna', 126, 8, 'z', 'interna'),
    subj('Pediatria: endokrynologia, gastroenterologia, pulmonologia i alergologia', 'Pediatria', 96, 6, 'z', 'pediatria'),
    subj('Psychiatria i psychiatria dziecięca', 'Psychiatria', 80, 4, 'z', 'psychiatria'),
    subj('Propedeutyka medycyny rodzinnej', 'Medycyna rodzinna', 35, 2, 'z', 'rodzinna'),
    subj('Medycyna nuklearna', 'Medycyna nuklearna', 30, 2, 'z'),
    subj('Chirurgia dziecięca', 'Chirurgia dziecięca', 30, 2, 'z'),
    subj('Onkologia', 'Onkologia', 22, 1, 'z', 'onkologia'),
    subj('Immunologia kliniczna', 'Immunologia kliniczna', 20, 1, 'z'),
    subj('Przedmiot do wyboru', 'Do wyboru', 60, 4, 'z', 'wybor'),
    subj('Praktyki zawodowe', 'Praktyki', 120, 4, 'p', 'praktyki'),
  ] },
  { year: 'V', hours: 1168, subjects: [
    subj('Neurologia', 'Neurologia', 95, 5, 'e'),
    subj('Medycyna sądowa i prawo medyczne', 'Medycyna sądowa', 74, 4, 'e'),
    subj('Anestezjologia i intensywna terapia', 'Anestezjologia', 65, 3, 'e'),
    subj('Onkologia', 'Onkologia', 64, 4, 'e', 'onkologia'),
    subj('Ortopedia i traumatologia narządu ruchu', 'Ortopedia', 60, 3, 'e'),
    subj('Okulistyka', 'Okulistyka', 55, 3, 'e'),
    subj('Chirurgia', 'Chirurgia', 114, 8, 'z', 'chirurgia'),
    subj('Ginekologia i położnictwo z endokrynologią ginekologiczną', 'Ginekologia', 139, 9, 'z', 'ginekologia'),
    subj('Choroby wewnętrzne: hematologia, nefrologia, reumatologia', 'Interna', 120, 8, 'z', 'interna'),
    subj('Pediatria: hematologia i onkologia, nefrologia', 'Pediatria', 72, 4, 'z', 'pediatria'),
    subj('Farmakologia kliniczna', 'Farmakologia kliniczna', 50, 3, 'z', 'farmakologia'),
    subj('Transplantologia', 'Transplantologia', 40, 2, 'z'),
    subj('Neurochirurgia', 'Neurochirurgia', 30, 2, 'z'),
    subj('Rehabilitacja', 'Rehabilitacja', 30, 2, 'z'),
    subj('Medycyna paliatywna', 'Medycyna paliatywna', 20, 1, 'z'),
    subj('Geriatria', 'Geriatria', 20, 1, 'z'),
    subj('Praktyki zawodowe', 'Praktyki', 120, 4, 'p', 'praktyki'),
  ] },
  { year: 'VI', hours: 900, subjects: [
    subj('Choroby wewnętrzne: kardiologia, endokrynologia, gastroenterologia, diabetologia, zajęcia praktyczne', 'Choroby wewnętrzne', 240, 16, 'e', 'interna'),
    subj('Pediatria', 'Pediatria', 120, 8, 'e', 'pediatria'),
    subj('Chirurgia', 'Chirurgia', 120, 8, 'e', 'chirurgia'),
    subj('Ginekologia i położnictwo', 'Ginekologia', 60, 4, 'e', 'ginekologia'),
    subj('Psychiatria', 'Psychiatria', 60, 4, 'e', 'psychiatria'),
    subj('Medycyna ratunkowa', 'Ratunkowa', 60, 4, 'e'),
    subj('Medycyna rodzinna', 'Rodzinna', 60, 4, 'e', 'rodzinna'),
    subj('Specjalność wybrana przez studenta', 'Specjalność do wyboru', 180, 12, 'z'),
  ] },
];

for (const y of WUM_PLAN) {
  const sum = y.subjects.reduce((a, x) => a + x.hours, 0);
  if (sum !== y.hours) throw new Error(`WUM_PLAN: rok ${y.year} — suma ${sum} zamiast ${y.hours}`);
}
/** 5760 godzin, 30 egzaminów — do tytułu wykresu i tekstu */
export const PLAN_TOTAL = {
  hours: WUM_PLAN.reduce((a, y) => a + y.hours, 0),
  exams: WUM_PLAN.reduce((a, y) => a + y.subjects.filter((x) => x.form === 'e').length, 0),
};

/* ---------- LEK, sesja wiosenna 2026, zdający po raz pierwszy, egzamin po polsku (CEM) ---------- */

/**
 * CEM, „Zbiorcze wyniki LEK w sesji wiosennej 2026 r.”, tabela „lekarze zdający po raz pierwszy”
 * (POST lep_stat.php, s=261; odczyt 27.10.2026). Pomijamy wiersz Uniwersytetu Radomskiego (2 zdających)
 * i wiersze zbiorcze (zdający po angielsku, absolwenci uczelni zagranicznych). „Nowe” = pierwszy limit przyjęć
 * od 2015/16 (UNIVERSITIES_2026), ten sam podział co w analizie o odsiewie.
 */
export const LEK_2026: { school: string; takers: number; mean: number; nowa?: boolean }[] = [
  { school: 'Uniwersytet Opolski', takers: 141, mean: 165.39, nowa: true },
  { school: 'Uczelnia Łazarskiego', takers: 59, mean: 161.02, nowa: true },
  { school: 'CM UMK (Bydgoszcz)', takers: 137, mean: 160.39 },
  { school: 'UM we Wrocławiu', takers: 344, mean: 160.03 },
  { school: 'UM w Poznaniu', takers: 277, mean: 159.61 },
  { school: 'CM UJ (Kraków)', takers: 256, mean: 159.29 },
  { school: 'ŚUM w Katowicach', takers: 616, mean: 157.65 },
  { school: 'UM w Łodzi', takers: 350, mean: 156.89 },
  { school: 'UKSW', takers: 107, mean: 156.66, nowa: true },
  { school: 'UM w Białymstoku', takers: 197, mean: 154.73 },
  { school: 'Uniwersytet Rzeszowski', takers: 93, mean: 154.19, nowa: true },
  { school: 'Krakowska Akademia AFM', takers: 33, mean: 154.06, nowa: true },
  { school: 'PUM w Szczecinie', takers: 142, mean: 152.65 },
  { school: 'UJK w Kielcach', takers: 108, mean: 151.82, nowa: true },
  { school: 'WUM', takers: 315, mean: 151.01 },
  { school: 'Uniwersytet Zielonogórski', takers: 100, mean: 150.04, nowa: true },
  { school: 'UM w Lublinie', takers: 47, mean: 149.89 },
  { school: 'Uczelnia Medyczna im. M. Skłodowskiej-Curie', takers: 11, mean: 149.55, nowa: true },
  { school: 'GUMed (Gdańsk)', takers: 275, mean: 147.01 },
  { school: 'UWM w Olsztynie', takers: 20, mean: 146.55 },
  { school: 'Akademia Śląska', takers: 59, mean: 138.9, nowa: true },
];
/** Średnia wszystkich zdających po raz pierwszy w tej sesji (wiersz „OGÓŁEM”, 4399 osób) */
export const LEK_2026_MEAN = 152.57;

export const lek2026Rows: BarRow[] = LEK_2026.map((r) => ({
  label: r.school,
  note: `· ${formatPL(r.takers)} ${r.nowa ? 'zdających · nowa' : 'zdających'}`,
  value: r.mean,
  display: formatPL(r.mean, 1),
  highlight: r.nowa,
}));
