/**
 * Klasy skali i stopnie rampy --seq-* — bez zależności, więc korzysta z nich i build (./layout),
 * i skrypt mapy w przeglądarce (warstwy na żywo).
 */
import type { ClassScale } from './types';

/** Liczba stopni rampy --seq-* — skala nie może mieć więcej klas. */
export const TONES = 5;

type Scale = Pick<ClassScale, 'edges' | 'tones'>;

/** Klasa wartości (indeks w scale.labels). */
export function classOf(value: number, scale: Scale): number {
  const i = scale.edges.findIndex((e) => value < e);
  return i < 0 ? scale.edges.length : i;
}

/** Stopień rampy dla klasy: sama klasa albo jej odpowiednik z scale.tones. */
export const toneOfClass = (k: number, scale: Scale): number => scale.tones?.[k] ?? k;

/** Stopień rampy --seq-* dla wartości. */
export const toneOf = (value: number, scale: Scale): number => toneOfClass(classOf(value, scale), scale);
