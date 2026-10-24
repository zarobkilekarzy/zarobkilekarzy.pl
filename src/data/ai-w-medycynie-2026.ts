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

/**
 * H. Nori i in., „Sequential diagnosis with language models”, Science, 22.10.2026 (Microsoft AI): trafne
 * rozpoznania w symulacji, % przypadków. MAI-DxO na GPT-5 wobec lekarzy rodzinnych i szpitalnych z USA i UK.
 * 304 przypadki z NEJM (lekarze: 56 najnowszych) i 325 przyjęć z SOR, MIMIC-IV-ED (lekarze: 71).
 */
export const NORI = {
  href: 'https://doi.org/10.1126/science.aeh7930',
  cases: 629,
  nejm: { ai: 83.2, doctors: 36.1 },
  sor: { ai: 80.3, doctors: 46.8 },
};
