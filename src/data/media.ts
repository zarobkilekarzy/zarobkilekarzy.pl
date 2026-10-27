/**
 * /media/ — materiały medialne: filmy (src/data/film.ts), infografiki do pobrania ze wszystkich zestawów
 * (lib/infografiki/zestawy.ts), pliki CSV z danymi (lib/media/dane.ts) i pakiet logo
 * (lib/media/logo.ts). Kolejność infografik na stronie = kolejność kluczy w `sets`.
 */
export const mediaPage = {
  href: '/media/',
  title: 'Materiały medialne',
  docTitle: 'Materiały medialne: filmy, infografiki, dane i logo do pobrania',
  /** <title> — docTitle jest za długi dla wyszukiwarki; docTitle zostaje w udostępnianiu */
  seoTitle: 'Materiały medialne: filmy i infografiki',
  lead: 'Filmy, infografiki, dane i logo do artykułu, posta albo prezentacji. Liczby pochodzą z tych samych danych co teksty w serwisie, a źródła, adres strony i kod QR do niej są na każdej grafice.',
  description: 'Filmy zarobkilekarzy.pl, infografiki w formatach pionowym i poziomym, dane w plikach CSV i logo do pobrania, ze źródłami. Licencja CC BY 4.0.',
  updated: '27.10.2026',
  /**
   * „Historia zmian” pod przeglądarką infografik: poprawki w grafikach, które już były do pobrania
   * (nie nowe grafiki). Zapis wpisu: lib/inline.
   */
  infographicsChangelog: [
    {
      date: new Date('2026-10-27'),
      text: 'Grafiki [„Pieniądze rosną. Kolejka nie maleje.”](/dane/budzet-nfz/#pieniadze-a-kolejka) i kolejki do specjalistów: zestawienie „Pieniądze a kolejka” jest teraz częścią [Budżetu NFZ i kolejek](/dane/budzet-nfz/), więc kod QR i podpis strony prowadzą tam. Pliki mają nowy adres, stare przekierowują. Liczby bez zmian.',
    },
    {
      date: new Date('2026-10-21'),
      text: 'Tabela [„Ilu lekarzom odebrano prawo do zawodu”](/analizy/odpowiedzialnosc-zawodowa-lekarzy/) rok po roku: bez małych pasków przy liczbach — zostały same liczby. Porównanie skali pokazuje druga grafika z tego zestawu.',
    },
    {
      date: new Date('2026-10-21'),
      text: 'Tabela [„Ilu lekarzom odebrano prawo do zawodu”](/analizy/odpowiedzialnosc-zawodowa-lekarzy/) rok po roku: wiersz „Na 100 tys.” ma pełny podpis „Na 100 tys. lekarzy” — wskaźnik jest liczony na 100 tys. lekarzy w danym kraju, nie mieszkańców. Liczby bez zmian.',
    },
  ],
  /** klucze zestawów infografik, od najnowszego */
  sets: ['studia-lekarskie', 'film-doba', 'reglamentacja-dostepu', 'nil-a-kontrakty-lekarskie', 'odsiew-na-medycynie', 'pielegniarstwo-w-polsce', 'zadluzenie-szpitali', 'budzet-nfz', 'english-division', 'symulator-podazy-lekarzy', 'egzamin', 'odpowiedzialnosc-zawodowa-lekarzy'],
  film: {
    lead: 'Filmy w formacie 16:9, z lektorem. Pasują do posta na X albo Facebooku i do prezentacji. Źródło każdej liczby jest w stopce kadru i w napisach pod filmem. Licencja CC BY 4.0, jak cały serwis.',
  },
  data: {
    title: 'Dane do pobrania',
    lead: 'Pliki CSV z tych samych modułów danych co teksty i infografiki. Separator to średnik, liczby mają przecinek dziesiętny, kodowanie UTF-8 — plik otwiera się od razu w polskim Excelu. Źródło pierwotne jest w każdym wierszu albo w opisie pliku.',
  },
  logo: {
    title: 'Logo',
    lead: 'Logo na jasne i na ciemne tło oraz sam znak. W SVG tekst jest zamieniony na krzywe, więc plik nie wymaga fontów; PNG ma przezroczyste tło.',
    /** lista pod nagłówkiem „Przy używaniu logo prosimy:” */
    rules: [
      'nie zmieniać kolorów, proporcji ani kroju liter;',
      'zostawić wokół logo pusty margines co najmniej połowy wysokości znaku;',
      'używać go jako oznaczenia źródła — nie tak, by sugerowało, że serwis współtworzył lub popiera Twój materiał.',
    ],
  },
};
