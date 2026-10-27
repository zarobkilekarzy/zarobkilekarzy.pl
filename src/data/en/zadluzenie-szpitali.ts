/**
 * Wersja angielska liczb do /dane/zadluzenie-szpitali/ (moduł polski: src/data/zadluzenie.ts, model licznika:
 * src/lib/zadluzenie/model.ts): te same liczby, zapis angielski i angielskie nazwy. Treść artykułu:
 * src/content/en/articles/hospital-debt.mdx. Komponenty components/zadluzenie/* biorą stąd napisy na /en/.
 */
import { formatEN, formatDateIn } from '@/lib/format';
import { getRates } from '@/i18n/rates';
import { withEur } from '@/i18n/money';
import { LINKS, LOSSES, REGIONS_DATE, type LossRow } from '@/data/zadluzenie';

export { DEBT, KALISZ, LINKS, LOSSES, OTHER_HOSPITALS, POPULATION } from '@/data/zadluzenie';

const rates = await getRates();

/** 40 816 700 000 zł → „40.8” (PLN billion) */
export const bn = (zl: number, decimals = 1) => formatEN(zl / 1e9, decimals);

/** 0.2566 → „25.7” (%) */
export const pct = (rate: number, decimals = 1) => formatEN(rate * 100, decimals);

/** „II 2026” → „Q2 2026” */
export const quarterEn = (label: string) => {
  const [roman, year] = label.split(' ');
  const q = ['I', 'II', 'III', 'IV'].indexOf(roman) + 1;
  if (!q) throw new Error(`[en] nieznany kwartał „${label}”`);
  return `Q${q} ${year}`;
};

/** „30.06.2026” → „30 June 2026” */
export const enDate = (pl: string) => {
  const [d, m, y] = pl.split('.').map(Number);
  return formatDateIn(new Date(Date.UTC(y, m - 1, d)), 'en');
};

/** chwila (ms) → „30 June 2026” */
export const dateEn = (t: number) => formatDateIn(new Date(t), 'en');

export const REGIONS_DATE_EN = enDate(REGIONS_DATE);

/** Województwa i szpitale resortowe z modułu polskiego → angielskie nazwy. */
const REGION_NAMES: Record<string, string> = {
  'Dolnośląskie': 'Lower Silesia',
  'Kujawsko-pomorskie': 'Kuyavia-Pomerania',
  'Lubelskie': 'Lublin',
  'Lubuskie': 'Lubusz',
  'Łódzkie': 'Łódź',
  'Małopolskie': 'Lesser Poland',
  'Mazowieckie': 'Masovia',
  'Opolskie': 'Opole',
  'Podkarpackie': 'Subcarpathia',
  'Podlaskie': 'Podlasie',
  'Pomorskie': 'Pomerania',
  'Śląskie': 'Silesia',
  'Świętokrzyskie': 'Holy Cross (Świętokrzyskie)',
  'Warmińsko-mazurskie': 'Warmia-Masuria',
  'Wielkopolskie': 'Greater Poland',
  'Zachodniopomorskie': 'West Pomerania',
  'Szpitale MON': 'Ministry of Defence hospitals',
  'Szpitale MSWiA': 'Ministry of the Interior hospitals',
};

export const regionName = (pl: string) => {
  const en = REGION_NAMES[pl];
  if (!en) throw new Error(`[en] brak angielskiej nazwy województwa „${pl}”`);
  return en;
};

/** Dopowiedzenia pod wierszami rankingu strat (miasto z modułu polskiego → tekst angielski). Nazwy szpitali zostają polskie. */
const LOSS_NOTES: Record<string, Pick<LossRow, 'note' | 'links'>> = {
  'Częstochowa': {
    note: 'One of the few hospitals whose debt is public — it was disclosed by the body that runs it, the marshal of the Silesian voivodeship (the head of the regional government): PLN 172 million of overdue liabilities at the end of 2025 (PLN 175 million in March 2026) and about PLN 289 million in total. The loss for 2025 grew to about PLN 85 million, and debt servicing alone cost PLN 43 million.',
    links: [
      { label: 'Dziennik.pl', href: 'https://zdrowie.dziennik.pl/aktualnosci/artykuly/599197,parkitka-szpital-czestochowa-lekarze-dyzury.html' },
      { label: 'Życie Częstochowy', href: LINKS.czestochowa },
      { label: 'parliamentary question (X)', href: 'https://x.com/JerzyPolaczek/status/2074742367060394337' },
    ],
  },
  'Bełchatów': {
    note: `In this hospital a urologist under a contract receives more than ${withEur(151000, 'PLN', rates)} a month.`,
    links: [{ label: 'Record rates', href: '/en/data/record-doctor-payments/' }],
  },
};

/** Ranking strat z angielskimi dopowiedzeniami; wiersz z dopowiedzeniem po polsku bez tłumaczenia przerywa build. */
export const LOSSES_EN: LossRow[] = LOSSES.map((r) => {
  if (!r.note) return r;
  const en = LOSS_NOTES[r.city];
  if (!en) throw new Error(`[en] brak angielskiego dopowiedzenia dla szpitala w „${r.city}”`);
  return { ...r, ...en };
});
