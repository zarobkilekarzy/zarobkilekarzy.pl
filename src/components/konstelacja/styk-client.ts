/**
 * <zl-styk>: filtr (okres, sprawy, ustalenia mediów, składniki wyniku) i cztery widoki — lista, mapa, kariery,
 * dwie role naraz. Liczy lib/konstelacja/styk.ts, tu tylko rysowanie. HTML z tekstów grafu zawsze przez esc().
 */
import { COMPONENTS, CASES, WEIGHTS, type ComponentKey } from '@/data/konstelacja/styk';
import { buildModel, dur, fmtDay, ranking, type Filter, type Model, type Score } from '@/lib/konstelacja/styk';
import type { GraphData } from '@/lib/konstelacja/types';
import { plural } from '@/lib/format';

const A0 = 2005, A1 = 2027;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const yearF = (d: Date) => d.getUTCFullYear() + (d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 31_557_600_000;

function init(host: HTMLElement, g: GraphData) {
  const m: Model = buildModel(g);
  const $ = <T extends Element = HTMLElement>(sel: string) => host.querySelector<T>(sel)!;
  const st = { f: { y0: A0, y1: A1, full: true, cases: [] as string[], media: false, comps: Object.keys(WEIGHTS) as ComponentKey[] } as Filter, view: 'list', open: '', all: false };
  const src = (ids?: string[]) => (ids ?? []).map((id) => g.sources[id]).filter(Boolean)
    .map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.publisher || s.title)}</a>`).join(', ');

  // histogram zdarzeń i suwak
  const years: number[] = []; for (let y = A0; y < A1; y++) years.push(y);
  const maxH = Math.max(...years.map((y) => m.years[y] ?? 0));
  const hist = $<SVGSVGElement>('[data-el="hist"]');
  hist.setAttribute('viewBox', `0 0 ${years.length} 40`);
  const drawHist = () => {
    hist.innerHTML = years.map((y, i) => {
      const h = Math.max(1, ((m.years[y] ?? 0) / maxH) * 38);
      const on = y >= st.f.y0 && y < st.f.y1;
      return `<rect x="${i + 0.12}" y="${40 - h}" width="0.76" height="${h}" fill="${on ? 'var(--blue)' : 'var(--chart-soft)'}"><title>${y}: ${m.years[y] ?? 0}</title></rect>`;
    }).join('');
  };
  const t0 = $<HTMLInputElement>('[data-el="t0"]'), t1 = $<HTMLInputElement>('[data-el="t1"]');
  const onRange = (src?: HTMLInputElement) => {
    let a = +t0.value, b = +t1.value;
    if (a >= b) { if (src === t0) a = b - 1; else b = a + 1; t0.value = String(a); t1.value = String(b); }
    st.f.y0 = a; st.f.y1 = b; st.f.full = a === A0 && b === A1; render();
  };
  t0.addEventListener('input', () => onRange(t0));
  t1.addEventListener('input', () => onRange(t1));
  let timer = 0;
  const play = $<HTMLButtonElement>('[data-el="play"]');
  const stop = () => { clearInterval(timer); timer = 0; play.setAttribute('aria-pressed', 'false'); play.textContent = 'Rok po roku'; };
  $('[data-el="all"]').addEventListener('click', () => { stop(); t0.value = String(A0); t1.value = String(A1); onRange(); });
  play.addEventListener('click', () => {
    if (timer) return stop();
    const w = st.f.full ? 3 : Math.max(2, st.f.y1 - st.f.y0);
    let a = 2012;
    play.setAttribute('aria-pressed', 'true'); play.textContent = 'Zatrzymaj';
    const step = () => { t0.value = String(a); t1.value = String(Math.min(A1, a + w)); onRange(); a++; if (a + w > A1) stop(); };
    step(); timer = window.setInterval(step, 1200);
  });
  host.querySelectorAll<HTMLButtonElement>('[data-case]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.case!;
    if (!k) st.f.cases = []; else st.f.cases = st.f.cases.includes(k) ? st.f.cases.filter((x) => x !== k) : [...st.f.cases, k];
    host.querySelectorAll<HTMLButtonElement>('[data-case]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.case ? st.f.cases.includes(x.dataset.case) : !st.f.cases.length)));
    render();
  }));
  $<HTMLInputElement>('[data-el="media"]').addEventListener('change', (e) => { st.f.media = (e.target as HTMLInputElement).checked; render(); });
  $('[data-el="legend"]').addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement; const k = t.dataset.comp as ComponentKey;
    st.f.comps = t.checked ? [...st.f.comps, k] : st.f.comps.filter((x) => x !== k); render();
  });
  host.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) => b.addEventListener('click', () => {
    st.view = b.dataset.view!;
    host.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));

  const subtitle = (s: Score) => {
    const now = s.person.fns.filter((f) => f.open && f.a && f.group !== 'pieniadze').sort((a, b) => b.a!.getTime() - a.a!.getTime())[0];
    const p = s.person.node.party;
    return [p && !p.former ? p.name : '', now?.org ?? ''].filter(Boolean).join(' · ');
  };

  function why(s: Score) {
    return `<div class="styk__why">${COMPONENTS.filter((c) => s.items[c.key].length).map((c) => `
      <div><h3><i class="styk__sw" style="background:${c.color}"></i>${c.label} · ${s.parts[c.key]} pkt</h3><ul>${s.items[c.key].map((x) => `
        <li>${esc(x.text)}${x.media ? '<span class="styk__tag styk__tag--media">media</span>' : ''} ${x.when ? `<em>${esc(x.when)}</em>` : ''}${x.pts === 0 && c.key !== 'osoby' ? ' <span class="styk__tag">bez punktów</span>' : ''}${x.sources?.length ? `<br>${src(x.sources)}` : ''}</li>`).join('')}</ul></div>`).join('')}</div>`;
  }

  function renderList(list: Score[]) {
    const box = $('[data-el="rank"]');
    if (!list.length) { box.innerHTML = '<p class="styk__sub">W tym okresie i sprawach nikt nie ma punktów.</p>'; return; }
    const max = list[0].total;
    const shown = st.all ? list : list.slice(0, 20);
    box.innerHTML = `<ol class="styk__rank">${shown.map((s, i) => `
      <li><button type="button" class="styk__row-btn" data-id="${s.person.node.id}" aria-expanded="${st.open === s.person.node.id}">
        <span class="styk__n">${i + 1}</span>
        <span class="styk__who"><b>${esc(s.person.node.name)}</b><span>${esc(subtitle(s))}</span></span>
        <span class="styk__stack" style="width:${(s.total / max) * 100}%">${COMPONENTS.filter((c) => s.parts[c.key]).map((c) => `<i style="flex:${s.parts[c.key]};background:${c.color}" title="${c.label}: ${s.parts[c.key]} pkt"></i>`).join('')}</span>
        <span class="styk__t">${s.total}</span>
      </button>${st.open === s.person.node.id ? why(s) : ''}</li>`).join('')}</ol>
      ${list.length > 20 ? `<button type="button" class="chip styk__more" data-el="more">${st.all ? 'Pokaż pierwsze 20' : `Pokaż wszystkich (${list.length})`}</button>` : ''}`;
    box.querySelectorAll<HTMLButtonElement>('.styk__row-btn').forEach((b) => b.addEventListener('click', () => { st.open = st.open === b.dataset.id ? '' : b.dataset.id!; render(); }));
    box.querySelector('[data-el="more"]')?.addEventListener('click', () => { st.all = !st.all; render(); });
  }

  function renderMap(list: Score[]) {
    const box = $('[data-el="rank"]');
    const pts = list.map((s) => ({ s, x: s.parts.wladza + s.parts.partia, y: s.parts.pieniadze + s.parts.repr, r: s.parts.naraz + s.parts.glos, k: 0 }));
    const mx = Math.max(6, ...pts.map((d) => d.x)), my = Math.max(4, ...pts.map((d) => d.y));
    const Wd = 900, Ht = 460, L = 40, B = 36, T = 24, R = 150;
    const X = (v: number) => L + (v / mx) * (Wd - L - R), Y = (v: number) => Ht - B - (v / my) * (Ht - B - T);
    const cell: Record<string, number> = {};
    pts.forEach((d) => { const k = `${d.x}:${d.y}`; d.k = (cell[k] = (cell[k] ?? 0) + 1) - 1; });
    const top = new Set(list.slice(0, 14).map((s) => s.person.node.id));
    let svg = `<svg viewBox="0 0 ${Wd} ${Ht}" role="img" aria-label="Mapa: oś pozioma — władza publiczna i polityka, oś pionowa — podmioty i organizacje branżowe; punkt to osoba">`;
    svg += `<rect x="${X(mx / 2)}" y="${T}" width="${X(mx) - X(mx / 2)}" height="${Y(my / 2) - T}" fill="var(--blue-50)"/>`;
    svg += `<text class="ax" x="${X(mx) - 6}" y="${T + 14}" text-anchor="end">dużo władzy i dużo interesów</text>`;
    for (let v = 0; v <= mx; v += 3) svg += `<line x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${Ht - B}" stroke="var(--line)"/><text class="ax" x="${X(v)}" y="${Ht - B + 14}" text-anchor="middle">${v}</text>`;
    for (let v = 0; v <= my; v += 2) svg += `<line x1="${L}" x2="${X(mx)}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text class="ax" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    svg += `<text class="ax" x="${X(mx)}" y="${Ht - 4}" text-anchor="end">władza publiczna i polityka (pkt) →</text><text class="ax" x="${L}" y="${T - 8}">↑ podmioty, samorząd, związki (pkt)</text>`;
    const labels: Record<string, { x: number; y: number; names: string[]; rest: number }> = {};
    for (const d of pts) {
      const cols = Math.min(5, cell[`${d.x}:${d.y}`]);
      const rr = 4 + Math.sqrt(d.r) * 2.4;
      const cx = X(d.x) + ((d.k % 5) - (cols - 1) / 2) * 11, cy = Y(d.y) - Math.floor(d.k / 5) * 11;
      svg += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${d.r ? 'var(--amber)' : 'var(--blue)'}" fill-opacity="${d.r ? 0.85 : 0.7}" stroke="var(--bg)" data-id="${d.s.person.node.id}" tabindex="0"><title>${esc(d.s.person.node.name)} — władza ${d.x}, interes ${d.y}, dwie role naraz i głosy ${d.r}</title></circle>`;
      const l = (labels[`${d.x}:${d.y}`] ??= { x: X(d.x) + cols * 5.5 + 8, y: Y(d.y) + 4, names: [], rest: 0 });
      if (top.has(d.s.person.node.id)) l.names.push(d.s.person.node.name.replace(/^.*\s(\S+)$/, '$1')); else l.rest++;
    }
    for (const l of Object.values(labels)) {
      if (!l.names.length) continue;
      const lines: string[] = []; for (let i = 0; i < l.names.length; i += 2) lines.push(l.names.slice(i, i + 2).join(', '));
      if (l.rest) lines[lines.length - 1] += ` +${l.rest}`;
      const y0 = l.y - ((lines.length - 1) * 13) / 2;
      svg += `<text class="nm" x="${l.x}" y="${y0}">${lines.map((t, i) => `<tspan x="${l.x}" dy="${i ? 13 : 0}">${esc(t)}</tspan>`).join('')}</text>`;
    }
    box.innerHTML = `<div class="styk__map">${svg}</div><p class="styk__sub">Punkt żółty i większy — osoba ma dwie role naraz albo głosowała przy drugiej roli. Podpisane: pierwsze 14 osób z rankingu. Klik w punkt otwiera rozbicie na liście.</p>`;
    const open = (id: string) => { st.open = id; st.view = 'list'; host.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.view === 'list'))); render(); };
    box.querySelectorAll<SVGCircleElement>('circle').forEach((c) => {
      c.addEventListener('click', () => open(c.dataset.id!));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(c.dataset.id!); });
    });
  }

  function renderGantt(list: Score[]) {
    const G0 = st.f.full ? 2012 : Math.max(A0, st.f.y0 - 1), G1 = st.f.full ? A1 : Math.min(A1, Math.max(st.f.y1 + 1, G0 + 5));
    const X = (d: Date) => ((Math.min(Math.max(yearF(d), G0), G1) - G0) / (G1 - G0)) * 100;
    const step = G1 - G0 > 10 ? 2 : 1;
    const ticks: number[] = []; for (let y = G0; y <= G1; y += step) ticks.push(y);
    const pos = (y: number) => ((y - G0) / (G1 - G0)) * 100;
    const W0 = new Date(Date.UTC(st.f.y0, 0, 1)), W1 = new Date(Date.UTC(st.f.y1, 0, 1));
    let h = `<div class="ga" aria-hidden="true"><span></span><div class="ga__t">${ticks.map((y) => `<span style="left:${pos(y)}%">${y}</span>`).join('')}</div></div>`;
    for (const s of list.slice(0, 15)) {
      const fns = s.person.fns.filter((f) => st.f.media || !f.media);
      const dated = fns.filter((f) => f.a).sort((a, b) => a.a!.getTime() - b.a!.getTime());
      const undated = fns.filter((f) => !f.a);
      const lanes: number[] = []; const laneOf = new Map<typeof dated[number], number>();
      for (const f of dated) {
        let li = lanes.findIndex((end) => end <= f.a!.getTime());
        if (li < 0) { li = lanes.length; lanes.push(0); }
        lanes[li] = f.b!.getTime() + 200 * 86_400_000; laneOf.set(f, li);
      }
      const evs = s.person.events.filter((e) => st.f.media || !e.media);
      const money = fns.filter((f) => f.group === 'pieniadze' && f.a && !f.uncertain);
      const p = s.person.node.party;
      h += `<div class="gr"><div class="gr__who">${esc(s.person.node.name)}<span>${s.total} pkt${p ? ` · ${esc(p.name)}${p.former ? ' (dawniej)' : ''}` : ''}</span>${undated.length ? `<div class="gr__undated">bez dat: ${undated.map((f) => esc(f.org)).join(', ')}</div>` : ''}</div>
        <div class="gr__lane" style="height:${Math.max(1, lanes.length) * 20 + 14}px">
          ${st.f.full ? '' : `<div class="gr__win" style="left:${X(W0)}%;width:${X(W1) - X(W0)}%"></div>`}
          ${ticks.map((y) => `<div class="gr__grid" style="left:${pos(y)}%"></div>`).join('')}
          ${s.pairs.filter((o) => !o.short).map((o) => `<div class="gr__ov" style="left:${X(o.a)}%;width:${Math.max(0.4, X(o.b) - X(o.a))}%" title="Dwie role naraz: ${esc(o.x.org)} + ${esc(o.y.org)} (${o.type}), ${dur(o.a, o.b)}"></div>`).join('')}
          ${dated.map((f) => `<div class="gr__bar g-${f.group}${f.media ? ' is-media' : ''}${f.observed ? ' is-seen' : ''}${f.uncertain ? ' is-unc' : ''}${yearF(f.a!) < G0 ? ' is-clip' : ''}" style="top:${laneOf.get(f)! * 20}px;left:${X(f.a!)}%;width:${Math.max(0.5, X(f.b!) - X(f.a!))}%" title="${esc(f.org)}: ${esc(f.label)} (${f.observed ? `stan na ${f.a!.getUTCFullYear()}` : `${fmtDay(f.a!)}–${f.open ? 'nadal' : fmtDay(f.b!)}`})">${yearF(f.a!) < G0 ? `← ${f.a!.getUTCFullYear()} ` : ''}${esc(f.org)}</div>`).join('')}
          ${evs.map((e) => { const hit = money.some((f) => e.d >= f.a! && e.d <= f.b!); return `<div class="gr__ev${hit ? ' is-hit' : ''}" style="left:${X(e.d)}%;top:${lanes.length * 20 + 1}px" title="${esc(e.label)} (${fmtDay(e.d)})${hit ? ' — w czasie pracy w podmiocie' : ''}"></div>`; }).join('')}
        </div></div>`;
    }
    $('[data-el="gantt"]').innerHTML = h;
  }

  function renderPairs(list: Score[]) {
    const all = list.flatMap((s) => s.pairs.map((o) => ({ ...o, name: s.person.node.name }))).sort((a, b) => (b.b.getTime() - b.a.getTime()) - (a.b.getTime() - a.a.getTime()));
    const n = all.filter((o) => !o.short).length;
    $('[data-el="pcount"]').textContent = `${n} par${all.length > n ? ` + ${all.length - n} okresów przekazania` : ''}`;
    const cut = (t: string) => (t.length > 120 ? `${t.slice(0, 118)}…` : t);
    $('[data-el="pairs"]').innerHTML = `<thead><tr><th scope="col">Osoba</th><th scope="col">Typ</th><th scope="col">Urząd albo organizacja</th><th scope="col">Druga funkcja</th><th scope="col">Naraz</th></tr></thead><tbody>${all.map((o) => `
      <tr><td>${esc(o.name)}</td><td><span class="kind">${o.type}</span>${o.short ? '<span class="small">okres przekazania</span>' : ''}</td>
      <td>${esc(o.x.org)}<span class="small">${esc(cut(o.x.label))}</span></td>
      <td>${esc(o.y.org)}${o.y.media ? '<span class="styk__tag styk__tag--media">media</span>' : ''}${o.y.observed ? '<span class="styk__tag">stan na rok</span>' : ''}<span class="small">${esc(cut(o.y.label))}</span></td>
      <td><span class="dur">${dur(o.a, o.b)}</span><span class="small">${fmtDay(o.a)} – ${o.open ? 'nadal' : fmtDay(o.b)}</span></td></tr>`).join('')}</tbody>`;
  }

  function render() {
    drawHist();
    $('[data-el="range"]').textContent = st.f.full ? 'Cały okres' : `${st.f.y0}–${st.f.y1 - 1}`;
    const list = ranking(m, st.f);
    $('[data-el="count"]').textContent = `${list.length} ${plural(list.length, ['osoba', 'osoby', 'osób'])} z punktami${st.f.cases.length ? ` · ${st.f.cases.map((c) => CASES.find((x) => x.id === c)?.label).join(', ')}` : ''}`;
    if (st.view === 'list') renderList(list); else renderMap(list);
    renderGantt(list);
    renderPairs(list);
  }
  render();
}

export function defineStyk(data: GraphData) {
  if (customElements.get('zl-styk')) return;
  customElements.define('zl-styk', class extends HTMLElement {
    connectedCallback() { init(this, data); }
  });
}
