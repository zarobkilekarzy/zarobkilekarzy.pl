/**
 * Wersja angielska modułu src/data/studia-lekarskie.ts: te same liczby (importowane), tylko teksty i zapis
 * liczb po angielsku. Nazwy eksportów i kształty jak w module polskim — artykuł EN
 * (src/content/en/articles/medical-studies-in-poland.mdx) importuje stąd to samo, co PL z modułu polskiego.
 * Model anatomii i plan studiów (components/studia-lekarskie/*) biorą stąd nazwy, gdy strona jest pod /en/.
 */
import type { BarRow } from '@/types';
import { formatEN } from '@/lib/format';
import { EXAMS_2025, passRate } from '@/data/zdawalnosc-egzaminow';
import {
  THRESHOLDS_2026,
  OLD_NEW_N,
  UW_2026,
  ELA_ROWS as ELA_ROWS_PL,
  TUITION_2026,
  LEK_2026,
  WUM_PLAN as WUM_PLAN_PL,
  BONE_PINS as BONE_PINS_PL,
  VESSEL_PINS as VESSEL_PINS_PL,
  SGH_2026,
  type Bone,
  type BonePin,
  type PlanSubject,
  type VesselPin,
} from '@/data/studia-lekarskie';

export {
  LINKS, UJ_LEKARSKI, UW_LEKARSKI, PLAN_TOTAL, CREDIT, PAID_PLACES, SGH_2026, LEK_2026_MEAN, VIEWBOX, universityColumns,
} from '@/data/studia-lekarskie';

const f1 = (n: number) => formatEN(n, 1);
/** Punkty bez zbędnych zer: 600.55 · 141.4 · 229 */
const pts = (n: number) => formatEN(n, 2).replace(/\.?0+$/, '');

/* ---------- Universities: Polish short names → English ---------- */

/** Nazwy uczelni po angielsku, spójne z src/data/en/odsiew-na-medycynie.ts i english-division.ts */
const SCHOOL: Record<string, string> = {
  // progi 2026
  'UM Lublin': 'Medical University of Lublin',
  'UJK Kielce': 'Jan Kochanowski University in Kielce',
  GUMed: 'Medical University of Gdańsk',
  'UJ CM': 'Jagiellonian University Medical College',
  'UM Łódź': 'Medical University of Lodz',
  'UM Białystok': 'Medical University of Bialystok',
  'Uniwersytet Warszawski': 'University of Warsaw',
  'PUM Szczecin': 'Pomeranian Medical University in Szczecin',
  'ŚUM Katowice': 'Medical University of Silesia in Katowice',
  UKSW: 'Cardinal Stefan Wyszyński University in Warsaw',
  'Politechnika Wrocławska': 'Wrocław University of Science and Technology',
  WUM: 'Medical University of Warsaw',
  'ŚUM, filia w Bielsku-Białej': 'Medical University of Silesia, Bielsko-Biała branch',
  'ANS w Nowym Targu': 'University of Applied Sciences in Nowy Targ',
  'AMiSNS w Elblągu': 'Academy of Applied Medical and Social Sciences in Elbląg',
  // LEK 2026 i czesne
  'Uniwersytet Opolski': 'University of Opole',
  'Uczelnia Łazarskiego': 'Lazarski University',
  'CM UMK (Bydgoszcz)': 'Collegium Medicum UMK (Bydgoszcz)',
  'UM we Wrocławiu': 'Wroclaw Medical University',
  'UM w Poznaniu': 'Poznan University of Medical Sciences',
  'CM UJ (Kraków)': 'Jagiellonian University CM (Kraków)',
  'ŚUM w Katowicach': 'Medical University of Silesia in Katowice',
  'UM w Łodzi': 'Medical University of Lodz',
  'UM w Białymstoku': 'Medical University of Bialystok',
  'Uniwersytet Rzeszowski': 'University of Rzeszów',
  'Krakowska Akademia AFM': 'Andrzej Frycz Modrzewski Krakow University',
  'Uniwersytet AFM w Krakowie': 'Andrzej Frycz Modrzewski Krakow University',
  'PUM w Szczecinie': 'Pomeranian Medical University in Szczecin',
  'UJK w Kielcach': 'Jan Kochanowski University in Kielce',
  'Uniwersytet Zielonogórski': 'University of Zielona Góra',
  'UM w Lublinie': 'Medical University of Lublin',
  'Uczelnia Medyczna im. M. Skłodowskiej-Curie': 'Maria Skłodowska-Curie Medical University (Warsaw)',
  'GUMed (Gdańsk)': 'Medical University of Gdańsk',
  'UWM w Olsztynie': 'University of Warmia and Mazury in Olsztyn',
  'Akademia Śląska': 'Silesian Academy (Akademia Śląska)',
  'Akademia WSB': 'WSB Academy (Dąbrowa Górnicza)',
};
const school = (name: string) => {
  const en = SCHOOL[name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy uczelni „${name}”`);
  return en;
};

/* ---------- Admissions 2026: thresholds ---------- */

const NOTE: Record<string, string> = {
  'I tura': 'first round',
  'ostatni ogłoszony próg': 'last published threshold',
  'filia od 2023/24': 'branch since 2023/24',
  'ostatnia lista zakwalifikowanych': 'last list of qualified candidates',
};
const pct = (t: { points: number; max: number }) => (t.points / t.max) * 100;

export const thresholdRows: BarRow[] = THRESHOLDS_2026.map((t) => ({
  label: school(t.school),
  note: `${pts(t.points)} of ${formatEN(t.max)} pts${t.note ? ` · ${NOTE[t.note]}` : ''}${t.nowa ? ' · new' : ''}`,
  value: pct(t),
  display: `${f1(pct(t))}%`,
  highlight: t.nowa,
}));

const admitted = THRESHOLDS_2026.filter((t) => !t.listOnly).map(pct);
export const thresholdRange = { min: f1(Math.min(...admitted)), max: f1(Math.max(...admitted)) };
const oldPct = THRESHOLDS_2026.filter((t) => !t.listOnly && !t.nowa).map(pct);
export const thresholdOld = { min: f1(Math.min(...oldPct)), max: f1(Math.max(...oldPct)) };
export const thresholdNew = THRESHOLDS_2026.filter((t) => !t.listOnly && t.nowa).map((t) => ({ school: school(t.school), pct: f1(pct(t)) }));
export const listOnlyRows = THRESHOLDS_2026.filter((t) => t.listOnly).map((t) => ({ school: school(t.school), pct: f1(pct(t)) }));

const sghPct = (SGH_2026.points / SGH_2026.max) * 100;
export const sghRow: BarRow = {
  label: 'SGH Warsaw School of Economics — economics',
  note: `${SGH_2026.points} of ${SGH_2026.max} pts · matura exams and SGH test`,
  value: sghPct,
  display: `${f1(sghPct)}%`,
  group: 'For comparison',
};

/* ---------- Old and new universities ---------- */

const big = ['newTotal', 'allTotal', 'newPl', 'allPl', 'newMax', 'oldMax', 'oldTotal', 'oldTotal2012'] as const;
/** Liczby do tekstu po angielsku (1,127 · 3,232) */
export const OLD_NEW = {
  ...OLD_NEW_N,
  ...(Object.fromEntries(big.map((k) => [k, formatEN(OLD_NEW_N[k])])) as Record<(typeof big)[number], string>),
};

/* ---------- Tuition ---------- */

const TUITION_NOTE: Record<string, string> = {
  '417 000 zł za 6 lat według uczelni': 'PLN 417,000 for 6 years according to the university',
  'od IV roku więcej': 'more from year 4',
  'co rok o 800 zł więcej': 'PLN 800 more each year',
  'od III roku więcej': 'more from year 3',
  'od II roku więcej': 'more from year 2',
};
export const tuitionRows: BarRow[] = TUITION_2026.map((t, i, all) => ({
  label: school(t.school),
  note: t.note ? `· ${TUITION_NOTE[t.note]}` : undefined,
  value: t.perYear,
  display: `PLN ${formatEN(t.perYear)}`,
  group: i === 0 || all[i - 1].publicSchool !== t.publicSchool
    ? (t.publicSchool ? 'Public universities · part-time studies' : 'Non-public universities · full-time studies')
    : undefined,
}));
const publicFees = TUITION_2026.filter((t) => t.publicSchool).map((t) => t.perYear);
const privateFees = TUITION_2026.filter((t) => !t.publicSchool).map((t) => t.perYear);
export const TUITION = {
  publicMin: formatEN(Math.min(...publicFees)),
  publicMax: formatEN(Math.max(...publicFees)),
  privateMin: formatEN(Math.min(...privateFees)),
  privateMax: formatEN(Math.max(...privateFees)),
};

/* ---------- University of Warsaw: queue and threshold ---------- */

const MAJOR: Record<string, string> = {
  Informatyka: 'Computer science',
  Matematyka: 'Mathematics',
  Fizyka: 'Physics',
  Psychologia: 'Psychology',
  Prawo: 'Law',
  'Kierunek lekarski': 'Medicine',
};
export const uwQueueRows = [...UW_2026]
  .sort((a, b) => b.threshold - a.threshold)
  .map((r) => ({
    label: MAJOR[r.label],
    count: r.perPlace,
    countDisplay: f1(r.perPlace),
    bar: r.threshold,
    barDisplay: pts(r.threshold),
    highlight: r.label === 'Kierunek lekarski',
  }));
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const lek = UW_2026.find((r) => r.label === 'Kierunek lekarski')!;
const cs = UW_2026.find((r) => r.label === 'Informatyka')!;
/** „seven times more” — jak uwQueueRatio w module polskim */
export const uwQueueRatio = WORDS[Math.floor(lek.perPlace / cs.perPlace)] ?? String(Math.floor(lek.perPlace / cs.perPlace));

/* ---------- ELA: who gets through the first year ---------- */

const LENGTH: Record<string, string> = { '6 lat': '6 years', '5 lat': '5 years', '4 lata': '4 years', '3 lata': '3 years' };
const ELA_MAJOR: Record<string, string> = { ...MAJOR, Architektura: 'Architecture' };
export const ELA_ROWS = ELA_ROWS_PL.map((r) => ({ ...r, major: ELA_MAJOR[r.major], length: LENGTH[r.length] }));

/* ---------- Exams: LEK against other professional exams ---------- */

const EXAM: Record<string, { name: string; note: string; publisher: string; title: string }> = {
  lek: { name: 'Medical Final Examination (LEK)', note: 'CEM · autumn 2025', publisher: 'Medical Examinations Centre (CEM)', title: 'Aggregate results of the Medical Final Examination, autumn 2025 session (in Polish)' },
  radcowski: { name: 'Legal adviser exam', note: 'Ministry of Justice · April 2025', publisher: 'Ministry of Justice', title: 'Results of the advocate and legal adviser exams, 23.05.2025 (in Polish)' },
  adwokacki: { name: 'Advocate (bar) exam', note: 'Ministry of Justice · April 2025', publisher: 'Ministry of Justice', title: 'Results of the advocate and legal adviser exams, 23.05.2025 (in Polish)' },
  inzynier: { name: 'Building engineer', note: 'PIIB · 2025', publisher: 'Polish Chamber of Civil Engineers', title: 'Report of the National Qualification Committee for 2025, table 5.2.5 (in Polish)' },
  architekt: { name: 'Architect', note: 'IARP · 2025', publisher: 'Polish Chamber of Architects', title: 'Exam statistics of the National Qualification Committee, 10.06.2026 (in Polish)' },
  'prawo-jazdy': { name: 'Driving licence, category B', note: 'practical · H2 2025', publisher: 'Ministry of Infrastructure', title: 'Reply to parliamentary question no. 14849, 2.02.2026 (in Polish)' },
  'doradca-podatkowy': { name: 'Tax adviser', note: 'Ministry of Finance in the Sejm · 8.10.2025', publisher: 'Sejm', title: 'Transcript of the 42nd sitting of the Sejm, 8.10.2025, statement by the Ministry of Finance undersecretary (in Polish)' },
};
const exam = (key: string) => {
  const e = EXAM[key];
  if (!e) throw new Error(`[en] brak angielskiej nazwy egzaminu „${key}”`);
  return e;
};
export const examRows: BarRow[] = [...EXAMS_2025]
  .sort((a, b) => passRate(b) - passRate(a))
  .map((e) => ({
    label: exam(e.key).name,
    note: e.approx ? `${exam(e.key).note} · estimate` : exam(e.key).note,
    value: passRate(e),
    display: `${f1(passRate(e))}%`,
    highlight: e.key === 'lek',
  }));
export const examSources = EXAMS_2025.map((e) => ({ label: `${exam(e.key).publisher}, ${exam(e.key).title}`, href: e.source.url }));
export const lekRate = f1(passRate(EXAMS_2025.find((e) => e.key === 'lek')!));

/* ---------- LEK spring 2026 by university ---------- */

export const lek2026Rows: BarRow[] = LEK_2026.map((r) => ({
  label: school(r.school),
  note: `· ${formatEN(r.takers)} ${r.nowa ? 'takers · new' : 'takers'}`,
  value: r.mean,
  display: f1(r.mean),
  highlight: r.nowa,
}));

/* ---------- Anatomy model ---------- */

/** Klucze = `data-bone` w data/anatomia/szkielet.svg; liczby z OpenStax (rozdz. 7–8) */
export const BONES: Record<string, Bone> = {
  Cranium: { name: 'Skull', latin: 'cranium', fact: 'Together with the mandible it has 22 bones: 8 form the braincase, 14 are facial bones.' },
  Mandible: { name: 'Mandible', latin: 'mandibula', fact: 'The only movable bone of the skull.' },
  CervicalVertebrae: { name: 'Cervical vertebrae', latin: 'vertebrae cervicales', fact: 'Seven vertebrae, C1–C7.' },
  ThoracicVertebrae: { name: 'Thoracic vertebrae', latin: 'vertebrae thoracicae', fact: 'Twelve vertebrae, Th1–Th12.' },
  LumbarVertebrae: { name: 'Lumbar vertebrae', latin: 'vertebrae lumbales', fact: 'Five vertebrae, L1–L5.' },
  Sacrum: { name: 'Sacrum', latin: 'os sacrum', fact: 'Formed by the fusion of five sacral vertebrae.' },
  Coccyx: { name: 'Coccyx', latin: 'os coccygis', fact: 'Formed by the fusion of small coccygeal vertebrae, usually four.' },
  Manubrium: { name: 'Manubrium of the sternum', latin: 'manubrium sterni', fact: 'The upper of the three parts of the sternum.' },
  Sternum: { name: 'Sternum', latin: 'sternum', fact: 'Three parts: the manubrium, the body and the xiphoid process.' },
  Ribs: { name: 'Ribs', latin: 'costae', fact: 'Twelve pairs; together with the sternum and costal cartilages they form the thoracic cage.' },
  Clavicle: { name: 'Clavicle', latin: 'clavicula' },
  Scapula: { name: 'Scapula', latin: 'scapula' },
  Humerus: { name: 'Humerus', latin: 'humerus' },
  Radius: { name: 'Radius', latin: 'radius' },
  Ulna: { name: 'Ulna', latin: 'ulna' },
  Carpals: { name: 'Carpal bones', latin: 'ossa carpi', fact: 'Eight in each hand.' },
  Metacarpals: { name: 'Metacarpal bones', latin: 'ossa metacarpi', fact: 'Five in each hand.' },
  Phalanges: { name: 'Phalanges of the hand', latin: 'phalanges manus', fact: 'Fourteen in each hand. The whole upper limb has 30 bones.' },
  PelvicGirdle: { name: 'Hip bones', latin: 'ossa coxae', fact: 'Each is formed by the fusion of three bones: the ilium, the ischium and the pubis.' },
  Femur: { name: 'Femur', latin: 'femur', fact: 'The longest and strongest bone of the body.' },
  Patella: { name: 'Patella', latin: 'patella', fact: 'The largest sesamoid bone, that is, a bone embedded in a tendon.' },
  Tibia: { name: 'Tibia', latin: 'tibia' },
  Fibula: { name: 'Fibula', latin: 'fibula' },
  Tarsals: { name: 'Tarsal bones', latin: 'ossa tarsi', fact: 'Seven in each foot.' },
  Metatarsals: { name: 'Metatarsal bones', latin: 'ossa metatarsi', fact: 'Five in each foot.' },
  PhalangesFoot: { name: 'Phalanges of the foot', latin: 'phalanges pedis', fact: 'Fourteen in each foot.' },
};

const PIN_NAME: Record<string, string> = {
  'caput humeri': 'Head of the humerus',
  'tuberculum majus': 'Greater tubercle',
  'tuberositas deltoidea': 'Deltoid tuberosity',
  'epicondylus medialis': 'Medial epicondyle',
  'capitulum humeri': 'Capitulum of the humerus',
  'caput femoris': 'Head of the femur',
  'trochanter major': 'Greater trochanter',
  'trochanter minor': 'Lesser trochanter',
  'condylus medialis': 'Medial condyle',
  'condylus lateralis': 'Lateral condyle',
};
/** Te same położenia co w module polskim, nazwy po angielsku (po łacinie bez zmian) */
export const BONE_PINS: Record<string, BonePin[]> = Object.fromEntries(
  Object.entries(BONE_PINS_PL).map(([k, pins]) => [k, pins.map((p) => ({ ...p, name: PIN_NAME[p.latin] }))]),
);

export const BONE_NOTES: Record<string, string> = {
  Humerus: 'The deltoid muscle attaches to the deltoid tuberosity, and the muscles at the front of the forearm, which we grip with, attach to the medial epicondyle.',
  Femur: 'The head of the femur forms the hip joint with the acetabulum of the pelvis, and the condyles, together with the tibia, form the knee joint.',
};

const VESSEL: Record<string, { name: string; text: string }> = {
  cor: { name: 'Heart', text: 'Pumps blood into two circuits: pulmonary and systemic.' },
  'arcus aortae': { name: 'Aortic arch', text: 'The aorta is the largest artery of the body.' },
  'vena cava superior': { name: 'Superior vena cava', text: 'Collects blood from most of the body above the diaphragm.' },
  'vena cava inferior': { name: 'Inferior vena cava', text: 'Collects blood from the body below the diaphragm.' },
  'arteria carotis communis, vena jugularis interna': { name: 'Common carotid artery and internal jugular vein', text: 'The artery divides into the internal and external carotid; the vein drains blood mainly from the brain.' },
  'arteria et vena renalis': { name: 'Renal artery and vein', text: 'The renal veins are usually the largest veins draining into the inferior vena cava.' },
  'arteria et vena femoralis': { name: 'Femoral artery and vein', text: 'After leaving the abdominal cavity, the external iliac artery changes its name to the femoral artery.' },
  'vena saphena magna': { name: 'Great saphenous vein', text: 'A large superficial vein of the lower limb.' },
  'arteria radialis': { name: 'Radial artery', text: 'Runs along the radius, as the ulnar artery runs along the ulna.' },
  'vena mediana cubiti': { name: 'Median cubital vein', text: 'The most common site for drawing venous blood.' },
};
export const VESSEL_PINS: VesselPin[] = VESSEL_PINS_PL.map((v) => ({ ...v, ...VESSEL[v.latin] }));

/* ---------- Study plan (WUM, 2026/27 cohort) ---------- */

/** Nazwa pełna i podpis na wykresie; klucz = nazwa polska z WUM_PLAN */
const SUBJECT: Record<string, [string, string]> = {
  'Anatomia prawidłowa': ['Anatomy', 'Anatomy'],
  'Histologia z embriologią i cytofizjologią': ['Histology with embryology and cytophysiology', 'Histology'],
  'Pierwsza pomoc i elementy pielęgniarstwa': ['First aid and basics of nursing', 'First aid'],
  'Statystyka i informatyka medyczna': ['Medical statistics and informatics', 'Statistics'],
  'Historia medycyny': ['History of medicine', 'History of medicine'],
  Biofizyka: ['Biophysics', 'Biophysics'],
  'Etyka lekarska z elementami filozofii': ['Medical ethics with elements of philosophy', 'Ethics'],
  'Język obcy': ['Foreign language', 'Foreign language'],
  'Wychowanie fizyczne': ['Physical education', 'PE'],
  'Podstawy biologii molekularnej': ['Basics of molecular biology', 'Molecular biology'],
  'Psychologia medyczna': ['Medical psychology', 'Psychology'],
  'Komunikacja medyczna': ['Medical communication', 'Communication'],
  'Propedeutyka medycyny uzależnień': ['Introduction to addiction medicine', 'Addiction'],
  'Bezpieczeństwo i higiena pracy, przysposobienie biblioteczne': ['Occupational health and safety, library training', 'OHS'],
  'Przedmiot do wyboru': ['Elective', 'Elective'],
  'Praktyki zawodowe': ['Work placement', 'Placement'],
  'Fizjologia z patofizjologią': ['Physiology with pathophysiology', 'Physiology'],
  'Biochemia z elementami chemii': ['Biochemistry with elements of chemistry', 'Biochemistry'],
  Immunologia: ['Immunology', 'Immunology'],
  Parazytologia: ['Parasitology', 'Parasitology'],
  Genetyka: ['Genetics', 'Genetics'],
  'Metodologia badań naukowych': ['Research methodology', 'Methodology'],
  'Higiena i epidemiologia': ['Hygiene and epidemiology', 'Epidemiology'],
  Patomorfologia: ['Pathomorphology', 'Pathology'],
  'Farmakologia i toksykologia': ['Pharmacology and toxicology', 'Pharmacology'],
  Mikrobiologia: ['Microbiology', 'Microbiology'],
  'Diagnostyka laboratoryjna': ['Laboratory diagnostics', 'Lab diagnostics'],
  'Propedeutyka chorób wewnętrznych': ['Introduction to internal medicine', 'Intro to internal medicine'],
  'Propedeutyka pediatrii': ['Introduction to paediatrics', 'Intro to paediatrics'],
  Radiologia: ['Radiology', 'Radiology'],
  'Zdrowie publiczne': ['Public health', 'Public health'],
  'Propedeutyka stomatologii i chirurgii szczękowo-twarzowej': ['Introduction to dentistry and maxillofacial surgery', 'Dentistry'],
  Onkogenetyka: ['Oncogenetics', 'Oncogenetics'],
  'Choroby zakaźne': ['Infectious diseases', 'Infectious diseases'],
  'Dermatologia z wenerologią': ['Dermatology and venereology', 'Dermatology'],
  Laryngologia: ['Otorhinolaryngology', 'ENT'],
  Urologia: ['Urology', 'Urology'],
  Chirurgia: ['Surgery', 'Surgery'],
  'Choroby wewnętrzne: pneumonologia i alergologia, angiologia, kardiologia': ['Internal medicine: pulmonology and allergology, angiology, cardiology', 'Internal medicine'],
  'Pediatria: endokrynologia, gastroenterologia, pulmonologia i alergologia': ['Paediatrics: endocrinology, gastroenterology, pulmonology and allergology', 'Paediatrics'],
  'Psychiatria i psychiatria dziecięca': ['Psychiatry and child psychiatry', 'Psychiatry'],
  'Propedeutyka medycyny rodzinnej': ['Introduction to family medicine', 'Family medicine'],
  'Medycyna nuklearna': ['Nuclear medicine', 'Nuclear medicine'],
  'Chirurgia dziecięca': ['Paediatric surgery', 'Paediatric surgery'],
  Onkologia: ['Oncology', 'Oncology'],
  'Immunologia kliniczna': ['Clinical immunology', 'Clinical immunology'],
  Neurologia: ['Neurology', 'Neurology'],
  'Medycyna sądowa i prawo medyczne': ['Forensic medicine and medical law', 'Forensic medicine'],
  'Anestezjologia i intensywna terapia': ['Anaesthesiology and intensive care', 'Anaesthesiology'],
  'Ortopedia i traumatologia narządu ruchu': ['Orthopaedics and traumatology', 'Orthopaedics'],
  Okulistyka: ['Ophthalmology', 'Ophthalmology'],
  'Ginekologia i położnictwo z endokrynologią ginekologiczną': ['Gynaecology and obstetrics with gynaecological endocrinology', 'Gynaecology'],
  'Choroby wewnętrzne: hematologia, nefrologia, reumatologia': ['Internal medicine: haematology, nephrology, rheumatology', 'Internal medicine'],
  'Pediatria: hematologia i onkologia, nefrologia': ['Paediatrics: haematology and oncology, nephrology', 'Paediatrics'],
  'Farmakologia kliniczna': ['Clinical pharmacology', 'Clinical pharmacology'],
  Transplantologia: ['Transplantology', 'Transplantology'],
  Neurochirurgia: ['Neurosurgery', 'Neurosurgery'],
  Rehabilitacja: ['Rehabilitation', 'Rehabilitation'],
  'Medycyna paliatywna': ['Palliative medicine', 'Palliative medicine'],
  Geriatria: ['Geriatrics', 'Geriatrics'],
  'Choroby wewnętrzne: kardiologia, endokrynologia, gastroenterologia, diabetologia, zajęcia praktyczne': ['Internal medicine: cardiology, endocrinology, gastroenterology, diabetology, practical classes', 'Internal medicine'],
  Pediatria: ['Paediatrics', 'Paediatrics'],
  'Ginekologia i położnictwo': ['Gynaecology and obstetrics', 'Gynaecology'],
  Psychiatria: ['Psychiatry', 'Psychiatry'],
  'Medycyna ratunkowa': ['Emergency medicine', 'Emergency'],
  'Medycyna rodzinna': ['Family medicine', 'Family'],
  'Specjalność wybrana przez studenta': ['Specialty chosen by the student', 'Chosen specialty'],
};
const subject = (x: PlanSubject): PlanSubject => {
  const en = SUBJECT[x.name];
  if (!en) throw new Error(`[en] brak angielskiej nazwy przedmiotu „${x.name}”`);
  return { ...x, name: en[0], short: en[1] };
};
export const WUM_PLAN = WUM_PLAN_PL.map((y) => ({ ...y, subjects: y.subjects.map(subject) }));
