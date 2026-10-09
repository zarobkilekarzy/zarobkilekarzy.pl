// Wariant karty OG dla /egzamin (egzamin LEK/LDEK na jawnej bazie CEM). Drugi — po /gra —
// wyłom ze wspólnego szablonu, bo to narzędzie, nie analiza: karta pokazuje „arkusz"
// z prawdziwym pytaniem i rozkładem odpowiedzi zdających. Marka trzyma się na stałych:
// czerwony border z lewej, logo + domena u góry, granat tła.
//
// RZETELNOŚĆ: rozkład odpowiedzi na karcie jest prawdziwy — liczony w buildzie ze statystyk
// CEM konkretnego pytania (src/data/egzamin-lek/). Treści pytania nie pokazujemy (nie zmieści się czytelnie), tylko jego
// numer i sesję, więc każdy może je odnaleźć w bazie.
import { el, logo, type Node } from './ogCard';
import type { OgPage } from './ogPages';
import indeks from '../data/egzamin-lek/index.json';

interface Pyt { nr: number; o: number | null; p: number[] | null; tr: number | null }
const sesjeDane = import.meta.glob<{ default: { sesja: string; nazwa: string; pytania: Pyt[] } }>('../data/egzamin-lek/*.json', { eager: true });

const LITERY = 'ABCDE';
const proc = (n: number) => n.toLocaleString('pl-PL', { maximumFractionDigits: 1 });

/** Pytanie na kartę: najnowsza pełna sesja LEK, pierwsze pytanie, przy którym sala się podzieliła
 *  (poprawnie 45–70% i mocny dystraktor) — rozkład jest wtedy ciekawy, a wybór deterministyczny. */
function przyklad() {
  const sesja = indeks.typy.LEK.sesje.find((s) => s.pelna);
  if (!sesja) return null;
  const dane = Object.values(sesjeDane).find((m) => m.default.sesja === sesja.sesja)?.default;
  if (!dane) return null;
  const q = dane.pytania.find((x) => x.o !== null && x.p && x.p[x.o] >= 45 && x.p[x.o] <= 70 && Math.max(...x.p.filter((_, i) => i !== x.o)) >= 20)
    ?? dane.pytania.find((x) => x.o !== null && x.p);
  return q && q.p && q.o !== null ? { nr: q.nr, o: q.o, p: q.p, nazwa: `LEK ${dane.nazwa}` } : null;
}

export function egzaminTemplate(p: OgPage): Node {
  const q = przyklad();

  const arkusz: Node[] = q
    ? [
        el({ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '22px' }, [
          el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '22px', color: '#9fb0cc' }, `Pytanie nr ${q.nr}`),
          el({ display: 'flex', fontSize: '19px', color: '#7f93ad' }, q.nazwa),
        ]),
        ...q.p.map((v, i) => {
          const ok = i === q.o;
          return el({ display: 'flex', alignItems: 'center', marginBottom: '14px' }, [
            el({
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '10px',
              fontFamily: 'Plex Mono', fontSize: '22px', fontWeight: 600, marginRight: '16px',
              background: ok ? '#2f7a34' : '#1c2a40', color: ok ? '#ffffff' : '#9fb0cc', border: ok ? '2px solid #5cbf74' : '2px solid #2c3d57',
            }, LITERY[i]),
            el({ display: 'flex', flexGrow: 1, height: '16px', borderRadius: '8px', background: '#1c2a40', marginRight: '16px' }, [
              el({ display: 'flex', width: `${Math.max(1.5, v)}%`, height: '16px', borderRadius: '8px', background: ok ? '#5cbf74' : '#4a6a96' }),
            ]),
            el({ display: 'flex', width: '82px', justifyContent: 'flex-end', fontFamily: 'Plex Mono', fontSize: '22px', color: ok ? '#ffffff' : '#9fb0cc' }, `${proc(v)}%`),
          ]);
        }),
        el({ display: 'flex', fontSize: '18px', color: '#8aa0b6', marginTop: '10px' }, 'tak odpowiadali zdający — dane CEM'),
      ]
    : [];

  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: '#14233a', color: '#ffffff', padding: '50px 64px 46px 72px',
      fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e',
      backgroundImage: 'radial-gradient(circle at 85% 40%, #1d3a5f 0%, #14233a 55%)',
    },
    [
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '27px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      // paddingBottom: arkusz nie może dotykać linii stopki.
      el({ display: 'flex', flexGrow: 1, alignItems: 'center', paddingBottom: '30px' }, [
        // Lewa kolumna: wezwanie i zasady egzaminu
        // Szerokości jawne: obszar treści to 1048 px (1200 − border 16 − padding 72/64); satori
        // nie zwęża sam kolumny z flexGrow, więc bez tego arkusz wychodził poza kadr.
        el({ display: 'flex', flexDirection: 'column', width: '470px', marginRight: '40px' }, [
          el({ display: 'flex', fontSize: '22px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '18px' }, p.tag),
          el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '68px', lineHeight: 1.04, color: '#ffffff' }, p.title),
          el({ display: 'flex', fontSize: '26px', lineHeight: 1.38, color: '#aebccb', marginTop: '18px' }, p.subtitle),
          el({ display: 'flex', marginTop: '24px' }, [
            ...[['200', 'pytań'], ['4 h', 'czasu'], ['56%', 'próg']].map(([a, b]) =>
              el({ display: 'flex', flexDirection: 'column', marginRight: '34px' }, [
                el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '40px', color: '#ffffff' }, a),
                el({ display: 'flex', fontSize: '19px', color: '#8aa0b6' }, b),
              ])),
          ]),
        ]),
        // Prawa kolumna: „arkusz" z prawdziwym pytaniem
        el({
          display: 'flex', flexDirection: 'column', width: '538px', padding: '26px 28px 20px',
          background: '#0f1b2e', border: '2px solid #2c3d57', borderRadius: '18px',
        }, arkusz),
      ]),
      el({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '22px', borderTop: '1px solid #2c3d57', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, 'Egzamin LEK i LDEK online — za darmo, bez rejestracji'),
        el({ display: 'flex', fontFamily: 'Plex Mono', color: '#6ea8e6' }, 'zarobkilekarzy.pl/egzamin'),
      ]),
    ],
  );
}
