/**
 * Wersja angielska modułu src/data/zarobki-dyrektorow-szpitali.ts: te same przypadki, lata i adresy
 * (importowane), tylko teksty komórek po angielsku. Kwoty w tabeli w złotych, bez euro (wiele kwot naraz).
 * Kwoty są wpisane w polskie teksty, więc tu przepisane dokładnie; strażnik porównuje polskie kwoty
 * z tymi, z których powstało tłumaczenie — po zmianie przypadku w module polskim popraw go tutaj
 * (inaczej build strony angielskiej się zatrzyma). Nazwy miejscowości po polsku.
 * Treść artykułu: src/content/en/articles/hospital-directors-pay.mdx.
 */
import { formatEN } from '@/lib/format';
import { CASES as CASES_PL, type Amount, type DirectorCase } from '@/data/zarobki-dyrektorow-szpitali';

export { LINKS } from '@/data/zarobki-dyrektorow-szpitali';

/** Kwota roczna → „about PLN 33.0 thousand a month” (jak `monthly` w module polskim). */
const monthly = (yearly: number) => `about PLN ${formatEN(yearly / 12 / 1000, 1)} thousand a month`;

interface CaseEn {
  /** polskie teksty kwot [za kierowanie, praca lekarska i inne, łącznie], z których powstało tłumaczenie */
  pl: [string, string?, string?];
  place: string;
  role: string;
  management: Amount;
  other?: Amount;
  total?: Amount;
  hospital?: string;
  /** etykiety źródeł w kolejności z modułu polskiego */
  sources: string[];
}

/** Klucz: miejscowość z modułu polskiego. */
const EN: Record<string, CaseEn> = {
  'Grójec i Nowe Miasto nad Pilicą': {
    pl: ['ok. 161 tys. zł', '2,8 mln zł', 'ponad 3 mln zł'],
    place: 'Grójec and Nowe Miasto nad Pilicą',
    role: 'chief executive of the hospital company in Grójec since October 2025, since 2026 also acting director of the SPZOZ in Nowe Miasto; practising doctor',
    management: { text: 'about PLN 161 thousand', note: 'income from employment for 2025, including as chief executive (from October) — the sources do not separate management alone; today, according to WP, PLN 22 thousand and PLN 18 thousand a month at the two hospitals' },
    other: { text: 'PLN 2.8 million', note: 'revenue from medical practice (income over PLN 2.4 million)' },
    total: { text: 'over PLN 3 million', note: 'revenue; income about PLN 2.6 million' },
    hospital: 'both hospitals in debt of about PLN 20 million each (according to the head of the county)',
    sources: ['WP', 'rp.pl'],
  },
  'Łosice': {
    pl: ['396,5 tys. zł', '1,26 mln zł', 'ok. 1,65 mln zł'],
    place: 'Łosice',
    role: 'hospital director',
    management: { text: 'PLN 396.5 thousand', note: monthly(396_500) },
    other: { text: 'PLN 1.26 million', note: 'for medical services provided to the hospital the director runs' },
    total: { text: 'about PLN 1.65 million', note: 'excluding pension' },
    hospital: 'record profits',
    sources: ['money.pl'],
  },
  'Ostrowiec Świętokrzyski': {
    pl: ['1,07 mln zł', undefined, 'co najmniej 1,07 mln zł'],
    place: 'Ostrowiec Świętokrzyski',
    role: 'chief director of the hospital',
    management: { text: 'PLN 1.07 million', note: 'the whole employment contract; the source does not separate management from medical work' },
    total: { text: 'at least PLN 1.07 million' },
    hospital: 'loss of PLN 11.7 million in 2025, losses from previous years PLN 55.1 million; auditor: material uncertainty about the hospital’s ability to continue operating',
    sources: ['naOSTRO.info (amount)', 'naOSTRO.info (auditor)'],
  },
  'Bolesławiec': {
    pl: ['726,6 tys. zł', '303,5 tys. zł', '1,03 mln zł'],
    place: 'Bolesławiec',
    role: 'hospital director, member of the regional assembly',
    management: { text: 'PLN 726.6 thousand', note: `from business activity — hospital management services; ${monthly(726_550)}` },
    other: { text: 'PLN 303.5 thousand', note: 'including a councillor’s allowance of PLN 58.5 thousand' },
    total: { text: 'PLN 1.03 million' },
    hospital: 'debt of PLN 48.7 million (September 2023, Ministry of Health data)',
    sources: ['istotne.pl (amount)', 'bolec.info (debt)'],
  },
  'Tychy': {
    pl: ['ponad 908 tys. zł', 'nie wliczono'],
    place: 'Tychy',
    role: 'chief executive of the municipal company running the regional hospital',
    management: { text: 'over PLN 908 thousand', note: monthly(908_000) },
    other: { text: 'not included', note: 'the source leaves out pension, supervisory boards and other income' },
    sources: ['ilovetychy.pl'],
  },
  'Tomaszów Lubelski': {
    pl: ['324 albo ok. 328 tys. zł', '522 albo 536 tys. zł', '864 tys. zł'],
    place: 'Tomaszów Lubelski',
    role: 'hospital director, county councillor',
    management: { text: 'PLN 324 thousand or about PLN 328 thousand', note: 'two versions in the press (see text); about PLN 27 thousand a month' },
    other: { text: 'PLN 522 thousand or PLN 536 thousand', note: 'for medical work and on-call duty' },
    total: { text: 'PLN 864 thousand' },
    hospital: 'loss of PLN 5.2 million in Q1 2026',
    sources: ['money.pl', 'Interia', 'Bankier'],
  },
  'Działdowo': {
    pl: ['335,6 tys. zł', '351,1 tys. zł', '686,8 tys. zł'],
    place: 'Działdowo',
    role: 'hospital director',
    management: { text: 'PLN 335.6 thousand', note: monthly(335_648) },
    other: { text: 'PLN 351.1 thousand', note: 'from a medical contract' },
    total: { text: 'PLN 686.8 thousand' },
    hospital: 'net loss of PLN 8.4 million in 2025; PLN 9.9 thousand in cash at the end of the year',
    sources: ['Nasz Dziennik'],
  },
  'Suwałki': {
    pl: ['505,1 tys. zł'],
    place: 'Suwałki',
    role: 'director of the regional hospital',
    management: { text: 'PLN 505.1 thousand', note: `${monthly(505_100)}; PLN 305.9 thousand in 2022` },
    hospital: 'debt of PLN 58.7 million at the end of 2024',
    sources: ['zero.pl'],
  },
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export const CASES: DirectorCase[] = CASES_PL.map((c) => {
  const t = EN[c.place];
  if (!t) throw new Error(`[en] brak tłumaczenia przypadku „${c.place}”`);
  const plTexts = [c.management.text, c.other?.text, c.total?.text];
  const fields = [!!c.other, !!c.total, !!c.hospital, c.sources.length];
  if (!same(plTexts.slice(0, t.pl.length), t.pl) || plTexts.slice(t.pl.length).some(Boolean) || !same(fields, [!!t.other, !!t.total, !!t.hospital, t.sources.length])) {
    throw new Error(`[en] przypadek „${c.place}” zmienił się w module polskim — popraw tłumaczenie`);
  }
  return {
    ...c,
    place: t.place,
    role: t.role,
    management: t.management,
    other: t.other,
    total: t.total,
    hospital: t.hospital,
    sources: c.sources.map((s, i) => ({ label: t.sources[i]!, href: s.href })),
  };
});
