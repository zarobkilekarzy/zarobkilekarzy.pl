/**
 * Aktualności (kolekcja `news`, src/content/aktualnosci/): adresy i listy wpisów.
 * Szkic (`draft: true`) ma stronę tylko w `astro dev` (z noindex i ramką „Szkic”) — do akceptacji przed publikacją.
 * W buildzie go nie ma: wpis o wysłanych pismach nie może być pod adresem produkcji, zanim pisma wyjdą.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import illustration from '@/assets/aktualnosci/ilustracja-aktualnosci.webp';
import { raw } from '@/lib/images';

export type News = CollectionEntry<'news'>;

export const newsPage = {
  href: '/aktualnosci/',
  title: 'Aktualności',
  lead: 'Co zmienia się na stronie i w projekcie: nowe działy, wysłane pytania i pisma, kolejne etapy działań. Materiały z danymi i analizy znajdziesz w działach serwisu.',
  description: 'Komunikaty zarobkilekarzy.pl: zmiany na stronie, wysłane pytania i pisma, kolejne etapy działań — z datą przy każdym wpisie.',
};

export const newsHref = (entry: News) => `${newsPage.href}${entry.id}/`;

/** Ilustracja działu (linia EKG, wpisy jako „uderzenia”) — nagłówek /aktualnosci/ i zdjęcie wpisu bez własnego. */
export const newsIllustration = {
  src: illustration,
  alt: 'Ilustracja: linia EKG na granatowej siatce z trzema uderzeniami; nad każdym kwadratowy znacznik, pod każdym zarys krótkiego wpisu.',
};

/** Zdjęcie wpisu na liście i na obrazku OG: własne (`cover`) albo ilustracja działu. */
export const newsImage = (entry: News) =>
  entry.data.cover ? { src: entry.data.cover, alt: entry.data.coverAlt ?? '' } : newsIllustration;

/**
 * Czy miniaturę pokazać w całości: obraz szerszy niż kadr listy (infografika, obrazek OG) przycięty
 * gubiłby treść z boku. Zrzuty ekranu (węższe) dalej wypełniają kadr, przycięte od dołu.
 */
export const newsThumbWhole = (entry: News, frame: number) => {
  const { width, height } = raw(newsImage(entry).src);
  return width / height > frame + .01;
};

const byDate = (a: News, b: News) => b.data.date.valueOf() - a.data.date.valueOf();

/** Wpisy, z których powstają strony: w dev także szkice. */
export const getAllNews = async () => (await getCollection('news', (entry) => import.meta.env.DEV || !entry.data.draft)).sort(byDate);

/** Opublikowane wpisy od najnowszego — lista, RSS, obrazki OG. */
export const getNews = async () => (await getCollection('news', (entry) => !entry.data.draft)).sort(byDate);
