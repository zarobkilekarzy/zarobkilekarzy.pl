/**
 * Adresaci narzędzia „Napisz do polityka” (/dzialaj/#napisz) — jedno źródło: adresaci.json.
 *
 * Plik JSON to kopia listy zweryfikowanej 16.10.2026 (każdy adres odczytany dosłownie z oficjalnego
 * źródła — API Sejmu, profil na senat.gov.pl, gov.pl/BIP, strona partii; pole `zrodlo` przy każdym
 * wpisie). Odświeżenie: podmień `osoby` i `stan_na` w JSON-ie, zostaw bez nazwisk funkcje biur partii.
 * Wpisy ze `status: "niepotwierdzony"` zostają w pliku jako ślad weryfikacji, ale strona ich nie pokazuje.
 */
import raw from './adresaci.json';

/** Rodzaj gramatyczny adresata: kobieta, mężczyzna, instytucja (zwrot „Szanowni Państwo”). */
export type Rodzaj = 'k' | 'm' | 'inst';

export type Kat =
  | 'urzad'
  | 'sejm-prezydium'
  | 'sejm-komisja-zdrowia'
  | 'sejm-liderzy'
  | 'sejm-kluby'
  | 'senat-prezydium'
  | 'senat-komisja-zdrowia'
  | 'senat-pozostali'
  | 'partia-biuro';

export interface Adresat {
  id: string;
  /** imię i nazwisko albo nazwa instytucji (mianownik) */
  osoba: string;
  funkcja: string;
  /** klub, koło lub partia; przy urzędach „urząd” */
  grupa: string;
  izba: 'Urząd' | 'Sejm' | 'Senat' | 'Partia';
  kat: Kat;
  email: string;
  /** strona, z której odczytano adres */
  zrodlo: string;
  rodzaj: Rodzaj;
  status?: 'niepotwierdzony';
}

interface AdresaciFile {
  stan_na: string;
  zrodlo_zasada: string;
  osoby: Adresat[];
}

const file = raw as AdresaciFile;

/** Dzień, z którego pochodzi lista (do zdania „stan na …”). */
export const stanNa = new Date(file.stan_na);

/**
 * Grupy w narzędziu, w kolejności wyboru. `chamber` — wiersz przełącznika, `label` — przycisk,
 * `heading` — nagłówek listy (bez JS widać wszystkie grupy naraz). `kats` — kategorie z pliku.
 * Kluby: przewodniczący klubów i kół razem ze skrzynkami klubów.
 */
export const groups = [
  { id: 'urzedy', chamber: 'Urzędy', label: 'Urzędy i instytucje', heading: 'Urzędy i instytucje', kats: ['urzad'] },
  { id: 'sejm-prezydium', chamber: 'Sejm', label: 'Prezydium', heading: 'Sejm: Prezydium', kats: ['sejm-prezydium'] },
  { id: 'sejm-komisja-zdrowia', chamber: 'Sejm', label: 'Komisja Zdrowia', heading: 'Sejm: Komisja Zdrowia', kats: ['sejm-komisja-zdrowia'] },
  { id: 'sejm-kluby', chamber: 'Sejm', label: 'Kluby i koła', heading: 'Sejm: kluby i koła', kats: ['sejm-liderzy', 'sejm-kluby'] },
  { id: 'senat-prezydium', chamber: 'Senat', label: 'Prezydium', heading: 'Senat: Prezydium', kats: ['senat-prezydium'] },
  { id: 'senat-komisja-zdrowia', chamber: 'Senat', label: 'Komisja Zdrowia', heading: 'Senat: Komisja Zdrowia', kats: ['senat-komisja-zdrowia'] },
  { id: 'senat-pozostali', chamber: 'Senat', label: 'Pozostali', heading: 'Senat: pozostali senatorowie', kats: ['senat-pozostali'] },
  { id: 'partie', chamber: 'Partie', label: 'Biura krajowe', heading: 'Biura krajowe partii', kats: ['partia-biuro'] },
] as const satisfies readonly { id: string; chamber: string; label: string; heading: string; kats: readonly Kat[] }[];

export type GroupId = (typeof groups)[number]['id'];

/** Grupa wybrana na starcie: projekt potrzebuje podpisów posłów, a o zdrowiu w Sejmie decyduje ta komisja. */
export const defaultGroup: GroupId = 'sejm-komisja-zdrowia';

/** Adresaci do pokazania — bez wpisów niepotwierdzonych. */
export const adresaci: Adresat[] = file.osoby.filter((a) => a.status !== 'niepotwierdzony');

/** Adresaci jednej grupy w kolejności z pliku (prezydium: marszałek pierwszy, komisja: przewodnicząca pierwsza). */
export const inGroup = (id: GroupId) => {
  const kats: readonly Kat[] = groups.find((g) => g.id === id)!.kats;
  return adresaci.filter((a) => kats.includes(a.kat));
};

/**
 * Zwrot grzecznościowy z funkcji, izby i rodzaju. Marszałkowie i wicemarszałkowie obu izb —
 * „Panie Marszałku” / „Pani Marszałek”; posłowie i senatorowie — według izby; urzędy, kluby
 * i partie — „Szanowni Państwo”.
 */
export function greeting(a: Pick<Adresat, 'funkcja' | 'izba' | 'rodzaj'>): string {
  if (a.rodzaj === 'inst') return 'Szanowni Państwo';
  const k = a.rodzaj === 'k';
  if (/^(wice)?marsza/i.test(a.funkcja)) return k ? 'Szanowna Pani Marszałek' : 'Szanowny Panie Marszałku';
  if (a.izba === 'Sejm') return k ? 'Szanowna Pani Posłanko' : 'Szanowny Panie Pośle';
  if (a.izba === 'Senat') return k ? 'Szanowna Pani Senator' : 'Szanowny Panie Senatorze';
  return 'Szanowni Państwo';
}

/** Podpis grupy przy osobie (klub, koło) — przy urzędach i biurach partii pusty, bo powtarzałby nazwę. */
export const affiliation = (a: Adresat) => (a.kat === 'urzad' || a.kat === 'partia-biuro' ? '' : a.grupa);
