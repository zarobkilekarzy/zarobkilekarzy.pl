// Unikalne id dla elementów renderowanych wielokrotnie (np. popover ↔ wyzwalacz).
// Licznik żyje w module, a nie we frontmatterze komponentu, bo ten wykonuje się przy każdym renderze.
let n = 0;
export const uid = (prefix = 'uid') => `${prefix}-${++n}`;
