/**
 * Adapter warstwy na żywo „Kolejki na SOR” (kontrakt: lib/mapa/live): migawka sor/teraz.json →
 * kolor i wielkość punktów, dymki z kolejką, liczby do panelu i lista najdłuższych kolejek.
 * Działa w przeglądarce — bez listy SOR i geometrii (numery i stałe dymki przychodzą z buildu).
 */
import { formatPL, plural, typo } from '@/lib/format';
import type { LiveAdapter, LiveResult } from '@/lib/mapa/live';
import type { Tip, TipRow } from '@/lib/mapa/types';
import { measure, normText, STAGES, type Entry } from './measure';
import { hm, isSnapshot, isStale, STALE_MIN, stampText, summarize, usable } from './summary';

const TOP = 6;
const SOURCE_PAGE = 'https://pacjent.gov.pl/szpitalny-oddzial-ratunkowy-sor';

const people = (n: number) => plural(n, ['osoba', 'osoby', 'osób']);

function queueTip(base: Tip, entry: Entry, m: ReturnType<typeof measure>, note: string): Tip {
  const e = entry.e!;
  const rows: TipRow[] = STAGES.map((s, i) => ({
    cells: [s.label, e[i][0] == null ? '–' : formatPL(e[i][0]!), !e[i][1] || e[i][1] === '-' ? '–' : e[i][1]!],
    ...(s.color && { sub: `${s.color} · ${normText(s.norm!)}` }),
    ...(m.over[i] && { alert: [2] }),
    ...(i === 2 && { gap: true }),
  }));
  (entry.inne ?? []).forEach(([name, count, wait], k) =>
    rows.push({ cells: [name, count == null ? '–' : formatPL(count), !wait || wait === '-' ? '–' : wait], sub: 'etap spoza standardowej listy', ...(k === 0 && { gap: true }) }),
  );
  const total = entry.w ?? null;
  return {
    title: base.title,
    meta: base.meta,
    stats: [
      ...(total == null ? [] : [[formatPL(total), `${people(total)} w SOR`] as [string, string]]),
      [formatPL(m.before), 'przed kontaktem z lekarzem'],
    ],
    cols: ['Etap', 'Osób', 'Czas'],
    rows,
    foot: `Stan z ${hm(entry.t)}${note}`,
    warn: base.warn,
    href: SOURCE_PAGE,
    hrefLabel: 'pacjent.gov.pl',
  };
}

export const adapt: LiveAdapter = (data, { keys, tips }) => {
  if (!isSnapshot(data)) throw new Error('nieznany format migawki SOR');
  const snap = data;
  const sum = summarize(snap);
  const seen = new Set<string>();
  const ranked: { i: number; m: ReturnType<typeof measure> }[] = [];

  const points: LiveResult['points'] = keys.map((key, i) => {
    const base = tips[i];
    const raw = key ? snap.sor[key] : undefined;
    const entry = usable(raw);
    // zdublowany numer (dwa SOR, jedna kolejka) trafia na listę raz
    const first = key != null && !seen.has(key);
    if (key) seen.add(key);
    if (!entry?.e) return { value: null, tip: { ...base, foot: raw?.blad ? `Brak danych z TOPSOR (${raw.blad}).` : 'Brak danych z TOPSOR.' } };
    const m = measure(entry.e);
    const stale = isStale(entry.t, sum.freshest);
    const note = stale ? ` — o ponad ${STALE_MIN} minut starszy od reszty, nie barwi punktu` : entry !== raw ? ' (ostatni udany pomiar)' : '';
    const tip = queueTip(base, entry, m, note);
    if (stale) return { value: null, tip };
    if (m.cls == null) return { value: null, tip: { ...tip, foot: `${tip.foot}. Czekają tylko pacjenci czerwoni i pomarańczowi — dla nich portal nie podaje czasu.` } };
    if (first && m.cls >= 2) ranked.push({ i, m });
    return { value: m.cls, size: m.before, tip };
  });

  const top = ranked
    .sort((a, b) => b.m.cls! - a.m.cls! || b.m.worst!.ratio - a.m.worst!.ratio || b.m.worst!.count - a.m.worst!.count || b.m.before - a.m.before)
    .slice(0, TOP)
    .map(({ i, m }) => {
      const w = m.worst!, s = STAGES[w.stage];
      return { i, title: tips[i].title, meta: tips[i].meta?.split(' · ')[0] ?? '', value: w.wait, detail: typo(`${formatPL(w.count)} ${people(w.count)} · ${s.label.toLowerCase()}, norma ${normText(s.norm!)}`) };
    });

  return {
    points,
    counts: sum.counts,
    // szare = numery bez świeżego pomiaru porównywalnego z normą
    missing: new Set(keys.filter(Boolean)).size - sum.counts.reduce((a, b) => a + b, 0),
    summary: sum.measured
      ? { value: formatPL(sum.before), text: typo(`${plural(sum.before, ['osoba czekała', 'osoby czekały', 'osób czekało'])} na lekarza w ${sum.measured} SOR-ach; wszystkich pacjentów w SOR-ach: ${formatPL(sum.total)}`) }
      : { value: '–', text: 'Brak świeżych danych z systemu TOPSOR' },
    stamp: stampText(sum.freshest),
    top,
  };
};
