// Wariant karty OG dla /egzamin (egzamin LEK/LDEK na jawnej bazie CEM). Drugi — po /gra —
// wyłom ze wspólnego szablonu, bo to narzędzie, nie analiza: karta pokazuje „arkusz"
// z prawdziwym pytaniem i rozkładem odpowiedzi zdających. Marka trzyma się na stałych:
// czerwony pas u góry, logo + domena, granat tła.
//
// RZETELNOŚĆ: rozkład odpowiedzi na karcie jest prawdziwy — liczony w buildzie ze statystyk
// CEM konkretnego pytania (src/data/egzamin-lek/). Treści pytania nie pokazujemy (nie zmieści się czytelnie), tylko jego
// numer i sesję, więc każdy może je odnaleźć w bazie.
import { el, logo, topBand, OG, sierotki, type Node } from './ogCard';
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
          el({ display: 'flex', fontSize: '22px', fontWeight: 600, color: OG.soft }, `Pytanie nr ${q.nr}`),
          el({ display: 'flex', fontSize: '19px', color: OG.faint }, q.nazwa),
        ]),
        ...q.p.map((v, i) => {
          const ok = i === q.o;
          return el({ display: 'flex', alignItems: 'center', marginBottom: '14px' }, [
            el({
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px',
              fontSize: '22px', fontWeight: 600, marginRight: '16px',
              background: ok ? '#2f7a34' : '#123566', color: ok ? '#ffffff' : OG.soft, border: ok ? '2px solid #5cbf74' : `2px solid ${OG.rule}`,
            }, LITERY[i]),
            el({ display: 'flex', flexGrow: 1, height: '16px', background: '#123566', marginRight: '16px' }, [
              el({ display: 'flex', width: `${Math.max(1.5, v)}%`, height: '16px', background: ok ? '#5cbf74' : '#5b80c4' }),
            ]),
            el({ display: 'flex', width: '82px', justifyContent: 'flex-end', fontSize: '22px', fontWeight: ok ? 600 : 400, color: ok ? '#ffffff' : OG.soft }, `${proc(v)}%`),
          ]);
        }),
        el({ display: 'flex', fontSize: '18px', color: OG.faint, marginTop: '10px' }, 'tak odpowiadali zdający — dane CEM'),
      ]
    : [];

  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: OG.bg, color: OG.ink, padding: '50px 64px 46px 72px',
      fontFamily: 'Archivo',
    },
    [
      topBand(1200, 10),
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontSize: '27px', fontWeight: 600, color: OG.soft }, 'zarobkilekarzy.pl'),
      ]),
      // paddingBottom: arkusz nie może dotykać linii stopki.
      el({ display: 'flex', flexGrow: 1, alignItems: 'center', paddingBottom: '30px' }, [
        // Lewa kolumna: wezwanie i zasady egzaminu
        // Szerokości jawne: obszar treści to 1064 px (1200 − padding 72/64); satori
        // nie zwęża sam kolumny z flexGrow, więc bez tego arkusz wychodził poza kadr.
        el({ display: 'flex', flexDirection: 'column', width: '486px', marginRight: '40px' }, [
          el({ display: 'flex', fontSize: '26px', fontWeight: 600, color: OG.link, marginBottom: '14px' }, p.tag),
          el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: '62px', lineHeight: 1.02, letterSpacing: '-0.5px', color: OG.ink }, sierotki(p.title)),
          el({ display: 'flex', fontSize: '26px', lineHeight: 1.38, color: OG.soft, marginTop: '18px' }, sierotki(p.subtitle)),
          el({ display: 'flex', marginTop: '24px' }, [
            ...[['200', 'pytań'], ['4 h', 'czasu'], ['56%', 'próg']].map(([a, b]) =>
              el({ display: 'flex', flexDirection: 'column', marginRight: '34px' }, [
                el({ display: 'flex', fontFamily: 'Archivo Wide', fontWeight: 800, fontSize: '40px', color: OG.ink }, a),
                el({ display: 'flex', fontSize: '19px', color: OG.faint }, b),
              ])),
          ]),
        ]),
        // Prawa kolumna: „arkusz" z prawdziwym pytaniem
        el({
          display: 'flex', flexDirection: 'column', width: '538px', padding: '26px 28px 20px',
          background: '#08224d', border: `2px solid ${OG.rule}`,
        }, arkusz),
      ]),
      el({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '22px', borderTop: `1px solid ${OG.rule}`, color: OG.faint, fontSize: '22px' }, [
        el({ display: 'flex' }, 'Egzamin LEK i LDEK online — za darmo, bez rejestracji'),
        el({ display: 'flex', fontWeight: 600, color: OG.link }, 'zarobkilekarzy.pl/egzamin'),
      ]),
    ],
  );
}
