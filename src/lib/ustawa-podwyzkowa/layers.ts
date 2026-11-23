/**
 * Warstwy kosztu ustawy o najniższych płacach: każda lipcowa waloryzacja to warstwa, która od swojego roku zostaje
 * w kosztach NFZ na stałe (w roku wejścia — połowa, bo działa od 1 lipca). Waloryzacje znane mają koszt z dokumentów,
 * prognozowane — pula płac objętych ustawą × tempo wzrostu przeciętnego wynagrodzenia `g` (pula rośnie o to samo tempo).
 * Czysta funkcja: liczy ją serwer (stan bez JS) i skrypt suwaka.
 */
export interface KnownRaise { year: number; cost: number }

export interface LayerYear {
  year: number;
  /** wkład kolejnych waloryzacji w danym roku, mld zł; `proj` — prognoza */
  layers: { from: number; value: number; proj: boolean }[];
  total: number;
}

export function costLayers(known: KnownRaise[], pool: number, g: number, years: number[]): LayerYear[] {
  const raises = known.map((r) => ({ year: r.year, cost: r.cost, proj: false }));
  const last = Math.max(...known.map((r) => r.year));
  let p = pool;
  for (let y = last + 1; y <= Math.max(...years); y++) {
    raises.push({ year: y, cost: p * g, proj: true });
    p *= 1 + g;
  }
  return years.map((year) => {
    const layers = raises
      .map((r) => ({ from: r.year, value: year < r.year ? 0 : year === r.year ? r.cost / 2 : r.cost, proj: r.proj }))
      .filter((l) => l.value > 0);
    return { year, layers, total: layers.reduce((s, l) => s + l.value, 0) };
  });
}
