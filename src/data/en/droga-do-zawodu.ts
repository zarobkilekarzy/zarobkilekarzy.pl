/**
 * Wersja angielska modułu src/data/droga-do-zawodu.ts (strona /en/road-to-the-profession/): czas szkolenia i rachunki z modułów polskich,
 * nazwy dziedzin z src/data/en/wedlug-specjalizacji.ts, tu teksty. Kwoty w tekście z przybliżeniem w euro po kursie NBP z buildu.
 */
import { lengthLabel, roadOf } from '@/components/droga-do-zawodu/road';
import { FIELD_MONTHS, MATURA_RANGE, startRoad, stops as stopsPl, type RoadStop } from '@/data/droga-do-zawodu';
import type { PathLinkEn } from '@/data/en/sciezki';
import { specName } from '@/data/en/wedlug-specjalizacji';
import { FIRST_YEAR, GRADUATES_PL, PES_2025_ALL, pesYear } from '@/data/odsiew-na-medycynie';
import { AT_LEAST_80, CREDIT, ELA_ROWS, OLD_NEW_N, PLAN_TOTAL, TUITION_2026, UJ_LEKARSKI, UW_LEKARSKI } from '@/data/studia-lekarskie';
import { AUTUMN_2025, PRIORITY_FIELDS, RESIDENT_PAY, SPECIALTIES } from '@/data/wedlug-specjalizacji';
import { withEur } from '@/i18n/money';
import { getRates } from '@/i18n/rates';
import { formatEN } from '@/lib/format';

export { MATURA_RANGE, startRoad };

const rates = await getRates();
const pln = (amount: number) => withEur(amount, 'PLN', rates);
const f2 = (n: number) => formatEN(n, 2);

export const pathPage = {
  title: 'The road to the profession',
  docTitle: 'The road to becoming a doctor in Poland',
  eyebrow: 'Path · from the matura to specialist',
  description: 'It takes 11 to 13 years from admission to medical school to the specialist title. Admissions, studies, the LEK with the internship, and specialist training.',
  lead: 'It takes 11 to 13 years from admission to medical school to the specialist title, not counting breaks and waiting for a place. Four stops: admissions, studies, the LEK with the internship, and specialist training.',
};

/* ---------- Dziedziny do wyboru ---------- */

export const fields = [...SPECIALTIES]
  .sort((a, b) => specName(a).localeCompare(specName(b), 'en'))
  .map((s) => {
    const months = FIELD_MONTHS[s.id];
    const pay = s.priority ? RESIDENT_PAY.priority : RESIDENT_PAY.other;
    return {
      id: s.id,
      name: specName(s),
      months,
      length: lengthLabel(months, 'en'),
      priority: s.priority ? 'Priority field: higher resident pay' : 'Not on the list of priority fields',
      payFirst: `PLN ${f2(pay.first)}`,
      payLater: `after two years PLN ${f2(pay.later)}`,
      candidates: typeof s.candidates === 'number' ? f2(s.candidates) : s.candidates === 'below-1' ? 'below 1' : 'not given',
      candidatesNote: typeof s.candidates === 'number' ? 'applicants per place' : s.candidates === 'below-1' ? 'fewer applicants than places' : 'CMKP did not give this figure',
      places: formatEN(s.rez + s.nonRez),
      placesNote: `${formatEN(s.rez)} residency, ${formatEN(s.nonRez)} non-residency`,
      pes: s.pes ? `${formatEN((s.pes.passed / s.pes.n) * 100, 1)}%` : 'not given',
      pesNote: s.pes ? `of ${formatEN(s.pes.n)} attempts` : 'CEM does not publish test results',
      rate: s.rate ? `PLN ${f2(s.rate)}` : 'not given',
      rateNote: s.rate ? 'average per hour, gross' : 'the field is not in the report',
    };
  });

export const startField = fields.find((f) => f.id === startRoad.field)!;
export const startLabels = roadOf(startRoad.matura, startField.months, 'en').labels;

/* ---------- Przystanki ---------- */

const secondYear = (major: string) => formatEN(ELA_ROWS.find((r) => r.major === major)!.secondYear, 1);
const share80 = (subject: string) => AT_LEAST_80.find((r) => r.subject === subject)!.share;
const startedPl = FIRST_YEAR.find((r) => r.year === '2018/19')!.pl.first;
const placesAll = AUTUMN_2025.rez + AUTUMN_2025.nonRez;
const placesTaken = AUTUMN_2025.takenRez + AUTUMN_2025.takenNonRez;
const emptyShare = Math.round(((placesAll - placesTaken) / placesAll) * 100);
const publicFees = TUITION_2026.filter((t) => t.publicSchool).map((t) => t.perYear);
const universities = OLD_NEW_N.old + OLD_NEW_N.new;

const TEXT: Record<string, Omit<RoadStop, 'id' | 'span' | 'sources'> & { sourceLabels: string[] }> = {
  rekrutacja: {
    name: 'The matura and admissions',
    question: 'How to get in',
    length: { label: 'matura in May, studies from October' },
    lead: 'What counts above all is extended-level biology and chemistry in the matura, the school-leaving exam, and at many universities also mathematics or physics. Each university has its own formula, so thresholds can only be compared as a percentage of the maximum score.',
    body: [
      `The admissions limit for 2026/27 is <strong>${formatEN(OLD_NEW_N.allTotal)} places</strong> at ${universities} universities, of which ${formatEN(OLD_NEW_N.allPl)} are full-time studies in Polish. For medicine at the University of Warsaw (UW) there were <strong>${formatEN(UW_LEKARSKI.perPlace, 1)} applications per place</strong> in 2026, and one person can apply for several programmes.`,
      `The threshold is the score of the last person admitted, so it rises when applicants increase and places do not. At the Jagiellonian University (UJ) in 2024–2026 there were ${UJ_LEKARSKI[0].places}, ${UJ_LEKARSKI[1].places} and ${UJ_LEKARSKI[2].places} places, applicants rose from ${formatEN(UJ_LEKARSKI[0].candidates)} to ${formatEN(UJ_LEKARSKI[2].candidates)}, and the threshold rose from ${f2(UJ_LEKARSKI[0].threshold)} to <strong>${f2(UJ_LEKARSKI[2].threshold)} points</strong>. For scale: in 2026, ${share80('biologia')}% of those taking extended-level biology scored at least 80%, and ${share80('chemia')}% in extended-level chemistry.`,
      `Full-time studies in Polish at public universities are free. A year of part-time studies at the public universities whose price lists we checked costs from <strong>${pln(Math.min(...publicFees))} to ${pln(Math.max(...publicFees))}</strong>. The medical studies loan is at most ${pln(CREDIT.perSemester)} per semester, less than the fees at most universities.`,
    ],
    sourceLabels: ['Dz.U. 2026 item 1167', 'UW, applicants per place', 'UJ, admissions summary', 'Central Examination Board (CKE), percentiles 2026', 'list of university price lists', 'M.P. 2026 item 424', 'Ministry of Health, parliamentary question 18621'],
    unknown: `Thresholds were published by 14 of the ${universities} universities; the others show results only to candidates in their accounts. Nor is it known how much the state spends on a student in free studies: according to the Ministry of Health, it “is not possible to separate out the funds” for this programme within the subsidy for universities (our translation).`,
    figure: { value: formatEN(UW_LEKARSKI.perPlace, 1), unit: 'applications per place for medicine at UW in 2026' },
  },
  studia: {
    name: 'Six years of studies',
    question: 'What the studies involve',
    length: { label: '6 years' },
    lead: `The programme lasts 12 semesters and has at least ${formatEN(5700)} hours of classes. At the Medical University of Warsaw (WUM), the 2026/27 cohort has ${formatEN(PLAN_TOTAL.hours)} hours and ${PLAN_TOTAL.exams} exams in its plan. The first years are basic sciences, clinical subjects dominate from the fourth year, and the sixth is practice on the wards.`,
    body: [
      `<strong>${secondYear('Kierunek lekarski')}%</strong> of medical students move on to the second year on time, ${secondYear('Prawo')}% in law and ${secondYear('Matematyka')}% in mathematics (2016–2018 cohorts, the same measure for all programmes).`,
      `Of Poles who start medicine, about <strong>80%</strong> finish on time: ${formatEN(GRADUATES_PL['2023/24'])} graduates in 2023/24 against ${formatEN(startedPl)} first-semester students in 2018/19. Most drop out in the first year.`,
      'Most anatomy hours are exercises in the dissection room. Since 2025/26, regulations have allowed <strong>5% to 15%</strong> of exercises in the morphological sciences to take place in simulated conditions, for example on a virtual dissection table.',
    ],
    sourceLabels: ['Dz.U. 2021 item 755', 'WUM, study programme', 'ELA, source data', 'Ministry of Health, students and graduates', 'WUM, guide for first-year students', 'Dz.U. 2025 item 1133', 'Act on Higher Education and Science, art. 344'],
    unknown: 'Why students drop out. The POL-on system stores the date of removal from the student list but not the reason, which appears only in the university’s decision.',
    figure: { value: formatEN(5700), unit: 'hours of classes is the minimum for 12 semesters' },
  },
  staz: {
    name: 'The LEK and the internship',
    question: 'What comes after the diploma',
    length: { label: '13 months' },
    lead: 'A diploma does not yet give the full licence to practise (PWZ). A graduate first gets it only for the postgraduate internship, and in full after the internship and after passing the Medical Final Examination (LEK).',
    body: [
      'The LEK has <strong>200 test questions</strong>, and the pass mark is <strong>56%</strong> correct answers. On a first attempt, 96.0% passed in autumn 2025 and <strong>87.1%</strong> in autumn 2026. The result also matters later, because it is mainly what sets the order in the ranking for specialist training. That is why some doctors sit it again even though they have already passed.',
      `The internship lasts <strong>13 months</strong>. The fixed part is internal medicine (11 weeks), paediatrics and surgery (8 each), family medicine (6), emergency medicine (3) and intensive care (2), and for 10 weeks the intern trains in a field of their own choice. Since 1 July 2026 the basic pay has been <strong>${pln(8458.38)}</strong> gross per month.`,
      'The Ministry of Health has prepared a bill that shortens the internship to six months, and the Supreme Medical Council (NRL) opposes it. For now it is only a bill: the government’s legislative agenda plans its adoption for the fourth quarter of 2026.',
    ],
    sourceLabels: ['Act on the professions of physician and dentist, Dz.U. 2026 item 37', 'Medical Examinations Centre (CEM), LEK results', 'Dz.U. 2023 item 377', 'Ministry of Health, intern pay', 'bill UD384', 'NRL, position 3/26/X'],
    unknown: 'Why fewer people passed on a first attempt in autumn 2026 than a year earlier. CEM does not give a reason for the drop.',
    figure: { value: '87.1', suffix: '%', unit: 'passed the LEK on a first attempt in autumn 2026' },
  },
  specjalizacja: {
    name: 'Specialist training',
    question: 'What to become and how long it takes',
    length: { label: startLabels.specLen, key: 'specLen' },
    lead: 'After the internship and the LEK, a doctor can treat patients independently. To become a surgeon, paediatrician or family doctor, they still need specialist training: four to six years of work under a programme, ending with the State Specialisation Examination (PES).',
    body: [
      `The regulation lists <strong>77 specialties</strong>, and 69 of them can be started straight after the internship. Residencies are awarded and funded by the Minister of Health: since 1 July 2026 the basic pay has been <strong>${pln(RESIDENT_PAY.other.first)}</strong> gross per month, and ${pln(RESIDENT_PAY.priority.first)} in the ${PRIORITY_FIELDS.length} priority fields. Non-residency places are the remaining free places in facilities authorised to train. They do not come with pay from the minister’s pool.`,
      'There is no entrance exam. Applications are filed twice a year and can name up to 15 variants, that is, combinations of field, province and mode. When there are more applicants than places, the order is set by a ranking in which the LEK result counts above all.',
      `Overall there are more places than applicants. In autumn 2025 there were ${formatEN(placesAll)}, acceptance was confirmed by ${formatEN(placesTaken)} doctors and dentists, so <strong>${emptyShare}%</strong> stayed empty. In individual fields the opposite can happen: in plastic surgery there were 7.47 applicants per place.`,
      `The PES is a test of 120 questions, passed from 60%, and an oral exam, from which a test score of at least 75% exempts you. In 2025, <strong>${formatEN(pesYear(PES_2025_ALL).rate, 1)}%</strong> of test attempts were passed, and 89.5% among those taking it for the first time.`,
    ],
    sourceLabels: ['Dz.U. 2023 item 975', 'Dz.U. 2026 item 856', 'Act on the professions of physician and dentist, Dz.U. 2026 item 37', 'CMKP, results of autumn 2025', 'summary by the CMKP director, via beautyrazem.pl', 'CEM, PES test results', 'Ministry of Health, parliamentary question 31481'],
    unknown: 'How many doctors finish specialist training each year. The Ministry of Health does not say, because many extend their training, and as an approximation it points to the number who passed the PES. CEM does not publish results of the oral part, so only the pass rate of the test is known.',
    figure: { value: String(emptyShare), suffix: '%', unit: 'of specialist training places stayed empty in autumn 2025' },
  },
};

/** Adres w źródłach: polska analiza z cennikami ma odpowiednik po angielsku. */
const sourceHref = (href: string) => (href.startsWith('/analizy/studia-lekarskie/') ? '/en/analysis/medical-studies-in-poland/#what-medical-studies-cost' : href);

export const stops: RoadStop[] = stopsPl.map((stop) => {
  const { sourceLabels, ...text } = TEXT[stop.id];
  if (sourceLabels.length !== stop.sources.length) throw new Error(`[en] ${stop.id}: inna liczba źródeł niż po polsku`);
  return { ...stop, ...text, sources: stop.sources.map((s, i) => ({ label: sourceLabels[i], href: sourceHref(s.href) })) };
});

const TEXTS = 'Texts at this stop';
const studies = 'studia-lekarskie';

export const links: Record<string, { label: string; items: PathLinkEn[] }[]> = {
  rekrutacja: [{
    label: TEXTS,
    items: [
      { ref: studies },
      { ref: studies, anchor: '#old-and-new-universities', label: 'Old and new universities', text: `Since 2015/16, another ${OLD_NEW_N.new} universities have received a limit. The new ones are usually small, and the thresholds do not show a divide between old and new.` },
      { ref: studies, anchor: '#what-medical-studies-cost', label: 'What medical studies cost', text: 'Which studies you pay for, what a year costs at public and non-public universities, and when the medical studies loan is written off.' },
      { ref: studies, anchor: '#compared-with-other-demanding-programmes', label: 'Compared with other demanding programmes', text: 'Thresholds, applicants and dropout on the same measures: law, psychology, architecture, mathematics, physics and computer science.' },
    ],
  }],
  studia: [{
    label: TEXTS,
    items: [
      { ref: studies, anchor: '#six-years-subjects-and-exams', label: 'Six years: subjects and exams', text: 'Basic and clinical sciences, exam sittings, conditional progression and classes with patients.' },
      { ref: 'odsiew-na-medycynie' },
      { ref: studies, anchor: '#anatomy-and-the-dissection-room', label: 'Anatomy and the dissection room', text: 'How many hours anatomy takes, what the practical exam looks like, where universities get bodies for teaching, plus a model of bones and vessels to explore.' },
      { ref: studies, anchor: '#virtual-tables-headsets-and-3d-printing', label: 'Virtual tables, headsets and 3D printing', text: 'What may be taught in simulated conditions since 2025/26 and what stays in the dissection room.' },
      { ref: studies, anchor: '#more-students-and-the-quality-of-training', label: 'More students and the quality of training', text: 'What the medical self-government says about the growth in student numbers, who can launch a programme and what can be measured today.' },
    ],
  }],
  staz: [{
    label: TEXTS,
    items: [
      { ref: 'egzamin-lek', polish: true, label: 'LEK exam: test yourself', text: 'A simulator based on the public CEM question bank: 200 questions, 4 hours, a 56% pass mark. After each answer you see how other candidates answered.' },
      { ref: studies, anchor: '#after-graduation-the-lek-and-the-internship', label: 'After graduation: the LEK and the internship', text: 'How the LEK compares with exams for other professions, who is sent to which hospital for the internship and what the bill shortening it would change.' },
      { ref: 'odsiew-na-medycynie', anchor: '#from-a-university-place-to-a-licence-to-practise', label: 'From a university place to a licence to practise', text: 'The calculation step by step: about 55% of the places in the limit lead to a licence to practise, and most of the difference is places in a foreign language and for foreigners.' },
    ],
  }],
  specjalizacja: [{
    label: TEXTS,
    items: [
      { ref: 'specjalizacja-lekarska' },
      { ref: 'wedlug-specjalizacji' },
      { ref: studies, anchor: '#specialist-training', label: 'Specialist training: modules, modes and the ranking', text: 'How the basic module works, how a residency differs from a non-residency place and how the ranking is calculated.' },
      { ref: 'dlaczego-brakuje-lekarzy', anchor: '#specialist-training-places-more-empty-than-filled', label: 'Specialist training places: more empty than filled', text: 'Why there are doctors who did not qualify anywhere alongside empty places, and what the Supreme Audit Office found about the award of residencies.' },
      { ref: 'reglamentacja-dostepu', anchor: '#specialisation-three-limits-on-one-place', label: 'Specialisation: three limits on one place', text: 'The pool of residencies, accreditation of the facility and the limit of doctors per supervisor: who sets each of them.' },
    ],
  }],
};

export const after = [
  {
    title: 'Who decides how many people take this road',
    lead: 'Admissions limits, their history and what a change in intake does to the number of doctors years later.',
    items: [
      { ref: 'reglamentacja-dostepu' },
      { ref: 'ciecie-limitow-na-medycyne' },
      { ref: 'dlaczego-brakuje-lekarzy' },
      { ref: 'symulator-podazy-lekarzy', polish: true, label: 'Doctor supply simulator 1987–2050', text: 'Change the admissions limits and see how many doctors will be practising in 10, 20 and 30 years.' },
    ] as PathLinkEn[],
  },
  {
    title: 'Other ways into the profession',
    lead: 'A diploma from outside the European Union and a separate, paid pool of studies in a foreign language.',
    items: [{ ref: 'lekarze-ze-wschodu' }, { ref: 'english-division' }] as PathLinkEn[],
  },
  {
    title: 'After the specialist title',
    lead: 'What the money looks like after training and who holds doctors to account for errors.',
    items: [
      { label: 'How much we pay, and for what', href: '/en/how-much-we-pay/', text: 'From the health contribution to a doctor’s pay: who can see which amounts and where the money trail ends.' },
      { ref: 'odpowiedzialnosc-zawodowa-lekarzy' },
      { ref: 'jak-dzialaja-sady-lekarskie' },
    ] as PathLinkEn[],
  },
];
