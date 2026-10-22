/**
 * Głosowania w Sejmie pokazywane na stronie — wyniki imienne z api.sejm.gov.pl (pole `votes`), zapisane
 * w src/data/glosowania/ (nie pobieramy ich przy buildzie). Kluby: skrót z API → nazwa i logo z barometru.
 */
import type { ImageMetadata } from 'astro';
import { barometrParties } from '@/data/barometr-polityczny';
import type { Voting } from '@/lib/sejm/hemicycle';
import limity149 from '@/data/glosowania/sejm-10-67-149.json';

/** Ustawa o limitach płac medyków (druki 3157, 3193, 3193-A) — głosowanie nad całością, 22.10.2026. */
export const limityVoting = limity149 as Voting;

export interface ClubInfo { name: string; short: string; logo?: ImageMetadata }

const party = (id: string) => barometrParties.find((p) => p.id === id)?.logo;

/** Kluby i koła X kadencji wg skrótów z API Sejmu. */
export const SEJM_CLUBS: Record<string, ClubInfo> = {
  KO: { name: 'Koalicja Obywatelska', short: 'KO', logo: party('koalicja-obywatelska') },
  PiS: { name: 'Prawo i Sprawiedliwość', short: 'PiS', logo: party('pis') },
  RozwojPlus: { name: 'Rozwój Plus', short: 'Rozwój Plus', logo: party('rozwoj-plus') },
  'PSL-TD': { name: 'PSL – Trzecia Droga', short: 'PSL', logo: party('psl') },
  Lewica: { name: 'Lewica', short: 'Lewica', logo: party('lewica') },
  Konfederacja: { name: 'Konfederacja', short: 'Konfederacja', logo: party('konfederacja') },
  Centrum: { name: 'Centrum', short: 'Centrum', logo: party('centrum') },
  Polska2050: { name: 'Polska 2050', short: 'Polska 2050', logo: party('polska-2050') },
  Demokracja: { name: 'Koło Demokracja Bezpośrednia', short: 'Demokracja Bezp.', logo: party('demokracja-bezposrednia') },
  Razem: { name: 'Koło Razem', short: 'Razem', logo: party('razem') },
  Konfederacja_KP: { name: 'Koło Konfederacja Korony Polskiej', short: 'Korona', logo: party('konfederacja-korony-polskiej') },
  'niez.': { name: 'Posłowie niezrzeszeni', short: 'Niezrzeszeni' },
};

/** kluby, które przy remisie poparcia stoją na końcu swojej grupy */
export const CLUBS_LAST = ['niez.'];
