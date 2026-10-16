/**
 * Datagrid w przeglądarce: custom element, który przejmuje statyczny HTML z Datagrid.astro,
 * pobiera pełne dane (data-src) i od tej pory sam filtruje, sortuje i dzieli wyniki na strony.
 *
 * Użycie (skrypt komponentu z konfiguracją):
 *   defineDatagrid('zl-monitoring', monitoringGrid);
 * Każda konfiguracja dostaje własny tag, więc kilka tabel na stronie działa niezależnie.
 */
import { formatPL, plural } from '@/lib/format';
import { buildIndex, defaultToggles, extent, pageOf, query, readState, terms, toCsv, writeState, type Index, type Result } from './engine';
import { detailId, esc, fullSpans, marker, pageRange, renderDetail, renderPages, renderRows, type Spans } from './render';
import type { GridConfig, RenderContext } from './types';

export function defineDatagrid<T, D>(tag: string, config: GridConfig<T, D>) {
  if (customElements.get(tag)) return;

  const facetById = new Map(config.facets.map((f) => [f.id, f]));
  const toggleById = new Map((config.toggles ?? []).map((t) => [t.id, t]));
  const columnById = new Map(config.columns.map((c) => [c.id, c]));

  class Datagrid extends HTMLElement {
    state = readState(config, location.search);
    index?: Index<T>;
    byKey = new Map<string, T>();
    data?: D;
    result?: Result<T>;
    extents: Record<string, number> = {};
    open = new Set<string>();
    spans: Spans = fullSpans(config);
    prefix = tag;
    timer = 0;

    $<E extends Element = HTMLElement>(sel: string) {
      return this.querySelector<E>(sel);
    }
    $$<E extends Element = HTMLElement>(sel: string) {
      return [...this.querySelectorAll<E>(sel)];
    }
    get body() {
      return this.$<HTMLTableSectionElement>('[data-dg-body]')!;
    }

    connectedCallback() {
      this.prefix = this.dataset.prefix ?? tag;
      // tekst wpisany, zanim skrypt się wczytał
      const search = this.$<HTMLInputElement>('[data-dg-search]');
      if (search?.value && !this.state.q) this.state.q = search.value;

      this.bind();
      this.reflect();
      new ResizeObserver(() => this.measure()).observe(this);
      void this.load();
    }

    /* ---------- dane ---------- */

    async load() {
      try {
        const res = await fetch(this.dataset.src!);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { rows, data } = config.load(await res.json());
        this.index = buildIndex(config, rows);
        this.data = data;
        rows.forEach((row) => this.byKey.set(config.key(row), row));
        for (const c of config.columns) if (c.bar) this.extents[c.id] = extent(c, rows);
        this.removeAttribute('aria-busy');
        this.update({ keepPage: true });
      } catch (error) {
        console.error(error);
        this.removeAttribute('aria-busy');
        this.setAttribute('data-failed', '');
      }
    }

    ctx(): RenderContext<D> {
      return { data: this.data!, mark: marker(terms(this.state.q)), sort: this.state.sort };
    }

    rowsOptions() {
      return { ctx: this.ctx(), spans: this.spans, open: this.open, extents: this.extents, prefix: this.prefix };
    }

    /* ---------- render ---------- */

    /** Przelicza wynik; każda zmiana filtrów czy sortowania wraca na pierwszą stronę. */
    update({ keepPage = false } = {}) {
      if (!this.index) return;
      if (!keepPage) this.state.page = 1;
      this.result = query(config, this.index, this.state);
      this.paintCounts();
      this.paintChips();
      this.paintHead();
      this.paintBody();
      this.saveUrl();
    }

    paintCounts() {
      const r = this.result!;
      const setCount = (key: string, n: number) => {
        for (const el of this.$$(`[data-dg-count="${key}"]`)) el.textContent = formatPL(n);
      };

      for (const facet of config.facets) {
        const picked = new Set(this.state.facets[facet.id] ?? []);
        for (const o of facet.options) {
          const n = r.counts[facet.id][o.value] ?? 0;
          setCount(`${facet.id}:${o.value}`, n);
          const input = this.$<HTMLInputElement>(`[data-dg-opt="${facet.id}"][value="${o.value}"]`);
          // opcja bez wyników jest wyłączona, chyba że już zaznaczona (żeby dało się ją odznaczyć)
          if (input) input.disabled = n === 0 && !input.checked;
          const seg = this.$(`[data-dg-seg="${facet.id}:${o.value}"]`);
          if (seg) {
            seg.style.flexGrow = String(n);
            seg.classList.toggle('is-off', picked.size > 0 && !picked.has(o.value));
          }
        }
        const badge = this.$(`[data-dg-picked="${facet.id}"]`);
        if (badge) {
          badge.textContent = String(picked.size);
          badge.hidden = picked.size === 0;
        }
      }
      for (const t of config.toggles ?? []) {
        setCount(`toggle:${t.id}`, r.toggles[t.id]);
        this.$(`[data-dg-toggle="${t.id}"]`)?.closest('label')?.classList.toggle('is-relaxed', r.relaxed.includes(t.id));
      }
      const note = this.$('[data-dg-relaxed]');
      if (note) {
        note.textContent = r.relaxed.map((id) => toggleById.get(id)?.fallback).join(' ');
        note.hidden = r.relaxed.length === 0;
      }

      const total = this.index!.rows.length;
      const found = r.rows.length;
      const out = this.$('[data-dg-total]');
      if (out) {
        const noun = plural(total, config.noun);
        out.innerHTML =
          found === total
            ? `<strong>${formatPL(total)}</strong> ${esc(noun)}`
            : `<strong>${formatPL(found)}</strong> z ${formatPL(total)} ${esc(noun)}`;
      }
    }

    paintChips() {
      const box = this.$('[data-dg-chips]');
      if (!box) return;
      const chip = (unset: string, label: string) =>
        `<button type="button" class="dg-chip" data-dg-unset="${esc(unset)}">${esc(label)}<span class="dg-chip__x" aria-hidden="true"></span><span class="sr-only"> — usuń filtr</span></button>`;

      let html = '';
      if (this.state.q.trim()) html += chip('q', `„${this.state.q.trim()}”`);
      for (const facet of config.facets) {
        for (const v of this.state.facets[facet.id] ?? []) {
          html += chip(`${facet.id}:${v}`, facet.options.find((o) => o.value === v)?.label ?? v);
        }
      }
      // przełącznik włączony domyślnie nie jest „filtrem do usunięcia” — widać go na pasku
      for (const id of this.state.toggles) if (!toggleById.get(id)?.default) html += chip(`toggle:${id}`, toggleById.get(id)?.label ?? id);
      if (html) html += '<button type="button" class="dg-clear" data-dg-reset>Wyczyść wszystko</button>';
      box.innerHTML = html;
      box.hidden = !html;
    }

    paintHead() {
      const { by, dir } = this.state.sort;
      for (const th of this.$$('thead th[data-col]')) {
        const on = th.dataset.col === by;
        th.classList.toggle('is-sorted', on);
        if (on) th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
        else th.removeAttribute('aria-sort');
      }
      const select = this.$<HTMLSelectElement>('[data-dg-sortselect]');
      if (select) select.value = `${by}:${dir}`;
    }

    paintBody() {
      const all = this.result!.rows;
      const { rows, page, pages, from } = pageOf(all, this.state);
      this.state.page = page;
      this.body.innerHTML = renderRows(config, rows, this.rowsOptions());
      this.$('[data-dg-table]')?.setAttribute('aria-rowcount', String(all.length + this.$$('thead tr').length));
      this.$('[data-dg-empty]')!.hidden = all.length > 0;

      // pasek stron chowamy, gdy wyników jest mniej niż najmniejsza opcja „na stronie”
      const smallest = Math.min(...(config.pageSizes ?? [config.pageSize]).filter((n) => n > 0));
      this.$('[data-dg-pager]')!.hidden = all.length <= smallest;
      this.$('[data-dg-range]')!.textContent = pageRange(from, rows.length, all.length);
      this.$('[data-dg-pages]')!.innerHTML = renderPages(page, pages);
    }

    /** Zmiana strony: nowe wiersze, adres i powrót na początek tabeli, jeśli jest nad ekranem. */
    goTo(page: number) {
      this.state.page = page;
      this.paintBody();
      this.saveUrl();
      const table = this.$('[data-dg-table]')!;
      const bar = this.$('[data-dg-toolbar]');
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const sticky = bar && getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0;
      const top = table.getBoundingClientRect().top - header - sticky;
      if (top < 0) window.scrollBy({ top, behavior: 'instant' });
      // fokus zostaje w pasku stron (przyciski powstały na nowo)
      this.$<HTMLElement>('[data-dg-pages] [aria-current="page"]')?.focus({ preventScroll: true });
    }

    toggleDetail(key: string) {
      const row = this.byKey.get(key);
      const tr = this.body.querySelector<HTMLTableRowElement>(`tr.dg-row[data-key="${CSS.escape(key)}"]`);
      if (!row || !tr) return;
      const open = !this.open.has(key);
      if (open) {
        this.open.add(key);
        tr.insertAdjacentHTML('afterend', renderDetail(config, row, this.rowsOptions()));
      } else {
        this.open.delete(key);
        document.getElementById(detailId(this.prefix, key))?.remove();
      }
      tr.classList.toggle('is-open', open);
      tr.querySelector('.dg-toggle')?.setAttribute('aria-expanded', String(open));
    }

    /** Przenosi stan na kontrolki (po wczytaniu stanu z adresu i po „Wyczyść”). */
    reflect() {
      const search = this.$<HTMLInputElement>('[data-dg-search]');
      if (search) search.value = this.state.q;
      for (const input of this.$$<HTMLInputElement>('[data-dg-opt]')) {
        input.checked = (this.state.facets[input.dataset.dgOpt!] ?? []).includes(input.value);
      }
      for (const btn of this.$$('[data-dg-pick]')) {
        const [facet, value] = btn.dataset.dgPick!.split(':');
        btn.setAttribute('aria-pressed', String((this.state.facets[facet] ?? []).includes(value)));
      }
      for (const input of this.$$<HTMLInputElement>('[data-dg-toggle]')) {
        input.checked = this.state.toggles.includes(input.dataset.dgToggle!);
      }
      const perPage = this.$<HTMLSelectElement>('[data-dg-perpage]');
      if (perPage) perPage.value = String(this.state.perPage);
      this.paintHead();
    }

    saveUrl() {
      const qs = writeState(config, this.state);
      const url = `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`;
      if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', url);
    }

    /** Wysokość paska narzędzi (dla przyklejonego nagłówka tabeli) i liczba widocznych kolumn. */
    measure() {
      const bar = this.$('[data-dg-toolbar]');
      if (bar) this.style.setProperty('--dg-bar-h', `${bar.offsetHeight}px`);

      const visible = this.$$('thead th[data-col]').filter((th) => getComputedStyle(th).display !== 'none');
      const groups: Record<string, number> = {};
      for (const th of visible) if (th.dataset.group) groups[th.dataset.group] = (groups[th.dataset.group] ?? 0) + 1;
      const spans: Spans = { all: visible.length + 1, groups };
      if (JSON.stringify(spans) === JSON.stringify(this.spans)) return;
      this.spans = spans;

      for (const td of this.$$<HTMLTableCellElement>('td.dg-void')) td.colSpan = spans.groups[td.dataset.group!] ?? 1;
      for (const td of this.$$<HTMLTableCellElement>('tr.dg-detail > td')) td.colSpan = spans.all;
      const ids = new Set(visible.map((th) => th.dataset.col));
      for (const th of this.$$<HTMLTableCellElement>('[data-dg-cols]')) {
        const n = th.dataset.dgCols!.split(' ').filter((id) => ids.has(id)).length + (th.hasAttribute('data-dg-lead') ? 1 : 0);
        th.hidden = n === 0;
        th.colSpan = Math.max(n, 1);
      }
    }

    /* ---------- zdarzenia ---------- */

    setFacet(id: string, value: string, on: boolean) {
      const values = new Set(this.state.facets[id] ?? []);
      if (on) values.add(value);
      else values.delete(value);
      // kolejność jak w konfiguracji — stabilny adres
      this.state.facets[id] = facetById.get(id)!.options.map((o) => o.value).filter((v) => values.has(v));
      if (!this.state.facets[id].length) delete this.state.facets[id];
    }

    unset(what: string) {
      if (what === 'q') this.state.q = '';
      else if (what.startsWith('toggle:')) this.state.toggles = this.state.toggles.filter((t) => `toggle:${t}` !== what);
      else {
        const [id, value] = what.split(':');
        this.setFacet(id, value, false);
      }
    }

    /** Powrót do widoku domyślnego (przełączniki domyślne zostają włączone). */
    reset() {
      this.state = { ...this.state, q: '', facets: {}, toggles: defaultToggles(config) };
    }

    bind() {
      this.addEventListener('input', (e) => {
        const input = e.target as HTMLInputElement;
        if (!input.matches('[data-dg-search]')) return;
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          this.state.q = input.value;
          this.update();
        }, 140);
      });

      this.addEventListener('change', (e) => {
        const el = e.target as HTMLInputElement | HTMLSelectElement;
        if (el.matches('[data-dg-opt]')) {
          this.setFacet(el.dataset.dgOpt!, el.value, (el as HTMLInputElement).checked);
        } else if (el.matches('[data-dg-toggle]')) {
          const id = el.dataset.dgToggle!;
          this.state.toggles = (el as HTMLInputElement).checked
            ? [...this.state.toggles, id]
            : this.state.toggles.filter((t) => t !== id);
        } else if (el.matches('[data-dg-sortselect]')) {
          const [by, dir] = el.value.split(':');
          this.state.sort = { by, dir: dir === 'asc' ? 'asc' : 'desc' };
        } else if (el.matches('[data-dg-perpage]')) {
          this.state.perPage = Number(el.value);
        } else return;
        this.reflect();
        this.update();
      });

      this.addEventListener('keydown', (e) => {
        const el = e.target as HTMLElement;
        if (e.key === 'Escape' && el.matches('[data-dg-search]') && (el as HTMLInputElement).value) {
          e.preventDefault();
          (el as HTMLInputElement).value = '';
          this.state.q = '';
          this.update();
        } else if (e.key === 'Escape') {
          const menu = el.closest<HTMLDetailsElement>('details[open]');
          if (menu) {
            menu.open = false;
            menu.querySelector('summary')?.focus();
          }
        }
      });

      // 'toggle' nie bąbelkuje, stąd nasłuch w fazie przechwytywania: jedno otwarte menu filtrów naraz.
      // Dymki z definicjami to ui/Popover — pozycję i zamykanie załatwiają kotwice CSS i popover="auto".
      this.addEventListener(
        'toggle',
        (e) => {
          const el = e.target as HTMLElement;
          if (el instanceof HTMLDetailsElement && el.matches('[data-dg-menu]') && el.open) {
            for (const other of this.$$<HTMLDetailsElement>('details[data-dg-menu][open]')) if (other !== el) other.open = false;
          }
        },
        true,
      );
      document.addEventListener('click', (e) => {
        const inside = (e.target as Element).closest?.('details[data-dg-menu]');
        for (const menu of this.$$<HTMLDetailsElement>('details[data-dg-menu][open]')) if (menu !== inside) menu.open = false;
      });

      // „/” przenosi do wyszukiwania (jak w wielu przeglądarkach danych)
      document.addEventListener('keydown', (e) => {
        if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
        if ((active as HTMLElement | null)?.isContentEditable) return;
        const search = this.$<HTMLInputElement>('[data-dg-search]');
        if (!search) return;
        e.preventDefault();
        search.focus();
      });

      this.addEventListener('click', (e) => this.onClick(e));
    }

    onClick(e: MouseEvent) {
      const target = e.target as Element;
      const btn = target.closest<HTMLElement>('button');

      if (btn?.matches('.dg-toggle')) {
        this.toggleDetail(btn.closest<HTMLElement>('tr')!.dataset.key!);
        return;
      }
      if (btn?.dataset.dgSort) {
        const id = btn.dataset.dgSort;
        const { by, dir } = this.state.sort;
        this.state.sort = by === id ? { by, dir: dir === 'asc' ? 'desc' : 'asc' } : { by: id, dir: columnById.get(id)?.dir ?? 'asc' };
        this.reflect();
        this.update();
        return;
      }
      const pick = target.closest<HTMLElement>('[data-dg-pick], [data-dg-seg]');
      if (pick) {
        const [facet, value] = (pick.dataset.dgPick ?? pick.dataset.dgSeg)!.split(':');
        this.setFacet(facet, value, !(this.state.facets[facet] ?? []).includes(value));
        this.reflect();
        this.update();
        return;
      }
      if (btn?.dataset.dgUnset) {
        this.unset(btn.dataset.dgUnset);
        this.reflect();
        this.update();
        this.$<HTMLInputElement>('[data-dg-search]')?.focus({ preventScroll: true });
        return;
      }
      if (btn?.hasAttribute('data-dg-reset')) {
        this.reset();
        this.reflect();
        this.update();
        return;
      }
      if (btn?.dataset.dgPage) return this.goTo(Number(btn.dataset.dgPage));
      if (btn?.hasAttribute('data-dg-copy')) return this.copyLink(btn);
      if (btn?.hasAttribute('data-dg-csv')) return this.downloadCsv();

      // klik w wiersz (poza linkami i kontrolkami) rozwija szczegóły; zaznaczanie tekstu nie
      const tr = target.closest<HTMLElement>('tr.dg-row.is-expandable');
      if (tr && !target.closest('a, button, input, select, label') && !getSelection()?.toString()) {
        this.toggleDetail(tr.dataset.key!);
      }
    }

    async copyLink(btn: HTMLElement) {
      const label = btn.textContent;
      try {
        await navigator.clipboard.writeText(location.href);
        btn.textContent = 'Skopiowano';
      } catch {
        btn.textContent = 'Skopiuj z paska adresu';
      }
      setTimeout(() => (btn.textContent = label), 1800);
    }

    downloadCsv() {
      if (!config.csv || !this.result) return;
      const blob = new Blob([toCsv(config, this.data!, this.result.rows)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = config.csv.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  }

  customElements.define(tag, Datagrid);
}
