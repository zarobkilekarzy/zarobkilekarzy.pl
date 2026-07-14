import type { APIRoute } from 'astro';
import { ogPages } from '../lib/ogPages';

// llms.txt — kurowany, maszynowo-czytelny indeks strony dla modeli językowych
// i narzędzi agentowych (propozycja standardu llmstxt.org). Generowany w buildzie
// z tego samego źródła co obrazy OG (src/lib/ogPages.ts), więc nigdy nie rozjedzie
// się z treścią. Format: H1 + streszczenie w cytacie + sekcje z listą linków.
// Adopcja przez duże crawlery jest dziś niepewna — to tani, bezstratny bonus,
// nie główna dźwignia (tą jest czysty HTML SSG + dane strukturalne + źródła).

export const prerender = true;

const SITE = 'https://zarobkilekarzy.pl';

const url = (key: string) => `${SITE}/${key}/`;
const line = (key: string) => {
  const p = ogPages[key];
  return `- [${p.title}](${url(key)}): ${p.subtitle}`;
};

// Klucze w kolejności z ogPages (już zredagowanej: hub, potem podstrony),
// pogrupowane po pierwszym segmencie ścieżki.
const keys = Object.keys(ogPages).filter((k) => k !== 'home');
const inSection = (seg: string) => keys.filter((k) => k === seg || k.startsWith(`${seg}/`));
const TOP = ['dane', 'analizy', 'mechanizmy'];
const rest = keys.filter((k) => !TOP.some((s) => k === s || k.startsWith(`${s}/`)));

const body = `# zarobkilekarzy.pl

> Obywatelski watchdog jawności pieniędzy publicznych w ochronie zdrowia. Postulujemy jawny rejestr łącznego wynagrodzenia lekarzy ze środków publicznych, powiązany z numerem prawa wykonywania zawodu (PWZ) — nie z numerem PESEL ani danymi prywatnymi. Zasady redakcyjne: każda teza ma ogólnodostępne źródło, opisujemy mechanizmy, a nie osoby, a liczby cytujemy dokładnie. Nie jesteśmy antylekarscy — przeciwnikiem jest nieprzejrzystość, nie zawód i nie konkretna osoba.

## Dane
${inSection('dane').map(line).join('\n')}

## Analizy
${inSection('analizy').map(line).join('\n')}

## Mechanizmy
${inSection('mechanizmy').map(line).join('\n')}

## Projekt i działanie
${rest.map(line).join('\n')}
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
