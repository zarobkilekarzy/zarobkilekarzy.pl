// Pytania jednej sesji LEK jako statyczny JSON (/egzamin/dane/<sesja>.json),
// ładowany przez moduł /egzamin dopiero po wyborze sesji. Generowany w buildzie
// z src/data/egzamin-lek/*.json (normalizacja: research/narzedzia/cem_lek_normalizuj.py)
// — zero Functions; kompresję (brotli/gzip) robi brzeg Cloudflare.
import type { APIRoute, GetStaticPaths } from 'astro';

const pliki = import.meta.glob<{ default: unknown }>('../../../data/egzamin-lek/*.json', { eager: true });

export const getStaticPaths = (() =>
  Object.entries(pliki)
    .filter(([sciezka]) => !sciezka.endsWith('/index.json'))
    .map(([sciezka, modul]) => ({
      params: { sesja: sciezka.split('/').pop()!.replace(/\.json$/, '') },
      props: { dane: modul.default },
    }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(props.dane), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
