/**
 * „Większy tekst” — logika w przeglądarce. Tylko do <script> komponentów (od razu sięga po document).
 *
 * Stan żyje na <html data-text-size="lg">: rozmiar bazowy 118,75% (styles/base.css), a że rozmiary
 * tekstu są w rem, rośnie cały tekst; układ zostaje w px. Skrypt w <head> (layouts/BaseLayout.astro)
 * ustawia atrybut z zapisu w localStorage przed pierwszym malowaniem, więc tekst nie przeskakuje.
 *
 * Każdy <button data-text-size-toggle> na stronie jest przełącznikiem (nagłówek, menu telefonu,
 * przycisk na stronie pacjenta). Moduł wykonuje się raz na stronę, więc nasłuch jest delegowany.
 * Wygląd „włączony” wybiera CSS z atrybutu na <html>; JS synchronizuje tylko aria-pressed.
 */
const KEY = 'zl-text-size'; // ten sam klucz czyta skrypt w <head> (BaseLayout)
const root = document.documentElement;

const isLarge = () => root.dataset.textSize === 'lg';

const sync = () =>
  document.querySelectorAll('[data-text-size-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(isLarge())));

document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('[data-text-size-toggle]')) return;
  const large = !isLarge();
  if (large) root.dataset.textSize = 'lg';
  else delete root.dataset.textSize;
  try {
    if (large) localStorage.setItem(KEY, 'lg');
    else localStorage.removeItem(KEY);
  } catch { /* tryb prywatny / zablokowany storage — działa do końca wizyty */ }
  sync();
});

sync();
