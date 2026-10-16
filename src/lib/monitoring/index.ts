/**
 * Dane monitoringu „Ile zarabiają lekarze?” (Watchdog Polska).
 *
 * Plik src/data/monitoring-watchdog.json generuje skrypt spoza serwisu. Ten moduł to jego
 * kontrakt: schemat sprawdzany przy każdym buildzie (zła dana = czytelny błąd zamiast cichej
 * pomyłki na stronie) i jedyne miejsce, z którego strony czytają te dane.
 * Opis pól dla autora skryptu: docs/monitoring-json.md.
 *
 * Kod przeglądarki importuje stąd wyłącznie typy (`import type`), więc zod i JSON nie trafiają do bundla;
 * listy kodów (województwa, odpowiedzi) są w ./codes, który można importować wszędzie.
 */
import { z } from 'astro/zod';
import raw from '@/data/monitoring-watchdog.json?raw';
import { NETWORK_LEVELS, RESPONSES, VOIVODESHIPS } from './codes';

export { NETWORK_LEVELS, RESPONSES, VOIVODESHIPS };

const count = z.int().nonnegative();
const amount = z.number().nonnegative();

const payrollSchema = z
  .object({
    doctors: z.int().positive(),
    total: amount,
    median: amount,
    p25: amount,
    p75: amount,
    max: amount,
    over500k: count,
    over1m: count,
    /** udział 10 najlepiej opłacanych w funduszu płac, ułamek 0–1 */
    top10Share: z.number().min(0).max(1),
    /** liczebności koszyków; długość = buckets.length + 1 */
    histogram: z.array(count),
  })
  .refine((p) => p.p25 <= p.median && p.median <= p.p75 && p.p75 <= p.max, 'wymagane p25 ≤ median ≤ p75 ≤ max')
  .refine((p) => p.over1m <= p.over500k && p.over500k <= p.doctors, 'wymagane over1m ≤ over500k ≤ doctors')
  .refine((p) => p.histogram.reduce((a, b) => a + b, 0) === p.doctors, 'suma histogramu musi być równa doctors');

const facilitySchema = z.object({
  /** numer sprawy w fedrowaniu — stały klucz wiersza */
  id: z.int().positive(),
  /** nazwa rejestrowa, jak we wniosku */
  name: z.string().min(1),
  /** opcjonalna nazwa do wyświetlania; bez niej strona porządkuje nazwę rejestrową sama */
  displayName: z.string().min(1).optional(),
  city: z.string().min(1),
  voivodeship: z.enum(VOIVODESHIPS),
  population: z.int().positive().nullable(),
  /** czy ludność dotyczy miasta, czy całej gminy (gminy wiejskie) */
  populationScope: z.enum(['city', 'commune']),
  network: z.enum(NETWORK_LEVELS).nullable(),
  response: z.enum(RESPONSES),
  url: z.url(),
  /** null = brak pełnej rocznej listy płac (odmowa, cisza albo dane nieporównywalne) */
  payroll: payrollSchema.nullable(),
});

export const monitoringSchema = z
  .object({
    version: z.literal(1),
    updated: z.iso.date(),
    year: z.int(),
    source: z.object({ name: z.string(), monitoring: z.string(), url: z.url() }),
    population: z.object({ source: z.string(), asOf: z.iso.date() }),
    /** granice koszyków histogramu w zł, rosnąco: n granic → n + 1 koszyków */
    buckets: z.array(z.number().positive()).min(1),
    facilities: z.array(facilitySchema).min(1),
  })
  .superRefine((doc, ctx) => {
    if (doc.buckets.some((b, i) => i > 0 && b <= doc.buckets[i - 1])) {
      ctx.addIssue({ code: 'custom', path: ['buckets'], message: 'granice koszyków muszą rosnąć' });
    }
    const seen = new Set<number>();
    doc.facilities.forEach((f, i) => {
      if (seen.has(f.id)) ctx.addIssue({ code: 'custom', path: ['facilities', i, 'id'], message: `powtórzone id ${f.id}` });
      seen.add(f.id);
      if (f.payroll && f.payroll.histogram.length !== doc.buckets.length + 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['facilities', i, 'payroll', 'histogram'],
          message: `histogram musi mieć ${doc.buckets.length + 1} koszyków (buckets.length + 1)`,
        });
      }
    });
  });

export type MonitoringDoc = z.infer<typeof monitoringSchema>;
export type Facility = MonitoringDoc['facilities'][number];
export type Payroll = NonNullable<Facility['payroll']>;
export type Voivodeship = (typeof VOIVODESHIPS)[number];
export type Response = (typeof RESPONSES)[number];
export type NetworkLevel = (typeof NETWORK_LEVELS)[number];

function load(): MonitoringDoc {
  const result = monitoringSchema.safeParse(JSON.parse(raw));
  if (!result.success) {
    throw new Error(
      `src/data/monitoring-watchdog.json nie spełnia kontraktu (docs/monitoring-json.md):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** Zwalidowane dane monitoringu (parsowane raz na build). */
export const monitoring = load();
