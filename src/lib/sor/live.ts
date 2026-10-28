/**
 * Adapter warstwy na żywo „Kolejki na SOR” (kontrakt: lib/mapa/live): migawka sor/teraz.json →
 * kolor i wielkość punktów, dymki z kolejką, liczby do panelu i lista najdłuższych kolejek.
 * Działa w przeglądarce — bez listy SOR i geometrii (numery i stałe dymki przychodzą z buildu).
 * Napisy: polskie z lib/sor/text, inne języki z buildu (PointLayer.live.text → LiveInput.text).
 */
import { typo } from '@/lib/format';
import type { LiveAdapter, LiveResult } from '@/lib/mapa/live';
import type { Tip, TipRow } from '@/lib/mapa/types';
import { measure, normText, STAGES, type Entry } from './measure';
import { hm, isSnapshot, isStale, STALE_MIN, stampText, summarize, usable } from './summary';
import { fill, formOf, numOf, SOR_TEXT_PL, waitText, type SorText } from './text';
import { hoursText, warsawHour } from './usual';

const TOP = 6;
const SOURCE_PAGE = 'https://pacjent.gov.pl/szpitalny-oddzial-ratunkowy-sor';
/** „więcej / mniej niż zwykle”: teraz o co najmniej ćwierć powyżej albo poniżej zwykłej średniej */
const USUAL_MARGIN = 0.25;


/** Profil doby z buildu (lib/sor/map) + bieżąca godzina, stan teraz i porównanie; trzecia liczba w dymku. */
function withUsual(base: Tip, at: string, now: number, t: SorText): Pick<Tip, 'profile'> & { stat?: [string, string] } {
  if (!base.profile) return {};
  const hour = warsawHour(at);
  const usual = base.profile.values[hour];
  if (usual == null) return { profile: { ...base.profile, mark: hour, now } };
  const note = now > usual * (1 + USUAL_MARGIN) ? t.usualMore : now < usual * (1 - USUAL_MARGIN) ? t.usualLess : t.usualSame;
  return {
    profile: { ...base.profile, mark: hour, now, note },
    stat: [numOf(Math.round(usual), t.locale), fill(t.usualAt, { hours: hoursText(hour, 1) })],
  };
}

function queueTip(base: Tip, entry: Entry, m: ReturnType<typeof measure>, note: string, t: SorText): Tip {
  const e = entry.e!;
  const num = (n: number) => numOf(n, t.locale);
  const rows: TipRow[] = STAGES.map((s, i) => ({
    cells: [t.stages[i].label, e[i][0] == null ? '–' : num(e[i][0]!), !e[i][1] || e[i][1] === '-' ? '–' : waitText(e[i][1]!, t)],
    ...(s.color && { sub: `${t.stages[i].color} · ${normText(s.norm!, t)}` }),
    ...(m.over[i] && { alert: [2] }),
    ...(i === 2 && { gap: true }),
  }));
  (entry.inne ?? []).forEach(([name, count, wait], k) =>
    rows.push({ cells: [name, count == null ? '–' : num(count), !wait || wait === '-' ? '–' : waitText(wait, t)], sub: t.otherStage, ...(k === 0 && { gap: true }) }),
  );
  const total = entry.w ?? null;
  const usual = withUsual(base, entry.t, m.before, t);
  return {
    title: base.title,
    meta: base.meta,
    stats: [
      ...(total == null ? [] : [[num(total), fill(t.inSor, { people: formOf(total, t.people, t.locale) })] as [string, string]]),
      [num(m.before), t.beforeDoctor],
      ...(usual.stat ? [usual.stat] : []),
    ],
    ...(usual.profile && { profile: usual.profile }),
    cols: t.cols,
    rows,
    foot: fill(t.asOf, { time: hm(entry.t, t.locale) }) + note,
    warn: base.warn,
    href: SOURCE_PAGE,
    hrefLabel: 'pacjent.gov.pl',
  };
}

export const adapt: LiveAdapter = (data, { keys, tips, text }) => {
  if (!isSnapshot(data)) throw new Error('nieznany format migawki SOR');
  const t = (text as SorText | undefined) ?? SOR_TEXT_PL;
  const num = (n: number) => numOf(n, t.locale);
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
    if (!entry?.e) return { value: null, tip: { ...base, foot: raw?.blad ? fill(t.noDataError, { error: raw.blad }) : t.noData } };
    const m = measure(entry.e);
    const stale = isStale(entry.t, sum.freshest);
    const note = stale ? fill(t.staleNote, { min: STALE_MIN }) : entry !== raw ? t.previousNote : '';
    const tip = queueTip(base, entry, m, note, t);
    if (stale) return { value: null, tip };
    if (m.cls == null) return { value: null, tip: { ...tip, foot: fill(t.onlyUrgent, { foot: tip.foot! }) } };
    if (first && m.cls >= 2) ranked.push({ i, m });
    return { value: m.cls, size: m.before, tip };
  });

  const top = ranked
    .sort((a, b) => b.m.cls! - a.m.cls! || b.m.worst!.ratio - a.m.worst!.ratio || b.m.worst!.count - a.m.worst!.count || b.m.before - a.m.before)
    .slice(0, TOP)
    .map(({ i, m }) => {
      const w = m.worst!, s = STAGES[w.stage];
      const detail = fill(t.topDetail, { count: num(w.count), people: formOf(w.count, t.people, t.locale), stage: t.stages[w.stage].label.toLowerCase(), norm: normText(s.norm!, t) });
      return { i, title: tips[i].title, meta: tips[i].meta?.split(' · ')[0] ?? '', value: waitText(w.wait, t), detail: typo(detail) };
    });

  return {
    points,
    counts: sum.counts,
    // szare = numery bez świeżego pomiaru porównywalnego z normą
    missing: new Set(keys.filter(Boolean)).size - sum.counts.reduce((a, b) => a + b, 0),
    summary: sum.measured
      ? { value: num(sum.before), text: typo(fill(t.summary, { waited: formOf(sum.before, t.waited, t.locale), measured: sum.measured, total: num(sum.total) })) }
      : { value: '–', text: t.noFresh },
    stamp: stampText(sum.freshest, t),
    top,
  };
};
