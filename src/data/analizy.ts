/**
 * Strona /analizy/: opisy działów. Same analizy to wpisy kolekcji `articles` z polem `topic`
 * — spis buduje lib/content.ts → getTopicGroups(ANALYSIS_TOPICS, analysisTopics).
 */
import type { ANALYSIS_TOPICS, TopicInfo } from '@/types';

export const analizyPage = {
  title: 'Analizy',
  eyebrow: 'Pogłębione tematy',
  lead: 'Dłuższe analizy, które wychodzą poza pojedynczą liczbę: porównania międzynarodowe, przepisy, mechanika niedoboru lekarzy i kształcenia. Każda teza z linkiem do źródła.',
  /** meta description (lead jest dłuższy niż 160 znaków) */
  description: 'Analizy, które wychodzą poza pojedynczą liczbę: porównania międzynarodowe, przepisy, niedobór lekarzy i kształcenie. Każda teza z linkiem do źródła.',
};

export const analysisTopics: Record<(typeof ANALYSIS_TOPICS)[number], TopicInfo> = {
  rejestr: {
    label: 'Jawność i rejestr',
    lead: 'Co państwo już wie, czego nie publikuje i jak mogłyby wyglądać jawne dane o wynagrodzeniach.',
  },
  pieniadz: {
    label: 'Pieniądz publiczny i wynagrodzenia',
    lead: 'Droga publicznej złotówki: od składki i refundacji po kontrakt, którego nikt nie sumuje.',
  },
  ksztalcenie: {
    label: 'Kształcenie i kadry',
    lead: 'Limity, odsiew, puste rezydentury, wyjazdy i starzejące się kadry — dlaczego miejsc jest dużo, a lekarzy i pielęgniarek brakuje.',
  },
  porownania: {
    label: 'Polska na tle innych krajów',
    lead: 'Jak płacą lekarzom i co publikują inne systemy — sąsiedzi, Tajwan, Kanada — i co z tego wynika dla Polski.',
  },
};
