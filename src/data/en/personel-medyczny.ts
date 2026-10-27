/**
 * Wersja angielska tekstów zestawienia /dane/personel-medyczny/ (EN: /en/data/other-health-professions-pay/).
 * Liczby — kwota bazowa i współczynniki — pochodzą ze wspólnego modułu src/data/personel-medyczny.ts
 * (czytają go też inne tłumaczenia); tu tylko angielskie nazwy grup siatki dla components/personel/PayScale
 * i opis kwoty bazowej. Treść artykułu: src/content/en/articles/other-health-professions-pay.mdx.
 */
import { BASE as BASE_PL, NON_MEDICAL as NON_MEDICAL_PL, PAY_SCALE as PAY_SCALE_PL, type PayGroup } from '@/data/personel-medyczny';

export { minimum } from '@/data/personel-medyczny';

export const BASE = {
  amount: BASE_PL.amount,
  from: '1 July 2026',
  basis: 'average pay in the economy in 2025, Statistics Poland (GUS) announcement of 9.02.2026',
} as const;

/** Angielskie nazwy i dopiski grup — według numeru grupy z załącznika do ustawy. */
const GROUP_TEXT: Record<number, Pick<PayGroup, 'title' | 'note'>> = {
  1: { title: 'Doctor or dentist with a specialisation', note: 'The top of the scale.' },
  2: {
    title: 'Nurse, midwife, laboratory diagnostician, physiotherapist, pharmacist — master’s degree with a specialisation',
    note: 'The highest group for nurses and midwives; clinical psychologists are also here.',
  },
  3: { title: 'Doctor or dentist without a specialisation' },
  5: {
    title: 'Nurse, midwife — master’s degree without a specialisation, or bachelor’s degree or secondary education with a specialisation',
    note: 'Also physiotherapists and diagnosticians with a master’s degree, and psychologists.',
  },
  4: { title: 'Intern doctor', note: 'The minimum is almost equal to group 6.' },
  6: {
    title: 'Nurse, midwife — bachelor’s degree or secondary education without a specialisation; paramedic',
    note: 'Also physiotherapists with a bachelor’s degree. A paramedic does not move higher in the scale — moving up is the profession’s long-standing demand.',
  },
  7: { title: 'Medical caregiver, technician with secondary education' },
};

/** Grupy siatki z angielskimi napisami, w kolejności i z liczbami modułu polskiego. */
export const PAY_SCALE: PayGroup[] = PAY_SCALE_PL.map((g) => {
  const text = GROUP_TEXT[g.group];
  if (!text) throw new Error(`[en] brak angielskiej nazwy grupy siatki ${g.group}`);
  if (Boolean(text.note) !== Boolean(g.note)) throw new Error(`[en] grupa ${g.group}: dopisek niezgodny z modułem polskim`);
  return { ...g, title: text.title, note: text.note };
});

export const NON_MEDICAL = { ...NON_MEDICAL_PL, title: 'ward attendants and orderlies' } as const;
