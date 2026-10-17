/**
 * Renderer mapy do SVG — wspólny dla mapy na stronie i grafik do pobrania.
 *
 * - theme 'css': kolory przez klasy i atrybuty (`data-tone`), które styluje komponent PolandMap
 *   tokenami z tokens.css — działa w obu motywach strony. Rysuje wszystkie warstwy punktowe
 *   (nieaktywne z klasą `is-off`), a województwa w barwach warstwy aktywnej; skrypt komponentu
 *   przełącza tryby bez ponownego rysowania.
 * - theme 'jasny' / 'ciemny': kolory wpisane wprost (wartości tych samych tokenów) i tylko warstwa
 *   aktywna — do PNG (Satori/sharp) i plików SVG.
 */
import { tokenColor } from '@/lib/tokens';
import { geo } from './geo';
import { placePoints, TONES, toneOf } from './layout';
import type { MapLayer, MapSet, PointLayer, RegionLayer, Tip } from './types';

export type MapTheme = 'css' | 'jasny' | 'ciemny';

export interface SvgOptions {
  theme: MapTheme;
  /** id warstwy widocznej na starcie */
  active: string;
  /** wartości na województwach; grafika z Satori podpisuje je sama — wtedy false */
  labels?: boolean;
  /** id elementu <desc> z opisem warstwy (tylko 'css', dla aria-labelledby) */
  descId?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (v: number) => String(Math.round(v * 10) / 10);

/** Kolory wersji statycznej — nocne lub dzienne wartości tokenów. */
export function staticColors(night: boolean) {
  const t = (name: string) => tokenColor(name, night);
  return {
    /** województwa w trybie punktowym */
    base: t('bg-soft'),
    border: t('line-2'),
    /** szczelina między wypełnionymi województwami i obwódka kół = tło planszy */
    gap: night ? t('bg') : '#fff',
    missing: t('chart'),
    seq: Array.from({ length: TONES }, (_, i) => t(`seq-${i}`)),
    onSeq: Array.from({ length: TONES }, (_, i) => t(`on-seq-${i}`)),
  };
}

export const activeLayer = (layers: MapLayer[], id: string) => layers.find((l) => l.id === id) ?? layers[0];

/** Klasa każdego województwa w warstwie regionów (kod TERYT → klasa, podpis). */
export function regionTones(layer: RegionLayer): Map<string, { tone: number; display: string }> {
  return new Map(layer.regions.map((r) => [r.teryt, { tone: toneOf(r.value, layer.scale), display: r.display }]));
}

function points(layer: PointLayer, theme: MapTheme, on: boolean): string {
  const { placed } = placePoints(layer);
  const c = theme === 'css' ? null : staticColors(theme === 'ciemny');
  const dots = placed
    .map((p) => {
      const geom = `cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r)}"`;
      if (!c) return p.tone == null ? `<circle class="pm-pt pm-pt--none" data-i="${p.i}" ${geom}/>` : `<circle class="pm-pt" data-i="${p.i}" data-tone="${p.tone}" ${geom}/>`;
      return p.tone == null ? `<circle ${geom} fill="${c.missing}"/>` : `<circle ${geom} fill="${c.seq[p.tone]}" stroke="${c.gap}" stroke-width="1"/>`;
    })
    .join('');
  return `<g class="pm-pts${on ? '' : ' is-off'}" data-layer="${esc(layer.id)}">${dots}</g>`;
}

export function renderMapSvg(layers: MapLayer[], o: SvgOptions): string {
  const active = activeLayer(layers, o.active);
  const tones = active.kind === 'regions' ? regionTones(active) : null;
  const c = o.theme === 'css' ? null : staticColors(o.theme === 'ciemny');

  const regions = geo.voivodeships
    .map((r) => {
      const t = tones?.get(r.teryt);
      if (!c) return `<path class="pm-reg" data-r="${r.teryt}" data-tone="${t?.tone ?? ''}" d="${r.d}"/>`;
      // kartogram: odstęp między województwami to obrys w kolorze tła POD wypełnieniem (paint-order) — kolejne
      // województwo nachodzi nim 1,2 px na poprzednie, a brzeg morza nie jest ścinany (Hel znikał pod obrysem)
      return t
        ? `<path d="${r.d}" fill="${c.seq[t.tone]}" stroke="${c.gap}" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/>`
        : `<path d="${r.d}" fill="${c.base}" stroke="${c.border}" stroke-width="0.8" stroke-linejoin="round"/>`;
    })
    .join('');

  const pointLayers = layers.filter((l): l is PointLayer => l.kind === 'points' && (o.theme === 'css' || l.id === active.id));
  const dots = pointLayers.map((l) => points(l, o.theme, l.id === active.id)).join('');

  const labels =
    o.labels === false
      ? ''
      : geo.voivodeships
          .map((r) => {
            const t = tones?.get(r.teryt);
            const at = `x="${r.label[0]}" y="${r.label[1]}"`;
            if (!c) return `<text class="pm-val" data-r="${r.teryt}" data-tone="${t?.tone ?? ''}" ${at}>${esc(t?.display ?? '')}</text>`;
            return t ? `<text ${at} fill="${c.onSeq[t.tone]}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" text-anchor="middle" dominant-baseline="central">${esc(t.display)}</text>` : '';
          })
          .join('');

  const desc = o.theme === 'css' && o.descId ? `<desc id="${esc(o.descId)}">${esc(active.alt)}</desc>` : '';
  const a11y = o.theme === 'css' ? ` class="pm-svg" role="img"${o.descId ? ` aria-labelledby="${esc(o.descId)}"` : ''}` : ' xmlns="http://www.w3.org/2000/svg"';
  return `<svg${a11y} viewBox="0 0 ${geo.width} ${geo.height}" width="${geo.width}" height="${geo.height}">${desc}<g class="pm-regs">${regions}</g>${dots}<g class="pm-vals">${labels}</g></svg>`;
}

/**
 * Treść dymków zestawu: warstwa → dymki punktów (po indeksie punktu) albo województw (po kodzie TERYT).
 * Strona dostaje ją osobnym plikiem (/mapy/<zestaw>.json) przy pierwszym ruchu nad mapą, żeby
 * kilkaset dymków nie obciążało HTML.
 */
export function mapTips(set: MapSet): Record<string, Tip[] | Record<string, Tip>> {
  return Object.fromEntries(set.layers.map((l) => [l.id, l.kind === 'points' ? l.points.map((p) => p.tip) : Object.fromEntries(l.regions.map((r) => [r.teryt, r.tip]))]));
}

/** Adres pliku z dymkami zestawu. */
export const tipsUrl = (setId: string) => `/mapy/${setId}.json`;
