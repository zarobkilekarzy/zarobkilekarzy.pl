/** Jawna operacja helpera: własna treść i wszystkie inne pola pozostają zachowane. */
export function insertSource(current, importedSource) {
  return { ...current, source: { ...current.source, ...importedSource } };
}
