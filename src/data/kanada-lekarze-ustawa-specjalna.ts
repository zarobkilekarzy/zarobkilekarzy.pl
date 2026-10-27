/**
 * Analiza /analizy/kanada-lekarze-ustawa-specjalna/: tabele (blok Comparison) i osie zdarzeń
 * (kanada/Chronology). Tekst artykułu i przypisy są w content/articles/kanada-lekarze-ustawa-specjalna.mdx.
 *
 * Złote: średni roczny kurs NBP (tabela A, średnia arytmetyczna notowań dziennych z api.nbp.pl)
 * z roku, którego dotyczy kwota — dla lat budżetowych z roku, w którym się zaczynają, dla przepisów
 * z roku uchwalenia ustawy. Tabele liczą złote same; kwoty „ok. … zł” w treści artykułu są wpisane
 * ręcznie tymi samymi kursami.
 *
 * Liczby (NBP_CAD, PAYMENTS, SPECIALISTS_BUDGET, PENALTIES) i daty osi zdarzeń czyta też wersja angielska —
 * src/data/en/kanada-lekarze-ustawa-specjalna.ts.
 */
import type { CompareTable } from '@/types';
import { formatPL } from '@/lib/format';

/** zł za 1 CAD — średnie roczne z api.nbp.pl (sprawdzone 15.10.2026) */
export const NBP_CAD = {
  2002: 2.5991,
  2012: 3.2584,
  2013: 3.0701,
  2016: 2.9777,
  2019: 2.8942,
  2020: 2.9058,
  2022: 3.4267,
  2023: 3.1142,
  2024: 2.9071,
  2025: 2.6882,
} as const;

export type RateYear = keyof typeof NBP_CAD;

type Amount = number | readonly [number, number];

const SCALES = [
  { min: 1e9, div: 1e9, unit: 'mld', decimals: 2 },
  { min: 1e6, div: 1e6, unit: 'mln', decimals: 2 },
  { min: 0, div: 1e3, unit: 'tys.', decimals: 1 },
] as const;

function scaled(value: number) {
  const s = SCALES.find((x) => value >= x.min) ?? SCALES[SCALES.length - 1];
  return { text: formatPL(value / s.div, s.decimals), unit: s.unit };
}

/** 500 000 CAD z 2025 r. → „ok. 1,34 mln zł”; przedział → „ok. 10,8–53,8 tys. zł” albo „ok. 268,8 tys.–1,34 mln zł” */
export function zl(cad: Amount, year: RateYear): string {
  const rate = NBP_CAD[year];
  if (typeof cad === 'number') {
    const v = scaled(cad * rate);
    return `ok. ${v.text} ${v.unit} zł`;
  }
  const a = scaled(cad[0] * rate);
  const b = scaled(cad[1] * rate);
  return a.unit === b.unit ? `ok. ${a.text}–${b.text} ${b.unit} zł` : `ok. ${a.text} ${a.unit}–${b.text} ${b.unit} zł`;
}

/** 4000 → „4 000 CAD”; [4000, 20 000] → „4 000–20 000 CAD” */
export const cad = (v: Amount) =>
  typeof v === 'number' ? `${formatPL(v)} CAD` : `${formatPL(v[0])}–${formatPL(v[1])} CAD`;

/** Publikacje, na które powołują się podpisy tabel (w treści — przypisy). */
export const LINKS = {
  cihiPayments: 'https://www.cihi.ca/sites/default/files/document/npdb-payments-data-tables-2023-en.xlsx',
  loi2: 'https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/fr/2025/2025C25F.PDF',
  loi16: 'https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/fr/2025/2025C39F.PDF',
  loi19: 'https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/fr/2026/2026C2F.PDF',
  loi114: 'https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/fr/2002/2002C39F.PDF',
} as const;

/* ---------- Średnia płatność kliniczna brutto na lekarza, 2023–24 (CIHI, NPDB, tab. A.1.1–A.1.3, A.3.1) ---------- */

export const PAYMENTS = [
  { name: 'Kanada', avg: 383_497, ffs: 71.8 },
  { name: 'Alberta', avg: 429_362, ffs: 87.4 },
  /** CIHI: dane Ontario za ten rok są niepełne (m.in. bez wypłat wyrównawczych) — dolna granica */
  { name: 'Ontario', avg: 390_588, ffs: 66.1, floor: true },
  { name: 'Quebec', avg: 353_385, ffs: 79.3 },
];

export const PAYMENTS_TABLE: CompareTable = {
  columns: ['', 'Średnia płatność na lekarza', 'Udział opłaty za usługę'],
  rows: PAYMENTS.map((p) => ({
    cells: [p.name, `${p.floor ? 'co najmniej ' : ''}${cad(p.avg)} (${zl(p.avg, 2023)})`, `${formatPL(p.ffs, 1)}%`],
    marked: p.name === 'Quebec',
  })),
};

/* ---------- Ustawa nr 2 (LQ 2025, c. 25): główne elementy według pierwotnego tekstu ---------- */

export const SPECIALISTS_BUDGET = { from: 5_316_200_000, to: 4_578_600_000 };

export const LAW2_TABLE: CompareTable = {
  columns: ['', 'Co przewidywała', 'Przepis'],
  rows: [
    {
      cells: [
        'Płaca zależna od celów',
        'Do 15% wynagrodzenia jako „dodatek zbiorowy” dla grup lekarzy za realizację celów dostępu do opieki',
        'art. 65 (nowy art. 29.20)',
      ],
    },
    {
      cells: [
        'Cięcie stawek',
        'Każda stawka, którą lekarzom płaci publiczny ubezpieczyciel (RAMQ), zastąpiona stawką równą 86,96% dotychczasowej, czyli niższą o 13,04%, z wyjątkami, m.in. dla lekarzy rodzinnych na stałym honorarium i specjalistów na pensji. Termin: 1.01.2026, po zmianie ustawą nr 16 — 28.02.2026',
        'art. 108',
      ],
    },
    {
      cells: [
        'Przedłużenie umów i budżet specjalistów',
        `Umowy z lekarzami przedłużone do 31.03.2028. Budżet na wynagrodzenia specjalistów: ${formatPL(SPECIALISTS_BUDGET.from / 1e6, 1)} mln CAD w roku 2024–25 (${zl(SPECIALISTS_BUDGET.from, 2025)}) i ${formatPL(SPECIALISTS_BUDGET.to / 1e6, 1)} mln CAD w roku 2027–28 (${zl(SPECIALISTS_BUDGET.to, 2025)})`,
        'art. 107, 124',
      ],
    },
    {
      cells: [
        'Zakaz działań skoordynowanych',
        'Zakaz wspólnego ograniczania pracy i wspólnego wychodzenia z publicznego planu. Ustawa zakładała koordynację, gdy kilku lekarzy działało jednocześnie albo zgodnie z sugestią organizacji lekarzy',
        'art. 131–134',
      ],
    },
    {
      cells: [
        'Sankcje',
        'Grzywny za każdy dzień udziału, podwójne przy recydywie (tabela niżej). Do tego minus pół roku praktyki zawodowej za każdy dzień i postępowanie dyscyplinarne za czyn uchybiający godności zawodu',
        'art. 183–185, 201',
      ],
    },
    {
      cells: [
        'Kapitacja',
        'Opłata za każdego zapisanego pacjenta dla lekarzy rodzinnych; rząd mógł ustalać sposób wynagradzania lekarzy rozporządzeniem',
        'zmiany ustawy o ubezpieczeniu zdrowotnym',
      ],
    },
  ],
};

/* ---------- Kara za każdy dzień udziału w działaniach skoordynowanych ---------- */
/* ustawa nr 114 (LQ 2002, c. 39), art. 20; ustawa nr 2 (LQ 2025, c. 25), art. 201 — każda kwota z 2025 r. = 4 × kwota z 2002 r. */

export const PENALTIES = [
  { who: 'Lekarz', y2002: [1_000, 5_000], y2025: [4_000, 20_000] },
  { who: 'Działacz lub pracownik organizacji lekarzy', y2002: [7_000, 35_000], y2025: [28_000, 140_000] },
  { who: 'Organizacja lekarzy (federacja)', y2002: [25_000, 125_000], y2025: [100_000, 500_000] },
] as const;

export const PENALTIES_TABLE: CompareTable = {
  columns: ['', 'Ustawa nr 114 (2002)', 'Ustawa nr 2 (2025)'],
  rows: PENALTIES.map((p) => ({
    cells: [p.who, `${cad(p.y2002)} (${zl(p.y2002, 2002)})`, `${cad(p.y2025)} (${zl(p.y2025, 2025)})`],
  })),
};

/* ---------- Osie zdarzeń: tylko kolejność i daty; kwoty i analiza są w tekście ---------- */

export type ChronoKind = 'rzad' | 'lekarze' | 'sad' | 'porozumienie';

export interface ChronoEvent {
  /** ISO: '2025-10-25' albo sam miesiąc '2012-05' — atrybut datetime i domyślny zapis daty */
  date: string;
  /** zapis daty, gdy inny niż z `date`, np. przedział „24–25.10.2025” */
  when?: string;
  kind: ChronoKind;
  text: string;
  source: { label: string; href: string };
}

export const QUEBEC: ChronoEvent[] = [
  {
    date: '2025-05-08',
    kind: 'rzad',
    text: 'Minister zdrowia składa projekt ustawy nr 106, który wiąże część wynagrodzenia lekarzy z dostępem do opieki.',
    source: { label: 'Le Soleil', href: 'https://www.lesoleil.com/actualites/politique/2025/05/08/remuneration-des-medecins-dube-presente-le-projet-de-loi-106-MSOSZWM7FZFOJEDHIR3V3RF3A4/' },
  },
  {
    date: '2025-10-25',
    when: '24–25.10.2025',
    kind: 'rzad',
    text: 'Ustawa nr 2 wniesiona i w ciągu jednej nocy uchwalona w trybie bâillon.',
    source: { label: 'Radio-Canada', href: 'https://ici.radio-canada.ca/nouvelle/2202166/loi-speciale-adoption-remuneration-medecins' },
  },
  {
    date: '2025-11-07',
    kind: 'lekarze',
    text: 'Samorząd zawodowy lekarzy wzywa do wstrzymania stosowania ustawy i powrotu do rozmów.',
    source: { label: 'Collège des médecins du Québec', href: 'https://www.cmq.org/fr/mot-du-president/20251107-infocmq' },
  },
  {
    date: '2025-11-13',
    kind: 'sad',
    text: 'Sąd Wyższy nie zawiesza ustawy na wniosek studentów medycyny; skarga zostanie rozpoznana co do istoty.',
    source: { label: 'Le Devoir', href: 'https://www.ledevoir.com/actualites/justice/933591/pas-suspension-loi-2-medecins-tranche-tribunal' },
  },
  {
    date: '2025-12-11',
    kind: 'porozumienie',
    text: 'Wstępne porozumienie z federacją lekarzy rodzinnych.',
    source: { label: 'Radio-Canada', href: 'https://ici.radio-canada.ca/nouvelle/2213419/entente-principe-medecins-details-quebec' },
  },
  {
    date: '2025-12-12',
    kind: 'rzad',
    text: 'Ustawa nr 16 uchyla rozdział o działaniach skoordynowanych i karach oraz przesuwa terminy ustawy nr 2.',
    source: { label: 'LQ 2025, c. 39', href: LINKS.loi16 },
  },
  {
    date: '2025-12-18',
    kind: 'rzad',
    text: 'Minister zdrowia, który wniósł ustawę nr 2, odchodzi z rządu i z partii rządzącej.',
    source: { label: 'Global News', href: 'https://globalnews.ca/news/11583871/quebec-health-minister-christian-dube-resigns' },
  },
  {
    date: '2025-12-19',
    kind: 'porozumienie',
    text: 'Lekarze rodzinni zatwierdzają pięcioletnią umowę 97% głosów.',
    source: { label: 'Noovo Info', href: 'https://www.noovo.info/nouvelles/sante/article/les-medecins-de-famille-approuvent-a-97-lentente-avec-quebec/' },
  },
  {
    date: '2026-02-04',
    kind: 'rzad',
    text: 'Nowa minister zdrowia wnosi projekt ustawy nr 19, który przepisuje ustawę nr 2.',
    source: { label: 'La Presse', href: 'https://www.lapresse.ca/actualites/sante/2026-02-04/nouvelle-loi-2/sonia-belanger-reecrit-la-loi-de-christian-dube.php' },
  },
  {
    date: '2026-02-26',
    kind: 'rzad',
    text: 'Ustawa nr 19 uchwalona i w mocy: znikają m.in. cięcie stawek i płaca zależna od celów.',
    source: { label: 'LQ 2026, c. 2', href: LINKS.loi19 },
  },
  {
    date: '2026-04-23',
    when: '20–23.04.2026',
    kind: 'porozumienie',
    text: 'Porozumienie z federacją specjalistów; delegaci zatwierdzają je 86% głosów.',
    source: { label: 'Noovo Info', href: 'https://www.noovo.info/nouvelles/article/les-medecins-specialistes-enterinent-leur-entente-avec-le-gouvernement/' },
  },
  {
    date: '2026-05-27',
    kind: 'rzad',
    text: 'Rząd ogłasza, że cel nowych zapisów pacjentów u lekarzy rodzinnych osiągnięto przed terminem.',
    source: { label: 'Gouvernement du Québec', href: 'https://www.quebec.ca/nouvelles/actualites/details/entente-avec-les-medecins-de-famille-des-objectifs-atteints-plus-rapidement-que-prevu-pour-ameliorer-lacces-aux-soins-70643' },
  },
];

export const ONTARIO: ChronoEvent[] = [
  {
    date: '2012-05',
    kind: 'rzad',
    text: 'Po zerwaniu rozmów z organizacją lekarzy (OMA) rząd jednostronnie tnie taryfę OHIP.',
    source: { label: 'The Commonwealth Fund', href: 'https://commonwealthfund.org/publications/newsletter-article/ontario-government-announces-cuts-physician-fees' },
  },
  {
    date: '2012-11',
    kind: 'porozumienie',
    text: 'Tymczasowe porozumienie łagodzi część cięć.',
    source: { label: 'Fasken', href: 'https://www.fasken.com/en/knowledge/2012/12/healthlawbulletin-20121212' },
  },
  {
    date: '2015-02-01',
    kind: 'rzad',
    text: 'Rząd narzuca liniową obniżkę opłat za usługi; od czerwca obejmuje też inne formy płatności.',
    source: { label: 'OHIP INFOBulletin 4721', href: 'https://collections.ola.org/ser/168629/2019/2019no4721.pdf' },
  },
  {
    date: '2015-10-01',
    kind: 'rzad',
    text: 'Druga obniżka opłat za usługi.',
    source: { label: 'OHIP INFOBulletin 4721', href: 'https://collections.ola.org/ser/168629/2019/2019no4721.pdf' },
  },
  {
    date: '2016-08',
    kind: 'lekarze',
    text: 'Członkowie OMA odrzucają wynegocjowaną umowę.',
    source: { label: 'CBC News', href: 'https://www.cbc.ca/1.3722791' },
  },
  {
    date: '2016-09-13',
    kind: 'rzad',
    text: 'Minister zdrowia wiąże zgodę na arbitraż m.in. z pełną jawnością wynagrodzeń lekarzy.',
    source: { label: 'CBC News', href: 'https://amp.cbc.ca/news/canada/toronto/oma-province-talks-1.3760579' },
  },
  {
    date: '2017-06',
    kind: 'porozumienie',
    text: 'Lekarze przyjmują ramy wiążącego arbitrażu.',
    source: { label: 'CBC News', href: 'https://www.cbc.ca/1.4165918' },
  },
  {
    date: '2018-08-03',
    kind: 'sad',
    text: 'Sąd apelacyjny: rozliczenia 100 lekarzy z najwyższymi kwotami mogą zostać ujawnione z nazwiskami.',
    source: { label: '2018 ONCA 673', href: 'https://www.ontariocourts.ca/decisions/2018/2018ONCA0673.pdf' },
  },
  {
    date: '2018-12',
    kind: 'rzad',
    text: 'Nowy rząd wypowiada ramy arbitrażu, powołując się na brak zaufania; toczące się postępowanie trwa dalej.',
    source: { label: 'CBC News', href: 'https://amp.cbc.ca/news/canada/toronto/ontario-leaves-oma-arbitration-1.4942105' },
  },
  {
    date: '2019-02-19',
    kind: 'sad',
    text: 'Wyrok arbitra: podwyżki na lata 2017–2021, a od 1.04.2019 koniec obniżek liniowych.',
    source: { label: 'CBC News', href: 'https://www.cbc.ca/1.5025350' },
  },
  {
    date: '2019-04',
    kind: 'sad',
    text: 'Sąd Najwyższy Kanady nie przyjmuje sprawy o jawność rozliczeń; wyrok z 2018 r. jest ostateczny.',
    source: { label: 'Sąd Najwyższy Kanady, sprawa 38343', href: 'https://www.scc-csc.ca/cases-dossiers/search-recherche/38343/' },
  },
];

export const ALBERTA: ChronoEvent[] = [
  {
    date: '2019-12',
    kind: 'rzad',
    text: 'Nowy art. 40.2 ustawy o ubezpieczeniu zdrowotnym pozwala ministrowi wypowiedzieć umowę z organizacją lekarzy (AMA).',
    source: { label: 'Alberta Worker', href: 'https://albertaworker.ca/news/ama-suing-tyler-shandro-for-over-255m/' },
  },
  {
    date: '2020-02-20',
    kind: 'rzad',
    text: 'Rząd wypowiada umowę; nowe zasady płatności od 1.04.2020.',
    source: { label: 'CBC News', href: 'https://amp.cbc.ca/news/canada/calgary/alberta-government-doctors-pay-ama-agreement-1.5470352' },
  },
  {
    date: '2020-03-17',
    kind: 'rzad',
    text: 'Na początku pandemii rząd wstrzymuje obniżkę dopłaty za dłuższą wizytę.',
    source: { label: 'CBC News', href: 'https://www.cbc.ca/1.5500748' },
  },
  {
    date: '2020-04',
    kind: 'rzad',
    text: 'Zmiana zasad rozliczeń, by zatrzymać lekarzy w małych miejscowościach.',
    source: { label: 'Global News', href: 'https://globalnews.ca/news/6879473/alberta-rural-doctors-fee-rules-tyler-shandro/amp' },
  },
  {
    date: '2020-07',
    kind: 'lekarze',
    text: 'Ankieta AMA: część lekarzy deklaruje wyjazd z prowincji.',
    source: { label: 'CBC News', href: 'https://amp.cbc.ca/news/canada/calgary/alberta-health-minister-talks-doctors-1.5698107' },
  },
  {
    date: '2020-09',
    kind: 'rzad',
    text: 'Rozporządzenie o jawności płatności za usługi dla poszczególnych lekarzy.',
    source: { label: 'Bennett Jones', href: 'https://www.bennettjones.com/Blogs-Section/Alberta-Sunshine-List-Expanded-to-Include-Physicians' },
  },
  {
    date: '2021-03',
    kind: 'lekarze',
    text: 'Lekarze odrzucają pierwszą propozycję nowej umowy.',
    source: { label: 'Global News', href: 'https://globalnews.ca/news/7752861/alberta-doctors-trust-new-labour-deal-rejected-ucp' },
  },
  {
    date: '2022-09-29',
    kind: 'porozumienie',
    text: 'Lekarze ratyfikują umowę na lata 2022–26.',
    source: { label: 'Alberta Medical Association', href: 'https://albertadoctors.org/news/publications/presidents-letter/members-have-ratified-agreement' },
  },
  {
    date: '2022-12',
    kind: 'porozumienie',
    text: 'Parlament uchyla art. 40.2; AMA zobowiązuje się wycofać pozew, gdy zmiana wejdzie w życie.',
    source: { label: 'CBC News', href: 'https://amp.cbc.ca/news/canada/edmonton/alberta-government-surrendering-power-to-impose-pay-deals-on-doctors-1.6674828' },
  },
];
