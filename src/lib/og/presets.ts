/**
 * Presety obrazków OG: dane strony → specyfikacja do renderu.
 * Kaskada: preset typu strony ← nadpisanie `og` ← własny plik `og.image`.
 * Nowy typ strony = nowa funkcja presetu; szablon (render.ts) i endpoint zostają bez zmian.
 */
import type { ImageMetadata } from 'astro';
import type { IconName } from '@/icons';
import type { Category, OgCover, OgDots, OgOverride, OgPage, OgStat } from '@/types';
import { PICTOGRAMS, type PictogramName } from '@/lib/siatka/piktogramy';
import { ekgLines, frameLines } from '@/lib/siatka';
import { articleHref, getFootnotes, readingMinutes, sectionOf, type Article } from '@/lib/content';
import { formatDate, plural } from '@/lib/format';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
/** Najdłuższy tytuł (bez ręcznych podziałów), który mieści się w kolumnie obok mediów. */
export const NARROW_TITLE_MAX = 80;

export type OgMedia =
  | { kind: 'photo'; src: ImageMetadata; position: string; badge?: string; icon?: IconName; color?: boolean }
  | { kind: 'stat'; stat: OgStat }
  | ({ kind: 'map' } & NonNullable<OgPage['map']>)
  | ({ kind: 'bars' } & NonNullable<OgPage['bars']>)
  | { kind: 'panels'; panels: NonNullable<OgPage['panels']> }
  | { kind: 'logo'; logo: NonNullable<OgPage['logo']> }
  | ({ kind: 'dots' } & OgDots)
  | { kind: 'stamps'; stamps: NonNullable<OgPage['stamps']> }
  | { kind: 'none' };

/** Gotowa specyfikacja obrazka — wejście szablonu. */
export interface OgSpec {
  /** „\n” = ręczny podział wiersza */
  title: string;
  eyebrow?: string;
  lead?: string;
  footer?: { text: string; flags?: boolean };
  /** lead bez względu na długość tytułu */
  leadAlways?: boolean;
  media: OgMedia;
  /** okładka na cały kadr — szablon pomija wtedy tytuł, media i stopkę */
  cover?: OgCover;
}

/** Obrazek jednej trasy: generowany ze `spec` albo gotowy plik (`file`). */
export interface OgEntry {
  route: string;
  /** og:image:alt */
  alt: string;
  spec?: OgSpec;
  file?: ImageMetadata;
}

/** Wartości domyślne z presetu, zanim nałożymy nadpisanie. */
interface Defaults {
  title: string;
  eyebrow?: string;
  lead?: string;
  photo?: ImageMetadata;
  position?: string;
  badge?: string;
  icon?: IconName;
  footer?: OgSpec['footer'];
  map?: OgPage['map'];
  bars?: OgPage['bars'];
  panels?: OgPage['panels'];
  logo?: OgPage['logo'];
  dots?: OgDots;
  stamps?: OgPage['stamps'];
  /** piktogram, gdy obrazek nie ma innej grafiki */
  pictogram?: PictogramName | 'ekg';
  leadAlways?: boolean;
}

/** Siatka z kropek w kolumnie mediów (470×518): 20×22 pola po ~23 px. */
const DOT_COLS = 20;
const DOT_ROWS = 22;

/** Piktogram albo uderzenie EKG z kropek na polu z plusów — grafika obrazka bez zdjęcia i wykresu. */
const pictogramDots = (name: PictogramName | 'ekg'): OgDots =>
  name === 'ekg'
    ? { mask: ekgLines(DOT_COLS, DOT_ROWS), codes: { '#': { size: 'on', color: 'blue' } } }
    : { mask: frameLines(PICTOGRAMS[name], DOT_COLS, DOT_ROWS), codes: { '#': { size: 'on', color: 'blue' }, o: { size: 'mid', color: 'blue' } } };

/** Piktogram artykułu bez grafiki — wg kategorii (działu). */
const CATEGORY_PICTOGRAM: Record<Category, PictogramName> = {
  Mechanizm: 'umowa', Analiza: 'szpital', Dane: 'pieniadze', Przewodnik: 'serce', 'Projekt ustawy': 'umowa', Narzędzie: 'schody',
};

/** Skróty, po których kropka nie kończy zdania („500 tys. CAD”, „art. 27a”). */
const ABBR = /(?:^|\s)(?:tys|mln|mld|ok|r|art|ust|pkt|nr|dr|prof|np|tj|m\.in|ds|godz|min)\.$/i;

/** Pierwsze zdanie tekstu albo nic, gdy jest dłuższe niż 120 znaków (lepiej brak leadu niż ucięty). */
export function firstSentence(text: string): string | undefined {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„])/);
  let out = parts.shift() ?? '';
  while (parts.length && ABBR.test(out)) out += ` ${parts.shift()}`;
  return out.length <= 120 ? out : undefined;
}

function compose(route: string, d: Defaults, o: OgOverride & { cover?: OgCover } = {}): OgEntry {
  const title = o.title ?? d.title;
  const alt = title.replace(/\s*\n\s*/g, ' ');
  if (o.image) return { route, alt, file: o.image };

  const photo = o.illustration ?? o.photo ?? d.photo;
  const mode = o.media ?? 'auto';
  // grafika z kropek zabiera kolumnę mediów — za długi tytuł zostaje na całą szerokość, bez niej
  const fitsNarrow = title.includes('\n') || title.length <= NARROW_TITLE_MAX;
  const kind = mode === 'auto' ? (o.stat ? 'stat' : photo ? 'photo' : d.map ? 'map' : d.bars ? 'bars' : d.panels ? 'panels' : d.logo ? 'logo' : d.stamps ? 'stamps' : fitsNarrow || d.dots ? 'dots' : 'none') : mode;

  let media: OgMedia = { kind: 'none' };
  if (kind === 'stat' && o.stat) {
    media = { kind: 'stat', stat: o.stat };
  } else if (kind === 'map' && d.map) {
    media = { kind: 'map', ...d.map };
  } else if (kind === 'bars' && d.bars) {
    media = { kind: 'bars', ...d.bars };
  } else if (kind === 'panels' && d.panels) {
    media = { kind: 'panels', panels: d.panels };
  } else if (kind === 'dots') {
    media = { kind: 'dots', ...(d.dots ?? pictogramDots(o.pictogram ?? d.pictogram ?? 'ekg')) };
  } else if (kind === 'stamps' && d.stamps) {
    media = { kind: 'stamps', stamps: d.stamps };
  } else if (kind === 'logo' && d.logo) {
    media = { kind: 'logo', logo: d.logo };
  } else if (kind === 'photo' && o.illustration) {
    media = { kind: 'photo', src: o.illustration, position: o.position ?? '50% 50%', color: true };
  } else if (kind === 'photo' && photo) {
    const badge = o.badge === false ? undefined : (o.badge ?? d.badge);
    media = { kind: 'photo', src: photo, position: o.position ?? d.position ?? '50% 50%', badge, icon: d.icon };
  } else if (kind !== 'none') {
    console.warn(`[og] ${route}: media „${kind}” bez danych (og.${kind === 'photo' ? 'photo / og.illustration' : 'stat'}) — obrazek bez mediów`);
  }

  return {
    route,
    alt,
    spec: {
      title,
      eyebrow: o.eyebrow ?? d.eyebrow,
      lead: o.lead === false ? undefined : (o.lead ?? d.lead),
      footer: d.footer,
      leadAlways: d.leadAlways,
      media,
      cover: o.cover,
    },
  };
}

/**
 * Artykuł: etykieta sekcji, lead = pierwsze zdanie, okładka, stopka z liczbą przypisów i datą.
 * `media` — wykres w miejscu zdjęcia (src/data/og.ts → ogArticleMedia); okładka ma pierwszeństwo.
 */
export function articleOg(article: Article, media: Pick<OgPage, 'bars' | 'panels' | 'dots' | 'stamps'> = {}): OgEntry {
  const { title, summary, cover, coverPosition, badge, updated, date, og } = article.data;
  const when = updated ?? date;
  const notes = getFootnotes(article).count;
  const footer = [
    notes > 0 && `${notes} ${plural(notes, ['przypis', 'przypisy', 'przypisów'])}`,
    when && `${updated ? 'aktualizacja' : 'publikacja'} ${formatDate(when)}`,
    `${readingMinutes(article)} min czytania`,
  ]
    .filter(Boolean)
    .join(' · ');

  return compose(
    articleHref(article),
    {
      title,
      eyebrow: sectionOf(article).label,
      lead: firstSentence(summary),
      photo: cover,
      position: coverPosition,
      badge,
      // ta sama ikona co etykieta na okładce w blocks/ArticleFeature
      icon: 'pin',
      pictogram: CATEGORY_PICTOGRAM[article.data.category],
      footer: { text: footer },
      ...media,
    },
    og,
  );
}

/** Strona spoza kolekcji (src/data/og.ts): wszystko podane wprost; stopka domyślnie z hasłem serwisu. */
export function pageOg(route: string, { footer = { text: 'Bez emocji, ze źródłami.' }, badgeIcon, map, bars, panels, logo, dots, stamps, leadAlways, ...page }: OgPage): OgEntry {
  return compose(route, { title: page.title, footer, icon: badgeIcon, map, bars, panels, logo, dots, stamps, leadAlways }, page);
}
