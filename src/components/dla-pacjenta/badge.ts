/** Podmiana liczby na zdjęciu sekcji (`ui/Badge variant="stat"`), gdy narzędzie obok zmienia wartość. */
export function setBadge(section: Element | null, value: string, label: string, note?: string) {
  const valueEl = section?.querySelector('.badge__value');
  const labelEl = section?.querySelector('.badge__label');
  if (!valueEl || !labelEl?.firstChild) return;
  valueEl.textContent = value;
  labelEl.firstChild.textContent = label;
  const noteEl = labelEl.querySelector('.badge__note');
  if (noteEl && note !== undefined) noteEl.textContent = note;
}
