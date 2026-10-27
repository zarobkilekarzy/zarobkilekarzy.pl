/**
 * Spisy stron angielskich (/en/, /en/data/, /en/mechanisms/, /en/analysis/): pozycje z tłumaczeń artykułów.
 * Tytuł i lead — z tłumaczenia (src/content/en/articles), dział, daty, zdjęcie i forma — z polskiego oryginału,
 * a tu po angielsku to, co w PL stoi we frontmatterze oryginału: liczba z karty (`stat`), opis zdjęcia,
 * etykieta na zdjęciu i dopisek. Bloki spisów dostają gotowe pozycje (src/i18n/entries.ts).
 *
 *   stat.of   wartość liczby w oryginale (np. '316 079'); gdy oryginał ją zmieni, pozycja EN traci liczbę
 *             (ostrzeżenie w buildzie), aż ktoś poprawi wpis tutaj — polskiej publikacji to nie blokuje.
 *             Tak samo `badge.of` (etykieta na zdjęciu).
 *   page      materiał bez tłumaczenia, który zostaje w spisach EN: strona tylko po polsku (tytuł dostaje
 *             „(in Polish)”) albo strona EN spoza kolekcji artykułów (np. /en/patient-rights/).
 *
 * Materiały bez tłumaczenia i bez `page` (egzamin, symulatory, projekt ustawy…) w spisach EN się nie pojawiają.
 */
import { articleHref, type Article } from '@/lib/content';
import type { DataFormat } from '@/types';
import type { Entry } from '@/i18n/entries';
import { SECTIONS_EN, enHref, getTranslations } from '@/i18n/translations';
import { ui } from '@/i18n/ui';

export interface CardEn {
  stat?: { of: string; value: string; unit: string };
  coverAlt?: string;
  /** etykieta na zdjęciu; `of` = etykieta oryginału, jak przy `stat` */
  badge?: { of: string; text: string };
  kicker?: string;
  page?: {
    title: string;
    summary: string;
    /** adres strony; bez niego — polski adres oryginału */
    href?: string;
    /** strona tylko po polsku */
    polish?: boolean;
  };
}

/** Forma zestawienia (etykieta w spisie) — DATA_FORMATS z src/types.ts. */
export const formats: Record<DataFormat, string> = {
  Wykresy: 'Charts',
  Tabela: 'Table',
  Ranking: 'Ranking',
  Wyszukiwarka: 'Search',
  Infografika: 'Infographic',
  Test: 'Test',
  Porównanie: 'Comparison',
};

/** Pola kart po angielsku, pod id polskiego artykułu. */
export const cards: Record<string, CardEn> = {
  // Dane
  'monitoring-watchdog': {
    stat: { of: '1 358', value: '1,358', unit: 'facilities' },
    coverAlt: 'Rows of document files tied with string, laid out on a table, seen from above',
    badge: { of: '1 358 placówek', text: '1,358 facilities' },
    kicker: 'Tool',
    page: {
      title: 'Doctors’ pay monitoring browser',
      summary: 'Watchdog Polska asked 1,358 public facilities about doctors’ pay. See which of them disclosed the data, which refused and which did not reply at all.',
      polish: true,
    },
  },
  'rozklad-wynagrodzen': {
    stat: { of: '25 595', value: '25,595', unit: 'PLN — median of a single specialist contract' },
    coverAlt: 'A card-index drawer in which a few cards stand clearly taller than the rest',
  },
  'zarobki-ujawnione-listy': { stat: { of: '11 113', value: '11,113', unit: 'payroll entries from 97 facilities' } },
  rekordy: { stat: { of: '316 079', value: '316,079', unit: 'PLN — the highest monthly contract in the public listing' } },
  'budzet-nfz': { stat: { of: '×2', value: '×2', unit: 'in real terms since 2015' } },
  'zadluzenie-szpitali': { stat: { of: '40,8', value: '40.8', unit: 'PLN billion of debt' } },
  'wedlug-specjalizacji': { stat: { of: '29', value: '29', unit: 'specialties' } },
  'personel-medyczny': { stat: { of: '5,9', value: '5.9', unit: 'nurses per 1,000 population' } },
  'zarobki-lekarzy-polska-sasiedzi': { stat: { of: '2,9', value: '2.9', unit: 'times the average wage — a salaried specialist in Poland (OECD)' } },

  // Mechanizmy
  'fikcyjne-wizyty': { stat: { of: '>1 600', value: '>1,600', unit: 'justified reports from patients in 2024' } },
  'brak-jawnosci': {
    stat: { of: '0', value: '0', unit: 'published totals of payments to one person' },
    coverAlt: 'Three doctors making the “see no evil, hear no evil, speak no evil” gesture',
  },
  'jak-dzialaja-sady-lekarskie': {
    coverAlt: 'An empty room. Behind a table, three chairs and case files tied with string; opposite, a single chair with a white doctor’s coat hung over it',
  },
  'wycena-swiadczen': { stat: { of: '~17%', value: '~17%', unit: 'of the value of services is priced by the independent tariff' } },
  'rozliczenia-nfz': { stat: { of: '98%', value: '98%', unit: 'of the base points — the threshold for the full lump sum' } },
  'kontrakt-vs-etat': { stat: { of: '~73%', value: '~73%', unit: 'of specialists on contracts' } },
  'reglamentacja-dostepu': { stat: { of: '3', value: '3', unit: 'doctors at a time per specialist training supervisor (4 by exception)' } },

  // Analizy
  'ustawa-o-danych-a-jawny-rejestr': { stat: { of: '0', value: '0', unit: 'provisions requiring publication' } },
  'limity-wynagrodzen-medykow': { stat: { of: '16×', value: '16×', unit: 'the minimum wage per month — the combined ceiling' } },
  'zarobki-dyrektorow-szpitali': { stat: { of: '6×', value: '6×', unit: 'the average wage — the pay ceiling of a SPZOZ director' } },
  'prawa-pacjenta': {
    page: {
      title: 'Patient rights — and where to report a breach',
      summary: 'Patient rights, deadlines and complaint routes — each with a reference to the article of the act.',
      href: '/en/patient-rights/',
    },
  },
  'sladem-zlotowki': { stat: { of: '90–96%', value: '90–96%', unit: 'of the cost of services was covered by the contribution (2021–H1 2024)' } },
  'publiczna-prywatna-ochrona-zdrowia': { stat: { of: '×3,1', value: '×3.1', unit: 'the NFZ budget since 2015 — and a queue 43% longer' } },
  'wizyty-prywatne-kolejka-cena': { stat: { of: '231,52 zł', value: 'PLN 231.52', unit: 'average private specialist visit in 2025' } },
  'apteka-pieniadz-publiczny': { stat: { of: '30,0', value: '30.0', unit: 'PLN billion of NFZ reimbursement in 2025' } },
  'covid-pieniadz-publiczny': { stat: { of: '~190', value: '~190', unit: 'PLN billion spent by the COVID-19 Fund' } },
  'lekarze-radni': { stat: { of: '632,6', value: '632.6', unit: 'PLN thousand — median income from work for 2025 (113 checked declarations)' } },
  'dyzur-w-szpitalu-powiatowym': { stat: { of: '8 760', value: '8,760', unit: 'hours a year for one on-call post' } },
  'dlaczego-brakuje-lekarzy': { stat: { of: '62%', value: '62%', unit: 'of specialist training places empty in autumn 2025' } },
  'ciecie-limitow-na-medycyne': { stat: { of: '2 090', value: '2,090', unit: 'full-time places in medical school in 2003, against more than 6,000 in 1987' } },
  'odsiew-na-medycynie': { stat: { of: '1 na 5', value: '1 in 5', unit: 'students who start do not finish on time' } },
  'english-division': { stat: { of: '17%', value: '17%', unit: 'of places in medicine are degree programmes taught in a foreign language' } },
  'odpowiedzialnosc-zawodowa-lekarzy': {
    stat: { of: '20', value: '20', unit: 'doctors finally stripped of the right to practise in 2010–2025' },
    coverAlt: 'Seven rubber stamps lined up from the smallest to the largest. The first ones are dark with ink; the last, largest one is clean',
  },
  'pielegniarstwo-w-polsce': { stat: { of: '55', value: '55', unit: 'years — the average age of a nurse' } },
  'kanada-lekarze-ustawa-specjalna': { stat: { of: '13,04%', value: '13.04%', unit: 'cut in doctors’ fees legislated in Quebec' } },
};

const warned = new Set<string>();
const warn = (key: string, message: string) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[i18n] spisy /en/: ${message} — popraw src/data/en/spis.ts`);
};

/**
 * Zamiana polskiego artykułu na pozycję spisu EN: tłumaczenie albo strona z `page`; brak obu — undefined.
 * Na stronach-szkicach /en/ są wszystkie tłumaczenia, także szkice (`noindex`) — jak dotąd na /en/.
 */
export async function englishEntries(): Promise<(a: Article) => Entry | undefined> {
  const translations = await getTranslations();
  const byId = new Map(translations.map((t) => [t.source.id, t]));
  return (a) => {
    const translated = byId.get(a.id);
    const card = cards[a.id] ?? {};
    const page = translated ? undefined : card.page;
    if (!translated && !page) return undefined;

    const { stat, cover, coverAlt, format, badge } = a.data;
    let statEn: Entry['stat'];
    if (stat && card.stat?.of === stat.value) statEn = { value: card.stat.value, unit: card.stat.unit };
    else if (stat) warn(`stat:${a.id}`, `„${a.id}” — liczba z karty oryginału („${stat.value}”) nie ma wersji EN${card.stat ? ` (wpis jest dla „${card.stat.of}”)` : ''}`);
    if (cover && coverAlt && !card.coverAlt) warn(`alt:${a.id}`, `„${a.id}” — brak angielskiego opisu zdjęcia (coverAlt)`);
    const badgeEn = badge !== undefined && card.badge?.of === badge ? card.badge.text : undefined;
    if (badge && !badgeEn) warn(`badge:${a.id}`, `„${a.id}” — etykieta na zdjęciu („${badge}”) nie ma wersji EN`);

    return {
      id: a.id,
      href: translated ? enHref(translated) : (page!.href ?? articleHref(a)),
      hreflang: page?.polish ? 'pl' : undefined,
      title: translated ? translated.article.data.title : `${page!.title}${page!.polish ? ui.en.inPolish : ''}`,
      summary: translated ? translated.article.data.summary : page!.summary,
      category: a.data.category,
      label: SECTIONS_EN[a.data.category].label,
      date: a.data.date,
      updated: a.data.updated,
      format: format && formats[format],
      stat: statEn,
      cover,
      coverAlt: cover ? (card.coverAlt ?? '') : undefined,
      coverPosition: a.data.coverPosition,
      badge: badgeEn,
      kicker: a.data.kicker && card.kicker,
    };
  };
}

/**
 * Działy strony-indeksu po angielsku: opisy z modułu EN, materiały z tłumaczeniami; dział bez żadnego
 * tłumaczenia znika ze strony.
 */
export function englishGroups<T extends string, I>(
  groups: { topic: T; articles: Article[] }[],
  info: Record<T, I>,
  toEntry: (a: Article) => Entry | undefined,
) {
  return groups
    .map(({ topic, articles }) => ({
      topic,
      info: info[topic],
      articles: articles.map(toEntry).filter((e): e is Entry => e !== undefined),
    }))
    .filter((g) => g.articles.length > 0);
}

/** Liczba różnych pozycji w spisie (pozycja w kilku działach liczy się raz) — jak countArticles w lib/content. */
export const countEntries = (groups: { articles: Entry[] }[]) => new Set(groups.flatMap((g) => g.articles.map((a) => a.id))).size;

/** Liczebnik słownie do nagłówków („Eight figures…”, „Four questions”). */
export const numberWord = (n: number) =>
  ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][n] ?? String(n);
