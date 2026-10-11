// Wariant karty OG dla analizy o sporach kanadyjskich prowincji z lekarzami
// (/analizy/kanada-lekarze-ustawa-specjalna). Po prawej flaga Kanady — od razu mówi, o jakim
// kraju jest tekst; po lewej zwykły układ tag / tytuł / podtytuł. Marka trzyma się na stałych:
// czerwony border z lewej, logo + domena u góry, granat tła, stopka.
//
// Na karcie NIE MA dat ani niczego, co się zmienia (X trzyma obraz w cache pod tym samym adresem).
import { el, logo, type Node } from './ogCard';
import type { OgPage } from './ogPages';

const svgImg = (svg: string, width: number, height: number, style: Record<string, unknown> = {}): Node => ({
  type: 'img',
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`, width, height, style },
});

// Flaga Kanady 2:1 — pasy 1/4 szerokości, liść klonowy w białym kwadracie (ten sam kontur co
// znaczniki na osiach czasu w OsCzasu.astro).
const CZERWIEN = '#d52b1e';
const LISC = 'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27l332-652 332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z';
const flagaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 2400 1200">
  <rect width="2400" height="1200" fill="#ffffff"/>
  <rect width="600" height="1200" fill="${CZERWIEN}"/>
  <rect x="1800" width="600" height="1200" fill="${CZERWIEN}"/>
  <path transform="translate(1200 590) scale(0.235)" fill="${CZERWIEN}" d="${LISC}"/>
</svg>`;

export function kanadaTemplate(p: OgPage): Node {
  return el(
    {
      height: '100%', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column',
      background: '#14233a', color: '#ffffff', padding: '50px 64px 46px 72px',
      fontFamily: 'Plex Sans', borderLeft: '16px solid #b3261e',
      backgroundImage: 'radial-gradient(circle at 80% 46%, #1d3a5f 0%, #14233a 58%)',
    },
    [
      el({ display: 'flex', alignItems: 'center' }, [
        logo(30, { marginRight: '16px' }),
        el({ fontFamily: 'Plex Mono', fontSize: '27px', color: '#cdd6e0', letterSpacing: '1px' }, 'zarobkilekarzy.pl'),
      ]),
      el({ display: 'flex', flexGrow: 1, alignItems: 'center', paddingTop: '18px', paddingBottom: '26px' }, [
        // Szerokości jawne (obszar treści 1048 px) — satori sam nie zwęża kolumny z flexGrow.
        el({ display: 'flex', flexDirection: 'column', width: '520px', marginRight: '48px' }, [
          el({ display: 'flex', fontSize: '21px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', color: '#6aa9e0', marginBottom: '16px' }, p.tag),
          el({ display: 'flex', fontFamily: 'Plex Serif', fontWeight: 700, fontSize: '58px', lineHeight: 1.06, color: '#ffffff' }, p.title),
          el({ display: 'flex', fontSize: '25px', lineHeight: 1.38, color: '#aebccb', marginTop: '18px' }, p.subtitle),
        ]),
        el({ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '480px' }, [
          el({ display: 'flex', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 22px 44px rgba(4, 10, 20, 0.5)' }, [
            svgImg(flagaSvg, 480, 240),
          ]),
          el({ display: 'flex', fontFamily: 'Plex Mono', fontSize: '18px', letterSpacing: '2px', color: '#8aa0b6', marginTop: '22px' }, 'QUEBEC · ONTARIO · ALBERTA'),
        ]),
      ]),
      el({ display: 'flex', alignItems: 'center', paddingTop: '22px', borderTop: '1px solid #2c3d57', color: '#8aa0b6', fontSize: '22px' }, [
        el({ display: 'flex' }, 'Jawność wynagrodzeń w ochronie zdrowia ze środków publicznych'),
      ]),
    ],
  );
}
