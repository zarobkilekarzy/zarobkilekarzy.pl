/**
 * Tłumaczenie „Kontrola NFZ” (src/content/en/articles/nfz-inspection-koszalin.mdx): liczby z modułu polskiego,
 * tu tylko tekst — podpisy punktów wykresu po angielsku i kwoty w złotych z przybliżeniem w euro (kurs z buildu).
 */
import { getRates } from '@/i18n/rates';
import { withEur, type MoneyOptions } from '@/i18n/money';
import { monthlyPoints } from '@/data/kontrola-nfz';

const rates = await getRates();

export const pln = (amount: number, options?: MoneyOptions) => withEur(amount, 'PLN', rates, options);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** punkty wykresu z polskiego modułu: miesiąc po angielsku, dymek „approx. N” */
export const monthlyPointsEn = (jgp: 'H52' | 'H53') =>
  monthlyPoints(jgp).map((p) => {
    const year = Math.floor(p.x);
    return { ...p, label: `${MONTHS[Math.round((p.x - year) * 12 - 0.5)]} ${year}`, tip: `approx. ${p.v}` };
  });
