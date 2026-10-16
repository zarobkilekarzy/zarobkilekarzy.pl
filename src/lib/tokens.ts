/**
 * Tokeny kolorów z tokens.css dla grafik generowanych w buildzie (PNG, SVG do pobrania), gdzie
 * nie działa CSS: każdy token jako para [dzień, noc] z light-dark().
 */
import tokensCss from '@/styles/tokens.css?raw';

/**
 * Token jako para [dzień, noc]. Kotwiczymy do deklaracji na początku wiersza (pierwszej, w :root):
 * nazwy tokenów padają też w komentarzach, a wariant „Większy tekst” deklaruje część z nich drugi raz.
 */
export const tokenPair = (name: string): [string, string] => {
  const value = tokensCss.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'))?.[1].trim();
  if (!value) throw new Error(`brak tokenu --${name} w tokens.css`);
  const pair = value.match(/^light-dark\(\s*([^,]+),\s*([^)]+)\)/);
  return pair ? [pair[1].trim(), pair[2].trim()] : [value, value];
};

/** Wartość tokenu w jednym motywie. */
export const tokenColor = (name: string, night: boolean) => tokenPair(name)[night ? 1 : 0];
