/**
 * Wersja angielska src/data/prawa-pacjenta.ts (strony /en/patient-rights/, /en/patient-rights/print/
 * i PDF-y /en/patient-rights/{card,large-print}.pdf). Te same eksporty i typy, ta sama kolejność.
 * Liczby, stawki i adresy bierzemy z modułu polskiego; kwoty wpisane w polski tekst są przepisane
 * dokładnie, a strażniki niżej zatrzymują build, gdy polski moduł zmieni liczbę, kwartał albo listę.
 *
 * Decyzje tłumaczenia:
 * - podstawy prawne zostają w polskim zapisie („art. 35 ust. 4”, „k.c.”), bo pacjent pokazuje je
 *   personelowi; skróty objaśnia nota na górze strony (translationNote);
 * - nazwy instytucji po angielsku z polską nazwą przy pierwszym użyciu — pacjent musi ją znaleźć;
 * - kwoty tylko w złotych (PLN), bez euro: wszystkie płaci się w złotych i prawie wszystkie stoją
 *   w tabelach, na karcie lub w PDF;
 * - kotwice po angielsku (strona EN jest nowa); polskie kotwice strony PL bez zmian.
 */
import type { CardContent, CompareRow, Deadline, Entry, PdfText, RightsGroup, Route } from '@/lib/pacjent/types';
import type { Source } from '@/types';
import * as PL from '@/data/prawa-pacjenta';
import { formatEN } from '@/lib/format';

type Pl = typeof import('@/data/prawa-pacjenta');

export const ACT: Pl['ACT'] = {
  name: 'Act on Patient Rights and the Patient Ombudsman',
  citation: PL.ACT.citation,
  url: PL.ACT.url,
};

export const page: Pl['page'] = {
  title: 'Patient rights in Poland',
  docTitle: 'Patient rights in Poland: what you are entitled to and where to report it',
  seoTitle: 'Patient rights in Poland, explained',
  description:
    'Patient rights in Poland in plain language: information, consent, pain, medical records, deadlines and where to report a violation. Each answer cites the act.',
  lead: 'What you are entitled to at the doctor’s and in hospital, how much time you have when something goes wrong, and where to take it. In plain language, with the article of the act next to every answer — so that you can show it.',
  checked: PL.page.checked,
  disclaimer:
    'This is not legal advice. We have collected what follows directly from the acts and from the official websites of public authorities, with links to the sources. For your own case, call the free helpline — it is answered by people who do this professionally.',
};

/** Nota pod nagłówkiem strony EN i w PDF (tylko wersja angielska). */
export const translationNote = {
  title: 'Translation for information only.',
  text: 'Only the Polish texts of the legal acts are legally binding. Legal references keep their Polish form so that you can show them to staff: art. = article, ust. = paragraph, pkt = point, § = section, k.c. = Civil Code, k.k. = Criminal Code, Dz.U. … poz. = Journal of Laws … item.',
};

// ---------------------------------------------------------------------------
// Telefony
// ---------------------------------------------------------------------------

export const helpline: Pl['helpline'] = {
  // numer z prefiksem kraju: czytelnik EN często dzwoni z zagranicznego telefonu (112 zostaje bez prefiksu)
  phone: { ...PL.helpline.phone, display: `+48 ${PL.helpline.phone.display}` },
  name: 'Patient Information Line (Telefoniczna Informacja Pacjenta)',
  hours: 'Free of charge, 24 hours a day, 7 days a week',
  who: 'Joint helpline of the Patient Ombudsman (Rzecznik Praw Pacjenta) and the National Health Fund (NFZ): patient rights, complaints, access to treatment, compensation benefit.',
  abroad:
    'The free 800 number works only from Polish phone numbers. From abroad — or if 800 numbers are blocked on your phone — the official sources give two paid numbers (standard operator rates): the Patient Ombudsman (RPP) — +48 22 688 05 00, the NFZ — +48 22 125 66 00. If one does not answer, try the other.',
};

export const emergency: Pl['emergency'] = {
  phone: PL.emergency.phone,
  text: 'Life in danger? Call 112. The patient helpline does not send an ambulance.',
};

// ---------------------------------------------------------------------------
// Wejścia „W jakiej jesteś sytuacji?”
// ---------------------------------------------------------------------------

export const entries: Entry[] = [
  { href: '#now', icon: 'pin', title: 'I am at the doctor’s or in hospital', text: 'Information, consent, pain, someone close to you at your side, a second opinion.' },
  { href: '#documents', icon: 'doc', title: 'I need my medical records', text: 'The first copy is free, how long records are kept, who may see them.' },
  { href: '#what-happened', icon: 'alert', title: 'Something went wrong', text: 'Where to report it, how much time you have and what it costs.' },
  { href: '#fund', icon: 'shield', title: 'Harm suffered in hospital', text: 'The Fund or the court — read this before you sign anything.' },
];

// ---------------------------------------------------------------------------
// Stawki za kopie dokumentacji (art. 28 ust. 4) — kwota i źródło z modułu polskiego
// ---------------------------------------------------------------------------

/** Kwartał opisany po angielsku — strażnik niżej pilnuje, że to ten sam co w module polskim. */
const DOC_FEES_PERIOD = { pl: 'od 1 września do 30 listopada 2026 r.', en: 'from 1 September to 30 November 2026' };

export const DOC_FEES: Pl['DOC_FEES'] = {
  wage: PL.DOC_FEES.wage,
  period: DOC_FEES_PERIOD.en,
  source: {
    ...PL.DOC_FEES.source,
    publisher: 'Statistics Poland (GUS)',
    title: `${PL.DOC_FEES.source.title} (“Announcement of the President of GUS on the average wage in the second quarter of 2026”, in Polish)`,
  },
};
const fee = (share: number) => `PLN ${formatEN(Math.round(DOC_FEES.wage * share * 100) / 100, 2)}`;

// ---------------------------------------------------------------------------
// Świadczenie kompensacyjne — kwoty przepisane z modułu polskiego (strażnik porównuje cyfry)
// ---------------------------------------------------------------------------

export const FUND: Pl['FUND'] = {
  since: 'from 6 September 2026',
  patient: { min: 'PLN 2,393', max: 'PLN 239,131' },
  relative: { min: 'PLN 23,914', max: 'PLN 119,566' },
  fee: 'PLN 361',
  appealFee: 'PLN 241',
};

// ---------------------------------------------------------------------------
// Prawa jako pytania
// ---------------------------------------------------------------------------

export const rightsGroups: RightsGroup[] = [
  {
    id: 'now',
    eyebrow: 'Right now, on the spot',
    title: 'At the doctor’s and in hospital',
    lead: 'The starting point: you have the right to treatment in line with current medical knowledge, provided with due diligence (art. 6 ust. 1, art. 8). You can use the rights below straight away. Each comes with a sentence you can say calmly, and the article of the act — in case someone asks for the legal basis.',
    items: [
      {
        id: 'information',
        q: 'The doctor’s explanation is hard to follow. Can I ask more?',
        verdict: 'Yes',
        short: 'You have the right to information you can understand: about the diagnosis, possible methods of treatment, their consequences and the prognosis.',
        more: [
          'The act speaks of **accessible** information — clear to you, not just correct in the medical records. It covers your state of health, the diagnosis, the proposed and possible methods of diagnosis and treatment, the foreseeable consequences of using them or not using them, the results of treatment and the prognosis.',
          'A person who has turned 16 receives this information themselves. It also works the other way: you can ask not to be told about certain matters (art. 9 ust. 4).',
        ],
        say: 'Please explain this to me more simply. What are the other options, and what will happen if I do not start treatment?',
        basis: 'art. 9',
        card: 'Information about your health, treatment and prognosis — in a form you understand.',
      },
      {
        id: 'consent',
        q: 'Do I have to agree to a procedure?',
        verdict: 'No',
        short: 'The decision is yours — once you have received full information. For surgery and for higher-risk procedures, consent must be given in writing.',
        more: [
          'Consent without information is not real consent. That is why the doctor explains first (art. 9), and then you decide: you agree or you refuse (art. 16).',
          'Consent to surgery and to a method of treatment or diagnosis involving increased risk is given in writing (art. 18). A person who has turned 16 gives their own consent — alongside the consent of a parent or guardian (art. 17).',
        ],
        say: 'Before I sign, please tell me what the risk is and what the other options are.',
        basis: 'art. 16–18',
        card: 'Consent or refusal after being informed. Surgery — consent in writing.',
      },
      {
        id: 'second-opinion',
        q: 'Can I ask for a second opinion?',
        verdict: 'Yes',
        short: 'You can demand a consultation with another doctor or a panel of doctors (konsylium). The doctor may refuse, but must record the refusal in your medical records.',
        more: [
          'The doctor may consider the request unjustified. In that case they must note the refusal in the medical records. That entry matters: a “no” said in the consulting room stays on paper and can be checked later.',
          'The same applies to nurses and midwives: you can demand that they seek the opinion of another nurse or midwife, and a refusal also goes into the records (art. 6 ust. 3 pkt 2 and ust. 6).',
        ],
        say: 'I would like a consultation with another doctor. If that is not possible, please record the refusal in my medical records.',
        basis: 'art. 6 ust. 3–5',
        card: 'A second opinion or a panel of doctors. A refusal must go into your records.',
      },
      {
        id: 'pain',
        q: 'I am in pain. Is pain relief my right?',
        verdict: 'Yes',
        short: 'Yes, it is written into the act. The facility must assess how severe the pain is, treat it and check whether the treatment works.',
        more: [
          'These are three separate duties: to determine how intense the pain is, to treat it and to monitor how effective the treatment is. Giving a medicine without measuring the pain and without checking whether it helped is not enough.',
        ],
        say: 'The pain is not getting any better. Please assess the pain and change the treatment.',
        basis: 'art. 20a',
        card: 'Pain relief: assessment, treatment and checking whether it works.',
      },
      {
        id: 'someone-with-you',
        q: 'Can someone close to me be with me?',
        verdict: 'Yes',
        short: 'At your request — including during an examination. A refusal is allowed for only two reasons and must be recorded in your medical records.',
        more: [
          'Staff may refuse only where there is a risk of an epidemic threat or where the patient’s health and safety require it. “That is our policy” is neither of these reasons.',
          'This right concerns being present during an examination or procedure. Care by someone close to you during a hospital stay is a separate right — [we describe it below](#care-by-someone-close).',
        ],
        say: 'I want this person to be with me. If that is not possible, please record the reason for the refusal in my medical records.',
        basis: 'art. 21',
        card: 'Someone close to you being present. A refusal only because of an epidemic or for safety.',
      },
      {
        id: 'dignity',
        q: 'There are students or other people at my examination. Do I have to agree?',
        verdict: 'No',
        short: 'You have the right to respect for your privacy and dignity. People who are not providing your care — students, for example — may be present only with your consent.',
        more: [
          'Everyone practising a medical profession must act in a way that respects your privacy and dignity (art. 20 ust. 1, art. 22 ust. 1). Other medical staff take part in an examination only when this is necessary because of the type of service or for supervisory purposes. The presence of anyone else requires your consent (art. 22 ust. 2). For a child, consent is given by the statutory representative.',
          'People present with your consent are also bound by confidentiality (art. 22 ust. 3). The right to dignity also includes the right to die in peace and with dignity (art. 20 ust. 2).',
          'For a culpable violation of this right, a court may award compensation for the harm suffered (art. 4) — [more under reporting violations](#rights-violated).',
        ],
        say: 'I do not consent to other people being present during the examination.',
        basis: 'art. 20, 22',
        card: 'Dignity and privacy. Students at an examination — only with your consent.',
      },
      {
        id: 'care-by-someone-close',
        q: 'Can someone close to me look after me in hospital?',
        verdict: 'Yes',
        short: 'You have the right to additional nursing care: someone close to you can look after you in hospital. This means care, not treatment — treatment is provided by the staff.',
        more: [
          'The act defines additional nursing care as care that does not consist in providing healthcare services. It explicitly mentions care of a child, of a person with a severe degree of disability, and of a woman during pregnancy, childbirth and the postnatal period (art. 34 ust. 1–2).',
          'The hospital may charge for this, but only up to its **actual costs**. The amount of the charge and how it is calculated must be public and available in the hospital (art. 35 ust. 1–3). A parent’s stay with a child is free of charge — [see below](#parent-with-child).',
          'The head of the facility may restrict this right in the event of an epidemic threat or for the health and safety of patients (art. 5).',
        ],
        say: 'I want this person to look after me. If there is a charge, please show me how much it is and how it was calculated.',
        basis: 'art. 34–35',
      },
      {
        id: 'parent-with-child',
        q: 'The hospital wants to charge me for staying with my child. Is it allowed to?',
        verdict: 'No',
        short: 'The hospital may not charge for a parent or carer staying with a child or with a person with a severe degree of disability.',
        more: [
          'As a rule, the patient pays for additional nursing care (art. 35 ust. 1). However, the act expressly exempts from the charge the stay of a statutory representative or de facto carer with a patient who is a minor or has a certificate of a severe degree of disability (art. 35 ust. 4 in conjunction with art. 34 ust. 3).',
          'This is one of the most frequently broken provisions. If the hospital charges you, report it to the [Patient Ombudsman](#rights-violated).',
        ],
        say: 'Art. 35 ust. 4 of the Act on Patient Rights exempts a parent’s stay with a child from charges. Please do not charge me.',
        basis: 'art. 35 ust. 4',
      },
      {
        id: 'emergency',
        q: 'It is an emergency. Do I have to wait in the queue?',
        verdict: 'No',
        short: 'If your health or life is in danger, you have the right to immediate help — regardless of queues and referrals.',
        more: [
          'This right applies regardless of waiting lists. Separately, the act guarantees a woman in labour the right to services related to childbirth (art. 7 ust. 2).',
          'When a life is in danger, do not look for legal provisions — call **112**.',
        ],
        basis: 'art. 7',
        card: 'Immediate help when your life is in danger — without queuing.',
      },
    ],
    also: {
      title: 'Other rights in brief',
      items: [
        { text: 'When there are not enough services for everyone — a transparent, objective procedure for setting the order, based on medical criteria.', basis: 'art. 6 ust. 2' },
        { text: 'Written information on patient rights, displayed in the facility in a publicly accessible place. If you cannot move about — brought to your room.', basis: 'art. 11' },
        { text: 'Advance notice when the doctor intends to stop treating you, and an indication of where you can continue treatment.', basis: 'art. 10' },
        { text: 'Information given in an understandable way to a person with special needs, including with the help of communication aids.', basis: 'art. 12 ust. 2' },
        { text: 'In hospital — contact with other people in person, by phone and by post, as well as the right to refuse contact. The facility may also restrict visits for organisational reasons.', basis: 'art. 33, art. 5' },
        { text: 'In hospital — pastoral care. If your health deteriorates or your life is in danger, the hospital must make it possible to contact a minister of your religion.', basis: 'art. 36–37' },
        { text: 'In hospital — safekeeping of valuables in a deposit, at the hospital’s expense.', basis: 'art. 39' },
      ],
    },
  },
  {
    id: 'documents',
    eyebrow: 'Documents and data',
    title: 'Your medical records',
    lead: 'Your medical records are your most important evidence. It is worth knowing how to get them, how long the facility keeps them and who else may see them.',
    items: [
      {
        id: 'copy-of-records',
        q: 'How much does a copy of my medical records cost?',
        verdict: 'PLN 0',
        short: 'The first copy in a given scope is free of charge. For further copies the facility may charge a fee, but only up to the statutory limit.',
        more: [
          'The facility does not charge a fee when it makes the records available to the patient or their statutory representative **for the first time in the requested scope** (art. 28 ust. 2a pkt 1). Reception staff rarely mention this.',
          'For further copies of the same scope a fee is allowed, but the act sets an upper limit (art. 28 ust. 4). The limits are calculated from the average wage in the previous quarter, so they change every quarter.',
        ],
        table: {
          caption: `Maximum fees allowed ${DOC_FEES.period}`,
          rows: [
            { label: 'Page of a copy or printout', value: fee(0.00007) },
            { label: 'Page of an extract or transcript', value: fee(0.002) },
            { label: 'All of it on a disc or USB stick', value: fee(0.0004) },
          ],
          note: `Calculated from the average wage in the second quarter of 2026 (PLN ${formatEN(DOC_FEES.wage, 2)}, Statistics Poland (GUS) announcement).`,
        },
        say: 'I would like a copy of my medical records. This is the first time they are being made available in this scope, so there is no charge.',
        basis: 'art. 28',
      },
      {
        id: 'record-retention',
        q: 'How long does the facility keep my medical records?',
        verdict: '20 years',
        short: 'Usually 20 years from the end of the year in which the last entry was made. But do not wait — your own deadlines for taking action are much shorter.',
        more: [
          'Exceptions: **30 years** if death resulted from bodily injury or poisoning; **22 years** for the records of children up to the age of 2; **10 years** for X-ray images stored outside the medical records.',
          'If you are considering any steps, ask for a copy straight away. It is the only evidence, and [your deadlines](#deadlines) are counted in days, months and years — not decades.',
        ],
        basis: 'art. 29',
      },
      {
        id: 'confidentiality',
        q: 'Can the doctor tell my family about my illness?',
        verdict: 'No',
        short: 'Not without your consent. You decide, in your medical records, who may receive information — and you can change this at any time.',
        more: [
          'Staff must keep information about you confidential, including information about your state of health (art. 13). Confidentiality continues after the patient’s death (art. 14).',
          'The authorisation is usually filled in once, on admission, and is then easy to forget. It is worth checking who has been named there.',
        ],
        say: 'Who is named in my records as an authorised person? I want to change it.',
        basis: 'art. 13–14',
        card: 'Confidentiality about your health — you decide who may know.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Coś poszło nie tak
// ---------------------------------------------------------------------------

export const firstSteps: Pl['firstSteps'] = [
  { title: 'Ask for a copy of your medical records', text: 'The first one is free, and it is your main evidence. [How to ask for it](#copy-of-records).' },
  { title: 'Write down what happened', text: 'Date, time, place, who was present, what was said. While you still remember the details.' },
  { title: 'Keep the paperwork', text: 'Receipts, invoices, referrals, discharge summaries, test results. Where you were charged, they are the evidence.' },
  { title: 'Check the deadline and the right address', text: 'Institutions do not pass cases on to each other — a report sent to the wrong address is lost. [Deadlines](#deadlines).' },
];

export const routesNote =
  'The routes do not exclude each other. A complaint to the medical self-government can lead to the doctor being penalised, but it will not get you any money. The Patient Ombudsman will deal with a violation of your rights, but will not award damages. One important link: accepting a benefit from the Fund closes the route to court.';

export const routes: Route[] = [
  {
    id: 'rights-violated',
    situation: 'My rights were not respected',
    examples: 'I was refused information or my records, told to pay for staying with my child, or not treated with respect and privacy.',
    to: 'Patient Ombudsman (Rzecznik Praw Pacjenta)',
    facts: [
      { label: 'How', text: 'By phone, by e-mail (kancelaria@rpp.gov.pl), via the ePUAP e-government platform (/RzPP/skrytka) or by post: ul. Płocka 11/13, 01-231 Warszawa.' },
      { label: 'Cost', text: 'Free of charge — an application to the Ombudsman is exempt from fees (art. 50 ust. 2).' },
      { label: 'On site', text: 'If the facility has a patient rights representative (pełnomocnik do spraw praw pacjenta), you can start there — they take part in handling complaints (art. 40a). However, they report to the head of the facility, so they are not independent in the way the Ombudsman is.' },
      { label: 'Money', text: 'The Ombudsman will not award you money. For a culpable violation of patient rights — for example of dignity, confidentiality or the right to information — a court may award compensation for the harm suffered (art. 4 in conjunction with art. 448 of the Civil Code). This is a different legal basis from damages for harm to health.' },
    ],
    actions: [
      { label: '+48 800 190 590', href: 'tel:+48800190590', icon: 'phone' },
      { label: 'From abroad: +48 22 688 05 00', href: 'tel:+48226880500', icon: 'phone', extra: true },
      { label: 'kancelaria@rpp.gov.pl', href: 'mailto:kancelaria@rpp.gov.pl', icon: 'mail' },
    ],
    card: { situation: 'Your patient rights were violated', contact: 'Patient Ombudsman (RPP) · +48 800 190 590 · kancelaria@rpp.gov.pl' },
  },
  {
    id: 'charged-for-nfz-care',
    situation: 'I was told to pay for treatment funded by the NFZ',
    examples: 'Or I was refused an appointment, the tests ordered were not done, or something does not add up in the billing.',
    to: 'Regional branch of the NFZ (oddział wojewódzki NFZ)',
    facts: [
      { label: 'How', text: 'The form at skargi-i-wnioski.nfz.gov.pl (in Polish), in person at the branch, by post or via ePUAP.' },
      { label: 'Deadline', text: 'The NFZ replies within 30 days. If it asks you to supply missing information, you have **7 days** — otherwise the case will not be considered.', urgent: true },
      { label: 'Cost', text: 'Free of charge.' },
      { label: 'Good to know', text: 'Keep the receipt or invoice — it is your evidence. It also happens the other way round: you pay privately, and the facility also bills the NFZ for the same service. You can see this in your Internet Patient Account (IKP).' },
    ],
    actions: [{ label: 'NFZ complaint form (in Polish)', href: 'https://skargi-i-wnioski.nfz.gov.pl/' }],
    card: { situation: 'Told to pay for treatment funded by the NFZ', contact: 'NFZ branch · skargi-i-wnioski.nfz.gov.pl' },
  },
  {
    id: 'ikp',
    situation: 'My IKP shows a visit that never happened',
    examples: 'Or a facility I have never been to, or a service I paid for privately but which was billed to the NFZ.',
    to: 'A report in the Internet Patient Account (Internetowe Konto Pacjenta, IKP)',
    facts: [
      { label: 'How', text: 'pacjent.gov.pl → Historia leczenia (Treatment history) → Historia wizyt (Visit history) → Szczegóły (Details) → “Zgłoś nieprawidłowość” (Report an irregularity). It takes a few minutes.' },
      { label: 'What next', text: 'The report goes to the NFZ branch, which looks into the matter. Do not report the same thing twice — it only delays the investigation.' },
      { label: 'Cost', text: 'Free of charge.' },
      { label: 'Good to know', text: 'In 2024 patients reported almost 3.5 thousand such services, and the NFZ found more than 1.6 thousand of the reports justified. You are the only person outside the facility–NFZ relationship who can notice this.' },
    ],
    actions: [
      { label: 'Step-by-step instructions', href: '/en/mechanisms/visits-that-never-happened/#check-your-ikp-instructions', icon: 'arrow' },
      { label: 'pacjent.gov.pl (in Polish)', href: 'https://pacjent.gov.pl/' },
    ],
    card: { situation: 'You see a visit that never happened', contact: 'IKP · pacjent.gov.pl › Historia leczenia › Zgłoś nieprawidłowość' },
  },
  {
    id: 'doctors-ruling',
    situation: 'I disagree with a doctor’s ruling',
    examples: 'When a doctor’s opinion or ruling (orzeczenie) affects your rights or obligations under the law.',
    to: 'Medical Commission at the Patient Ombudsman (Komisja Lekarska przy Rzeczniku Praw Pacjenta)',
    facts: [
      { label: 'Deadline', text: '**30 days** from the date the opinion or ruling is issued. The deadline is strict.', urgent: true },
      { label: 'How', text: 'You file the objection through the Ombudsman, not directly with the Commission. It must give reasons and indicate the provision from which your rights or obligations arise — without this it will be returned to you.' },
      { label: 'What next', text: 'The Commission rules within 30 days. There is no appeal against its decision, so you get one attempt — prepare it carefully (art. 31).' },
    ],
    actions: [{ label: '+48 800 190 590', href: 'tel:+48800190590', icon: 'phone' }],
  },
  {
    id: 'harm',
    situation: 'Treatment harmed me. I want compensation',
    examples: 'An infection, bodily injury, a health disorder or the death of someone close to you.',
    to: 'Compensation Fund at the Patient Ombudsman (Fundusz Kompensacyjny przy RPP) or a civil court',
    facts: [
      { label: 'Harm in hospital', text: 'For an event on or after 6 September 2023 you can choose the Fund: faster, without court and without proving fault, but with an upper limit on the amount.' },
      { label: 'Any other situation', text: 'A civil court — damages and compensation for harm suffered, without a statutory limit.' },
      { label: 'Deadline', text: 'Fund: one year from learning of the harm, at the latest 3 years from the event. Court: 3 years from learning of the harm and of who is responsible for it.', urgent: true },
    ],
    actions: [{ label: 'Compare the Fund and the court', href: '#fund', icon: 'arrow' }],
  },
  {
    id: 'doctors-error',
    situation: 'A doctor made a mistake or behaved unethically',
    examples: 'You want the medical self-government to take up the case and assess the doctor’s conduct.',
    to: 'Regional disciplinary prosecutor (okręgowy rzecznik odpowiedzialności zawodowej) at the medical chamber',
    facts: [
      { label: 'How', text: 'To the regional disciplinary prosecutor of the medical chamber the doctor belongs to: your details, the date and place of the event, a description and the doctor’s details.' },
      { label: 'Deadline', text: 'Proceedings cannot be opened after **3 years** from the act (art. 64 ust. 1 of the Act on Medical Chambers) — file your complaint earlier so that the prosecutor has time.', urgent: true },
      { label: 'Good to know', text: 'These are disciplinary proceedings: they can lead to the doctor being penalised, but will not get you any money. The complaint is handled by the medical self-government — the same structure acts as both prosecutor and court. [We describe this mechanism](/en/analysis/doctor-discipline-licence-revocation/).' },
    ],
  },
  {
    id: 'crime',
    situation: 'Someone wants a bribe, or I suspect a crime',
    examples: 'For example, an entry for a test that never took place, or a demand for a “thank-you” for being seen sooner.',
    to: 'Police, public prosecutor’s office or the CBA',
    facts: [
      { label: 'How', text: 'A notification at any police unit or district prosecutor’s office (prokuratura rejonowa) — in writing or orally, for the record.' },
      { label: 'Corruption', text: 'Central Anti-Corruption Bureau (CBA): +48 800 808 808 (24 hours a day), sygnal@cba.gov.pl.' },
      { label: 'Good to know', text: 'A person who gave a bribe is not punished if the benefit was accepted and they themselves notified the authorities before the authorities learned of it, and disclosed all the relevant circumstances. All the conditions must be met together (art. 229 § 6 k.k.).' },
    ],
    actions: [{ label: 'CBA: +48 800 808 808', href: 'tel:+48800808808', icon: 'phone' }],
  },
  {
    id: 'other',
    situation: 'A medicine caused harm, a dirty facility, concerns about a facility',
    examples: 'Three matters that neither the Ombudsman nor the NFZ deals with.',
    to: 'URPL, the sanitary inspectorate (sanepid) or the voivode (wojewoda)',
    facts: [
      { label: 'A medicine caused harm', text: 'Report an adverse reaction — this is your right. Using the form of the Office for Registration of Medicinal Products (Urząd Rejestracji Produktów Leczniczych, URPL), through a doctor, nurse or pharmacist, or to the manufacturer (address in the leaflet).' },
      { label: 'Dirt, infections', text: 'Sanitary inspectorate (sanepid): e.sanepid.gov.pl or the mObywatel app, 24 hours a day.' },
      { label: 'The facility itself', text: 'Supervision is exercised by the voivode (wojewoda) — the health department of the voivodeship office (urząd wojewódzki). Public register of facilities: rpwdl2.ezdrowie.gov.pl.' },
    ],
    actions: [
      { label: 'URPL form (in Polish)', href: 'https://www.gov.pl/web/urpl/zglos-dzialanie-niepozadane2' },
      { label: 'e.sanepid.gov.pl (in Polish)', href: 'https://e.sanepid.gov.pl/interventions' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Terminy — od najkrótszego
// ---------------------------------------------------------------------------

export const deadlines: Deadline[] = [
  { value: '7', unit: 'days', what: 'to supply missing information in a complaint to the NFZ', from: 'from the request', basis: 'otherwise the case will not be considered', urgent: true },
  { value: '14', unit: 'days', what: 'to appeal against a decision on the compensation benefit', from: 'from delivery of the decision', basis: `Appeals Commission (Komisja Odwoławcza), fee ${FUND.appealFee}`, urgent: true },
  {
    value: '30', unit: 'days', what: 'to object to a doctor’s opinion or ruling', from: 'from the date it is issued', basis: 'art. 31', urgent: true,
    card: 'to object to a doctor’s ruling — through the RPP, citing the provision. There is no appeal.',
  },
  { value: '30', unit: 'days', what: 'to decide whether to accept the benefit awarded by the Fund', from: 'from the award', basis: 'accepting it closes the route to court', urgent: true },
  {
    value: '1', unit: 'year', what: 'to apply for a compensation benefit for harm in hospital', from: 'from learning of the harm, at the latest 3 years from the event', basis: 'Compensation Fund (Fundusz Kompensacyjny)',
    card: `to apply for a benefit for harm in hospital (at the latest 3 years from the event). Fee ${FUND.fee}.`,
  },
  { value: '3', unit: 'years', what: 'to sue for damages and compensation for harm suffered', from: 'from learning of the harm and of who is responsible for it', basis: 'art. 442¹ § 1 k.c.' },
  { value: '3', unit: 'years', what: 'for the disciplinary prosecutor to open proceedings — file your complaint earlier', from: 'from the act', basis: 'art. 64 ust. 1 of the Act on Medical Chambers' },
  {
    value: '20', unit: 'years', what: 'how long the facility keeps your medical records', from: 'from the end of the year of the last entry', basis: 'art. 29', info: true,
    card: 'how long the facility keeps your records (30 years if death resulted from bodily injury or poisoning).',
  },
];

/** Dopowiedzenie do terminu sądowego — najczęstszy mit. */
export const courtMyth =
  'You will sometimes hear that “after 10 years from the event the claim is time-barred anyway”. For personal injury — and a medical error is personal injury — this limit does not apply: the 3 years run from the day you learn of the harm, even many years later (art. 442¹ § 3 k.c.). If the harm resulted from a crime — 20 years from when it was committed; for a child, the limitation period will not end earlier than 2 years after they come of age.';

// ---------------------------------------------------------------------------
// Szkoda w szpitalu: Fundusz czy sąd
// ---------------------------------------------------------------------------

export const fund: Pl['fund'] = {
  lead: 'Since 1 July 2024, harm suffered in hospital has been handled by the Medical Events Compensation Fund (Fundusz Kompensacyjny Zdarzeń Medycznych) at the Patient Ombudsman. It is a faster and simpler route than court — no lawsuit, no lawyer, no need to prove the fault of a specific person. But it has conditions you need to know before you apply, not after.',
  compare: [
    { label: 'Where the harm occurred', a: 'Only in a hospital (including psychiatric and spa hospitals), during treatment funded from public money', b: 'Anywhere: in a hospital, clinic or surgery, including private care' },
    { label: 'Since when', a: 'Events from 6 September 2023 onwards, or earlier ones that you learn about after that date', b: 'No such limit' },
    { label: 'Fault', a: 'No need to prove the fault of a specific person', b: 'You have to show liability; expert witnesses are usually needed' },
    { label: 'Deadline', a: 'One year from learning of the harm, at the latest 3 years from the event', b: '3 years from learning of the harm and of who is responsible' },
    { label: 'Cost', a: `Fee of ${FUND.fee}. It is not refunded if the Ombudsman refuses the benefit. In financial hardship you can ask to be exempted`, b: 'Court fee' },
    { label: 'Time', a: 'Decision within 3 months of a complete application with the fee paid', b: 'Medical negligence cases can take a long time' },
    { label: 'How much', a: `Patient: ${FUND.patient.min} – ${FUND.patient.max}. Someone close to a patient who died: ${FUND.relative.min} – ${FUND.relative.max}, for each person separately. Tax-free`, b: 'No statutory limit' },
  ] satisfies CompareRow[],
  catch: {
    title: 'Accepting the benefit closes the route to court',
    text: 'When the Ombudsman awards a benefit, you have 30 days to accept or reject it. Accepting means waiving your claims arising from that event — for harm that had become apparent by the day you filed the application. It is a route **instead of** court, not alongside it. If the harm is serious, talk to a lawyer before you sign.',
  },
  conditions: [
    { title: 'Hospital', text: 'The event took place in a hospital, during treatment funded from public money. Clinics, surgeries and private treatment — no.' },
    { title: 'After 6 September 2023', text: 'Or earlier, but you learn about it only after that date.' },
    { title: 'A medical event, not a complication', text: 'A consequence that could very probably have been avoided with treatment in line with current knowledge. A normal, foreseeable consequence of a method you gave informed consent to is a complication — the Fund does not cover it.' },
    { title: 'On time', text: 'One year from learning of the infection, bodily injury, health disorder or death of the patient — and no later than 3 years from the event.' },
  ],
  how: [
    `**Filing:** on paper (ul. Płocka 11/13, 01-231 Warszawa), via ePUAP (/RzPP/skrytka) or e-Doręczenia (the electronic registered delivery service). An ordinary e-mail is not enough — such an application will not be considered.`,
    `**The ${FUND.fee} fee** is refunded if the benefit is awarded, if the application is left without consideration or if the Ombudsman refuses to open proceedings.`,
    `**Appeal:** within 14 days of delivery of the decision, to the Appeals Commission (Komisja Odwoławcza) through the Ombudsman (fee ${FUND.appealFee}, refunded if the appeal is upheld). After that, a complaint to the Voivodeship Administrative Court (Wojewódzki Sąd Administracyjny) in Warsaw.`,
  ],
  notes: [
    'The voivodeship commissions for medical events (wojewódzkie komisje do spraw zdarzeń medycznych) have not operated since 1 July 2024, and the Ombudsman took over their pending cases. Older guides still refer people to them.',
    'Do not confuse the Medical Events Compensation Fund with the Vaccination and Clinical Trials funds — these are separate funds at the same office, with separate applications and accounts.',
  ],
  amountsNote: `Amounts and fees apply ${FUND.since}; they are indexed every year in September.`,
};

// ---------------------------------------------------------------------------
// Karta do druku (PDF) — wyciąg z treści wyżej, nie osobna kopia
// ---------------------------------------------------------------------------

export const card = {
  title: 'Patient rights in Poland',
  stamp: `As of ${page.checked.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
  url: 'zarobkilekarzy.pl/en/patient-rights',
  rights: rightsGroups.flatMap((g) => g.items).filter((i) => i.card).map((i) => ({ text: i.card!, basis: i.basis })),
  free: [
    { text: 'The first copy of your records in the requested scope.', basis: 'art. 28 ust. 2a' },
    { text: 'A parent or carer staying with a child or with a person with a severe degree of disability.', basis: 'art. 35 ust. 4' },
    { text: 'An application to the Patient Ombudsman.', basis: 'art. 50 ust. 2' },
  ],
  deadlines: deadlines.filter((d) => d.card).map((d) => ({ value: `${d.value} ${d.unit}`, text: d.card!, basis: d.basis })),
  warning: 'Accepting a benefit from the Fund means giving up your claims in court. It is a route instead of court, not alongside it.',
  routes: routes.filter((r) => r.card).map((r) => r.card!),
  legal: `Legal basis: Act on Patient Rights (${ACT.citation}). This is not legal advice. A translation for information only — only the Polish legal texts are binding.`,
  howTo: ['Print on an ordinary sheet of A4, single-sided, at 100% scale.', 'Cut the sheet in half along the dashed line.', 'Fold each half along the dots — with the text on the outside.'],
} satisfies CardContent;

/** Napisy angielskich PDF-ów (lib/pacjent/pdf.ts → PdfText). */
export const pdfText: PdfText = {
  lang: 'en-GB',
  cardMeta: {
    title: (title) => `${title} — pocket card to print`,
    subject: 'The most important patient rights in Poland, deadlines and phone numbers. Two cards on a sheet of A4: cut and fold.',
    keywords: 'patient rights, Poland, Patient Ombudsman, Rzecznik Praw Pacjenta, medical records, printable card',
  },
  largeMeta: {
    title: (title) => `${title} — large print`,
    subject: 'The most important patient rights in Poland, deadlines and phone numbers, in large print on two A4 pages.',
    keywords: 'patient rights, Poland, large print, Patient Ombudsman, Rzecznik Praw Pacjenta, printable card',
  },
  cardKind: 'Pocket card',
  largeKind: 'Large print',
  call: 'Not sure where to start? Call',
  cardHelpline: (name, hours) => `**${name}** — ${hours.toLowerCase()}; from abroad +48 22 688 05 00 (paid). Joint number of the Patient Ombudsman (RPP) and the NFZ.`,
  largeHelpline: (name, hours) => `${hours}. **${name}** — Patient Ombudsman and NFZ. From abroad: **+48 22 688 05 00** (paid).`,
  cardEmergency: 'Life in danger? Call 112. The patient helpline does not send an ambulance.',
  largeEmergency: '**Life in danger? Call 112.** The patient helpline does not send an ambulance.',
  rights: 'You have the right to',
  free: 'This is free — though hardly anyone tells you',
  deadlines: 'Watch the deadlines',
  warning: 'Warning',
  routes: 'Where to report',
  full: 'Full version and sources:',
  cutMarks: 'cut along the dashed line · fold along the dots, text facing out',
  page: (n, of) => `page ${n} of ${of}`,
};

// ---------------------------------------------------------------------------
// Stanowisko redakcji i źródła
// ---------------------------------------------------------------------------

export const editorial: Pl['editorial'] = [
  'Because patient rights work only when people know about them. The free first copy of medical records has been available for years, yet nobody announces it at reception. The ban on charging a parent for staying with their child is in the act, yet bills for an “extra bed” still happen. Lack of knowledge is also a form of opacity.',
  'You can see this in the Internet Patient Account. When patients saw their own billing records, more than 1,600 of them turned out to be indefensible in a single year. The IKP shows the cost of your visit, but not how much public money in total went to a particular doctor from all sources. It is the same gap — [lack of transparency as a condition for abuse](/en/mechanisms/lack-of-transparency/).',
  'We are not a public authority, a law firm or a patients’ organisation, but a citizens’ website about the transparency of public money. We describe mechanisms, not individuals. The vast majority of doctors and facilities work diligently; the problem is a system in which we usually learn about our rights only once they have already been violated.',
];

export const legalBasis: Pl['legalBasis'] = [
  `Act of 6 November 2008 on Patient Rights and the Patient Ombudsman (ustawa o prawach pacjenta i Rzeczniku Praw Pacjenta), consolidated text [${ACT.citation}](${ACT.url}) (in Polish). Articles cited without the name of an act refer to this act.`,
  'Limitation of claims: art. 442¹ of the Civil Code (Kodeks cywilny). That the ten-year limit from the event does not apply to personal injury was settled by the Supreme Court (resolution of 24 February 2009, III CZP 2/09), following the judgment of the Constitutional Tribunal in case SK 14/05.',
  'Professional liability of doctors: art. 64 of the Act on Medical Chambers (ustawa o izbach lekarskich, Dz.U. 2021 poz. 1342). Exemption from punishment for reporting a bribe: art. 229 § 6 of the Criminal Code (Kodeks karny).',
];

/** Te same źródła i adresy co w module polskim; polskie tytuły z tłumaczeniem. */
export const sources: Source[] = [
  { publisher: 'Sejm (ISAP)', title: 'Ustawa o prawach pacjenta i Rzeczniku Praw Pacjenta, tekst jednolity Dz.U. 2024 poz. 581 (“Act on Patient Rights and the Patient Ombudsman, consolidated text”, in Polish)', url: ACT.url },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Prawa pacjenta (“Patient rights”, in Polish)', url: 'https://www.gov.pl/web/rpp/prawa-pacjenta' },
  { publisher: 'Ministry of Health', title: 'Prawa pacjenta (“Patient rights”, in Polish)', url: 'https://www.gov.pl/web/zdrowie/prawa-pacjenta' },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Telefoniczna Informacja Pacjenta (“Patient Information Line”, in Polish)', url: 'https://www.gov.pl/web/rpp/telefoniczna-informacja-pacjenta' },
  { publisher: 'NFZ', title: 'Telefoniczna Informacja Pacjenta (“Patient Information Line”, in Polish)', url: 'https://www.nfz.gov.pl/kontakt/telefoniczna-informacja-pacjenta/' },
  DOC_FEES.source,
  { publisher: 'Patient Ombudsman (RPP)', title: 'Kiedy i komu przysługuje świadczenie kompensacyjne (“When and to whom the compensation benefit is due”, in Polish)', url: 'https://www.gov.pl/web/rpp/kiedy-i-komu-przysluguje-swiadczenie' },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Jak złożyć wniosek o świadczenie kompensacyjne (opłata, kanały) (“How to apply for the compensation benefit: fee, channels”, in Polish)', url: 'https://www.gov.pl/web/rpp/jak-zlozyc-wniosek3' },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Wysokość świadczenia kompensacyjnego (kwoty od 6 września 2026 r.) (“Amount of the compensation benefit: amounts from 6 September 2026”, in Polish)', url: 'https://www.gov.pl/web/rpp/wysokosc-swiadczenia-kompensacyjnego' },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Komisja Odwoławcza — termin i opłata od odwołania (“Appeals Commission — deadline and appeal fee”, in Polish)', url: 'https://www.gov.pl/web/rpp/komisja-odwolawcza2' },
  { publisher: 'Patient Ombudsman (RPP)', title: 'Rzecznik przejmuje sprawy wojewódzkich komisji ds. orzekania o zdarzeniach medycznych (“The Ombudsman takes over the cases of the voivodeship commissions for medical events”, in Polish)', url: 'https://www.gov.pl/web/rpp/rzecznik-praw-pacjenta-przejmuje-sprawy-wojewodzkich-komisji-ds-orzekania-o-zdarzeniach-medycznych' },
  { publisher: 'Sejm (ISAP)', title: 'Ustawa o izbach lekarskich, tekst jednolity Dz.U. 2021 poz. 1342 (“Act on Medical Chambers, consolidated text”, in Polish)', url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210001342' },
  { publisher: 'Rynek Zdrowia', date: '10.08.2024', title: 'Zgłoszenia nieprawdziwych świadczeń widocznych w IKP — skala i przykłady (“Reports of false services shown in the IKP — scale and examples”, in Polish)', url: 'https://www.rynekzdrowia.pl/Prawo/Falszywe-informacje-o-wizytach-w-IKP-Pacjenci-w-calej-Polsce-zglaszaja-fikcyjne-swiadczenia,261578,2.html' },
];

// ---------------------------------------------------------------------------
// Strażniki: polski moduł zmienił liczbę, kwartał albo listę → tłumaczenie do przejrzenia
// ---------------------------------------------------------------------------

const fail = (what: string) => {
  throw new Error(`data/en/prawa-pacjenta: ${what} — polski moduł się zmienił, popraw tłumaczenie`);
};
const digits = (s: string) => s.replace(/\D/g, '');
const same = <T>(en: T[], pl: T[], what: string, key: (x: T) => unknown = () => 0) => {
  if (en.length !== pl.length || en.some((x, i) => key(x) !== key(pl[i]))) fail(what);
};

if (PL.DOC_FEES.period !== DOC_FEES_PERIOD.pl) fail('kwartał stawek za kopie (DOC_FEES.period)');
if (PL.FUND.since !== 'od 6 września 2026 r.') fail('data kwot Funduszu (FUND.since)');
(['fee', 'appealFee'] as const).forEach((k) => { if (digits(PL.FUND[k]) !== digits(FUND[k])) fail(`kwota FUND.${k}`); });
(['patient', 'relative'] as const).forEach((k) => {
  if (digits(PL.FUND[k].min) !== digits(FUND[k].min) || digits(PL.FUND[k].max) !== digits(FUND[k].max)) fail(`kwoty FUND.${k}`);
});
same(entries, PL.entries, 'wejścia (entries)', (e) => e.icon);
same(rightsGroups, PL.rightsGroups, 'grupy praw');
rightsGroups.forEach((g, i) => {
  const pl = PL.rightsGroups[i];
  same(g.items, pl.items, `pytania w grupie ${pl.id}`, (q) => `${q.basis}|${Boolean(q.card)}|${Boolean(q.say)}|${q.more.length}|${q.table?.rows.length ?? 0}`);
  same(g.also?.items ?? [], pl.also?.items ?? [], `pozostałe prawa w grupie ${pl.id}`, (a) => a.basis);
});
same(firstSteps, PL.firstSteps, 'kroki (firstSteps)');
// przyciski `extra` są tylko w tłumaczeniu (np. numer dla dzwoniących z zagranicy) — nie liczą się do zgodności
same(routes, PL.routes, 'sytuacje (routes)', (r) => `${r.facts.length}|${r.facts.map((f) => Boolean(f.urgent)).join()}|${r.actions?.filter((a) => !a.extra).length ?? 0}|${Boolean(r.card)}`);
same(deadlines, PL.deadlines, 'terminy (deadlines)', (d) => `${d.value}|${Boolean(d.urgent)}|${Boolean(d.info)}|${Boolean(d.card)}`);
same(fund.compare, PL.fund.compare, 'porównanie Fundusz–sąd');
same(fund.conditions, PL.fund.conditions, 'warunki Funduszu');
same(fund.how, PL.fund.how, 'jak złożyć wniosek');
same(fund.notes, PL.fund.notes, 'uwagi o Funduszu');
same(card.free, PL.card.free, 'bezpłatne na karcie', (f) => f.basis);
same(editorial, PL.editorial, 'stanowisko redakcji');
same(legalBasis, PL.legalBasis, 'podstawy prawne');
same(sources, PL.sources, 'źródła', (s) => s.url);
