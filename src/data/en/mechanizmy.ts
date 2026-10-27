/**
 * Wersja angielska modułu src/data/mechanizmy.ts (strona /en/mechanisms/; oryginał: src/pages/mechanizmy/index.astro):
 * działy jako pytania czytelnika — te same zdjęcia i kadry (importowane z modułu polskiego), teksty po angielsku,
 * plus napisy układu, które w PL stoją w stronie. Materiały działów — src/data/en/spis.ts.
 */
import type { MECHANISM_TOPICS, QuestionTopic } from '@/types';
import { mechanismTopics as topicsPl } from '@/data/mechanizmy';

export const mechanizmyPage = {
  title: 'Mechanisms',
  /** tytuł w karcie i wynikach wyszukiwania (PL: wpisany w stronę) */
  docTitle: 'Mechanisms: how doctors are paid in Poland',
  eyebrow: 'How the system works',
  lead: 'We describe systemic mechanisms, not individuals: how the design of the system allows a narrow group to accumulate income from public funds — at the expense of patients and honest doctors.',
  description: 'How the NFZ pays hospitals and who sets prices, how contracts and several jobs at once work, where fictitious visits come from and who regulates access to the profession.',
  common: {
    title: 'The common denominator: no transparency',
    text: 'All these mechanisms have one thing in common: there is no register that adds up the public payments to one doctor. That is why our demand concerns transparency, not individuals. Every claim on the subpages has a publicly available source.',
  },
};

/** Napisy układu strony (w PL wpisane w stronę). */
export const labels = {
  meta: { items: 'Mechanisms', questions: 'Questions', updated: 'Updated' },
  jump: (count: string) => `${count} questions`,
  listLabel: 'Mechanisms on this topic',
  tools: {
    eyebrow: 'Tools',
    title: 'Check for yourself',
    aside: 'The mechanisms show up in the data: check the live queues at hospital emergency departments.',
  },
  commonEyebrow: 'What connects them',
};

export const mechanismTopics: Record<(typeof MECHANISM_TOPICS)[number], QuestionTopic> = {
  jawnosc: {
    ...topicsPl.jawnosc,
    label: 'Transparency and oversight',
    question: 'Who checks what we pay for?',
    lead: 'Visits that never happened, and no register that would catch them.',
    answer:
      'Almost nobody. NFZ inspections are selective, and nobody publishes the total of public payments to one doctor — since 2026 the state can calculate it, but does not disclose it. The only witness from outside the facility–Fund relationship is the patient: in 2024 patients filed almost 3,500 objections to entries in their Internet Patient Account (IKP), and more than 1,600 of them were found justified.',
  },
  platnik: {
    ...topicsPl.platnik,
    label: 'How the NFZ pays',
    question: 'What does the NFZ actually pay for?',
    lead: 'Points, lump sums, overperformance and prices set by the payer itself.',
    answer:
      'For an entry in the system, valued in points — not for the visit itself. The independent tariff covers about 17% of the value of services; the payer sets the rest of the prices itself. When a price drifts away from the cost, some procedures become loss-making (a queue) and others a magnet for profit.',
  },
  zatrudnienie: {
    ...topicsPl.zatrudnienie,
    label: 'Forms of employment',
    question: 'Why can nobody see how much a doctor earns?',
    lead: 'Contracts, several jobs at once and paid standby.',
    answer:
      'About 73% of specialists bill as a business, and nobody publishes the amounts of their contracts. The same doctor can have contracts in several facilities at once and paid standby, reachable by phone — each facility sees only its own piece.',
  },
  dostep: {
    ...topicsPl.dostep,
    label: 'Access to the profession',
    question: 'Who decides how many doctors there are?',
    lead: 'Limits on places in medical school and in specialist training, and the role of the medical self-government.',
    answer:
      'The Minister of Health sets the number of places in medical school and the pool of residencies, the CMKP (Centre of Postgraduate Medical Education) accredits training facilities, and one supervisor may train at most three doctors. The medical self-government gives opinions on the limits and opposes new programmes; whether restricting entry raises rates is, in Poland, a hypothesis.',
  },
};
