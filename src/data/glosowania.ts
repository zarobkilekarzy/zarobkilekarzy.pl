/**
 * Głosowania w Sejmie pokazywane na stronie — wyniki imienne z api.sejm.gov.pl (pole `votes`), zapisane
 * w src/data/glosowania/ (nie pobieramy ich przy buildzie). Kluby: skrót z API → nazwa i logo z barometru.
 */
import type { ImageMetadata } from 'astro';
import { barometrParties } from '@/data/barometr-polityczny';
import type { Voting } from '@/lib/sejm/hemicycle';
import limity149 from '@/data/glosowania/sejm-10-67-149.json';
import limitySenat from '@/data/glosowania/sejm-10-69-poprawki-senatu.json';
import limitySejm67 from '@/data/glosowania/sejm-10-67-poprawki.json';
import limitySenat68 from '@/data/glosowania/senat-11-68-limity.json';

/** Ustawa o limitach płac medyków (druki 3157, 3193, 3193-A) — głosowanie nad całością, 22.10.2026. */
export const limityVoting = limity149 as Voting;

/** Głosy jednego klubu albo koła: „za” = za odrzuceniem poprawki Senatu. */
export interface ClubVotes { club: string; yes: number; no: number; abstain: number; absent: number }

/**
 * Ustawa o limitach płac medyków — głosowania nr 90–100 nad poprawkami Senatu, 69. posiedzenie, 19.11.2026
 * (druki nr 3337 i 3389). Sumy według klubów, bez nazwisk; „za” = za odrzuceniem, `majority` = wymagana większość bezwzględna.
 */
export const limityAmendmentVotes: { nr: number; yes: number; no: number; abstain: number; absent: number; majority: number; clubs: ClubVotes[] }[] = limitySenat;

type ClubSums = { nr: number; yes: number; no: number; abstain: number; absent?: number; majority?: number; clubs: ClubVotes[] };

/** Wybrane głosowania Sejmu z 22.10.2026 nad poprawkami i wnioskami mniejszości (67. posiedzenie): sumy według klubów. */
export const limitySejmVotes: ClubSums[] = limitySejm67;

/**
 * Głosowania Senatu z 6.11.2026 (68. posiedzenie) nad poprawkami do ustawy o limitach: sumy według klubów i kół
 * ze stron senat.gov.pl (szczegoly-glosowania,628,<nr>,11.html); `members` = liczba członków klubu.
 */
export const limitySenatVotes: (Omit<ClubSums, 'clubs'> & { clubs: (ClubVotes & { members: number })[] })[] = limitySenat68;

/** Kluby i koła Senatu XI kadencji: nazwa po polsku i po angielsku. */
export const SENAT_CLUBS: Record<string, { pl: string; en: string }> = {
  ko: { pl: 'KO', en: 'KO' },
  pis: { pl: 'PiS', en: 'PiS' },
  lewica: { pl: 'Lewica', en: 'Lewica' },
  td: { pl: 'Trzecia Droga', en: 'Trzecia Droga (Third Way)' },
  npc: { pl: 'NOWA Polska-Centrum', en: 'NOWA Polska-Centrum' },
  rozwoj: { pl: 'Rozwój Plus', en: 'Rozwój Plus' },
  niez: { pl: 'Senatorowie niezrzeszeni', en: 'Unaffiliated senators' },
};

/** Wiersze małej tabeli „klub / za / przeciw / wstrzymało się / nie głosowało” dla jednego głosowania. */
export const clubRows = (clubs: ClubVotes[], name: (id: string) => string): string[][] =>
  clubs.map((c) => [name(c.club), String(c.yes), String(c.no), String(c.abstain), String(c.absent)]);

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
