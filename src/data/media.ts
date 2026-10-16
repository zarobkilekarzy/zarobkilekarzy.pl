/**
 * /media/ — materiały medialne: infografiki do pobrania ze wszystkich zestawów
 * (lib/infografiki/zestawy.ts), pliki CSV z danymi (lib/media/dane.ts) i pakiet logo
 * (lib/media/logo.ts). Kolejność infografik na stronie = kolejność kluczy w `sets`.
 */
export const mediaPage = {
  href: '/media/',
  title: 'Materiały medialne',
  docTitle: 'Materiały medialne: infografiki, dane i logo do pobrania',
  /** <title> — docTitle jest za długi dla wyszukiwarki; docTitle zostaje w udostępnianiu */
  seoTitle: 'Materiały medialne: infografiki i dane',
  lead: 'Infografiki, dane i logo do artykułu, posta albo prezentacji. Liczby pochodzą z tych samych danych co teksty w serwisie, a źródła, adres strony i kod QR do niej są na każdej grafice.',
  description: 'Infografiki zarobkilekarzy.pl w formatach pionowym i poziomym, dane w plikach CSV i logo do pobrania, ze źródłami. Licencja CC BY 4.0.',
  updated: '16.10.2026',
  /** klucze zestawów infografik, od najnowszego */
  sets: ['odsiew-na-medycynie', 'pielegniarstwo-w-polsce', 'zadluzenie-szpitali', 'kolejki', 'english-division', 'symulator-podazy-lekarzy', 'egzamin', 'odpowiedzialnosc-zawodowa-lekarzy'],
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
