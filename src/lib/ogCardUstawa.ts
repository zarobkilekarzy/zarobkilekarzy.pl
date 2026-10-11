// Wariant karty OG dla projektu nowelizacji art. 27a (/projekt-nowelizacji).
// Trzeci — po /gra i /egzamin — wyłom ze wspólnego szablonu: karta pokazuje „kartkę" z art. 27a,
// na której dwa nowe punkty projektu (ust. 1a oraz ust. 5–7) są wyróżnione jak wstawki w tekście,
// który już obowiązuje. To jest sedno przekazu: nie nowa ustawa, tylko dopisek do istniejącej.
// Marka trzyma się na stałych: czerwony border z lewej, logo + domena u góry, granat tła.
//
// Waga Temidy i rama kartki rysowane WYŁĄCZNIE odcinkami prostymi — ten sam język co logo i tło
// EKG (zob. ogCard.ts: „żadnych krzywych"). Waga jest w równowadze celowo: projekt waży jawność
// pieniądza publicznego i prywatność osób, nie przechyla się w żadną stronę.
//
// NIE używać godła ani układu Dziennika Ustaw — karta nie może udawać aktu urzędowego.
// Stąd etykieta „Projekt nowelizacji" i znaczniki NOWY przy wstawkach.
//
// Na karcie NIE MA niczego, co zmienia się z kolejnymi wersjami (numer wersji, data, wykaz
// Dz. U., status wniesienia): X trzyma obraz w cache pod tym samym adresem i nie nadąży.
import { el, logo, type Node } from './ogCard';
import type { OgPage } from './ogPages';

const svgImg = (svg: string, width: number, height: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width, height, style },
});

// Waga: grot, słup, belka, po dwie linki i płaska szalka na każdym ramieniu, cokół. Same łamane.
// miterlimit jak w ogCard.ts — ostre kąty linek przy belce inaczej ścinają się do bevela.
const wagaSvg = (stroke: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="136" height="104" viewBox="-8 -2 136 104">
  <g fill="none" stroke="${stroke}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="miter" stroke-miterlimit="14">
    <path d="M60,4 L66,11 L60,18 L54,11 Z"/>
    <path d="M60,18 L60,86"/>
    <path d="M12,26 L108,26"/>
    <path d="M12,26 L1,60 M12,26 L23,60"/>
    <path d="M-3,60 L27,60 L21,68 L3,68 Z"/>
    <path d="M108,26 L97,60 M108,26 L119,60"/>
    <path d="M93,60 L123,60 L117,68 L99,68 Z"/>
    <path d="M44,86 L76,86 M36,94 L84,94"/>
  </g>
</svg>`;

// Kolory kartki (papier na granacie). Tekst istniejący = szare paski: ma się czytać jako
// „tu jest obowiązujący przepis", a uwaga idzie na dwie wstawki.
const PAPIER = '#f4f1e9';
const TUSZ = '#14233a';
const SZARY = '#a6adb7';
const PASEK = '#d8d3c6';
const WSTAWKA = '#0f4c81';
const WSTAWKA_TLO = '#e2ebf6';

const pasek = (width: string): Node => el({ display: 'flex', width, height: '9px', borderRadius: '5px', background: PASEK, marginTop: '7px' });

// Kolumna numeru: we wstawce przesunięta o kreskę (5) i padding (12), więc w ustępie istniejącym
// jest o 17 px szersza — dzięki temu paski i treść wstawek zaczynają się na tej samej osi.
const NR_WSTAWKA = 62;
const NR_ISTNIEJACY = NR_WSTAWKA + 17;

/** Ustęp, który zostaje bez zmian: szary numer + paski udające tekst. */
const istniejacy = (nr: string, paski: string[], dopisek?: string): Node =>
  el({ display: 'flex', alignItems: 'flex-start', marginTop: '10px' }, [
    el({ display: 'flex', width: `${NR_ISTNIEJACY}px`, fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '19px', color: SZARY }, nr),
    el({ display: 'flex', flexDirection: 'column', flexGrow: 1 }, [
      ...paski.map(pasek),
      ...(dopisek ? [el({ display: 'flex', fontSize: '16px', color: SZARY, marginTop: '6px' }, dopisek)] : []),
    ]),
  ]);

/** Nowy ustęp z projektu: wyróżniony jak wstawka (tło + kreska po lewej). */
const wstawka = (nr: string, tresc: string): Node =>
  el({ display: 'flex', alignItems: 'center', marginTop: '12px', padding: '12px 14px 12px 12px', background: WSTAWKA_TLO, borderLeft: `5px solid ${WSTAWKA}` }, [
    el({ display: 'flex', width: `${NR_WSTAWKA}px`, fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '21px', color: WSTAWKA }, nr),
    el({ display: 'flex', flexGrow: 1, fontSize: '20px', fontWeight: 600, color: TUSZ, lineHeight: 1.25 }, tresc),
    el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '13px', color: '#ffffff', background: WSTAWKA, padding: '3px 7px', borderRadius: '4px', marginLeft: '10px', letterSpacing: '1px' }, 'NOWY'),
  ]);

export function ustawaTemplate(p: OgPage): Node {
  const kartka = el(
    {
      display: 'flex', flexDirection: 'column', width: '540px', padding: '24px 30px 26px',
      background: PAPIER, borderRadius: '8px', color: TUSZ, boxShadow: '0 22px 44px rgba(4, 10, 20, 0.45)',
    },
    [
      el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '14px', letterSpacing: '2px', color: '#7a838f' }, 'USTAWA O DZIAŁALNOŚCI LECZNICZEJ'),
      el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '38px', marginTop: '6px' }, 'Art. 27a'),
      el({ display: 'flex', height: '2px', background: PASEK, marginTop: '12px', marginBottom: '4px' }),
      istniejacy('1.', ['100%', '82%']),
      wstawka('1a.', 'Co kwartał — także kontrakty'),
      istniejacy('2.–4.', ['100%'], 'bez zmian'),
      wstawka('5.–7.', 'Pseudonim, publikacja, kara'),
    ],
  );

  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: '#14233a', color: '#ffffff', padding: '50px 64px 46px 72px',
      fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e',
      backgroundImage: 'radial-gradient(circle at 82% 46%, #1d3a5f 0%, #14233a 58%)',
    },
    [
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '27px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexGrow: 1, alignItems: 'center', paddingBottom: '26px' }, [
        // Szerokości jawne (obszar treści 1048 px) — satori sam nie zwęża kolumny z flexGrow.
        el({ display: 'flex', flexDirection: 'column', width: '444px', marginRight: '64px' }, [
          svgImg(wagaSvg('#6aa9e0'), 126, 96, { marginBottom: '20px', marginLeft: '-6px' }),
          el({ display: 'flex', fontSize: '21px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '16px' }, p.tag),
          el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '66px', lineHeight: 1.04, color: '#ffffff' }, p.title),
          el({ display: 'flex', fontSize: '25px', lineHeight: 1.38, color: '#aebccb', marginTop: '18px' }, p.subtitle),
        ]),
        kartka,
      ]),
      el({ display: 'flex', alignItems: 'center', paddingTop: '22px', borderTop: '1px solid #2c3d57', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, 'Jawność wynagrodzeń w ochronie zdrowia ze środków publicznych'),
      ]),
    ],
  );
}
