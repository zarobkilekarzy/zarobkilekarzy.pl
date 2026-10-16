/**
 * Rejestr ikon — jedno źródło prawdy dla sprite'a (ui/Sprite.astro)
 * i typu nazw ikon (ui/Icon.astro). Nowa ikona = nowy wpis tutaj.
 * Wszystkie w siatce 24×24, obrys 1.5 px, kolor z `currentColor`.
 */
const stroke = 'fill="none" stroke="currentColor" stroke-width="1.5"';

export const icons = {
  arrow: `<path d="M4 12h15M13 6l6 6-6 6" ${stroke} stroke-linecap="square"/>`,
  'arrow-ne': `<path d="M7 17 17 7M8 7h9v9" ${stroke} stroke-linecap="square"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6.5" ${stroke}/><path d="m15.5 15.5 5 5" ${stroke} stroke-linecap="square"/>`,
  menu: `<path d="M3 7h18M3 12h18M3 17h18" ${stroke}/>`,
  close: `<path d="m5 5 14 14M19 5 5 19" ${stroke}/>`,
  check: `<path d="m4.5 12.5 5 5 10-11" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square"/>`,
  db: `<ellipse cx="12" cy="6" rx="7" ry="3" ${stroke}/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" ${stroke}/>`,
  doc: `<path d="M6 3h8l4 4v14H6z" ${stroke}/><path d="M14 3v4h4M9 12h6M9 16h6" ${stroke}/>`,
  print: `<path d="M7 9V3h10v6M7 17H4V9h16v8h-3" ${stroke}/><path d="M7 14h10v7H7z" ${stroke}/>`,
  pin: `<path d="M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" ${stroke}/><circle cx="12" cy="9.5" r="2.25" ${stroke}/>`,
  chart: `<path d="M4 20V4M4 20h16" ${stroke}/><path d="m7 15 4-5 3 3 5-7" ${stroke}/>`,
  'arrow-left': `<path d="M20 12H5M11 6l-6 6 6 6" ${stroke} stroke-linecap="square"/>`,
  flag: `<path d="M5.5 21V3.5M5.5 4.5h12l-2.75 4.25L17.5 13h-12" ${stroke}/>`,
  pencil: `<path d="M4 20h4.5L19.5 9 15 4.5 4 15.5z" ${stroke}/><path d="m12.5 7 4.5 4.5" ${stroke}/>`,
  grid: `<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" ${stroke}/>`,
  pause: `<path d="M8.5 5v14M15.5 5v14" ${stroke}/>`,
  play: `<path d="M7 4.5v15L19 12z" ${stroke} stroke-linejoin="round"/>`,
  expand: `<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ${stroke}/>`,
  clock: `<circle cx="12" cy="12" r="8.5" ${stroke}/><path d="M12 7.5V12l3 2" ${stroke}/>`,
  alert: `<path d="M12 3.5 21.5 20h-19z" ${stroke} stroke-linejoin="round"/><path d="M12 10v4.5M12 16.25v1.5" ${stroke}/>`,
  info: `<circle cx="12" cy="12" r="8.5" ${stroke}/><path d="M12 10.5v6M12 7.25v1.5" ${stroke}/>`,
  'text-size': `<path d="M3 19 8 6l5 13M4.9 14.5h6.2M14 19l3.5-9 3.5 9M15.15 16h4.7" ${stroke}/>`,
  keyboard: `<rect x="2.5" y="6" width="19" height="12" ${stroke}/><path d="M6 10h1M9.5 10h1M13 10h1M16.5 10h1M7 14h10" ${stroke}/>`,
  refresh: `<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4h-4" ${stroke}/>`,
  phone: `<path d="M8.5 3.5h-4v2c0 8.3 6.7 15 15 15h1v-4l-4.5-1.5-2 2a12 12 0 0 1-6-6l2-2z" ${stroke} stroke-linejoin="round"/>`,
  mail: `<path d="M3 5.5h18v13H3z" ${stroke}/><path d="m3.5 6 8.5 7 8.5-7" ${stroke}/>`,
  shield: `<path d="M12 3 19.5 6v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" ${stroke} stroke-linejoin="round"/><path d="m8.75 12 2.25 2.25 4.25-4.5" ${stroke}/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" ${stroke}/>`,
  share: `<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" ${stroke} stroke-linecap="square"/><path d="M8.5 11H5v9.5h14V11h-3.5" ${stroke}/>`,
  moon: `<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" ${stroke} stroke-linejoin="round"/>`,
  sun: `<circle cx="12" cy="12" r="4" ${stroke}/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.28 5.28l1.77 1.77M16.95 16.95l1.77 1.77M5.28 18.72l1.77-1.77M16.95 7.05l1.77-1.77" ${stroke}/>`,
  // Znak „Puls” — stałe kolory w obu trybach: kobalt i biały zapis EKG
  // od krawędzi do krawędzi, ostre łączenia. Ta sama geometria: public/favicon.svg, lib/seo/icon-maskable.svg.
  logo: `<rect width="24" height="24" fill="#2664EC"/><path d="M0 14H7.5L10 5.5 13.5 18.5 15.5 14H24" fill="none" stroke="#fff" stroke-width="2" stroke-miterlimit="5"/>`,
} as const;

export type IconName = keyof typeof icons;
