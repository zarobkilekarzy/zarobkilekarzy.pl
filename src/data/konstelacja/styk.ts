/**
 * „Na styku polityki i ochrony zdrowia” (/konstelacja/na-styku/) — ranking powiązań, kariery i dwie role naraz,
 * liczone z grafu konstelacji (graf.json). Tu: przypisanie węzłów do sektorów, wagi punktów, sprawy i funkcje zapisane
 * przy osobach (`roles[]`), które trzeba ręcznie przypisać do sektora. Logika: src/lib/konstelacja/styk.ts.
 *
 * Nowy węzeł instytucji w grafie → dopisz go do ORG_SECTOR (inaczej funkcje w nim nie liczą się do rankingu).
 */

export type Sector = 'rzad' | 'parlament' | 'prezydent' | 'polityka' | 'samorzad' | 'zwiazki' | 'pracodawcy' | 'podmioty';
/** Grupa sektorów: władza publiczna, polityka lokalna, organizacje reprezentujące interes, podmioty z pieniędzmi */
export type Group = 'wladza' | 'polityka' | 'repr' | 'pieniadze';

export const SECTORS: Record<Sector, { label: string; group: Group }> = {
  rzad: { label: 'Rząd i agencje', group: 'wladza' },
  parlament: { label: 'Parlament', group: 'wladza' },
  prezydent: { label: 'Prezydent', group: 'wladza' },
  polityka: { label: 'Polityka lokalna', group: 'polityka' },
  samorzad: { label: 'Samorząd zawodowy', group: 'repr' },
  zwiazki: { label: 'Związki zawodowe', group: 'repr' },
  pracodawcy: { label: 'Pracodawcy', group: 'repr' },
  podmioty: { label: 'Szpitale, przychodnie, firmy', group: 'pieniadze' },
};

/** Węzeł instytucji albo organu → sektor. Węzły `entity` (szpitale, spółki) są zawsze w sektorze „podmioty”. */
export const ORG_SECTOR: Record<string, Sector> = {
  mz: 'rzad', nfz: 'rzad', aotmit: 'rzad', cmkp: 'rzad', 'rada-taryfikacji': 'rzad', 'rada-naukowa-mz': 'rzad',
  mf: 'rzad', kprm: 'rzad', zus: 'rzad', mc: 'rzad', mnisw: 'rzad', msz: 'rzad', gif: 'rzad', gis: 'rzad',
  muw: 'rzad', 'uw-suwalki': 'rzad', 'suw-kielce': 'rzad',
  'nizp-pzh': 'rzad', imid: 'rzad', ikard: 'rzad', nio: 'rzad', abm: 'rzad', mrkch: 'rzad', unuz: 'rzad',
  sejm: 'parlament', senat: 'parlament', 'sejm-zdr': 'parlament', 'senat-kz': 'parlament', pe: 'parlament',
  prezydent: 'prezydent', 'rada-zdrowia': 'prezydent',
  nil: 'samorzad', nrl: 'samorzad', 'nrl-prezydium': 'samorzad', 'oil-warszawa': 'samorzad', 'oil-lublin': 'samorzad', 'oil-wielkopolska': 'samorzad',
  'nil-in': 'samorzad', nsl: 'samorzad', nroz: 'samorzad', 'osl-warszawa': 'samorzad', cermed: 'samorzad',
  'fundacja-pro-seniore': 'samorzad', cpme: 'samorzad', ptp: 'samorzad', ptfe: 'samorzad',
  ozzl: 'zwiazki', 'pr-ozzl': 'zwiazki', ozzpip: 'zwiazki', 'komitet-protestacyjny-2021': 'zwiazki', 'zespol-trojstronny': 'zwiazki', pck: 'zwiazki',
  ozpsp: 'pracodawcy', pz: 'pracodawcy', pzm: 'pracodawcy', pfsz: 'pracodawcy',
  'odnowa-rp': 'polityka', 'rm-dabrowa-gornicza': 'polityka', 'rada-powiatu-sokolowskiego': 'polityka', 'rm-ciechanow': 'polityka',
  'sejmik-slaski': 'polityka', 'sejmik-podlaski': 'polityka', 'sejmik-suwalski': 'polityka', 'sejmik-mazowiecki': 'polityka',
  'sejmik-lubelski': 'polityka', 'starostwo-malbork': 'polityka', umwp: 'polityka', umwpd: 'polityka', 'um-chorzow': 'polityka',
};

/**
 * Funkcje zapisane przy osobie (`roles[]`, indeks w tablicy) → sektor. Brak wpisu = to nie funkcja (dochód, zarzut,
 * postulat). `oswiad` — znany tylko stan z oświadczenia majątkowego za rok; `uncertain` — aktualności nie sprawdzono.
 */
export const INLINE: Record<string, { s: Sector; org: string; since?: string; until?: string; oswiad?: boolean; uncertain?: boolean }> = {
  'klaudiusz-komor#0': { s: 'polityka', org: 'Rada Miejska Bielska-Białej' },
  'klaudiusz-komor#1': { s: 'samorzad', org: 'Beskidzka Izba Lekarska' },
  'agnieszka-gorgon-komor#0': { s: 'samorzad', org: 'Beskidzka Izba Lekarska', since: '2013', uncertain: true },
  'marta-golbik#0': { s: 'podmioty', org: 'gabinety psychologiczne', since: '2025', until: '2025-12-31', oswiad: true },
  'katarzyna-sojka#0': { s: 'podmioty', org: 'SP ZOZ w Mikstacie', since: '2025', until: '2025-12-31', oswiad: true },
  'boleslaw-piecha#0': { s: 'podmioty', org: 'Szpital nr 3 w Rybniku', since: '1997', until: '2001' },
  'czeslaw-hoc#0': { s: 'podmioty', org: 'Szpital w Kołobrzegu', since: '2025', until: '2025-12-31', oswiad: true },
  'anna-dabrowska-banaszek#0': { s: 'podmioty', org: 'własna praktyka', since: '2025', until: '2025-12-31', oswiad: true },
  'radoslaw-lubczyk#0': { s: 'podmioty', org: 'własny gabinet', since: '2025', until: '2025-12-31', oswiad: true },
  'waldemar-kraska#0': { s: 'podmioty', org: 'własna praktyka', since: '2025', until: '2025-12-31', oswiad: true },
  'waldemar-kraska#1': { s: 'podmioty', org: 'SPZOZ Sokołów Podlaski', since: '2004', uncertain: true },
  'waldemar-kraska#2': { s: 'podmioty', org: 'RM Meditrans Siedlce', since: '2025', until: '2025-12-31', oswiad: true },
  'tomasz-grodzki#0': { s: 'rzad', org: 'konsultant krajowy', since: '2014', uncertain: true },
  'andrzej-kalata#0': { s: 'podmioty', org: 'Centrum Pulmonologii w Bystrej', since: '2016-06-30', until: '2023-04-14' },
  'pawel-barucha#0': { s: 'podmioty', org: 'SPZOZ MSWiA Kielce', since: '2020-07-28' },
  'piotr-winciunas#0': { s: 'podmioty', org: 'Szpital Okulistyczny', since: '2023-03-15' },
  'wojciech-domka#0': { s: 'podmioty', org: 'SPZOZ MSWiA Rzeszów', since: '2019-03-19' },
  'artur-drobniak#0': { s: 'podmioty', org: 'Feminature', since: '2020-05-20', until: '2024-12-19' },
  'artur-drobniak#1': { s: 'podmioty', org: 'Szpital Kliniczny ks. Anny Mazowieckiej', since: '2022-12-29' },
  'artur-drobniak#2': { s: 'podmioty', org: 'Braster S.A.', since: '2022-05-04' },
  'jakub-banaszek#0': { s: 'polityka', org: 'prezydent Chełma' },
  'waldemar-malinowski#0': { s: 'podmioty', org: 'Jaworskie Centrum Medyczne', since: '2013-03', uncertain: true },
  'anna-kowalczuk#0': { s: 'rzad', org: 'Agencja Badań Medycznych', since: '2026-03-23' },
  'anna-kowalczuk#1': { s: 'podmioty', org: 'AstraZeneca', since: '2022', until: '2024', uncertain: true },
};

/** Sprawy = widoki konstelacji (pole `views` w grafie), pogrupowane tematycznie. */
export const CASES: { id: string; label: string; views: string[] }[] = [
  { id: 'limity', label: 'Ustawa o limitach płac 2026', views: ['ustawa', 'przeciw'] },
  { id: 'dawid', label: 'Sprawa Dawida K.', views: ['dawid-k'] },
  { id: 'podwyzki', label: 'Ustawa podwyżkowa 2017–2022', views: ['podwyzki', 'podwyzki-naciski'] },
  { id: 'drzwi', label: 'Kierownictwo MZ — dokąd dalej', views: ['drzwi'] },
  { id: 'samorzad', label: 'Samorząd lekarski a MZ', views: ['samorzad'] },
  { id: 'dochody', label: 'Parlamentarzyści z dochodami w ochronie zdrowia', views: ['dochody'] },
];

/** Składniki wyniku: jawne wagi, opisane na stronie. */
export const COMPONENTS = [
  { key: 'wladza', label: 'Władza publiczna', weight: '3 za pierwszy urząd w sektorze, 1 za kolejny', color: 'var(--blue)' },
  { key: 'partia', label: 'Partia, polityka lokalna', weight: '2', color: 'var(--seq-0)' },
  { key: 'pieniadze', label: 'Szpitale, przychodnie, firmy', weight: '2 za podmiot', color: 'var(--ink)' },
  { key: 'repr', label: 'Samorząd, związki, pracodawcy', weight: '1 za organizację', color: 'var(--chart)' },
  { key: 'przejscia', label: 'Przejścia między sektorami', weight: '2 za przejście', color: 'var(--blue-700)' },
  { key: 'naraz', label: 'Dwie role naraz', weight: '3 za parę z urzędem, 1 bez urzędu', color: 'var(--amber)' },
  { key: 'glos', label: 'Głos przy drugiej roli', weight: '2 za ustawę', color: 'repeating-linear-gradient(135deg, var(--amber) 0 3px, var(--bg) 3px 5px)' },
  { key: 'osoby', label: 'Osoby i sprawy', weight: '1', color: 'var(--chart-soft)' },
] as const;
export type ComponentKey = (typeof COMPONENTS)[number]['key'];
export const WEIGHTS: Record<ComponentKey, number> = { wladza: 3, partia: 2, pieniadze: 2, repr: 1, przejscia: 2, naraz: 3, glos: 2, osoby: 1 };

/** Teksty strony */
export const stykPage = {
  title: 'Na styku polityki i ochrony zdrowia',
  seoTitle: 'Na styku polityki i ochrony zdrowia — kto łączy najwięcej funkcji',
  eyebrow: 'Konstelacja ochrony zdrowia · ranking powiązań',
  lead:
    'Kto łączy najwięcej funkcji: w rządzie, parlamencie, samorządzie lekarskim, związkach i w podmiotach, które żyją z pieniędzy NFZ. Wynik to suma faktów z dokumentów, nie ocena. Każdy punkt da się rozwinąć do funkcji, daty i źródła.',
  description:
    'Ranking powiązań osób z „Konstelacji ochrony zdrowia”: funkcje publiczne, przejścia między sektorami i role pełnione jednocześnie, z datami i źródłami.',
};
