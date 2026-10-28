/**
 * Model globu płac lekarzy: dane OECD (src/data/swiat/oecd.json, eksport: research/swiat/eksport.py) + dane krajowe
 * (src/data/swiat/kraje.ts) → wartości dla każdego widoku (forma pracy × miara × waluta), klasy kolorów, ranking.
 *
 * Kwota: OECD podaje płace w dolarach po kursie z roku danych (USD_EXC), dane krajowe przeliczamy średnim kursem
 * z roku danych (kraje.ts); na złote i euro — kursem NBP z buildu (./rates.ts), więc odświeżają się przy każdym buildzie.
 * Siła nabywcza: dolary PPP (OECD, Bank Światowy) w złotych o sile nabywczej w Polsce, w euro o przeciętnej sile
 * nabywczej w UE (PPS Eurostatu) albo w dolarach międzynarodowych.
 */
import oecdData from '@/data/swiat/oecd.json';
import seriesData from '@/data/swiat/szeregi.json';
import namesPl from '@/data/swiat/nazwy.json';
import namesEn from '@/data/en/swiat/nazwy.json';
import { alerts, national, oecdGroups, oecdNotes } from '@/data/swiat/kraje';
import { alertsEn, nationalEn, oecdGroupsEn, oecdNotesEn } from '@/data/en/swiat/kraje';
import { transparency } from '@/data/swiat/jawnosc';
import { transparencyEn } from '@/data/en/swiat/jawnosc';
import { taxNational, taxNotes, taxes } from '@/data/swiat/podatki';
import { taxNationalEn, taxNotesEn } from '@/data/en/swiat/podatki';
import { enText } from '@/data/en/swiat/tekst';
import type { Locale } from '@/i18n/locales';
import { getWorldRates, type WorldRates } from './rates';
import { plText, type WorldText } from './text';
import type { Currency, Form, Measure, NationalEntry, NationalText, Obs, OecdSeries, OecdValues, Tax, Transparency, TransparencyText, ViewKey } from './types';

export * from './types';
export type { WorldRates } from './rates';
export type { WorldText } from './text';

const oecd = oecdData as unknown as Record<string, { iso3: string; v: OecdValues }>;
const SERIES = seriesData as unknown as Record<string, OecdSeries>;

/** napisy, nazwy krajów i teksty wpisów w każdym języku; angielskie teksty wpisów dokłada localize() */
const LOCALES = {
  pl: { t: plText, names: namesPl as Record<string, string> },
  en: { t: enText, names: namesEn as Record<string, string> },
} satisfies Record<Locale, { t: WorldText; names: Record<string, string> }>;

/** zł za 1 dolar międzynarodowy — Bank Światowy, PPP konsumpcji prywatnej (PA.NUS.PRVT.PP), Polska 2025 */
export const PLN_PPP = { value: 2.063158, year: 2025 };
/** USD za 1 PPS (przeciętna siła nabywcza w UE) — Eurostat, prc_ppp_ind, spożycie gospodarstw domowych (A01), USA 2024 */
export const USD_PER_PPS = { value: 1.61471, year: 2024 };

export const FORMS: Form[] = ['e', 'f'];
export const CURRENCIES: Currency[] = ['PLN', 'EUR', 'USD'];
export const VIEW_KEYS: ViewKey[] = FORMS.flatMap((f) => [
  `${f}-r` as ViewKey,
  `${f}-n` as ViewKey,
  ...CURRENCIES.map((c) => `${f}-x-${c}` as ViewKey),
  ...CURRENCIES.map((c) => `${f}-p-${c}` as ViewKey),
]).concat('j');
export const DEFAULT_VIEW: ViewKey = 'e-r';

/** stopnie rampy kolorów dla poziomów jawności 0–3 (napisy poziomów: `t.level`) */
export const LEVEL_TONES = ['0', '1', '3', '4'];
/** szereg do wykresu zmian rysujemy tylko, gdy sięga co najmniej tego roku (jak próg najnowszej wartości w eksporcie) */
export const MIN_RECENT_YEAR = 2015;

const BREAKS: Record<'r' | 'n' | Currency, number[]> = {
  r: [2, 2.5, 3, 4],
  n: [1.5, 2, 2.5, 3],
  PLN: [200e3, 400e3, 600e3, 800e3],
  EUR: [50e3, 100e3, 150e3, 200e3],
  USD: [50e3, 100e3, 150e3, 200e3],
};

/** wartość główna kraju w danej formie pracy */
export interface Head {
  src: 'oecd' | 'nat';
  group: string;
  /** × przeciętna płaca, × płaca pielęgniarki (OECD, ten sam rok), dolary PPP, dolary po kursie z roku danych */
  r?: Obs;
  n?: Obs;
  p?: Obs;
  x?: Obs;
}

export interface CountryModel {
  id: string;
  name: string;
  head: Partial<Record<Form, Head>>;
  oecd?: OecdValues;
  nat?: NationalEntry;
  note?: string;
  /** zastrzeżenie wyróżnione pod wartością */
  alert?: string;
  /** szeregi OECD do wykresu zmian w szczegółach kraju */
  series?: OecdSeries;
  transparency?: Transparency;
  /** podatek dochodowy od płac (wiersz w szczegółach kraju) */
  tax?: Tax;
}

/**
 * Płaca lekarza ÷ płaca pielęgniarki szpitalnej z tego samego roku (obie jako × przeciętna płaca w kraju, OECD).
 * `doctor` = [wartość, rok, flaga]; szereg pielęgniarek = [rok, wartość, flaga][].
 */
function nurseRatio(doctor: Obs | undefined, nurses: Obs[] | undefined): Obs | undefined {
  if (!doctor || !nurses) return undefined;
  const same = nurses.find(([year]) => year === doctor[1]);
  return same ? [Math.round((doctor[0] / same[1]) * 100) / 100, doctor[1], doctor[2] || same[2]] : undefined;
}

function nationalHead(n: NationalEntry): Head | undefined {
  const pay = n.pay;
  if (n.kind !== 'avg' || !pay) return undefined;
  const flag = pay.approx ? 'O' : '';
  return {
    src: 'nat',
    group: n.group ?? '',
    r: [Math.round((pay.annual / pay.average) * 100) / 100, pay.year, flag],
    x: pay.fx ? [Math.round(pay.annual / pay.fx.value), pay.year, ''] : undefined,
    p: pay.ppp ? [Math.round(pay.annual / pay.ppp.value), pay.year, ''] : undefined,
  };
}

function oecdHead(id: string, v: OecdValues | undefined, form: Form, t: WorldText, groups: Record<string, string>): Head | undefined {
  const nurses = SERIES[id]?.n;
  const make = (group: string, g: NonNullable<OecdValues['se']>): Head => ({ src: 'oecd', group, ...g, n: nurseRatio(g.r, nurses) });
  if (form === 'e' && v?.se) return make(groups[id] ?? t.oecdGroup.se, v.se);
  if (form === 'f' && v?.sf) return make(t.oecdGroup.sf, v.sf);
  if (form === 'f' && v?.gf) return make(t.oecdGroup.gf, v.gf);
  return undefined;
}

/** tekst w drugim języku dla każdego pola, które ma polski oryginał — inaczej build się zatrzymuje (bez polskich wtrętów) */
function translated<T>(pl: Record<string, T>, other: Record<string, T>, what: string): Record<string, T> {
  const missing = Object.keys(pl).filter((id) => other[id] === undefined);
  if (missing.length) throw new Error(`[swiat] brak tłumaczenia (${what}): ${missing.join(', ')}`);
  return other;
}

/** wpis krajowy z tekstami w drugim języku: liczby (`pay`, `kind`) i adresy źródeł zostają z polskiego wpisu */
function localize(id: string, n: NationalEntry, text: NationalText | undefined): NationalEntry {
  const fields = (['group', 'rows', 'note', 'sources'] as const).filter((k) => n[k] !== undefined && text?.[k] === undefined);
  if (!text || fields.length) throw new Error(`[swiat] wpis ${id}: brak tłumaczenia pól ${fields.join(', ') || 'wszystkich'}`);
  if (n.rows?.length !== text.rows?.length || n.sources?.length !== text.sources?.length) throw new Error(`[swiat] wpis ${id}: inna liczba wierszy albo źródeł niż w polskim`);
  const sources = n.sources?.map((s, i) => {
    const other = text.sources![i]!;
    return typeof other === 'string' ? { ...s, label: other } : other;
  });
  return { ...n, group: text.group, rows: text.rows, note: text.note, sources };
}

const localizeTransparency = (t: Transparency, text: TransparencyText): Transparency => ({ ...t, text: text.text, law: text.law, more: text.more });

/** podatek z tekstami w drugim języku: stawki, lata i adresy przepisów zostają z polskiego wpisu */
function localizeTax(id: string, tax: Tax, nat: Record<string, { text: string; law: string }>, notes: Record<string, { text: string; law: string }[]>): Tax {
  if (tax.notes && tax.notes.length !== notes[id]?.length) throw new Error(`[swiat] podatek ${id}: inna liczba dopisków niż w polskim`);
  return {
    ...tax,
    ...(tax.nat && { nat: { ...tax.nat, ...nat[id]! } }),
    ...(tax.notes && { notes: tax.notes.map((n, i) => ({ ...n, ...notes[id]![i]! })) }),
  };
}

function buildCountries(locale: Locale): CountryModel[] {
  const { t, names } = LOCALES[locale];
  const en = locale === 'en';
  const groups = en ? translated(oecdGroups, oecdGroupsEn, 'grupy OECD') : oecdGroups;
  const notes = en ? translated(oecdNotes, oecdNotesEn, 'noty OECD') : oecdNotes;
  const warn = en ? translated(alerts, alertsEn, 'zastrzeżenia') : alerts;
  const open = en ? translated(transparency, transparencyEn, 'jawność') : undefined;
  // tłumaczenie ma inne pola niż wpis polski (bez stawki i adresu) — sprawdzamy tylko, czy jest dla każdego klucza
  const taxNat = en ? (translated<unknown>(taxNational, taxNationalEn, 'podatek: skala krajowa') as typeof taxNationalEn) : undefined;
  const taxNote = en ? (translated<unknown>(taxNotes, taxNotesEn, 'podatek: dopiski') as typeof taxNotesEn) : undefined;
  const ids = new Set([...Object.keys(oecd), ...Object.keys(national), ...Object.keys(oecdNotes), ...Object.keys(transparency)]);
  return [...ids]
    .map((id) => {
      const o = oecd[id]?.v;
      const n = national[id] && (en ? localize(id, national[id], nationalEn[id]) : national[id]);
      const tr = transparency[id] && (open ? localizeTransparency(transparency[id], open[id]!) : transparency[id]);
      const head: Partial<Record<Form, Head>> = {};
      const e = oecdHead(id, o, 'e', t, groups) ?? (n && nationalHead(n));
      const f = oecdHead(id, o, 'f', t, groups);
      if (e) head.e = e;
      if (f) head.f = f;
      const tax = taxes[id] && (en ? localizeTax(id, taxes[id], taxNat!, taxNote!) : taxes[id]);
      return { id, name: names[id] ?? id, head, oecd: o, nat: n, note: notes[id], alert: warn[id], series: SERIES[id], transparency: tr, tax };
    })
    .sort((a, b) => a.name.localeCompare(b.name, t.collator));
}

export const parseView = (key: ViewKey) => {
  if (key === 'j') return { form: 'e' as Form, measure: 'j' as Measure, currency: 'PLN' as Currency };
  const [form, measure, currency] = key.split('-') as [Form, Measure, Currency | undefined];
  return { form, measure, currency: currency ?? 'PLN' };
};

export interface View {
  key: ViewKey;
  form: Form;
  measure: Measure;
  currency: Currency;
  /** wartość w jednostkach widoku (×, zł, euro, USD) */
  value(c: CountryModel): { value: number; obs: Obs; head: Head } | undefined;
  /** klasa koloru: 0–4 skala, 'c' — są informacje, ale bez wartości, 's' — brak danych */
  tone(c: CountryModel | undefined): string;
  /** „2,86×”, „241 tys. zł” */
  format(value: number): string;
  /** co znaczy liczba: „przeciętnej płacy”, „rocznie” (dymek) */
  context: string;
  /** zdanie nad rankingiem */
  sentence: string;
  legend: string[];
  /** stopnie rampy dla kolejnych pozycji legendy (domyślnie 0, 1, 2…) */
  legendTones?: string[];
  /** jednostka legendy kwot („tys. zł”) */
  legendUnit?: string;
}

function transparencyView(t: WorldText): View {
  const value: View['value'] = (c) => {
    const t = c.transparency;
    return t ? { value: t.level, obs: [t.level, 2026, ''], head: { src: 'nat', group: t.text } } : undefined;
  };
  return {
    key: 'j',
    form: 'e',
    measure: 'j',
    currency: 'PLN',
    value,
    tone: (c) => (c?.transparency ? LEVEL_TONES[c.transparency.level]! : 's'),
    format: (v) => t.levelShort[v]!,
    context: t.view.context.j,
    sentence: t.view.sentence('j', 'PLN'),
    legend: t.level,
    legendTones: LEVEL_TONES,
  };
}

export function makeView(key: ViewKey, rates: WorldRates, t: WorldText = plText): View {
  if (key === 'j') return transparencyView(t);
  const { form, measure, currency } = parseView(key);
  const usd = rates.mid.USD!;
  const eur = rates.mid.EUR!;
  const fromUsd = (v: number) => (currency === 'PLN' ? v * usd : currency === 'EUR' ? (v * usd) / eur : v);
  const fromPpp = (v: number) => (currency === 'PLN' ? v * PLN_PPP.value : currency === 'EUR' ? v / USD_PER_PPS.value : v);
  const ratio = measure === 'r' || measure === 'n';
  const breaks = ratio ? BREAKS[measure] : BREAKS[currency];

  const value: View['value'] = (c) => {
    const head = c.head[form];
    const obs = head?.[measure as 'r' | 'n' | 'x' | 'p'];
    if (!head || !obs) return undefined;
    const v = ratio ? obs[0] : measure === 'p' ? fromPpp(obs[0]) : fromUsd(obs[0]);
    return { value: v, obs, head };
  };
  return {
    key,
    form,
    measure,
    currency,
    value,
    tone(c) {
      const v = c && value(c);
      if (v) {
        const i = breaks.findIndex((b) => v.value < b);
        return String(i === -1 ? 4 : i);
      }
      if (!c || (c.nat?.kind === 'none' && !c.oecd && !c.note)) return 's';
      return 'c';
    },
    format: (v) => (ratio ? `${t.num(v, 2)}×` : t.money(v, currency)),
    // krótko: pełne objaśnienie miary stoi nad tabelą (sentence), a ten tekst powtarza się w dymku każdego kraju
    context: t.view.context[measure],
    sentence: t.view.sentence(measure, currency),
    legend: ratio
      ? t.view.legend[measure as 'r' | 'n']
      : [`< ${t.view.thousands(breaks[0]!)}`, ...breaks.slice(0, -1).map((b, i) => `${t.view.thousands(b)}–${t.view.thousands(breaks[i + 1]!)}`), `≥ ${t.view.thousands(breaks.at(-1)!)}`],
    legendUnit: ratio ? undefined : t.view.legendUnit(currency),
  };
}

/**
 * Kwoty w walucie kraju w tekście szczegółów („2 564 501 NGN rocznie”) z przeliczeniem w nawiasie na wybraną walutę:
 * „2 564 501 NGN (≈ 7,5 tys. zł) rocznie”. Kursem NBP z buildu (zł za jednostkę waluty, tabela A albo B);
 * kwoty w tej samej walucie zostają bez nawiasu. Zapis liczb i skali („tys.”, „thousand”) — według języka (`t.amount`).
 */
export function withConversion(text: string, currency: Currency, rates: WorldRates, t: WorldText = plText): string {
  const target = rates.mid[currency]!;
  return text.replace(t.amount, (all, a: string, b: string | undefined, k: string | undefined, code: string) => {
    const pln = rates.mid[code];
    if (code === currency || !pln) return all;
    const conv = (s: string) => (t.parseNumber(s) * (k ? 1000 : 1) * pln) / target;
    return `${all} (≈ ${b ? range(conv(a), conv(b), currency, t) : t.money(conv(a), currency)})`;
  });
}

/** zakres kwot: wspólna skala, gdy obie granice ją mają („2,6–8,2 tys. zł”), inaczej pełne kwoty („558 euro–1,8 tys. euro”) */
function range(lo: number, hi: number, currency: Currency, t: WorldText) {
  const [a, sa] = t.scaled(lo);
  const [b, sb] = t.scaled(hi);
  if (sa !== sb) return `${t.money(lo, currency)}–${t.money(hi, currency)}`;
  // ta sama skala: zapis kwoty z górnej granicy, a przed nią dolna („2,6–8,2 tys. zł”, „US$2.6k–8.2k”)
  return t.money(hi, currency).replace(b, `${a}–${b}`);
}

export interface RankRow {
  id: string;
  name: string;
  src: Head['src'];
  group: string;
  obs: Obs;
  /** udział w najwyższej wartości listy, 0–100 */
  width: number;
  /** wartość w każdej walucie listy */
  values: Partial<Record<ViewKey, string>>;
}

export interface RankList {
  /** widoki, w których lista jest widoczna */
  keys: ViewKey[];
  form: Form;
  measure: Measure;
  rows: RankRow[];
}

function rankList(countries: CountryModel[], keys: ViewKey[], rates: WorldRates, t: WorldText): RankList {
  const views = keys.map((k) => makeView(k, rates, t));
  const main = views[0]!;
  const rows = countries
    .map((c) => ({ c, v: main.value(c) }))
    .filter((x): x is { c: CountryModel; v: NonNullable<ReturnType<View['value']>> } => !!x.v)
    .sort((a, b) => b.v.value - a.v.value);
  const max = rows[0]?.v.value ?? 1;
  return {
    keys,
    form: main.form,
    measure: main.measure,
    rows: rows.map(({ c, v }) => ({
      id: c.id,
      name: c.name,
      src: v.head.src,
      group: v.head.group,
      obs: v.obs,
      // jawność: poziom 0–3 jako ćwiartki paska, żeby „brak” też był widoczny
      width: main.measure === 'j' ? ((v.value + 1) / 4) * 100 : Math.round((v.value / max) * 1000) / 10,
      values: Object.fromEntries(views.map((view) => [view.key, view.format(view.value(c)!.value)])),
    })),
  };
}

export interface WorldModel {
  locale: Locale;
  /** napisy w języku strony (./text.ts, src/data/en/swiat/tekst.ts) */
  t: WorldText;
  /** waluta na starcie */
  currency: Currency;
  countries: CountryModel[];
  byId: Record<string, CountryModel>;
  rates: WorldRates;
  views: Record<ViewKey, View>;
  lists: RankList[];
  /** klasy kolorów: id → znak na każdy widok w kolejności VIEW_KEYS */
  tones: Record<string, string>;
  counts: { oecd: number; national: number; partial: number; ranked: number };
  /** pozycja Polski w widoku domyślnym */
  poland: { rank: number; of: number };
}

const cached = new Map<Locale, Promise<WorldModel>>();

export function worldModel(locale: Locale = 'pl'): Promise<WorldModel> {
  if (!cached.has(locale)) cached.set(locale, build(locale));
  return cached.get(locale)!;
}

async function build(locale: Locale): Promise<WorldModel> {
  const { t } = LOCALES[locale];
  const rates = await getWorldRates();
  const countries = buildCountries(locale);
  const byId = Object.fromEntries(countries.map((c) => [c.id, c]));
  const views = Object.fromEntries(VIEW_KEYS.map((k) => [k, makeView(k, rates, t)])) as Record<ViewKey, View>;
  const lists = FORMS.flatMap((f) => [
    rankList(countries, [`${f}-r`], rates, t),
    rankList(countries, [`${f}-n`], rates, t),
    rankList(countries, CURRENCIES.map((c) => `${f}-x-${c}` as ViewKey), rates, t),
    rankList(countries, CURRENCIES.map((c) => `${f}-p-${c}` as ViewKey), rates, t),
  ]).concat(rankList(countries, ['j'], rates, t));
  const tones = Object.fromEntries(countries.map((c) => [c.id, VIEW_KEYS.map((k) => views[k].tone(c)).join('')]));
  const etat = countries.filter((c) => c.head.e);
  const ranked = lists[0]!.rows;
  return {
    locale,
    t,
    currency: t.currency,
    countries,
    byId,
    rates,
    views,
    lists,
    tones,
    counts: {
      oecd: etat.filter((c) => c.head.e!.src === 'oecd').length,
      national: etat.filter((c) => c.head.e!.src === 'nat').length,
      partial: countries.filter((c) => !c.head.e && (c.oecd || (c.nat && c.nat.kind !== 'none'))).length,
      ranked: ranked.length,
    },
    poland: { rank: ranked.findIndex((r) => r.id === '616') + 1, of: ranked.length },
  };
}

/**
 * Klasy kolorów widoku domyślnego (× przeciętna płaca, na etacie) bez pobierania kursów: id → klasa.
 * Dla obrazka OG (lib/swiat/og.ts), który powstaje synchronicznie; relacja nie zależy od kursu, więc kursy są puste.
 */
export function defaultTones(): Record<string, string> {
  const view = makeView(DEFAULT_VIEW, { a: undefined, b: undefined, mid: {} } as unknown as WorldRates);
  return Object.fromEntries(buildCountries('pl').map((c) => [c.id, view.tone(c)]));
}

/** krótki opis obserwacji: „2024 · szacunek OECD” */
export const obsMeta = (obs: Obs, t: WorldText) => [String(obs[1]), t.flags[obs[2]]].filter(Boolean).join(' · ');
