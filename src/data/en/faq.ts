/**
 * Wersja angielska src/data/faq.ts (strona /en/faq/). Te same pytania w tej samej kolejności, ten sam przypis.
 * Linki do stron z wersją EN prowadzą do niej; pozostałe — do strony polskiej z „(in Polish)”.
 */
import type { FaqItem } from '@/types';
import { defineNotes } from '@/lib/notes';

export const faqPage = {
  title: 'Common objections',
  docTitle: 'Objections to transparency of doctors’ pay',
  lead: 'The counter-arguments we hear most often, and how we answer them. We criticise a mechanism, not a profession.',
  description: 'Is pay transparency an attack on doctors, populism or an incentive to emigrate? The most common objections to our project and our answers.',
  updated: '15.10.2026',
};

export const faqItems: FaqItem[] = [
  {
    question: 'Doctors train for years and work hard. They deserve to earn well.',
    answer: [
      'We agree, and we do not question fair pay. We question something else: nobody adds up the public money paid to one person, so neither the typical amount nor payments from several facilities at once can be seen. We describe this in our text on [multiple jobs](/en/mechanisms/multiple-jobs-parallel-contracts/).',
      'This is a criticism of a mechanism, not of the profession.',
    ],
  },
  {
    question: 'This is populism and envy of other people’s salaries.',
    answer: [
      'The point is not how much anyone earns, but whether public spending is transparent. Pay in public administration and the asset declarations of people holding public office are already public. Money from the health contribution should not be an exception.',
      'We do not call for pay cuts or for taking money away from anyone. We call for it to be visible where the money goes.',
    ],
  },
  {
    question: 'Doctors are leaving the country. They need to be paid well so that they stay.',
    answer: [
      'That is partly true. But transparency does not cut anyone’s pay. What it does show is whether further billions for pay rises go where doctors are lacking, or are spread across contracts whose totals nobody can see.',
      'It is possible both to keep doctors in the country and to know how much the system pays them.',
    ],
  },
  {
    question: 'International comparisons show that Polish doctors earn little.',
    answer: [
      'More recent OECD data show something else: a salaried specialist in Poland earns about 2.9 times as much as the average worker (2022 data) — above the OECD average of 2.8. Adjusted for purchasing power, however, Poland does less well.[^demagog]',
      'The more important caveat: these data cover salaried doctors only. About 73% of specialists work under contracts, which OECD statistics do not include — so no comparison today shows how much one person earns in total ([Contract or employment](/en/mechanisms/contract-vs-employment/)).',
    ],
  },
  {
    question: 'You write yourselves that there are too few doctors. So what is the point?',
    answer: [
      'There really is a shortage of doctors at the bedside; where it comes from and what the future may look like is shown by our [doctor supply simulator](/analizy/symulator-podazy-lekarzy/) (in Polish).',
      'A shortage and high rates do not contradict each other. When doctors are scarce, hospitals compete for everyone who can cover an on-call shift, and that pushes prices up. All the more reason to see how much public money goes to one person.',
    ],
  },
  {
    question: 'Working under several contracts is legal. What is wrong with that?',
    answer: [
      'In itself, nothing. But legality is not the same as transparency. The problem is that nobody sees the **total** hours or the total payments from public money to one person, so neither the costs nor the effect on patients’ access to care can be assessed.',
      'That is why we [call for](/en/demand/) public total payments for each person, under a permanent identifier and without names.',
    ],
  },
  {
    question: 'Pay transparency violates privacy and the GDPR.',
    answer: [
      'Our demand concerns public money only and does not cover names: the published data carry a permanent identifier instead of a first name and surname, PESEL number or licence-to-practise number. We discuss the legal basis, the risk of identifying a person in a small hospital and other legal questions [with our demand](/en/demand/#objections).',
    ],
  },
];

/** Przypisy do odpowiedzi — ten sam zestaw i kolejność co w wersji polskiej. */
export const faqNotes = defineNotes({
  demagog:
    'Demagog, a Polish fact-checking organisation, [fact-check of a claim about doctors’ pay in Poland compared with Europe](https://demagog.org.pl/wypowiedzi/polska-trzecia-w-europie-pod-wzgledem-zarobkow-lekarzy-nie-da-sie-tego-zweryfikowac/) (in Polish), based on the OECD report “Health at a Glance 2025”.',
});
