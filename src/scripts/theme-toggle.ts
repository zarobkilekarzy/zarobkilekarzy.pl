/**
 * Przełącznik trybu nocnego (site/ThemeToggle.astro). Domyślnie strona idzie za ustawieniem systemu;
 * kliknięcie zapisuje wybór w localStorage ('zl-theme') i ustawia <html data-theme>.
 * Wybór zgodny z systemem kasuje zapis — strona znów podąża za systemem.
 * Ładowany z końca <body> (layouts/BaseLayout.astro), nie z komponentu — zob. komentarz tam.
 */
const KEY = 'zl-theme';
const root = document.documentElement;
const system = window.matchMedia('(prefers-color-scheme: dark)');
const buttons = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : system.matches);
const sync = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(isDark())));

const store = (value: string | null) => {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch { /* tryb prywatny / zablokowany storage — motyw działa do końca wizyty */ }
};

const apply = (dark: boolean) => {
  if (dark === system.matches) {
    delete root.dataset.theme;
    store(null);
  } else {
    root.dataset.theme = dark ? 'dark' : 'light';
    store(root.dataset.theme);
  }
  sync();
};

const toggle = () => {
  // Na czas zmiany wyłączamy przejścia komponentów, żeby wszystko zmieniło się naraz
  root.setAttribute('data-theme-switching', '');
  apply(!isDark());
  setTimeout(() => root.removeAttribute('data-theme-switching'), 50);
};

buttons.forEach((b) => b.addEventListener('click', toggle));
system.addEventListener('change', sync);
sync();

export {}; // moduł, nie skrypt globalny — inaczej nazwy zderzają się z lib/text-size.ts
