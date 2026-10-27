/**
 * Warstwy na żywo: plik JSON wczytywany w przeglądarce i adapter, który zamienia go na wartości,
 * wielkości i dymki punktów oraz liczby do panelu (kontrakt: PointLayer.live w ./types).
 * Adaptery ładują się dopiero, gdy na stronie jest mapa z taką warstwą.
 */
import type { LiveAdapterId, Tip } from './types';

export interface LiveResult {
  /** po jednym na punkt warstwy, w kolejności layer.points; value null = szary punkt */
  points: { value: number | null; size?: number; tip: Tip }[];
  /** liczebność klas skali i szarych punktów (legenda) */
  counts: number[];
  missing: number;
  summary?: { value: string; text: string };
  /** linia nad legendą, np. „Stan z 01:28 · odświeżane co 10 minut” */
  stamp: string;
  /** lista wyróżnionych punktów (PointLayer.top) */
  top?: { i: number; title: string; meta: string; value: string; detail: string }[];
}

/** Dane z buildu, których adapter potrzebuje: identyfikatory i stałe dymki punktów. */
export interface LiveInput {
  keys: (string | null)[];
  tips: Tip[];
  /** napisy adaptera z buildu (PointLayer.live.text), np. w innym języku; bez nich adapter ma własne, polskie */
  text?: object;
}

export type LiveAdapter = (data: unknown, input: LiveInput) => LiveResult;

export const liveAdapters: Record<LiveAdapterId, () => Promise<LiveAdapter>> = {
  sor: () => import('@/lib/sor/live').then((m) => m.adapt),
};
