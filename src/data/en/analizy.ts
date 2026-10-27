/**
 * Wersja angielska modułu src/data/analizy.ts (strona /en/analysis/; oryginał: src/pages/analizy/index.astro):
 * opisy działów i napisy układu, które w PL stoją w stronie. Materiały działów — src/data/en/spis.ts.
 * Odsyłacz „Ustawy na stronie” (`more` działu „rejestr”) prowadzi do strony tylko po polsku — w EN go nie ma.
 */
import type { ANALYSIS_TOPICS, TopicInfo } from '@/types';

export const analizyPage = {
  title: 'Analysis',
  /** tytuł w karcie i wynikach wyszukiwania (PL: wpisany w stronę) */
  docTitle: 'Analysis: doctors’ pay and medical training',
  eyebrow: 'In-depth topics',
  lead: 'Longer analyses that go beyond a single figure: international comparisons, legislation, the mechanics of the doctor shortage and of medical training. Every claim links to its source.',
  description: 'Analyses that go beyond a single figure: international comparisons, legislation, the doctor shortage and medical training. Every claim links to its source.',
};

/** Napisy układu strony (w PL wpisane w stronę). */
export const labels = {
  meta: { items: 'Analyses', sections: 'Sections', updated: 'Updated' },
  jump: 'Sections',
  noun: ['analysis', 'analyses', 'analyses'] as [string, string, string],
};

export const analysisTopics: Record<(typeof ANALYSIS_TOPICS)[number], TopicInfo> = {
  rejestr: {
    label: 'Transparency and the register',
    lead: 'What the state already knows, what it does not publish and what open pay data could look like.',
  },
  pieniadz: {
    label: 'Public money and pay',
    lead: 'The path of the public złoty: from the contribution and reimbursement to a contract that nobody adds up.',
  },
  ksztalcenie: {
    label: 'Training and workforce',
    lead: 'Limits, dropouts, empty residencies, emigration and an ageing workforce — why there are many places, yet a shortage of doctors and nurses.',
  },
  porownania: {
    label: 'Poland compared with other countries',
    lead: 'How other systems pay doctors and what they publish — the neighbours, Taiwan, Canada — and what follows for Poland.',
  },
};
