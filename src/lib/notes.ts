/**
 * Przypisy na stronach spoza MDX (narzędzia .astro, teksty z src/data) — te same znaczniki co przypisy GFM
 * w artykułach (lib/markdown/footnotes.ts), więc wyglądają i działają tak samo (styles/footnotes.css).
 *
 *   const notes = defineNotes({ nil: 'NIL, [Informacje statystyczne](https://…), stan na 31.12.2025.' });
 *   …zawód<NoteRef notes={notes} id="nil" />…   albo w tekście lib/inline: '…zawód[^nil].'
 *   <NoteList notes={notes} />
 *
 * Numer to kolejność w definicji, więc przypisy wpisuje się w kolejności, w jakiej stoją w tekście.
 * Każdy przypis wskazuje się raz (id numeru w tekście jest stałe). Treść przypisu w zapisie lib/inline.
 */
export interface Note {
  id: string;
  n: number;
  text: string;
}

export type Notes = Note[];

export const defineNotes = (defs: Record<string, string>): Notes =>
  Object.entries(defs).map(([id, text], i) => ({ id, n: i + 1, text }));

export const noteId = (id: string) => `user-content-fn-${id}`;
export const noteRefId = (id: string) => `user-content-fnref-${id}`;

/** Numer przypisu w tekście (HTML), jak `[^id]` w Markdownie. */
export function noteRef(notes: Notes | undefined, id: string): string {
  const note = notes?.find((n) => n.id === id);
  if (!note) throw new Error(`Brak przypisu „${id}” — dopisz go w defineNotes()`);
  return `<sup><a id="${noteRefId(id)}" data-footnote-ref aria-describedby="footnote-label" href="#${noteId(id)}">${note.n}</a></sup>`;
}
