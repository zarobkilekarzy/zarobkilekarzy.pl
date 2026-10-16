/** Schowek i komunikat dla czytników ekranu — wspólne dla kotwic nagłówków i linków do zaznaczenia. */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // brak uprawnień albo kontekst niezabezpieczony
  }
}

let region: HTMLElement | undefined;

/** Grzeczny komunikat (role="status") — jeden wspólny region, tworzony przy pierwszym użyciu. */
export function announce(message: string) {
  if (!region) {
    region = document.createElement('div');
    region.className = 'sr-only';
    region.setAttribute('role', 'status');
    document.body.append(region);
  }
  const el = region;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}
