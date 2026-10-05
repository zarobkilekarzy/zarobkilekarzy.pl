// Przypisy z Markdownu — zwijane.
//
// Procesor Markdownu generuje na końcu tekstu sekcję
// `<section data-footnotes class="footnotes">` z nagłówkiem tylko dla czytników ekranu
// („Footnotes”) i listą wszystkich przypisów. W dłuższych analizach (60+ przypisów) to kilka
// ekranów listy pod tekstem — więc zamykamy ją w `<details>`: widoczny jest jeden pasek
// „Przypisy (N)”, lista rozwija się po kliknięciu. Przy okazji etykiety idą po polsku.
//
// Transformacja na gotowym HTML (jak kotwice nagłówków, wpięta w `src/middleware.ts`):
// procesor Markdownu w Astro 7 nie przyjmuje wtyczek rehype bez dodatkowej zależności.
// Odnośniki do przypisów w tekście działają dalej — skrypt w BaseLayout otwiera sekcję
// przed skokiem do przypisu (i przy wejściu z adresem #przypisu), a przed drukiem rozwija
// wszystkie. Treść zostaje w HTML, więc wyszukiwarki i Pagefind ją widzą.

const START = '<section data-footnotes class="footnotes">';
const KONIEC = '</section>';

// „Back to reference 3” albo „Back to reference 3-2” (drugie odwołanie do tego samego przypisu).
const POWROT = /aria-label="Back to reference (\d+)(?:-(\d+))?"/g;

export function zwinPrzypisy(html: string): string {
  let od = html.indexOf(START);
  while (od !== -1) {
    const koniec = html.indexOf(KONIEC, od);
    if (koniec === -1) break;
    const srodek = html.slice(od + START.length, koniec);
    const olStart = srodek.indexOf('<ol');
    const olKoniec = srodek.lastIndexOf('</ol>');
    if (olStart === -1 || olKoniec === -1) {
      od = html.indexOf(START, koniec);
      continue;
    }
    const lista = srodek
      .slice(olStart, olKoniec + '</ol>'.length)
      .replace(POWROT, (_c, n: string, k?: string) =>
        `aria-label="Wróć do miejsca w tekście (przypis ${n}${k ? `, odwołanie ${k}` : ''})"`,
      );
    const ile = (lista.match(/<li id="user-content-fn-/g) ?? []).length;
    // Nagłówek zostaje (id="footnote-label" wskazują odnośniki w tekście przez
    // aria-describedby), ale jako widoczna etykieta paska i bez kotwicy „#”.
    const nowa =
      `${START}<details class="przypisy">` +
      `<summary class="przypisy-pasek"><h2 class="przypisy-naglowek" id="footnote-label" data-anchor="off">Przypisy</h2>` +
      `<span class="przypisy-licznik">(${ile})</span></summary>` +
      `${lista}</details>${KONIEC}`;
    html = html.slice(0, od) + nowa + html.slice(koniec + KONIEC.length);
    od = html.indexOf(START, od + nowa.length);
  }
  return html;
}
