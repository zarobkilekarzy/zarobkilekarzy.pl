/**
 * Statystyka do podpisów map: czy różnice między regionami są większe niż przypadkowe.
 */

/** ln Γ(z), przybliżenie Lanczosa (g = 7). */
function lnGamma(z: number): number {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Górny ogon regularyzowanej funkcji gamma Q(a, x): szereg dla małych x, ułamek łańcuchowy dla dużych. */
function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  const front = Math.exp(-x + a * Math.log(x) - lnGamma(a));
  if (x < a + 1) {
    let sum = 1 / a, term = sum;
    for (let n = 1; n < 1000 && Math.abs(term) > Math.abs(sum) * 1e-14; n++) {
      term *= x / (a + n);
      sum += term;
    }
    return 1 - sum * front;
  }
  const tiny = 1e-300;
  let b = x + 1 - a, c = 1 / tiny, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const step = d * c;
    h *= step;
    if (Math.abs(step - 1) < 1e-14) break;
  }
  return front * h;
}

/**
 * Test χ² jednorodności udziałów: czy odsetek „tak” (k z n) różni się między grupami bardziej,
 * niż wynikałoby z przypadku. Zwraca p; p ≥ 0,05 = różnice mieszczą się w przypadku.
 */
export function homogeneityP(groups: { k: number; n: number }[]): number {
  const N = groups.reduce((s, g) => s + g.n, 0);
  const K = groups.reduce((s, g) => s + g.k, 0);
  const p = K / N;
  let chi = 0;
  for (const g of groups) {
    const yes = g.n * p, no = g.n * (1 - p);
    chi += (g.k - yes) ** 2 / yes + (g.n - g.k - no) ** 2 / no;
  }
  return gammaQ((groups.length - 1) / 2, chi / 2);
}
