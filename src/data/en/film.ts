/**
 * Film „Doba” po angielsku: tylko teksty — słowa lektora, stopki kadrów i podpisy źródeł. Pliki, adresy źródeł
 * i kolejność ujęć z src/data/film.ts (ujęcie N = transcript[N] polskiego filmu). Sam film ma polskiego lektora.
 */
import { filmDoba, type FilmData, type FilmSource } from '@/data/film';

interface BeatEn {
  text: string;
  note?: string;
  /** podpisy źródeł w kolejności z polskiego ujęcia */
  sources?: string[];
  /** strona, na której temat jest opisany szerzej — po angielsku albo z dopiskiem „(in Polish)” */
  more?: FilmSource;
}

const BEATS: BeatEn[] = [
  {
    text: 'This doctor has a full-time job paying PLN 20,000 a month. That is what the payslip shows. But it is only one of three contracts.',
    note: 'The doctor in the film is a model example: he does not exist, but each of his contracts complies with the rules in force. All amounts are gross.',
  },
  {
    text: 'In a second hospital he has a contract. He gets a percentage of every procedure he performs. Over a year that is almost PLN 400,000. On top of that, a civil-law contract: PLN 30,000 a month.',
    note: 'Pay calculated as a percentage of procedures billed to the NFZ is allowed today. The Sejm passed a ban on it on 22 October 2026; the act is awaiting the Senate and the President.',
    sources: ['Sejm, print No. 3157 — progress of work'],
    more: { label: 'Pay limits for health professionals', href: '/en/analysis/medical-pay-limits-act/' },
  },
  {
    text: 'Let’s add up the whole year. The job: 240 thousand. The contract: almost 400. The civil-law contract: 360. Total: PLN 999,999. One złoty short of a million. Formally, he is not a “millionaire”.',
    note: 'PLN 240,000 + 399,999 + 360,000. The percentage of procedures changes every month — on average approx. PLN 33,000.',
  },
  {
    text: 'And nobody sees this total. Each of the three workplaces knows only its own contract.',
  },
  {
    text: 'That was a model example. In a real case in Białystok a doctor received almost PLN 3 million for one year. The hospital explained it by a percentage of procedures.',
    note: 'Pay for 2024 at the Białystok Oncology Centre; the amount was revealed by an audit of the regional government.',
    sources: ['Kurier Poranny'],
    more: { label: 'Record doctor payments', href: '/en/data/record-doctor-payments/' },
  },
  {
    text: 'All of this is legal. And it is paid from the same fund that pays for patients’ treatment. Public hospitals already have PLN 34 billion of debt. A system that cannot see its own costs does not know how much more it can bear.',
    note: 'Liabilities of 562 public hospitals at the end of 2025: SPZOZ PLN 27 bn, companies PLN 4.1 bn, institutes PLN 2.9 bn.',
    sources: ['Rzeczpospolita'],
    more: { label: 'Hospital debt', href: '/en/data/hospital-debt/' },
  },
  {
    text: 'Now time. A day in the job and a duty shift after it make a full 24 hours. In the same 24 hours: a duty shift on the contract and a shift in an ambulance. On each contract he bills 24 hours. 72 in total. In one day. Three in the morning. According to the rosters he is in three places at once. So where will a patient find him?',
    note: 'The job: 7 h 35 min, and a medical duty shift: 16 h 25 min; duty time counts as working time (Article 95 of the Act on medical activity).',
    sources: ['Act on medical activity, consolidated text, Journal of Laws 2026 item 156'],
  },
  {
    text: 'According to reports, a doctor in Braniewo billed exactly such days.',
    note: 'In 2024: 11,577 hours, against 8,760 hours in a year. The investigation concerns the former president of the company running the hospital, not the doctor; it has been suspended, with no charges.',
    sources: ['Interia', 'Dziennik Elbląski', 'District Prosecutor’s Office in Elbląg'],
    more: { label: 'Record doctor payments', href: '/en/data/record-doctor-payments/' },
  },
  {
    text: 'Each of these places sees only its own hours. Nobody sees the whole. 73% of specialist doctors work on civil-law contracts. No register adds up their hours.',
    note: 'Precisely 73.16% of specialists are paid under a B2B contract or a contract of mandate (AOTMiT data).',
    sources: ['Rzeczpospolita, AOTMiT data'],
    more: { label: 'Contract or employment', href: '/en/mechanisms/contract-vs-employment/' },
  },
  {
    text: 'The state already knows who works where. Every year Statistics Poland links the register of doctors with social insurance data and NFZ contracts. Nobody adds up the amounts for one person.',
    sources: ['Statistics Poland (GUS), human resources in medical professions'],
  },
  {
    text: 'The June act allows the minister to ask for these amounts. It does not require them to be published or collected regularly. That is why an amendment is needed.',
    note: 'Act of 19 June 2026: the data are provided “at the minister’s request”, “within the time limit and in the manner indicated by him” (our translation). There is not a word in it about publication.',
    sources: ['Journal of Laws 2026 item 972'],
    more: { label: 'Draft amendment (in Polish)', href: '/postulat/projekt-ustawy/' },
  },
  {
    text: 'It is enough for the amounts of one person to add up in one place. Under a permanent identifier, without a name. One person. One sum. Anonymously. zarobkilekarzy.pl',
    more: { label: 'Our demand', href: '/en/demand/' },
  },
];

if (BEATS.length !== filmDoba.transcript.length) {
  throw new Error(`[film] „Doba” EN ma ${BEATS.length} ujęć, polski ${filmDoba.transcript.length} — popraw src/data/en/film.ts`);
}

export const filmDobaEn: FilmData = {
  ...filmDoba,
  lead: '2 min 37 s, with Polish narration. One doctor, three contracts: PLN 999,999 a year and 72 hours in a single day. The doctor is a model example, and each mechanism is illustrated by a real case.',
  size: '25.4 MB',
  transcript: filmDoba.transcript.map((beat, i) => {
    const en = BEATS[i];
    if ((en.sources?.length ?? 0) !== beat.sources.length) throw new Error(`[film] „Doba” EN, ujęcie ${i + 1}: inna liczba źródeł niż w polskim`);
    return {
      text: en.text,
      note: en.note,
      sources: beat.sources.map((s, j) => ({ label: en.sources![j], href: s.href })),
      more: en.more,
    };
  }),
};
