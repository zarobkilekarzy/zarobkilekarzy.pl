/**
 * <zl-letter> — zachowanie narzędzia „Napisz do polityka” (components/dzialaj/WriteTool.astro).
 * Stan: wybrana grupa, zapytanie, zaznaczony adresat, podpis. Każda zmiana składa list od nowa
 * (lib/dzialaj/letter) i podmienia link mailto. Nic nie wysyła i niczego nie zapisuje.
 */
import { cleanSignature, fillLetter, mailto, type LetterTemplate, type Rodzaj } from '@/lib/dzialaj/letter';
import { fold, plural } from '@/lib/format';
import { copyText } from '@/scripts/clipboard';

/** Schowek: Clipboard API, a gdy go zabraknie (brak uprawnień, starsza przeglądarka) — zaznaczenie i execCommand. */
async function copy(text: string): Promise<boolean> {
  if (await copyText(text)) return true;
  const focused = document.activeElement as HTMLElement | null;
  const area = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  focused?.focus();
  return ok;
}

const people = (n: number) => `${n} ${plural(n, ['adresat', 'adresatów', 'adresatów'])}`;

class ZlLetter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready !== undefined) return;
    this.dataset.ready = '';

    const $ = <T extends Element = HTMLElement>(name: string) => this.querySelector<T>(`[data-el="${name}"]`)!;
    const $$ = <T extends Element = HTMLElement>(selector: string) => [...this.querySelectorAll<T>(selector)];

    const template: LetterTemplate = JSON.parse(this.dataset.template ?? '{}');
    const max = Number(this.dataset.max) || 2000;
    const q = $<HTMLInputElement>('q');
    const sign = $<HTMLInputElement>('sign');
    const body = $('body');
    const open = $<HTMLAnchorElement>('open');
    const to = $('to');
    const status = $('status');
    const count = $('count');
    const empty = $('empty');
    const chips = $$<HTMLButtonElement>('[data-group].chip');
    const sections = $$<HTMLElement>('section[data-group]');
    const copyEmail = this.querySelector<HTMLButtonElement>('[data-copy="email"]')!;

    // Wersja z JS: przełącznik, wyszukiwarka, podpis i kopiowanie; podpowiedź „bez JS” znika
    for (const name of ['controls', 'sign-wrap', 'copy']) $(name).hidden = false;
    $('nojs').hidden = true;

    let group = this.dataset.group ?? '';
    let selected: HTMLLIElement | undefined;
    let letter = body.textContent ?? '';
    let statusTimer: number | undefined;

    const say = (text: string, tone: 'ok' | 'warn' = 'ok') => {
      clearTimeout(statusTimer);
      status.textContent = text;
      status.dataset.tone = tone;
      if (tone === 'ok') statusTimer = window.setTimeout(() => (status.textContent = ''), 4000);
    };

    // ---------- Lista ----------
    const filter = () => {
      const query = fold(q.value.trim());
      const words = query.split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const section of sections) {
        const inGroup = words.length > 0 || section.dataset.group === group;
        let visible = 0;
        for (const row of section.querySelectorAll<HTMLLIElement>('.row')) {
          const hit = inGroup && words.every((w) => row.dataset.search!.includes(w));
          row.hidden = !hit;
          if (hit) visible++;
        }
        section.hidden = visible === 0;
        shown += visible;
      }
      empty.hidden = shown > 0;
      // Przy wyszukiwaniu wyniki są ze wszystkich grup — przełącznik przestaje coś zaznaczać
      for (const chip of chips) chip.setAttribute('aria-pressed', String(!words.length && chip.dataset.group === group));
      count.textContent = words.length ? `Wyniki ze wszystkich grup: ${people(shown)}` : people(shown);
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => {
        group = chip.dataset.group ?? group;
        q.value = '';
        filter();
      });
    }
    q.addEventListener('input', filter);

    // ---------- List ----------
    const compose = () => {
      const greeting = selected?.dataset.greet ?? 'Szanowni Państwo';
      const rodzaj = (selected?.dataset.rodzaj ?? 'inst') as Rodzaj;
      const email = selected?.dataset.email ?? '';
      letter = fillLetter(template, { greeting, rodzaj }, sign.value);
      body.textContent = letter;

      const full = mailto(email, template.subject, letter);
      // Za długi link programy pocztowe obcinają albo odrzucają — wtedy sam temat, treść ze schowka
      const fits = full.length <= max;
      open.href = fits ? full : mailto(email, template.subject);
      open.dataset.fits = String(fits);

      if (selected) {
        to.replaceChildren(
          document.createTextNode(`${selected.dataset.name} `),
          Object.assign(document.createElement('span'), { className: 'lt__to-mail', textContent: `<${email}>` }),
        );
      }
      copyEmail.disabled = !selected;
    };

    this.addEventListener('change', (e) => {
      const radio = e.target as HTMLInputElement;
      if (radio.name !== 'lt-adresat') return;
      selected = radio.closest<HTMLLIElement>('.row') ?? undefined;
      compose();
    });
    sign.addEventListener('input', compose);
    sign.addEventListener('blur', () => {
      const clean = cleanSignature(sign.value);
      if (clean !== sign.value) sign.value = clean;
    });

    open.addEventListener('click', () => {
      if (open.dataset.fits === 'false') {
        void copy(letter).then((ok) =>
          say(ok ? 'List jest za długi na link pocztowy: skopiowaliśmy treść — wklej ją w nowej wiadomości.' : 'List jest za długi na link pocztowy: skopiuj treść przyciskiem obok.', 'warn'),
        );
      }
    });

    for (const button of $$<HTMLButtonElement>('[data-copy]')) {
      button.addEventListener('click', async () => {
        const what = button.dataset.copy;
        const text = what === 'email' ? selected?.dataset.email ?? '' : letter;
        if (!text) return;
        const ok = await copy(text);
        if (!ok) say('Nie udało się skopiować. Zaznacz tekst i skopiuj go ręcznie.', 'warn');
        else say(what === 'email' ? `Skopiowano adres: ${text}` : 'Skopiowano treść listu.');
      });
    }

    filter();
    compose();
  }
}

if (!customElements.get('zl-letter')) customElements.define('zl-letter', ZlLetter);

