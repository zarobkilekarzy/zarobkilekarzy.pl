/**
 * Glob płac lekarzy: podatek dochodowy od płac w szczegółach kraju.
 * - Kraje OECD: najwyższa stawka (łącznie z podatkami regionalnymi i lokalnymi, dla regionu, który wybrało OECD) i jej
 *   próg jako wielokrotność przeciętnej płacy brutto — OECD Tax Database, tabela I.7 (podatki.json, research/swiat/eksport.py).
 * - Kraje spoza OECD z wartością na globie: skala z przepisu krajowego (`taxNational`), tekst pierwotny w `href`.
 * - Dopiski (`taxNotes`): inna forma opodatkowania lekarzy w kraju.
 * Teksty angielskie: src/data/en/swiat/podatki.ts (te same klucze). Klucz = numeryczny kod ISO 3166-1.
 */
import oecdTax from './podatki.json';
import type { Tax, TaxText } from '@/lib/swiat/types';

/** strona tabeli I.7 w OECD Data Explorer (źródło stawek krajów OECD) */
export const OECD_TAX_HREF =
  'https://data-explorer.oecd.org/vis?df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_TAX_PIT%40DF_PIT_TOP_EARN_THRESH&df[ag]=OECD.CTP.TPS';

/** podatek liniowy: OECD podaje „próg” wynikający z kwoty wolnej, a stawka jest jedna */
const FLAT = new Set(['233', '348']); // Estonia, Węgry

/**
 * Kraje spoza OECD z wartością na globie: najwyższa stawka, rok i opis skali z przepisu (sprawdzone w tekstach
 * pierwotnych 28.10.2026). Rok 2025, jak w danych OECD; zmiany od 2026 r. (Tajwan: waloryzacja progów, Białoruś: 30%,
 * Kazachstan: 15%, Brazylia: ulga do 5 tys. BRL) nie wchodzą.
 */
export const taxNational: Record<string, { rate: number; year: number; nat: TaxText }> = {
  '158': {
    rate: 40,
    year: 2025,
    nat: {
      text: 'Skala 5–40%; najwyższa stawka 40% — od dochodu do opodatkowania (po zwolnieniach i odliczeniach) powyżej 4 980 000 TWD rocznie.',
      law: 'Ustawa o podatku dochodowym, art. 5; obwieszczenie Ministerstwa Finansów z 28.11.2024 r. (progi na 2025 r.)',
      href: 'https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg030223/ch04/type3/gov30/num16/Eg.htm',
    },
  },
  '076': {
    rate: 27.5,
    year: 2025,
    nat: {
      text: 'Skala 7,5–27,5%; najwyższa stawka 27,5% — od podstawy (po odliczeniach, m.in. składek) powyżej 4 664,68 BRL miesięcznie.',
      law: 'Lei 11.482/2007, art. 1, w brzmieniu Lei 15.191/2025',
      href: 'https://www2.camara.leg.br/legin/fed/lei/2025/lei-15191-11-agosto-2025-797839-publicacaooriginal-176105-pl.html',
    },
  },
  '643': {
    rate: 22,
    year: 2025,
    nat: {
      text: 'Skala 13–22%; najwyższa stawka 22% — od dochodu powyżej 50 000 000 RUB rocznie.',
      law: 'Ordynacja podatkowa Rosji (NK RF), art. 224 ust. 1, w brzmieniu ustawy nr 176-FZ z 12.07.2024 r.',
      href: 'http://kremlin.ru/acts/bank/50837/page/6',
    },
  },
  '112': {
    rate: 25,
    year: 2025,
    nat: {
      text: 'Stawka 13%, a od dochodów powyżej 220 000 BYN rocznie — 25%.',
      law: 'Kodeks podatkowy Białorusi, art. 214 ust. 8 (komentarz Ministerstwa Podatków)',
      href: 'https://nalog.gov.by/clarifications/comments/28743/',
    },
  },
  '398': {
    rate: 10,
    year: 2025,
    nat: {
      text: 'Stawka liniowa 10%.',
      law: 'Kodeks podatkowy Kazachstanu z 25.12.2017 r., art. 320 ust. 1',
      href: 'https://old.adilet.zan.kz/rus/docs/K1700000120',
    },
  },
};

/**
 * Inne formy opodatkowania lekarzy, każde zdanie ze źródłem pierwotnym.
 * Polska: tezy „ryczałt to standard u lekarzy na kontraktach” nie piszemy — MF podaje tylko całą stawkę 14% (z architektami
 * i inżynierami), bez podziału na zawody, a NIL takich danych nie ma (sprawdzone 28.10.2026: informacje MF o ryczałcie
 * 2022–2024, odpowiedzi na interpelacje 15200 i 19501).
 */
export const taxNotes: Record<string, TaxText[]> = {
  '616': [
    {
      text: 'Lekarz na kontrakcie (jednoosobowa działalność) może zamiast tego wybrać ryczałt: 14% przychodu, bez odliczania kosztów (od 2022 r.).',
      law: 'Ustawa o zryczałtowanym podatku dochodowym, art. 12 ust. 1 pkt 2a lit. a',
      href: 'https://api.sejm.gov.pl/eli/acts/DU/2025/843/text.pdf',
    },
    {
      text: 'Ministerstwo Finansów nie podaje, ilu lekarzy wybiera ryczałt — tylko liczbę podatników całej stawki 14%, wspólnej z usługami architektonicznymi i inżynierskimi: 99 490 w 2024 r.',
      law: 'Ministerstwo Finansów, Informacja dotycząca ryczałtu od przychodów ewidencjonowanych za 2024 r.',
      href: 'https://podatki.gov.pl/media/htglabgr/informacja-rycza%C5%82t-za-2024.pdf',
    },
  ],
};

const fromOecd = oecdTax as Record<string, { r: number; t: number; y: number }>;

export const taxes: Record<string, Tax> = Object.fromEntries(
  [...new Set([...Object.keys(fromOecd), ...Object.keys(taxNational), ...Object.keys(taxNotes)])].map((id) => {
    const o = fromOecd[id];
    const n = taxNational[id];
    if (!o && !n) throw new Error(`[swiat] dopisek o podatku bez stawki kraju: ${id}`);
    const base: Tax = o
      ? { rate: o.r, year: o.y, ...(FLAT.has(id) ? { flat: true } : { th: o.t }) }
      : { rate: n!.rate, year: n!.year, nat: n!.nat };
    return [id, taxNotes[id] ? { ...base, notes: taxNotes[id] } : base];
  }),
);
