/**
 * Dane analizy „Sztuczna inteligencja w medycynie: stan na 2026” (content/articles/ai-w-medycynie-2026.mdx),
 * używane przez infografiki (lib/infografiki/zestawy.ts).
 */

/**
 * A. M. Bean i in., Nature Medicine 32 (2026), s. 609–615: trafne wskazanie choroby w scenariuszach,
 * % przypadków. Uczestnicy z modelem — górna granica („mniej niż”).
 * 1298 osób z Wielkiej Brytanii, modele GPT-4o, Llama 3, Command R+.
 */
export const BEAN = {
  href: 'https://doi.org/10.1038/s41591-025-04074-y',
  modelAlone: 94.9,
  withModelBelow: 34.5,
  participants: 1298,
};
