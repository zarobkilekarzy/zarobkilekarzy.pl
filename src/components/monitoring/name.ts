/**
 * Czytelna nazwa placówki z nazwy rejestrowej.
 * Trzy czwarte nazw we wnioskach jest zapisanych WERSALIKAMI, a forma prawna zajmuje pół wiersza
 * („SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ”). Do wyświetlania:
 * - wersaliki zamieniamy na zapis jak w nazwach własnych (Wojewódzki Szpital Specjalistyczny im. …),
 *   z zachowaniem skrótowców (SP ZOZ, NZOZ, MSWiA) i liczebników rzymskich,
 * - formy prawne skracamy do zwyczajowych skrótów (sp. z o.o., S.A., SP ZOZ) z twardymi spacjami,
 * - proste cudzysłowy zamieniamy na polskie („…”).
 * Pełna nazwa rejestrowa zostaje w wyszukiwarce, w dymku i w szczegółach wiersza.
 */

/** Skrótowce, które zostają wersalikami (klucz: wersaliki → zapis docelowy). */
const ACRONYMS = new Map(
  [
    'SP', 'ZOZ', 'SPZOZ', 'NZOZ', 'ZZOZ', 'SPZZOZ', 'SPSK', 'USK', 'CSK', 'UCK', 'WSS', 'WSZ', 'PCK', 'NFZ',
    'ZUS', 'KRUS', 'PKP', 'MON', 'MSW', 'PZU', 'EMC', 'ONV', 'PGU', 'AMC', 'CMKP', 'CZD', 'UM', 'PAN', 'PUM',
    'WUM', 'GUM', 'SUM', 'UJ', 'CM', 'MSWIA',
  ].map((a) => [a, a === 'MSWIA' ? 'MSWiA' : a]),
);

/** Słowa pisane małą literą wewnątrz nazwy (spójniki, przyimki, tytuły przed nazwiskiem). */
const LOWER = new Set([
  'w', 'we', 'z', 'ze', 'i', 'oraz', 'na', 'nad', 'pod', 'przy', 'dla', 'do', 'od', 'u', 'o',
  'im', 'dr', 'dra', 'prof', 'hab', 'św', 'bł', 'ks', 'nr', 'ul', 'al', 'gen', 'płk',
]);

const ROMAN = /^(?:II|III|IV|VI|VII|VIII|IX|XI|XII)$/;
const VOWELS = /[AEIOUYĄĘÓ]/;

const LEGAL_FORMS: [RegExp, string][] = [
  [/samodzielny\s+publiczny\s+zesp[oó]ł\s+zak[lł]ad[oó]w\s+opieki\s+zdrowotnej/giu, 'SP\u00A0ZZOZ'],
  [/samodzielny\s+publiczny\s+zak[lł]ad\s+opieki\s+zdrowotnej/giu, 'SP\u00A0ZOZ'],
  [/niepubliczny\s+zak[lł]ad\s+opieki\s+zdrowotnej/giu, 'NZOZ'],
  [/sp[oó][lł]ka\s+z\s+ograniczon\p{L}*\s+odpowiedzialno\p{L}*/giu, 'sp.\u00A0z\u00A0o.o.'],
  [/sp\.\s*z\s*o\.\s*o\./giu, 'sp.\u00A0z\u00A0o.o.'],
  [/sp[oó][lł]ka\s+akcyjna/giu, 'S.A.'],
  [/sp[oó][lł]ka\s+komandytowa/giu, 'sp.k.'],
  [/sp[oó][lł]ka\s+jawna/giu, 'sp.j.'],
  [/sp[oó][lł]ka\s+cywilna/giu, 's.c.'],
  [/sp[oó][lł]ka\s+partnerska/giu, 'sp.p.'],
  [/(?<!\p{L})s\.\s?c\./giu, 's.c.'],
];

const isShouting = (s: string) => {
  const letters = s.match(/\p{L}/gu) ?? [];
  return letters.length > 0 && letters.filter(isUpper).length / letters.length > 0.7;
};

function caseWord(word: string, first: boolean, abbreviated: boolean): string {
  const lower = word.toLocaleLowerCase('pl');
  if (ACRONYMS.has(word)) return ACRONYMS.get(word)!;
  if (ROMAN.test(word)) return word;
  if (LOWER.has(lower)) return first ? capitalize(lower) : lower;
  // krótkie słowa bez samogłosek to skrótowce (CRH, MML, KDK), chyba że to skrót z kropką (WLKP. → Wlkp.)
  if (word.length > 1 && word.length <= 4 && !VOWELS.test(word) && !abbreviated) return word;
  return capitalize(lower);
}

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('pl') + s.slice(1);
const isUpper = (word: string) => word === word.toLocaleUpperCase('pl') && word !== word.toLocaleLowerCase('pl');

/**
 * Nazwa w całości wersalikami — zmieniamy każde słowo. W nazwie mieszanej tylko dłuższe słowa
 * wersalikami („ORTOPEDIA” Spółka…), bo pojedyncze litery to tam inicjały (im. L. Zamenhofa).
 */
function titleCase(name: string, shouting: boolean): string {
  let first = true;
  return name.replace(/\p{L}+/gu, (word, offset: number) => {
    const isFirst = first;
    first = false;
    if (!isUpper(word) || (!shouting && word.length < 3)) return word;
    // „1920R.” → „1920r.”
    if (/\d/.test(name.charAt(offset - 1))) return word.toLocaleLowerCase('pl');
    return caseWord(word, isFirst, name.charAt(offset + word.length) === '.');
  });
}

export function prettyName(name: string): string {
  let out = name.replace(/\s+/g, ' ').trim();
  out = titleCase(out, isShouting(out));
  for (const [re, short] of LEGAL_FORMS) out = out.replace(re, short);
  return out
    .replace(/(?<!\p{L})(im|bł|św|ks|dr|prof|hab)\.(?=\p{L})/gu, '$1. ') // „im.dr” → „im. dr”
    .replace(/"([^"]+)"/g, '„$1”')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
